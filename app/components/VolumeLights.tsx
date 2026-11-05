import type { VolumeZone } from "@/lib/audio/zones";
import { SpeakerIcon } from "./icons";
import styles from "./VolumeLights.module.css";

type Props = { zone: VolumeZone | "off"; level: number };

const LIGHTS = [
  { id: "low", size: "small" },
  { id: "ok", size: "medium" },
  { id: "loud", size: "big" },
] as const;

/** Semáforo horizontal: izquierda = muy flojo, derecha = muy fuerte. */
export function VolumeLights({ zone, level }: Props) {
  return (
    <div className={styles.box} role="img" aria-label={`Volumen ${zone}`}>
      <div className={styles.lights}>
        {LIGHTS.map((light) => (
          <div
            key={light.id}
            className={styles.light}
            data-light={light.id}
            data-on={zone === light.id}
          >
            <SpeakerIcon size={light.size} />
          </div>
        ))}
      </div>
      <div className={styles.level} aria-hidden="true">
        <div className={styles.levelFill} style={{ width: `${level * 100}%` }} />
      </div>
    </div>
  );
}
