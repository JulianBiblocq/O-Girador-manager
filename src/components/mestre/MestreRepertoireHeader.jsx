import React from 'react';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * En-tête compact et barre d'actions du Répertoire Mestria (< 100 lignes).
 * Aligné sur une seule ligne sur grand écran (desktop lg).
 *
 * @param {boolean} isRepertoireOpen - État d'ouverture du répertoire aux adhérents
 * @param {Function} onToggleRepertoire - Callback de bascule du statut d'ouverture
 * @param {boolean} isToggling - Indicateur d'enregistrement en cours
 * @param {Function} onOpenBatchVideo - Callback d'ouverture de l'affectation par lot
 * @param {Function} onAddPiece - Callback d'ajout d'un morceau
 */
export default function MestreRepertoireHeader({
  isRepertoireOpen,
  onToggleRepertoire,
  isToggling = false,
  onOpenBatchVideo,
  onAddPiece
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-3 border-b-2 border-dashed border-cordel-master-dark/30">
      {/* Titre et description de la direction artistique */}
      <div>
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <span>📜</span>
          <span>Direction Artistique — {t('repertoire.catalogTitle') || 'Répertoire de la Troupe'}</span>
        </h2>
        <p className="text-[11px] font-bold text-encre-noire/70 mt-0.5">
          Architecture réactive vivante liée au Séquenceur, au Varal et à Dançad'Or
        </p>
      </div>

      {/* Barre d'actions compacte alignée sur Desktop */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* 1. Pastille compacte : 🔒 Masqué / 🟢 Ouvert */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px_6px_3px_5px] border text-xs font-black transition-all select-none shadow-2xs ${
            isRepertoireOpen
              ? 'bg-emerald-50 text-emerald-900 border-emerald-700/60'
              : 'bg-stone-100 text-stone-700 border-stone-400'
          }`}
        >
          {isRepertoireOpen ? (
            <>
              <span className="flex items-center gap-1">
                <span className="text-[10px]">🟢</span>
                <span>Ouvert au groupe</span>
              </span>
              <button
                type="button"
                onClick={onToggleRepertoire}
                disabled={isToggling}
                className="ml-1 text-[10px] font-black uppercase text-[var(--color-cordel-rouge,#8b2a1a)] hover:underline cursor-pointer disabled:opacity-50"
                title="Masquer le répertoire aux adhérents"
              >
                Masquer
              </button>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1 text-stone-600">
                <span className="text-[10px]">🔒</span>
                <span>Masqué</span>
              </span>
              <button
                type="button"
                onClick={onToggleRepertoire}
                disabled={isToggling}
                className="ml-1 text-[10px] font-black uppercase text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer disabled:opacity-50"
                title="Ouvrir le répertoire aux adhérents"
              >
                Ouvrir
              </button>
            </>
          )}
        </div>

        {/* 2. Bouton : 🎬 AFFECTER VIDÉO PAR LOT */}
        <CordelButton
          type="button"
          variant="default"
          useExtremeBorder={true}
          onClick={onOpenBatchVideo}
          className="py-1 px-2.5 text-xs font-black uppercase tracking-wider shrink-0 flex items-center gap-1.5"
          title="Affecter une vidéo à plusieurs morceaux du répertoire"
        >
          <span>🎬</span>
          <span>Affecter vidéo par lot</span>
        </CordelButton>

        {/* 3. Bouton principal : ➕ AJOUTER UN MORCEAU */}
        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={onAddPiece}
          className="py-1 px-3 text-xs font-black uppercase tracking-wider shrink-0"
        >
          ➕ Ajouter un morceau
        </CordelButton>
      </div>
    </div>
  );
}
