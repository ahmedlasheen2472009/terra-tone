import React, { useEffect, useRef } from 'react';
import { X, Info, ExternalLink, Headphones, Database, ShieldCheck, Layers, AlertTriangle } from 'lucide-react';
import { translations } from '../utils/translations';
import { GIBS_LAYERS } from '../services/gibsService';
import { POLLUTION_STAGES } from '../services/pollutionStages';
import { POLLUTION_POWER_PARAMETERS, VARIABLES } from '../services/nasaApi';

export function AboutModal({
  isOpen = false,
  onClose = () => {},
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-content modal-about"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Info className="icon-md" aria-hidden="true" />
            <h2 id="about-modal-title" className="modal-title">{t.aboutHeading}</h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label={t.shortcutClose}
          >
            <X className="icon" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body about-body">
          {/* Mission */}
          <div className="about-section">
            <h3 className="about-section-title">
              <span className="section-bullet">🌍</span>
              <span>{lang === 'ar' ? 'رسالة المشروع' : 'Project Mission'}</span>
            </h3>
            <p className="about-text">{t.aboutMission}</p>
          </div>

          {/* How Sonification & Pixel Sampling Works */}
          <div className="about-section">
            <h3 className="about-section-title">
              <Headphones className="icon-sm" aria-hidden="true" />
              <span>{t.howSonificationWorks}</span>
            </h3>
            <p className="about-text">{t.sonificationExplanation}</p>
            <div className="pixel-method-box">
              <h4 className="method-subtitle">{lang === 'ar' ? 'آلية تحويل بكسل القمر الصناعي إلى نغمة صوتية:' : 'Satellite Pixel-to-Sound Conversion Methodology:'}</h4>
              <ol className="method-steps-list">
                <li>
                  <strong>{lang === 'ar' ? '1. استخراج البكسل:' : '1. Pixel Extraction:'}</strong>{' '}
                  {lang === 'ar'
                    ? 'يتم إسقاط إحداثيات الموقع (خط العرض والطول) إلى إحداثيات البلاطة الفضائية (Tile coordinates) ورسمها على عنصر Canvas مخفي باستخدام خاصية crossOrigin="anonymous".'
                    : 'The geographic coordinates (lat, lon) are projected to the Web Mercator tile index (z, y, x) and pixel offset (px, py). The tile is drawn on an offscreen HTML5 canvas using crossOrigin="anonymous".'}
                </li>
                <li>
                  <strong>{lang === 'ar' ? '2. مطابقة خريطة الألوان:' : '2. Colormap Nearest-Color Lookup:'}</strong>{' '}
                  {lang === 'ar'
                    ? 'تتم قراءة قيمة RGB ومطابقتها بأقرب لون في خريطة ألوان وكالة ناسا الرسمية (NASA GIBS Colormap XML v1.3) لحساب القيمة الفيزيائية الحقيقية.'
                    : 'The RGB values are matched against NASA GIBS calibrated Colormap XML v1.3 entries using Euclidean color distance in RGB space to recover the physical variable (converting Kelvin to °C where needed).'}
                </li>
                <li>
                  <strong>{lang === 'ar' ? '3. بديل السطوع (Luminance):' : '3. Luminance Fallback:'}</strong>{' '}
                  {lang === 'ar'
                    ? 'في طبقات الألوان الحقيقية (مثل مؤشر عكارة المياه الساحلية)، يتم حساب السطوع الفيزيائي (Y = 0.299R + 0.587G + 0.114B).'
                    : 'For True Color optical imagery (e.g., coastal turbidity proxy), perceived luminance (Y = 0.299R + 0.587G + 0.114B) is computed directly.'}
                </li>
                <li>
                  <strong>{lang === 'ar' ? '4. التحويل النغمي الخماسي:' : '4. Dynamic Pentatonic Normalization:'}</strong>{' '}
                  {lang === 'ar'
                    ? 'تتم معايرة القيمة ديناميكياً (القيمة الأعلى = نغمة أعلى) وتحويلها إلى السلم الخماسي (C3 إلى C6) عبر Web Audio API مع مقارنة ستيريو مجسمة ونغمات الأرقام القياسية.'
                    : 'Values are dynamically normalized across the frame series (higher value = higher pitch) onto a pentatonic scale (C3 ~131 Hz to C6 ~1047 Hz) via Web Audio API, with stereo left/right compare and record chimes.'}
                </li>
              </ol>
            </div>
          </div>

          {/* Pollution Stages: All 9 Verified GIBS Layers */}
          <div className="about-section">
            <h3 className="about-section-title">
              <Layers className="icon-sm" aria-hidden="true" />
              <span>{lang === 'ar' ? 'مصادر بيانات مراحل التلوث (9 طبقات موثقة من NASA GIBS)' : 'Pollution Stages Datasets (9 Verified NASA GIBS Layers)'}</span>
            </h3>
            {POLLUTION_STAGES.map(stage => (
              <div key={stage.id} className="about-stage-block">
                <h4 className="about-stage-subtitle">{lang === 'ar' ? stage.titleAr : stage.titleEn}</h4>
                <ul className="about-gibs-list">
                  {stage.animations.map(anim => (
                    <li key={anim.id} className="gibs-list-item">
                      <div className="gibs-item-name">
                        {lang === 'ar' ? anim.titleAr : anim.titleEn}{' '}
                        <span className="about-range-pill">({anim.availableRange.start} → {anim.availableRange.end})</span>
                      </div>
                      <code className="gibs-item-id">
                        GIBS ID: {anim.gibsLayerId} | {anim.provider} | Unit: {anim.unitEn}
                        {anim.pairedPowerParam ? ` | POWER: ${anim.pairedPowerParam}${anim.pairedPowerSecondaryParam ? `, ${anim.pairedPowerSecondaryParam}` : ''}` : ''}
                      </code>
                      <div className="gibs-item-desc">{lang === 'ar' ? anim.limitationAr : anim.limitationEn}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Temperature Mode GIBS + NASA POWER Layers */}
          <div className="about-section">
            <h3 className="about-section-title">
              <Database className="icon-sm" aria-hidden="true" />
              <span>{lang === 'ar' ? 'وضع الحرارة والمناخ (NASA POWER و GIBS)' : 'Temperature Mode Sources (NASA POWER & GIBS)'}</span>
            </h3>
            <ul className="about-gibs-list">
              {GIBS_LAYERS.map(layer => (
                <li key={layer.id} className="gibs-list-item">
                  <div className="gibs-item-name">{layer.nameEn} ({layer.nameAr})</div>
                  <code className="gibs-item-id">Layer ID: {layer.id} | Start: {layer.startDate}</code>
                  <div className="gibs-item-desc">{layer.descriptionEn}</div>
                </li>
              ))}
            </ul>
            <p className="about-text" style={{ marginTop: '0.6rem' }}>
              <strong>NASA POWER Parameters (1990–2025):</strong>{' '}
              {[...Object.values(VARIABLES), ...Object.values(POLLUTION_POWER_PARAMETERS)].map(v => `${v.id} (${v.unitEn})`).join(', ')}.
            </p>
            <div className="links-row">
              <a
                href="https://gibs.earthdata.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <span>NASA GIBS Earthdata Portal</span>
                <ExternalLink className="icon-xs" aria-hidden="true" />
              </a>
              <a
                href="https://power.larc.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-link"
              >
                <span>NASA POWER Data Portal</span>
                <ExternalLink className="icon-xs" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Scientific Limitations & Proxies */}
          <div className="about-section">
            <h3 className="about-section-title">
              <AlertTriangle className="icon-sm text-gold" aria-hidden="true" />
              <span>{lang === 'ar' ? 'الحدود العلمية والمؤشرات البديلة' : 'Scientific Limitations, Proxies & Gaps'}</span>
            </h3>
            <ul className="about-list">
              <li><strong>PM2.5 Proxy (AOD):</strong> Total atmospheric column Aerosol Optical Depth (~50 km MERRA-2) correlates with particulate haze but is not direct breathing-height PM2.5 µg/m³.</li>
              <li><strong>Coastal Turbidity Proxy:</strong> True-color optical reflectance brightness detects river plumes and sediment but white clouds also raise brightness.</li>
              <li><strong>Soil Condition Indicators (Stage 3):</strong> NASA satellites do not measure heavy metals, pesticides, or chemical soil toxicity. SMAP moisture, NDVI, and LST measure physical soil stress indicators only.</li>
              <li><strong>Spatial Resolution & Gaps:</strong> Coarse grids (4–50 km) do not resolve narrow rivers or street blocks; optical sensors (Chlorophyll-a, NDVI, True Color) can have cloud/orbital gaps on individual dates.</li>
            </ul>
          </div>

          {/* Accessibility Standards */}
          <div className="about-section">
            <h3 className="about-section-title">
              <ShieldCheck className="icon-sm" aria-hidden="true" />
              <span>{lang === 'ar' ? 'معايير إمكانية الوصول الشامل (Accessibility)' : 'Accessibility Standards'}</span>
            </h3>
            <ul className="about-list">
              <li>{lang === 'ar' ? 'تحكم كامل عبر لوحة المفاتيح دون تعطيل أزرار النموذج' : '100% Keyboard Operable with native form/button behaviors preserved'}</li>
              <li>{lang === 'ar' ? 'إعلانات ذكية لقارئات الشاشة (aria-live) مع خيار التحكم بالنطق أثناء التشغيل' : 'Smart aria-live region with configurable speech during playback toggle'}</li>
              <li>{lang === 'ar' ? 'وضع التباين العالي الفائق متوافق مع معايير WCAG AAA' : 'High-contrast mode compliant with WCAG AAA contrast ratios (> 7:1)'}</li>
              <li>{lang === 'ar' ? 'وضع تكبير الخطوط والرموز ويدعم شاشات 360px' : 'Large text mode, RTL Arabic support, reduced-motion compliance, and 360px mobile layout'}</li>
              <li>{lang === 'ar' ? 'جدول بيانات نصي كبديل مباشر للمخطط البياني مع تصدير CSV و JSON' : 'Semantic HTML data table alternative with CSV, JSON, PNG ZIP, and WebM export'}</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            {t.shortcutClose}
          </button>
        </div>
      </div>
    </div>
  );
}
