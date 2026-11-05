export type PitchResult = { hz: number; clarity: number };

/**
 * Detecta la frecuencia fundamental mediante autocorrelación normalizada.
 * Devuelve null si no hay un tono claro (silencio, ruido, consonantes sordas).
 */
export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
  minHz: number,
  maxHz: number,
  minClarity: number,
): PitchResult | null {
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const maxLag = Math.ceil(sampleRate / minHz);
  const n = buf.length - maxLag - 1;
  if (n < maxLag) return null;

  let e0 = 0;
  for (let i = 0; i < n; i++) e0 += buf[i] * buf[i];
  if (e0 === 0) return null;

  // Energía de la ventana desplazada, actualizada de forma incremental.
  let eLag = 0;
  for (let i = 0; i < n; i++) eLag += buf[i + minLag] * buf[i + minLag];

  const corr = new Float32Array(maxLag + 2);
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let dot = 0;
    for (let i = 0; i < n; i++) dot += buf[i] * buf[i + lag];
    const denom = Math.sqrt(e0 * eLag);
    const c = denom > 0 ? dot / denom : 0;
    corr[lag] = c;
    if (c > best) best = c;
    eLag += buf[n + lag] * buf[n + lag] - buf[lag] * buf[lag];
  }
  if (best < minClarity) return null;

  // Primer máximo local cercano al máximo global (evita errores de octava).
  const threshold = best * 0.9;
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    const c = corr[lag];
    if (c >= threshold && c > corr[lag - 1] && c >= corr[lag + 1]) {
      // Interpolación parabólica para afinar el pico.
      const a = corr[lag - 1];
      const b = c;
      const d = corr[lag + 1];
      const denom = a - 2 * b + d;
      const shift = denom !== 0 ? (0.5 * (a - d)) / denom : 0;
      return { hz: sampleRate / (lag + shift), clarity: c };
    }
  }
  return null;
}
