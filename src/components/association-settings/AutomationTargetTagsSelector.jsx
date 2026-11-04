import React, { useEffect, useState, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const DEFAULT_SUMMARY_TAGS = ['Mestre', 'CA', 'Bureau', 'Trésorier', 'Secrétaire', 'Référent Pupitre'];

/**
 * Sélecteur de puces dynamiques (badges/tags) pour choisir les destinataires
 * d'une notification de bilan à la clôture des inscriptions.
 * Extrait de TabAutomations.jsx (Règle du Boy Scout, < 140 lignes).
 */
export default function AutomationTargetTagsSelector({
  groupId,
  selectedTags = ['Mestre', 'CA', 'Bureau'],
  onChangeTags,
  disabled = false
}) {
  const [assocTags, setAssocTags] = useState([]);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    getDoc(doc(db, 'associations', groupId))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const data = snap.data() || {};
        const rawTags = Array.isArray(data.tagsDisponibles) ? data.tagsDisponibles : [];
        const names = rawTags
          .map((t) => (typeof t === 'string' ? t : (t?.nomM || t?.nom || t?.label || t?.id || '')))
          .map((s) => String(s || '').trim())
          .filter(Boolean);
        setAssocTags(names);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const availableTags = useMemo(() => {
    const merged = new Set([...DEFAULT_SUMMARY_TAGS, ...assocTags]);
    return Array.from(merged);
  }, [assocTags]);

  const currentList = Array.isArray(selectedTags) && selectedTags.length > 0
    ? selectedTags
    : ['Mestre', 'CA', 'Bureau'];

  const handleToggleTag = (tag) => {
    if (disabled) return;
    const exists = currentList.includes(tag);
    const next = exists
      ? currentList.filter((t) => t !== tag)
      : [...currentList, tag];
    onChangeTags(next.length > 0 ? next : ['Mestre']);
  };

  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded border border-amber-400/50 bg-amber-50/70 dark:bg-amber-950/20">
      <label className="text-[9.5px] uppercase font-black text-cordel-wood flex items-center gap-1.5">
        <span>🏷️</span>
        <span>Badges destinataires du bilan à la clôture :</span>
      </label>
      <div className="flex flex-wrap gap-1.5 select-none">
        {availableTags.map((tag) => {
          const isChecked = currentList.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => handleToggleTag(tag)}
              className={`text-[9.5px] font-black px-2.5 py-1 rounded border transition-all cursor-pointer ${
                isChecked
                  ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-white text-encre-noire/80 border-encre-noire/25 hover:bg-amber-100/60'
              }`}
            >
              {isChecked ? '✓ ' : '+ '}
              {tag}
            </button>
          );
        })}
      </div>
      <span className="text-[9px] font-semibold text-stone-600">
        Ces responsables recevront automatiquement le bilan des inscrits (ou des votes par pupitre) dès que la date limite d'inscription d'un créneau est atteinte.
      </span>
    </div>
  );
}

