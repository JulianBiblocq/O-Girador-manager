import React, { useState, useEffect } from 'react';
import { XiloClose } from '../XiloIcons';
import CordelButton from '../CordelButton';
import { getStepSignal, getStepProgressRatio } from '../../utils/workshopProjectionUtils';
import AutoEvalQuiz from '../pedagogy/AutoEvalQuiz';

export default function PartWorkflowModal({
  isOpen,
  onClose,
  slot,
  invPart,
  project,
  model = null,
  profileData = null,
  onUpdateSlotWorkflow,
  updatePartWorkflow,
  isValidator,
  validatorName,
  onFeedback
}) {
  const [retoucheNote, setRetoucheNote] = useState('');
  const [showRetoucheInput, setShowRetoucheInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState(null);
  const [showStepQuiz, setShowStepQuiz] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setShowRetoucheInput(false);
      setRetoucheNote('');
      setShowStepQuiz(false);
      if (autoCloseTimer) {
        clearTimeout(autoCloseTimer);
        setAutoCloseTimer(null);
      }
    }
  }, [isOpen, invPart?.id, slot?.slotId]);

  if (!isOpen || !slot || !invPart) return null;

  const handleClose = () => {
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      setAutoCloseTimer(null);
    }
    setFeedback(null);
    onClose();
  };

  const slotWf = project?.slotsWorkflow?.[slot.slotId] || {};
  const totalSteps = slot.chapitres?.length || 0;
  const currentStep = slotWf.currentStepIndex !== undefined ? slotWf.currentStepIndex : (invPart.currentStepIndex || 0);
  const statutEtape = slotWf.statutEtape || invPart.statutEtape || 'en_cours';
  
  const isCompleted = statutEtape === 'terminee' || totalSteps === 0;
  const stepData = slot.chapitres?.[currentStep];

  const handleSoumettre = async () => {
    setLoading(true);
    try {
      if (onUpdateSlotWorkflow) {
        await onUpdateSlotWorkflow(slot.slotId, { statutEtape: 'en_attente_controle' }, false);
      } else if (invPart?.id && updatePartWorkflow) {
        await updatePartWorkflow(invPart.id, { statutEtape: 'en_attente_controle' });
      }

      const fb = {
        type: 'submitted',
        title: "Étape soumise au contrôle !",
        message: "Votre étape a été soumise au contrôle du Mestre avec succès. Fermeture..."
      };
      setFeedback(fb);
      onFeedback?.(fb);
      const timer = setTimeout(() => {
        handleClose();
      }, 1400);
      setAutoCloseTimer(timer);
    } catch (err) {
      console.error("Erreur soumission étape :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async () => {
    setLoading(true);
    try {
      const newStep = currentStep + 1;
      const isNowFinished = newStep >= totalSteps;
      
      const updates = { 
        currentStepIndex: newStep,
        statutEtape: isNowFinished ? 'terminee' : 'en_cours',
        historiqueControles: [
          ...(slotWf.historiqueControles || invPart.historiqueControles || []),
          { date: new Date().toISOString(), action: 'Validation', etape: currentStep, validateur: validatorName || 'Maître d\'atelier' }
        ]
      };

      if (onUpdateSlotWorkflow) {
        await onUpdateSlotWorkflow(slot.slotId, updates, isNowFinished);
      } else if (invPart?.id && updatePartWorkflow) {
        await updatePartWorkflow(invPart.id, updates);
      }

      const fb = {
        type: 'validated',
        title: isNowFinished ? "🏆 Bravo ! Phase terminée !" : `🎉 Bravo ! Étape ${currentStep + 1} validée !`,
        message: isNowFinished 
          ? "Toutes les étapes de cette phase sont validées. Passage à la suite..." 
          : `L'étape ${currentStep + 1} a été validée avec succès. Fermeture...`
      };
      setFeedback(fb);
      onFeedback?.(fb);
      const timer = setTimeout(() => {
        handleClose();
      }, 1400);
      setAutoCloseTimer(timer);
    } catch (err) {
      console.error("Erreur validation étape :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetouche = async () => {
    if (!retoucheNote.trim()) return;
    setLoading(true);
    try {
      const updates = {
        statutEtape: 'en_cours',
        notesAtelier: ((slotWf.notesAtelier || invPart.notesAtelier) ? (slotWf.notesAtelier || invPart.notesAtelier) + '\n' : '') + `[Retouche Étape ${currentStep + 1}] : ${retoucheNote}`,
        historiqueControles: [
          ...(slotWf.historiqueControles || invPart.historiqueControles || []),
          { date: new Date().toISOString(), action: 'Retouche demandée', etape: currentStep, note: retoucheNote, validateur: validatorName || 'Maître d\'atelier' }
        ]
      };

      if (onUpdateSlotWorkflow) {
        await onUpdateSlotWorkflow(slot.slotId, updates, false);
      } else if (invPart?.id && updatePartWorkflow) {
        await updatePartWorkflow(invPart.id, updates);
      }

      setRetoucheNote('');
      setShowRetoucheInput(false);

      const fb = {
        type: 'retouche',
        title: "Demande de retouche envoyée !",
        message: "La consigne de retouche a été enregistrée dans l'atelier. Fermeture..."
      };
      setFeedback(fb);
      onFeedback?.(fb);
      const timer = setTimeout(() => {
        handleClose();
      }, 1400);
      setAutoCloseTimer(timer);
    } catch (err) {
      console.error("Erreur retouche étape :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative bg-[#faf8f5] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl border-[3px] border-encre-noire/80">
        <button 
          onClick={handleClose} 
          className="absolute top-3 right-3 text-encre-noire hover:text-cordel-rouge transition-colors cursor-pointer"
        >
          <XiloClose size={24} />
        </button>

        <div className="p-6">
          <div className="mb-4 pb-4 border-b-2 border-dashed border-encre-noire/20">
            <h2 className="text-xl font-black text-cordel-wood uppercase tracking-wider">{slot.slotLabel}</h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs font-bold text-stone-500 bg-stone-200 px-2 py-1 rounded">
                Pièce assignée : {invPart.nom}
              </span>
              {totalSteps > 0 && !isCompleted && (
                <span className="text-xs font-bold text-white bg-cordel-wood px-2 py-1 rounded shadow">
                  Étape {Math.min(currentStep + 1, totalSteps)} / {totalSteps} • {getStepProgressRatio(totalSteps, currentStep, statutEtape)}
                </span>
              )}
              {isCompleted && (
                <span className="text-xs font-bold text-white bg-cordel-vert px-2 py-1 rounded shadow">
                  Terminée ✅ ({totalSteps} / {totalSteps})
                </span>
              )}
            </div>

            {/* Rangée de pastilles numérotées des étapes */}
            {totalSteps > 0 && (
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {slot.chapitres?.map((chap, stepIdx) => {
                  const signal = getStepSignal(stepIdx, currentStep, statutEtape);
                  return (
                    <div
                      key={stepIdx}
                      title={`Étape ${stepIdx + 1} : ${chap.titre || ''} (${signal.label})`}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border shadow-xs select-none transition-all ${signal.colorClass}`}
                    >
                      <span>{signal.icon}</span>
                      <span>Étape {stepIdx + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isCompleted && stepData ? (
            <div className="flex flex-col gap-4">
              <div className="bg-white p-4 border border-encre-noire/10 rounded">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-md font-bold text-encre-noire">{stepData.titre || 'Étape sans titre'}</h3>
                  <button
                    type="button"
                    onClick={() => setShowStepQuiz(true)}
                    className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/30 hover:bg-cordel-wood hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0 active:scale-95 shadow-xs"
                    title="Tester mes connaissances sur cette étape de fabrication"
                  >
                    <span>🎯</span>
                    <span>Quiz de l'étape</span>
                  </button>
                </div>

                {stepData.photoUrl && (
                  <div className="w-full mb-3 overflow-hidden rounded border border-encre-noire/20 bg-stone-100 flex items-center justify-center">
                    <img 
                      src={stepData.photoUrl} 
                      alt={stepData.titre || 'Illustration de l\'étape'} 
                      className="w-full max-h-56 object-contain"
                    />
                  </div>
                )}

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

              {/* SECTION WORKFLOW OU RETOUR DE VALIDATION */}
              <div className="mt-4 pt-4 border-t-2 border-encre-noire/10 flex flex-col gap-3">
                {feedback ? (
                  <div className={`p-5 rounded-lg border-2 text-center flex flex-col items-center gap-2 animate-fade-in shadow-inner ${
                    feedback.type === 'submitted'
                      ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)]'
                      : feedback.type === 'validated'
                      ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)]'
                      : 'bg-cordel-ocre/10 border-cordel-ocre text-cordel-ocre'
                  }`}>
                    <span className="text-4xl animate-bounce">
                      {feedback.type === 'submitted' ? '📨' : feedback.type === 'validated' ? '🎉' : '🔄'}
                    </span>
                    <h4 className="text-base font-black uppercase tracking-wider">
                      {feedback.title}
                    </h4>
                    <p className="text-xs text-stone-700 font-bold max-w-sm">
                      {feedback.message}
                    </p>
                    <CordelButton 
                      variant={feedback.type === 'retouche' ? 'ocre' : 'vert'} 
                      onClick={handleClose} 
                      className="text-xs py-1.5 px-5 mt-2 font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#181716]"
                    >
                      Fermer maintenant
                    </CordelButton>
                  </div>
                ) : (
                  <>
                    {statutEtape === 'en_cours' && (
                      <CordelButton 
                        variant="default" 
                        onClick={handleSoumettre} 
                        disabled={loading}
                        className="w-full justify-center text-sm py-3 font-black"
                      >
                        {loading ? "Soumission en cours..." : "🔨 Étape terminée — Soumettre au contrôle"}
                      </CordelButton>
                    )}

                    {statutEtape === 'en_attente_controle' && (
                      <div className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-200 rounded text-center">
                        <span className="text-amber-700 font-black animate-pulse">⏳ En attente de vérification par un Mestre</span>
                        
                        {isValidator && (
                          <div className="flex flex-col gap-2 mt-2">
                            <span className="text-[10px] uppercase font-bold text-stone-500">Espace Mestre / Validateur</span>
                            <div className="grid grid-cols-2 gap-2">
                              <CordelButton variant="vert" onClick={handleValider} disabled={loading} className="justify-center font-bold">
                                {loading ? "Validation..." : "✅ Valider"}
                              </CordelButton>
                              <CordelButton variant="danger" onClick={() => setShowRetoucheInput(!showRetoucheInput)} disabled={loading} className="justify-center font-bold">
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
                                  className="bg-cordel-rouge text-white text-xs font-bold py-1.5 rounded disabled:opacity-50 cursor-pointer"
                                >
                                  {loading ? "Envoi..." : "Envoyer la demande"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
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

      {/* Modale d'évaluation ciblée sur l'étape courante */}
      {showStepQuiz && (
        <AutoEvalQuiz
          instrumentModelData={model || {
            id: project?.modelId || 'model_atelier',
            nom: project?.nom || slot.slotLabel || 'Atelier',
            parts: [slot]
          }}
          targetPartId={invPart?.partId || slot?.partId || `part_0`}
          targetStepIndex={currentStep ?? 0}
          profileData={profileData}
          onClose={() => setShowStepQuiz(false)}
        />
      )}
    </div>
  );
}
