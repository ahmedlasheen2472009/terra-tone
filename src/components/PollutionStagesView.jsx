import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import {
  AlertCircle,
  AlertTriangle,
  BarChart2,
  Calendar,
  Crosshair,
  Download,
  FileJson,
  Film,
  Headphones,
  Info,
  Layers,
  MapPin,
  Music,
  Navigation,
  Package,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Scan,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Table as TableIcon,
  Volume2,
  VolumeX,
  Wind,
  Droplets,
  Sprout
} from 'lucide-react';
import {
  getGibsTileUrl,
  latLngToTileCoordinates,
  sampleTilePixel
} from '../services/gibsService';
import { POLLUTION_POWER_PARAMETERS } from '../services/nasaApi';
import {
  exportFramesAsZip,
  exportFramesAsWebM,
  exportFramesAsJson
} from '../utils/exportUtils';
import { translations } from '../utils/translations';

const STAGE_ICONS = {
  air: Wind,
  water: Droplets,
  soil: Sprout
};

export function PollutionStagesView({
  lang = 'en',
  pollution,
  locationA,
  onSelectLocationA,
  locationB,
  onSelectLocationB,
  isCompareMode,
  onToggleCompareMode,
  // Shared Audio props synced with App
  volume,
  onChangeVolume,
  isMuted,
  onToggleMute,
  instrument,
  onChangeInstrument,
  quantizeScale,
  onToggleQuantizeScale,
  onAnnounce
}) {
  const t = translations[lang] || translations.en;
  const {
    selectedStage,
    selectedAnimation,
    selectAnimation,
    cadence,
    setCadence,
    dates,
    currentIndex,
    currentDate,
    setFrameIndex,
    isPlaying,
    togglePlay,
    stepForward,
    stepBackward,
    playbackSpeed,
    setPlaybackSpeed,
    isLooping,
    setIsLooping,
    gibsOpacity,
    setGibsOpacity,
    colormapData,
    colormapLoading,
    samplingLoading,
    powerData,
    samplesByDateA,
    samplesByDateB,
    seriesA,
    seriesB,
    statsA,
    pitchMappingText,
    playSinglePixelValue,
    isScanning,
    scanProgress,
    startFrameScan,
    error,
    retry
  } = pollution;

  const [showTable, setShowTable] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeTarget, setActiveTarget] = useState('A');
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [isSamplingPoint, setIsSamplingPoint] = useState(false);
  const [manualSampleA, setManualSampleA] = useState(null);
  const [tileMissingCount, setTileMissingCount] = useState(0);

  // Spoken Explanation (Web Speech API)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Game Export States
  const [exportState, setExportState] = useState({
    active: null, // 'zip' | 'webm' | 'json' | null
    progress: null,
    error: null,
    successMsg: null
  });

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const gibsTileLayerRef = useRef(null);
  const gibsLayerAnimIdRef = useRef(null);
  const markerARef = useRef(null);
  const markerBRef = useRef(null);

  const currentSampleA = samplesByDateA[currentDate] || manualSampleA || seriesA[currentIndex]?.sample || null;
  const currentSampleB = isCompareMode ? (samplesByDateB[currentDate] || seriesB[currentIndex]?.sample || null) : null;

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initLat = locationA?.lat ?? selectedStage.presets[0]?.lat ?? 30.0444;
    const initLon = locationA?.lon ?? selectedStage.presets[0]?.lon ?? 31.2357;

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLon],
      zoom: selectedStage.defaultZoom || 4,
      minZoom: 2,
      maxZoom: 12,
      scrollWheelZoom: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap',
      subdomains: 'abcd',
      maxZoom: 19,
      crossOrigin: 'anonymous'
    }).addTo(map);

    mapInstanceRef.current = map;
    const timer = setTimeout(() => map.invalidateSize(), 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      gibsTileLayerRef.current = null;
      markerARef.current = null;
      markerBRef.current = null;
    };
  }, []);

  // ResizeObserver for Leaflet
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

  // Sync GIBS tile layer with selectedAnimation, currentDate, and gibsOpacity
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedAnimation || !currentDate) return;

    const urlPattern = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${selectedAnimation.gibsLayerId}/default/${currentDate}/${selectedAnimation.tileMatrixSet}/{z}/{y}/{x}.${selectedAnimation.ext}`;
    setTileMissingCount(0);

    if (
      gibsTileLayerRef.current &&
      gibsLayerAnimIdRef.current === selectedAnimation.id
    ) {
      gibsTileLayerRef.current.setOpacity(gibsOpacity);
      gibsTileLayerRef.current.setUrl(urlPattern);
      return;
    }

    if (gibsTileLayerRef.current) {
      map.removeLayer(gibsTileLayerRef.current);
      gibsTileLayerRef.current = null;
    }

    const layer = L.tileLayer(urlPattern, {
      attribution: 'NASA EOSDIS GIBS',
      maxNativeZoom: selectedAnimation.maxNativeZoom,
      maxZoom: 12,
      crossOrigin: 'anonymous',
      opacity: gibsOpacity,
      errorTileUrl: 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="rgba(15,23,42,0.45)"/><text x="50%" y="50%" fill="%2364748b" font-family="sans-serif" font-size="11" text-anchor="middle">No Satellite Data</text></svg>'
    });

    layer.on('tileerror', () => {
      setTileMissingCount(c => c + 1);
    });

    layer.addTo(map);
    gibsTileLayerRef.current = layer;
    gibsLayerAnimIdRef.current = selectedAnimation.id;
  }, [selectedAnimation, currentDate, gibsOpacity]);

  // Update Location A & B Markers on Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const makeIcon = (color, label) => L.divIcon({
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

    if (locationA) {
      const posA = [locationA.lat, locationA.lon];
      const badgeA = isCompareMode ? 'A' : '●';
      if (!markerARef.current) {
        markerARef.current = L.marker(posA, { icon: makeIcon('#38bdf8', badgeA) }).addTo(map);
      } else {
        markerARef.current.setLatLng(posA);
        markerARef.current.setIcon(makeIcon('#38bdf8', badgeA));
      }
      const nameA = lang === 'ar' ? (locationA.nameAr || locationA.nameEn) : locationA.nameEn;
      const valTextA = currentSampleA?.label || (samplingLoading ? '...' : 'No Data');
      markerARef.current.bindPopup(`
        <div style="font-family:inherit;font-size:13px;min-width:170px;">
          <div style="font-weight:800;color:#38bdf8;margin-bottom:4px;">${nameA} ${isCompareMode ? '(A)' : ''}</div>
          <div style="font-size:11px;color:#94a3b8;font-family:monospace;margin-bottom:4px;">${locationA.lat.toFixed(3)}°, ${locationA.lon.toFixed(3)}°</div>
          <div style="padding:4px 8px;background:rgba(56,189,248,0.15);border-radius:6px;font-weight:700;color:#f8fafc;">
            ${currentDate}: <span style="color:#38bdf8;">${valTextA}</span>
          </div>
        </div>
      `);
    }

    if (isCompareMode && locationB) {
      const posB = [locationB.lat, locationB.lon];
      if (!markerBRef.current) {
        markerBRef.current = L.marker(posB, { icon: makeIcon('#f97316', 'B') }).addTo(map);
      } else {
        markerBRef.current.setLatLng(posB);
        markerBRef.current.setIcon(makeIcon('#f97316', 'B'));
      }
      const nameB = lang === 'ar' ? (locationB.nameAr || locationB.nameEn) : locationB.nameEn;
      const valTextB = currentSampleB?.label || (samplingLoading ? '...' : 'No Data');
      markerBRef.current.bindPopup(`
        <div style="font-family:inherit;font-size:13px;min-width:170px;">
          <div style="font-weight:800;color:#f97316;margin-bottom:4px;">${nameB} (B)</div>
          <div style="font-size:11px;color:#94a3b8;font-family:monospace;margin-bottom:4px;">${locationB.lat.toFixed(3)}°, ${locationB.lon.toFixed(3)}°</div>
          <div style="padding:4px 8px;background:rgba(249,115,22,0.15);border-radius:6px;font-weight:700;color:#f8fafc;">
            ${currentDate}: <span style="color:#f97316;">${valTextB}</span>
          </div>
        </div>
      `);
    } else if (markerBRef.current) {
      map.removeLayer(markerBRef.current);
      markerBRef.current = null;
    }
  }, [locationA, locationB, isCompareMode, currentDate, currentSampleA, currentSampleB, samplingLoading, lang]);

  // Map click handler
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e) => {
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
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [isCompareMode, activeTarget, onSelectLocationA, onSelectLocationB]);

  // Preset click handler
  const handleSelectPreset = (preset) => {
    if (!isCompareMode || activeTarget === 'A') {
      onSelectLocationA(preset);
      if (isCompareMode) setActiveTarget('B');
    } else {
      onSelectLocationB(preset);
      setActiveTarget('A');
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lon], selectedStage.defaultZoom || 5, { duration: 0.7 });
    }
  };

  // GPS handler
  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsError(t.gpsError);
      return;
    }
    setIsGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLoading(false);
        const { latitude, longitude } = pos.coords;
        const gpsLoc = {
          id: 'gps_device',
          nameEn: `GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          nameAr: `موقع GPS (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
          lat: parseFloat(latitude.toFixed(4)),
          lon: parseFloat(longitude.toFixed(4))
        };
        if (!isCompareMode || activeTarget === 'A') {
          onSelectLocationA(gpsLoc);
        } else {
          onSelectLocationB(gpsLoc);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 6, { duration: 0.8 });
        }
      },
      () => {
        setIsGpsLoading(false);
        setGpsError(t.gpsError);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  // Point sonification directly from active frame canvas
  const handleSonifyPoint = async () => {
    if (!locationA) return;
    setIsSamplingPoint(true);
    try {
      const z = Math.min(mapInstanceRef.current?.getZoom() || 4, selectedAnimation.maxNativeZoom);
      const coordsA = latLngToTileCoordinates(locationA.lat, locationA.lon, z);
      const urlA = getGibsTileUrl(selectedAnimation, currentDate, z, coordsA.tileY, coordsA.tileX);
      const resA = await sampleTilePixel(urlA, coordsA.pixelX, coordsA.pixelY, colormapData, selectedAnimation);
      setManualSampleA(resA);

      if (resA?.value !== null && !isNaN(resA.value)) {
        playSinglePixelValue(resA.value, isCompareMode ? -0.75 : 0);
        onAnnounce?.(`${currentDate}: ${resA.label}`);
      }

      if (isCompareMode && locationB) {
        const coordsB = latLngToTileCoordinates(locationB.lat, locationB.lon, z);
        const urlB = getGibsTileUrl(selectedAnimation, currentDate, z, coordsB.tileY, coordsB.tileX);
        const resB = await sampleTilePixel(urlB, coordsB.pixelX, coordsB.pixelY, colormapData, selectedAnimation);
        if (resB?.value !== null && !isNaN(resB.value)) {
          playSinglePixelValue(resB.value, 0.75);
        }
      }
    } finally {
      setIsSamplingPoint(false);
    }
  };

  // Scan the frame 40 columns west-to-east
  const handleScanFrame = () => {
    const map = mapInstanceRef.current;
    if (!map || isScanning) return;

    startFrameScan(async (totalSteps) => {
      const b = map.getBounds();
      const west = b.getWest();
      const east = b.getEast();
      const centerLat = (b.getSouth() + b.getNorth()) / 2;
      const z = Math.min(map.getZoom(), selectedAnimation.maxNativeZoom);
      const vals = [];

      for (let i = 0; i < totalSteps; i++) {
        const lng = west + (east - west) * (i / (totalSteps - 1));
        const c = latLngToTileCoordinates(centerLat, lng, z);
        const u = getGibsTileUrl(selectedAnimation, currentDate, z, c.tileY, c.tileX);
        const res = await sampleTilePixel(u, c.pixelX, c.pixelY, colormapData, selectedAnimation);
        vals.push(res?.value ?? null);
      }
      return vals;
    });
  };

  // Chart.js configuration for sampled GIBS values (+ optional POWER overlay)
  const chartData = useMemo(() => {
    const labels = seriesA.map(item => item.date);
    const valsA = seriesA.map(item => item.value);

    const pointRadii = seriesA.map((item, idx) => {
      if (idx === currentIndex) return 7;
      if (statsA?.recordsMap?.[idx]?.isAllTimeMax || statsA?.recordsMap?.[idx]?.isAllTimeMin) return 5;
      return 3;
    });
    const pointBg = seriesA.map((item, idx) => {
      if (idx === currentIndex) return '#ffffff';
      if (statsA?.recordsMap?.[idx]?.isAllTimeMax) return '#ef4444';
      if (statsA?.recordsMap?.[idx]?.isAllTimeMin) return '#3b82f6';
      return '#38bdf8';
    });

    const datasets = [
      {
        label: `${lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : locationA?.nameEn} (${selectedAnimation.unitEn})`,
        data: valsA,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderWidth: 2.5,
        pointRadius: pointRadii,
        pointBackgroundColor: pointBg,
        pointBorderColor: '#0b0f19',
        pointBorderWidth: 1.5,
        tension: 0.25,
        spanGaps: true,
        fill: true
      }
    ];

    if (isCompareMode && seriesB.length > 0) {
      datasets.push({
        label: `${lang === 'ar' ? (locationB?.nameAr || locationB?.nameEn) : locationB?.nameEn} (${selectedAnimation.unitEn})`,
        data: seriesB.map(item => item.value),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.08)',
        borderWidth: 2.5,
        pointRadius: seriesB.map((_, idx) => (idx === currentIndex ? 7 : 3)),
        pointBackgroundColor: seriesB.map((_, idx) => (idx === currentIndex ? '#ffffff' : '#f97316')),
        tension: 0.25,
        spanGaps: true,
        fill: true
      });
    }

    // Add paired NASA POWER overlay if non-empty
    const hasPower = seriesA.some(p => p.powerValue !== null && !isNaN(p.powerValue));
    if (selectedAnimation.pairedPowerParam && hasPower) {
      const pMeta = POLLUTION_POWER_PARAMETERS[selectedAnimation.pairedPowerParam];
      datasets.push({
        label: `NASA POWER ${selectedAnimation.pairedPowerParam} (${pMeta?.unitEn || ''})`,
        data: seriesA.map(item => item.powerValue),
        borderColor: '#a855f7',
        borderDash: [5, 4],
        borderWidth: 2,
        pointRadius: 2,
        spanGaps: true,
        fill: false
      });
    }

    return { labels, datasets };
  }, [seriesA, seriesB, currentIndex, statsA, locationA, locationB, isCompareMode, selectedAnimation, lang]);

  const cursorPlugin = useMemo(() => ({
    id: 'pollutionCursorPlugin',
    afterDatasetsDraw(chart) {
      if (!seriesA || seriesA.length === 0) return;
      const ctx = chart.ctx;
      const xAxis = chart.scales.x;
      const yAxis = chart.scales.y;
      if (!xAxis || !yAxis) return;
      const xPos = xAxis.getPixelForTick(currentIndex);
      if (isNaN(xPos)) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(xPos, yAxis.top);
      ctx.lineTo(xPos, yAxis.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([4, 4]);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(xPos, yAxis.top, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }), [currentIndex, seriesA]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 180 },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e2e8f0',
          font: {
            family: lang === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif',
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: '#334155',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono, monospace', size: 11 },
          maxTicksLimit: 10
        }
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.3)' },
        ticks: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono, monospace', size: 11 },
          callback: (val) => `${val}`
        }
      }
    }
  }), [lang]);

  // CSV Download for accessible data table
  const handleDownloadCsv = () => {
    const headers = ['Index', 'Date', `${locationA?.nameEn || 'Location A'} (${selectedAnimation.unitEn})`];
    if (isCompareMode) headers.push(`${locationB?.nameEn || 'Location B'} (${selectedAnimation.unitEn})`);
    if (selectedAnimation.pairedPowerParam) headers.push(`NASA POWER ${selectedAnimation.pairedPowerParam}`);

    const rows = seriesA.map((item, idx) => {
      const r = [idx + 1, item.date, item.value ?? ''];
      if (isCompareMode) r.push(seriesB[idx]?.value ?? '');
      if (selectedAnimation.pairedPowerParam) r.push(item.powerValue ?? '');
      return r.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAnimation.id}_series.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Spoken Summary (Web Speech API)
  const spokenSummaryText = useMemo(() => {
    const locName = lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : (locationA?.nameEn || 'this location');
    const what = lang === 'ar' ? selectedAnimation.whatItIsAr : selectedAnimation.whatItIsEn;
    const why = lang === 'ar' ? selectedAnimation.whyItMattersAr : selectedAnimation.whyItMattersEn;
    const trend = lang === 'ar' ? selectedAnimation.whatTrendShowsAr : selectedAnimation.whatTrendShowsEn;

    let observed = '';
    if (statsA && statsA.n >= 2) {
      const highDate = dates[statsA.recordHigh?.year] || '';
      const lowDate = dates[statsA.recordLow?.year] || '';
      if (lang === 'ar') {
        observed = `في ${locName}، بلغ المتوسط ${statsA.mean.toFixed(2)} ${selectedAnimation.unitAr}. وسُجّلت أعلى قيمة (${statsA.max}) في ${highDate} وأدنى قيمة (${statsA.min}) في ${lowDate}.`;
      } else {
        observed = `At ${locName}, the sampled mean is ${statsA.mean.toFixed(2)} ${selectedAnimation.unitEn}, peaking at ${statsA.max} on ${highDate} and dipping to ${statsA.min} on ${lowDate}.`;
      }
    }
    return `${what} ${why} ${trend} ${observed}`;
  }, [lang, locationA, selectedAnimation, statsA, dates]);

  const handleToggleSpeech = () => {
    if (!speechSupported) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(spokenSummaryText);
    u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    u.rate = 0.98;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    return () => {
      if (speechSupported) window.speechSynthesis.cancel();
    };
  }, [selectedAnimation.id, speechSupported]);

  // Helper to get current Leaflet map bounds for export
  const getExportBounds = () => {
    const map = mapInstanceRef.current;
    if (map) {
      const b = map.getBounds();
      return {
        west: b.getWest(),
        east: b.getEast(),
        south: b.getSouth(),
        north: b.getNorth()
      };
    }
    return {
      west: (locationA?.lon ?? 31.2) - 18,
      east: (locationA?.lon ?? 31.2) + 18,
      south: (locationA?.lat ?? 30.0) - 12,
      north: (locationA?.lat ?? 30.0) + 12
    };
  };

  const handleExportZip = async () => {
    setExportState({ active: 'zip', progress: { current: 0, total: dates.length, date: '' }, error: null, successMsg: null });
    try {
      await exportFramesAsZip(
        selectedAnimation,
        dates,
        getExportBounds(),
        samplesByDateA,
        samplesByDateB,
        { opacity: gibsOpacity, lang, locationA, locationB, isCompareMode },
        (prog) => setExportState(s => ({ ...s, progress: prog }))
      );
      setExportState({
        active: null,
        progress: null,
        error: null,
        successMsg: lang === 'ar' ? `تم تصدير ${dates.length} إطار PNG في ملف ZIP بنجاح.` : `Downloaded ${dates.length} PNG frames + metadata in ZIP.`
      });
    } catch (err) {
      setExportState({
        active: null,
        progress: null,
        error: err?.message || 'ZIP export failed.',
        successMsg: null
      });
    }
  };

  const handleExportWebM = async () => {
    setExportState({ active: 'webm', progress: { current: 0, total: dates.length, date: '' }, error: null, successMsg: null });
    try {
      await exportFramesAsWebM(
        selectedAnimation,
        dates,
        getExportBounds(),
        samplesByDateA,
        samplesByDateB,
        { opacity: gibsOpacity, lang, locationA, locationB, isCompareMode },
        (prog) => setExportState(s => ({ ...s, progress: prog }))
      );
      setExportState({
        active: null,
        progress: null,
        error: null,
        successMsg: lang === 'ar' ? 'تم تسجيل وتنزيل فيديو WebM بنجاح.' : 'Recorded and downloaded WebM timelapse video.'
      });
    } catch (err) {
      setExportState({
        active: null,
        progress: null,
        error: err?.message || 'WebM export failed.',
        successMsg: null
      });
    }
  };

  const handleExportJson = () => {
    try {
      exportFramesAsJson(
        selectedAnimation,
        dates,
        locationA,
        locationB,
        isCompareMode,
        samplesByDateA,
        samplesByDateB,
        powerData.primaryMap
      );
      setExportState({
        active: null,
        progress: null,
        error: null,
        successMsg: lang === 'ar' ? 'تم تنزيل ملف JSON للتواريخ والقيم.' : 'Downloaded frame dates & values JSON.'
      });
    } catch (err) {
      setExportState({
        active: null,
        progress: null,
        error: err?.message || 'JSON export failed.',
        successMsg: null
      });
    }
  };

  const StageIcon = STAGE_ICONS[selectedStage.id] || Wind;

  return (
    <div className="pollution-stages-workspace">
      {/* Stage Hero Banner + 3 Animation Selector Cards */}
      <section className="card stage-selector-card" aria-labelledby="active-stage-heading">
        <div className="stage-header-row">
          <div className="stage-title-group">
            <div className="stage-icon-pill" style={{ borderColor: selectedStage.accentColor, color: selectedStage.accentColor }}>
              <StageIcon className="icon-md" aria-hidden="true" />
            </div>
            <div>
              <h2 id="active-stage-heading" className="card-title">
                {lang === 'ar' ? selectedStage.titleAr : selectedStage.titleEn}
              </h2>
              <p className="card-sub">
                {lang === 'ar' ? selectedStage.subtitleAr : selectedStage.subtitleEn}
              </p>
            </div>
          </div>

          <div className="cadence-toggle-group" role="group" aria-label={lang === 'ar' ? 'تردد الإطارات' : 'Time-Lapse Cadence'}>
            <button
              type="button"
              className={`btn-cadence ${cadence === 'monthly' ? 'active' : ''}`}
              onClick={() => setCadence('monthly')}
              aria-pressed={cadence === 'monthly'}
            >
              {lang === 'ar' ? 'شهري (2024–2026)' : 'Monthly Steps'}
            </button>
            <button
              type="button"
              className={`btn-cadence ${cadence === 'yearly' ? 'active' : ''}`}
              onClick={() => setCadence('yearly')}
              aria-pressed={cadence === 'yearly'}
            >
              {lang === 'ar' ? 'سنوي (متعدد السنوات)' : 'Yearly Steps'}
            </button>
          </div>
        </div>

        {/* Scientific Transparency Banner (Shown explicitly for Stage 3 Soil Indicators) */}
        {selectedStage.honestyBannerEn && (
          <div className="soil-honesty-banner" role="note">
            <AlertTriangle className="icon-sm text-gold" aria-hidden="true" />
            <p>
              {lang === 'ar' ? selectedStage.honestyBannerAr : selectedStage.honestyBannerEn}
            </p>
          </div>
        )}

        {/* 3 Animation Cards Grid */}
        <div className="animation-cards-grid" role="group" aria-label={lang === 'ar' ? 'الرسوم المتحركة الثلاثة في هذه المرحلة' : '3 NASA Data Animations in this Stage'}>
          {selectedStage.animations.map((anim, idx) => {
            const isActive = anim.id === selectedAnimation.id;
            return (
              <button
                key={anim.id}
                type="button"
                className={`animation-card-btn ${isActive ? 'active' : ''}`}
                onClick={() => selectAnimation(anim.id)}
                aria-pressed={isActive}
              >
                <div className="anim-card-top">
                  <span className="anim-card-num">#{idx + 1}</span>
                  <span className={`anim-badge ${anim.isProxy ? 'badge-proxy' : 'badge-direct'}`}>
                    {lang === 'ar' ? anim.proxyBadgeAr : anim.proxyBadgeEn}
                  </span>
                </div>
                <h3 className="anim-card-title">
                  {lang === 'ar' ? anim.titleAr : anim.titleEn}
                </h3>
                <div className="anim-card-meta">
                  <span className="anim-provider">{anim.provider}</span>
                  <span className="anim-range">
                    {anim.availableRange.start.slice(0, 7)} → {anim.availableRange.end.slice(0, 7)} • {lang === 'ar' ? anim.unitAr : anim.unitEn}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Loading & Real Error Banners (NO fake data) */}
      {(colormapLoading || samplingLoading || powerData.loading) && (
        <div className="loading-bar-wrap" role="status" aria-live="polite">
          <RefreshCw className="icon-sm spin" aria-hidden="true" />
          <span>
            {lang === 'ar'
              ? `جاري تحميل إطارات وألوان ناسا (${selectedAnimation.titleAr})...`
              : `Loading real NASA GIBS frames & pixel series (${selectedAnimation.gibsLayerId})...`}
          </span>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle className="icon" aria-hidden="true" />
          <div className="error-text">
            <strong>{lang === 'ar' ? 'خطأ في بيانات ناسا' : 'NASA Data Error'}: </strong>
            <span>{error}</span>
          </div>
          <button type="button" className="btn-retry" onClick={retry}>
            {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Primary Two-Column Grid: GIBS Map Time-Lapse + Chart / Table */}
      <div className="grid-two-columns">
        {/* LEFT: Interactive GIBS Time-Lapse Map */}
        <section className="card map-card" aria-labelledby="pollution-map-heading">
          <div className="card-header">
            <div className="card-title-group">
              <MapPin className="section-icon" aria-hidden="true" />
              <div>
                <h2 id="pollution-map-heading" className="card-title">
                  {lang === 'ar' ? selectedAnimation.titleAr : selectedAnimation.titleEn}
                </h2>
                <p className="card-sub">
                  {t.clickMapToSelect} • <code className="inline-layer-id">{selectedAnimation.gibsLayerId}</code>
                </p>
              </div>
            </div>

            <div className="compare-toggle-wrap">
              <label className="toggle-label" htmlFor="pollution-compare-checkbox">
                <input
                  id="pollution-compare-checkbox"
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

          {/* Stage Hotspot Presets & GPS */}
          <div className="presets-bar" role="group" aria-label={t.locationPresetLabel}>
            <button
              type="button"
              className={`preset-pill btn-gps-locate ${isGpsLoading ? 'loading' : ''}`}
              onClick={handleGetGps}
              aria-label={t.gpsBtn}
            >
              {isGpsLoading ? (
                <RefreshCw className="preset-icon spin" aria-hidden="true" />
              ) : (
                <Crosshair className="preset-icon icon-gps" aria-hidden="true" />
              )}
              <span>{isGpsLoading ? t.gpsLoading : t.gpsBtn}</span>
            </button>

            {selectedStage.presets.map((preset) => {
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
                >
                  <Navigation className="preset-icon" aria-hidden="true" />
                  <span>{name}</span>
                  {isA && <span className="pill-badge pill-a">{isCompareMode ? 'A' : '●'}</span>}
                  {isB && <span className="pill-badge pill-b">B</span>}
                </button>
              );
            })}
          </div>

          {gpsError && (
            <div className="gps-error-alert" role="alert">
              <AlertCircle className="icon-xs" aria-hidden="true" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* GIBS Toolbar: Frame Date, Legend, Opacity, Sonify Point & Scan */}
          <div className="gibs-controls-toolbar">
            <div className="gibs-toolbar-row">
              <div className="gibs-date-badge">
                <Calendar className="icon-xs text-orange" aria-hidden="true" />
                <span className="gibs-date-text">
                  {t.gibsDate}: <strong>{currentDate}</strong> ({currentIndex + 1}/{dates.length})
                </span>
              </div>

              {selectedAnimation.legendUrl ? (
                <button
                  type="button"
                  className={`btn-legend-toggle ${showLegend ? 'active' : ''}`}
                  onClick={() => setShowLegend(prev => !prev)}
                  aria-pressed={showLegend}
                >
                  <Info className="icon-xs" aria-hidden="true" />
                  <span>{t.toggleLegend}</span>
                </button>
              ) : (
                <span className="gibs-no-legend-tag">
                  {lang === 'ar' ? 'صور ألوان طبيعية (السطوع)' : 'True-Color Optical Reflectance'}
                </span>
              )}
            </div>

            <div className="gibs-sonify-actions-row">
              <button
                type="button"
                className={`btn-sonify-frame ${isSamplingPoint ? 'loading' : ''}`}
                onClick={handleSonifyPoint}
                disabled={isSamplingPoint}
              >
                <Music className="icon-sm" aria-hidden="true" />
                <span>{isSamplingPoint ? (lang === 'ar' ? 'جاري القراءة...' : 'Sampling...') : t.sonifyPixelBtn}</span>
              </button>

              <button
                type="button"
                className={`btn-scan-frame ${isScanning ? 'scanning' : ''}`}
                onClick={handleScanFrame}
                disabled={isScanning}
              >
                <Scan className="icon-sm" aria-hidden="true" />
                <span>{isScanning ? t.scanning : t.scanFrameBtn}</span>
              </button>

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

            {/* Live Sampled Pixel Output */}
            {currentSampleA && (
              <div className="sampled-pixel-callout" role="status">
                <div className="callout-header">
                  <span className="callout-title">
                    {t.framePixelSampled} ({lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : locationA?.nameEn}):
                  </span>
                  <span className="callout-val">{currentSampleA.label}</span>
                  {currentSampleA.r !== undefined && (
                    <span
                      className="rgb-chip"
                      style={{ backgroundColor: `rgb(${currentSampleA.r}, ${currentSampleA.g}, ${currentSampleA.b})` }}
                    >
                      RGB: {currentSampleA.r},{currentSampleA.g},{currentSampleA.b}
                    </span>
                  )}
                </div>
                <p className="callout-notice">
                  {currentSampleA.missingTile || currentSampleA.emptyPixel
                    ? (lang === 'ar' ? 'لا تتوفر بيانات قمر صناعي لهذه النقطة في هذا التاريخ (سحب أو فجوة مدارية).' : 'Cloud cover or orbital swath gap at this point on this frame date.')
                    : (currentSampleA.isLuminance ? t.luminanceNotice : t.colormapNotice)}
                </p>
              </div>
            )}

            {/* GIBS SVG Legend Drawer */}
            {showLegend && selectedAnimation.legendUrl && (
              <div className="gibs-legend-drawer">
                <div className="legend-img-wrap">
                  <img
                    src={selectedAnimation.legendUrl}
                    alt={`${selectedAnimation.titleEn} NASA GIBS Legend`}
                    className="gibs-legend-img"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Compare A/B Targeting Bar */}
          {isCompareMode && (
            <div className="compare-picker-bar" role="radiogroup" aria-label="Select target location">
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
              </button>
            </div>
          )}

          {/* Leaflet Map */}
          <div className="map-wrapper-relative">
            <div
              ref={mapContainerRef}
              className="map-container"
              tabIndex="0"
              aria-label={`NASA GIBS map for ${selectedAnimation.titleEn} on ${currentDate}`}
              role="region"
            />
            {isScanning && scanProgress !== null && (
              <div className="scan-laser-line" style={{ left: `${scanProgress * 100}%` }} aria-hidden="true">
                <div className="laser-beam"></div>
                <div className="laser-glow"></div>
              </div>
            )}
          </div>

          <div className="map-footer">
            <div className="frame-overlay-indicator">
              <span className="overlay-badge" style={{ backgroundColor: '#0284c7' }}>
                {lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : locationA?.nameEn}: {currentSampleA?.label || '—'}
              </span>
              {isCompareMode && locationB && (
                <span className="overlay-badge badge-b" style={{ backgroundColor: '#ea580c' }}>
                  {lang === 'ar' ? (locationB?.nameAr || locationB?.nameEn) : locationB?.nameEn}: {currentSampleB?.label || '—'}
                </span>
              )}
            </div>
            {tileMissingCount > 0 && (
              <span className="tile-gap-note">
                {lang === 'ar' ? 'بعض البلاطات بدون تغطية لهذا التاريخ' : 'Partial orbital/cloud tile gap'}
              </span>
            )}
          </div>
        </section>

        {/* RIGHT: Time-Series Chart or Accessible Data Table */}
        <section className="card chart-card" aria-labelledby="pollution-chart-heading">
          <div className="card-header">
            <div className="card-title-group">
              <Layers className="section-icon" aria-hidden="true" />
              <div>
                <h2 id="pollution-chart-heading" className="card-title">
                  {lang === 'ar' ? 'السلسلة الزمنية لقراءات الإطار' : 'Frame Pixel Time Series'} ({dates[0]?.slice(0, 7)} → {dates[dates.length - 1]?.slice(0, 7)})
                </h2>
                <p className="card-sub">
                  {selectedAnimation.provider} • {lang === 'ar' ? selectedAnimation.variableAr : selectedAnimation.variableEn}
                </p>
              </div>
            </div>

            <div className="view-toggle-wrap">
              <button
                type="button"
                className={`btn-toggle-view ${!showTable ? 'active' : ''}`}
                onClick={() => setShowTable(false)}
                aria-pressed={!showTable}
              >
                <BarChart2 className="icon-sm" aria-hidden="true" />
                <span>{t.chartView}</span>
              </button>
              <button
                type="button"
                className={`btn-toggle-view ${showTable ? 'active' : ''}`}
                onClick={() => setShowTable(true)}
                aria-pressed={showTable}
              >
                <TableIcon className="icon-sm" aria-hidden="true" />
                <span>{t.dataTableView}</span>
              </button>
            </div>
          </div>

          {!showTable ? (
            <>
              <div className="chart-canvas-wrapper" role="img" aria-label={`Line chart of sampled ${selectedAnimation.titleEn} values`}>
                <Line data={chartData} options={chartOptions} plugins={[cursorPlugin]} />
              </div>
              <div className="chart-highlights">
                <div className="highlight-pill highlight-current">
                  <span className="dot dot-white"></span>
                  <span className="label">{currentDate}: {currentSampleA?.label || '—'}</span>
                </div>
                {statsA?.recordHigh && (
                  <div className="highlight-pill highlight-high">
                    <span className="dot dot-red"></span>
                    <span className="label">
                      {t.recordHigh}: {statsA.recordHigh.value} {selectedAnimation.unitEn} ({dates[statsA.recordHigh.year]})
                    </span>
                  </div>
                )}
                {statsA?.recordLow && (
                  <div className="highlight-pill highlight-low">
                    <span className="dot dot-blue"></span>
                    <span className="label">
                      {t.recordLow}: {statsA.recordLow.value} {selectedAnimation.unitEn} ({dates[statsA.recordLow.year]})
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="pollution-table-panel">
              <div className="table-toolbar-row">
                <button type="button" className="btn-download-csv" onClick={handleDownloadCsv}>
                  <Download className="icon-xs" aria-hidden="true" />
                  <span>{t.downloadCsv}</span>
                </button>
              </div>
              <div className="table-scroll-container">
                <table className="accessible-data-table">
                  <caption className="sr-only">
                    {selectedAnimation.titleEn} values across {dates.length} dates
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">{lang === 'ar' ? 'التاريخ' : 'Frame Date'}</th>
                      <th scope="col">{lang === 'ar' ? 'الموقع أ' : 'Loc A'} ({selectedAnimation.unitEn})</th>
                      {isCompareMode && <th scope="col">{lang === 'ar' ? 'الموقع ب' : 'Loc B'}</th>}
                      {selectedAnimation.pairedPowerParam && (
                        <th scope="col">POWER {selectedAnimation.pairedPowerParam}</th>
                      )}
                      <th scope="col">{lang === 'ar' ? 'ملاحظة' : 'Notes'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesA.map((row, idx) => {
                      const isCurr = idx === currentIndex;
                      const rec = statsA?.recordsMap?.[idx];
                      return (
                        <tr
                          key={row.date}
                          className={`${isCurr ? 'current-row' : ''} ${rec?.isAllTimeMax ? 'row-record-high' : ''} ${rec?.isAllTimeMin ? 'row-record-low' : ''}`}
                          onClick={() => setFrameIndex(idx, true, true)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="mono-cell">{row.date}</td>
                          <td className="mono-cell">{row.value !== null ? row.value : '—'}</td>
                          {isCompareMode && (
                            <td className="mono-cell">{seriesB[idx]?.value !== null ? seriesB[idx].value : '—'}</td>
                          )}
                          {selectedAnimation.pairedPowerParam && (
                            <td className="mono-cell">{row.powerValue !== null ? row.powerValue : '—'}</td>
                          )}
                          <td>
                            {rec?.isAllTimeMax && <span className="badge-rec badge-high">{t.recordHigh}</span>}
                            {rec?.isAllTimeMin && <span className="badge-rec badge-low">{t.recordLow}</span>}
                            {row.sample?.emptyPixel && <span>{lang === 'ar' ? 'فجوة/سحب' : 'Cloud/Gap'}</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Secondary Row: Time-Lapse Scrubber + Audio Controls */}
      <div className="grid-two-columns">
        {/* Time-Lapse Timeline Controls */}
        <section className="card timeline-controls-card" aria-labelledby="pollution-timeline-heading">
          <div className="card-header">
            <div className="card-title-group">
              <Calendar className="section-icon" aria-hidden="true" />
              <div>
                <h2 id="pollution-timeline-heading" className="card-title">{t.timelineHeading}</h2>
                <p className="card-sub">
                  {lang === 'ar'
                    ? `${dates[0]} إلى ${dates[dates.length - 1]} (${dates.length} إطاراً)`
                    : `${dates[0]} to ${dates[dates.length - 1]} (${dates.length} frames)`}
                </p>
              </div>
            </div>

            <div className="current-year-badge" aria-live="off">
              <span className="year-label">{lang === 'ar' ? 'التاريخ' : 'Frame'}</span>
              <span className="year-number mono-frame-date">{currentDate}</span>
            </div>
          </div>

          <div className="slider-container">
            <input
              type="range"
              min="0"
              max={Math.max(0, dates.length - 1)}
              step="1"
              value={currentIndex}
              onChange={(e) => setFrameIndex(parseInt(e.target.value, 10), true, true)}
              className="timeline-slider"
              aria-label={lang === 'ar' ? 'شريط تمرير الإطارات الزمنية' : 'Scrub animation frame date'}
              aria-valuetext={`${currentDate}, ${currentSampleA?.label || 'No data'}`}
            />
            <div className="slider-ticks">
              <span>{dates[0]}</span>
              <span>{dates[Math.floor(dates.length / 2)]}</span>
              <span>{dates[dates.length - 1]}</span>
            </div>
          </div>

          <div className="controls-button-bar">
            <div className="playback-main-btns">
              <button type="button" className="btn-control btn-step" onClick={stepBackward} aria-label={t.stepBack}>
                <SkipBack className="icon" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`btn-control btn-play ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                aria-label={isPlaying ? t.pause : t.play}
              >
                {isPlaying ? <Pause className="icon-md" aria-hidden="true" /> : <Play className="icon-md" aria-hidden="true" />}
                <span>{isPlaying ? t.pause : t.play}</span>
              </button>
              <button type="button" className="btn-control btn-step" onClick={stepForward} aria-label={t.stepForward}>
                <SkipForward className="icon" aria-hidden="true" />
              </button>
            </div>

            <div className="speed-control-group">
              <span className="control-label">{t.speed}:</span>
              <div className="speed-pills" role="group" aria-label={t.speed}>
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    className={`btn-speed ${playbackSpeed === spd ? 'active' : ''}`}
                    onClick={() => setPlaybackSpeed(spd)}
                    aria-pressed={playbackSpeed === spd}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`btn-control btn-loop ${isLooping ? 'active' : ''}`}
              onClick={() => setIsLooping(p => !p)}
              aria-pressed={isLooping}
            >
              <Repeat className="icon-sm" aria-hidden="true" />
              <span>{t.loop}</span>
            </button>
          </div>
        </section>

        {/* Audio & Sonification Controls */}
        <section className="card audio-controls-card" aria-labelledby="pollution-audio-heading">
          <div className="card-header">
            <div className="card-title-group">
              <Music className="section-icon" aria-hidden="true" />
              <div>
                <h2 id="pollution-audio-heading" className="card-title">{t.audioHeading}</h2>
                <p className="card-sub">
                  {lang === 'ar' ? 'القيمة الأعلى = نغمة أعلى • تنبيهات الأرقام القياسية مفعلة' : 'Higher value = higher pitch • Record high/low chimes enabled'}
                </p>
              </div>
            </div>
            {isCompareMode && (
              <div className="stereo-badge" role="status">
                <Headphones className="icon-sm" aria-hidden="true" />
                <span>{t.spatialStereo} (L ⟷ R)</span>
              </div>
            )}
          </div>

          <div className="audio-controls-grid">
            {/* Volume */}
            <div className="control-group">
              <div className="control-label-row">
                <label htmlFor="pollution-volume-slider" className="control-label">
                  <Sliders className="icon-xs" aria-hidden="true" />
                  <span>{t.volume}</span>
                </label>
                <span className="control-value-text">{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
              </div>
              <div className="volume-slider-row">
                <button
                  type="button"
                  className={`btn-mute-sm ${isMuted ? 'muted' : ''}`}
                  onClick={onToggleMute}
                  aria-label={isMuted ? t.unmute : t.mute}
                >
                  {isMuted ? <VolumeX className="icon-sm" aria-hidden="true" /> : <Volume2 className="icon-sm" aria-hidden="true" />}
                </button>
                <input
                  id="pollution-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                />
              </div>
            </div>

            {/* Instrument */}
            <div className="control-group">
              <span className="control-label">{t.instrument}</span>
              <div className="instrument-button-group" role="radiogroup">
                {[
                  { id: 'sine', label: t.instrumentSine },
                  { id: 'triangle', label: t.instrumentTriangle },
                  { id: 'soft_pluck', label: t.instrumentPluck }
                ].map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    className={`btn-instrument ${instrument === inst.id ? 'active' : ''}`}
                    onClick={() => onChangeInstrument(inst.id)}
                    role="radio"
                    aria-checked={instrument === inst.id}
                  >
                    {inst.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Mode */}
            <div className="control-group">
              <span className="control-label">{t.musicalScale}</span>
              <div className="scale-toggle-wrap">
                <button
                  type="button"
                  className={`btn-scale-toggle ${quantizeScale ? 'active' : ''}`}
                  onClick={() => onToggleQuantizeScale(true)}
                  aria-pressed={quantizeScale}
                >
                  {t.scaleOn}
                </button>
                <button
                  type="button"
                  className={`btn-scale-toggle ${!quantizeScale ? 'active' : ''}`}
                  onClick={() => onToggleQuantizeScale(false)}
                  aria-pressed={!quantizeScale}
                >
                  {t.scaleOff}
                </button>
              </div>
            </div>
          </div>

          {pitchMappingText && (
            <div className="pitch-mapping-chip" role="status">
              <Sparkles className="icon-xs text-cyan" aria-hidden="true" />
              <span className="mapping-label">{t.pitchMappingLabel}</span>
              <code className="mapping-code">{pitchMappingText}</code>
            </div>
          )}
        </section>
      </div>

      {/* Plain-Language Bilingual Explanation + Spoken Summary */}
      <section className="card insights-panel-card" aria-labelledby="pollution-explanation-heading">
        <div className="card-header">
          <div className="card-title-group">
            <Info className="section-icon" aria-hidden="true" />
            <div>
              <h2 id="pollution-explanation-heading" className="card-title">
                {lang === 'ar' ? 'الشرح العلمي المبسط' : 'Plain-Language Guide & Trend Insights'}
              </h2>
              <p className="card-sub">
                {selectedAnimation.provider} • {lang === 'ar' ? selectedAnimation.proxyBadgeAr : selectedAnimation.proxyBadgeEn}
              </p>
            </div>
          </div>

          {speechSupported && (
            <button
              type="button"
              className={`btn-speech btn-speak-summary ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleToggleSpeech}
              aria-pressed={isSpeaking}
              aria-label={isSpeaking ? t.stopSpeakingBtn : t.readSummaryBtn}
            >
              {isSpeaking ? <VolumeX className="icon-sm" aria-hidden="true" /> : <Volume2 className="icon-sm" aria-hidden="true" />}
              <span>{isSpeaking ? t.stopSpeakingBtn : t.readSummaryBtn}</span>
            </button>
          )}
        </div>

        <div className="explanation-pillars-grid">
          <div className="explanation-pillar">
            <h3>{lang === 'ar' ? 'ما هو هذا المتغير؟' : 'What This Variable Is'}</h3>
            <p>{lang === 'ar' ? selectedAnimation.whatItIsAr : selectedAnimation.whatItIsEn}</p>
          </div>
          <div className="explanation-pillar">
            <h3>{lang === 'ar' ? 'لماذا يهمنا؟' : 'Why It Matters'}</h3>
            <p>{lang === 'ar' ? selectedAnimation.whyItMattersAr : selectedAnimation.whyItMattersEn}</p>
          </div>
          <div className="explanation-pillar">
            <h3>{lang === 'ar' ? 'ماذا يوضح الاتجاه؟' : 'What the Trend Shows'}</h3>
            <p>{lang === 'ar' ? selectedAnimation.whatTrendShowsAr : selectedAnimation.whatTrendShowsEn}</p>
          </div>
        </div>

        <div className="limitation-footnote">
          <strong>{lang === 'ar' ? 'الحدود العلمية:' : 'Data Limitation:'} </strong>
          <span>{lang === 'ar' ? selectedAnimation.limitationAr : selectedAnimation.limitationEn}</span>
        </div>
      </section>

      {/* Export for Game Card */}
      <section className="card export-game-card" aria-labelledby="export-game-heading">
        <div className="card-header">
          <div className="card-title-group">
            <Package className="section-icon text-gold" aria-hidden="true" />
            <div>
              <h2 id="export-game-heading" className="card-title">
                {lang === 'ar' ? 'تصدير للعبة (Export for Game)' : 'Export for Game'}
              </h2>
              <p className="card-sub">
                {lang === 'ar'
                  ? 'تنزيل إطارات الخريطة الحقيقية كصور PNG متسلسلة أو فيديو WebM وبيانات JSON لاستخدامها في مستويات اللعبة.'
                  : 'Download composite satellite frames as a PNG image sequence (ZIP), WebM timelapse video, plus JSON dates & values for game integration.'}
              </p>
            </div>
          </div>
        </div>

        <div className="export-actions-row">
          <button
            type="button"
            className="btn-export btn-export-zip"
            onClick={handleExportZip}
            disabled={!!exportState.active || dates.length === 0}
          >
            <Download className="icon-sm" aria-hidden="true" />
            <span>
              {exportState.active === 'zip'
                ? `${lang === 'ar' ? 'جاري التجهيز' : 'Rendering'} (${exportState.progress?.current || 0}/${exportState.progress?.total || dates.length})...`
                : (lang === 'ar' ? `تنزيل تسلسل صور PNG (ZIP • ${dates.length} إطار)` : `Export PNG Sequence (ZIP • ${dates.length} frames)`)}
            </span>
          </button>

          <button
            type="button"
            className="btn-export btn-export-webm"
            onClick={handleExportWebM}
            disabled={!!exportState.active || dates.length === 0}
          >
            <Film className="icon-sm" aria-hidden="true" />
            <span>
              {exportState.active === 'webm'
                ? `${lang === 'ar' ? 'جاري التسجيل' : 'Recording'} (${exportState.progress?.current || 0}/${exportState.progress?.total || dates.length})...`
                : (lang === 'ar' ? 'تسجيل فيديو WebM (Canvas Capture)' : 'Export WebM Video (Canvas Capture)')}
            </span>
          </button>

          <button
            type="button"
            className="btn-export btn-export-json"
            onClick={handleExportJson}
            disabled={!!exportState.active || dates.length === 0}
          >
            <FileJson className="icon-sm" aria-hidden="true" />
            <span>{lang === 'ar' ? 'تنزيل التواريخ والقيم (JSON)' : 'Download Dates & Values (JSON)'}</span>
          </button>
        </div>

        {exportState.active && exportState.progress && (
          <div className="export-progress-wrap" role="status" aria-live="polite">
            <div className="export-progress-bar">
              <div
                className="export-progress-fill"
                style={{ width: `${Math.round((exportState.progress.current / Math.max(1, exportState.progress.total)) * 100)}%` }}
              />
            </div>
            <span className="export-progress-label">
              {exportState.progress.date} ({exportState.progress.current} / {exportState.progress.total})
            </span>
          </div>
        )}

        {exportState.error && (
          <div className="error-banner" role="alert">
            <AlertCircle className="icon-sm" aria-hidden="true" />
            <span>{exportState.error}</span>
          </div>
        )}

        {exportState.successMsg && (
          <div className="export-success-banner" role="status">
            <span>{exportState.successMsg}</span>
          </div>
        )}
      </section>
    </div>
  );
}
