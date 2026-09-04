import React, { useState } from 'react';

/**
 * Composant unitaire représentant une pièce requise pour l'assemblage d'un instrument.
 * Respecte la règle anti-monolithe et le design system Cordel (thème isolable).
 *
 * @param {Object} props
 * @param {Object} props.slot - Données de la pièce dans la nomenclature du modèle
 * @param {Object} props.model - Modèle d'instrument parent
 * @param {Object} [props.invPart] - Pièce physique de l'inventaire assignée
 * @param {boolean} props.isSessionSelected - Indique si le slot est coché pour la mallette de séance
 * @param {Function} props.onToggleSessionSlot - Bascule la sélection mallette
 * @param {Function} props.onSelectWorkflow - Ouvre la modale de validation/retouche (PartWorkflowModal)
 * @param {Function} props.onAssignPart - Assigne ou désassigne une pièce
 * @param {Function} props.onOpenVaralTutorial - Ouvre la modale FabricationCard du Varal
 * @param {Array} props.availableStock - Liste des pièces en stock disponibles
 */
export default function AssemblySlotItem({
  slot,
  model: _model,
  invPart,
  slotWorkflow,
  defaultProjectPiece,
  isSessionSelected,
  onToggleSessionSlot,
  onSelectWorkflow,
  onAssignPart,
  onOpenVaralTutorial,
  availableStock = []
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isAssigned = !!invPart;
  const totalSteps = slot.chapitres?.length || 0;
  
  // Progression spécifique au slot/phase dans le projet (avec fallback sur la pièce physique)
  const slotWf = slotWorkflow || {};
  const currentStep = slotWf.currentStepIndex !== undefined ? slotWf.currentStepIndex : (invPart?.currentStepIndex || 0);
  const statutEtape = slotWf.statutEtape || invPart?.statutEtape || 'en_cours';

  const isCompleted = isAssigned && (statutEtape === 'terminee' || totalSteps === 0 || currentStep >= totalSteps);
  const isWaitingControl = isAssigned && statutEtape === 'en_attente_controle';

  // Calcul du nombre d'étapes validées pour la jauge
  let completedStepsCount = 0;
  if (isCompleted) {
    completedStepsCount = totalSteps;
  } else if (isAssigned) {
    completedStepsCount = Math.min(currentStep, totalSteps);
  }

  // Styles thématiques sémantiques Cordel
  let cardBgClass = "bg-[#faf8f5] border-dashed border-cordel-master-dark/30 hover:bg-stone-100";
  let statusIcon = '⏳';

  if (isAssigned) {
    if (isCompleted) {
      cardBgClass = "bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)] hover:bg-[var(--color-cordel-vert)]/20";
      statusIcon = '✅';
    } else if (isWaitingControl) {
      cardBgClass = "bg-amber-100/80 border-amber-400 animate-[pulse_2s_ease-in-out_infinite]";
      statusIcon = '⏳';
    } else {
      cardBgClass = "bg-[var(--color-cordel-ocre)]/10 border-[var(--color-cordel-ocre)] hover:bg-[var(--color-cordel-ocre)]/20";
      statusIcon = '🛠️';
    }
  }

  if (isSessionSelected) {
    cardBgClass += " ring-2 ring-[var(--color-cordel-wood)] shadow-md scale-[1.005]";
  }

  return (
    <div
      className={`flex flex-col p-2.5 rounded border transition-all cursor-pointer ${cardBgClass}`}
      onClick={() => {
        if (isAssigned) {
          onSelectWorkflow({ slot, invPart });
        }
      }}
    >
      {/* Ligne principale du composant */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Bouton explicite pour composer la mallette de séance */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSessionSlot(slot.slotId);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black border transition-all cursor-pointer select-none shrink-0 ${
              isSessionSelected 
                ? 'bg-[var(--color-cordel-wood)] text-white border-[var(--color-cordel-wood)] shadow-sm' 
                : 'bg-white text-stone-700 border-stone-300 hover:border-[var(--color-cordel-wood)] hover:text-[var(--color-cordel-wood)] hover:bg-stone-50 shadow-xs'
            }`}
            title={isSessionSelected ? "Retirer de la mallette de séance" : "Ajouter tous les outils et matériaux de cette phase à la mallette de séance"}
          >
            <span className="text-xs">🧰</span>
            <span>{isSessionSelected ? 'Dans la mallette ✓' : '+ Mallette séance'}</span>
          </button>

          {/* Nom et statut du composant */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-encre-noire flex items-center gap-1.5">
                <span>{statusIcon}</span>
                <span className="truncate">{slot.slotLabel}</span>
              </span>

              {/* Jauge d'avancement des étapes */}
              {totalSteps > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider border ${
                    isCompleted
                      ? 'bg-[var(--color-cordel-vert)] text-white border-[var(--color-cordel-vert)]'
                      : isAssigned
                      ? 'bg-[var(--color-cordel-ocre)] text-white border-[var(--color-cordel-ocre)]'
                      : 'bg-stone-200 text-stone-700 border-stone-300'
                  }`}
                >
                  {completedStepsCount}/{totalSteps} étape{totalSteps > 1 ? 's' : ''}
                </span>
              )}

              {/* Statut textuel si assigné et en cours */}
              {isAssigned && !isCompleted && totalSteps > 0 && (
                <span className={`text-[10px] font-bold ${isWaitingControl ? 'text-amber-700 font-black' : 'text-[var(--color-cordel-ocre)]'}`}>
                  {isWaitingControl
                    ? '• À CONTRÔLER'
                    : `• Étape ${currentStep + 1} : ${slot.chapitres[currentStep]?.titre || 'En cours'}`}
                </span>
              )}
            </div>

            {/* Lien cliquable ouvrant le tutoriel du Varal en modale */}
            {totalSteps > 0 && (
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVaralTutorial(slot);
                  }}
                  className="text-[9px] text-[var(--color-cordel-wood)] hover:text-black font-bold underline flex items-center gap-1 cursor-pointer transition-colors"
                  title="Ouvrir le tutoriel complet dans le Varal"
                >
                  <span>🧵</span> Voir le tutoriel ({totalSteps} étapes)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bloc d'actions à droite : Assignation & Dépliement d'accordéon */}
        <div
          className="flex items-center gap-2 self-end sm:self-center"
          onClick={(e) => e.stopPropagation()}
        >
          {isAssigned ? (
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                  isCompleted
                    ? 'text-[var(--color-cordel-vert)] bg-white border-[var(--color-cordel-vert)]/40 shadow-xs'
                    : 'text-[var(--color-cordel-ocre)] bg-white border-[var(--color-cordel-ocre)]/40 shadow-xs'
                }`}
              >
                Assigné : {invPart.nom}
              </span>
              <button
                type="button"
                onClick={() => onAssignPart(slot.slotId, null)}
                className="text-[9px] text-[var(--color-cordel-rouge)] hover:underline font-bold px-1 py-0.5 cursor-pointer"
                title="Désassigner cette pièce du projet"
              >
                Retirer
              </button>
            </div>
          ) : availableStock.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {defaultProjectPiece && (
                <button
                  type="button"
                  onClick={() => onAssignPart(slot.slotId, defaultProjectPiece.id)}
                  className="text-[9.5px] bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] hover:bg-[var(--color-cordel-vert)]/25 border border-[var(--color-cordel-vert)] px-2 py-1 rounded font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  title={`Continuer avec la pièce "${defaultProjectPiece.nom}" déjà utilisée dans le projet`}
                >
                  <span>⭐</span>
                  <span>Continuer : {defaultProjectPiece.nom}</span>
                </button>
              )}
              <select
                onChange={(e) => onAssignPart(slot.slotId, e.target.value)}
                value=""
                className="theme-input text-[10px] py-1 px-2 bg-white max-w-[190px] border border-stone-300 rounded shadow-xs cursor-pointer"
              >
                <option value="">-- Piocher dans le stock ({availableStock.length}) --</option>
                {defaultProjectPiece && (
                  <option value={defaultProjectPiece.id}>
                    ⭐ Continuer : {defaultProjectPiece.nom} (pièce du projet)
                  </option>
                )}
                {availableStock.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.nom} ({sp.typePiece})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {defaultProjectPiece && (
                <button
                  type="button"
                  onClick={() => onAssignPart(slot.slotId, defaultProjectPiece.id)}
                  className="text-[9.5px] bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] hover:bg-[var(--color-cordel-vert)]/25 border border-[var(--color-cordel-vert)] px-2 py-1 rounded font-black flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                  title={`Continuer avec la pièce "${defaultProjectPiece.nom}" déjà utilisée dans le projet`}
                >
                  <span>⭐</span>
                  <span>Continuer : {defaultProjectPiece.nom}</span>
                </button>
              )}
              <span className="text-[9.5px] italic text-stone-500 bg-stone-100/80 px-2 py-1 rounded border border-stone-200 select-none">
                ⏳ En attente de fourniture
              </span>
            </div>
          )}

          {/* Bouton pour déplier/replier l'accordéon des étapes */}
          {totalSteps > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="p-1 text-cordel-master-dark hover:text-black hover:bg-black/5 rounded transition-transform cursor-pointer"
              title={isExpanded ? "Replier les étapes" : "Déplier le détail des étapes"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Accordéon dépliable des étapes de fabrication */}
      {isExpanded && totalSteps > 0 && (
        <div
          className="mt-3 pt-2.5 border-t border-dashed border-stone-300/80 flex flex-col gap-2 bg-white/70 p-2.5 rounded-sm shadow-inner"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Jauge graphique d'avancement */}
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-600 mb-1">
            <span>Progression de fabrication</span>
            <span className="font-black text-black">
              {completedStepsCount} / {totalSteps} validée{totalSteps > 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[var(--color-cordel-vert)] transition-all duration-300 rounded-full"
              style={{ width: `${(completedStepsCount / totalSteps) * 100}%` }}
            />
          </div>

          {/* Liste détaillée des étapes */}
          <div className="flex flex-col gap-1.5">
            {slot.chapitres.map((chap, stepIdx) => {
              // Calcul du statut de l'étape
              const isStepValidated = isAssigned && (isCompleted || stepIdx < currentStep);
              const isStepCurrent = isAssigned && !isCompleted && stepIdx === currentStep;

              let stepBadgeClass = "bg-stone-100 text-stone-600 border-stone-300";
              let stepLabel = "À faire";
              let stepIcon = "⭕";

              if (isStepValidated) {
                stepBadgeClass = "bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40 font-black";
                stepLabel = "Validée";
                stepIcon = "✓";
              } else if (isStepCurrent) {
                if (isWaitingControl) {
                  stepBadgeClass = "bg-amber-100 text-amber-800 border-amber-400 font-black";
                  stepLabel = "À contrôler";
                  stepIcon = "⏳";
                } else {
                  stepBadgeClass = "bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40 font-black";
                  stepLabel = "En cours";
                  stepIcon = "🛠️";
                }
              }

              return (
                <div
                  key={chap.id || stepIdx}
                  className={`flex flex-col p-1.5 rounded border text-left transition-colors ${
                    isStepCurrent
                      ? 'bg-amber-50/70 border-amber-300'
                      : isStepValidated
                      ? 'bg-[var(--color-cordel-vert)]/5 border-[var(--color-cordel-vert)]/20'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-encre-noire flex items-center gap-1.5">
                      <span className="text-[9px] font-black text-stone-500 w-4 text-center">
                        #{stepIdx + 1}
                      </span>
                      <span>{chap.titre || `Étape ${stepIdx + 1}`}</span>
                    </span>

                    <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-1 ${stepBadgeClass}`}>
                      <span>{stepIcon}</span>
                      <span>{stepLabel}</span>
                    </span>
                  </div>

                  {/* Description succincte si disponible */}
                  {chap.texte && (
                    <p className="text-[9px] text-stone-600 mt-1 pl-5 line-clamp-2 leading-tight">
                      {chap.texte}
                    </p>
                  )}

                  {/* Outils & Matériaux de l'étape */}
                  {((chap.materiaux && chap.materiaux.length > 0) || (chap.outils && chap.outils.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mt-1 pl-5">
                      {(chap.materiaux || []).map((m) => (
                        <span key={m} className="text-[8px] bg-stone-100 text-stone-700 px-1 rounded border border-stone-200">
                          📦 {m}
                        </span>
                      ))}
                      {(chap.outils || []).map((o) => (
                        <span key={o} className="text-[8px] bg-stone-100 text-stone-700 px-1 rounded border border-stone-200">
                          🛠 {o}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pied de l'accordéon : raccourci Varal */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onOpenVaralTutorial(slot)}
              className="text-[9px] text-[var(--color-cordel-wood)] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>📖</span> Ouvrir la fiche tutoriel complète
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
