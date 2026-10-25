import React from 'react';
import { XiloMegaphone } from '../XiloIcons';
import { formatTagGender, getTagId } from '../../utils/tagUtils';
import AnnonceTargetUserPicker from './AnnonceTargetUserPicker';

/**
 * Composant de sélection des cibles pour une annonce (Tous, Rôle admin, Tags et Membres nominatifs).
 */
export default function AnnonceTargetSelector({
  cibles = ['Tous'],
  setCibles,
  targetUserIds = [],
  setTargetUserIds,
  tagsDisponibles = [],
  allMembers = [],
  disabled = false,
  t
}) {
  const handleCibleToggle = (target) => {
    if (disabled) return;

    if (target === 'Tous') {
      setCibles(['Tous']);
      setTargetUserIds([]);
    } else {
      setCibles((prev) => {
        let copy = prev.filter((c) => c !== 'Tous');
        const idx = copy.indexOf(target);
        if (idx > -1) {
          copy.splice(idx, 1);
        } else {
          copy.push(target);
        }
        if (copy.length === 0 && targetUserIds.length === 0) {
          copy = ['Tous'];
        }
        return copy;
      });
    }
  };

  const handleTargetUsersChange = (newTargetUserIds) => {
    if (disabled) return;
    setTargetUserIds(newTargetUserIds);

    // Si on ajoute des membres nominatifs et que cibles contenait 'Tous', on retire 'Tous'
    if (newTargetUserIds.length > 0) {
      setCibles((prev) => prev.filter((c) => c !== 'Tous'));
    } else if (cibles.length === 0) {
      setCibles(['Tous']);
    }
  };

  return (
    <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/15 text-left">
      <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
        {t('widgetAnnonces.targetsLabel')}
      </label>

      {/* Badges de sélection rapide des groupes et pupitres */}
      <div className="flex flex-wrap gap-1.5 p-2 border border-dashed border-encre-noire/25 rounded bg-[#fdfaf2] dark:bg-[#201d1a] max-h-24 overflow-y-auto">
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleCibleToggle('Tous')}
          className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold ${
            cibles.includes('Tous')
              ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <XiloMegaphone size={10} /> {t('widgetAnnonces.targetAll')}
          </span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleCibleToggle('role:admin')}
          className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold ${
            cibles.includes('role:admin')
              ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
              : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
          }`}
        >
          👑 {t('widgetAnnonces.targetAdmins')}
        </button>

        {tagsDisponibles.map((tag) => {
          const tagId = getTagId(tag);
          const formattedLabel = formatTagGender(tag, null, false, tagsDisponibles);
          const isActive = cibles.includes(tagId) || (typeof tag === 'string' && cibles.includes(tag));
          return (
            <button
              key={tagId}
              type="button"
              disabled={disabled}
              onClick={() => handleCibleToggle(tagId)}
              className={`text-[9px] px-2 py-0.5 border rounded-[3px_5px_2px_4px] transition-all cursor-pointer font-bold ${
                isActive
                  ? 'bg-cordel-wood text-cordel-bg-light border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                  : 'bg-transparent text-encre-noire border-dashed border-encre-noire/30'
              }`}
            >
              🏷️ {formattedLabel}
            </button>
          );
        })}
      </div>

      {/* Sélecteur nominatif multi-membres */}
      <AnnonceTargetUserPicker
        selectedUserIds={targetUserIds}
        onChange={handleTargetUsersChange}
        allMembers={allMembers}
        disabled={disabled}
      />
    </div>
  );
}
