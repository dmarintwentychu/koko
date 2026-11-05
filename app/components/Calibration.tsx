"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CALIBRATION, type Thresholds } from "@/lib/audio/config";
import { computeCalibration, type CalibrationResult } from "@/lib/audio/calibration";
import { MicStartError, startMic, type Frame } from "@/lib/audio/engine";
import styles from "./Screens.module.css";

type Phase =
  | "intro"
  | "starting"
  | "silence"
  | "speech"
  | "result"
  | "denied"
  | "error";

type Props = {
  childName: string;
  onSave: (thresholds: Thresholds) => void;
  onCancel: () => void;
};

const REASONS: Record<"no_voice" | "too_noisy", string> = {
  no_voice:
    "No se oyó suficiente voz. Acerca el móvil al niño (unos 30 cm) y vuelve a intentarlo.",
  too_noisy:
    "Hay demasiado ruido de fondo comparado con la voz. Busca un sitio más tranquilo y vuelve a intentarlo.",
};

export function Calibration({ childName, onSave, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CalibrationResult | null>(null);

  const stopRef = useRef<(() => void) | null>(null);
  const aliveRef = useRef(true);

  const halt = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      halt();
    };
  }, [halt]);

  const begin = useCallback(async () => {
    setPhase("starting");
    setResult(null);
    setProgress(0);

    const silence: Frame[] = [];
    const speech: Frame[] = [];
    let current: "silence" | "speech" | "done" = "silence";
    let elapsed = 0;
    let uiPhase: Phase = "starting";

    try {
      const stop = await startMic((f) => {
        if (current === "done") return;
        const limit =
          current === "silence" ? CALIBRATION.silenceMs : CALIBRATION.speechMs;
        elapsed += f.dtMs;

        if (uiPhase !== current) {
          uiPhase = current;
          setPhase(current);
        }
        if (elapsed >= CALIBRATION.ignoreMs) {
          (current === "silence" ? silence : speech).push(f);
        }
        setProgress(Math.min(1, elapsed / limit));

        if (elapsed >= limit) {
          elapsed = 0;
          if (current === "silence") {
            current = "speech";
          } else {
            current = "done";
            stopRef.current?.();
            stopRef.current = null;
            setResult(computeCalibration(silence, speech));
            setPhase("result");
          }
        }
      });

      if (!aliveRef.current) {
        stop();
        return;
      }
      stopRef.current = stop;
    } catch (err) {
      setPhase(
        err instanceof MicStartError && err.kind === "denied"
          ? "denied"
          : "error",
      );
    }
  }, []);

  const cancel = () => {
    halt();
    onCancel();
  };

  const listening = phase === "silence" || phase === "speech";

  return (
    <section className={styles.card} aria-label="Calibrar micrófono">
      <h2 className={styles.h2}>Calibrar micrófono</h2>

      {phase === "intro" && (
        <>
          <p>
            Vamos a medir el ruido del lugar y la voz normal de{" "}
            <strong>{childName}</strong> con este móvil. Dura unos 10 segundos.
          </p>
          <ol className={styles.steps}>
            <li>Deja el móvil donde lo usará, a unos 30 cm de su boca.</li>
            <li>Primero, silencio total durante 3 segundos.</li>
            <li>
              Después, que hable como siempre durante 6 segundos (por ejemplo,
              contar hasta diez o contar qué ha desayunado).
            </li>
          </ol>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={begin}>
              Empezar
            </button>
            <button type="button" className={styles.secondary} onClick={cancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {phase === "starting" && <p>Abriendo el micrófono…</p>}

      {listening && (
        <>
          <p className={styles.bigText} aria-live="polite">
            {phase === "silence"
              ? "Silencio, por favor…"
              : `${childName}, ¡habla normal!`}
          </p>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className={styles.progressFill}
              data-phase={phase}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={cancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      {phase === "result" && result && (
        <>
          {result.ok ? (
            <>
              <p className={styles.good}>Calibración lista.</p>
              <ul className={styles.facts}>
                <li>Ruido de fondo: {Math.round(result.noiseFloorDb)} dB</li>
                <li>Voz normal: {Math.round(result.speechDb)} dB</li>
                <li>
                  Tono medio:{" "}
                  {result.speechHz !== null
                    ? `${Math.round(result.speechHz)} Hz`
                    : "no detectado (se usan valores por defecto)"}
                </li>
              </ul>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={() => onSave(result.thresholds)}
                >
                  Guardar
                </button>
                <button type="button" className={styles.secondary} onClick={begin}>
                  Repetir
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.bad} role="alert">
                {REASONS[result.reason]}
              </p>
              <div className={styles.actions}>
                <button type="button" className={styles.primary} onClick={begin}>
                  Reintentar
                </button>
                <button type="button" className={styles.secondary} onClick={cancel}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </>
      )}

      {(phase === "denied" || phase === "error") && (
        <>
          <p className={styles.bad} role="alert">
            {phase === "denied"
              ? "El micrófono está bloqueado. Permítelo en los ajustes del navegador y vuelve a probar."
              : "No se pudo usar el micrófono en este dispositivo."}
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={cancel}>
              Volver
            </button>
          </div>
        </>
      )}
    </section>
  );
}
