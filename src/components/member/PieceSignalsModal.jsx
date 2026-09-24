import React, { useState, useMemo } from 'react';
import useMestreSignals from '../../hooks/useMestreSignals';
import { generateQuizFromPieceSignals } from '../../utils/quizGenerator';
import AutoEvalQuiz from '../pedagogy/AutoEvalQuiz';
import PieceSignalsMemorandoView from './PieceSignalsMemorandoView';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel des Signes du Mestre pour un morceau du Répertoire (< 150 lignes).
 * Deux modes : Option A (Aide-mémoire & récitation masquée) et Option B (Défi QCM).
 */
export default function PieceSignalsModal({
  isOpen,
  onClose,
  piece,
  groupId = null,
  profileData = null
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('memorando'); // 'memorando' | 'quiz'
  const [hideLabels, setHideLabels] = useState(false);

  const { signals: catalogSignals = [] } = useMestreSignals(groupId);

  // Résolution exhaustive des signaux depuis signalIds ET sinaisDoMestre
  const resolvedSignals = useMemo(() => {
    if (!piece) return [];

    const fromSignalIds = (Array.isArray(piece.signalIds) ? piece.signalIds : []).map((sigId, idx) => {
      const match = catalogSignals.find((cs) => cs.id === sigId);
      return {
        id: sigId,
        mesure: idx + 1,
        nom: match?.name || match?.nom || sigId,
        consigne: match?.consigne || match?.action || match?.description || '',
        imageUrl: match?.imageUrl || null
      };
    });

    const raw = (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0)
      ? piece.sinaisDoMestre
      : (Array.isArray(piece.activeSinaisDoMestre) ? piece.activeSinaisDoMestre : []);

    const fromSinais = raw.map((sig, idx) => {
      const match = catalogSignals.find((cs) =>
        (sig.signalId && cs.id === sig.signalId) ||
        (sig.id && cs.id === sig.id) ||
        (sig.name && cs.name && cs.name.toLowerCase() === sig.name.toLowerCase()) ||
        (sig.nom && cs.nom && cs.nom.toLowerCase() === sig.nom.toLowerCase()) ||
        (sig.nom && cs.name && cs.name.toLowerCase() === sig.nom.toLowerCase()) ||
        (sig.name && cs.nom && cs.name.toLowerCase() === sig.nom.toLowerCase())
      );
      const m = sig.mesure ?? sig.bar ?? sig.barIndex ?? (idx + 1);
      return {
        id: sig.id || match?.id || `sig_${idx}`,
        mesure: Number(m) || (idx + 1),
        nom: sig.nom || sig.name || match?.name || match?.nom || `Signe ${idx + 1}`,
        consigne: sig.consigne || sig.action || match?.consigne || match?.action || match?.description || '',
        imageUrl: sig.imageUrl || match?.imageUrl || null
      };
    });

    const combined = [...fromSinais];
    fromSignalIds.forEach((fs) => {
      if (!combined.some((c) => c.id === fs.id || (c.nom && fs.nom && c.nom.toLowerCase() === fs.nom.toLowerCase()))) {
        combined.push(fs);
      }
    });

    return combined.sort((a, b) => Number(a.mesure) - Number(b.mesure));
  }, [piece, catalogSignals]);

  const quizQuestions = useMemo(() => {
    if (!piece || resolvedSignals.length === 0) return [];
    return generateQuizFromPieceSignals(piece, resolvedSignals, catalogSignals, { t });
  }, [piece, resolvedSignals, catalogSignals, t]);

  if (!isOpen || !piece) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        {/* En-tête Cordel avec onglets */}
        <div className="w-full flex flex-col border-b-2 border-dashed border-cordel-master-dark/20 bg-stone-100/90 shrink-0">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider truncate pr-2">
              🖐️ {t('signesTitle', 'Signes du Mestre')} — {piece.titre}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white cursor-pointer hover:bg-stone-800 transition-colors"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('memorando')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t border-b-2 transition-all cursor-pointer ${
                activeTab === 'memorando'
                  ? 'border-cordel-wood text-cordel-wood bg-[#fdfaf2] font-black shadow-xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              👁️ {t('aideMemoire', 'Aide-mémoire')} ({resolvedSignals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t border-b-2 transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'border-[var(--color-cordel-vert,#2d6a4f)] text-[var(--color-cordel-vert,#2d6a4f)] bg-[#fdfaf2] font-black shadow-xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              🎯 {t('defiSignes', 'Défi des signes')} {quizQuestions.length > 0 ? `(${quizQuestions.length})` : ''}
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-cordel-bg-light">
          {activeTab === 'memorando' ? (
            <PieceSignalsMemorandoView
              resolvedSignals={resolvedSignals}
              hideLabels={hideLabels}
              setHideLabels={setHideLabels}
              onSwitchToQuiz={() => setActiveTab('quiz')}
            />
          ) : (
            <AutoEvalQuiz
              sheetData={piece}
              customQuizData={quizQuestions}
              customQuizTitle={`Signes — ${piece.titre}`}
              customQuizId={`${piece.id}_signals`}
              profileData={profileData}
              onClose={() => setActiveTab('memorando')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
