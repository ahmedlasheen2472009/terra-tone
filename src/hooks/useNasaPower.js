import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchNasaPowerData, PRESET_LOCATIONS, START_YEAR, END_YEAR } from '../services/nasaApi';
import { computeTimeSeriesStatistics } from '../utils/statistics';

/**
 * Custom hook to manage NASA POWER data fetching, caching, and statistics calculation.
 * Cancels stale requests via AbortController and strictly fetches Location B only when compare mode is active.
 */
export function useNasaPower({
  primaryVariable = 'T2M',
  secondaryVariable = null,
  locationA = PRESET_LOCATIONS[0],
  locationB = PRESET_LOCATIONS[1],
  isCompareMode = false
}) {
  const [dataA, setDataA] = useState([]);
  const [dataB, setDataB] = useState([]);
  const [secondaryDataA, setSecondaryDataA] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  // Load NASA POWER data with AbortController for stale cancellation
  const loadData = useCallback(async () => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Primary Variable for Location A
      const resA = await fetchNasaPowerData(
        locationA.lat,
        locationA.lon,
        primaryVariable,
        START_YEAR,
        END_YEAR,
        controller.signal
      );

      // If aborted in the meantime, ignore
      if (controller.signal.aborted) return;
      setDataA(resA.points || []);

      // 2. Fetch Primary Variable for Location B ONLY if compare mode is active
      if (isCompareMode && locationB) {
        const resB = await fetchNasaPowerData(
          locationB.lat,
          locationB.lon,
          primaryVariable,
          START_YEAR,
          END_YEAR,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setDataB(resB.points || []);
      } else {
        setDataB([]);
      }

      // 3. Fetch Secondary Variable for Location A if enabled
      if (secondaryVariable && secondaryVariable !== 'NONE') {
        const resSec = await fetchNasaPowerData(
          locationA.lat,
          locationA.lon,
          secondaryVariable,
          START_YEAR,
          END_YEAR,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setSecondaryDataA(resSec.points || []);
      } else {
        setSecondaryDataA([]);
      }

      // Reset error state on success
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled due to user switching locations, ignore
        return;
      }
      console.error('Error fetching NASA POWER data:', err);
      setError(err.message || 'Failed to load climate data from NASA POWER');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    locationA.lat,
    locationA.lon,
    // Only depend on locationB if compare mode is actually on
    isCompareMode ? locationB?.lat : null,
    isCompareMode ? locationB?.lon : null,
    primaryVariable,
    secondaryVariable,
    isCompareMode
  ]);

  useEffect(() => {
    loadData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData]);

  // Compute statistical metrics for Location A
  const statsA = useMemo(() => {
    return computeTimeSeriesStatistics(dataA);
  }, [dataA]);

  // Compute statistical metrics for Location B
  const statsB = useMemo(() => {
    if (!isCompareMode || dataB.length === 0) return null;
    return computeTimeSeriesStatistics(dataB);
  }, [isCompareMode, dataB]);

  // Available year range from actual returned points
  const years = useMemo(() => {
    if (dataA.length > 0) {
      return dataA.map(d => d.year);
    }
    const defaultYears = [];
    for (let yr = START_YEAR; yr <= END_YEAR; yr++) {
      defaultYears.push(yr);
    }
    return defaultYears;
  }, [dataA]);

  return {
    loading,
    error,
    dataA,
    dataB,
    secondaryDataA,
    statsA,
    statsB,
    years,
    refetch: loadData
  };
}
