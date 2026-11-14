import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { OnboardingCard } from './components/OnboardingCard';
import { MapPicker } from './components/MapPicker';
import { TimelineChart } from './components/TimelineChart';
import { TimelineControls } from './components/TimelineControls';
import { AudioControls } from './components/AudioControls';
import { InsightsPanel } from './components/InsightsPanel';
import { DataTable } from './components/DataTable';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { AboutModal } from './components/AboutModal';
import { PollutionStagesView } from './components/PollutionStagesView';

import { useNasaPower } from './hooks/useNasaPower';
import { useSonification } from './hooks/useSonification';
import { usePollutionAnimation } from './hooks/usePollutionAnimation';
import { useSpeechSummary } from './hooks/useSpeechSummary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { PRESET_LOCATIONS, VARIABLES } from './services/nasaApi';
import { POLLUTION_STAGES } from './services/pollutionStages';
import { translations } from './utils/translations';
import { AlertCircle, RefreshCw, Wind, Droplets, Sprout, Thermometer } from 'lucide-react';

export default function App() {
  // 1. Accessibility & Globalization States
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('terra-tone-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [announceDuringPlayback, setAnnounceDuringPlayback] = useState(false);

  // Toggle Theme handler
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('terra-tone-theme', next);
      } catch {}
      return next;
    });
  }, []);

  // Top-level Mode Tab: 'air' | 'water' | 'soil' | 'temperature'
  const [activeMode, setActiveMode] = useState('air');

  // 2. Temperature / NASA POWER Variable & Location States (kept intact in its own tab)
  const [primaryVariable, setPrimaryVariable] = useState('T2M');
  const [secondaryVariable, setSecondaryVariable] = useState('NONE');
  const [locationA, setLocationA] = useState(PRESET_LOCATIONS[0]); // Zagazig
  const [locationB, setLocationB] = useState(PRESET_LOCATIONS[1]); // Alexandria
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Dedicated Location states for Pollution Stages (default to active stage hotspots)
  const [pollutionLocA, setPollutionLocA] = useState(POLLUTION_STAGES[0].presets[0]); // Cairo for Air stage
  const [pollutionLocB, setPollutionLocB] = useState(POLLUTION_STAGES[0].presets[1]); // Delhi
  const [pollutionCompare, setPollutionCompare] = useState(false);

  // Screen reader live status message
  const [srAnnouncement, setSrAnnouncement] = useState('');

  const t = translations[lang] || translations.en;
  const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;

  // Sync HTML lang and dir attributes for RTL/LTR
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  // Sync HTML / Body Theme & High Contrast attribute
  useEffect(() => {
    const activeTheme = isHighContrast ? 'high-contrast' : theme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.body.setAttribute('data-theme', activeTheme);
    const metaColor = document.getElementById('meta-theme-color');
    if (metaColor) {
      metaColor.setAttribute(
        'content',
        activeTheme === 'light' ? '#f1f5f9' : (activeTheme === 'high-contrast' ? '#000000' : '#070a13')
      );
    }
  }, [theme, isHighContrast]);

  // Sync Body Large Text attribute
  useEffect(() => {
    if (isLargeText) {
      document.body.setAttribute('data-font-size', 'large');
    } else {
      document.body.removeAttribute('data-font-size');
    }
  }, [isLargeText]);

  // 3. Fetch Real NASA POWER Data & Statistics for Temperature view
  const {
    loading,
    error,
    dataA,
    dataB,
    secondaryDataA,
    statsA,
    statsB,
    years,
    refetch
  } = useNasaPower({
    primaryVariable,
    secondaryVariable,
    locationA,
    locationB,
    isCompareMode
  });

  // Handle active playback year change and smart screen reader announcements
  const handleYearChange = useCallback((newYear, isManual = false, isPause = false) => {
    const shouldAnnounce = isManual || isPause || (announceDuringPlayback && newYear % 5 === 0);
    if (!shouldAnnounce) return;

    const pointA = dataA.find(d => d.year === newYear);
    const rec = statsA?.recordsMap?.[newYear];
    let recordText = '';
    if (rec?.isAllTimeMax) recordText = lang === 'ar' ? 'أعلى رقم قياسي على الإطلاق!' : 'All-time record high!';
    if (rec?.isAllTimeMin) recordText = lang === 'ar' ? 'أدنى رقم قياسي على الإطلاق!' : 'All-time record low!';

    if (pointA) {
      const msg = lang === 'ar'
        ? `سنة ${newYear}، ${varMeta.nameAr}: ${pointA.value} ${varMeta.unitAr}. ${recordText}`
        : `Year ${newYear}, ${varMeta.nameEn}: ${pointA.value} ${varMeta.unitEn}. ${recordText}`;
      setSrAnnouncement(msg);
    }
  }, [dataA, statsA, varMeta, lang, announceDuringPlayback]);

  // 4. Shared Sonification Engine Hook (also provides shared audio controls across tabs)
  const {
    isPlaying,
    currentYear,
    playbackSpeed,
    volume,
    isMuted,
    instrument,
    quantizeScale,
    isLooping,
    audioActive,
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
    playFramePixelTone,
    startFrameScan
  } = useSonification({
    dataA,
    dataB,
    secondaryDataA,
    statsA,
    statsB,
    primaryVariable,
    secondaryVariable,
    isCompareMode,
    onYearChange: handleYearChange
  });

  // 4b. Pollution Stages Hook (3 stages x 3 animations)
  const handlePollutionFrameChange = useCallback((idx, dateStr, item, isManual, isPause) => {
    const shouldAnnounce = isManual || isPause || (announceDuringPlayback && idx % 6 === 0);
    if (!shouldAnnounce || !dateStr) return;
    const valStr = item?.label || '';
    setSrAnnouncement(
      lang === 'ar'
        ? `تاريخ الإطار ${dateStr}${valStr ? `: ${valStr}` : ''}`
        : `Frame ${dateStr}${valStr ? `: ${valStr}` : ''}`
    );
  }, [announceDuringPlayback, lang]);

  const pollution = usePollutionAnimation({
    initialStageId: 'air',
    locationA: pollutionLocA,
    locationB: pollutionLocB,
    isCompareMode: pollutionCompare,
    volume,
    isMuted,
    instrument,
    quantizeScale,
    unlockAudio,
    onFrameChange: handlePollutionFrameChange
  });

  // Switch top-level tab between Air / Water / Soil / Temperature
  const handleSelectModeTab = useCallback((mode) => {
    setActiveMode(mode);
    if (mode === 'air' || mode === 'water' || mode === 'soil') {
      pollution.selectStage(mode);
      const st = POLLUTION_STAGES.find(s => s.id === mode);
      if (st?.presets?.length) {
        setPollutionLocA(st.presets[0]);
        setPollutionLocB(st.presets[1] || st.presets[0]);
      }
      if (isPlaying) togglePlay();
    } else if (pollution.isPlaying) {
      pollution.togglePlay();
    }
  }, [pollution, isPlaying, togglePlay]);

  // 5. Spoken Summary (Web Speech API) for Temperature view
  const {
    isSpeaking,
    speechSupported,
    speakSummary,
    stopSpeaking,
    summaryText
  } = useSpeechSummary({
    language: lang,
    statsA,
    locationA,
    primaryVariable,
    isCompareMode,
    locationB,
    statsB
  });

  // 6. Global Keyboard Shortcuts routed to active tab
  const isPollutionMode = activeMode !== 'temperature';
  useKeyboardShortcuts({
    onTogglePlay: isPollutionMode ? pollution.togglePlay : togglePlay,
    onStepBackward: isPollutionMode ? pollution.stepBackward : stepBackward,
    onStepForward: isPollutionMode ? pollution.stepForward : stepForward,
    onIncreaseSpeed: () => {
      if (isPollutionMode) {
        const nextSpd = pollution.playbackSpeed >= 2 ? 0.5 : pollution.playbackSpeed + 0.5;
        pollution.setPlaybackSpeed(nextSpd);
      } else {
        changeSpeed(playbackSpeed >= 2 ? 0.5 : playbackSpeed + 0.5);
      }
    },
    onDecreaseSpeed: () => {
      if (isPollutionMode) {
        const prevSpd = pollution.playbackSpeed <= 0.5 ? 2 : pollution.playbackSpeed - 0.5;
        pollution.setPlaybackSpeed(prevSpd);
      } else {
        changeSpeed(playbackSpeed <= 0.5 ? 2 : playbackSpeed - 0.5);
      }
    },
    onToggleMute: toggleMute,
    onToggleHelpModal: () => setIsShortcutsModalOpen(prev => !prev),
    onCloseModal: () => {
      setIsShortcutsModalOpen(false);
      setIsAboutModalOpen(false);
    }
  });

  const stageTabs = [
    { id: 'air', label: t.modeAirTab, count: '3', icon: Wind, accent: 'cyan' },
    { id: 'water', label: t.modeWaterTab, count: '3', icon: Droplets, accent: 'emerald' },
    { id: 'soil', label: t.modeSoilTab, count: '3', icon: Sprout, accent: 'gold' },
    { id: 'temperature', label: t.modeTemperatureTab, count: 'POWER', icon: Thermometer, accent: 'orange' }
  ];

  return (
    <div className={`earth-jukebox-app ${lang === 'ar' ? 'font-arabic' : 'font-latin'}`}>
      {/* Dynamic Accessible Skip Link */}
      <a href="#main-content" className="skip-to-content">
        {t.skipToContent}
      </a>

      {/* Screen Reader Announcements Live Region */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {srAnnouncement}
      </div>

      {/* Header & Global Bar */}
      <Header
        lang={lang}
        onToggleLang={() => setLang(prev => (prev === 'en' ? 'ar' : 'en'))}
        theme={theme}
        onToggleTheme={toggleTheme}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(prev => !prev)}
        isLargeText={isLargeText}
        onToggleLargeText={() => setIsLargeText(prev => !prev)}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        audioActive={audioActive}
        onUnlockAudio={unlockAudio}
        announceDuringPlayback={announceDuringPlayback}
        onToggleAnnounceDuringPlayback={() => setAnnounceDuringPlayback(prev => !prev)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
      />

      {/* Main Content Area */}
      <main id="main-content" className="main-content container">
        {/* Stage & Feature Mode Selector Tabs */}
        <nav className="stage-tabs-bar" aria-label={lang === 'ar' ? 'مراحل التلوث وبيانات المناخ' : 'Pollution Stages and Climate View Tabs'}>
          {stageTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`stage-tab-btn stage-accent-${tab.accent} ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectModeTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="icon-sm" aria-hidden="true" />
                <span className="stage-tab-label">{tab.label}</span>
                <span className="stage-tab-count">{tab.count}</span>
              </button>
            );
          })}
        </nav>

        {activeMode !== 'temperature' ? (
          <PollutionStagesView
            lang={lang}
            theme={theme}
            pollution={pollution}
            locationA={pollutionLocA}
            onSelectLocationA={setPollutionLocA}
            locationB={pollutionLocB}
            onSelectLocationB={setPollutionLocB}
            isCompareMode={pollutionCompare}
            onToggleCompareMode={setPollutionCompare}
            volume={volume}
            onChangeVolume={setVolume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            instrument={instrument}
            onChangeInstrument={setInstrument}
            quantizeScale={quantizeScale}
            onToggleQuantizeScale={setQuantizeScale}
            onAnnounce={setSrAnnouncement}
          />
        ) : (
          <>
            {/* Onboarding Guide Card (3 Steps) */}
            <OnboardingCard lang={lang} />

            {/* Global Loading Spinner */}
            {loading && (
              <div className="loading-bar-wrap" role="status" aria-live="polite">
                <RefreshCw className="icon-sm spin" aria-hidden="true" />
                <span>{lang === 'ar' ? 'جاري جلب بيانات وكالة ناسا...' : 'Fetching NASA POWER climate series...'}</span>
              </div>
            )}

            {/* Error Banner with Retry Button */}
            {error && (
              <div className="error-banner" role="alert">
                <AlertCircle className="icon" aria-hidden="true" />
                <div className="error-text">
                  <strong>{lang === 'ar' ? 'خطأ في الاتصال' : 'Connection Error'}: </strong>
                  <span>{error}</span>
                </div>
                <button type="button" className="btn-retry" onClick={refetch}>
                  {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            )}

            {/* Primary Row: Map (NASA GIBS Frame Viewer) & Timeline Chart */}
            <div className="grid-two-columns">
              <MapPicker
                lang={lang}
                theme={theme}
                locationA={locationA}
                onSelectLocationA={setLocationA}
                locationB={locationB}
                onSelectLocationB={setLocationB}
                isCompareMode={isCompareMode}
                onToggleCompareMode={setIsCompareMode}
                currentYear={currentYear}
                dataA={dataA}
                dataB={dataB}
                primaryVariable={primaryVariable}
                onPlayFramePixelTone={playFramePixelTone}
                onStartFrameScan={startFrameScan}
                isScanning={isScanning}
                scanProgress={scanProgress}
              />

              {showTable ? (
                <DataTable
                  lang={lang}
                  dataA={dataA}
                  dataB={dataB}
                  statsA={statsA}
                  statsB={statsB}
                  primaryVariable={primaryVariable}
                  locationA={locationA}
                  locationB={locationB}
                  isCompareMode={isCompareMode}
                  currentYear={currentYear}
                  showTable={showTable}
                  onToggleTable={setShowTable}
                />
              ) : (
                <TimelineChart
                  lang={lang}
                  theme={theme}
                  dataA={dataA}
                  dataB={dataB}
                  statsA={statsA}
                  statsB={statsB}
                  currentYear={currentYear}
                  primaryVariable={primaryVariable}
                  locationA={locationA}
                  locationB={locationB}
                  isCompareMode={isCompareMode}
                  showTable={showTable}
                  onToggleTable={setShowTable}
                />
              )}
            </div>

            {/* Secondary Row: Timeline Playback Controls & Audio Controls */}
            <div className="grid-two-columns">
              <TimelineControls
                lang={lang}
                currentYear={currentYear}
                years={years}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onStepBackward={stepBackward}
                onStepForward={stepForward}
                onSelectYear={(yr) => setYear(yr, true)}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={changeSpeed}
                isLooping={isLooping}
                onToggleLoop={() => setIsLooping(prev => !prev)}
              />

              <AudioControls
                lang={lang}
                volume={volume}
                onChangeVolume={setVolume}
                isMuted={isMuted}
                onToggleMute={toggleMute}
                instrument={instrument}
                onChangeInstrument={setInstrument}
                quantizeScale={quantizeScale}
                onToggleQuantizeScale={setQuantizeScale}
                primaryVariable={primaryVariable}
                onChangePrimaryVariable={setPrimaryVariable}
                secondaryVariable={secondaryVariable}
                onChangeSecondaryVariable={setSecondaryVariable}
                isCompareMode={isCompareMode}
                pitchMappingText={pitchMappingText}
              />
            </div>

            {/* Plain Language Climate Insights Panel */}
            <InsightsPanel
              lang={lang}
              statsA={statsA}
              statsB={statsB}
              locationA={locationA}
              locationB={locationB}
              primaryVariable={primaryVariable}
              isCompareMode={isCompareMode}
              isSpeaking={isSpeaking}
              speechSupported={speechSupported}
              onSpeakSummary={speakSummary}
              onStopSpeaking={stopSpeaking}
              summaryText={summaryText}
            />
          </>
        )}
      </main>

      {/* Footer Crediting NASA POWER & NASA GIBS */}
      <footer className="app-footer" role="contentinfo">
        <div className="container footer-content">
          <p className="footer-credit">
            {lang === 'ar'
              ? 'تم تطوير "Earth Jukebox" لتحدي ناسا لتطبيقات الفضاء. البيانات مستمدة من NASA GIBS و NASA POWER.'
              : 'Built for the NASA Space Apps Challenge "The Earth Information Jukebox". Data provided by NASA GIBS & NASA POWER.'}
          </p>
          <div className="footer-links">
            <button type="button" className="footer-link-btn" onClick={() => setIsAboutModalOpen(true)}>
              {t.aboutHeading}
            </button>
            <span className="footer-separator">•</span>
            <button type="button" className="footer-link-btn" onClick={() => setIsShortcutsModalOpen(true)}>
              {t.keyboardHelpHeading}
            </button>
          </div>
        </div>
      </footer>

      {/* Accessible Modals */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        lang={lang}
      />

      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
