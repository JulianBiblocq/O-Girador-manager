import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { drawSealNeutralFrame, drawSealLogoCenter } from '../src/utils/shareUtils.js';

async function generate() {
  const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/o-girador-7828c.firebasestorage.app/o/associations%2Fsambabulles%2Flogo_1791748653261?alt=media&token=f03fac3a-d96f-4714-bdcd-6e1d1b6becec';
  console.log('Téléchargement du logo officiel Samb\'à Bulles...');
  const res = await fetch(logoUrl);
  if (!res.ok) throw new Error('Échec téléchargement logo: ' + res.statusText);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const img = await loadImage(buffer);
  console.log('Image chargée:', img.width, 'x', img.height);

  const size = 512;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  drawSealNeutralFrame(ctx, size, '#f4ecd8', '#8B2A1A', '#c05621', '#181716');
  drawSealLogoCenter(ctx, size, img);
  
  const png = canvas.toBuffer('image/png');
  const targetPath = path.resolve('public/brandings/logoOGSambabulles.png');
  fs.writeFileSync(targetPath, png);
  console.log('✅ Sceau combiné généré dans:', targetPath, `(${png.length} octets)`);
}

generate().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
