import React from 'react';
import { Volume2, VolumeX, Music, Sliders, Radio, Layers, Headphones, Activity } from 'lucide-react';
import { VARIABLES } from '../services/nasaApi';
import { translations } from '../utils/translations';

export function AudioControls({
  lang = 'en',
  volume = 0.7,
  onChangeVolume = () => {},
  isMuted = false,
  onToggleMute = () => {},
  instrument = 'sine',
  onChangeInstrument = () => {},
  quantizeScale = true,
  onToggleQuantizeScale = () => {},
  primaryVariable = 'T2M',
  onChangePrimaryVariable = () => {},
  secondaryVariable = 'NONE',
  onChangeSecondaryVariable = () => {},
  isCompareMode = false,
  pitchMappingText = ''
}) {
  const t = translations[lang] || translations.en;

  const instruments = [
    { id: 'sine', label: t.instrumentSine, desc: 'Pure harmonic tone' },
    { id: 'triangle', label: t.instrumentTriangle, desc: 'Warm ambient flute' },
    { id: 'soft_pluck', label: t.instrumentPluck, desc: 'Acoustic harp pluck' }
  ];

  return (
    <section className="card audio-controls-card" aria-labelledby="audio-controls-heading">
      <div className="card-header">
        <div className="card-title-group">
          <Music className="section-icon" aria-hidden="true" />
          <div>
            <h2 id="audio-controls-heading" className="card-title">{t.audioHeading}</h2>
            <p className="card-sub">{t.recordCueTip}</p>
          </div>
        </div>

        {/* Stereo Comparison Mode Indicator */}
        {isCompareMode && (
          <div className="stereo-badge" role="status">
            <Headphones className="icon-sm" aria-hidden="true" />
            <span>{t.spatialStereo} (L ⟷ R)</span>
          </div>
        )}
      </div>

      <div className="audio-controls-grid">
        {/* Variable Selection */}
        <div className="control-group">
          <label htmlFor="primary-variable-select" className="control-label">
            <Radio className="icon-xs" aria-hidden="true" />
            <span>{t.variableLabel}</span>
          </label>
          <select
            id="primary-variable-select"
            className="control-select"
            value={primaryVariable}
            onChange={(e) => onChangePrimaryVariable(e.target.value)}
            aria-label={t.selectVariableAria}
          >
            {Object.values(VARIABLES).map((v) => (
              <option key={v.id} value={v.id}>
                {lang === 'ar' ? v.nameAr : v.nameEn} ({v.unitEn})
              </option>
            ))}
          </select>
        </div>

        {/* Volume Slider & Mute */}
        <div className="control-group">
          <div className="control-label-row">
            <label htmlFor="audio-volume-slider" className="control-label">
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
              id="audio-volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="volume-slider"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={isMuted ? 0 : Math.round(volume * 100)}
            />
          </div>
        </div>

        {/* Instrument Timbre Picker */}
        <div className="control-group">
          <label className="control-label" id="instrument-label">
            <Music className="icon-xs" aria-hidden="true" />
            <span>{t.instrument}</span>
          </label>
          <div className="instrument-button-group" role="radiogroup" aria-labelledby="instrument-label">
            {instruments.map((inst) => (
              <button
                key={inst.id}
                type="button"
                className={`btn-instrument ${instrument === inst.id ? 'active' : ''}`}
                onClick={() => onChangeInstrument(inst.id)}
                role="radio"
                aria-checked={instrument === inst.id}
              >
                <span>{inst.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Musical Scale Mode Toggle */}
        <div className="control-group">
          <label className="control-label">
            <span>{t.musicalScale}</span>
          </label>
          <div className="scale-toggle-wrap">
            <button
              type="button"
              className={`btn-scale-toggle ${quantizeScale ? 'active' : ''}`}
              onClick={() => onToggleQuantizeScale(true)}
              aria-pressed={quantizeScale}
            >
              <span>{t.scaleOn}</span>
            </button>
            <button
              type="button"
              className={`btn-scale-toggle ${!quantizeScale ? 'active' : ''}`}
              onClick={() => onToggleQuantizeScale(false)}
              aria-pressed={!quantizeScale}
            >
              <span>{t.scaleOff}</span>
            </button>
          </div>
        </div>

        {/* Second Variable Layer (Volume Modulation) */}
        <div className="control-group">
          <label htmlFor="secondary-layer-select" className="control-label">
            <Layers className="icon-xs" aria-hidden="true" />
            <span>{t.secondaryLayerLabel}</span>
          </label>
          <select
            id="secondary-layer-select"
            className="control-select"
            value={secondaryVariable || 'NONE'}
            onChange={(e) => onChangeSecondaryVariable(e.target.value)}
          >
            <option value="NONE">{t.secondaryNone}</option>
            {Object.values(VARIABLES)
              .filter((v) => v.id !== primaryVariable)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {lang === 'ar' ? v.nameAr : v.nameEn} ({v.unitEn})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Dynamic Pitch Normalization Range Display */}
      {pitchMappingText && (
        <div className="pitch-mapping-chip" role="status" aria-label={t.pitchMappingLabel}>
          <Activity className="icon-xs text-cyan" aria-hidden="true" />
          <span className="mapping-label">{t.pitchMappingLabel}</span>
          <code className="mapping-code">{pitchMappingText}</code>
        </div>
      )}
    </section>
  );
}
