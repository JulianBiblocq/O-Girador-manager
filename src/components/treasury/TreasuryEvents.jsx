import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';

export default function TreasuryEvents({
  events,
  updatingEventId,
  handleUpdateEventFinances
}) {
  const [eventInputs, setEventInputs] = useState({});

  // Initialize and sync event inputs state with events list
  useEffect(() => {
    if (events) {
      const initialInputs = {};
      events.forEach(evt => {
        initialInputs[evt.id] = {
          rec: evt.montantRecette !== undefined ? evt.montantRecette.toString() : '0',
          dep: evt.montantDepense !== undefined ? evt.montantDepense.toString() : '0'
        };
      });
      setEventInputs(initialInputs);
    }
  }, [events]);

  const onSave = async (eventId) => {
    const input = eventInputs[eventId];
    if (!input) return;
    try {
      await handleUpdateEventFinances(eventId, input.rec, input.dep);
      alert("Finances de l'événement enregistrées !");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        📈 Saisissez et modifiez directement dans ce tableau les recettes et les dépenses de chaque événement. Les modifications sont enregistrées en temps réel et intégrées dans le Grand Livre Comptable.
      </div>
      
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg">
        {events.length === 0 ? (
          <p className="text-xs italic opacity-60 text-center py-8">Aucun événement trouvé.</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1.5 min-w-[650px] px-1">
              <div className="col-span-2 text-left">Date</div>
              <div className="col-span-3 text-left">Titre / Type</div>
              <div className="col-span-2 text-left">Lieu</div>
              <div className="col-span-2 text-right">Recette (€)</div>
              <div className="col-span-2 text-right">Dépense (€)</div>
              <div className="col-span-1 text-center"></div>
            </div>

            {/* Table Rows */}
            <div className="flex flex-col gap-1.5 min-w-[650px] max-h-[500px] overflow-y-auto pr-1 mt-1">
              {events.map(evt => {
                const eventDateStr = evt.date ? evt.date.substring(0, 10) : '';
                return (
                  <div key={evt.id} className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-encre-noire/5 py-1.5 px-1 hover:bg-cordel-hover/10 rounded">
                    <div className="col-span-2 font-semibold text-left">{eventDateStr}</div>
                    <div className="col-span-3 text-left">
                      <div className="font-bold text-encre-noire dark:text-cordel-bg-light truncate" title={evt.titre}>{evt.titre}</div>
                      <span className="text-[8px] font-bold uppercase text-cordel-wood opacity-75">{evt.type}</span>
                    </div>
                    <div className="col-span-2 text-left truncate" title={evt.lieu}>{evt.lieu || '-'}</div>
                    
                    {/* Recette Input */}
                    <div className="col-span-2 flex justify-end">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={eventInputs[evt.id]?.rec ?? ''}
                        onChange={(e) => setEventInputs(prev => ({
                          ...prev,
                          [evt.id]: { ...prev[evt.id], rec: e.target.value }
                        }))}
                        className="theme-input text-xs w-24 text-right py-1 px-2 font-semibold"
                        placeholder="0.00"
                      />
                    </div>
                    
                    {/* Depense Input */}
                    <div className="col-span-2 flex justify-end">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={eventInputs[evt.id]?.dep ?? ''}
                        onChange={(e) => setEventInputs(prev => ({
                          ...prev,
                          [evt.id]: { ...prev[evt.id], dep: e.target.value }
                        }))}
                        className="theme-input text-xs w-24 text-right py-1 px-2 font-semibold"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => onSave(evt.id)}
                        disabled={updatingEventId === evt.id}
                        className={`text-[9px] font-black uppercase bg-[#84967a] hover:bg-[#728369] text-encre-noire border border-encre-noire px-2.5 py-1.5 rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-1 ${updatingEventId === evt.id ? 'opacity-55' : ''}`}
                        title="Enregistrer"
                      >
                        {updatingEventId === evt.id ? "..." : "💾"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
