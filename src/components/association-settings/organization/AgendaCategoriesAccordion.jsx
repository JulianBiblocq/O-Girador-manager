import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import useConfirm from '../../../hooks/useConfirm';

/**
 * Accordéon compact pour les catégories d'événements et options de l'agenda.
 */
export default function AgendaCategoriesAccordion({ formData = {}, handleChange, saving }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newType, setNewType] = useState('');
  const { confirm } = useConfirm();

  const eventTypes = Array.isArray(formData.eventTypes) && formData.eventTypes.length > 0
    ? formData.eventTypes
    : ['prestation', 'repetition', 'stage', 'atelier', 'reunion'];

  const handleAddType = () => {
    if (!newType.trim()) return;
    const cleanType = newType.trim().toLowerCase();
    if (eventTypes.includes(cleanType)) {
      alert("Ce type d'événement existe déjà.");
      return;
    }
    const updatedTypes = [...eventTypes, cleanType];
    handleChange('eventTypes', updatedTypes);
    setNewType('');
  };

  const handleRemoveType = async (typeToRemove) => {
    if (eventTypes.length <= 1) {
      alert("Vous devez conserver au moins un type d'événement.");
      return;
    }
    const isOk = await confirm({
      title: "Supprimer le type d'événement",
      message: `Voulez-vous vraiment supprimer "${typeToRemove}" des filtres ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (isOk) {
      handleChange('eventTypes', eventTypes.filter(t => t !== typeToRemove));
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* En-tête principal compact */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">🗓️</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Catégories d'Événements & Agenda ({eventTypes.length}) {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            (Types de dates, RSVP, filtres)
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? 'Fermer' : 'Gérer'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-4 text-left animate-fade-in bg-white/40">
          {/* Options générales de l'agenda */}
          <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/20">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              ⚙️ Options Générales de l'Agenda
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-bold text-stone-700">
              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.agendaEnableInscriptions !== false}
                  onChange={(e) => handleChange('agendaEnableInscriptions', e.target.checked)}
                  disabled={saving}
                />
                <span>Activer les inscriptions (RSVP Présent / Absent)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.agendaEnableMaybeStatus !== false}
                  onChange={(e) => handleChange('agendaEnableMaybeStatus', e.target.checked)}
                  disabled={saving}
                />
                <span>Autoriser le statut "À confirmer"</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.agendaEnableCarpool !== false}
                  onChange={(e) => handleChange('agendaEnableCarpool', e.target.checked)}
                  disabled={saving}
                />
                <span>Activer le covoiturage sur les événements</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-stone-200">
                <input
                  type="checkbox"
                  checked={formData.agendaRequireInstrument || false}
                  onChange={(e) => handleChange('agendaRequireInstrument', e.target.checked)}
                  disabled={saving}
                />
                <span>Imposer le choix d'un instrument au vote</span>
              </label>
            </div>
          </div>

          {/* Types d'événements actifs */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
                🏷️ Types d'Événements Actifs
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Ex: festival, parade..."
                  className="theme-input text-xs font-bold py-1 px-2 bg-white"
                />
                <CordelButton
                  type="button"
                  variant="ocre"
                  useExtremeBorder={true}
                  onClick={handleAddType}
                  disabled={saving || !newType.trim()}
                  className="text-[9px] font-black uppercase px-2.5 py-1 cursor-pointer"
                >
                  + Ajouter
                </CordelButton>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eventTypes.map((type) => (
                <div key={type} className="flex items-center justify-between p-2 bg-white rounded border border-cordel-master-dark/20 text-xs font-bold shadow-2xs">
                  <span className="capitalize text-stone-800">
                    {type === 'prestation' ? '🎭' : type === 'repetition' ? '🥁' : type === 'stage' ? '🎓' : type === 'reunion' ? '🤝' : '📅'} {type}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveType(type)}
                    className="text-stone-400 hover:text-red-600 text-xs font-black cursor-pointer px-1"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
