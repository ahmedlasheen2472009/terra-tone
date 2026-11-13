import React from 'react';
import { translations } from '../utils/translations';
import { Volume2, VolumeX, Eye, HelpCircle, Info, Sparkles, Globe, MessageSquare } from 'lucide-react';

export function Header({
  lang = 'en',
  onToggleLang,
  isHighContrast,
  onToggleHighContrast,
  isLargeText,
  onToggleLargeText,
  isMuted,
  onToggleMute,
  audioActive,
  onUnlockAudio,
  announceDuringPlayback = false,
  onToggleAnnounceDuringPlayback = () => {},
  onOpenShortcuts,
  onOpenAbout
}) {
  const t = translations[lang] || translations.en;

  return (
    <header className="app-header" role="banner">
      <div className="header-inner container">
        {/* Brand & NASA Space Apps Badge */}
        <div className="brand-group">
          <div className="logo-icon" aria-hidden="true">
            <span className="earth-emoji">🌍</span>
            <span className="sound-pulse"></span>
          </div>
          <div className="brand-text">
            <div className="badge-row">
              <span className="nasa-badge">
                <span className="nasa-dot"></span>
                {t.badgeNasa}
              </span>
            </div>
            <h1 className="app-title">{t.appTitle}</h1>
            <p className="app-tagline">{t.tagline}</p>
          </div>
        </div>

        {/* Global Toolbar & Accessibility Actions */}
        <div className="header-actions" role="toolbar" aria-label="Accessibility and global settings">
          {/* Audio Engine Status / Autoplay Unlock */}
          <button
            type="button"
            className={`btn-header-pill ${audioActive ? 'audio-active' : 'audio-prompt'}`}
            onClick={onUnlockAudio}
            aria-label={audioActive ? t.audioReady : t.audioBlocked}
            title={audioActive ? t.audioReady : t.audioBlocked}
          >
            <Sparkles className="icon-sm" aria-hidden="true" />
            <span className="btn-label">{audioActive ? t.audioReady : t.audioBlocked}</span>
          </button>

          {/* Announce during playback accessibility toggle */}
          <button
            type="button"
            className={`btn-header-pill ${announceDuringPlayback ? 'audio-active' : ''}`}
            onClick={onToggleAnnounceDuringPlayback}
            aria-pressed={announceDuringPlayback}
            aria-label={announceDuringPlayback ? t.announceOn : t.announceOff}
            title={announceDuringPlayback ? t.announceOn : t.announceOff}
          >
            <MessageSquare className="icon-sm" aria-hidden="true" />
            <span className="btn-label">{announceDuringPlayback ? t.announceOn : t.announceOff}</span>
          </button>

          {/* Mute Button */}
          <button
            type="button"
            className={`btn-header-icon ${isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            aria-label={isMuted ? t.unmute : t.mute}
            title={`${isMuted ? t.unmute : t.mute} (M)`}
          >
            {isMuted ? <VolumeX className="icon" aria-hidden="true" /> : <Volume2 className="icon" aria-hidden="true" />}
            <span className="sr-only">{isMuted ? t.unmute : t.mute}</span>
          </button>

          {/* High Contrast Mode */}
          <button
            type="button"
            className={`btn-header-icon ${isHighContrast ? 'active' : ''}`}
            onClick={onToggleHighContrast}
            aria-pressed={isHighContrast}
            aria-label={t.highContrast}
            title={t.highContrast}
          >
            <Eye className="icon" aria-hidden="true" />
            <span className="action-tag">{t.highContrast}</span>
          </button>

          {/* Large Text Mode */}
          <button
            type="button"
            className={`btn-header-icon ${isLargeText ? 'active' : ''}`}
            onClick={onToggleLargeText}
            aria-pressed={isLargeText}
            aria-label={t.largeText}
            title={t.largeText}
          >
            <span className="font-size-icon" aria-hidden="true">aA</span>
            <span className="action-tag">{t.largeText}</span>
          </button>

          {/* Language Toggle (EN / AR) */}
          <button
            type="button"
            className="btn-header-pill lang-btn"
            onClick={onToggleLang}
            aria-label={`Switch language to ${t.langToggle}`}
            title={`Switch language to ${t.langToggle}`}
          >
            <Globe className="icon-sm" aria-hidden="true" />
            <span>{t.langToggle}</span>
          </button>

          {/* Keyboard Shortcuts Dialog Button */}
          <button
            type="button"
            className="btn-header-icon"
            onClick={onOpenShortcuts}
            aria-label={t.shortcutsBtn}
            title={t.shortcutsBtn}
          >
            <HelpCircle className="icon" aria-hidden="true" />
            <span className="sr-only">{t.shortcutsBtn}</span>
          </button>

          {/* About Dialog Button */}
          <button
            type="button"
            className="btn-header-icon"
            onClick={onOpenAbout}
            aria-label={t.aboutHeading}
            title={t.aboutHeading}
          >
            <Info className="icon" aria-hidden="true" />
            <span className="sr-only">{t.aboutHeading}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
