// Contenu déplié de la carte morceau pour adhérents (<= 140 lignes)
// Inclut paliers vocaux, défis signaux, notes, audio, toadas, tablatures, danse Dançador, culture, vidéos et révision
import React, { useState } from 'react';
import { db } from '../../firebase';
import PieceAisanceSection from './PieceAisanceSection';
import PieceDirectionChallengesBar from '../pedagogy/PieceDirectionChallengesBar';
import PieceVideoSection from '../repertoire/PieceVideoSection';
import PieceQuizModal from './PieceQuizModal';
import { launchDancador } from '../../utils/dancadorLauncher';
import { savePieceComfortAndVocal } from '../../utils/aisanceAutoSync';
import { useTranslation } from '../LanguageContext';

const VOCAL_STAGES = [
  { id: 'coro', icon: '🗣️', labelKey: 'pedagogy.vocal.stageCoro' },
  { id: 'simultane', icon: '🥁🗣️', labelKey: 'pedagogy.vocal.stageSimultane' },
  { id: 'puxador', icon: '👑🎙️', labelKey: 'pedagogy.vocal.stagePuxador' }
];

export default function MemberPieceUnfoldedContent({
  piece, userId, groupId, profileData = null, trainings = [], aisanceMap = {},
  comfortLevel = 0, vocalStage = 'none', onSetVocalStage = null, onComfortPromoted = null,
  onOpenTablature, onOpenToada, onOpenCulture, onOpenSignals, onOpenQuiz = null, sequenceurUrl
}) {
  const { t } = useTranslation();
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [localVocalStage, setLocalVocalStage] = useState(null);
  const activeVocalStage = localVocalStage !== null ? localVocalStage : (vocalStage || 'none');

  const audioUrl = piece.activeAudioUrl || piece.audioUrl;
  const hasToada = Boolean(piece.toadaDocId || piece.hasToada || (piece.activeToada && (
    piece.activeToada.parolesOriginales?.trim() || piece.activeToada.rawTxtCode?.trim() ||
    piece.activeToada.paroles?.trim() || piece.activeToada.texte?.trim() ||
    piece.activeToada.strophes?.length || piece.activeToada.titre?.trim()
  )));
  const cultureDocs = Array.isArray(piece.activeCultureDocs) && piece.activeCultureDocs.length > 0
    ? piece.activeCultureDocs : (piece.activeCultureDoc ? [piece.activeCultureDoc] : []);
  const hasCulture = Boolean(cultureDocs.length > 0 || piece.cultureDocIds?.length || piece.cultureDocId);
  const hasSignals = Boolean(piece.sinaisDoMestre?.length > 0 || piece.activeSinaisDoMestre?.length > 0 || piece.signalIds?.length > 0);
  const choreoId = piece.dancadorChoreoId || piece.activeChoreography?.id || '';
  const stepElements = (piece.activeChoreography?.elements || []).filter((e) => e.type === 'step' && e.stepId);

  const handleToggleVocal = async (stageId) => {
    const nextStage = activeVocalStage === stageId ? 'none' : stageId;
    setLocalVocalStage(nextStage);
    if (onSetVocalStage) await onSetVocalStage(piece.id, nextStage);
    else if (userId && groupId && piece?.id) await savePieceComfortAndVocal({ db, userId, groupId, pieceId: piece.id, vocalStage: nextStage });
  };

  return (
    <div className="p-3.5 flex flex-col gap-3 text-left">
      {hasToada && (
        <div className="p-2.5 rounded bg-amber-50/75 border border-amber-300/80 flex flex-col gap-1.5">
          <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-wood">{t('pedagogy.vocal.sectionTitle')}</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {VOCAL_STAGES.map((st) => {
              const isActive = activeVocalStage === st.id;
              return (
                <button key={st.id} type="button" onClick={() => handleToggleVocal(st.id)} className={`px-2.5 py-1 rounded text-[10px] font-black border cursor-pointer transition-all ${isActive ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-encre-noire shadow-2xs' : 'bg-white text-encre-noire border-encre-noire/25 hover:bg-amber-100/50'}`}>
                  {st.icon} {t(st.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasSignals && (
        <PieceDirectionChallengesBar piece={piece} userId={userId} groupId={groupId} profileData={profileData} currentComfort={comfortLevel} onComfortPromoted={onComfortPromoted} />
      )}

      {piece.notes && piece.notes.trim() !== '' && (
        <div className="p-2.5 rounded bg-amber-50/80 border border-dashed border-amber-300 text-left">
          <span className="text-[9.5px] uppercase font-black text-amber-950 flex items-center gap-1 mb-1"><span>📝</span><span>{t('pedagogy.modals.notesDuMestre')}</span></span>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{piece.notes}</p>
        </div>
      )}

      {audioUrl && (
        <div className="flex items-center gap-2 p-2 rounded bg-cordel-bg-light border border-encre-noire/15">
          <span className="text-xs select-none">🎧</span>
          <span className="text-[10px] font-bold text-stone-600 hidden sm:inline">{t('repertoire.audioRecord') || t('pedagogy.modals.ecouterLAudio')} :</span>
          <audio controls src={audioUrl} className="w-full h-8" preload="none" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {hasToada && (
          <button type="button" onClick={() => onOpenToada && onOpenToada(piece.activeToada, piece)} className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLesParolesCompletes')}>
            <span>🗣️</span><span>{t('repertoire.lyricsTab') || t('pedagogy.modals.paroles')}{piece.activeToada?.titre ? ` (${piece.activeToada.titre})` : ''}</span>
          </button>
        )}
        {hasCulture && (
          cultureDocs.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {cultureDocs.map((cDoc, cIdx) => (
                <button key={cDoc.id || cIdx} type="button" onClick={() => onOpenCulture && onOpenCulture(cDoc, piece, cultureDocs)} className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none">
                  <span>📖</span><span className="truncate max-w-[140px]">{cDoc.titre || cDoc.name || `Culture #${cIdx + 1}`}</span><span className="text-[9px] opacity-70">↗</span>
                </button>
              ))}
            </div>
          ) : (
            <button type="button" onClick={() => onOpenCulture && onOpenCulture(cultureDocs[0] || null, piece, cultureDocs)} className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLaFicheCulturelle')}>
              <span>📖</span><span>{t('repertoire.cultureTab') || t('pedagogy.modals.cultureHistoire')}{(cultureDocs[0]?.titre || cultureDocs[0]?.name) ? ` : ${cultureDocs[0].titre || cultureDocs[0].name}` : ''}</span>
            </button>
          )
        )}
        {piece.hasTablature && (
          <button type="button" onClick={() => onOpenTablature && onOpenTablature(piece)} className="px-2.5 py-1 text-xs font-bold rounded bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-900 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLaTablatureComplete')}>
            <span>📄</span><span>{t('pedagogy.modals.tablature')}</span>
          </button>
        )}
        {hasSignals && (
          <button type="button" onClick={() => onOpenSignals && onOpenSignals(piece)} className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLAideMemoire')}>
            <span>🖐️</span><span>{t('repertoire.signalsTab') || t('pedagogy.modals.signesDuMestre')}</span>
          </button>
        )}
        {choreoId && (
          <button type="button" onClick={() => launchDancador({ choreoId, groupId })} className="px-2.5 py-1 text-xs font-bold rounded bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title="Ouvrir la chorégraphie dans Dançador">
            <span>💃</span><span>{t('pedagogy.modals.danse')} {piece.activeChoreography?.nom || piece.activeChoreography?.titre || t('pedagogy.modals.choregraphie')}</span><span className="text-[9px] opacity-70">↗</span>
          </button>
        )}
        {stepElements.slice(0, 2).map((el, sIdx) => (
          <button key={el.stepId || sIdx} type="button" onClick={() => launchDancador({ stepId: el.stepId, groupId })} className="px-2 py-1 text-[10px] font-bold rounded bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-900 flex items-center gap-1 cursor-pointer">
            <span>🦶</span><span>{el.nom || `Pas #${sIdx + 1}`}</span>
          </button>
        ))}
        <button type="button" onClick={() => (onOpenQuiz ? onOpenQuiz(piece) : setIsQuizModalOpen(true))} className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.lancerLeQcmFocus')}>
          <span>🎯</span><span>{t('repertoire.revisePiece') || t('pedagogy.modals.reviserCeMorceau') || 'Réviser ce morceau'}</span>
        </button>
      </div>

      <PieceVideoSection videos={piece.videos} defaultVideoUrl={piece.videoUrl || piece.activeVideoUrl || piece.youtubeUrl} userInstrument={profileData?.instrumentPrincipal || profileData?.instrument} />
      <PieceAisanceSection piece={piece} trainings={trainings} aisanceMap={aisanceMap} userId={userId} groupId={groupId} sequenceurUrl={sequenceurUrl} profileData={profileData} currentComfort={comfortLevel} onComfortPromoted={onComfortPromoted} />
      {isQuizModalOpen && <PieceQuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} piece={piece} groupId={groupId} profileData={profileData} sequenceurUrl={sequenceurUrl} currentComfort={comfortLevel} onComfortPromoted={onComfortPromoted} />}
    </div>
  );
}
