import React from 'react';
import { Sparkles, Volume2, Square, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { VARIABLES } from '../services/nasaApi';
import { translations } from '../utils/translations';

export function InsightsPanel({
  lang = 'en',
  statsA = null,
  statsB = null,
  locationA = null,
  locationB = null,
  primaryVariable = 'T2M',
  isCompareMode = false,
  isSpeaking = false,
  speechSupported = false,
  onSpeakSummary = () => {},
  onStopSpeaking = () => {},
  summaryText = ''
}) {
  const t = translations[lang] || translations.en;
  const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;

  const locNameA = lang === 'ar' ? (locationA?.nameAr || locationA?.nameEn) : locationA?.nameEn;
  const locNameB = isCompareMode ? (lang === 'ar' ? (locationB?.nameAr || locationB?.nameEn) : locationB?.nameEn) : null;

  return (
    <section className="card insights-card" aria-labelledby="insights-heading">
      <div className="card-header">
        <div className="card-title-group">
          <Sparkles className="section-icon" aria-hidden="true" />
          <div>
            <h2 id="insights-heading" className="card-title">{t.insightsHeading}</h2>
            <p className="card-sub">{t.historicalRange}</p>
          </div>
        </div>

        {/* Spoken Summary (Web Speech API) Action */}
        {speechSupported && (
          <div className="speech-action-group">
            {isSpeaking ? (
              <button
                type="button"
                className="btn-speech speaking"
                onClick={onStopSpeaking}
                aria-label={t.stopSpeakingBtn}
              >
                <Square className="icon-sm" aria-hidden="true" />
                <span>{t.speakingState}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn-speech"
                onClick={onSpeakSummary}
                aria-label={t.readSummaryBtn}
              >
                <Volume2 className="icon-sm" aria-hidden="true" />
                <span>{t.readSummaryBtn}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spoken Summary Text Display */}
      {summaryText && (
        <div className="summary-quote-box" role="region" aria-label="Climate text summary">
          <p className="summary-quote-text">"{summaryText}"</p>
        </div>
      )}

      {/* Statistical Cards Grid */}
      <div className="stats-metric-grid">
        {/* Metric 1: Change per Decade */}
        <div className="metric-box">
          <span className="metric-label">{t.changePerDecade}</span>
          <div className="metric-value-row">
            {statsA && statsA.changePerDecade >= 0 ? (
              <TrendingUp className="metric-trend-icon trend-up" aria-hidden="true" />
            ) : (
              <TrendingDown className="metric-trend-icon trend-down" aria-hidden="true" />
            )}
            <span className="metric-value">
              {statsA ? `${statsA.changePerDecade > 0 ? '+' : ''}${statsA.changePerDecade.toFixed(2)}` : '—'}
            </span>
            <span className="metric-unit">{varMeta.unitEn}/dec</span>
          </div>
          {isCompareMode && statsB && (
            <div className="metric-sub-compare">
              <span className="compare-loc-tag">Loc B:</span>
              <span className="compare-val">
                {statsB.changePerDecade > 0 ? '+' : ''}{statsB.changePerDecade.toFixed(2)} {varMeta.unitEn}/dec
              </span>
            </div>
          )}
        </div>

        {/* Metric 2: Total Period Change */}
        <div className="metric-box">
          <span className="metric-label">{t.totalTrendChange}</span>
          <div className="metric-value-row">
            <span className="metric-value">
              {statsA ? `${statsA.totalChange > 0 ? '+' : ''}${statsA.totalChange.toFixed(2)}` : '—'}
            </span>
            <span className="metric-unit">{varMeta.unitEn}</span>
          </div>
          {isCompareMode && statsB && (
            <div className="metric-sub-compare">
              <span className="compare-loc-tag">Loc B:</span>
              <span className="compare-val">
                {statsB.totalChange > 0 ? '+' : ''}{statsB.totalChange.toFixed(2)} {varMeta.unitEn}
              </span>
            </div>
          )}
        </div>

        {/* Metric 3: Percent Change */}
        <div className="metric-box">
          <span className="metric-label">{t.percentChange}</span>
          <div className="metric-value-row">
            <span className="metric-value">
              {statsA ? `${statsA.percentChange > 0 ? '+' : ''}${statsA.percentChange.toFixed(1)}%` : '—'}
            </span>
          </div>
          {isCompareMode && statsB && (
            <div className="metric-sub-compare">
              <span className="compare-loc-tag">Loc B:</span>
              <span className="compare-val">
                {statsB.percentChange > 0 ? '+' : ''}{statsB.percentChange.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Metric 4: Statistical Significance Test */}
        <div className="metric-box significance-box">
          <span className="metric-label">{t.significanceTest}</span>
          <div className="significance-badge-wrap">
            {statsA?.isSignificant ? (
              <span className="badge-significant">
                <CheckCircle className="icon-xs" aria-hidden="true" />
                <span>{t.significant}</span>
              </span>
            ) : (
              <span className="badge-not-significant">
                <AlertTriangle className="icon-xs" aria-hidden="true" />
                <span>{t.notSignificant}</span>
              </span>
            )}
          </div>
          <div className="p-value-line">
            <span>{t.pValueLabel.replace('{p}', statsA ? (statsA.pValue < 0.001 ? '< 0.001' : statsA.pValue.toFixed(4)) : '—')}</span>
            <span className="r-squared-note">R² = {statsA ? statsA.rSquared.toFixed(3) : '—'}</span>
          </div>
          {isCompareMode && statsB && (
            <div className="metric-sub-compare">
              <span className="compare-loc-tag">Loc B:</span>
              <span className="compare-val">
                p = {statsB.pValue < 0.001 ? '< 0.001' : statsB.pValue.toFixed(4)} ({statsB.isSignificant ? 'Significant' : 'Not Sig.'})
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
