import { CALIBRATION, DEFAULT_THRESHOLDS, type Thresholds } from "./config";
import type { Frame } from "./engine";
import { median, percentile } from "./zones";

export type CalibrationResult =
  | {
      ok: true;
      thresholds: Thresholds;
      noiseFloorDb: number;
      speechDb: number;
      /** Mediana del tono; null si no se detectó suficiente voz con tono. */
      speechHz: number | null;
    }
  | { ok: false; reason: "no_voice" | "too_noisy" };

/**
 * Calcula los umbrales a partir de dos muestras:
 * - `silence`: tramas con el niño callado (mide el ruido de fondo).
 * - `speech`: tramas con el niño hablando con su voz normal.
 */
export function computeCalibration(
  silence: Frame[],
  speech: Frame[],
): CalibrationResult {
  const C = CALIBRATION;
  if (silence.length === 0) return { ok: false, reason: "no_voice" };

  // Percentil alto: tolera algún ruido puntual sin que suba toda la referencia.
  const noiseFloorDb = percentile(
    silence.map((f) => f.db),
    0.9,
  );

  const voiced = speech.filter((f) => f.db > noiseFloorDb + C.voiceMarginDb);
  const voicedMs = voiced.reduce((sum, f) => sum + f.dtMs, 0);
  if (voicedMs < C.minVoicedMs) return { ok: false, reason: "no_voice" };

  const speechDb = median(voiced.map((f) => f.db));
  if (speechDb - noiseFloorDb < C.minSnrDb) {
    return { ok: false, reason: "too_noisy" };
  }

  const lowBelowDb = speechDb - C.bandDb;
  const loudAboveDb = speechDb + C.bandDb;
  const silentBelowDb = (noiseFloorDb + lowBelowDb) / 2;

  const pitches = voiced.flatMap((f) => (f.hz === null ? [] : [f.hz]));
  const speechHz =
    pitches.length >= C.minPitchFrames ? median(pitches) : null;

  return {
    ok: true,
    noiseFloorDb,
    speechDb,
    speechHz,
    thresholds: {
      silentBelowDb,
      lowBelowDb,
      loudAboveDb,
      lowBelowHz:
        speechHz === null
          ? DEFAULT_THRESHOLDS.lowBelowHz
          : speechHz / C.pitchRatio,
      highAboveHz:
        speechHz === null
          ? DEFAULT_THRESHOLDS.highAboveHz
          : speechHz * C.pitchRatio,
    },
  };
}
