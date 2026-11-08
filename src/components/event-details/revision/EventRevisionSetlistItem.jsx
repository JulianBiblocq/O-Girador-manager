import React from 'react';
import { buildSequencerUrl, openSequencerWithCrossApp } from '../../../utils/sequencerUrlUtils';
import { launchCantador } from '../../../utils/trainingLauncher';
import { launchDancador } from '../../../utils/dancadorLauncher';
import { isCantadorValidated } from '../../../utils/repertoireMatcher';
import TrainingCompactCard from '../../pedagogy/TrainingCompactCard';
import { getDisciplineBadges } from './useEventRevisionData';
import { useTranslation } from '../../LanguageContext';

/**
 * Carte d'un morceau dans l'onglet Fil Conducteur de EventRevisionProgram (< 130 lignes).
 */
export default function EventRevisionSetlistItem({
  morceau, resolved, pieceTrainings = [], isEventDanse = false, isAuthorized = false,
  updatingSetlist = false, handleRemoveMorceau, assocSequenceurUrl, groupId,
  toadasMap, cultureMap, signalsMap, onWatchVideo, onZoomSignal, onViewToada, onViewCulture
}) {
  const { t } = useTranslation();
  const badges = getDisciplineBadges(morceau, resolved);
  const seqId = morceau.sequenceurId || resolved.sequenceurId;
  const seqFileUrl = morceau.jsonUrl || morceau.sequenceurUrl || resolved.sequenceurFileUrl;
  const seqType = morceau.sequenceurType || resolved.sequenceurType;
  const isMorceauDanse = isEventDanse || morceau.type === 'danse' || morceau.discipline === 'danse';
  const targetMode = isMorceauDanse ? 'danse' : undefined;
  const pieceForSequencer = { sequenceurType: seqType, sequenceurId: seqId, sequenceurFileUrl: seqFileUrl, jsonUrl: seqFileUrl, titre: morceau.titre, mode: targetMode };
  const targetUrl = (seqType || seqId || seqFileUrl) ? buildSequencerUrl(assocSequenceurUrl, pieceForSequencer, { mode: targetMode }) : '';
  const activeToadaDoc = resolved.activeToada || (morceau.toadaDocId ? toadasMap?.get(morceau.toadaDocId) : null);
  const activeCultureDoc = resolved.activeCultureDoc || (morceau.cultureDocId ? cultureMap?.get(morceau.cultureDocId) : null);
  const choreoId = morceau.dancadorChoreoId || resolved.activeChoreography?.id;
  const audioSrc = morceau.audioUrl || resolved.activeAudioUrl;

  return (
    <div className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-2 border border-encre-noire/15 shadow-xs bg-white">
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {badges.map((b) => (
            <span key={b.key} className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${b.badgeClass}`}>
              <span>{b.emoji}</span><span className="hidden sm:inline">{b.label}</span>
            </span>
          ))}
          <span className="font-extrabold text-encre-noire text-sm ml-0.5">{morceau.titre}</span>
        </div>
        {isAuthorized && (
          <button type="button" disabled={updatingSetlist} onClick={() => handleRemoveMorceau(morceau.id || morceau.pieceId)} className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none shrink-0" title="Retirer du fil conducteur">
            ✕ Retirer
          </button>
        )}
      </div>

      {morceau.notes && (
        <p className="text-[11px] text-encre-noire/80 bg-[#fdfaf2] p-2 rounded border border-dashed border-encre-noire/15 italic leading-snug">
          🎯 {morceau.notes}
        </p>
      )}

      {pieceTrainings.length > 0 && (
        <div className="w-full mt-1">
          <TrainingCompactCard trainings={pieceTrainings} sequenceurUrl={assocSequenceurUrl} mode="rehearsal" />
        </div>
      )}

      {Array.isArray(morceau.videos) && morceau.videos.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {morceau.videos.map((vid, vIdx) => (
            <button key={vid.id || vIdx} type="button" onClick={() => onWatchVideo(vid)} className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase rounded bg-red-50 hover:bg-red-100 text-red-900 border border-red-300 shadow-sm transition-all cursor-pointer">
              <span>🎬</span><span className="truncate max-w-[130px]">{vid.titre || `Vidéo #${vIdx + 1}`}</span><span className="text-[7.5px] opacity-70">▶</span>
            </button>
          ))}
        </div>
      )}

      {Array.isArray(morceau.signalIds) && morceau.signalIds.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[8.5px] font-black uppercase text-cordel-master-dark/70">✋ Signes :</span>
          {morceau.signalIds.map((sigId) => {
            const sig = signalsMap?.get(sigId);
            if (!sig) return null;
            return (
              <button key={sigId} type="button" onClick={() => onZoomSignal(sig)} className="inline-flex items-center gap-1 p-0.5 pr-1.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-all cursor-pointer text-[9px] font-bold shadow-sm">
                <div className="w-4 h-4 rounded bg-stone-900 shrink-0 overflow-hidden flex items-center justify-center">
                  {sig.imageUrl ? <img src={sig.imageUrl} alt={sig.name} className="w-full h-full object-cover" /> : <span>✋</span>}
                </div>
                <span>{sig.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {audioSrc && <audio controls src={audioSrc} className="w-full h-8 mt-1" preload="none" />}

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {targetUrl && (
          <button type="button" onClick={() => openSequencerWithCrossApp(assocSequenceurUrl, pieceForSequencer, { mode: targetMode })} className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 flex-1 text-center cursor-pointer">
            🎧 {isMorceauDanse ? 'Console Danse (Sequenciador)' : 'Ouvrir dans Sequenciador'}
          </button>
        )}
        {choreoId && (
          <button type="button" onClick={() => launchDancador({ choreoId, groupId })} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300 shadow-2xs transition-colors cursor-pointer">
            <span>💃</span><span>Chorégraphie</span>
          </button>
        )}
        {(isCantadorValidated(resolved, resolved?.activeCantadorPack) || isCantadorValidated(morceau)) && (
          <button type="button" onClick={() => launchCantador({ toadaId: morceau.cantadorToadaId || resolved.cantadorToadaId || '', songId: morceau.repertoireId || morceau.toadaDocId || resolved.activeToada?.id || '', mode: 'eleve', groupId })} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-300 shadow-2xs transition-colors cursor-pointer">
            <span>🎙️</span><span>{t('repertoire.openCantador') || 'Cantador'}</span>
          </button>
        )}
        {activeToadaDoc && (
          <button type="button" onClick={() => onViewToada(activeToadaDoc)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs transition-colors cursor-pointer">
            <span>🗣️</span><span>Paroles</span>
          </button>
        )}
        {activeCultureDoc && (
          <button type="button" onClick={() => onViewCulture(activeCultureDoc)} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase rounded bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs transition-colors cursor-pointer">
            <span>📖</span><span>Culture</span>
          </button>
        )}
      </div>
    </div>
  );
}
