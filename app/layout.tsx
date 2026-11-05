import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semáforo de voz",
  description: "Ayuda visual para que los niños regulen el volumen y el tono de su voz.",
  appleWebApp: { capable: true, title: "Semáforo de voz", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1c2541",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
