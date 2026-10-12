import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

const cx = size / 2;
const cy = size / 2;
const bgCol = '#f4ecd8';
const primaryCol = '#8B2A1A';
const secondaryCol = '#c05621';
const textCol = '#181716';

// 1. Fond transparent puis masque circulaire externe
ctx.clearRect(0, 0, size, size);
ctx.save();
ctx.beginPath();
ctx.arc(cx, cy, 248, 0, Math.PI * 2);
ctx.clip();

// Fond parchemin
ctx.fillStyle = bgCol;
ctx.fillRect(0, 0, size, size);

// Bordure extérieure rouge terre cuite
ctx.strokeStyle = primaryCol;
ctx.lineWidth = 14;
ctx.beginPath();
ctx.arc(cx, cy, 248, 0, Math.PI * 2);
ctx.stroke();

// Filet ocre
ctx.strokeStyle = secondaryCol;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.arc(cx, cy, 232, 0, Math.PI * 2);
ctx.stroke();

// Filet pointillé Cordel
ctx.strokeStyle = primaryCol;
ctx.lineWidth = 3;
ctx.setLineDash([8, 6]);
ctx.beginPath();
ctx.arc(cx, cy, 220, 0, Math.PI * 2);
ctx.stroke();
ctx.setLineDash([]);

// Texte circulaire '★ O GIRADOR ★'
const label = '★ O GIRADOR ★';
ctx.font = 'bold 30px serif';
ctx.fillStyle = textCol;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

const textRadius = 194;
const stepAngle = 0.17;
const startAngle = Math.PI / 2 + ((label.length - 1) * stepAngle) / 2;

for (let i = 0; i < label.length; i++) {
  const charAngle = startAngle - i * stepAngle;
  ctx.save();
  ctx.translate(cx + Math.cos(charAngle) * textRadius, cy + Math.sin(charAngle) * textRadius);
  ctx.rotate(charAngle - Math.PI / 2);
  ctx.fillText(label[i], 0, 0);
  ctx.restore();
}

// Disque central neutre
ctx.beginPath();
ctx.arc(cx, 235, 155, 0, Math.PI * 2);
ctx.fillStyle = '#faf6ec';
ctx.fill();
ctx.lineWidth = 3;
ctx.strokeStyle = 'rgba(139, 42, 26, 0.4)';
ctx.stroke();

// Gravure centrale pour le sceau neutre de la plateforme O Girador
ctx.save();
ctx.font = 'bold 88px serif';
ctx.fillStyle = primaryCol;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('OG', cx, 225);

ctx.font = 'bold 15px serif';
ctx.fillStyle = secondaryCol;
ctx.fillText('ORGANIZAD\'OR', cx, 280);
ctx.restore();

ctx.restore();

const pngBuf = canvas.toBuffer('image/png');
fs.writeFileSync(path.resolve('public/og-girador-frame.png'), pngBuf);
fs.writeFileSync(path.resolve('public/og-image.png'), pngBuf);
fs.writeFileSync(path.resolve('public/og-image.jpg'), canvas.toBuffer('image/jpeg', { quality: 0.92 }));
console.log('✅ Sceau neutre officiel généré dans public/og-girador-frame.png, og-image.png et og-image.jpg');
