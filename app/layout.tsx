import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koko",
  description: "Ayuda visual para que los niños regulen el volumen de su voz.",
  appleWebApp: { capable: true, title: "Koko", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1c2541",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
