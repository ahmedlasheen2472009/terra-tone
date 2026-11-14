/**
 * Browser-side Export Utilities for Pollution Stages Animations ("Export for Game")
 * Supports:
 * 1. Composite Frame Rendering (CARTO Dark Basemap + NASA GIBS Layer + Markers + HUD)
 * 2. PNG Image Sequence + Metadata packaged in a ZIP (via JSZip)
 * 3. WebM Video Recording via HTML5 Canvas captureStream() + MediaRecorder
 * 4. Structured JSON Metadata + Frame Dates + Sampled Values
 */

import JSZip from 'jszip';
import { getGibsTileUrl, loadCorsTileImage } from '../services/gibsService';

/**
 * Convert lat/lon to continuous Web Mercator tile space at zoom z
 */
function latLonToTileFloat(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const x = ((lon + 180) / 360) * n;
  const latRad = (clampedLat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

/**
 * Pick an ideal zoom level covering bounds cleanly in ~2-4 tiles horizontally
 */
function pickExportZoom(bounds, maxNativeZoom) {
  const lonSpan = Math.max(0.5, Math.abs((bounds.east ?? 40) - (bounds.west ?? 20)));
  const idealZoom = Math.round(Math.log2((360 * 2.5) / lonSpan));
  return Math.max(1, Math.min(maxNativeZoom || 6, idealZoom));
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Renders a single composite satellite frame (Dark Basemap + GIBS Overlay + Marker + HUD)
 * onto an offscreen or provided HTMLCanvasElement without CORS tainting.
 */
export async function renderCompositeFrameCanvas(animation, dateStr, bounds, options = {}) {
  const width = options.width || 768;
  const height = options.height || 512;
  const opacity = options.opacity ?? 0.85;
  const lang = options.lang || 'en';
  const locationA = options.locationA || null;
  const locationB = options.locationB || null;
  const isCompareMode = !!options.isCompareMode;
  const sampleA = options.sampleA || null;
  const sampleB = options.sampleB || null;

  const canvas = options.targetCanvas || document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep cosmic fallback background
  ctx.fillStyle = '#070a13';
  ctx.fillRect(0, 0, width, height);

  const safeBounds = bounds || {
    west: (locationA?.lon ?? 31.2) - 18,
    east: (locationA?.lon ?? 31.2) + 18,
    south: (locationA?.lat ?? 30.0) - 12,
    north: (locationA?.lat ?? 30.0) + 12
  };

  const zoom = pickExportZoom(safeBounds, animation.maxNativeZoom);
  const nTiles = Math.pow(2, zoom);

  // Center of viewport in world pixel space (at zoom)
  const centerLat = (safeBounds.north + safeBounds.south) / 2;
  const centerLon = (safeBounds.east + safeBounds.west) / 2;
  const centerTile = latLonToTileFloat(centerLat, centerLon, zoom);
  const centerWorldPxX = centerTile.x * 256;
  const centerWorldPxY = centerTile.y * 256;

  // Determine how many tiles to cover canvas width & height
  const minWorldPxX = centerWorldPxX - width / 2;
  const maxWorldPxX = centerWorldPxX + width / 2;
  const minWorldPxY = centerWorldPxY - height / 2;
  const maxWorldPxY = centerWorldPxY + height / 2;

  const minTileX = Math.floor(minWorldPxX / 256);
  const maxTileX = Math.floor(maxWorldPxX / 256);
  const minTileY = Math.max(0, Math.floor(minWorldPxY / 256));
  const maxTileY = Math.min(nTiles - 1, Math.floor(maxWorldPxY / 256));

  const tileCoords = [];
  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const wrappedTx = ((tx % nTiles) + nTiles) % nTiles;
      tileCoords.push({ tx, wrappedTx, ty });
    }
  }

  // Fetch basemap tiles & GIBS tiles in parallel
  const tilePromises = tileCoords.map(async ({ tx, wrappedTx, ty }) => {
    const baseUrl = `https://a.basemaps.cartocdn.com/dark_all/${zoom}/${wrappedTx}/${ty}.png`;
    const gibsUrl = getGibsTileUrl(animation, dateStr, zoom, ty, wrappedTx);
    const [baseRes, gibsRes] = await Promise.all([
      loadCorsTileImage(baseUrl),
      loadCorsTileImage(gibsUrl)
    ]);
    return { tx, ty, baseRes, gibsRes };
  });

  const loadedTiles = await Promise.all(tilePromises);

  // Draw CARTO dark basemap tiles first
  for (const t of loadedTiles) {
    const drawX = Math.round(t.tx * 256 - minWorldPxX);
    const drawY = Math.round(t.ty * 256 - minWorldPxY);
    if (t.baseRes.ok && t.baseRes.img) {
      ctx.drawImage(t.baseRes.img, drawX, drawY, 256, 256);
    }
  }

  // Draw GIBS tiles over basemap with requested opacity
  ctx.save();
  ctx.globalAlpha = opacity;
  for (const t of loadedTiles) {
    const drawX = Math.round(t.tx * 256 - minWorldPxX);
    const drawY = Math.round(t.ty * 256 - minWorldPxY);
    if (t.gibsRes.ok && t.gibsRes.img) {
      ctx.drawImage(t.gibsRes.img, drawX, drawY, 256, 256);
    }
  }
  ctx.restore();

  // Helper to draw crosshair marker for a location
  const drawMarker = (loc, color, badge) => {
    if (!loc) return;
    const pt = latLonToTileFloat(loc.lat, loc.lon, zoom);
    const px = pt.x * 256 - minWorldPxX;
    const py = pt.y * 256 - minWorldPxY;
    if (px < -20 || px > width + 20 || py < -20 || py > height + 20) return;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(px, py, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px Inter, sans-serif';
    const label = badge ? `${badge}: ${loc.nameEn}` : loc.nameEn;
    const textW = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(7, 10, 19, 0.85)';
    ctx.fillRect(px + 12, py - 11, textW + 10, 20);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 12, py - 11, textW + 10, 20);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(label, px + 17, py + 3);
    ctx.restore();
  };

  drawMarker(locationA, '#38bdf8', isCompareMode ? 'A' : '');
  if (isCompareMode && locationB) {
    drawMarker(locationB, '#f97316', 'B');
  }

  // Top HUD bar
  ctx.save();
  ctx.fillStyle = 'rgba(7, 10, 19, 0.86)';
  ctx.fillRect(0, 0, width, 44);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 42, width, 2);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Inter, sans-serif';
  const title = lang === 'ar' ? animation.titleEn : animation.titleEn;
  ctx.fillText(title, 14, 27);

  // Proxy / Soil Indicator pill on top right
  const badgeText = animation.proxyBadgeEn || '';
  if (badgeText) {
    ctx.font = 'bold 11px Inter, sans-serif';
    const bw = ctx.measureText(badgeText).width + 16;
    ctx.fillStyle = animation.isProxy ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.2)';
    ctx.fillRect(width - bw - 14, 10, bw, 24);
    ctx.strokeStyle = animation.isProxy ? '#fbbf24' : '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(width - bw - 14, 10, bw, 24);
    ctx.fillStyle = animation.isProxy ? '#fbbf24' : '#38bdf8';
    ctx.fillText(badgeText, width - bw - 6, 26);
  }

  // Bottom HUD bar (Date, Sampled Value, Credit)
  ctx.fillStyle = 'rgba(7, 10, 19, 0.88)';
  ctx.fillRect(0, height - 42, width, 42);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillText(`DATE: ${dateStr}`, 14, height - 15);

  let valStr = 'Sample: —';
  if (sampleA && sampleA.value !== null && !isNaN(sampleA.value)) {
    valStr = `A: ${sampleA.label}`;
  }
  if (isCompareMode && sampleB && sampleB.value !== null && !isNaN(sampleB.value)) {
    valStr += `  |  B: ${sampleB.label}`;
  }
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 13px "JetBrains Mono", monospace';
  ctx.fillText(valStr, 210, height - 15);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, sans-serif';
  const credit = 'NASA EOSDIS GIBS';
  const cw = ctx.measureText(credit).width;
  ctx.fillText(credit, width - cw - 14, height - 16);

  ctx.restore();
  return canvas;
}

