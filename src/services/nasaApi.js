/**
 * NASA POWER API Service
 * Endpoint: https://power.larc.nasa.gov/api/temporal/monthly/point
 * Fetches solar and meteorological data from 1990 to latest full calendar year.
 * Real data only: no synthetic or mock fallback datasets.
 */

export const VARIABLES = {
  T2M: {
    id: 'T2M',
    nameEn: 'Temperature (2m)',
    nameAr: 'درجة الحرارة (ارتفاع 2م)',
    unitEn: '°C',
    unitAr: 'م°',
    descriptionEn: 'Air temperature at 2 meters above the surface of the earth.',
    descriptionAr: 'درجة حرارة الهواء على ارتفاع مترين فوق سطح الأرض.',
    color: '#f97316', // Orange / Amber
    format: (val) => `${val.toFixed(1)}°C`
  },
  PRECTOTCORR: {
    id: 'PRECTOTCORR',
    nameEn: 'Precipitation',
    nameAr: 'هطول الأمطار',
    unitEn: 'mm/day',
    unitAr: 'ملم/يوم',
    descriptionEn: 'The bias-corrected average precipitation at the surface.',
    descriptionAr: 'متوسط هطول الأمطار المصحح عند السطح.',
    color: '#06b6d4', // Cyan
    format: (val) => `${val.toFixed(2)} mm/day`
  },
  RH2M: {
    id: 'RH2M',
    nameEn: 'Relative Humidity',
    nameAr: 'الرطوبة النسبية',
    unitEn: '%',
    unitAr: '٪',
    descriptionEn: 'Relative humidity at 2 meters above the surface of the earth.',
    descriptionAr: 'الرطوبة النسبية للهواء على ارتفاع مترين فوق سطح الأرض.',
    color: '#3b82f6', // Blue
    format: (val) => `${val.toFixed(1)}%`
  },
  ALLSKY_SFC_SW_DWN: {
    id: 'ALLSKY_SFC_SW_DWN',
    nameEn: 'Solar Radiation',
    nameAr: 'الإشعاع الشمسي',
    unitEn: 'kW-hr/m²/day',
    unitAr: 'ك.و.س/م²/يوم',
    descriptionEn: 'All Sky Surface Shortwave Downward Irradiance.',
    descriptionAr: 'الإشعاع الشمسي قصير الموجة الساقط على السطح لكل سماء.',
    color: '#eab308', // Gold / Yellow
    format: (val) => `${val.toFixed(2)} kW-hr/m²/day`
  }
};

export const PRESET_LOCATIONS = [
  {
    id: 'zagazig',
    nameEn: 'Zagazig',
    nameAr: 'الزقازيق',
    countryEn: 'Egypt',
    countryAr: 'مصر',
    lat: 30.5877,
    lon: 31.5020,
    region: 'Nile Delta'
  },
  {
    id: 'alexandria',
    nameEn: 'Alexandria',
    nameAr: 'الإسكندرية',
    countryEn: 'Egypt',
    countryAr: 'مصر',
    lat: 31.2001,
    lon: 29.9187,
    region: 'Mediterranean Coast'
  },
  {
    id: 'cairo',
    nameEn: 'Cairo',
    nameAr: 'القاهرة',
    countryEn: 'Egypt',
    countryAr: 'مصر',
    lat: 30.0444,
    lon: 31.2357,
    region: 'Capital Region'
  },
  {
    id: 'aswan',
    nameEn: 'Aswan',
    nameAr: 'أسوان',
    countryEn: 'Egypt',
    countryAr: 'مصر',
    lat: 24.0889,
    lon: 32.8998,
    region: 'Upper Egypt'
  }
];

export const START_YEAR = 1990;
// Dynamic END_YEAR: latest completed calendar year
export const END_YEAR = new Date().getFullYear() - 1;

// In-memory cache for API requests
const cache = new Map();

/**
 * Generate a deterministic cache key
 */
function getCacheKey(lat, lon, param, startYear, endYear) {
  return `${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}_${param}_${startYear}_${endYear}`;
}

/**
 * Fetch environmental data from NASA POWER API for a specific location and variable.
 * Only returns real data directly from NASA POWER. Drops -999 and invalid years.
 * Never displays synthetic data as real.
 * 
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @param {string} param Variable code (T2M, PRECTOTCORR, RH2M, ALLSKY_SFC_SW_DWN)
 * @param {number} startYear Start year (default: 1990)
 * @param {number} endYear End year (default: previous full year)
 * @param {AbortSignal} [externalSignal] Optional AbortSignal to cancel stale requests
 * @returns {Promise<{points: Array<{year: number, value: number}>, fromCache: boolean}>}
 */
