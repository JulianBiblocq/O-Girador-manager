import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function TabAgenda({
  formData,
  handleChange,
  saving,
  t
}) {
  const {
    agendaRequireInstrument = false,
    agendaEnableMaybeStatus = true,
    agendaEnableStageLayout = true,
    agendaEnableRevisionProgram = true,
    agendaEnableCarpool = true,
    agendaEnableFinance = true,
    agendaEnableInscriptions = true,
    eventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion']
  } = formData;

  const [newType, setNewType] = useState('');

  const handleAddType = () => {
    if (!newType.trim()) return;
    const cleanType = newType.trim().toLowerCase();
    if (eventTypes.includes(cleanType)) {
      alert("Ce type d'événement existe déjà.");
      return;
    }
    handleChange('eventTypes', [...eventTypes, cleanType]);
    setNewType('');
  };

  const handleRemoveType = (typeToRemove) => {
    const minTypes = 1;
    if (eventTypes.length <= minTypes) {
      alert("Vous devez conserver au moins un type d'événement.");
      return;
    }
    const confirmMsg = t('widgetAgenda.confirmRemoveType') || `Voulez-vous vraiment supprimer le type "${typeToRemove}" ? Les événements existants de ce type ne seront pas supprimés mais ne seront plus typés dans les filtres.`;
    if (window.confirm(confirmMsg)) {
      handleChange('eventTypes', eventTypes.filter(t => t !== typeToRemove));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* Contrôles On/Off */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          ⚙️ Options de l'Agenda
        </h3>
        <div className="flex flex-col gap-4 text-xs font-semibold text-encre-noire select-none">
          
          {/* Impositions Inscriptions (RSVP) */}
          <div className="flex items-start gap-2.5 cursor-pointer">
            <input 
              type="checkbox"
              id="agendaEnableInscriptions"
              checked={agendaEnableInscriptions}
              onChange={(e) => handleChange('agendaEnableInscriptions', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableInscriptions" className="font-bold text-encre-noire cursor-pointer">
                Activer les inscriptions (RSVP)
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet aux adhérents de se déclarer présents, absents ou à confirmer aux événements.
              </span>
            </div>
          </div>

          {/* Imposition Instrument */}
          {agendaEnableInscriptions && (
            <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
              <input 
                type="checkbox"
                id="agendaRequireInstrument"
                checked={agendaRequireInstrument}
                onChange={(e) => handleChange('agendaRequireInstrument', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              />
              <div className="flex flex-col text-left">
                <label htmlFor="agendaRequireInstrument" className="font-bold text-encre-noire cursor-pointer">
                  Imposer le choix de l'instrument lors de l'inscription
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Force les adhérents à spécifier l'instrument qu'ils joueront, même s'ils n'en ont qu'un seul dans leur profil.
                </span>
              </div>
            </div>
          )}

          {/* Statut À Confirmer */}
          {agendaEnableInscriptions && (
            <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
              <input 
                type="checkbox"
                id="agendaEnableMaybeStatus"
                checked={agendaEnableMaybeStatus}
                onChange={(e) => handleChange('agendaEnableMaybeStatus', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              />
              <div className="flex flex-col text-left">
                <label htmlFor="agendaEnableMaybeStatus" className="font-bold text-encre-noire cursor-pointer">
                  Activer l'option "À confirmer" pour les réponses
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Permet aux membres de répondre "À confirmer" aux événements plutôt que de choisir uniquement entre "Présent" ou "Absent".
                </span>
              </div>
            </div>
          )}

          {/* Plan de scène */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableStageLayout"
              checked={agendaEnableStageLayout}
              onChange={(e) => handleChange('agendaEnableStageLayout', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableStageLayout" className="font-bold text-encre-noire cursor-pointer">
                Activer le module de Plan de Scène
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Affiche la grille de placement scénique interactif sur la fiche détaillée des événements.
              </span>
            </div>
          </div>

          {/* Programme de révision */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableRevisionProgram"
              checked={agendaEnableRevisionProgram}
              onChange={(e) => handleChange('agendaEnableRevisionProgram', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableRevisionProgram" className="font-bold text-encre-noire cursor-pointer">
                Activer le module Programme de Révision (Séquenceur JSON)
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet d'ajouter des morceaux de musique et des séquences rythmiques JSON à travailler sur les événements.
              </span>
            </div>
          </div>

          {/* Covoiturage & Convoi */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableCarpool"
              checked={agendaEnableCarpool}
              onChange={(e) => handleChange('agendaEnableCarpool', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableCarpool" className="font-bold text-encre-noire cursor-pointer">
                Activer le module Covoiturage & Convoi
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet aux conducteurs de proposer des trajets et d'organiser les départs collectifs aux événements.
              </span>
            </div>
          </div>

          {/* Bilan financier */}
          <div className="flex items-start gap-2.5 cursor-pointer border-t border-dashed border-cordel-master-dark/10 pt-3">
            <input 
              type="checkbox"
              id="agendaEnableFinance"
              checked={agendaEnableFinance}
              onChange={(e) => handleChange('agendaEnableFinance', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col text-left">
              <label htmlFor="agendaEnableFinance" className="font-bold text-encre-noire cursor-pointer">
                Activer le Bilan Financier des événements
              </label>
              <span className="text-[10px] text-neutral-500 font-medium">
                Permet aux administrateurs de renseigner les recettes et dépenses générées par chaque événement.
              </span>
            </div>
          </div>

        </div>
      </CordelCard>

      {/* Types d'événements dynamiques */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          📋 Catégories et Types d'Événements
        </h3>
        
        {/* Ajouter un type */}
        <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Ajouter un type d'événement</span>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="Ex: ca, forum des assos, festival..."
              disabled={saving}
              className="theme-input text-xs font-bold py-1.5 flex-1 bg-cordel-bg-light"
            />
            <CordelButton 
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleAddType}
              disabled={saving || !newType.trim()}
              className="text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
            >
              + Ajouter
            </CordelButton>
          </div>
        </div>

        {/* Liste des types */}
        <div className="flex flex-col gap-2 mt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">Types actifs</span>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {eventTypes.map((type) => (
              <span 
                key={type}
                className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed flex items-center gap-1.5 capitalize font-bold"
              >
                {type}
                <button 
                  type="button"
                  onClick={() => handleRemoveType(type)}
                  className="text-[9px] hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                  title="Supprimer"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      </CordelCard>

    </div>
  );
}
