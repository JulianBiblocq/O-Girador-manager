import React, { useState, useMemo, useEffect } from 'react';
import CultureCard from '../CultureCard';
import AutoEvalQuiz from '../pedagogy/AutoEvalQuiz';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel d'apprentissage Culturel pour le Répertoire (< 180 lignes).
 * Gère le multi-fiches avec sélecteur de puces Cordel et deux modes :
 * - Option A : Lire la fiche complète (CultureCard avec chapitres, illustrations).
 * - Option B : Quiz Culture (QCM auto-évalué via AutoEvalQuiz).
 */
export default function PieceCultureModal({
  isOpen,
  onClose,
  cultureDocs = [],
  initialDocId = null,
  piece = null,
  profileData = null
}) {
  const { t } = useTranslation();
  const docsList = useMemo(() => {
    if (Array.isArray(cultureDocs)) return cultureDocs.filter(Boolean);
    if (cultureDocs && typeof cultureDocs === 'object') return [cultureDocs];
    return [];
  }, [cultureDocs]);

  const [selectedDocId, setSelectedDocId] = useState(initialDocId || docsList[0]?.id || null);
  const [activeTab, setActiveTab] = useState('read'); // 'read' | 'quiz'

  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    } else if (docsList.length > 0 && !docsList.some((d) => d.id === selectedDocId)) {
      setSelectedDocId(docsList[0].id);
    }
  }, [initialDocId, docsList, selectedDocId]);

  if (!isOpen || docsList.length === 0) return null;

  const activeDoc = docsList.find((d) => d.id === selectedDocId) || docsList[0];
  const docTitle = activeDoc?.titre || activeDoc?.name || piece?.titre || 'Fiche Culture';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        {/* En-tête Cordel avec onglets et sélecteur multi-fiches */}
        <div className="w-full flex flex-col border-b-2 border-dashed border-cordel-master-dark/20 bg-stone-100/90 shrink-0">
          <div className="flex justify-between items-center px-4 py-2.5">
            <span className="text-xs sm:text-sm font-black uppercase text-blue-900 tracking-wider truncate pr-2">
              📖 {t('culture', 'Culture')} — {docTitle}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center border-2 border-white cursor-pointer hover:bg-stone-800 transition-colors shadow-2xs"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Sélecteur de fiches en puces Cordel si plusieurs fiches sont rattachées */}
          {docsList.length > 1 && (
            <div className="flex items-center gap-1.5 px-4 py-1.5 overflow-x-auto bg-stone-200/60 border-b border-encre-noire/10">
              <span className="text-[10px] font-black uppercase text-stone-600 shrink-0">
                Fiches ({docsList.length}) :
              </span>
              {docsList.map((doc, idx) => {
                const isSelected = (doc.id || idx) === (activeDoc?.id || idx);
                return (
                  <button
                    key={doc.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setActiveTab('read');
                    }}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-blue-900 text-white font-black'
                        : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-300'
                    }`}
                  >
                    {doc.titre || doc.name || `Fiche #${idx + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Bascule d'intention : Lecture vs Quiz */}
          <div className="flex items-center gap-2 px-4 pb-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('read')}
              className={`px-3 py-1.5 text-xs font-bold rounded-t border-b-2 transition-all cursor-pointer ${
                activeTab === 'read'
                  ? 'border-blue-900 text-blue-900 bg-[#fdfaf2] font-black shadow-xs'
                  : 'border-transparent text-stone-600 hover:text-stone-900'
              }`}
            >
              📜 {t('lireFiche', 'Lire la fiche')}
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
              🎯 {t('quizCulture', 'Quiz Culture')}
            </button>
          </div>
        </div>

        {/* Corps de la modale */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-cordel-bg-light flex flex-col items-center">
          {activeTab === 'read' ? (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="w-full max-w-[600px] flex items-center justify-between gap-2 p-2 rounded bg-white/80 border border-encre-noire/15 flex-wrap">
                <span className="text-[10px] sm:text-xs font-bold text-stone-600 truncate">
                  {activeDoc?.categorieFiche ? `${activeDoc.categorieFiche} • ` : ''}
                  {docTitle}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('quiz')}
                  className="px-3 py-1 text-[11px] font-black rounded bg-[var(--color-cordel-vert,#2d6a4f)] text-white hover:opacity-90 cursor-pointer shadow-2xs shrink-0 select-none"
                >
                  🎯 S'entraîner au Quiz
                </button>
              </div>

              <div className="w-full max-w-[600px]">
                <CultureCard culture={activeDoc} />
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <AutoEvalQuiz
                sheetData={activeDoc}
                profileData={profileData}
                onClose={() => setActiveTab('read')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
