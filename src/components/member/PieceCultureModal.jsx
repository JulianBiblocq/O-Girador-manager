import React, { useState, useMemo, useEffect } from 'react';
import CultureCard from '../CultureCard';
import { useTranslation } from '../LanguageContext';

/**
 * Modale de consultation culturelle pour le Répertoire Adhérent (< 90 lignes).
 * Ouvre directement la CultureCard en lecture seule.
 * Supporte le multi-fiches par puces de navigation, sans aucun QCM ni quiz.
 */
export default function PieceCultureModal({
  isOpen,
  onClose,
  cultureDocs = [],
  initialDocId = null,
  piece = null
}) {
  const { t } = useTranslation();
  const docsList = useMemo(() => {
    if (Array.isArray(cultureDocs)) return cultureDocs.filter(Boolean);
    if (cultureDocs && typeof cultureDocs === 'object') return [cultureDocs];
    return [];
  }, [cultureDocs]);

  // Initialisation de la fiche sélectionnée
  const [selectedDocId, setSelectedDocId] = useState(() => initialDocId || docsList[0]?.id || 0);

  // Synchronisation sécurisée uniquement lors du montage ou du changement de fiche cible initiale
  useEffect(() => {
    if (initialDocId != null) {
      setSelectedDocId(initialDocId);
    } else if (docsList.length > 0) {
      setSelectedDocId(docsList[0]?.id != null ? docsList[0].id : 0);
    }
  }, [initialDocId, isOpen]);

  if (!isOpen || docsList.length === 0) return null;

  // Résolution tolérante de la fiche active (supporte ID chaîne, numérique ou repli sur l'index)
  const activeDoc = useMemo(() => {
    if (!docsList || docsList.length === 0) return null;
    const found = docsList.find((d, idx) => {
      if (d?.id != null && selectedDocId != null) {
        return String(d.id) === String(selectedDocId);
      }
      return idx === selectedDocId;
    });
    return found || docsList[0];
  }, [docsList, selectedDocId]);

  const docTitle = activeDoc?.titre || activeDoc?.name || piece?.titre || 'Fiche Culture';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        {/* En-tête Cordel épuré */}
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
            <div className="flex items-center gap-1.5 px-4 py-1.5 overflow-x-auto bg-stone-200/60 border-t border-encre-noire/10">
              <span className="text-[10px] font-black uppercase text-stone-600 shrink-0">
                Fiches ({docsList.length}) :
              </span>
              {docsList.map((doc, idx) => {
                const docKey = doc?.id != null ? doc.id : idx;
                const isSelected = activeDoc === doc || String(docKey) === String(selectedDocId);
                return (
                  <button
                    key={docKey}
                    type="button"
                    onClick={() => setSelectedDocId(docKey)}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-blue-900 text-white font-black'
                        : 'bg-white/80 hover:bg-white text-stone-700 border border-stone-300'
                    }`}
                  >
                    {doc?.titre || doc?.name || `Fiche #${idx + 1}`}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Corps : Affichage direct de CultureCard en lecture seule (zéro QCM) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-cordel-bg-light flex flex-col items-center">
          <div className="w-full max-w-[600px]">
            <CultureCard culture={activeDoc} />
          </div>
        </div>
      </div>
    </div>
  );
}
