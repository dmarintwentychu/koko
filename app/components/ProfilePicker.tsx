"use client";

import { useState } from "react";
import { AVATARS, MAX_NAME_LENGTH, MAX_PROFILES, type Profile } from "@/lib/storage";
import styles from "./Screens.module.css";

type Props = {
  profiles: Profile[];
  onSelect: (id: string) => void;
  onCreate: (name: string, avatar: number) => void;
};

/** Pantalla de inicio: el niño toca su cara; un adulto puede crear perfiles. */
export function ProfilePicker({ profiles, onSelect, onCreate }: Props) {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(0);

  const canCreate = profiles.length < MAX_PROFILES;

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>
        {creating ? "Nuevo perfil" : "¿Quién va a hablar?"}
      </h1>

      {!creating && (
        <>
          <div className={styles.profileGrid}>
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.profileBtn}
                onClick={() => onSelect(p.id)}
              >
                <span className={styles.avatar} aria-hidden="true">
                  {AVATARS[p.avatar]}
                </span>
                <span className={styles.profileName}>{p.name}</span>
              </button>
            ))}
            {canCreate && (
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setCreating(true)}
                aria-label="Añadir perfil (adultos)"
              >
                <span className={styles.avatar} aria-hidden="true">
                  ＋
                </span>
                <span className={styles.profileName}>Nuevo</span>
              </button>
            )}
          </div>
        </>
      )}

      {creating && (
        <form
          className={styles.card}
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            onCreate(name, avatar);
            setName("");
            setCreating(false);
          }}
        >
          <label className={styles.label}>
            Nombre del niño o niña
            <input
              className={styles.input}
              value={name}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <fieldset className={styles.avatarSet}>
            <legend className={styles.label}>Elige un dibujo</legend>
            {AVATARS.map((a, i) => (
              <label key={a} className={styles.avatarChoice}>
                <input
                  type="radio"
                  name="avatar"
                  checked={avatar === i}
                  onChange={() => setAvatar(i)}
                />
                <span aria-hidden="true">{a}</span>
                <span className={styles.srOnly}>Dibujo {i + 1}</span>
              </label>
            ))}
          </fieldset>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.primary}
              disabled={!name.trim()}
            >
              Crear
            </button>
            {profiles.length > 0 && (
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setCreating(false)}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}
    </main>
  );
}
