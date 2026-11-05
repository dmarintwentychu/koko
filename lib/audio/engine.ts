import { PITCH } from "./config";
import { detectPitch } from "./pitch";

export type Frame = {
  /** Nivel RMS instantáneo en dBFS (sin suavizar). */
  db: number;
  /** Tono detectado en esta trama, o null. */
  hz: number | null;
  /** Milisegundos desde la trama anterior. */
  dtMs: number;
};

export class MicStartError extends Error {
  constructor(readonly kind: "denied" | "error") {
    super(kind);
  }
}

const FFT_SIZE = 2048;
/** Por debajo de este nivel no se intenta detectar tono (ahorra CPU). */
const PITCH_MIN_DB = -60;
const MAX_DT_MS = 100;

/**
 * Abre el micrófono y llama a `onFrame` en cada fotograma.
 * Devuelve la función que lo detiene y libera el micrófono.
 * Debe llamarse desde un gesto del usuario (requisito de iOS).
 */
export async function startMic(
  onFrame: (frame: Frame) => void,
): Promise<() => void> {
  if (!navigator.mediaDevices?.getUserMedia) throw new MicStartError("error");

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // Sin procesado: queremos medir la voz real, no una señal "arreglada".
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    throw new MicStartError(
      name === "NotAllowedError" || name === "SecurityError"
        ? "denied"
        : "error",
    );
  }

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContext();
    await ctx.resume();
  } catch {
    stream.getTracks().forEach((t) => t.stop());
    if (ctx) void ctx.close();
    throw new MicStartError("error");
  }

  const audio = ctx;
  const analyser = audio.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  audio.createMediaStreamSource(stream).connect(analyser);

  const buf = new Float32Array(analyser.fftSize);
  let frameId = 0;
  let stopped = false;
  let last = performance.now();

  const tick = (now: number) => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const db = rms > 0 ? 20 * Math.log10(rms) : -100;

    const p =
      db > PITCH_MIN_DB
        ? detectPitch(
            buf,
            audio.sampleRate,
            PITCH.minHz,
            PITCH.maxHz,
            PITCH.minClarity,
          )
        : null;

    const dtMs = Math.min(MAX_DT_MS, now - last);
    last = now;
    onFrame({ db, hz: p ? p.hz : null, dtMs });
    if (!stopped) frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);

  return () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frameId);
    stream.getTracks().forEach((t) => t.stop());
    void audio.close();
  };
}
