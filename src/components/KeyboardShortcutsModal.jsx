import React, { useEffect, useRef } from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { translations } from '../utils/translations';

export function KeyboardShortcutsModal({
  isOpen = false,
  onClose = () => {},
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shortcutsList = [
    { key: 'Space', desc: t.shortcutSpace },
    { key: '← / →', desc: t.shortcutArrowsLR },
    { key: '↑ / ↓', desc: t.shortcutArrowsUD },
    { key: 'M', desc: t.shortcutM },
    { key: 'H', desc: t.shortcutH },
    { key: 'Esc', desc: t.shortcutClose }
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <Keyboard className="icon-md" aria-hidden="true" />
            <h2 id="shortcuts-modal-title" className="modal-title">{t.keyboardHelpHeading}</h2>
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

        <div className="modal-body">
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th scope="col">{lang === 'ar' ? 'المفتاح' : 'Key'}</th>
                <th scope="col">{lang === 'ar' ? 'الوظيفة' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {shortcutsList.map((item, idx) => (
                <tr key={idx}>
                  <td className="key-cell">
                    <kbd className="kbd-shortcut">{item.key}</kbd>
                  </td>
                  <td className="desc-cell">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