/**
 * Exports the entire animation as a ZIP archive of PNG frames + frames_metadata.json
 */
export async function exportFramesAsZip(
  animation,
  dates,
  bounds,
  samplesByDateA = {},
  samplesByDateB = {},
  options = {},
  onProgress = () => {}
) {
  if (!animation || !dates || dates.length === 0) {
    throw new Error('No animation frames available to export.');
  }

  const zip = new JSZip();
  const folder = zip.folder(`${animation.id}_frames`);
  const canvas = document.createElement('canvas');
  const frameRecords = [];

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    onProgress({ current: i + 1, total: dates.length, date: dateStr });

    const sampleA = samplesByDateA[dateStr] || null;
    const sampleB = samplesByDateB[dateStr] || null;

    await renderCompositeFrameCanvas(animation, dateStr, bounds, {
      ...options,
      targetCanvas: canvas,
      sampleA,
      sampleB
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error(`Failed to encode PNG for frame ${dateStr}`));
      }, 'image/png');
    });

    const idxStr = String(i + 1).padStart(3, '0');
    const fileName = `frame_${idxStr}_${dateStr}.png`;
    folder.file(fileName, blob);

    frameRecords.push({
      index: i,
      fileName,
      date: dateStr,
      valueA: sampleA?.value ?? null,
      labelA: sampleA?.label ?? null,
      valueB: options.isCompareMode ? (sampleB?.value ?? null) : null,
      labelB: options.isCompareMode ? (sampleB?.label ?? null) : null
    });
  }

  const metadata = {
    app: 'Earth Jukebox — Pollution Stages Export',
    animationId: animation.id,
    stageId: animation.stageId,
    title: animation.titleEn,
    gibsLayerId: animation.gibsLayerId,
    provider: animation.provider,
    variable: animation.variableEn,
    unit: animation.unitEn,
    isProxy: animation.isProxy,
    limitation: animation.limitationEn,
    availableRange: animation.availableRange,
    locationA: options.locationA || null,
    locationB: options.isCompareMode ? options.locationB : null,
    frames: frameRecords
  };

  folder.file('frames_metadata.json', JSON.stringify(metadata, null, 2));

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, `${animation.id}_satellite_frames.zip`);
}

