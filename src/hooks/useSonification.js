import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ensureAudioContextRunning,
  mapValueToFrequency,
  playDataTone,
  MIN_FREQ,
  MAX_FREQ
} from '../utils/audioUtils';
import { VARIABLES } from '../services/nasaApi';

/**
 * Custom hook for Web Audio API Sonification, synchronized timeline playback,
 * dynamic normalization, and frame scanning.
 */
export function useSonification({
  dataA = [],
  dataB = [],
  secondaryDataA = [],
  statsA = null,
  statsB = null,
  primaryVariable = 'T2M',
  secondaryVariable = null,
  isCompareMode = false,
  onYearChange = () => {}
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentYear, setCurrentYear] = useState(1990);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 0.5x, 1x, 1.5x, 2x
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [instrument, setInstrument] = useState('sine'); // 'sine', 'triangle', 'soft_pluck'
  const [quantizeScale, setQuantizeScale] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [audioActive, setAudioActive] = useState(false);

  // Scan frame state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(null); // null when not scanning, 0.0 to 1.0 when scanning

  const playbackTimerRef = useRef(null);
  const scanTimerRef = useRef(null);
  const currentYearRef = useRef(currentYear);
  currentYearRef.current = currentYear;

  // Initialize AudioContext on user interaction
  const unlockAudio = useCallback(async () => {
    const running = await ensureAudioContextRunning();
    setAudioActive(running);
    return running;
  }, []);

  // Dynamic Normalization: calculate min and max from the loaded series with padding
  const { dynamicMin, dynamicMax, rawMin, rawMax } = useMemo(() => {
    let vals = dataA
      .filter(d => d.value !== null && !isNaN(d.value))
      .map(d => d.value);

    if (isCompareMode && dataB && dataB.length > 0) {
      const valsB = dataB
        .filter(d => d.value !== null && !isNaN(d.value))
        .map(d => d.value);
      vals = vals.concat(valsB);
    }

    if (vals.length === 0) {
      const vMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;
      return { dynamicMin: 15, dynamicMax: 35, rawMin: 15, rawMax: 35 };
    }

    const rMin = Math.min(...vals);
    const rMax = Math.max(...vals);
    const diff = rMax - rMin;
    const padding = diff === 0 ? 1 : diff * 0.07; // 7% padding

    return {
      dynamicMin: parseFloat((rMin - padding).toFixed(2)),
      dynamicMax: parseFloat((rMax + padding).toFixed(2)),
      rawMin: rMin,
      rawMax: rMax
    };
  }, [dataA, dataB, isCompareMode, primaryVariable]);

  // Current pitch mapping description string
  const pitchMappingText = useMemo(() => {
    const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;
    const unit = varMeta.unitEn;
    return `${rawMin.toFixed(1)}${unit} ➔ C3 (~131 Hz) | ${rawMax.toFixed(1)}${unit} ➔ C6 (~1047 Hz)`;
  }, [rawMin, rawMax, primaryVariable]);

  // Play audio tone for a specific year
  const playYearTone = useCallback((yearToPlay) => {
    if (isMuted || volume === 0) return;

    const effectiveVolume = volume;

    // 1. Play Tone for Location A (Left or Center)
    const pointA = dataA.find(d => d.year === yearToPlay);
    if (pointA && pointA.value !== null && !isNaN(pointA.value)) {
      const freqA = mapValueToFrequency(pointA.value, dynamicMin, dynamicMax, quantizeScale);
      const recMetaA = statsA?.recordsMap?.[yearToPlay];

      // Second layer volume modulation if enabled
      let secVolumeMod = 1.0;
      if (secondaryVariable && secondaryVariable !== 'NONE' && secondaryDataA.length > 0) {
        const secPoint = secondaryDataA.find(d => d.year === yearToPlay);
        if (secPoint && secPoint.value !== null && !isNaN(secPoint.value)) {
          // Compute min and max for secondary variable
          const secVals = secondaryDataA.map(d => d.value);
          const sMin = Math.min(...secVals);
          const sMax = Math.max(...secVals);
          const normSec = (secPoint.value - sMin) / (sMax - sMin || 1);
          secVolumeMod = 0.5 + Math.max(0, Math.min(1, normSec));
        }
      }

      playDataTone({
        frequency: freqA,
        duration: 0.5 / playbackSpeed,
        volume: effectiveVolume,
        instrument,
        pan: isCompareMode ? -0.75 : 0, // Stereo Left for Location A in compare mode
        isRecordHigh: !!recMetaA?.isRecordHigh,
        isRecordLow: !!recMetaA?.isRecordLow,
        secondaryVolume: secVolumeMod
      });
    }

    // 2. Play Tone for Location B if in compare mode (Stereo Right)
    if (isCompareMode && dataB && dataB.length > 0) {
      const pointB = dataB.find(d => d.year === yearToPlay);
      if (pointB && pointB.value !== null && !isNaN(pointB.value)) {
        const freqB = mapValueToFrequency(pointB.value, dynamicMin, dynamicMax, quantizeScale);
        const recMetaB = statsB?.recordsMap?.[yearToPlay];

        playDataTone({
          frequency: freqB,
          duration: 0.5 / playbackSpeed,
          volume: effectiveVolume,
          instrument,
          pan: 0.75, // Stereo Right for Location B
          isRecordHigh: !!recMetaB?.isRecordHigh,
          isRecordLow: !!recMetaB?.isRecordLow,
          secondaryVolume: 1.0
        });
      }
    }
  }, [
    dataA,
    dataB,
    secondaryDataA,
    statsA,
    statsB,
    dynamicMin,
    dynamicMax,
    secondaryVariable,
    isCompareMode,
    isMuted,
    volume,
    instrument,
    quantizeScale,
    playbackSpeed
  ]);

  // Play a single note directly from a satellite frame pixel value
  const playFramePixelTone = useCallback((value, minVal = 0, maxVal = 100, pan = 0) => {
    if (isMuted || volume === 0 || value === null || isNaN(value)) return;
    const freq = mapValueToFrequency(value, minVal, maxVal, quantizeScale);
    playDataTone({
      frequency: freq,
      duration: 0.35,
      volume: volume * 0.9,
      instrument,
      pan,
      isRecordHigh: false,
      isRecordLow: false
    });
  }, [isMuted, volume, quantizeScale, instrument]);

  // Step to a specific year and trigger sound
  const setYear = useCallback((year, triggerSound = true) => {
    setCurrentYear(year);
    onYearChange(year, true); // true = manual step
    if (triggerSound) {
      unlockAudio().then(() => {
        playYearTone(year);
      });
    }
  }, [onYearChange, playYearTone, unlockAudio]);

  // Step 1 year backward
  const stepBackward = useCallback(() => {
    if (dataA.length === 0) return;
    const minYear = dataA[0].year;
    const maxYear = dataA[dataA.length - 1].year;
    const prevYear = currentYearRef.current <= minYear ? maxYear : currentYearRef.current - 1;
    setYear(prevYear, true);
  }, [dataA, setYear]);

  // Step 1 year forward
  const stepForward = useCallback(() => {
    if (dataA.length === 0) return;
    const minYear = dataA[0].year;
    const maxYear = dataA[dataA.length - 1].year;
    const nextYear = currentYearRef.current >= maxYear ? minYear : currentYearRef.current + 1;
    setYear(nextYear, true);
  }, [dataA, setYear]);

  // Toggle Play / Pause
  const togglePlay = useCallback(async () => {
    if (!isPlaying) {
      await unlockAudio();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      onYearChange(currentYearRef.current, false, true); // pause notification
    }
  }, [isPlaying, unlockAudio, onYearChange]);

  // Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Update speed
  const changeSpeed = useCallback((newSpeed) => {
    setPlaybackSpeed(Math.max(0.5, Math.min(3, newSpeed)));
  }, []);

  // Synchronized playback animation loop
  useEffect(() => {
    if (!isPlaying || dataA.length === 0) {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
      return;
    }

    const minYear = dataA[0].year;
    const maxYear = dataA[dataA.length - 1].year;
    const intervalMs = Math.round(1000 / playbackSpeed);

    // Play tone immediately for the current starting year
    playYearTone(currentYearRef.current);

    playbackTimerRef.current = setInterval(() => {
      let nextYear = currentYearRef.current + 1;
      if (nextYear > maxYear) {
        if (isLooping) {
          nextYear = minYear;
        } else {
          setIsPlaying(false);
          clearInterval(playbackTimerRef.current);
          return;
        }
      }

      setCurrentYear(nextYear);
      onYearChange(nextYear, false); // false = automated playback step
      playYearTone(nextYear);
    }, intervalMs);

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, dataA, playbackSpeed, isLooping, playYearTone, onYearChange]);

  // Reset to first year if data range changes
  useEffect(() => {
    if (dataA.length > 0) {
      const minYear = dataA[0].year;
      const maxYear = dataA[dataA.length - 1].year;
      if (currentYear < minYear || currentYear > maxYear) {
        setCurrentYear(minYear);
      }
    }
  }, [dataA]);

  /**
   * Scan Mode: Sweeps 40 columns across the frame, playing each column's value as a note
   * while updating scanProgress from 0.0 to 1.0.
   */
  const startFrameScan = useCallback(async (sampleColumnsFn) => {
    if (isScanning) return;
    await unlockAudio();

    setIsScanning(true);
    setScanProgress(0);

    const totalSteps = 40;
    const stepDurationMs = 60; // 60ms * 40 = ~2.4 seconds total sweep
    let currentStep = 0;

    // Get column values from caller
    const columnValues = await sampleColumnsFn(totalSteps);

    const validVals = columnValues.filter(v => v !== null && !isNaN(v));
    const scanMin = validVals.length > 0 ? Math.min(...validVals) : 0;
    const scanMax = validVals.length > 0 ? Math.max(...validVals) : 100;

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
        // Pan left-to-right as scan sweeps across map
        const pan = (progress - 0.5) * 1.6; // -0.8 to +0.8
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
  }, [isScanning, unlockAudio, isMuted, volume, quantizeScale, instrument]);

  // Clean up scan timer on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        clearInterval(scanTimerRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentYear,
    playbackSpeed,
    volume,
    isMuted,
    instrument,
    quantizeScale,
    isLooping,
    audioActive,
    dynamicMin,
    dynamicMax,
    rawMin,
    rawMax,
    pitchMappingText,
    isScanning,
    scanProgress,
    togglePlay,
    setYear,
    stepForward,
    stepBackward,
    setVolume,
    toggleMute,
    setInstrument,
    setQuantizeScale,
    setIsLooping,
    changeSpeed,
    unlockAudio,
    playYearTone,
    playFramePixelTone,
    startFrameScan
  };
}
