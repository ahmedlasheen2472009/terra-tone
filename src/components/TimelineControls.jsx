import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Repeat, FastForward, Clock } from 'lucide-react';
import { translations } from '../utils/translations';

export function TimelineControls({
  lang = 'en',
  currentYear = 1990,
  years = [],
  isPlaying = false,
  onTogglePlay = () => {},
  onStepBackward = () => {},
  onStepForward = () => {},
  onSelectYear = () => {},
  playbackSpeed = 1,
  onChangeSpeed = () => {},
  isLooping = true,
  onToggleLoop = () => {}
}) {
  const t = translations[lang] || translations.en;
  const minYear = years[0] || 1990;
  const maxYear = years[years.length - 1] || 2023;

  const speedOptions = [0.5, 1, 1.5, 2];

  return (
    <section className="card timeline-controls-card" aria-labelledby="timeline-controls-heading">
      <div className="timeline-header">
        <div className="timeline-title-wrap">
          <Clock className="section-icon" aria-hidden="true" />
          <h2 id="timeline-controls-heading" className="card-title">{t.timelineHeading}</h2>
        </div>
        <div className="current-year-badge" aria-live="polite">
          <span className="year-eyebrow">{t.year}</span>
          <span className="year-number">{currentYear}</span>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="scrub-container">
        <label htmlFor="timeline-year-slider" className="sr-only">
          {t.yearSliderAria}
        </label>
        <div className="slider-track-wrap">
          <input
            id="timeline-year-slider"
            type="range"
            min={minYear}
            max={maxYear}
            step={1}
            value={currentYear}
            onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
            className="timeline-slider"
            aria-valuemin={minYear}
            aria-valuemax={maxYear}
            aria-valuenow={currentYear}
            aria-valuetext={`${t.year} ${currentYear}`}
          />
          <div className="slider-ticks" aria-hidden="true">
            <span>{minYear}</span>
            <span>{Math.round((minYear + maxYear) / 2)}</span>
            <span>{maxYear}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons Group */}
      <div className="controls-button-bar">
        {/* Step Backward */}
        <button
          type="button"
          className="btn-control btn-step"
          onClick={onStepBackward}
          aria-label={t.stepBack}
          title={`${t.stepBack} (←)`}
        >
          <SkipBack className="icon" aria-hidden="true" />
          <span className="btn-key-hint">←</span>
        </button>

        {/* Big Play / Pause Button */}
        <button
          type="button"
          className={`btn-control btn-play ${isPlaying ? 'is-playing' : ''}`}
          onClick={onTogglePlay}
          aria-label={isPlaying ? t.pause : t.play}
          title={`${isPlaying ? t.pause : t.play} (Space)`}
        >
          {isPlaying ? (
            <Pause className="icon-lg" aria-hidden="true" />
          ) : (
            <Play className="icon-lg icon-play" aria-hidden="true" />
          )}
          <span className="play-label">{isPlaying ? t.pause : t.play}</span>
          <span className="btn-key-hint">Space</span>
        </button>

        {/* Step Forward */}
        <button
          type="button"
          className="btn-control btn-step"
          onClick={onStepForward}
          aria-label={t.stepForward}
          title={`${t.stepForward} (→)`}
        >
          <SkipForward className="icon" aria-hidden="true" />
          <span className="btn-key-hint">→</span>
        </button>

        {/* Speed Selector */}
        <div className="speed-group" role="group" aria-label={t.speed}>
          <span className="speed-label">
            <FastForward className="icon-xs" aria-hidden="true" />
            <span>{t.speed}:</span>
          </span>
          <div className="speed-buttons">
            {speedOptions.map((spd) => (
              <button
                key={spd}
                type="button"
                className={`btn-speed ${playbackSpeed === spd ? 'active' : ''}`}
                onClick={() => onChangeSpeed(spd)}
                aria-pressed={playbackSpeed === spd}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Loop Toggle */}
        <button
          type="button"
          className={`btn-control btn-loop ${isLooping ? 'active' : ''}`}
          onClick={onToggleLoop}
          aria-pressed={isLooping}
          aria-label={t.loop}
          title={t.loop}
        >
          <Repeat className="icon-sm" aria-hidden="true" />
          <span className="loop-label">{t.loop}</span>
        </button>
      </div>
    </section>
  );
}
