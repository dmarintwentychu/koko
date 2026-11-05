import { DEFAULT_THRESHOLDS, type Thresholds } from "@/lib/audio/config";
import type { SessionSummary } from "@/lib/audio/useVoiceMeter";

export type Profile = {
  id: string;
  name: string;
  /** Índice de AVATARS. */
  avatar: number;
  thresholds: Thresholds;
  /** Fecha de la última calibración (ms), o null si usa valores por defecto. */
  calibratedAt: number | null;
};

export type StoredSession = SessionSummary & { profileId: string };

export type AppData = {
  version: 1;
  profiles: Profile[];
  activeProfileId: string | null;
  sessions: StoredSession[];
};

export const AVATARS = ["🐶", "🐱", "🐸", "🦊", "🐼", "🦁", "🐰", "🐙"] as const;
export const MAX_PROFILES = 8;
export const MAX_NAME_LENGTH = 20;
/** Se conserva como máximo este histórico para no crecer sin límite. */
export const MAX_SESSIONS = 1000;
/** Las sesiones más cortas no aportan datos y se descartan. */
export const MIN_SESSION_MS = 5000;

const STORAGE_KEY = "koko:v1";

export const EMPTY_DATA: AppData = {
  version: 1,
  profiles: [],
  activeProfileId: null,
  sessions: [],
};

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

function parseThresholds(v: unknown): Thresholds | null {
  if (!isObj(v)) return null;
  const { silentBelowDb, lowBelowDb, loudAboveDb, lowBelowHz, highAboveHz } = v;
  if (
    !isNum(silentBelowDb) ||
    !isNum(lowBelowDb) ||
    !isNum(loudAboveDb) ||
    !isNum(lowBelowHz) ||
    !isNum(highAboveHz)
  ) {
    return null;
  }
  if (!(silentBelowDb < lowBelowDb && lowBelowDb < loudAboveDb)) return null;
  if (!(lowBelowHz > 0 && lowBelowHz < highAboveHz)) return null;
  return { silentBelowDb, lowBelowDb, loudAboveDb, lowBelowHz, highAboveHz };
}

function parseProfile(v: unknown): Profile | null {
  if (!isObj(v)) return null;
  const { id, name, avatar, thresholds, calibratedAt } = v;
  const t = parseThresholds(thresholds);
  if (typeof id !== "string" || typeof name !== "string" || !t) return null;
  return {
    id,
    name: name.slice(0, MAX_NAME_LENGTH),
    avatar:
      isNum(avatar) && Number.isInteger(avatar) && avatar >= 0 && avatar < AVATARS.length
        ? avatar
        : 0,
    thresholds: t,
    calibratedAt: isNum(calibratedAt) ? calibratedAt : null,
  };
}

function parseSession(v: unknown, profileIds: Set<string>): StoredSession | null {
  if (!isObj(v)) return null;
  const { profileId, startedAt, durationMs, volumeMs, pitchMs } = v;
  if (typeof profileId !== "string" || !profileIds.has(profileId)) return null;
  if (!isNum(startedAt) || !isNum(durationMs) || durationMs < 0) return null;
  if (!isObj(volumeMs) || !isObj(pitchMs)) return null;
  const { low, ok, loud } = volumeMs;
  const { low: pl, ok: pok, high } = pitchMs;
  if (![low, ok, loud, pl, pok, high].every(isNum)) return null;
  return {
    profileId,
    startedAt,
    durationMs,
    volumeMs: { low: low as number, ok: ok as number, loud: loud as number },
    pitchMs: { low: pl as number, ok: pok as number, high: high as number },
  };
}

/** Valida datos leídos del almacenamiento; descarta lo que no sea válido. */
export function parseAppData(raw: unknown): AppData {
  if (!isObj(raw) || raw.version !== 1 || !Array.isArray(raw.profiles)) {
    return EMPTY_DATA;
  }
  const profiles = raw.profiles
    .map(parseProfile)
    .filter((p): p is Profile => p !== null)
    .slice(0, MAX_PROFILES);
  const ids = new Set(profiles.map((p) => p.id));
  const sessions = (Array.isArray(raw.sessions) ? raw.sessions : [])
    .map((s) => parseSession(s, ids))
    .filter((s): s is StoredSession => s !== null)
    .slice(-MAX_SESSIONS);
  const active =
    typeof raw.activeProfileId === "string" && ids.has(raw.activeProfileId)
      ? raw.activeProfileId
      : null;
  return { version: 1, profiles, activeProfileId: active, sessions };
}

export function loadAppData(): AppData {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? parseAppData(JSON.parse(text)) : EMPTY_DATA;
  } catch {
    return EMPTY_DATA;
  }
}

/** Devuelve false si no se pudo guardar (almacenamiento lleno o bloqueado). */
export function saveAppData(data: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function createProfile(name: string, avatar: number): Profile {
  return {
    id: crypto.randomUUID(),
    name: name.trim().slice(0, MAX_NAME_LENGTH),
    avatar,
    thresholds: DEFAULT_THRESHOLDS,
    calibratedAt: null,
  };
}
