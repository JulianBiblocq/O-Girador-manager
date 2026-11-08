import React, { useState } from 'react';
import CordelButton from '../../CordelButton';
import { launchDancador } from '../../../utils/dancadorLauncher';
import { launchCrossApp } from '../../../utils/crossAppAuth';
import { useTranslation } from '../../LanguageContext';

/**
 * Onglet Danse de EventRevisionProgram avec passerelles SSO Dançador (chorégraphie et pas isolés) (< 130 lignes).
 */
export default function EventRevisionDanceTab({
  loadingChoreos = false, loadingSteps = false, eventChoreographies = [],
  allChoreographies = [], allSteps = [], dancadorChoreoIds = [], repertoirePieces = [],
  isAuthorized = false, updatingSetlist = false, handleAddDancadorChoreo,
  handleRemoveDancadorChoreo, assocSequenceurUrl, groupId, onOpenDancador = launchDancador
}) {
  const { t } = useTranslation();
  const [selectedChoreoToAdd, setSelectedChoreoToAdd] = useState('');

  const submitAddChoreo = (e) => {
    e.preventDefault();
    if (selectedChoreoToAdd) {
      handleAddDancadorChoreo(selectedChoreoToAdd);
      setSelectedChoreoToAdd('');
    }
  };

  return (
    <div className="animate-fadeIn">
      {loadingChoreos || loadingSteps ? (
        <p className="text-[11px] italic opacity-60 mb-4">Chargement du catalogue Dançador...</p>
      ) : eventChoreographies.length === 0 ? (
        <p className="text-[11px] italic opacity-60 mb-4">{t('agenda.noChoreographyLinked') || 'Aucune chorégraphie associée à cet événement.'}</p>
      ) : (
        <div className="flex flex-col gap-4 mb-4">
          {eventChoreographies.map((choreo) => {
            const elements = choreo.elements || [];
            const stepIdsInChoreo = [...new Set(elements.filter((e) => e.type === 'step').map((e) => e.stepId))];
            const stepsForChoreo = allSteps.filter((s) => stepIdsInChoreo.includes(s.id));
            const choreoSeqId = choreo.presetId || choreo.sequenceurId || (repertoirePieces.find((p) => p.dancadorChoreoId === choreo.id)?.sequenceurId);

            return (
              <div key={choreo.id} className="border-2 border-cordel-master-dark/10 rounded-lg p-3 bg-white shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-cordel-wood uppercase tracking-wider">{choreo.nom}</h4>
                    <p className="text-[10px] text-encre-noire/60 font-semibold">{elements.length} élément(s)</p>
                  </div>
                  {isAuthorized && (
                    <button type="button" disabled={updatingSetlist} onClick={() => handleRemoveDancadorChoreo(choreo.id)} className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none" title="Retirer de la setlist">
                      ✕ Retirer
                    </button>
                  )}
                </div>

                {stepsForChoreo.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[9px] font-black uppercase text-cordel-master-dark/60 tracking-widest border-b border-dashed border-cordel-master-dark/20 pb-1">
                      Pas à réviser
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {stepsForChoreo.map((step) => (
                        <button key={step.id} type="button" onClick={() => onOpenDancador({ stepId: step.id, groupId })} className="flex flex-col items-center bg-cordel-bg-light hover:bg-neutral-100 transition-colors rounded border border-cordel-master-dark/10 p-1 overflow-hidden cursor-pointer group" title={`Ouvrir ${step.nom} dans Dançador`}>
                          {step.vignetteUrl ? (
                            <img src={step.vignetteUrl} alt={step.nom} className="w-full h-16 object-cover rounded-sm mb-1 group-hover:opacity-80 transition-opacity" />
                          ) : (
                            <div className="w-full h-16 bg-cordel-master-dark/5 rounded-sm mb-1 flex items-center justify-center text-xl group-hover:bg-cordel-master-dark/10 transition-colors">💃</div>
                          )}
                          <span className="text-[9px] font-bold text-encre-noire truncate w-full text-center group-hover:text-cordel-wood transition-colors">{step.nom}</span>
                          {step.famille && <span className="text-[8px] text-cordel-wood truncate w-full text-center">{step.famille}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2 mt-1">
                  <button type="button" onClick={() => onOpenDancador({ choreoId: choreo.id, groupId })} className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 flex-1 text-center w-full sm:w-auto cursor-pointer">
                    💃 Ouvrir dans Dançador
                  </button>
                  {choreoSeqId && (
                    <button
                      type="button"
                      onClick={() => {
                        const baseUrl = (assocSequenceurUrl || 'https://sequenciador.o-girador.com').trim().replace(/\/+$/, '');
                        launchCrossApp(`${baseUrl}/?presetId=${encodeURIComponent(choreoSeqId)}&mode=danse`, { appLabel: 'Sequenciador (Danse)', mode: 'danse' });
                      }}
                      className="theme-btn bg-pink-100 hover:bg-pink-200 text-pink-950 border border-pink-300 px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 flex-1 text-center w-full sm:w-auto cursor-pointer"
                    >
                      <span>🎧</span><span>Console Danse (Sequenciador)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAuthorized && (
        <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
          <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5">
            ➕ {t('agenda.btnAddChoreography') || 'Ajouter une chorégraphie'}
          </h5>
          <form onSubmit={submitAddChoreo} className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('agenda.chooseChoreography') || 'Choisir une chorégraphie de Dançador'}
              </label>
              <select value={selectedChoreoToAdd} onChange={(e) => setSelectedChoreoToAdd(e.target.value)} disabled={updatingSetlist || loadingChoreos} className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer">
                <option value="">{loadingChoreos ? '-- Chargement du catalogue... --' : allChoreographies.length === 0 ? (t('agenda.noPublishedChoreography') || '-- Aucune chorégraphie publiée --') : '-- Choisir une chorégraphie --'}</option>
                {allChoreographies.filter((c) => !dancadorChoreoIds.includes(c.id)).map((choreo) => (
                  <option key={choreo.id} value={choreo.id}>💃 {choreo.nom}</option>
                ))}
              </select>
            </div>
            <CordelButton variant="ocre" useExtremeBorder={true} disabled={updatingSetlist || !selectedChoreoToAdd} className="w-full py-2 text-[10px] font-black uppercase tracking-widest">
              {updatingSetlist ? 'Enregistrement...' : (t('agenda.btnAddToProgram') || 'Ajouter au programme')}
            </CordelButton>
          </form>
        </div>
      )}
    </div>
  );
}
