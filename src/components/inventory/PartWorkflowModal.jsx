import React, { useState } from 'react';
import { XiloClose } from '../XiloIcons';
import CordelButton from '../CordelButton';

export default function PartWorkflowModal({ isOpen, onClose, slot, invPart, updatePartWorkflow, isValidator, validatorName }) {
  if (!isOpen || !slot || !invPart) return null;

  const [retoucheNote, setRetoucheNote] = useState('');
  const [showRetoucheInput, setShowRetoucheInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalSteps = slot.chapitres?.length || 0;
  const currentStep = invPart.currentStepIndex || 0;
  const statutEtape = invPart.statutEtape || 'en_cours';
  
  const isCompleted = statutEtape === 'terminee' || (totalSteps > 0 && currentStep >= totalSteps);
  const stepData = slot.chapitres?.[currentStep];

  const handleSoumettre = async () => {
    setLoading(true);
    try {
      await updatePartWorkflow(invPart.id, { statutEtape: 'en_attente_controle' });
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async () => {
    setLoading(true);
    try {
      const newStep = currentStep + 1;
      const isNowFinished = newStep >= totalSteps;
      
      await updatePartWorkflow(invPart.id, { 
        currentStepIndex: newStep,
        statutEtape: isNowFinished ? 'terminee' : 'en_cours',
        historiqueControles: [
          ...(invPart.historiqueControles || []),
          { date: new Date().toISOString(), action: 'Validation', etape: currentStep, validateur: validatorName || 'Maître d\'atelier' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetouche = async () => {
    if (!retoucheNote.trim()) return;
    setLoading(true);
    try {
      await updatePartWorkflow(invPart.id, {
        statutEtape: 'en_cours',
        notesAtelier: (invPart.notesAtelier ? invPart.notesAtelier + '\n' : '') + `[Retouche Étape ${currentStep + 1}] : ${retoucheNote}`,
        historiqueControles: [
          ...(invPart.historiqueControles || []),
          { date: new Date().toISOString(), action: 'Retouche demandée', etape: currentStep, note: retoucheNote, validateur: validatorName || 'Maître d\'atelier' }
        ]
      });
      setRetoucheNote('');
      setShowRetoucheInput(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-[#faf8f5] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl border-[3px] border-encre-noire/80">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-encre-noire hover:text-cordel-rouge transition-colors"
        >
          <XiloClose size={24} />
        </button>

        <div className="p-6">
          <div className="mb-4 pb-4 border-b-2 border-dashed border-encre-noire/20">
            <h2 className="text-xl font-black text-cordel-wood uppercase tracking-wider">{slot.slotLabel}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-bold text-stone-500 bg-stone-200 px-2 py-1 rounded">
                Pièce assignée : {invPart.nom}
              </span>
              {totalSteps > 0 && !isCompleted && (
                <span className="text-xs font-bold text-white bg-cordel-wood px-2 py-1 rounded shadow">
                  Étape {currentStep + 1} / {totalSteps}
                </span>
              )}
              {isCompleted && (
                <span className="text-xs font-bold text-white bg-cordel-vert px-2 py-1 rounded shadow">
                  Terminée ✅
                </span>
              )}
            </div>
          </div>

          {!isCompleted && stepData ? (
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 border border-encre-noire/10 rounded">
                <h3 className="text-md font-bold text-encre-noire mb-2">{stepData.titre || 'Étape sans titre'}</h3>
                {stepData.texte && <p className="text-sm text-stone-700 whitespace-pre-wrap">{stepData.texte}</p>}
                
                {(stepData.outils?.length > 0 || stepData.materiaux?.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-dashed border-encre-noire/10 flex flex-col gap-2">
                    {stepData.outils?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-500">Outils :</span>
                        {stepData.outils.map(o => <span key={o} className="text-[10px] bg-cordel-wood/10 text-cordel-wood px-2 rounded">{o}</span>)}
                      </div>
                    )}
                    {stepData.materiaux?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-stone-500">Matériaux :</span>
                        {stepData.materiaux.map(m => <span key={m} className="text-[10px] bg-cordel-wood/10 text-cordel-wood px-2 rounded">{m}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {invPart.notesAtelier && (
                <div className="bg-cordel-ocre/10 p-3 rounded border border-cordel-ocre/30">
                  <span className="text-[10px] uppercase font-bold text-cordel-ocre block mb-1">Remarques d'atelier :</span>
                  <p className="text-xs text-stone-700 whitespace-pre-wrap">{invPart.notesAtelier}</p>
                </div>
              )}

              {/* SECTION WORKFLOW */}
              <div className="mt-4 pt-4 border-t-2 border-encre-noire/10 flex flex-col gap-3">
                {statutEtape === 'en_cours' && (
                  <CordelButton 
                    variant="default" 
                    onClick={handleSoumettre} 
                    disabled={loading}
                    className="w-full justify-center text-sm py-3"
                  >
                    🔨 Étape terminée — Soumettre au contrôle
                  </CordelButton>
                )}

                {statutEtape === 'en_attente_controle' && (
                  <div className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-200 rounded text-center">
                    <span className="text-amber-600 font-bold animate-pulse">⏳ En attente de vérification par un Mestre</span>
                    
                    {isValidator && (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-[10px] uppercase font-bold text-stone-400">Espace Mestre / Validateur</span>
                        <div className="grid grid-cols-2 gap-2">
                          <CordelButton variant="vert" onClick={handleValider} disabled={loading} className="justify-center">
                            ✅ Valider
                          </CordelButton>
                          <CordelButton variant="danger" onClick={() => setShowRetoucheInput(!showRetoucheInput)} disabled={loading} className="justify-center">
                            🔄 Retouche
                          </CordelButton>
                        </div>
                        
                        {showRetoucheInput && (
                          <div className="flex flex-col gap-2 mt-2 text-left">
                            <textarea 
                              value={retoucheNote}
                              onChange={e => setRetoucheNote(e.target.value)}
                              placeholder="Consigne pour la retouche..."
                              className="theme-input text-xs p-2 min-h-[60px]"
                            />
                            <button 
                              onClick={handleRetouche}
                              disabled={loading || !retoucheNote.trim()}
                              className="bg-cordel-rouge text-white text-xs font-bold py-1.5 rounded disabled:opacity-50"
                            >
                              Envoyer la demande
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="py-8 text-center text-cordel-vert font-bold flex flex-col items-center gap-2">
              <span className="text-4xl">✅</span>
              Cette pièce est prête et terminée !
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
