import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Sélecteur interactif modulaire du statut de saison et de la maturité artistique
 * directement affiché sur la fiche morceau du répertoire (sans avoir à l'éditer).
 *
 * Conforme à la charte sémantique Cordel (Vert / Terre Cuite / Ocre)
 * et à la règle d'isolation anti-monolithe.
 *
 * @param {Object} props
 * @param {Object} props.piece - Données du morceau ciblé
 * @param {string} props.groupId - Identifiant de l'association
 * @param {Function} [props.onStatusChange] - Callback notifiant le parent avec message toast
 */
export default function RepertoirePieceStatusSelector({
  piece,
  groupId,
  onStatusChange
}) {
  const [openSeasonMenu, setOpenSeasonMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef(null);

  // Fermeture automatique au clic en dehors du menu déroulant
  useEffect(() => {
    if (!openSeasonMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenSeasonMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openSeasonMenu]);

  if (!piece) return null;

  const statutSaison = piece.statutSaison || 'saison';
  const isPret = piece.etatValidation === 'pret';

  // Mise à jour du statut de saison dans Firestore
  const handleSelectSeason = async (newStatut) => {
    if (newStatut === statutSaison || isUpdating || !groupId) {
      setOpenSeasonMenu(false);
      return;
    }
    setIsUpdating(true);
    setOpenSeasonMenu(false);
    try {
      const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
      await updateDoc(pieceRef, {
        statutSaison: newStatut,
        updatedAt: new Date().toISOString()
      });
      if (onStatusChange) {
        const labels = {
          saison: 'Au programme cette année',
          chantier: 'En préparation / Chantier',
          archive: 'Au frigo / Archives'
        };
        onStatusChange(`« ${piece.titre} » déplacé vers : ${labels[newStatut] || newStatut}`);
      }
    } catch (err) {
      console.error("Erreur mise à jour statut saison :", err);
      if (onStatusChange) onStatusChange("Erreur lors de la mise à jour du statut.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Bascule rapide de la maturité artistique (Validé / Prêt ⇄ En chantier)
  const handleToggleValidation = async () => {
    if (isUpdating || !groupId) return;
    setIsUpdating(true);
    const nextValidation = isPret ? 'a_faire' : 'pret';
    try {
      const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
      await updateDoc(pieceRef, {
        etatValidation: nextValidation,
        updatedAt: new Date().toISOString()
      });
      if (onStatusChange) {
        onStatusChange(
          nextValidation === 'pret'
            ? `« ${piece.titre} » validé pour la scène !`
            : `« ${piece.titre} » marqué en chantier / en répétition.`
        );
      }
    } catch (err) {
      console.error("Erreur mise à jour maturité artistique :", err);
      if (onStatusChange) onStatusChange("Erreur lors de la mise à jour de la maturité.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Styles et pastilles sémantiques Cordel pour la saison
  const seasonConfig = {
    saison: {
      label: 'Au programme',
      icon: '🟢',
      badgeClass: 'bg-green-100 text-green-950 border-green-600 hover:bg-green-200'
    },
    chantier: {
      label: 'En préparation',
      icon: '🟡',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-600 hover:bg-amber-200'
    },
    archive: {
      label: 'Au frigo',
      icon: '⚪',
      badgeClass: 'bg-stone-200 text-stone-800 border-stone-400 hover:bg-stone-300'
    }
  }[statutSaison] || {
    label: 'Au programme',
    icon: '🟢',
    badgeClass: 'bg-green-100 text-green-950 border-green-600 hover:bg-green-200'
  };

  return (
    <div
      className="flex items-center gap-1.5 flex-wrap justify-end relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Sélecteur rapide de statut saison */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => setOpenSeasonMenu(!openSeasonMenu)}
          className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs select-none ${seasonConfig.badgeClass} ${
            isUpdating ? 'opacity-50 cursor-wait' : ''
          }`}
          title="Modifier le statut de la saison : Au programme / En préparation / Au frigo"
        >
          <span>{seasonConfig.icon}</span>
          <span className="truncate max-w-[100px]">{seasonConfig.label}</span>
          <span className="text-[7.5px] opacity-70">▾</span>
        </button>

        {/* Menu contextuel Cordel pour le choix de saison */}
        {openSeasonMenu && (
          <div className="absolute right-0 top-full mt-1.5 z-40 min-w-[210px] p-1.5 bg-[#fdfaf2] border-2 border-encre-noire rounded-[6px_8px_5px_7px] shadow-[3px_3px_0px_0px_#181716] flex flex-col gap-1 text-left animate-fade-in">
            <div className="px-2 py-1 text-[8.5px] uppercase font-black tracking-wider text-cordel-wood border-b border-dashed border-cordel-wood/25">
              Statut de la saison
            </div>

            <button
              type="button"
              onClick={() => handleSelectSeason('saison')}
              className={`w-full px-2 py-1.5 rounded text-[10px] font-extrabold flex items-center justify-between transition-colors cursor-pointer ${
                statutSaison === 'saison'
                  ? 'bg-green-100 text-green-950 font-black'
                  : 'hover:bg-black/5 text-encre-noire'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>🟢</span>
                <span>Au programme cette année</span>
              </span>
              {statutSaison === 'saison' && <span className="text-xs font-black text-green-800">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => handleSelectSeason('chantier')}
              className={`w-full px-2 py-1.5 rounded text-[10px] font-extrabold flex items-center justify-between transition-colors cursor-pointer ${
                statutSaison === 'chantier'
                  ? 'bg-amber-100 text-amber-950 font-black'
                  : 'hover:bg-black/5 text-encre-noire'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>🟡</span>
                <span>En préparation / Chantier</span>
              </span>
              {statutSaison === 'chantier' && <span className="text-xs font-black text-amber-800">✓</span>}
            </button>

            <button
              type="button"
              onClick={() => handleSelectSeason('archive')}
              className={`w-full px-2 py-1.5 rounded text-[10px] font-extrabold flex items-center justify-between transition-colors cursor-pointer ${
                statutSaison === 'archive'
                  ? 'bg-stone-200 text-stone-900 font-black'
                  : 'hover:bg-black/5 text-encre-noire'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>⚪</span>
                <span>Au frigo / Archives</span>
              </span>
              {statutSaison === 'archive' && <span className="text-xs font-black text-stone-800">✓</span>}
            </button>
          </div>
        )}
      </div>

      {/* 2. Bouton de bascule rapide de Maturité artistique */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={handleToggleValidation}
        className={`px-2 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs select-none shrink-0 ${
          isPret
            ? 'bg-green-100 text-green-950 border-green-600 hover:bg-green-200'
            : 'bg-amber-100 text-amber-950 border-amber-600 hover:bg-amber-200'
        } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
        title={`Maturité artistique : ${isPret ? 'Validé pour la scène' : 'En chantier / En répétition'}. Cliquer pour basculer.`}
      >
        <span>{isPret ? '🟢' : '🟡'}</span>
        <span>{isPret ? 'Validé / Prêt' : 'En chantier'}</span>
      </button>
    </div>
  );
}
