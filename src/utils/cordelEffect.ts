export interface CordelOptions {
  zoom: number; // 50 to 180
  detail: number; // 10 to 150
  shadow: number; // 50 to 220
  isMirror: boolean;
  isFrame: boolean;
  posX: number; // -100 to 100
  posY: number; // -100 to 100
  intensity: number; // 0 to 100
}

export const defaultCordelOptions: CordelOptions = {
  zoom: 120,
  detail: 45,  // Softer lines by default (down from 60)
  shadow: 95,   // Softer shadows by default (down from 130)
  isMirror: true,
  isFrame: false,
  posX: 0,
  posY: 0,
  intensity: 80, // Default to 80% (soft vintage effect)
};

export const processCordelEffectBase64 = (base64Img: string, options: CordelOptions, outSize: number = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (base64Img.startsWith('http') || base64Img.startsWith('https')) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      try {
        const result = processCordelEffect(img, options, outSize);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = base64Img;
  });
};

export const processCordelEffect = (img: HTMLImageElement, options: CordelOptions, outSize: number = 200): string => {
  // Pre-center detection based on luminance
  const smallCanvas = document.createElement('canvas');
  const scale = 100 / Math.max(img.width, img.height);
  smallCanvas.width = img.width * scale; 
  smallCanvas.height = img.height * scale;
  const smallCtx = smallCanvas.getContext('2d');
  if (!smallCtx) return '';
  
  smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
  const smallData = smallCtx.getImageData(0, 0, smallCanvas.width, smallCanvas.height).data;

  let bgSum = 0;
  const corners = [0, smallCanvas.width - 1, (smallCanvas.height - 1) * smallCanvas.width, (smallCanvas.height - 1) * smallCanvas.width + smallCanvas.width - 1];
  corners.forEach(idx => {
      let j = idx * 4;
      bgSum += 0.299 * smallData[j] + 0.587 * smallData[j+1] + 0.114 * smallData[j+2];
  });
  const threshold = (bgSum / 4) - 20;

  let minX = smallCanvas.width, maxX = 0, minY = smallCanvas.height, maxY = 0;
  for(let y = 0; y < smallCanvas.height; y++){
      for(let x = 0; x < smallCanvas.width; x++){
          let idx = (y * smallCanvas.width + x) * 4;
          let lum = 0.299 * smallData[idx] + 0.587 * smallData[idx+1] + 0.114 * smallData[idx+2];
          if (lum < threshold) { 
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
      }
  }
  
  minX /= scale; maxX /= scale; minY /= scale; maxY /= scale;
  if (minX > maxX) { minX = 0; maxX = img.width; minY = 0; maxY = img.height; }

  let boxSize = Math.max(maxX - minX, maxY - minY);
  if(boxSize === 0) boxSize = Math.min(img.width, img.height);

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const zoomVal = options.zoom;
  const cropSize = (boxSize * 1.3) / (zoomVal / 100); 
  
  const shiftX = (options.isMirror ? 1 : -1) * (options.posX / 100) * (cropSize / 2);
  const shiftY = - (options.posY / 100) * (cropSize / 2);

  const sX = cx - cropSize / 2 + shiftX;
  const sY = cy - cropSize / 2 + shiftY;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = outSize; finalCanvas.height = outSize;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return '';

  const intensity = options.intensity !== undefined ? options.intensity : 80;

  // 1. Draw solid background paper color if intensity > 0
  if (intensity > 0) {
      finalCtx.fillStyle = '#f4ecd8';
      finalCtx.fillRect(0, 0, outSize, outSize);
  } else {
      // White background for normal photo
      finalCtx.fillStyle = '#ffffff';
      finalCtx.fillRect(0, 0, outSize, outSize);
  }

  // 2. Set filter on the context for vintage sepia look
  // Translate shadow slider to contrast, detail slider to brightness
  const contrastPercent = Math.round(100 + (options.shadow - 95) * 0.4);
  const brightnessPercent = Math.round(95 + (options.detail - 45) * 0.2);
  
  if (intensity > 0) {
      // Soft Sepia/Vintage filter: sepia, moderate contrast, and brightness, scaled by intensity
      const sepiaVal = Math.round((intensity / 100) * 60);
      const contrastVal = Math.round(100 + (intensity / 100) * (contrastPercent - 100));
      const brightnessVal = Math.round(100 + (intensity / 100) * (brightnessPercent - 100));
      finalCtx.filter = `sepia(${sepiaVal}%) contrast(${contrastVal}%) brightness(${brightnessVal}%)`;
  } else {
      finalCtx.filter = 'none';
  }

  // 3. Setup transform (mirror)
  if (options.isMirror) {
      finalCtx.translate(outSize, 0);
      finalCtx.scale(-1, 1);
  }

  // 4. Draw image with blend mode
  if (intensity > 0) {
      finalCtx.globalCompositeOperation = 'multiply';
  } else {
      finalCtx.globalCompositeOperation = 'source-over';
  }
  finalCtx.drawImage(img, sX, sY, cropSize, cropSize, 0, 0, outSize, outSize);

  // 5. Add a very light noise if intensity > 0
  if (intensity > 0) {
      const noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = outSize;
      noiseCanvas.height = outSize;
      const noiseCtx = noiseCanvas.getContext('2d');
      if (noiseCtx) {
          const noiseImgData = noiseCtx.createImageData(outSize, outSize);
          const buffer = noiseImgData.data;
          const noiseMaxAlpha = Math.round((intensity / 100) * 10); // Very subtle noise
          for (let i = 0; i < buffer.length; i += 4) {
              const val = Math.floor(Math.random() * 255);
              buffer[i] = val;
              buffer[i+1] = val;
              buffer[i+2] = val;
              buffer[i+3] = Math.floor(Math.random() * noiseMaxAlpha);
          }
          noiseCtx.putImageData(noiseImgData, 0, 0);
          finalCtx.globalCompositeOperation = 'source-over';
          finalCtx.filter = 'none';
          finalCtx.drawImage(noiseCanvas, 0, 0);
      }
  }

  // 6. Draw frame if enabled
  if (options.isFrame) {
      finalCtx.globalCompositeOperation = 'source-over';
      finalCtx.filter = 'none';
      finalCtx.strokeStyle = '#1e1e1e';
      finalCtx.lineWidth = Math.round(outSize * 0.075);
      finalCtx.strokeRect(0, 0, outSize, outSize);
  }

  return finalCanvas.toDataURL('image/jpeg', 0.85);
};
