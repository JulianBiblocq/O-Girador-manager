import React, { useMemo } from 'react';
import CordelCard from '../CordelCard';
import { getEffectiveMemberTags, getCanonicalTagKey, isMemberCaOrBureau } from '../../utils/memberUtils';

/**
 * Sous-composant SaaS permettant de sélectionner le collège de relecteurs / validateurs
 * d'un compte-rendu de réunion avant sa soumission.
 * 
 * 3 modes proposés :
 * - 'all_presents' : tous les membres pointés présents
 * - 'present_by_tags' : filtrage des présents porteurs de certains badges (CA, Bureau, etc.)
 * - 'custom_users' : sélection manuelle nominative parmi les présents
 */
export default function ReportValidatorsSelector({
  validationMode = 'all_presents',
  onChangeValidationMode,
  selectedTags = [],
  onToggleTag,
  availableTags = [],
  presents = [],
  members = [],
  selectedCustomUserIds = [],
  onToggleCustomUser,
  onSelectAllCustomUsers,
  onDeselectAllCustomUsers,
  resolvedValidators = [],
  audience = 'publique'
}) {
  // Décompte des présents par tag pour enrichir visuellement les puces
  const tagPresentsCount = useMemo(() => {
    const counts = {};
    availableTags.forEach((tagObj) => {
      const tagKey = tagObj.id || getCanonicalTagKey(tagObj.label);
      const isCaOrBureauTag = tagKey === 'ca' || tagKey === 'bureau';

      const matchCount = presents.filter((p) => {
        const memberProfile = members.find((m) => (m.id || m.uid) === p.userId) || { uid: p.userId };
        if (isCaOrBureauTag && isMemberCaOrBureau(memberProfile)) {
          return true;
        }
        const effTags = getEffectiveMemberTags(memberProfile);
        const allTags = [...effTags, ...(Array.isArray(memberProfile.tags) ? memberProfile.tags : [])];
        return allTags.some((t) => {
          const c = getCanonicalTagKey(t);
          const raw = typeof t === 'object' ? (t.nomM || t.label || t.nom || t.id || '') : String(t);
          return (c && c === tagKey) || raw.toLowerCase().trim() === String(tagObj.label || '').toLowerCase().trim();
        });
      }).length;

      counts[tagKey] = matchCount;
    });
    return counts;
  }, [availableTags, presents, members]);

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white/60 border border-dashed border-cordel-master-dark/25 flex flex-col gap-3 rounded">
      
      {/* En-tête du sélecteur */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">👥</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Qui doit valider ce brouillon ?
          </span>
        </div>
        {audience === 'ca' && (
          <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
            🔒 Réunion CA / Bureau
          </span>
        )}
      </div>

      {/* 3 Modes de sélection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Mode 1 : Tous les présents */}
        <button
          type="button"
          onClick={() => onChangeValidationMode('all_presents')}
          className={`p-2.5 rounded text-left transition-all cursor-pointer border flex flex-col gap-1 ${
            validationMode === 'all_presents'
              ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)] shadow-2xs'
              : 'bg-white/80 border-stone-200 text-stone-700 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wide">
              👥 Tous les présents
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white border border-stone-300">
              {presents.length}
            </span>
          </div>
          <span className="text-[9.5px] opacity-75 leading-tight">
            100 % des membres émargés valident le compte-rendu.
          </span>
        </button>

        {/* Mode 2 : Par badge / rôle parmi les présents */}
        <button
          type="button"
          onClick={() => onChangeValidationMode('present_by_tags')}
          className={`p-2.5 rounded text-left transition-all cursor-pointer border flex flex-col gap-1 ${
            validationMode === 'present_by_tags'
              ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)] shadow-2xs'
              : 'bg-white/80 border-stone-200 text-stone-700 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wide">
              🏷️ Par badge / rôle
            </span>
            <span className="text-[10px]">✨</span>
          </div>
          <span className="text-[9.5px] opacity-75 leading-tight">
            Filtre les présents porteurs de badges (ex: CA, Bureau...).
          </span>
        </button>

        {/* Mode 3 : Sélection manuelle nominative */}
        <button
          type="button"
          onClick={() => onChangeValidationMode('custom_users')}
          className={`p-2.5 rounded text-left transition-all cursor-pointer border flex flex-col gap-1 ${
            validationMode === 'custom_users'
              ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)] shadow-2xs'
              : 'bg-white/80 border-stone-200 text-stone-700 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wide">
              👤 Nominatif
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white border border-stone-300">
              {selectedCustomUserIds.length}
            </span>
          </div>
          <span className="text-[9.5px] opacity-75 leading-tight">
            Cochez nominativement X relecteurs parmi les présents.
          </span>
        </button>
      </div>

      {/* Contenu contextuel selon le mode */}
      {validationMode === 'present_by_tags' && (
        <div className="p-3 bg-white/70 rounded border border-dashed border-cordel-master-dark/15 flex flex-col gap-2">
          <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood">
            Sélectionnez les badges du collège de relecture :
          </span>

          {availableTags.length === 0 ? (
            <p className="text-[10px] italic text-stone-500">
              Aucun badge spécifique configuré pour le moment.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tagObj) => {
                const tagKey = tagObj.id || getCanonicalTagKey(tagObj.label);
                const isSelected = selectedTags.some(
                  (st) => getCanonicalTagKey(st) === tagKey || st === tagObj.label || st === tagObj.id
                );
                const countPresent = tagPresentsCount[tagKey] || 0;

                return (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => onToggleTag(tagObj.label || tagObj.id)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cordel-wood text-white border-cordel-wood shadow-2xs'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{tagObj.label}</span>
                    <span
                      className={`text-[8.5px] px-1 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {countPresent} présent{countPresent > 1 ? 's' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTags.length === 0 && (
            <p className="text-[10px] italic text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
              👉 Cliquez sur au moins un badge pour filtrer automatiquement les présents correspondants.
            </p>
          )}
        </div>
      )}

      {validationMode === 'custom_users' && (
        <div className="p-3 bg-white/70 rounded border border-dashed border-cordel-master-dark/15 flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood">
              Cochez les membres chargés de valider ({selectedCustomUserIds.length} sélectionné{selectedCustomUserIds.length > 1 ? 's' : ''}) :
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSelectAllCustomUsers}
                className="text-[9px] font-bold text-blue-700 hover:underline cursor-pointer bg-transparent border-0"
              >
                Tout cocher
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={onDeselectAllCustomUsers}
                className="text-[9px] font-bold text-stone-600 hover:underline cursor-pointer bg-transparent border-0"
              >
                Tout décocher
              </button>
            </div>
          </div>

          {presents.length === 0 ? (
            <p className="text-[10px] italic text-stone-500">
              Aucun membre pointé présent pour le moment dans l'émargement.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {presents.map((p) => {
                const isChecked = selectedCustomUserIds.includes(p.userId);
                return (
                  <label
                    key={p.userId}
                    className={`flex items-center gap-2 p-1.5 rounded border text-[10.5px] font-semibold cursor-pointer select-none transition-colors ${
                      isChecked
                        ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)]/60 text-[var(--color-cordel-vert)]'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleCustomUser(p.userId)}
                      className="rounded text-[var(--color-cordel-vert)] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span className="truncate">👤 {p.userName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Aperçu en temps réel des relecteurs résolus */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/15">
        {resolvedValidators.length > 0 ? (
          <div className="text-[10.5px] leading-relaxed text-stone-800 bg-white/80 p-2 rounded border border-stone-200">
            <span className="font-extrabold text-[var(--color-cordel-vert)]">
              🎯 {resolvedValidators.length} relecteur{resolvedValidators.length > 1 ? 's' : ''} désigné{resolvedValidators.length > 1 ? 's' : ''} :
            </span>{' '}
            <span className="italic font-medium">
              [{resolvedValidators.map((v) => v.displayName).join(', ')}]
            </span>
          </div>
        ) : (
          <div className="text-[10.5px] font-bold text-red-800 bg-red-50 p-2 rounded border border-red-300 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>
              0 validateur désigné. Veuillez ajuster votre sélection (la soumission est bloquée tant qu'aucun relecteur n'est choisi).
            </span>
          </div>
        )}
      </div>

    </CordelCard>
  );
}