export async function fetchNasaPowerData(lat, lon, param, startYear = START_YEAR, endYear = END_YEAR, externalSignal = null) {
  const cacheKey = getCacheKey(lat, lon, param, startYear, endYear);

  if (cache.has(cacheKey)) {
    return {
      points: cache.get(cacheKey),
      fromCache: true
    };
  }

  const roundedLat = parseFloat(Number(lat).toFixed(4));
  const roundedLon = parseFloat(Number(lon).toFixed(4));

  const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${param}&community=RE&longitude=${roundedLon}&latitude=${roundedLat}&start=${startYear}&end=${endYear}&format=JSON`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  // If external signal is passed, link it to abort controller
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NASA POWER API HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
    }

    const data = await response.json();
    const parameterData = data?.properties?.parameter?.[param];

    if (!parameterData || Object.keys(parameterData).length === 0) {
      throw new Error('No parameter data returned from NASA POWER for this location');
    }

    // Process valid annual values. Month 13 is annual aggregate, or average months 01-12
    const points = [];

    for (let yr = startYear; yr <= endYear; yr++) {
      const annualKey = `${yr}13`;
      let annualVal = parameterData[annualKey];

      // Missing or invalid value check (-999 is NASA POWER fill value)
      if (annualVal === undefined || annualVal === null || annualVal <= -900) {
        // Fallback to average of valid months 01..12
        let monthSum = 0;
        let monthCount = 0;
        for (let m = 1; m <= 12; m++) {
          const mKey = `${yr}${m < 10 ? '0' + m : m}`;
          const mVal = parameterData[mKey];
          if (mVal !== undefined && mVal !== null && mVal > -900) {
            monthSum += mVal;
            monthCount++;
          }
        }
        if (monthCount > 0) {
          annualVal = monthSum / monthCount;
        } else {
          continue; // drop missing / invalid year completely
        }
      }

      points.push({
        year: yr,
        value: parseFloat(annualVal.toFixed(2))
      });
    }

    if (points.length < 2) {
      throw new Error('Insufficient valid time series observations returned from NASA POWER');
    }

    // Save to cache
    cache.set(cacheKey, points);

    return {
      points,
      fromCache: false
    };

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw err;
    }
    console.error(`NASA POWER API request failed for (${roundedLat}, ${roundedLon}):`, err);
    throw err;
  }
}

/**
 * Verified NASA POWER parameters paired with Pollution Stages layers
 * Verified against https://power.larc.nasa.gov/api/system/manager/parameters?community=AG&temporal=monthly
 */
export const POLLUTION_POWER_PARAMETERS = {
  AOD_55: {
    id: 'AOD_55',
    community: 'AG',
    nameEn: 'Aerosol Optical Depth (550nm)',
    nameAr: 'العمق البصري للهباء الجوي (550 نانومتر)',
    unitEn: 'AOD',
    unitAr: 'بلا وحدة',
    format: (val) => `${Number(val).toFixed(3)}`
  },
  TO3: {
    id: 'TO3',
    community: 'AG',
    nameEn: 'Total Column Ozone',
    nameAr: 'إجمالي عمود الأوزون',
    unitEn: 'DU',
    unitAr: 'وحدة دوبسون',
    format: (val) => `${Number(val).toFixed(1)} DU`
  },
  GWETTOP: {
    id: 'GWETTOP',
    community: 'AG',
    nameEn: 'Surface Soil Wetness (0–5 cm)',
    nameAr: 'رطوبة التربة السطحية (0–5 سم)',
    unitEn: '0–1',
    unitAr: '0–1',
    format: (val) => `${Number(val).toFixed(3)}`
  },
  GWETROOT: {
    id: 'GWETROOT',
    community: 'AG',
    nameEn: 'Root Zone Soil Wetness (0–100 cm)',
    nameAr: 'رطوبة منطقة الجذور (0–100 سم)',
    unitEn: '0–1',
    unitAr: '0–1',
    format: (val) => `${Number(val).toFixed(3)}`
  },
  TS: {
    id: 'TS',
    community: 'AG',
    nameEn: 'Earth Skin Temperature',
    nameAr: 'حرارة سطح التربة (الجلد الأرضي)',
    unitEn: '°C',
    unitAr: 'م°',
    format: (val) => `${Number(val).toFixed(1)}°C`
  }
};

const monthlyPowerCache = new Map();

/**
 * Fetch monthly NASA POWER observations mapped by "YYYY-MM" key (plus annual "YYYY" fallback).
 * Real data only: drops -999 fill values and throws on API failure so UI can show Retry.
 */
export async function fetchNasaPowerMonthlyMap(lat, lon, param, startYear = 2000, endYear = END_YEAR, externalSignal = null) {
  const roundedLat = parseFloat(Number(lat).toFixed(4));
  const roundedLon = parseFloat(Number(lon).toFixed(4));
  const cacheKey = `m_${roundedLat}_${roundedLon}_${param}_${startYear}_${endYear}`;

  if (monthlyPowerCache.has(cacheKey)) {
    return monthlyPowerCache.get(cacheKey);
  }

  const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${param}&community=AG&longitude=${roundedLon}&latitude=${roundedLat}&start=${startYear}&end=${endYear}&format=JSON`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NASA POWER API HTTP ${response.status}: ${response.statusText || 'Request failed'}`);
    }

    const data = await response.json();
    const rawParam = data?.properties?.parameter?.[param];
    if (!rawParam || Object.keys(rawParam).length === 0) {
      throw new Error(`No NASA POWER data returned for ${param} at (${roundedLat}, ${roundedLon})`);
    }

    const byMonth = {};
    Object.entries(rawParam).forEach(([ymKey, val]) => {
      if (val !== undefined && val !== null && val > -900) {
        if (ymKey.length === 6) {
          const yr = ymKey.slice(0, 4);
          const mo = ymKey.slice(4, 6);
          if (mo !== '13') {
            byMonth[`${yr}-${mo}`] = parseFloat(Number(val).toFixed(4));
          }
        }
      }
    });

    monthlyPowerCache.set(cacheKey, byMonth);
    return byMonth;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw err;
    console.error(`NASA POWER monthly request failed for ${param}:`, err);
    throw err;
  }
}
