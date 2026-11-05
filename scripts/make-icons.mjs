// Genera los iconos PNG de la PWA a partir de un SVG. Uso: node scripts/make-icons.mjs
import sharp from "sharp";

const face = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1c2541"/>
  <g transform="translate(256 256) scale(${1 - pad}) translate(-256 -256)">
    <circle cx="256" cy="256" r="200" fill="#2ecc71"/>
    <circle cx="190" cy="220" r="26" fill="#1c2541"/>
    <circle cx="322" cy="220" r="26" fill="#1c2541"/>
    <path d="M168 300q88 100 176 0" fill="none" stroke="#1c2541" stroke-width="24" stroke-linecap="round"/>
  </g>
</svg>`;

const jobs = [
  ["public/icons/icon-192.png", 192, 0],
  ["public/icons/icon-512.png", 512, 0],
  // "maskable": contenido dentro de la zona segura (80 %).
  ["public/icons/icon-maskable-512.png", 512, 0.2],
  ["app/apple-icon.png", 180, 0],
  ["app/icon.png", 64, 0],
];
for (const [file, size, pad] of jobs) {
  await sharp(Buffer.from(face(pad))).resize(size, size).png().toFile(file);
}
