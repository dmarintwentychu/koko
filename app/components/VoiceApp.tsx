"use client";

import { useState } from "react";
import { dbToMeter } from "@/lib/audio/zones";
import { useVoiceMeter } from "@/lib/audio/useVoiceMeter";
import { useAppData } from "@/lib/useAppData";
import { AVATARS, type Profile } from "@/lib/storage";
import { AdultGate } from "./AdultGate";
import { AdultPanel } from "./AdultPanel";
import { Mascot } from "./Mascot";
import { ProfilePicker } from "./ProfilePicker";
import { VolumeLights } from "./VolumeLights";
import { MicIcon, StopIcon } from "./icons";
import styles from "./VoiceApp.module.css";

const MESSAGES = {
  silent: "Habla y te escucho",
  low: "Más fuerte",
  ok: "¡Muy bien!",
  loud: "Más suave",
} as const;

type View = "meter" | "gate" | "panel";

export function VoiceApp() {
  const app = useAppData();
  const [view, setView] = useState<View>("meter");

  // Hasta que se hidrata no se sabe si hay perfiles: se evita un parpadeo.
  if (!app.ready) return <div className={styles.app} />;

  const profile =
    app.data.profiles.find((p) => p.id === app.data.activeProfileId) ?? null;

  if (!profile) {
    return (
      <ProfilePicker
        profiles={app.data.profiles}
        onSelect={(id) => {
          setView("meter");
          app.selectProfile(id);
        }}
        onCreate={(name, avatar) => {
          setView("meter");
          app.addProfile(name, avatar);
        }}
      />
    );
  }

  if (view === "gate") {
    return (
      <AdultGate onPass={() => setView("panel")} onCancel={() => setView("meter")} />
    );
  }

  if (view === "panel") {
    return (
      <AdultPanel
        profile={profile}
        sessions={app.data.sessions.filter((s) => s.profileId === profile.id)}
        saveFailed={app.saveFailed}
        onBack={() => setView("meter")}
        onSaveCalibration={(t) => app.saveCalibration(profile.id, t)}
        onResetCalibration={() => app.resetCalibration(profile.id)}
        onClearStats={() => app.clearSessions(profile.id)}
        onDeleteProfile={() => {
          setView("meter");
          app.deleteProfile(profile.id);
        }}
      />
    );
  }

  return (
    <MeterScreen
      key={profile.id}
      profile={profile}
      onSession={(s) => app.addSession(profile.id, s)}
      onOpenAdult={() => setView("gate")}
      onSwitchProfile={() => app.selectProfile(null)}
    />
  );
}

type MeterProps = {
  profile: Profile;
  onSession: Parameters<typeof useVoiceMeter>[1];
  onOpenAdult: () => void;
  onSwitchProfile: () => void;
};

function MeterScreen({
  profile,
  onSession,
  onOpenAdult,
  onSwitchProfile,
}: MeterProps) {
  const { status, reading, start, stop } = useVoiceMeter(
    profile.thresholds,
    onSession,
  );

  const listening = status === "listening";
  const message = listening ? MESSAGES[reading.volume] : "Toca el micro";

  return (
    <main className={styles.app} data-zone={listening ? reading.volume : "off"}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.who}
          aria-label={`Cambiar de perfil. Ahora: ${profile.name}`}
          onClick={onSwitchProfile}
        >
          <span className={styles.whoAvatar} aria-hidden="true">
            {AVATARS[profile.avatar]}
          </span>
          <span className={styles.whoName}>{profile.name}</span>
        </button>
        <button
          type="button"
          className={styles.gear}
          aria-label="Ajustes y estadísticas para adultos"
          onClick={onOpenAdult}
        >
          ⚙
        </button>
      </header>

      <section className={styles.stage} aria-live="polite">
        <Mascot zone={listening ? reading.volume : "off"} />
        <p className={styles.message}>{message}</p>
      </section>

      <section className={styles.gauges} aria-label="Volumen">
        <VolumeLights
          zone={listening ? reading.volume : "off"}
          level={listening ? dbToMeter(reading.db) : 0}
        />
      </section>

      <footer className={styles.footer}>
        {status === "denied" && (
          <p className={styles.error} role="alert">
            El micrófono está bloqueado. Un adulto debe permitirlo en los
            ajustes del navegador y volver a probar.
          </p>
        )}
        {status === "error" && (
          <p className={styles.error} role="alert">
            No se pudo usar el micrófono en este dispositivo.
          </p>
        )}
        <button
          type="button"
          className={styles.mic}
          data-active={listening}
          disabled={status === "starting"}
          aria-label={listening ? "Parar" : "Empezar"}
          onClick={listening ? stop : start}
        >
          {listening ? <StopIcon /> : <MicIcon />}
        </button>
      </footer>
    </main>
  );
}
