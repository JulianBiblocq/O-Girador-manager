import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { launchGlobalSequencer, launchTrainingStage, resolveUserSequencerRole } from '../../utils/trainingLauncher';
import RoleSelectorMiniModal from './RoleSelectorMiniModal';

/**
 * Composant de découplage des accès vers le Séquenceur (< 115 lignes) :
 * - Bouton 1 : [ 🎧 Écouter dans le Séquenceur ] (PT : Ouvir no Sequenciador)
 * - Bouton 2 : [ 🎯 S'entraîner (Jouer avec) ] (PT : Treinar (Tocar Junto))
 * Zéro anglicisme "play-along" garanti.
 */
export default function SequencerAccessButtons({
  piece,
  sequenceurUrl,
  profileData = null,
  className = ''
}) {
  const { t, locale } = useTranslation();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const presetId = piece?.sequenceurId || piece?.presetId;
  if (!presetId) return null;

  const rawInstrument = profileData?.instrumentPrincipal || profileData?.instrument || '';
  const resolvedRole = resolveUserSequencerRole(profileData || rawInstrument);

  // Lancement interactif « Jouer avec »
  const handleLaunchPlayAlong = (overrideRole = null) => {
    const activeRole = overrideRole || resolvedRole;
    if (!activeRole) {
      setIsRoleModalOpen(true);
      return;
    }
    launchTrainingStage(presetId, null, 0, {
      baseUrl: sequenceurUrl,
      role: activeRole,
      tocarJunto: 1,
      baseOnly: 1
    });
  };

  const isPt = locale === 'pt';
  const labelListen = isPt ? "Ouvir no Sequenciador" : (t('repertoire.btnListenSequencer') || "Écouter dans le Séquenceur");
  const labelTrain = isPt ? "Treinar (Tocar Junto)" : (t('repertoire.btnTrainTocarJunto') || "S'entraîner (Jouer avec)");

  return (
    <>
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {/* Bouton 1 : Écoute globale */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            launchGlobalSequencer(presetId, { baseUrl: sequenceurUrl });
          }}
          className="px-2.5 py-1 text-xs font-black rounded border border-encre-noire/25 bg-white text-stone-700 hover:bg-stone-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs select-none"
          title={isPt ? "Ouvrir a música completa com todas as faixas" : "Ouvrir le morceau intégral dans le Séquenceur"}
        >
          <span>🎧</span>
          <span>{labelListen}</span>
        </button>

        {/* Bouton 2 : Entraînement interactif (Jouer avec) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleLaunchPlayAlong();
          }}
          className="px-2.5 py-1 text-xs font-black rounded border border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs select-none"
          title={isPt ? "Praticar com seu instrumento mutado" : "Pratiquer en coupant votre pupitre"}
        >
          <span>🎯</span>
          <span>{labelTrain}</span>
        </button>
      </div>

      {/* Micro-sélecteur de pupitre si aucun instrument dans le profil */}
      {isRoleModalOpen && (
        <RoleSelectorMiniModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSelectRole={(chosenRole) => handleLaunchPlayAlong(chosenRole)}
        />
      )}
    </>
  );
}
