import React from 'react';
import {
  getDefaultPrivacyForTargetGroup,
  getReunionPrivacySummaryText,
  getTargetGroupDisplayName
} from '../../utils/reunionPrivacyUtils';
import { getCanonicalTagKey } from '../../utils/memberUtils';

/**
 * Sélecteur simplifié "🎯 Participants & Confidentialité" pour les réunions et sondages de réunion.
 * Combine l'Étape 1 (Groupe convoqué), l'Étape 2 (Mode de visibilité avec pré-sélection automatique)
 * et le bandeau récapitulatif dynamique rassurant l'administrateur.
 */
export default function ReunionPrivacySelector({
  targetGroup = 'all',
  reunionPrivacyMode = 'public',
  hideAgendaFromNonTarget = false,
  tagsDisponibles = [],
  disabled = false,
  onChange
}) {
  const normalizedTarget = (!targetGroup || targetGroup === 'publique') ? 'all' : targetGroup;

  // Filtrer les badges personnalisés (hors CA / Bureau déjà affichés en pastilles principales)
  const customBadges = (Array.isArray(tagsDisponibles) ? tagsDisponibles : [])
    .map((t) => {
      if (typeof t === 'string') return { id: t, label: t };
      const id = t?.id || t?.nomM || t?.nom || t?.label || '';
      const label = t?.nomM || t?.nom || t?.label || id;
      return { id, label };
    })
    .filter((b) => {
      if (!b.id) return false;
      const canonical = getCanonicalTagKey(b.id);
      return !['ca', 'bureau', 'president', 'tresorier', 'secretaire'].includes(canonical);
    });

  // Clic sur un groupe à l'Étape 1 : applique automatiquement le préréglage recommandé à l'Étape 2
  const handleSelectTargetGroup = (nextGroup) => {
    if (disabled || !onChange) return;
    const preset = getDefaultPrivacyForTargetGroup(nextGroup);
    onChange(preset);
  };

  // Clic manuel sur un mode de visibilité à l'Étape 2
  const handleSelectPrivacyMode = (nextMode) => {
    if (disabled || !onChange) return;
    const nextHide = nextMode === 'huis_clos'
      ? true
      : (nextMode === 'public' ? false : Boolean(hideAgendaFromNonTarget));
    const nextTarget = nextMode === 'public' && normalizedTarget === 'all' ? 'all' : normalizedTarget;
    const nextAudience = (nextTarget === 'all' && nextMode === 'public') ? 'publique' : 'ca';

    onChange({
      targetGroup: nextTarget,
      reunionPrivacyMode: nextMode,
      hideAgendaFromNonTarget: nextHide,
      audience: nextAudience,
      portee: nextAudience,
      pollRestrictionType: nextTarget === 'all' ? 'aucun' : 'tag',
      pollTarget: nextTarget === 'all' ? '' : (nextTarget === 'ca' ? 'CA' : (nextTarget === 'bureau' ? 'Bureau' : nextTarget))
    });
  };

  // Bascule de la sous-option de masquage de l'ODJ / CR en mode Transparente
  const handleToggleHideAgenda = (checked) => {
    if (disabled || !onChange) return;
    const nextAudience = (normalizedTarget === 'all' && reunionPrivacyMode === 'public') ? 'publique' : 'ca';
    onChange({
      targetGroup: normalizedTarget,
      reunionPrivacyMode,
      hideAgendaFromNonTarget: Boolean(checked),
      audience: nextAudience,
      portee: nextAudience,
      pollRestrictionType: normalizedTarget === 'all' ? 'aucun' : 'tag',
      pollTarget: normalizedTarget === 'all' ? '' : (normalizedTarget === 'ca' ? 'CA' : (normalizedTarget === 'bureau' ? 'Bureau' : normalizedTarget))
    });
  };

  const summaryText = getReunionPrivacySummaryText({
    targetGroup: normalizedTarget,
    reunionPrivacyMode,
    hideAgendaFromNonTarget,
    tagsDisponibles
  });

  const isCustomSelected = !['all', 'ca', 'bureau'].includes(normalizedTarget);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden p-3 bg-cordel-bg-light/85 border-2 border-dashed border-[var(--cordel-border)] rounded-[6px_10px_5px_8px] flex flex-col gap-3 text-left select-none">
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-encre-noire/15 pb-1.5 w-full min-w-0">
        <span className="text-[10.5px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5 min-w-0 truncate">
          <span className="shrink-0">🎯</span>
          <span className="truncate">Participants & Confidentialité</span>
        </span>
        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-white/80 border border-encre-noire/20 text-encre-noire shrink-0">
          {getTargetGroupDisplayName(normalizedTarget, tagsDisponibles, false)}
        </span>
      </div>

      {/* Étape 1 — Groupe convoqué */}
      <div className="flex flex-col gap-1.5 w-full min-w-0">
        <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-cordel-master-dark">
          1. Groupe convoqué :
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 w-full min-w-0">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSelectTargetGroup('all')}
            className={`py-2 px-2.5 text-[10px] font-black uppercase rounded border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
              normalizedTarget === 'all'
                ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire shadow-[2px_2px_0px_0px_#181716]'
                : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-50'
            }`}
          >
            <span className="shrink-0">👥</span>
            <span className="truncate">Toute l&apos;association</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSelectTargetGroup('ca')}
            className={`py-2 px-2.5 text-[10px] font-black uppercase rounded border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
              normalizedTarget === 'ca'
                ? 'bg-[var(--color-cordel-ocre)] text-white border-encre-noire shadow-[2px_2px_0px_0px_#181716]'
                : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-50'
            }`}
          >
            <span className="shrink-0">🏛️</span>
            <span className="truncate">Conseil d&apos;Administration</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handleSelectTargetGroup('bureau')}
            className={`py-2 px-2.5 text-[10px] font-black uppercase rounded border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-w-0 ${
              normalizedTarget === 'bureau'
                ? 'bg-cordel-wood text-white border-encre-noire shadow-[2px_2px_0px_0px_#181716]'
                : 'bg-white text-encre-noire border-encre-noire/30 hover:bg-neutral-50'
            }`}
          >
            <span className="shrink-0">🔒</span>
            <span className="truncate">Bureau uniquement</span>
          </button>
        </div>

        {customBadges.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 w-full min-w-0 mt-0.5">
            <span className="text-[9px] font-bold text-encre-noire/70 shrink-0">Autre badge :</span>
            <select
              value={isCustomSelected ? normalizedTarget : ''}
              disabled={disabled}
              onChange={(e) => {
                if (e.target.value) handleSelectTargetGroup(e.target.value);
              }}
              className="theme-input w-full sm:flex-1 min-w-0 max-w-full truncate text-sm px-3 py-2 bg-white"
            >
              <option value="">— Choisir une commission / étiquette spécifique —</option>
              {customBadges.map((b) => (
                <option key={b.id} value={b.id}>🏷️ {b.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Étape 2 — Mode de visibilité */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[9.5px] font-extrabold uppercase tracking-wider text-cordel-master-dark">
          2. Mode de visibilité dans l&apos;Agenda & le Varal :
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {/* Option A : Ouverte à tous */}
          <div
            onClick={() => handleSelectPrivacyMode('public')}
            className={`p-2 rounded border transition-all cursor-pointer flex items-start gap-2 ${
              reunionPrivacyMode === 'public'
                ? 'bg-[var(--color-cordel-vert)]/12 border-[var(--color-cordel-vert)] shadow-2xs'
                : 'bg-white/80 border-encre-noire/20 hover:bg-white'
            }`}
          >
            <input
              type="radio"
              checked={reunionPrivacyMode === 'public'}
              onChange={() => handleSelectPrivacyMode('public')}
              disabled={disabled}
              className="mt-0.5 accent-[var(--color-cordel-vert)] cursor-pointer"
            />
            <div className="flex flex-col text-[10.5px] leading-snug">
              <span className="font-black text-encre-noire">🌍 Ouverte à tous</span>
              <span className="text-[9.5px] text-encre-noire/75">
                Visible par tous, ordre du jour, boîte à idées et participations ouverts à toute l&apos;association.
              </span>
            </div>
          </div>

          {/* Option B : Transparente + sous-option masquage ODJ/CR */}
          <div
            onClick={() => handleSelectPrivacyMode('transparent')}
            className={`p-2 rounded border transition-all cursor-pointer flex flex-col gap-1.5 ${
              reunionPrivacyMode === 'transparent'
                ? 'bg-[var(--color-cordel-ocre)]/12 border-[var(--color-cordel-ocre)] shadow-2xs'
                : 'bg-white/80 border-encre-noire/20 hover:bg-white'
            }`}
          >
            <div className="flex items-start gap-2">
              <input
                type="radio"
                checked={reunionPrivacyMode === 'transparent'}
                onChange={() => handleSelectPrivacyMode('transparent')}
                disabled={disabled}
                className="mt-0.5 accent-[var(--color-cordel-ocre)] cursor-pointer"
              />
              <div className="flex flex-col text-[10.5px] leading-snug">
                <span className="font-black text-encre-noire">🏛️ Transparente (Date visible par tous)</span>
                <span className="text-[9.5px] text-encre-noire/75">
                  Seul le groupe convoqué peut voter au sondage de dates et émarger, mais tous les adhérents voient la réunion dans l&apos;agenda.
                </span>
              </div>
            </div>

            {reunionPrivacyMode === 'transparent' && (
              <label
                onClick={(e) => e.stopPropagation()}
                className="ml-5 mt-0.5 p-1.5 rounded bg-white/90 border border-dashed border-[var(--color-cordel-ocre)]/50 flex items-start gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={Boolean(hideAgendaFromNonTarget)}
                  onChange={(e) => handleToggleHideAgenda(e.target.checked)}
                  disabled={disabled}
                  className="mt-0.5 w-3.5 h-3.5 rounded accent-cordel-wood cursor-pointer"
                />
                <span className="text-[9.5px] font-bold text-encre-noire leading-snug">
                  🔒 Masquer les sujets de l&apos;ordre du jour et le compte-rendu aux membres hors du groupe convoqué
                </span>
              </label>
            )}
          </div>

          {/* Option C : Huis clos / Guichet fermé */}
          <div
            onClick={() => handleSelectPrivacyMode('huis_clos')}
            className={`p-2 rounded border transition-all cursor-pointer flex items-start gap-2 ${
              reunionPrivacyMode === 'huis_clos'
                ? 'bg-cordel-wood/12 border-cordel-wood shadow-2xs'
                : 'bg-white/80 border-encre-noire/20 hover:bg-white'
            }`}
          >
            <input
              type="radio"
              checked={reunionPrivacyMode === 'huis_clos'}
              onChange={() => handleSelectPrivacyMode('huis_clos')}
              disabled={disabled}
              className="mt-0.5 accent-cordel-wood cursor-pointer"
            />
            <div className="flex flex-col text-[10.5px] leading-snug">
              <span className="font-black text-cordel-wood">🕵️ Huis clos / Guichet fermé</span>
              <span className="text-[9.5px] text-encre-noire/75">
                L&apos;événement (sondage de dates inclus), l&apos;ordre du jour et le compte-rendu sont totalement invisibles pour tout membre hors du groupe convoqué.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bandeau récapitulatif rassurant */}
      <div
        className={`p-2 rounded border text-[10px] font-bold leading-snug ${
          reunionPrivacyMode === 'huis_clos'
            ? 'bg-red-50/90 text-cordel-wood border-cordel-wood/40'
            : reunionPrivacyMode === 'transparent'
            ? 'bg-amber-50/90 text-amber-950 border-amber-500/40'
            : 'bg-emerald-50/90 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40'
        }`}
      >
        {summaryText}
      </div>
    </div>
  );
}