/**
 * Exports the animation as a WebM video using HTML5 Canvas captureStream() + MediaRecorder
 */
export async function exportFramesAsWebM(
  animation,
  dates,
  bounds,
  samplesByDateA = {},
  samplesByDateB = {},
  options = {},
  onProgress = () => {}
) {
  if (!animation || !dates || dates.length === 0) {
    throw new Error('No animation frames available to record.');
  }

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('WebM video capture (MediaRecorder API) is not supported in this browser.');
  }

  const candidateTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  const mimeType = candidateTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
  if (!mimeType) {
    throw new Error('No supported WebM codec found in this browser.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = options.width || 768;
  canvas.height = options.height || 512;

  if (typeof canvas.captureStream !== 'function') {
    throw new Error('Canvas captureStream() is not supported in this browser.');
  }

  const stream = canvas.captureStream(12);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2_500_000
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const stopPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
    recorder.onerror = (err) => {
      reject(err?.error || new Error('MediaRecorder failed during capture.'));
    };
  });

  recorder.start(200);

  const frameHoldMs = options.frameHoldMs || 380;

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i];
    onProgress({ current: i + 1, total: dates.length, date: dateStr });

    await renderCompositeFrameCanvas(animation, dateStr, bounds, {
      ...options,
      targetCanvas: canvas,
      sampleA: samplesByDateA[dateStr] || null,
      sampleB: samplesByDateB[dateStr] || null
    });

    await new Promise(r => setTimeout(r, frameHoldMs));
  }

  recorder.stop();
  const webmBlob = await stopPromise;
  triggerBlobDownload(webmBlob, `${animation.id}_timelapse.webm`);
}

/**
 * Exports animation frame dates, sampled GIBS pixel values, and optional paired NASA POWER curve as JSON
 */
export function exportFramesAsJson(
  animation,
  dates,
  locationA,
  locationB,
  isCompareMode,
  samplesByDateA = {},
  samplesByDateB = {},
  powerSeries = null
) {
  if (!animation || !dates || dates.length === 0) {
    throw new Error('No frame data available to export.');
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'Earth Jukebox — NASA GIBS & NASA POWER',
    stageId: animation.stageId,
    animationId: animation.id,
    titleEn: animation.titleEn,
    titleAr: animation.titleAr,
    gibsLayerId: animation.gibsLayerId,
    colormapId: animation.colormapId,
    provider: animation.provider,
    variableEn: animation.variableEn,
    unit: animation.unitEn,
    isProxy: animation.isProxy,
    proxyBadge: animation.proxyBadgeEn,
    limitationEn: animation.limitationEn,
    availableRange: animation.availableRange,
    locationA: locationA ? {
      name: locationA.nameEn,
      lat: locationA.lat,
      lon: locationA.lon
    } : null,
    locationB: isCompareMode && locationB ? {
      name: locationB.nameEn,
      lat: locationB.lat,
      lon: locationB.lon
    } : null,
    pairedPowerParam: animation.pairedPowerParam || null,
    pairedPowerSecondaryParam: animation.pairedPowerSecondaryParam || null,
    powerMonthlySeries: powerSeries || null,
    frames: dates.map((dateStr, idx) => {
      const sA = samplesByDateA[dateStr] || null;
      const sB = isCompareMode ? (samplesByDateB[dateStr] || null) : null;
      return {
        index: idx,
        date: dateStr,
        locationA: sA ? {
          value: sA.value,
          label: sA.label,
          rgb: sA.r !== undefined ? [sA.r, sA.g, sA.b] : null,
          isLuminance: !!sA.isLuminance,
          missingOrCloud: !!(sA.missingTile || sA.emptyPixel)
        } : null,
        locationB: sB ? {
          value: sB.value,
          label: sB.label,
          rgb: sB.r !== undefined ? [sB.r, sB.g, sB.b] : null,
          isLuminance: !!sB.isLuminance,
          missingOrCloud: !!(sB.missingTile || sB.emptyPixel)
        } : null
      };
    })
  };

  const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerBlobDownload(jsonBlob, `${animation.id}_frames_data.json`);
}
