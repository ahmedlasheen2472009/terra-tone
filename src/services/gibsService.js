/**
 * NASA GIBS (Global Imagery Browse Services) WMTS & Colormap Service
 * Verified against NASA GIBS WMTS GetCapabilities:
 * https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?SERVICE=WMTS&request=GetCapabilities
 */

export const GIBS_LAYERS = [
  {
    id: 'MODIS_Terra_Land_Surface_Temp_Day',
    colormapId: 'MODIS_Land_Surface_Temp',
    nameEn: 'Land Surface Temp (Day)',
    nameAr: 'حرارة سطح الأرض (نهاراً)',
    format: 'png',
    ext: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxNativeZoom: 7,
    startDate: '2000-02-24',
    unitEn: '°C',
    unitAr: 'م°',
    isTemperature: true,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg',
    descriptionEn: 'Daily land surface temperature from MODIS Terra, showing regional heat islands, desert heat, and seasonal thermal shifts.',
    descriptionAr: 'درجة حرارة سطح الأرض النهارية من القمر الصناعي تيرا، توضح جزر الحرارة الحضرية وحرارة الصحراء.'
  },
  {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    colormapId: null, // Natural RGB image (uses luminance for sound)
    nameEn: 'Natural Color Imagery (True Color)',
    nameAr: 'صور الألوان الطبيعية الحقيقية',
    format: 'jpeg',
    ext: 'jpeg',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    maxNativeZoom: 9,
    startDate: '2000-02-24',
    unitEn: 'Reflectance (Luminance)',
    unitAr: 'السطوع والانعكاس',
    isTemperature: false,
    legendUrl: null,
    descriptionEn: 'Daily true-color optical satellite imagery from MODIS Terra showing actual atmospheric clouds, oceans, vegetation, and terrain.',
    descriptionAr: 'صور فضائية بالألوان الحقيقية اليومية من قمر تيرا توضح السحب، الغطاء النباتي، والتضاريس.'
  },
  {
    id: 'IMERG_Precipitation_Rate',
    colormapId: 'GPM_Precipitation_Rate',
    nameEn: 'Precipitation Rate (IMERG)',
    nameAr: 'معدل هطول الأمطار (IMERG)',
    format: 'png',
    ext: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxNativeZoom: 6,
    startDate: '2000-06-01',
    unitEn: 'mm/hr',
    unitAr: 'ملم/ساعة',
    isTemperature: false,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/GPM_Precipitation_Rate_H.svg',
    descriptionEn: 'GPM IMERG multi-satellite precipitation rate estimates depicting rainfall intensity and severe storms worldwide.',
    descriptionAr: 'تقديرات هطول الأمطار من مهمة قياس الأمطار العالمية (GPM IMERG) لرصد شدة الأمطار والعواصف.'
  },
  {
    id: 'MODIS_Terra_NDVI_8Day',
    colormapId: 'MODIS_NDVI',
    nameEn: 'Vegetation Index (NDVI)',
    nameAr: 'مؤشر الغطاء النباتي (NDVI)',
    format: 'png',
    ext: 'png',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    maxNativeZoom: 9,
    startDate: '2025-02-12',
    unitEn: 'NDVI',
    unitAr: 'NDVI',
    isTemperature: false,
    legendUrl: 'https://gibs.earthdata.nasa.gov/legends/MODIS_NDVI_H.svg',
    descriptionEn: 'Rolling 8-day Normalized Difference Vegetation Index measuring plant chlorophyll and canopy greenness.',
    descriptionAr: 'مؤشر الغطاء النباتي المقاس كل 8 أيام لرصد كثافة وصحة النباتات والمحاصيل الزراعية.'
  }
];

// In-memory caches for parsed colormaps and sampled pixels
const colormapCache = new Map();
const tileImageCache = new Map();
const pixelSampleCache = new Map();

/**
 * Builds the NASA GIBS WMTS Tile URL
 */
