/**
 * Valores por defecto. Cada perfil puede sustituir los umbrales mediante calibración.
 *
 * Volumen: dBFS (0 dB = máximo digital; voz típica: -50 a -10).
 * Tono: frecuencia fundamental en Hz.
 */
export type Thresholds = {
  /** Por debajo de este nivel se considera silencio. */
  silentBelowDb: number;
  /** Entre silencio y este nivel: voz demasiado baja. */
  lowBelowDb: number;
  /** Por encima de este nivel: voz demasiado alta. */
  loudAboveDb: number;
  /** Por debajo: tono grave. */
  lowBelowHz: number;
  /** Por encima: tono agudo. */
  highAboveHz: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  silentBelowDb: -58,
  lowBelowDb: -42,
  loudAboveDb: -24,
  lowBelowHz: 180,
  highAboveHz: 400,
};

export const VOLUME = {
  /** Margen para evitar parpadeos en los límites. */
  hysteresisDb: 2,
  /** Rango que se mapea a la barra visual (0..1). */
  meterMinDb: -65,
  meterMaxDb: -10,
} as const;

export const PITCH = {
  minHz: 80,
  maxHz: 600,
  /** Correlación mínima (0..1) para aceptar que hay una voz con tono claro. */
  minClarity: 0.6,
} as const;

export const CALIBRATION = {
  silenceMs: 3000,
  speechMs: 6000,
  /** Se descarta el inicio de cada fase (ruido del toque en la pantalla). */
  ignoreMs: 400,
  /** Una trama cuenta como voz si supera el ruido de fondo en estos dB. */
  voiceMarginDb: 6,
  /** Diferencia mínima voz - ruido para que la calibración sea fiable. */
  minSnrDb: 12,
  /** Margen alrededor de la voz normal: "bajo" y "alto" empiezan a ±bandDb. */
  bandDb: 8,
  minVoicedMs: 1000,
  /** El tono normal abarca [hz / ratio, hz * ratio]. */
  pitchRatio: 1.3,
  minPitchFrames: 20,
} as const;
