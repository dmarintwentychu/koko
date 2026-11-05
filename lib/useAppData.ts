"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_THRESHOLDS, type Thresholds } from "@/lib/audio/config";
import type { SessionSummary } from "@/lib/audio/useVoiceMeter";
import {
  EMPTY_DATA,
  MAX_PROFILES,
  MAX_SESSIONS,
  MIN_SESSION_MS,
  createProfile,
  loadAppData,
  saveAppData,
  type AppData,
} from "@/lib/storage";

let cache: AppData | null = null;
let saveFailed = false;
const listeners = new Set<() => void>();

function getSnapshot(): AppData {
  if (cache === null) cache = loadAppData();
  return cache;
}

function commit(next: AppData) {
  cache = next;
  saveFailed = !saveAppData(next);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Cambios hechos desde otra pestaña / ventana de la misma app.
  const onStorage = () => {
    cache = loadAppData();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};

export function useAppData() {
  const data = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_DATA);
  // false en servidor y en la primera pasada de hidratación.
  const ready = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const addProfile = useCallback((name: string, avatar: number) => {
    const d = getSnapshot();
    if (d.profiles.length >= MAX_PROFILES || !name.trim()) return;
    const p = createProfile(name, avatar);
    commit({ ...d, profiles: [...d.profiles, p], activeProfileId: p.id });
  }, []);

  const selectProfile = useCallback((id: string | null) => {
    const d = getSnapshot();
    if (id !== null && !d.profiles.some((p) => p.id === id)) return;
    commit({ ...d, activeProfileId: id });
  }, []);

  const deleteProfile = useCallback((id: string) => {
    const d = getSnapshot();
    commit({
      ...d,
      profiles: d.profiles.filter((p) => p.id !== id),
      sessions: d.sessions.filter((s) => s.profileId !== id),
      activeProfileId: d.activeProfileId === id ? null : d.activeProfileId,
    });
  }, []);

  const saveCalibration = useCallback((id: string, thresholds: Thresholds) => {
    const d = getSnapshot();
    commit({
      ...d,
      profiles: d.profiles.map((p) =>
        p.id === id ? { ...p, thresholds, calibratedAt: Date.now() } : p,
      ),
    });
  }, []);

  const resetCalibration = useCallback((id: string) => {
    const d = getSnapshot();
    commit({
      ...d,
      profiles: d.profiles.map((p) =>
        p.id === id
          ? { ...p, thresholds: DEFAULT_THRESHOLDS, calibratedAt: null }
          : p,
      ),
    });
  }, []);

  const addSession = useCallback((profileId: string, s: SessionSummary) => {
    if (s.durationMs < MIN_SESSION_MS) return;
    const d = getSnapshot();
    if (!d.profiles.some((p) => p.id === profileId)) return;
    commit({
      ...d,
      sessions: [...d.sessions, { ...s, profileId }].slice(-MAX_SESSIONS),
    });
  }, []);

  const clearSessions = useCallback((profileId: string) => {
    const d = getSnapshot();
    commit({
      ...d,
      sessions: d.sessions.filter((s) => s.profileId !== profileId),
    });
  }, []);

  return {
    ready,
    data,
    saveFailed,
    addProfile,
    selectProfile,
    deleteProfile,
    saveCalibration,
    resetCalibration,
    addSession,
    clearSessions,
  };
}
