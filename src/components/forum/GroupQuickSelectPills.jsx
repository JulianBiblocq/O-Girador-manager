import React, { useMemo } from 'react';
import {
  isRenfortMember,
  resolveMemberPrimaryPupitre,
  getEffectiveMemberTags,
  getCanonicalTagKey,
  isDefaultMemberBadge
} from '../../utils/trombinoscopeUtils';

/** Ordre d'affichage des 5 pupitres principaux pour la sélection rapide */
const PRIMARY_PUPITRE_PILLS = [
  { id: 'alfaias', label: 'Alfaias' },
  { id: 'caixas', label: 'Caixas' },
  { id: 'sementes', label: 'Sementes' },
  { id: 'gongue', label: 'Gonguê' },
  { id: 'danse', label: 'Danse' }
];

/** Priorité d'affichage des étiquettes institutionnelles */
const TAG_PRIORITY_ORDER = {
  bureau: 1,
  ca: 2,
  president: 3,
  tresorier: 4,
  secretaire: 5
};

/**
 * Résout le libellé d'affichage propre d'une étiquette selon sa clé canonique.
 */
function resolveTagPillLabel(rawTag, canonicalKey) {
  if (canonicalKey === 'bureau') return 'Bureau';
  if (canonicalKey === 'ca') return 'CA';
  const rawLabel = typeof rawTag === 'object'
    ? (rawTag.nomM || rawTag.nom || rawTag.label || rawTag.id || '')
    : String(rawTag || '').trim();
  return rawLabel || canonicalKey;
}

/**
 * Barre de sélection rapide par pastilles (Pill Toggles Cordel) pour la création d'un groupe :
 * - Rangée 1 (🥁 Pupitres) : regroupement strict par pupitre principal (hors secondaire et renforts).
 * - Rangée 2 (🏷️ Étiquettes) : extraction dynamique avec héritage (ex: CA inclut Bureau).
 */
export default function GroupQuickSelectPills({
  activeMembers = [],
  selectedMemberIds = [],
  onToggleGroupMembers
}) {
  const { pupitrePills, tagPills } = useMemo(() => {
    const byPupitre = {
      alfaias: [],
      caixas: [],
      sementes: [],
      gongue: [],
      danse: []
    };
    const tagMap = new Map();

    activeMembers.forEach((member) => {
      if (!member?.id) return;

      // 1. Pupitre principal uniquement (en ignorant instrumentSecondaire et les renforts/secours)
      if (!isRenfortMember(member)) {
        const primaryPupitre = resolveMemberPrimaryPupitre(member);
        if (byPupitre[primaryPupitre]) {
          byPupitre[primaryPupitre].push(member.id);
        }
      }

      // 2. Étiquettes effectives avec héritage (Présidence / Trésorerie / Secrétaire -> Bureau -> CA)
      const effectiveTags = getEffectiveMemberTags(member);
      effectiveTags.forEach((rawTag) => {
        const canonicalKey = getCanonicalTagKey(rawTag);
        if (!canonicalKey || isDefaultMemberBadge(rawTag) || isDefaultMemberBadge(canonicalKey)) return;

        if (!tagMap.has(canonicalKey)) {
          tagMap.set(canonicalKey, {
            id: canonicalKey,
            label: resolveTagPillLabel(rawTag, canonicalKey),
            memberIds: []
          });
        }
        const entry = tagMap.get(canonicalKey);
        if (!entry.memberIds.includes(member.id)) {
          entry.memberIds.push(member.id);
        }
      });
    });

    const resolvedPupitres = PRIMARY_PUPITRE_PILLS
      .map((p) => ({
        id: p.id,
        label: p.label,
        memberIds: byPupitre[p.id] || []
      }))
      .filter((p) => p.memberIds.length > 0);

    const resolvedTags = Array.from(tagMap.values())
      .filter((t) => t.memberIds.length > 0)
      .sort((a, b) => {
        const prioA = TAG_PRIORITY_ORDER[a.id] || 99;
        const prioB = TAG_PRIORITY_ORDER[b.id] || 99;
        if (prioA !== prioB) return prioA - prioB;
        return a.label.localeCompare(b.label, 'fr');
      });

    return { pupitrePills: resolvedPupitres, tagPills: resolvedTags };
  }, [activeMembers]);

  if (pupitrePills.length === 0 && tagPills.length === 0) return null;

  const renderPillButton = (pill, prefix) => {
    const isAllSelected =
      pill.memberIds.length > 0 &&
      pill.memberIds.every((id) => selectedMemberIds.includes(id));

    return (
      <button
        key={`${prefix}-${pill.id}`}
        type="button"
        onClick={() => onToggleGroupMembers(pill.memberIds, pill.label)}
        className={`px-2 py-0.5 text-[10px] font-black rounded-[var(--theme-border-radius-sm)] border transition-all cursor-pointer flex items-center gap-1 select-none ${
          isAllSelected
            ? 'bg-[var(--cordel-wood)] text-[var(--theme-bg)] border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
            : 'bg-cordel-bg-light text-encre-noire border-cordel-master-dark/30 hover:border-encre-noire'
        }`}
        title={`Sélectionner / Désélectionner tous les membres de ${pill.label} (${pill.memberIds.length})`}
      >
        <span>{pill.label}</span>
        <span className="opacity-80 font-bold">({pill.memberIds.length})</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 pt-1">
      {pupitrePills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark/80 mr-1 shrink-0">
            🥁 Pupitres :
          </span>
          {pupitrePills.map((pill) => renderPillButton(pill, 'pupitre'))}
        </div>
      )}

      {tagPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark/80 mr-1 shrink-0">
            🏷️ Étiquettes :
          </span>
          {tagPills.map((pill) => renderPillButton(pill, 'tag'))}
        </div>
      )}
    </div>
  );
}

