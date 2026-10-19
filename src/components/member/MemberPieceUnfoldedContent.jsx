import React, { useState } from 'react';
import PieceAisanceSection from './PieceAisanceSection';
import PieceVideoSection from '../repertoire/PieceVideoSection';
import PieceQuizModal from './PieceQuizModal';
import SequencerAccessButtons from '../repertoire/SequencerAccessButtons';
import { useTranslation } from '../LanguageContext';
import { getEcosystemUrl } from '../../constants/ecosystemUrls';
import { launchCrossApp } from '../../utils/crossAppAuth';

/**
 * Contenu déplié de la carte morceau pour adhérents (lecture seule stricte).
 * Affiche notes, audio, toadas, tablatures, danse, culture, signaux,
 * passerelle Atelier Vocal, vidéos, entraînements et quiz.
 */
export default function MemberPieceUnfoldedContent({
  piece,
  userId,
  groupId,
  profileData = null,
  trainings = [],
  aisanceMap = {},
  onOpenTablature,
  onOpenToada,
  onOpenCulture,
  onOpenSignals,
  onOpenQuiz = null,
  sequenceurUrl
}) {
  const { t } = useTranslation();
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const audioUrl = piece.activeAudioUrl || piece.audioUrl;
  const hasToada = Boolean(piece.activeToada && (
    piece.activeToada.paroles?.trim() || piece.activeToada.texte?.trim() ||
    piece.activeToada.strophes?.length || piece.activeToada.titre?.trim()
  ));
  const cultureDocs = Array.isArray(piece.activeCultureDocs) && piece.activeCultureDocs.length > 0
    ? piece.activeCultureDocs : (piece.activeCultureDoc ? [piece.activeCultureDoc] : []);
  const hasCulture = Boolean(cultureDocs.length > 0 || piece.cultureDocIds?.length || piece.cultureDocId);
  const hasSignals = Boolean(piece.sinaisDoMestre?.length || piece.activeSinaisDoMestre?.length || piece.signalIds?.length);
  const isSongPiece = piece.type === 'song' || piece.typeMorceau === 'song' || hasToada || Boolean(piece.toadaId || piece.toadaDocId || piece.toada || piece.cantadorToadaId);

  const handleOpenVocalLab = () => {
    const toadaId = encodeURIComponent(piece.cantadorToadaId || '');
    const songId = encodeURIComponent(piece.id || '');
    launchCrossApp(getEcosystemUrl('vocalLab', `?mode=eleve&toadaId=${toadaId}&songId=${songId}`), { appLabel: "Cantador" });
  };

  return (
    <div className="p-3.5 flex flex-col gap-3 text-left">
      {/* 1. Notes du Mestre */}
      {piece.notes && piece.notes.trim() !== '' && (
        <div className="p-2.5 rounded bg-amber-50/80 border border-dashed border-amber-300 text-left">
          <span className="text-[9.5px] uppercase font-black text-amber-950 flex items-center gap-1 mb-1">
            <span>📝</span><span>{t('pedagogy.modals.notesDuMestre')}</span>
          </span>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{piece.notes}</p>
        </div>
      )}

      {/* 2. Lecteur audio compact Cordel */}
      {audioUrl && (
        <div className="flex items-center gap-2 p-2 rounded bg-cordel-bg-light border border-encre-noire/15">
          <span className="text-xs select-none">🎧</span>
          <span className="text-[10px] font-bold text-stone-600 hidden sm:inline">{t('repertoire.audioRecord') || t('pedagogy.modals.ecouterLAudio')} :</span>
          <audio controls src={audioUrl} className="w-full h-8" preload="none" />
        </div>
      )}

      {/* 3. Passerelles multimédias épurées */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Paroles */}
        {hasToada && (
          <button type="button" onClick={() => onOpenToada && onOpenToada(piece.activeToada, piece)} className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLesParolesCompletes')}>
            <span>🗣️</span><span>{t('repertoire.lyricsTab') || t('pedagogy.modals.paroles')}{piece.activeToada?.titre ? ` (${piece.activeToada.titre})` : ''}</span>
          </button>
        )}

        {/* Fiches Culturelles */}
        {hasCulture && (
          cultureDocs.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {cultureDocs.map((cDoc, cIdx) => (
                <button key={cDoc.id || cIdx} type="button" onClick={() => onOpenCulture && onOpenCulture(cDoc, piece, cultureDocs)} className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={`Consulter la fiche culturelle : ${cDoc.titre || cDoc.name || 'Culture'}`}>
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

        {/* Tablature */}
        {piece.hasTablature && (
          <button type="button" onClick={() => onOpenTablature && onOpenTablature(piece)} className="px-2.5 py-1 text-xs font-bold rounded bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-900 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLaTablatureComplete')}>
            <span>📄</span><span>{t('pedagogy.modals.tablature')}</span>
          </button>
        )}

        {/* Signes du Mestre */}
        {hasSignals && (
          <button type="button" onClick={() => onOpenSignals && onOpenSignals(piece)} className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.consulterLAideMemoire')}>
            <span>🖐️</span><span>{t('repertoire.signalsTab') || t('pedagogy.modals.signesDuMestre')}</span>
          </button>
        )}

        {/* Danse */}
        {piece.activeChoreography && (
          <div className="px-2.5 py-1 text-xs font-bold rounded bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-1.5 shadow-2xs select-none">
            <span>💃</span><span>{t('pedagogy.modals.danse')} {piece.activeChoreography.nom || piece.activeChoreography.titre || t('pedagogy.modals.choregraphie')}</span>
          </div>
        )}

        {/* Séquenceur découplé : Écouter & Jouer avec */}
        {piece.sequenceurId && (
          <SequencerAccessButtons piece={piece} sequenceurUrl={sequenceurUrl} profileData={profileData} />
        )}

        {/* Passerelle Cantador — Mode élève & ciblage chant */}
        {isSongPiece && (
          <button type="button" onClick={handleOpenVocalLab} className="px-2.5 py-1 text-xs font-bold rounded bg-orange-50 hover:bg-orange-100 border border-orange-300 text-orange-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('repertoire.tooltipVocalLab') || "Ouvrir Cantador en ligne"}>
            <span>🎙️</span><span>{t('repertoire.btnTrainVocalDirect') || t('repertoire.btnVocalLab') || "S'entraîner au chant (Cantador)"}</span>
          </button>
        )}

        {/* Quiz Focus Répertoire */}
        <button type="button" onClick={() => (onOpenQuiz ? onOpenQuiz(piece) : setIsQuizModalOpen(true))} className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center gap-1.5 cursor-pointer shadow-2xs select-none" title={t('pedagogy.modals.lancerLeQcmFocus')}>
          <span>🎯</span><span>{t('repertoire.revisePiece') || t('pedagogy.modals.reviserCeMorceau')}</span>
        </button>
      </div>

      {/* 4. Lecteur vidéo multi-pupitres */}
      <PieceVideoSection videos={piece.videos} defaultVideoUrl={piece.videoUrl || piece.activeVideoUrl || piece.youtubeUrl} userInstrument={profileData?.instrumentPrincipal || profileData?.instrument} />

      {/* 5. Entraînements et Paliers d'Aisance */}
      <PieceAisanceSection piece={piece} trainings={trainings} aisanceMap={aisanceMap} userId={userId} groupId={groupId} sequenceurUrl={sequenceurUrl} profileData={profileData} />

      {/* 6. Modale QCM Focus Répertoire */}
      {isQuizModalOpen && (
        <PieceQuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} piece={piece} groupId={groupId} profileData={profileData} />
      )}
    </div>
  );
}