export function getGibsTileUrl(layerIdOrConfig, dateStr, z, y, x) {
  const layer = typeof layerIdOrConfig === 'object' && layerIdOrConfig !== null
    ? layerIdOrConfig
    : (GIBS_LAYERS.find(l => l.id === layerIdOrConfig) || GIBS_LAYERS[0]);
  const id = layer.gibsLayerId || layer.id;
  const time = dateStr || 'default';
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${id}/default/${time}/${layer.tileMatrixSet}/${z}/${y}/${x}.${layer.ext || 'png'}`;
}

/**
 * Converts latitude and longitude to Tile coordinates (x, y) and in-tile pixel offset (px, py)
 * for Web Mercator EPSG:3857 at zoom level z.
 */
export function latLngToTileCoordinates(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const xExact = ((lng + 180) / 360) * n;

  const latRad = (clampedLat * Math.PI) / 180;
  const yExact = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

  const tileX = ((Math.floor(xExact) % n) + n) % n;
  const tileY = Math.max(0, Math.min(n - 1, Math.floor(yExact)));

  const pixelX = Math.floor((xExact - Math.floor(xExact)) * 256);
  const pixelY = Math.floor((yExact - Math.floor(yExact)) * 256);

  return {
    tileX,
    tileY,
    pixelX: Math.max(0, Math.min(255, pixelX)),
    pixelY: Math.max(0, Math.min(255, pixelY))
  };
}

/**
 * Fetches and parses NASA GIBS Colormap XML v1.3
 * Accepts either a layerId string (from GIBS_LAYERS) or a config object { gibsLayerId, colormapId }.
 */
export async function fetchGibsColormap(layerIdOrConfig) {
  const layer = typeof layerIdOrConfig === 'object' && layerIdOrConfig !== null
    ? layerIdOrConfig
    : GIBS_LAYERS.find(l => l.id === layerIdOrConfig);

  if (!layer || !layer.colormapId) return null;

  const cmKey = layer.colormapId;
  if (colormapCache.has(cmKey)) {
    return colormapCache.get(cmKey);
  }

  const gid = layer.gibsLayerId || layer.id;
  const urlsToTry = [
    `https://gibs.earthdata.nasa.gov/colormaps/v1.3/${cmKey}.xml`,
    `https://gibs.earthdata.nasa.gov/colormaps/v1.3/${gid}.xml`
  ];

  let lastErr = null;
  for (const url of urlsToTry) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        lastErr = new Error(`HTTP ${response.status}`);
        continue;
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');
      const entries = doc.querySelectorAll('ColorMapEntry');

      const colormapData = [];
      entries.forEach(entry => {
        const rgbStr = entry.getAttribute('rgb');
        const valStr = entry.getAttribute('value');
        const isTransparent = entry.getAttribute('transparent') === 'true';
        const isNodata = entry.getAttribute('nodata') === 'true';

        if (rgbStr && valStr && !isNodata && !isTransparent) {
          const [r, g, b] = rgbStr.split(',').map(Number);
          const cleaned = valStr.replace(/[\[\(\]\)]/g, '');
          const rawParts = cleaned.split(',');
          const nums = rawParts.map(p => {
            if (p.includes('INF')) return NaN;
            return Number(p);
          });
          let midValue = NaN;
          if (nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
            midValue = (nums[0] + nums[1]) / 2;
          } else if (!isNaN(nums[0])) {
            midValue = nums[0];
          } else if (nums.length === 2 && !isNaN(nums[1])) {
            midValue = nums[1];
          }

          if (!isNaN(r) && !isNaN(g) && !isNaN(b) && !isNaN(midValue)) {
            colormapData.push({ r, g, b, value: midValue });
          }
        }
      });

      if (colormapData.length > 0) {
        colormapCache.set(cmKey, colormapData);
        return colormapData;
      }
    } catch (err) {
      lastErr = err;
      console.warn(`Failed fetching colormap from ${url}:`, err);
    }
  }

  if (lastErr) {
    console.warn(`Colormap unavailable for ${cmKey}:`, lastErr);
  }
  return null;
}

