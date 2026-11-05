import type { MetadataRoute } from "next";

// Necesario para `output: "export"` (se genera en el build, no por petición).
export const dynamic = "force-static";

// Next no antepone el basePath al contenido del manifest: se hace aquí.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Semáforo de voz",
    short_name: "Voz",
    description: "Ayuda visual para regular el volumen de la voz.",
    lang: "es",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#f3f6fb",
    theme_color: "#1c2541",
    icons: [
      { src: `${base}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { src: `${base}/icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      {
        src: `${base}/icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
