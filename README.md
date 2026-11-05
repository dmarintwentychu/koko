# Semáforo de voz

PWA (Next.js) que ayuda a niños con dificultades del habla a regular el **volumen** de su voz mediante ayudas visuales. Todo el audio se procesa en el dispositivo: no se graba ni se envía nada.

## Desarrollo

```bash
npm install
npm run dev
```

El micrófono (`getUserMedia`) solo funciona en **HTTPS** o `localhost`, así que para probar en un móvil de la misma wifi:

```bash
npm run dev:lan   # HTTPS en la IP local del Mac (macOS, wifi en en0)
```

Abre en el móvil la dirección `https://<IP>:3000` que muestra la consola y acepta el aviso del certificado (es autofirmado). El servidor solo escucha en esa IP, no en todas las interfaces. Los orígenes de red local permitidos en desarrollo están en `allowedDevOrigins` de [`next.config.ts`](next.config.ts).

El service worker solo se registra en producción (`npm run build && npm start`).

## Perfiles, estadísticas y calibración

- **Perfiles:** al abrir la app, el niño toca su dibujo. Hasta 8 perfiles, cada uno con sus propios umbrales y estadísticas.
- **Panel de adultos:** el icono ⚙ pide una suma sencilla (para que los niños no entren por accidente; no es una medida de seguridad) y muestra el progreso de los últimos 7 o 30 días (selector Semana / Mes), la calibración y el borrado de datos.
- **Calibración (unos 10 s):** 3 s de silencio para medir el ruido de fondo y 6 s con el niño hablando normal. De ahí salen los umbrales de volumen (voz normal ± 8 dB) y de tono (tono medio ÷/× 1,3). Rechaza la calibración si hay poca voz o demasiado ruido.
- **Último estado:** cuando el niño deja de hablar, la pantalla conserva la última lectura (carita, mensaje y semáforo) hasta que vuelva a hablar o se pare el micro. El silencio no cuenta en las estadísticas.
- **Tono:** ya no se muestra en la pantalla del niño, pero se sigue midiendo para la calibración y las estadísticas del panel de adultos.
- **Estadísticas:** por sesión se guarda el tiempo en cada zona de volumen y tono (no audio). Se descartan las sesiones de menos de 5 s y se conservan las últimas 1000.
- **Almacenamiento:** solo `localStorage` del dispositivo (clave `semaforo-voz:v1`). Si se borra el navegador o se cambia de móvil, se pierde. Los valores por defecto están en [`lib/audio/config.ts`](lib/audio/config.ts).

## Estructura

- `lib/audio/` – micrófono (`engine`), detección de tono, zonas, calibración y hook `useVoiceMeter`.
- `lib/storage.ts`, `lib/useAppData.ts`, `lib/stats.ts` – perfiles, sesiones (con validación) y estadísticas.
- `app/components/` – interfaz: medidor (carita y semáforo de volumen), selector de perfil, panel de adultos y calibración.
- `app/manifest.ts`, `public/sw.js` – PWA (instalable y offline).
- `scripts/make-icons.mjs` – regenera los iconos.
