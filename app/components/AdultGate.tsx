"use client";

import { useState } from "react";
import styles from "./Screens.module.css";

type Props = { onPass: () => void; onCancel: () => void };

/** Pregunta sencilla para que los niños no entren por accidente a los ajustes. */
export function AdultGate({ onPass, onCancel }: Props) {
  const [[a, b]] = useState<[number, number]>(() => [
    6 + Math.floor(Math.random() * 4),
    4 + Math.floor(Math.random() * 5),
  ]);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState(false);

  return (
    <main className={styles.screen}>
      <form
        className={styles.card}
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(answer) === a + b) {
            onPass();
          } else {
            setWrong(true);
            setAnswer("");
          }
        }}
      >
        <h1 className={styles.h2}>Solo para adultos</h1>
        <label className={styles.label}>
          ¿Cuánto es {a} + {b}?
          <input
            className={styles.input}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setWrong(false);
            }}
            autoFocus
          />
        </label>
        {wrong && (
          <p className={styles.bad} role="alert">
            Respuesta incorrecta.
          </p>
        )}
        <div className={styles.actions}>
          <button type="submit" className={styles.primary} disabled={!answer}>
            Entrar
          </button>
          <button type="button" className={styles.secondary} onClick={onCancel}>
            Volver
          </button>
        </div>
      </form>
    </main>
  );
}
