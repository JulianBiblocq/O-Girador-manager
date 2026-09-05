import React, { useState } from 'react';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import TabAgenda from '../association-settings/TabAgenda';
import TabLieux from '../association-settings/TabLieux';
import TabAutomations from '../association-settings/TabAutomations';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Composant de gestion des Lieux, Salles, Types d'Événements et Relances Automatiques pour le Secrétariat.
 */
export default function SecretariatAgendaLieux({ groupId, onBack, initialSubTab = 'lieux' }) {
  const { t } = useTranslation();
  const [subTab, setSubTab] = useState(initialSubTab);

  const {
    formData,
    handleChange,
    saving,
    loading,
    toastMessage,
    handleSave
  } = useAssociationSettings(groupId, true, onBack, t);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="animate-spin text-4xl select-none">⏳</div>
        <p className="font-semibold text-xs uppercase tracking-widest text-cordel-master-dark opacity-60">
          Chargement de la configuration agenda, lieux et relances...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left select-none max-w-4xl mx-auto w-full">
      {/* En-tête avec fil d'ariane et bouton retour */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-dashed border-cordel-master-dark/30">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-cordel-master-dark uppercase tracking-wider mb-1">
            <span>Secrétariat</span>
            <span>›</span>
            <span className="text-[#2d6a4f] dark:text-emerald-400">Lieux, Types & Relances</span>
          </div>
          <h2 className="text-xl font-black text-cordel-wood uppercase flex items-center gap-2">
            <span>📍</span> Salles, Lieux, Types & Relances
          </h2>
          <p className="text-xs text-cordel-master-dark/75 mt-0.5">
            Gérez le répertoire des salles habituelles, paramétrez les types d'événements et configurez les relances automatiques de présence.
          </p>
        </div>

        {onBack && (
          <CordelButton
            type="button"
            onClick={onBack}
            className="text-xs font-bold"
          >
            ⬅️ Retour
          </CordelButton>
        )}
      </div>

      {/* Sélecteur de sous-onglets */}
      <div className="flex flex-wrap gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2 mb-1 select-none">
        <button
          type="button"
          onClick={() => setSubTab('lieux')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
            subTab === 'lieux'
              ? 'bg-[#2d6a4f] text-white border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          📍 Salles & Lieux Habituels
        </button>
        <button
          type="button"
          onClick={() => setSubTab('agenda')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
            subTab === 'agenda'
              ? 'bg-[#2d6a4f] text-white border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          📅 Types d'Événements & Options Agenda
        </button>
        <button
          type="button"
          onClick={() => setSubTab('relances')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer ${
            subTab === 'relances'
              ? 'bg-[#2d6a4f] text-white border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
              : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
          }`}
        >
          ⏰ Relances Automatiques
        </button>
      </div>

      {/* Contenu principal selon le sous-onglet */}
      <div className="flex flex-col gap-4">
        {subTab === 'lieux' ? (
          <TabLieux 
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        ) : subTab === 'agenda' ? (
          <TabAgenda 
            formData={formData}
            handleChange={handleChange}
            saving={saving}
            t={t}
          />
        ) : (
          <TabAutomations 
            groupId={groupId} 
            eventTypes={formData?.eventTypes || ['prestation', 'repetition', 'stage', 'atelier', 'reunion']} 
            t={t} 
          />
        )}

        {/* Bouton de sauvegarde global (uniquement pour Lieux et Agenda, Relances disposant de son propre cycle) */}
        {subTab !== 'relances' && (
          <div className="flex justify-end pt-3 border-t border-dashed border-cordel-master-dark/20">
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 uppercase font-black tracking-wider text-xs shadow-[2px_2px_0px_0px_#181716]"
            >
              {saving ? "Enregistrement..." : "💾 Enregistrer la Configuration"}
            </CordelButton>
          </div>
        )}
      </div>

      {/* Toast de confirmation */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-emerald-900 text-white font-black text-xs px-6 py-3 rounded-lg shadow-[3px_3px_0px_0px_#181716] border-2 border-encre-noire flex items-center gap-2.5 select-none animate-fade-in">
          <span className="text-base">✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
