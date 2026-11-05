import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `npm run export` genera una carpeta estática (out/) para alojar en cualquier
  // servidor web. Las cabeceras de abajo solo se aplican con el servidor de Next.
  output: process.env.STATIC_EXPORT === "1" ? "export" : undefined,
  // Solo desarrollo: permite abrir el servidor desde el móvil por la IP de la
  // red local (rangos privados). Un cliente remoto no accede sin estar en la LAN.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
