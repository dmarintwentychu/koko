import type { NextConfig } from "next";

// `STATIC_EXPORT=1` genera una carpeta estática (out/) para GitHub Pages.
const isExport = process.env.STATIC_EXPORT === "1";
// Subruta de GitHub Pages (p. ej. "/koko"). Vacía en desarrollo y en la raíz.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: isExport ? "export" : undefined,
  basePath,
  // Solo desarrollo: permite abrir el servidor desde el móvil por la IP de la
  // red local (rangos privados). Un cliente remoto no accede sin estar en la LAN.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  // Con "export" las cabeceras no se aplican (las da el hosting), así que no se
  // declaran para evitar el aviso del build.
  ...(isExport
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                // Solo se permite el micrófono; nada más.
                {
                  key: "Permissions-Policy",
                  value: "microphone=(self), camera=(), geolocation=()",
                },
              ],
            },
            {
              source: "/sw.js",
              headers: [
                {
                  key: "Content-Type",
                  value: "application/javascript; charset=utf-8",
                },
                {
                  key: "Cache-Control",
                  value: "no-cache, no-store, must-revalidate",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
