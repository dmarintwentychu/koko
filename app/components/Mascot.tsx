import type { VolumeZone } from "@/lib/audio/zones";
import styles from "./Mascot.module.css";

type Props = { zone: VolumeZone | "off" };

/** Carita que cambia de expresión y color según el volumen. */
export function Mascot({ zone }: Props) {
  return (
    <svg
      className={styles.face}
      data-zone={zone}
      viewBox="0 0 200 200"
      role="img"
      aria-hidden="true"
    >
      <circle className={styles.head} cx="100" cy="100" r="92" />
      {zone === "off" || zone === "silent" ? (
        <>
          <path className={styles.line} d="M62 84q12 10 24 0" />
          <path className={styles.line} d="M114 84q12 10 24 0" />
        </>
      ) : (
        <>
          <circle className={styles.eye} cx="72" cy="82" r="10" />
          <circle className={styles.eye} cx="128" cy="82" r="10" />
        </>
      )}
      {zone === "low" && <ellipse className={styles.mouth} cx="100" cy="142" rx="10" ry="8" />}
      {zone === "ok" && <path className={styles.smile} d="M58 120q42 52 84 0" />}
      {zone === "loud" && <ellipse className={styles.mouth} cx="100" cy="138" rx="30" ry="26" />}
      {(zone === "off" || zone === "silent") && (
        <path className={styles.line} d="M76 140h48" />
      )}
    </svg>
  );
}
