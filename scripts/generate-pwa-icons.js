import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';
import path from 'path';

async function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 512;

  const bgCol = '#f4ecd8';
  const primaryCol = '#d99f4d';
  const textCol = '#1a1a1a';

  // Draw paper background
  ctx.fillStyle = bgCol;
  ctx.fillRect(0, 0, size, size);

  // Draw double textured woodcut circles
  ctx.strokeStyle = primaryCol;
  ctx.lineWidth = 14 * scale;
  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 230 * scale, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 215 * scale, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2 * scale;
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.beginPath();
  ctx.arc(256 * scale, 256 * scale, 205 * scale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw circular text "★ O GIRADOR ★" at the bottom inside the ring
  const fontSize = Math.round(24 * scale);
  ctx.font = `bold ${fontSize}px "Courier New", Courier, monospace`;
  ctx.fillStyle = textCol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = "★ O GIRADOR ★";
  const radius = 175 * scale;
  const angleStep = 0.16;
  const startAngle = Math.PI / 2 - (label.length - 1) * angleStep / 2;

  for (let i = 0; i < label.length; i++) {
    const charAngle = startAngle + i * angleStep;
    const x = 256 * scale + Math.cos(charAngle) * radius;
    const y = 256 * scale + Math.sin(charAngle) * radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle - Math.PI / 2);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }

  // Draw association logo in center
  try {
    const logoPath = path.resolve('public/Pictures/logo-samambaia.png');
    if (fs.existsSync(logoPath)) {
      const img = await loadImage(logoPath);
      const targetSize = 310 * scale;
      let w = img.width;
      let h = img.height;
      const ratio = w / h;
      if (w > h) {
        w = targetSize;
        h = targetSize / ratio;
      } else {
        h = targetSize;
        w = targetSize * ratio;
      }
      ctx.drawImage(img, (256 * scale) - (w / 2), (235 * scale) - (h / 2), w, h);
    }
  } catch (err) {
    console.error("Error drawing logo:", err);
  }

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  await generateIcon(192, path.resolve('public/icon-192.png'));
  await generateIcon(512, path.resolve('public/icon-512.png'));
}

main().catch(console.error);
