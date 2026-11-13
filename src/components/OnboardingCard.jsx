import React, { useState } from 'react';
import { Compass, Layers, Music, Check, X, Sparkles } from 'lucide-react';
import { translations } from '../utils/translations';

export function OnboardingCard({ lang = 'en' }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const t = translations[lang] || translations.en;

  if (isDismissed) return null;

  return (
    <section className="onboarding-card card" aria-labelledby="onboarding-title">
      <div className="onboarding-header">
        <div className="onboarding-title-wrap">
          <Sparkles className="icon-sm text-gold" aria-hidden="true" />
          <h2 id="onboarding-title" className="onboarding-title">{t.onboardingTitle}</h2>
        </div>
        <button
          type="button"
          className="btn-dismiss-onboarding"
          onClick={() => setIsDismissed(true)}
          aria-label={t.dismiss}
          title={t.dismiss}
        >
          <span className="dismiss-label">{t.dismiss}</span>
          <X className="icon-xs" aria-hidden="true" />
        </button>
      </div>

      <div className="onboarding-steps-grid">
        <div className="onboarding-step-item">
          <div className="step-icon-badge">
            <Compass className="icon-sm text-cyan" aria-hidden="true" />
          </div>
          <div className="step-content">
            <h3 className="step-heading">{t.step1Title}</h3>
            <p className="step-desc">{t.step1Desc}</p>
          </div>
        </div>

        <div className="onboarding-step-item">
          <div className="step-icon-badge">
            <Layers className="icon-sm text-orange" aria-hidden="true" />
          </div>
          <div className="step-content">
            <h3 className="step-heading">{t.step2Title}</h3>
            <p className="step-desc">{t.step2Desc}</p>
          </div>
        </div>

        <div className="onboarding-step-item">
          <div className="step-icon-badge">
            <Music className="icon-sm text-gold" aria-hidden="true" />
          </div>
          <div className="step-content">
            <h3 className="step-heading">{t.step3Title}</h3>
            <p className="step-desc">{t.step3Desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
