"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { VOLUME, type Thresholds } from "@/lib/audio/config";
import { MicStartError, startMic } from "@/lib/audio/engine";
import {
  classifyPitch,
  classifyVolume,
  median,
  type PitchZone,
  type VolumeZone,
} from "@/lib/audio/zones";

export type MicStatus = "idle" | "starting" | "listening" | "denied" | "error";

export type VoiceReading = {
  db: number;
  volume: VolumeZone;
  hz: number | null;
  pitch: PitchZone;
};

/** Tiempo (ms) acumulado en cada zona durante una sesión. */
export type SessionSummary = {
  startedAt: number;
  durationMs: number;
  volumeMs: { low: number; ok: number; loud: number };
  pitchMs: { low: number; ok: number; high: number };
};

const SILENT_READING: VoiceReading = {
  db: VOLUME.meterMinDb,
  volume: "silent",
  hz: null,
  pitch: "none",
};

const PITCH_HISTORY = 5;
const UI_INTERVAL_MS = 50;
/** Silencio continuo a partir del cual se considera que terminó la frase. */
const PAUSE_MS = 500;

type Run = { stopMic: () => void; startedAt: number; summary: SessionSummary };

export function useVoiceMeter(
  thresholds: Thresholds,
  onSession: (summary: SessionSummary) => void,
) {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [reading, setReading] = useState<VoiceReading>(SILENT_READING);

  const runRef = useRef<Run | null>(null);
  const startingRef = useRef(false);
  const aliveRef = useRef(true);
  const thresholdsRef = useRef(thresholds);
  const onSessionRef = useRef(onSession);

  useEffect(() => {
    thresholdsRef.current = thresholds;
    onSessionRef.current = onSession;
  });

  /** Detiene el micrófono y entrega el resumen de la sesión. */
  const finish = useCallback(() => {
    const run = runRef.current;
    if (!run) return;
    runRef.current = null;
    run.stopMic();
    onSessionRef.current({
      ...run.summary,
      durationMs: Date.now() - run.startedAt,
    });
  }, []);

  const stop = useCallback(() => {
    finish();
    setReading(SILENT_READING);
    setStatus("idle");
  }, [finish]);

  const start = useCallback(async () => {
    if (runRef.current || startingRef.current) return;
    startingRef.current = true;
    setStatus("starting");

    const summary: SessionSummary = {
      startedAt: Date.now(),
      durationMs: 0,
      volumeMs: { low: 0, ok: 0, loud: 0 },
      pitchMs: { low: 0, ok: 0, high: 0 },
    };
    let smoothedDb: number = VOLUME.meterMinDb;
    let zone: VolumeZone = "silent";
    let sinceUi = 0;
    let silentMs = 0;
    let wasVoiced = false;
    let pending: VoiceReading | null = null;
    const pitchHistory: number[] = [];

    try {
      const stopMic = await startMic((f) => {
        const t = thresholdsRef.current;

        // Mientras nadie habla no se toca nada: la pantalla conserva el último
        // estado y el silencio no cuenta en las estadísticas.
        if (f.db < t.silentBelowDb) {
          // Los huecos entre sílabas son cortos; solo una pausa larga cuenta
          // como "dejó de hablar".
          silentMs += f.dtMs;
          if (silentMs >= PAUSE_MS) wasVoiced = false;
          // Garantiza que lo último que se dijo llega a la pantalla.
          if (pending) {
            setReading(pending);
            pending = null;
          }
          return;
        }

        silentMs = 0;
        // Al empezar a hablar tras una pausa se parte del nivel real, para no
        // arrastrar el valor de la frase anterior.
        if (!wasVoiced) {
          smoothedDb = f.db;
          pitchHistory.length = 0;
          wasVoiced = true;
        } else {
          // Sube rápido, baja despacio: se ve natural y no parpadea.
          smoothedDb += (f.db - smoothedDb) * (f.db > smoothedDb ? 0.5 : 0.15);
        }
        // Con voz, la zona mínima es "low" (el umbral de silencio ya se superó).
        zone = classifyVolume(smoothedDb, zone === "silent" ? "low" : zone, t);

        let hz: number | null = null;
        if (f.hz !== null) {
          pitchHistory.push(f.hz);
          if (pitchHistory.length > PITCH_HISTORY) pitchHistory.shift();
        } else if (pitchHistory.length) {
          pitchHistory.shift();
        }
        if (pitchHistory.length >= 3) hz = median(pitchHistory);

        const pitch = classifyPitch(hz, t);
        if (zone !== "silent") {
          summary.volumeMs[zone] += f.dtMs;
          if (pitch !== "none") summary.pitchMs[pitch] += f.dtMs;
        }

        pending = { db: smoothedDb, volume: zone, hz, pitch };
        sinceUi += f.dtMs;
        if (sinceUi >= UI_INTERVAL_MS) {
          sinceUi = 0;
          setReading(pending);
          pending = null;
        }
      });

      if (!aliveRef.current) {
        stopMic();
        return;
      }
      runRef.current = { stopMic, startedAt: summary.startedAt, summary };
      setStatus("listening");
    } catch (err) {
      setStatus(
        err instanceof MicStartError && err.kind === "denied"
          ? "denied"
          : "error",
      );
    } finally {
      startingRef.current = false;
    }
  }, []);

  // Libera el micrófono al salir de la pantalla.
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      finish();
    };
  }, [finish]);

  // Al ocultar la app (cambio de pestaña / bloqueo) se apaga el micrófono.
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [stop]);

  return { status, reading, start, stop };
}
