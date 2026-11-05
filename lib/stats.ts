import type { StoredSession } from "@/lib/storage";

export type DayStats = {
  /** Fecha local YYYY-MM-DD. */
  day: string;
  sessions: number;
  speakingMs: number;
  /** % del tiempo hablando con volumen correcto (0..100), null si no habló. */
  okVolumePct: number | null;
  okPitchPct: number | null;
};

const sum = (o: Record<string, number>) =>
  Object.values(o).reduce((a, b) => a + b, 0);

const pct = (part: number, total: number) =>
  total > 0 ? Math.round((part / total) * 100) : null;

export function localDay(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}

export function summarize(sessions: StoredSession[]) {
  const volTotal = sessions.reduce((a, s) => a + sum(s.volumeMs), 0);
  const volOk = sessions.reduce((a, s) => a + s.volumeMs.ok, 0);
  const pitchTotal = sessions.reduce((a, s) => a + sum(s.pitchMs), 0);
  const pitchOk = sessions.reduce((a, s) => a + s.pitchMs.ok, 0);
  return {
    sessions: sessions.length,
    speakingMs: volTotal,
    okVolumePct: pct(volOk, volTotal),
    okPitchPct: pct(pitchOk, pitchTotal),
    low: pct(sessions.reduce((a, s) => a + s.volumeMs.low, 0), volTotal),
    loud: pct(sessions.reduce((a, s) => a + s.volumeMs.loud, 0), volTotal),
  };
}

/** Inicio (00:00 local) del primer día de los últimos `days` días, incluido hoy. */
export function periodStart(days: number, now: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() - (days - 1));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Estadísticas por día de los últimos `days` días, del más antiguo al más reciente. */
export function lastDays(
  sessions: StoredSession[],
  days: number,
  now: number,
): DayStats[] {
  const result: DayStats[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const day = localDay(d.getTime());
    const s = summarize(sessions.filter((x) => localDay(x.startedAt) === day));
    result.push({
      day,
      sessions: s.sessions,
      speakingMs: s.speakingMs,
      okVolumePct: s.okVolumePct,
      okPitchPct: s.okPitchPct,
    });
  }
  return result;
}

export function formatDuration(ms: number): string {
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return `${Math.round(ms / 1000)} s`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
