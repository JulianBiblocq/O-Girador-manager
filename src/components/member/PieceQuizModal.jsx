import React, { useMemo } from 'react';
import AutoEvalQuiz from '../pedagogy/AutoEvalQuiz';
import { generateQuizFromRepertoirePiece } from '../../utils/quizGenerator';
import useMestreSignals from '../../hooks/useMestreSignals';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useRepertoireVaralDocs } from '../../hooks/useRepertoireVaralDocs';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel du Mode « Focus Répertoire » (< 150 lignes).
 * Génère et anime un QCM complet focalisé sur un morceau du Répertoire :
 * - Matériel (Baguettes Alfaia via detectAlfaiaSticks)
 * - Direction Musicale (Signes du Mestre)
 * - Tablature Rythmique du pupitre face à 3 leurres
 * - Paroles (Sens de mot / Vers manquant)
 * - Culture (Orixá / Symbole / Anecdote)
 */
export default function PieceQuizModal({
  isOpen,
  onClose,
  piece,
  groupId = null,
  profileData = null
}) {
  const { t } = useTranslation();
  const effectiveGroupId = groupId || profileData?.groupId || null;
  const { signals: catalogSignals = [] } = useMestreSignals(effectiveGroupId);
  const { rhythms = [] } = useSequencerRhythms(effectiveGroupId);
  const { toadasList = [], cultureDocsList = [] } = useRepertoireVaralDocs(effectiveGroupId);

  // Génération dynamique et sécurisée des questions pour ce morceau
  const quizQuestions = useMemo(() => {
    if (!piece) return [];

    const matchedPreset = rhythms.find(
      (r) => r.id === piece.sequenceurId || r.presetId === piece.sequenceurId || r.titre === piece.titre
    );

    const contextData = {
      presetData: matchedPreset?.parsedData || piece.parsedSequencerData || matchedPreset || null,
      allPresets: rhythms,
      catalogSignals,
      allSongs: toadasList,
      allSheetsData: cultureDocsList,
      toadaDoc: piece.activeToada || toadasList.find((s) => s.id === piece.toadaDocId),
      cultureDoc: piece.activeCultureDoc || piece.activeCultureDocs?.[0] || cultureDocsList.find((c) => c.id === piece.cultureDocId),
      userInstrument: profileData?.instrumentPrincipal || profileData?.instrument || 'alfaia',
      t
    };

    return generateQuizFromRepertoirePiece(piece, contextData, { t });
  }, [piece, rhythms, catalogSignals, toadasList, cultureDocsList, profileData, t]);

  if (!isOpen || !piece) return null;

  return (
    <AutoEvalQuiz
      customQuizData={quizQuestions}
      customQuizId={`piece_${piece.id}`}
      customQuizTitle={piece.titre || 'Morceau'}
      profileData={profileData}
      onClose={onClose}
      qcmGlobalConfig={{ difficulty: 'medium' }}
    />
  );
}
