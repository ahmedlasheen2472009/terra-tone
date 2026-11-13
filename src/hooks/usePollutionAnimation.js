import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { POLLUTION_STAGES, ALL_POLLUTION_ANIMATIONS, buildAnimationDates } from '../services/pollutionStages';
import {
  fetchGibsColormap,
  getGibsTileUrl,
  latLngToTileCoordinates,
  preloadGibsTiles,
  sampleTilePixel
} from '../services/gibsService';
import { fetchNasaPowerMonthlyMap } from '../services/nasaApi';
import { computeTimeSeriesStatistics } from '../utils/statistics';
import { mapValueToFrequency, playDataTone } from '../utils/audioUtils';

/**
 * Coordinates stage/animation state, verified GIBS frame time-lapse,
 * offscreen canvas pixel sampling, neighboring frame preloading,
 * paired NASA POWER monthly data, dynamic pentatonic sonification, and frame scanning.
 */
export function usePollutionAnimation({
  initialStageId = 'air',
  locationA,
  locationB,
  isCompareMode = false,
  mapZoom = 5,
  // Shared Audio props synced with App
  volume = 0.7,
  isMuted = false,
  instrument = 'sine',
  quantizeScale = true,
  unlockAudio = async () => true,
  onFrameChange = () => {}
}) {
  const [selectedStageId, setSelectedStageId] = useState(initialStageId);
  const [selectedAnimationId, setSelectedAnimationId] = useState(POLLUTION_STAGES[0].animations[0].id);
  const [cadence, setCadence] = useState('monthly'); // 'monthly' | 'yearly'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [gibsOpacity, setGibsOpacity] = useState(0.85);

  // Colormap + Pixel Series States (NO fake fallback — real errors trigger Retry UI)
  const [colormapData, setColormapData] = useState(null);
  const [colormapLoading, setColormapLoading] = useState(false);
  const [colormapError, setColormapError] = useState(null);

  const [samplesByDateA, setSamplesByDateA] = useState({});
  const [samplesByDateB, setSamplesByDateB] = useState({});
  const [samplingLoading, setSamplingLoading] = useState(false);
  const [samplingError, setSamplingError] = useState(null);

  // Paired NASA POWER monthly data (if animation has pairedPowerParam)
  const [powerData, setPowerData] = useState({
    loading: false,
    error: null,
    primaryMap: null,
    secondaryMap: null
  });

  // Scan Mode state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null);

  const [reloadNonce, setReloadNonce] = useState(0);

  const playbackTimerRef = useRef(null);
  const scanTimerRef = useRef(null);
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Derived active stage & animation
  const selectedStage = useMemo(
    () => POLLUTION_STAGES.find(s => s.id === selectedStageId) || POLLUTION_STAGES[0],
    [selectedStageId]
  );

  const selectedAnimation = useMemo(
    () => ALL_POLLUTION_ANIMATIONS.find(a => a.id === selectedAnimationId) || selectedStage.animations[0],
    [selectedAnimationId, selectedStage]
  );

  // Select Stage safely (switches selectedAnimation to first animation in stage)
  const selectStage = useCallback((stageId) => {
    const stage = POLLUTION_STAGES.find(s => s.id === stageId);
    if (!stage) return;
    setIsPlaying(false);
    setSelectedStageId(stage.id);
    setSelectedAnimationId(stage.animations[0].id);
    setCurrentIndex(0);
  }, []);

  // Select Animation safely
  const selectAnimation = useCallback((animId) => {
    const anim = ALL_POLLUTION_ANIMATIONS.find(a => a.id === animId);
    if (!anim) return;
    setIsPlaying(false);
    setSelectedStageId(anim.stageId);
    setSelectedAnimationId(anim.id);
    setCurrentIndex(0);
  }, []);

  // Verified date array for current animation & cadence
  const dates = useMemo(
    () => buildAnimationDates(selectedAnimation, cadence),
    [selectedAnimation, cadence]
  );

  // Keep currentIndex bounded when cadence/dates change
  useEffect(() => {
    if (dates.length > 0 && currentIndex >= dates.length) {
      setCurrentIndex(0);
    }
  }, [dates, currentIndex]);

  const currentDate = dates[currentIndex] || dates[0] || selectedAnimation.availableRange.end;

  // Retry trigger
  const retry = useCallback(() => {
    setReloadNonce(n => n + 1);
  }, []);

  // 1. Fetch GIBS Colormap XML v1.3 whenever selectedAnimation changes
  useEffect(() => {
    let cancelled = false;
    setColormapError(null);

    if (!selectedAnimation.colormapId) {
      setColormapData(null);
      setColormapLoading(false);
      return;
    }

    setColormapLoading(true);
    fetchGibsColormap(selectedAnimation)
      .then((cm) => {
        if (cancelled) return;
        if (!cm || cm.length === 0) {
          setColormapData(null);
          setColormapError(`Unable to load NASA GIBS colormap (${selectedAnimation.colormapId}).`);
        } else {
          setColormapData(cm);
          setColormapError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setColormapData(null);
          setColormapError(err?.message || 'Failed to fetch NASA GIBS colormap.');
        }
      })
      .finally(() => {
        if (!cancelled) setColormapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedAnimation, reloadNonce]);

  // 2. Fetch paired NASA POWER monthly data when animation defines pairedPowerParam
  useEffect(() => {
    if (!selectedAnimation.pairedPowerParam || !locationA) {
      setPowerData({ loading: false, error: null, primaryMap: null, secondaryMap: null });
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const firstYear = parseInt((dates[0] || '2020-01-01').slice(0, 4), 10);
    const lastYear = Math.min(2025, parseInt((dates[dates.length - 1] || '2025-01-01').slice(0, 4), 10));
    const startYr = Math.min(firstYear, lastYear);

    setPowerData(prev => ({ ...prev, loading: true, error: null }));

    const tasks = [
      fetchNasaPowerMonthlyMap(
        locationA.lat,
        locationA.lon,
        selectedAnimation.pairedPowerParam,
        startYr,
        lastYear,
        controller.signal
      )
    ];

    if (selectedAnimation.pairedPowerSecondaryParam) {
      tasks.push(
        fetchNasaPowerMonthlyMap(
          locationA.lat,
          locationA.lon,
          selectedAnimation.pairedPowerSecondaryParam,
          startYr,
          lastYear,
          controller.signal
        )
      );
    }

    Promise.all(tasks)
      .then(([primaryMap, secondaryMap]) => {
        if (!cancelled) {
          setPowerData({
            loading: false,
            error: null,
            primaryMap: primaryMap || null,
            secondaryMap: secondaryMap || null
          });
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError' || cancelled) return;
        setPowerData({
          loading: false,
          error: err?.message || 'Failed to fetch paired NASA POWER data.',
          primaryMap: null,
          secondaryMap: null
        });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedAnimation, locationA, dates, reloadNonce]);

  // 3. Preload neighboring GIBS tiles around currentIndex for smooth time-lapse playback
  useEffect(() => {
    if (!locationA || dates.length === 0) return;
    const z = Math.min(mapZoom, selectedAnimation.maxNativeZoom);
    const coordsA = latLngToTileCoordinates(locationA.lat, locationA.lon, z);
    const urls = [];

    [-1, 0, 1, 2].forEach(offset => {
      const idx = (currentIndex + offset + dates.length) % dates.length;
      const d = dates[idx];
      if (d) {
        urls.push(getGibsTileUrl(selectedAnimation, d, z, coordsA.tileY, coordsA.tileX));
        if (isCompareMode && locationB) {
          const coordsB = latLngToTileCoordinates(locationB.lat, locationB.lon, z);
          urls.push(getGibsTileUrl(selectedAnimation, d, z, coordsB.tileY, coordsB.tileX));
        }
      }
    });

    preloadGibsTiles(urls);
  }, [currentIndex, dates, selectedAnimation, locationA, locationB, isCompareMode, mapZoom]);

  // 4. Sample Location A (and Location B) pixel values across all frames in dates
  useEffect(() => {
    if (!locationA || dates.length === 0) return;
    if (selectedAnimation.colormapId && colormapLoading) return;

    let cancelled = false;
    setSamplingLoading(true);
    setSamplingError(null);
    setSamplesByDateA({});
    setSamplesByDateB({});

    const sampleZoom = Math.min(4, selectedAnimation.maxNativeZoom);

    async function runSampling() {
      const coordsA = latLngToTileCoordinates(locationA.lat, locationA.lon, sampleZoom);
      const coordsB = isCompareMode && locationB
        ? latLngToTileCoordinates(locationB.lat, locationB.lon, sampleZoom)
        : null;

      const resultsA = {};
      const resultsB = {};
      let corsFailures = 0;
      let missingCount = 0;

      // Batch requests in groups of 4 to avoid flooding GIBS
      const batchSize = 4;
      for (let i = 0; i < dates.length; i += batchSize) {
        if (cancelled) return;
        const batch = dates.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (dateStr) => {
            const tileUrlA = getGibsTileUrl(selectedAnimation, dateStr, sampleZoom, coordsA.tileY, coordsA.tileX);
            const resA = await sampleTilePixel(tileUrlA, coordsA.pixelX, coordsA.pixelY, colormapData, selectedAnimation);
            resultsA[dateStr] = resA;
            if (resA?.corsError) corsFailures++;
            if (resA?.missingTile) missingCount++;

            if (coordsB) {
              const tileUrlB = getGibsTileUrl(selectedAnimation, dateStr, sampleZoom, coordsB.tileY, coordsB.tileX);
              const resB = await sampleTilePixel(tileUrlB, coordsB.pixelX, coordsB.pixelY, colormapData, selectedAnimation);
              resultsB[dateStr] = resB;
            }
          })
        );
        if (!cancelled) {
          setSamplesByDateA({ ...resultsA });
          if (coordsB) setSamplesByDateB({ ...resultsB });
        }
      }

      if (cancelled) return;

      if (corsFailures > 0 && corsFailures === dates.length) {
        setSamplingError('CORS blocked reading GIBS satellite pixels from canvas.');
      } else if (missingCount === dates.length) {
        setSamplingError(`Failed to load GIBS tiles for ${selectedAnimation.gibsLayerId}. Check your network and click Retry.`);
      }
      setSamplingLoading(false);
    }

    runSampling().catch((err) => {
      if (!cancelled) {
        setSamplingError(err?.message || 'Error sampling satellite frames.');
        setSamplingLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedAnimation, dates, locationA, locationB, isCompareMode, colormapData, colormapLoading, reloadNonce]);

  // Build ordered frame series array & statistics for chart, table, insights, and sonification
  const { seriesA, seriesB, statsA, statsB, dynamicMin, dynamicMax, rawMin, rawMax } = useMemo(() => {
    const sA = dates.map((d, idx) => {
      const sample = samplesByDateA[d];
      const yyyymm = d.slice(0, 7).replace('-', '');
      const powerVal = powerData.primaryMap ? powerData.primaryMap[yyyymm] ?? null : null;
      const powerVal2 = powerData.secondaryMap ? powerData.secondaryMap[yyyymm] ?? null : null;
      return {
        index: idx,
        year: idx, // numeric x-axis for statistics helper
        date: d,
        value: sample?.value ?? null,
        label: sample?.label || 'No Data',
        sample,
        powerValue: powerVal,
        powerValueSecondary: powerVal2
      };
    });

    const sB = isCompareMode
      ? dates.map((d, idx) => {
          const sample = samplesByDateB[d];
          return {
            index: idx,
            year: idx,
            date: d,
            value: sample?.value ?? null,
            label: sample?.label || 'No Data',
            sample
          };
        })
      : [];

    const stA = computeTimeSeriesStatistics(sA);
    const stB = isCompareMode ? computeTimeSeriesStatistics(sB) : null;

    let allVals = sA.filter(p => p.value !== null && !isNaN(p.value)).map(p => p.value);
    if (isCompareMode) {
      allVals = allVals.concat(sB.filter(p => p.value !== null && !isNaN(p.value)).map(p => p.value));
    }

    let rMin = selectedAnimation.valueDomain?.min ?? 0;
    let rMax = selectedAnimation.valueDomain?.max ?? 100;
    let dMin = rMin;
    let dMax = rMax;

    if (allVals.length >= 2) {
      rMin = Math.min(...allVals);
      rMax = Math.max(...allVals);
      const span = rMax - rMin;
      const pad = span === 0 ? Math.max(0.05, Math.abs(rMin) * 0.1 || 1) : span * 0.08;
      dMin = parseFloat((rMin - pad).toFixed(3));
      dMax = parseFloat((rMax + pad).toFixed(3));
    } else if (allVals.length === 1) {
      rMin = Math.min(allVals[0], selectedAnimation.valueDomain?.min ?? allVals[0]);
      rMax = Math.max(allVals[0], selectedAnimation.valueDomain?.max ?? allVals[0]);
      dMin = rMin;
      dMax = rMax === rMin ? rMin + 1 : rMax;
    }

    return {
      seriesA: sA,
      seriesB: sB,
      statsA: stA,
      statsB: stB,
      dynamicMin: dMin,
      dynamicMax: dMax,
      rawMin: rMin,
      rawMax: rMax
    };
  }, [dates, samplesByDateA, samplesByDateB, isCompareMode, selectedAnimation, powerData]);

  const pitchMappingText = useMemo(() => {
    const u = selectedAnimation.unitEn;
    const fmt = (n) => (Math.abs(n) < 2 ? n.toFixed(3) : Math.abs(n) < 20 ? n.toFixed(2) : n.toFixed(1));
    return `${fmt(rawMin)} ${u} ➔ C3 (~131 Hz) | ${fmt(rawMax)} ${u} ➔ C6 (~1047 Hz)`;
  }, [rawMin, rawMax, selectedAnimation]);

  // Play Web Audio note(s) for frame at index idx
  const playFrameAudio = useCallback((idx) => {
    if (isMuted || volume === 0) return;
    const itemA = seriesA[idx];
    if (itemA && itemA.value !== null && !isNaN(itemA.value)) {
      const freqA = mapValueToFrequency(itemA.value, dynamicMin, dynamicMax, quantizeScale);
      const recA = statsA?.recordsMap?.[idx];
      playDataTone({
        frequency: freqA,
        duration: 0.45 / playbackSpeed,
        volume,
        instrument,
        pan: isCompareMode ? -0.75 : 0,
        isRecordHigh: !!recA?.isRecordHigh,
        isRecordLow: !!recA?.isRecordLow
      });
    }

    if (isCompareMode && seriesB[idx]) {
      const itemB = seriesB[idx];
      if (itemB.value !== null && !isNaN(itemB.value)) {
        const freqB = mapValueToFrequency(itemB.value, dynamicMin, dynamicMax, quantizeScale);
        const recB = statsB?.recordsMap?.[idx];
        playDataTone({
          frequency: freqB,
          duration: 0.45 / playbackSpeed,
          volume,
          instrument,
          pan: 0.75,
          isRecordHigh: !!recB?.isRecordHigh,
          isRecordLow: !!recB?.isRecordLow
        });
      }
    }
  }, [isMuted, volume, seriesA, seriesB, dynamicMin, dynamicMax, quantizeScale, statsA, statsB, playbackSpeed, instrument, isCompareMode]);

  const playSinglePixelValue = useCallback((value, pan = 0) => {
    if (isMuted || volume === 0 || value === null || isNaN(value)) return;
    const freq = mapValueToFrequency(value, dynamicMin, dynamicMax, quantizeScale);
    playDataTone({
      frequency: freq,
      duration: 0.35,
      volume: volume * 0.9,
      instrument,
      pan,
      isRecordHigh: false,
      isRecordLow: false
    });
  }, [isMuted, volume, dynamicMin, dynamicMax, quantizeScale, instrument]);

  const setFrameIndex = useCallback((idx, triggerSound = true, isManual = true) => {
    if (dates.length === 0) return;
    const clamped = Math.max(0, Math.min(dates.length - 1, idx));
    setCurrentIndex(clamped);
    onFrameChange(clamped, dates[clamped], seriesA[clamped], isManual, false);
    if (triggerSound) {
      unlockAudio().then(() => playFrameAudio(clamped));
    }
  }, [dates, seriesA, onFrameChange, unlockAudio, playFrameAudio]);

  const stepForward = useCallback(() => {
    if (dates.length === 0) return;
    const next = currentIndexRef.current >= dates.length - 1 ? 0 : currentIndexRef.current + 1;
    setFrameIndex(next, true, true);
  }, [dates.length, setFrameIndex]);

  const stepBackward = useCallback(() => {
    if (dates.length === 0) return;
    const prev = currentIndexRef.current <= 0 ? dates.length - 1 : currentIndexRef.current - 1;
    setFrameIndex(prev, true, true);
  }, [dates.length, setFrameIndex]);

  const togglePlay = useCallback(async () => {
    if (!isPlaying) {
      await unlockAudio();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      onFrameChange(currentIndexRef.current, dates[currentIndexRef.current], seriesA[currentIndexRef.current], false, true);
    }
  }, [isPlaying, unlockAudio, onFrameChange, dates, seriesA]);

  // Synchronized time-lapse playback loop
  useEffect(() => {
    if (!isPlaying || dates.length === 0) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const intervalMs = Math.round(950 / playbackSpeed);
    playFrameAudio(currentIndexRef.current);

    playbackTimerRef.current = setInterval(() => {
      let nextIdx = currentIndexRef.current + 1;
      if (nextIdx >= dates.length) {
        if (isLooping) {
          nextIdx = 0;
        } else {
          setIsPlaying(false);
          clearInterval(playbackTimerRef.current);
          return;
        }
      }
      setCurrentIndex(nextIdx);
      onFrameChange(nextIdx, dates[nextIdx], seriesA[nextIdx], false, false);
      playFrameAudio(nextIdx);
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, dates, playbackSpeed, isLooping, playFrameAudio, onFrameChange, seriesA]);

  // Scan the Frame (40-column stereo sweep left-to-right across viewport)
  const startFrameScan = useCallback(async (sampleColumnsFn) => {
    if (isScanning) return;
    await unlockAudio();

    setIsScanning(true);
    setScanProgress(0);

    const totalSteps = 40;
    const stepDurationMs = 60;
    let currentStep = 0;

    const columnValues = await sampleColumnsFn(totalSteps);
    const validVals = columnValues.filter(v => v !== null && !isNaN(v));
    const scanMin = validVals.length > 0 ? Math.min(...validVals) : dynamicMin;
    const scanMax = validVals.length > 0 ? Math.max(...validVals) : dynamicMax;

    scanTimerRef.current = setInterval(() => {
      if (currentStep >= totalSteps) {
        clearInterval(scanTimerRef.current);
        scanTimerRef.current = null;
        setIsScanning(false);
        setScanProgress(null);
        return;
      }

      const progress = currentStep / totalSteps;
      setScanProgress(progress);

      const val = columnValues[currentStep];
      if (val !== null && !isNaN(val) && !isMuted && volume > 0) {
        const pan = (progress - 0.5) * 1.6;
        const freq = mapValueToFrequency(val, scanMin, scanMax, quantizeScale);
        playDataTone({
          frequency: freq,
          duration: 0.12,
          volume: volume * 0.75,
          instrument,
          pan,
          isRecordHigh: false,
          isRecordLow: false
        });
      }
      currentStep++;
    }, stepDurationMs);
  }, [isScanning, unlockAudio, dynamicMin, dynamicMax, isMuted, volume, quantizeScale, instrument]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  const combinedError = colormapError || samplingError || null;

  return {
    selectedStageId,
    selectedStage,
    selectedAnimationId,
    selectedAnimation,
    selectStage,
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
    statsB,
    dynamicMin,
    dynamicMax,
    rawMin,
    rawMax,
    pitchMappingText,
    playSinglePixelValue,
    isScanning,
    scanProgress,
    startFrameScan,
    error: combinedError,
    retry
  };
}
