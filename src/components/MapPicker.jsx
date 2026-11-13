import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PRESET_LOCATIONS, VARIABLES } from '../services/nasaApi';
import {
  GIBS_LAYERS,
  getGibsTileUrl,
  latLngToTileCoordinates,
  fetchGibsColormap,
  sampleTilePixel
} from '../services/gibsService';
import { translations } from '../utils/translations';
import {
  MapPin,
  Navigation,
  Crosshair,
  AlertCircle,
  RefreshCw,
  Layers,
  Calendar,
  Play,
  Pause,
  Music,
  Scan,
  Eye,
  Info
} from 'lucide-react';

/**
 * Interpolate color based on normalized value [0, 1]
 * Returns hex color from deep blue/cyan to gold to fiery red
 */
function getHeatColor(normalized) {
  const clamped = Math.max(0, Math.min(1, normalized));
  if (clamped < 0.25) {
    return '#06b6d4'; // Cyan
  } else if (clamped < 0.5) {
    return '#3b82f6'; // Blue
  } else if (clamped < 0.75) {
    return '#eab308'; // Amber/Gold
  } else {
    return '#ef4444'; // Red
  }
}

export function MapPicker({
  lang = 'en',
  locationA,
  onSelectLocationA,
  locationB,
  onSelectLocationB,
  isCompareMode,
  onToggleCompareMode,
  currentYear,
  dataA,
  dataB,
  primaryVariable,
  // Sonification hooks passed from App
  onPlayFramePixelTone,
  onStartFrameScan,
  isScanning = false,
  scanProgress = null
}) {
  const t = translations[lang] || translations.en;
  const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const gibsTileLayerRef = useRef(null);
  const markerARef = useRef(null);
  const markerBRef = useRef(null);
  const circleARef = useRef(null);
  const circleBRef = useRef(null);

  // Active target being set on click: 'A' or 'B'
  const [activeTarget, setActiveTarget] = useState('A');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // NASA GIBS States
  const [selectedGibsLayerId, setSelectedGibsLayerId] = useState(GIBS_LAYERS[0].id);
  const [gibsOpacity, setGibsOpacity] = useState(0.85);
  const [isGibsPlaying, setIsGibsPlaying] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [colormapData, setColormapData] = useState(null);

  // Frame Date: YYYY-MM-DD (defaults to currentYear-07-15 summer date or latest available)
  const [frameMonth, setFrameMonth] = useState('07');
  const [frameDay, setFrameDay] = useState('15');
  const frameDate = `${currentYear}-${frameMonth}-${frameDay}`;

  // Pixel Sampling State
  const [isSamplingPixel, setIsSamplingPixel] = useState(false);
  const [sampledPixelA, setSampledPixelA] = useState(null);
  const [sampledPixelB, setSampledPixelB] = useState(null);

  const selectedGibsLayer = useMemo(() => {
    return GIBS_LAYERS.find(l => l.id === selectedGibsLayerId) || GIBS_LAYERS[0];
  }, [selectedGibsLayerId]);

  // Load colormap when layer changes
  useEffect(() => {
    let isCancelled = false;
    fetchGibsColormap(selectedGibsLayer.id).then(cm => {
      if (!isCancelled) {
        setColormapData(cm);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [selectedGibsLayer.id]);

  // Heat overlay calculation for Location A and B
  const currentPointA = dataA?.find(d => d.year === currentYear);
  const currentValA = currentPointA?.value ?? 25;
  const normA = (currentValA - 10) / 30;
  const heatColorA = getHeatColor(normA);

  const currentPointB = dataB?.find(d => d.year === currentYear);
  const currentValB = currentPointB?.value ?? 25;
  const normB = (currentValB - 10) / 30;
  const heatColorB = getHeatColor(normB);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = locationA?.lat || 30.5877; // Zagazig
    const initialLon = locationA?.lon || 31.5020;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 7,
      minZoom: 2,
      maxZoom: 14,
      scrollWheelZoom: true,
      attributionControl: true
    });

    // Dark Matter Base Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Ensure map resizes smoothly
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update NASA GIBS Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing GIBS layer if present
    if (gibsTileLayerRef.current) {
      map.removeLayer(gibsTileLayerRef.current);
      gibsTileLayerRef.current = null;
    }

    // Build GIBS WMTS URL pattern
    const urlPattern = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${selectedGibsLayer.id}/default/${frameDate}/${selectedGibsLayer.tileMatrixSet}/{z}/{y}/{x}.${selectedGibsLayer.ext}`;

    const gibsLayer = L.tileLayer(urlPattern, {
      attribution: 'NASA EOSDIS GIBS',
      maxNativeZoom: selectedGibsLayer.maxNativeZoom,
      maxZoom: 18,
      crossOrigin: 'anonymous',
      opacity: gibsOpacity,
      errorTileUrl: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="rgba(15,23,42,0.6)"/><text x="50%" y="50%" fill="%2364748b" font-family="sans-serif" font-size="12" text-anchor="middle">No Satellite Data</text></svg>'
    });

    gibsLayer.addTo(map);
    gibsTileLayerRef.current = gibsLayer;

    // Preload next frame tile in background
    const nextYear = currentYear + 1 <= new Date().getFullYear() - 1 ? currentYear + 1 : currentYear;
    const preloadUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${selectedGibsLayer.id}/default/${nextYear}-${frameMonth}-${frameDay}/${selectedGibsLayer.tileMatrixSet}/6/32/38.${selectedGibsLayer.ext}`;
    const preloadImg = new Image();
    preloadImg.src = preloadUrl;

    return () => {
      if (gibsTileLayerRef.current && map) {
        map.removeLayer(gibsTileLayerRef.current);
        gibsTileLayerRef.current = null;
      }
    };
  }, [selectedGibsLayer, frameDate, gibsOpacity]);

  // Handle map click to pick custom coordinates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      const { lat, lng } = e.latlng;
      const customLoc = {
        id: `custom_${lat.toFixed(3)}_${lng.toFixed(3)}`,
        nameEn: `Custom (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
        nameAr: `نقطة (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
        lat: parseFloat(lat.toFixed(4)),
        lon: parseFloat(lng.toFixed(4)),
        isCustom: true
      };

      if (!isCompareMode || activeTarget === 'A') {
        onSelectLocationA(customLoc);
        if (isCompareMode) setActiveTarget('B');
      } else {
        onSelectLocationB(customLoc);
        setActiveTarget('A');
      }

      map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 });
      setTimeout(() => {
        if (activeTarget === 'B' && markerBRef.current) {
          markerBRef.current.openPopup();
        } else if (markerARef.current) {
          markerARef.current.openPopup();
        }
      }, 350);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isCompareMode, activeTarget, onSelectLocationA, onSelectLocationB]);

  // Update Markers, Popups, and Heat Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const createPinIcon = (color, label) => {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-pin-wrap" style="--pin-color: ${color}">
            <div class="marker-pin">
              <span class="marker-badge">${label}</span>
            </div>
          </div>
        `,
        iconSize: [36, 42],
        iconAnchor: [18, 42],
        popupAnchor: [0, -38]
      });
    };

    // Location A Marker & Popup
    if (locationA) {
      const latLngA = [locationA.lat, locationA.lon];
      const labelA = isCompareMode ? 'A' : '●';

      if (!markerARef.current) {
        markerARef.current = L.marker(latLngA, {
          icon: createPinIcon('#38bdf8', labelA)
        }).addTo(map);
      } else {
        markerARef.current.setLatLng(latLngA);
        markerARef.current.setIcon(createPinIcon('#38bdf8', labelA));
      }

      const locNameA = lang === 'ar' ? (locationA.nameAr || locationA.nameEn) : locationA.nameEn;
      const popupHtmlA = `
        <div style="font-family: inherit; font-size: 13px; min-width: 170px;">
          <div style="font-weight: 800; font-size: 14px; color: #38bdf8; margin-bottom: 4px;">
            📍 ${locNameA} ${isCompareMode ? '(Loc A)' : ''}
          </div>
          <div style="color: #94a3b8; font-size: 11px; font-family: monospace; margin-bottom: 6px;">
            ${locationA.lat.toFixed(4)}°, ${locationA.lon.toFixed(4)}°
          </div>
          <div style="padding: 4px 8px; background: rgba(56, 189, 248, 0.15); border-radius: 6px; font-weight: 700; color: #f8fafc;">
            ${t.year} ${currentYear}: <span style="color: #38bdf8;">${varMeta.format(currentValA)}</span>
          </div>
        </div>
      `;
      markerARef.current.bindPopup(popupHtmlA);

      // Heat Circle for Location A
      const radiusA = 22000 + normA * 45000;
      if (!circleARef.current) {
        circleARef.current = L.circle(latLngA, {
          radius: radiusA,
          color: heatColorA,
          fillColor: heatColorA,
          fillOpacity: 0.35,
          weight: 2
        }).addTo(map);
      } else {
        circleARef.current.setLatLng(latLngA);
        circleARef.current.setRadius(radiusA);
        circleARef.current.setStyle({
          color: heatColorA,
          fillColor: heatColorA
        });
      }
    }

    // Location B Marker & Popup (Compare Mode)
    if (isCompareMode && locationB) {
      const latLngB = [locationB.lat, locationB.lon];
      if (!markerBRef.current) {
        markerBRef.current = L.marker(latLngB, {
          icon: createPinIcon('#f97316', 'B')
        }).addTo(map);
      } else {
        markerBRef.current.setLatLng(latLngB);
        markerBRef.current.setIcon(createPinIcon('#f97316', 'B'));
      }

      const locNameB = lang === 'ar' ? (locationB.nameAr || locationB.nameEn) : locationB.nameEn;
      const popupHtmlB = `
        <div style="font-family: inherit; font-size: 13px; min-width: 170px;">
          <div style="font-weight: 800; font-size: 14px; color: #f97316; margin-bottom: 4px;">
            📍 ${locNameB} (Loc B)
          </div>
          <div style="color: #94a3b8; font-size: 11px; font-family: monospace; margin-bottom: 6px;">
            ${locationB.lat.toFixed(4)}°, ${locationB.lon.toFixed(4)}°
          </div>
          <div style="padding: 4px 8px; background: rgba(249, 115, 22, 0.15); border-radius: 6px; font-weight: 700; color: #f8fafc;">
            ${t.year} ${currentYear}: <span style="color: #f97316;">${varMeta.format(currentValB)}</span>
          </div>
        </div>
      `;
      markerBRef.current.bindPopup(popupHtmlB);

      const radiusB = 22000 + normB * 45000;
      if (!circleBRef.current) {
        circleBRef.current = L.circle(latLngB, {
          radius: radiusB,
          color: heatColorB,
          fillColor: heatColorB,
          fillOpacity: 0.35,
          weight: 2
        }).addTo(map);
      } else {
        circleBRef.current.setLatLng(latLngB);
        circleBRef.current.setRadius(radiusB);
        circleBRef.current.setStyle({
          color: heatColorB,
          fillColor: heatColorB
        });
      }
    } else {
      if (markerBRef.current) {
        map.removeLayer(markerBRef.current);
        markerBRef.current = null;
      }
      if (circleBRef.current) {
        map.removeLayer(circleBRef.current);
        circleBRef.current = null;
      }
    }
  }, [locationA, locationB, isCompareMode, normA, normB, heatColorA, heatColorB, currentYear, currentValA, currentValB, varMeta, lang, t]);

  // Preset button click
  const handleSelectPreset = (preset) => {
    if (!isCompareMode || activeTarget === 'A') {
      onSelectLocationA(preset);
      if (isCompareMode) setActiveTarget('B');
    } else {
      onSelectLocationB(preset);
      setActiveTarget('A');
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      mapInstanceRef.current.flyTo([preset.lat, preset.lon], 8, { duration: 0.9 });
    }

    setTimeout(() => {
      if (activeTarget === 'B' && markerBRef.current) {
        markerBRef.current.openPopup();
      } else if (markerARef.current) {
        markerARef.current.openPopup();
      }
    }, 450);
  };

  // GPS Device Geolocation handler
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError(t.gpsError);
      return;
    }

    setIsGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGpsLoading(false);
        const { latitude, longitude } = position.coords;
        const gpsLoc = {
          id: 'gps_device',
          nameEn: `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          nameAr: `موقع GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          lat: parseFloat(latitude.toFixed(4)),
          lon: parseFloat(longitude.toFixed(4)),
          isGps: true
        };

        if (!isCompareMode || activeTarget === 'A') {
          onSelectLocationA(gpsLoc);
          if (isCompareMode) setActiveTarget('B');
        } else {
          onSelectLocationB(gpsLoc);
          setActiveTarget('A');
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.flyTo([latitude, longitude], 9, { duration: 1.1 });
        }

        setTimeout(() => {
          if (markerARef.current) {
            markerARef.current.openPopup();
          }
        }, 500);
      },
      (err) => {
        setIsGpsLoading(false);
        console.warn('Geolocation error:', err);
        setGpsError(t.gpsError);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  /**
   * Point Mode: Read the pixel value under the selected marker from the currently displayed GIBS tile.
   * Draw tile on offscreen canvas and convert RGB to value using layer colormap or luminance.
   */
  const handleSonifyPoint = async () => {
    if (!locationA) return;
    setIsSamplingPixel(true);

    try {
      const zoom = Math.min(mapInstanceRef.current?.getZoom() || 6, selectedGibsLayer.maxNativeZoom);
      const coordsA = latLngToTileCoordinates(locationA.lat, locationA.lon, zoom);
      const tileUrlA = getGibsTileUrl(selectedGibsLayer.id, frameDate, zoom, coordsA.tileY, coordsA.tileX);

      const sampledA = await sampleTilePixel(
        tileUrlA,
        coordsA.pixelX,
        coordsA.pixelY,
        colormapData,
        selectedGibsLayer
      );
      setSampledPixelA(sampledA);

      if (sampledA?.value !== null && !isNaN(sampledA.value)) {
        // Play tone mapped to pitch
        const minVal = selectedGibsLayer.isTemperature ? 0 : 0;
        const maxVal = selectedGibsLayer.isTemperature ? 50 : 1;
        onPlayFramePixelTone?.(sampledA.value, minVal, maxVal, isCompareMode ? -0.75 : 0);
      }

      // If compare mode is active, sample location B too
      if (isCompareMode && locationB) {
        const coordsB = latLngToTileCoordinates(locationB.lat, locationB.lon, zoom);
        const tileUrlB = getGibsTileUrl(selectedGibsLayer.id, frameDate, zoom, coordsB.tileY, coordsB.tileX);
        const sampledB = await sampleTilePixel(
          tileUrlB,
          coordsB.pixelX,
          coordsB.pixelY,
          colormapData,
          selectedGibsLayer
        );
        setSampledPixelB(sampledB);

        if (sampledB?.value !== null && !isNaN(sampledB.value)) {
          const minVal = selectedGibsLayer.isTemperature ? 0 : 0;
          const maxVal = selectedGibsLayer.isTemperature ? 50 : 1;
          onPlayFramePixelTone?.(sampledB.value, minVal, maxVal, 0.75);
        }
      }
    } catch (err) {
      console.error('Error sampling frame pixel:', err);
    } finally {
      setIsSamplingPixel(false);
    }
  };

  /**
   * Scan Mode: Sweeps the visible map frame left to right across 40 columns.
   */
  const handleScanFrame = () => {
    const map = mapInstanceRef.current;
    if (!map || isScanning) return;

    onStartFrameScan?.(async (totalSteps) => {
      const bounds = map.getBounds();
      const west = bounds.getWest();
      const east = bounds.getEast();
      const south = bounds.getSouth();
      const north = bounds.getNorth();
      const zoom = Math.min(map.getZoom(), selectedGibsLayer.maxNativeZoom);

      const values = [];

      for (let step = 0; step < totalSteps; step++) {
        const lng = west + (east - west) * (step / (totalSteps - 1));
        // Sample center point of column
        const lat = south + (north - south) * 0.5;
        const coords = latLngToTileCoordinates(lat, lng, zoom);
        const tileUrl = getGibsTileUrl(selectedGibsLayer.id, frameDate, zoom, coords.tileY, coords.tileX);

        try {
          const res = await sampleTilePixel(tileUrl, coords.pixelX, coords.pixelY, colormapData, selectedGibsLayer);
          values.push(res?.value ?? 0);
        } catch {
          values.push(0);
        }
      }

      return values;
    });
  };

  return (
    <section className="card map-card" aria-labelledby="map-section-heading">
      <div className="card-header">
        <div className="card-title-group">
          <MapPin className="section-icon" aria-hidden="true" />
          <div>
            <h2 id="map-section-heading" className="card-title">{t.locationPresetLabel}</h2>
            <p className="card-sub">{t.clickMapToSelect}</p>
          </div>
        </div>

        {/* Compare Two Locations Toggle */}
        <div className="compare-toggle-wrap">
          <label className="toggle-label" htmlFor="compare-mode-checkbox">
            <input
              id="compare-mode-checkbox"
              type="checkbox"
              className="toggle-checkbox"
              checked={isCompareMode}
              onChange={(e) => onToggleCompareMode(e.target.checked)}
            />
            <span className="toggle-switch"></span>
            <span className="toggle-text">{t.compareModeLabel}</span>
          </label>
        </div>
      </div>

      {/* Preset Location & GPS Action Bar */}
      <div className="presets-bar" role="group" aria-label={t.locationPresetLabel}>
        {/* GPS Live Geolocation Button */}
        <button
          type="button"
          className={`preset-pill btn-gps-locate ${isGpsLoading ? 'loading' : ''}`}
          onClick={handleGetGpsLocation}
          aria-label={t.gpsBtn}
          title={t.gpsBtn}
        >
          {isGpsLoading ? (
            <RefreshCw className="preset-icon spin" aria-hidden="true" />
          ) : (
            <Crosshair className="preset-icon icon-gps" aria-hidden="true" />
          )}
          <span>{isGpsLoading ? t.gpsLoading : t.gpsBtn}</span>
        </button>

        {/* Location Presets: Zagazig, Alexandria, Cairo, Aswan */}
        {PRESET_LOCATIONS.map((preset) => {
          const isA = locationA?.id === preset.id;
          const isB = isCompareMode && locationB?.id === preset.id;
          const name = lang === 'ar' ? preset.nameAr : preset.nameEn;

          return (
            <button
              key={preset.id}
              type="button"
              className={`preset-pill ${isA ? 'active-a' : ''} ${isB ? 'active-b' : ''}`}
              onClick={() => handleSelectPreset(preset)}
              aria-pressed={isA || isB}
              title={`Open ${name}`}
            >
              <Navigation className="preset-icon" aria-hidden="true" />
              <span>{name}</span>
              {isA && <span className="pill-badge pill-a">{isCompareMode ? 'Loc A' : 'Open'}</span>}
              {isB && <span className="pill-badge pill-b">Loc B</span>}
            </button>
          );
        })}
      </div>

      {/* GPS Error Alert if Denied/Unavailable */}
      {gpsError && (
        <div className="gps-error-alert" role="alert">
          <AlertCircle className="icon-xs" aria-hidden="true" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* NASA GIBS Satellite Frame Viewer Controls Bar */}
      <div className="gibs-controls-toolbar">
        <div className="gibs-toolbar-row">
          <div className="gibs-layer-picker">
            <label htmlFor="gibs-layer-select" className="gibs-label">
              <Layers className="icon-xs text-cyan" aria-hidden="true" />
              <span>{t.gibsLayerSelect}</span>
            </label>
            <select
              id="gibs-layer-select"
              className="control-select gibs-select"
              value={selectedGibsLayerId}
              onChange={(e) => setSelectedGibsLayerId(e.target.value)}
            >
              {GIBS_LAYERS.map(l => (
                <option key={l.id} value={l.id}>
                  {lang === 'ar' ? l.nameAr : l.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="gibs-date-badge">
            <Calendar className="icon-xs text-orange" aria-hidden="true" />
            <span className="gibs-date-text">{t.gibsDate}: <strong>{frameDate}</strong></span>
          </div>

          {selectedGibsLayer.legendUrl && (
            <button
              type="button"
              className={`btn-legend-toggle ${showLegend ? 'active' : ''}`}
              onClick={() => setShowLegend(prev => !prev)}
              aria-pressed={showLegend}
            >
              <Info className="icon-xs" aria-hidden="true" />
              <span>{t.toggleLegend}</span>
            </button>
          )}
        </div>

        {/* Sonify Frame Actions: Point Sonification & Frame Scan */}
        <div className="gibs-sonify-actions-row">
          <button
            type="button"
            className={`btn-sonify-frame ${isSamplingPixel ? 'loading' : ''}`}
            onClick={handleSonifyPoint}
            disabled={isSamplingPixel}
            aria-label={t.sonifyPixelBtn}
          >
            <Music className="icon-sm" aria-hidden="true" />
            <span>{isSamplingPixel ? 'Reading Pixel...' : t.sonifyPixelBtn}</span>
          </button>

          <button
            type="button"
            className={`btn-scan-frame ${isScanning ? 'scanning' : ''}`}
            onClick={handleScanFrame}
            disabled={isScanning}
            aria-label={t.scanFrameBtn}
          >
            <Scan className="icon-sm" aria-hidden="true" />
            <span>{isScanning ? t.scanning : t.scanFrameBtn}</span>
          </button>

          {/* Opacity Slider */}
          <div className="opacity-slider-wrap">
            <span className="opacity-label">{t.gibsOpacity}:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={gibsOpacity}
              onChange={(e) => setGibsOpacity(parseFloat(e.target.value))}
              className="gibs-opacity-slider"
              aria-label={t.gibsOpacity}
            />
          </div>
        </div>

        {/* Display Sampled Pixel Information */}
        {sampledPixelA && (
          <div className="sampled-pixel-callout" role="status">
            <div className="callout-header">
              <span className="callout-title">{t.framePixelSampled} ({locationA?.nameEn}):</span>
              <span className="callout-val">{sampledPixelA.label}</span>
              {sampledPixelA.r !== undefined && (
                <span className="rgb-chip" style={{ backgroundColor: `rgb(${sampledPixelA.r}, ${sampledPixelA.g}, ${sampledPixelA.b})` }}>
                  RGB: {sampledPixelA.r},{sampledPixelA.g},{sampledPixelA.b}
                </span>
              )}
            </div>
            <p className="callout-notice">
              {sampledPixelA.isLuminance ? t.luminanceNotice : t.colormapNotice}
            </p>
          </div>
        )}

        {/* Layer Legend Drawer */}
        {showLegend && selectedGibsLayer.legendUrl && (
          <div className="gibs-legend-drawer">
            <div className="legend-img-wrap">
              <img
                src={selectedGibsLayer.legendUrl}
                alt={`${selectedGibsLayer.nameEn} Legend`}
                className="gibs-legend-img"
              />
            </div>
          </div>
        )}
      </div>

      {/* Comparison Targeting Bar */}
      {isCompareMode && (
        <div className="compare-picker-bar" role="radiogroup" aria-label="Select target location to set">
          <span className="picker-prompt">{lang === 'ar' ? 'تعديل الهدف بالنقر:' : 'Set target on click:'}</span>
          <button
            type="button"
            className={`btn-target ${activeTarget === 'A' ? 'selected' : ''}`}
            onClick={() => setActiveTarget('A')}
            aria-checked={activeTarget === 'A'}
            role="radio"
          >
            <span className="color-dot dot-a"></span>
            <span>{t.locationA}</span>
            <span className="target-coords">({locationA?.lat?.toFixed(2)}°, {locationA?.lon?.toFixed(2)}°)</span>
          </button>
          <button
            type="button"
            className={`btn-target ${activeTarget === 'B' ? 'selected' : ''}`}
            onClick={() => setActiveTarget('B')}
            aria-checked={activeTarget === 'B'}
            role="radio"
          >
            <span className="color-dot dot-b"></span>
            <span>{t.locationB}</span>
            <span className="target-coords">({locationB?.lat?.toFixed(2)}°, {locationB?.lon?.toFixed(2)}°)</span>
          </button>
        </div>
      )}

      {/* Leaflet Map Display with Animated Laser Scanning Line */}
      <div className="map-wrapper-relative">
        <div
          ref={mapContainerRef}
          className="map-container"
          tabIndex="0"
          aria-label="Interactive Leaflet map showing NASA GIBS satellite imagery frames and selected locations"
          role="region"
        />

        {/* Vertical Laser Scan Line Overlay in Scan Mode */}
        {isScanning && scanProgress !== null && (
          <div
            className="scan-laser-line"
            style={{ left: `${scanProgress * 100}%` }}
            aria-hidden="true"
          >
            <div className="laser-beam"></div>
            <div className="laser-glow"></div>
          </div>
        )}
      </div>

      {/* Map Footer & Dynamic Heat / Value Status */}
      <div className="map-footer">
        <div className="frame-overlay-indicator">
          <span className="overlay-badge" style={{ backgroundColor: heatColorA }}>
            {locationA?.nameEn}: {currentYear} {varMeta.format(currentValA)}
          </span>
          {isCompareMode && locationB && (
            <span className="overlay-badge badge-b" style={{ backgroundColor: heatColorB }}>
              {locationB?.nameEn}: {varMeta.format(currentValB)}
            </span>
          )}
        </div>
        <div className="map-legend">
          <span className="legend-gradient"></span>
          <span className="legend-label-low">{lang === 'ar' ? 'منخفض' : 'Low'}</span>
          <span className="legend-label-high">{lang === 'ar' ? 'مرتفع' : 'High'}</span>
        </div>
      </div>
    </section>
  );
}
