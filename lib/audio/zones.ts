import { VOLUME, type Thresholds } from "./config";

export type VolumeZone = "silent" | "low" | "ok" | "loud";
export type PitchZone = "none" | "low" | "ok" | "high";

const VOLUME_ORDER: VolumeZone[] = ["silent", "low", "ok", "loud"];

/** Clasifica el nivel en dB con histéresis respecto a la zona anterior. */
export function classifyVolume(
  db: number,
  prev: VolumeZone,
  t: Thresholds,
): VolumeZone {
  const bounds = [t.silentBelowDb, t.lowBelowDb, t.loudAboveDb];
  const h = VOLUME.hysteresisDb;
  let idx = VOLUME_ORDER.indexOf(prev);
  while (idx < 3 && db >= bounds[idx] + h) idx++;
  while (idx > 0 && db < bounds[idx - 1] - h) idx--;
  return VOLUME_ORDER[idx];
}

export function classifyPitch(hz: number | null, t: Thresholds): PitchZone {
  if (hz === null) return "none";
  if (hz < t.lowBelowHz) return "low";
  if (hz > t.highAboveHz) return "high";
  return "ok";
}

export function dbToMeter(db: number): number {
  const t = (db - VOLUME.meterMinDb) / (VOLUME.meterMaxDb - VOLUME.meterMinDb);
  return Math.min(1, Math.max(0, t));
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}
