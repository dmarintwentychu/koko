"use client";

import { useState } from "react";
import { Calibration } from "./Calibration";
import type { Thresholds } from "@/lib/audio/config";
import { formatDuration, lastDays, periodStart, summarize } from "@/lib/stats";
import { AVATARS, type Profile, type StoredSession } from "@/lib/storage";
import styles from "./Screens.module.css";

type Props = {
  profile: Profile;
  sessions: StoredSession[];
  saveFailed: boolean;
  onBack: () => void;
  onSaveCalibration: (t: Thresholds) => void;
  onResetCalibration: () => void;
  onClearStats: () => void;
  onDeleteProfile: () => void;
};

const DAY_LETTERS = ["D", "L", "M", "X", "J", "V", "S"];

type Period = "week" | "month";
const PERIODS: Record<Period, { days: number; label: string; long: string }> = {
  week: { days: 7, label: "Semana", long: "7 días" },
  month: { days: 30, label: "Mes", long: "30 días" },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

const pctText = (v: number | null) => (v === null ? "–" : `${v} %`);

export function AdultPanel({
  profile,
  sessions,
  saveFailed,
  onBack,
  onSaveCalibration,
  onResetCalibration,
  onClearStats,
  onDeleteProfile,
}: Props) {
  const [calibrating, setCalibrating] = useState(false);
  const [period, setPeriod] = useState<Period>("week");
  // Fecha de referencia fijada al abrir el panel (evita llamadas impuras en render).
  const [now] = useState(() => Date.now());

  if (calibrating) {
    return (
      <main className={styles.screen}>
        <Calibration
          childName={profile.name}
          onCancel={() => setCalibrating(false)}
          onSave={(t) => {
            onSaveCalibration(t);
            setCalibrating(false);
          }}
        />
      </main>
    );
  }

  const { days, long } = PERIODS[period];
  const daily = lastDays(sessions, days, now);
  const start = periodStart(days, now);
  const recent = summarize(sessions.filter((s) => s.startedAt >= start));
  const total = summarize(sessions);
  const isMonth = period === "month";

  return (
    <main className={styles.screen}>
      <header className={styles.panelHeader}>
        <button type="button" className={styles.secondary} onClick={onBack}>
          ← Volver
        </button>
        <h1 className={styles.panelTitle}>
          <span aria-hidden="true">{AVATARS[profile.avatar]}</span> {profile.name}
        </h1>
      </header>

      {saveFailed && (
        <p className={styles.bad} role="alert">
          No se pudieron guardar los datos en este navegador (¿modo privado o
          almacenamiento lleno?). Los cambios se perderán al cerrar.
        </p>
      )}

      <section className={styles.card}>
        <h2 className={styles.h2}>Progreso</h2>
        <div className={styles.segment} role="group" aria-label="Periodo">
          {(Object.keys(PERIODS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              className={styles.segmentBtn}
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
            >
              {PERIODS[p].label}
            </button>
          ))}
        </div>
        {sessions.length === 0 ? (
          <p>Aún no hay sesiones. Se guardan las de más de 5 segundos.</p>
        ) : (
          <>
            <div className={styles.stats}>
              <Stat label={`Sesiones (${long})`} value={String(recent.sessions)} />
              <Stat
                label={`Hablando (${long})`}
                value={formatDuration(recent.speakingMs)}
              />
              <Stat label="Volumen correcto" value={pctText(recent.okVolumePct)} />
              <Stat label="Tono normal" value={pctText(recent.okPitchPct)} />
            </div>
            <div
              className={styles.bars}
              data-dense={isMonth}
              style={{ gridTemplateColumns: `repeat(${days}, 1fr)` }}
              role="img"
              aria-label={`Porcentaje de tiempo con volumen correcto en los últimos ${long}`}
            >
              {daily.map((d, i) => {
                const date = new Date(`${d.day}T12:00:00`);
                // En el mes solo se etiqueta un día de cada cinco (y el último).
                const showLabel = !isMonth || i % 5 === 0 || i === days - 1;
                return (
                  <div key={d.day} className={styles.barCol}>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ height: `${d.okVolumePct ?? 0}%` }}
                      />
                    </div>
                    <span className={styles.barLabel}>
                      {showLabel
                        ? isMonth
                          ? date.getDate()
                          : DAY_LETTERS[date.getDay()]
                        : ""}
                    </span>
                    {!isMonth && (
                      <span className={styles.barValue}>
                        {d.okVolumePct === null ? "–" : d.okVolumePct}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className={styles.hint}>
              Volumen correcto por día (%){isMonth ? ", con el día del mes" : ""}.
              Total histórico:{" "}
              {total.sessions} sesiones, {pctText(total.okVolumePct)} con
              volumen correcto
              {total.low !== null && total.loud !== null
                ? ` (${total.low} % flojo, ${total.loud} % fuerte)`
                : ""}
              .
            </p>
          </>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Micrófono</h2>
        <p>
          {profile.calibratedAt
            ? `Calibrado el ${new Date(profile.calibratedAt).toLocaleDateString("es")}.`
            : "Usa valores por defecto. Calibrarlo con este móvil mejora mucho la precisión."}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => setCalibrating(true)}
          >
            {profile.calibratedAt ? "Calibrar de nuevo" : "Calibrar"}
          </button>
          {profile.calibratedAt && (
            <button
              type="button"
              className={styles.secondary}
              onClick={onResetCalibration}
            >
              Valores por defecto
            </button>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.h2}>Datos</h2>
        <p className={styles.hint}>
          Todo se guarda solo en este dispositivo. No se graba audio.
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.danger}
            disabled={sessions.length === 0}
            onClick={() => {
              if (window.confirm(`¿Borrar las estadísticas de ${profile.name}?`)) {
                onClearStats();
              }
            }}
          >
            Borrar estadísticas
          </button>
          <button
            type="button"
            className={styles.danger}
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar el perfil de ${profile.name} y todas sus estadísticas?`,
                )
              ) {
                onDeleteProfile();
              }
            }}
          >
            Eliminar perfil
          </button>
        </div>
      </section>
    </main>
  );
}
