import { useState, useEffect, useCallback, useRef } from 'react';
import { VARIABLES } from '../services/nasaApi';

/**
 * Custom hook for Web Speech API (speechSynthesis) Spoken Climate Summaries
 * Generates natural language summaries in both English and Arabic.
 */
export function useSpeechSummary({
  language = 'en',
  statsA = null,
  locationA = null,
  primaryVariable = 'T2M',
  isCompareMode = false,
  locationB = null,
  statsB = null
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Construct natural language summary string
  const generateSummaryText = useCallback(() => {
    if (!statsA || !locationA) return '';

    const varMeta = VARIABLES[primaryVariable] || VARIABLES.T2M;
    const locNameA = language === 'ar' ? (locationA.nameAr || locationA.nameEn) : locationA.nameEn;
    const varName = language === 'ar' ? varMeta.nameAr : varMeta.nameEn;
    const unit = language === 'ar' ? varMeta.unitAr : varMeta.unitEn;

    const rateDecade = Math.abs(statsA.changePerDecade).toFixed(2);
    const direction = statsA.changePerDecade >= 0
      ? (language === 'ar' ? 'ارتفعت' : 'rose')
      : (language === 'ar' ? 'انخفضت' : 'declined');

    const sigText = statsA.isSignificant
      ? (language === 'ar' ? 'وهو تغير دال إحصائياً.' : 'a statistically significant change.')
      : (language === 'ar' ? 'ولكن التغير ليس دالاً إحصائياً.' : 'though the trend is not statistically significant.');

    const highNotice = statsA.recordHigh
      ? (language === 'ar'
          ? `سُجلت أعلى قيمة بلغت ${statsA.recordHigh.value} ${unit} في عام ${statsA.recordHigh.year}.`
          : `The all-time record high of ${statsA.recordHigh.value} ${unit} was reached in ${statsA.recordHigh.year}.`)
      : '';

    if (language === 'ar') {
      let text = `${direction} ${varName} في ${locNameA} بمعدل ${rateDecade} ${unit} لكل عقد منذ عام 1990، ${sigText} ${highNotice}`;

      if (isCompareMode && statsB && locationB) {
        const locNameB = locationB.nameAr || locationB.nameEn;
        const rateB = Math.abs(statsB.changePerDecade).toFixed(2);
        const dirB = statsB.changePerDecade >= 0 ? 'ارتفعت' : 'انخفضت';
        text += ` بينما في ${locNameB}، ${dirB} بمعدل ${rateB} ${unit} لكل عقد.`;
      }
      return text;
    } else {
      let text = `${varName} in ${locNameA} ${direction} ${rateDecade} ${unit} per decade since 1990, ${sigText} ${highNotice}`;

      if (isCompareMode && statsB && locationB) {
        const rateB = Math.abs(statsB.changePerDecade).toFixed(2);
        const dirB = statsB.changePerDecade >= 0 ? 'rose' : 'declined';
        text += ` In comparison, ${varName} in ${locationB.nameEn} ${dirB} ${rateB} ${unit} per decade.`;
      }
      return text;
    }
  }, [language, statsA, locationA, primaryVariable, isCompareMode, locationB, statsB]);

  const speakSummary = useCallback(() => {
    if (!speechSupported || typeof window === 'undefined') return;

    window.speechSynthesis.cancel();
    const text = generateSummaryText();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set voice language
    utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    utterance.rate = 0.95; // slightly slower for maximum accessibility & clarity
    utterance.pitch = 1.0;

    // Pick best matching system voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLangPrefix = language === 'ar' ? 'ar' : 'en';
      const matchedVoice = voices.find(v => v.lang.startsWith(targetLangPrefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [speechSupported, generateSummaryText, language]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
    speechSupported,
    speakSummary,
    stopSpeaking,
    summaryText: generateSummaryText()
  };
}