/**
 * Converts an RGB pixel to a data value using the colormap (nearest color lookup)
 * or falls back to luminance.
 */
export function pixelToValue(r, g, b, colormap, layer) {
  if (r === 0 && g === 0 && b === 0) {
    return { value: null, isLuminance: false, label: 'No Data' };
  }

  if (colormap && colormap.length > 0 && !layer?.useLuminance) {
    let minDistance = Infinity;
    let closestValue = null;

    for (let i = 0; i < colormap.length; i++) {
      const entry = colormap[i];
      const dr = r - entry.r;
      const dg = g - entry.g;
      const db = b - entry.b;
      const dist = dr * dr + dg * dg + db * db;

      if (dist < minDistance) {
        minDistance = dist;
        closestValue = entry.value;
        if (dist === 0) break;
      }
    }

    if (minDistance < 2500 && closestValue !== null) {
      let finalVal = closestValue;
      if (layer?.isTemperature || layer?.isKelvin) {
        if (finalVal > 100) {
          finalVal = finalVal - 273.15;
        }
      }
      const decimals = Math.abs(finalVal) < 2 ? 3 : (Math.abs(finalVal) < 20 ? 2 : 1);
      return {
        value: parseFloat(finalVal.toFixed(decimals)),
        isLuminance: false,
        label: `${finalVal.toFixed(decimals)} ${layer?.unitEn || ''}`.trim()
      };
    }
  }

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    value: parseFloat((luminance * 100).toFixed(1)),
    isLuminance: true,
    label: `${(luminance * 100).toFixed(0)}% Luminance`
  };
}

/**
 * Loads an image with crossOrigin='anonymous' and caches the decoded HTMLImageElement.
 */
export function loadCorsTileImage(tileUrl) {
  if (tileImageCache.has(tileUrl)) {
    return tileImageCache.get(tileUrl);
  }
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ ok: true, img });
    img.onerror = () => resolve({ ok: false, img: null });
    img.src = tileUrl;
  });
  tileImageCache.set(tileUrl, promise);
  return promise;
}

/**
 * Preloads GIBS tile images into browser/memory cache for smooth time-lapse playback.
 */
export function preloadGibsTiles(urls = []) {
  urls.forEach(url => {
    if (url && !tileImageCache.has(url)) {
      loadCorsTileImage(url);
    }
  });
}

/**
 * Samples the pixel value from a single GIBS tile at (pixelX, pixelY)
 * using an offscreen canvas with crossOrigin='anonymous'.
 */
export async function sampleTilePixel(tileUrl, pixelX, pixelY, colormap, layer) {
  const layerKey = layer?.id || layer?.gibsLayerId || 'default';
  const cacheKey = `${tileUrl}_${pixelX}_${pixelY}_${layerKey}_${colormap ? colormap.length : 0}`;
  if (pixelSampleCache.has(cacheKey)) {
    return pixelSampleCache.get(cacheKey);
  }

  const loaded = await loadCorsTileImage(tileUrl);
  if (!loaded.ok || !loaded.img) {
    return { value: null, isLuminance: false, label: 'Tile Missing / No Data', missingTile: true };
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(loaded.img, 0, 0);

    const pixelData = ctx.getImageData(pixelX, pixelY, 1, 1).data;
    const r = pixelData[0];
    const g = pixelData[1];
    const b = pixelData[2];
    const a = pixelData[3];

    if (a === 0) {
      const emptyRes = { value: null, isLuminance: false, label: 'Empty Tile / Clouds', r, g, b, emptyPixel: true };
      pixelSampleCache.set(cacheKey, emptyRes);
      return emptyRes;
    }

    const result = pixelToValue(r, g, b, colormap, layer);
    const finalRes = { ...result, r, g, b };
    pixelSampleCache.set(cacheKey, finalRes);
    return finalRes;
  } catch (err) {
    console.warn('Canvas pixel read error (CORS or canvas issue):', err);
    return { value: null, isLuminance: true, label: 'Sampling Unavailable', corsError: true };
  }
}
