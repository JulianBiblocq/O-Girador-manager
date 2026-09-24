import React, { useMemo } from 'react';
import useMestreSignals from '../../hooks/useMestreSignals';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel d'aide-mémoire des Signes du Mestre pour un morceau du Répertoire (< 120 lignes).
 * Galerie en lecture directe épurée : affiche les signaux réels (visuel, nom de l'appel, consigne).
 * Sans quiz, sans QCM, sans masquage et sans données factices.
 */
export default function PieceSignalsModal({
  isOpen,
  onClose,
  piece,
  groupId = null
}) {
  const { t } = useTranslation();
  const { signals: catalogSignals = [] } = useMestreSignals(groupId);

  // Résolution rigoureuse des signaux réels du morceau (interdiction des signaux factices ou bruts)
  const resolvedSignals = useMemo(() => {
    if (!piece) return [];

    const signalsList = [];
    const seenIds = new Set();
    const seenNames = new Set();

    const addSignal = (sig, barNumber = null) => {
      if (!sig || !sig.id) return;
      const nom = (sig.name || sig.nom || '').trim();
      // Interdiction formelle des signaux sans nom réel ou factices
      if (!nom || nom.toLowerCase().startsWith('signe ')) return;
      const normName = nom.toLowerCase();
      if (seenIds.has(sig.id) || seenNames.has(normName)) return;

      seenIds.add(sig.id);
      seenNames.add(normName);
      signalsList.push({
        id: sig.id,
        mesure: barNumber ? Number(barNumber) : null,
        nom,
        consigne: (sig.consigne || sig.action || sig.description || '').trim(),
        imageUrl: sig.imageUrl || null
      });
    };

    // 1. Depuis piece.signalIds
    if (Array.isArray(piece.signalIds)) {
      piece.signalIds.forEach((sigId, idx) => {
        const match = catalogSignals.find((cs) => cs.id === sigId);
        if (match) {
          addSignal(match, idx + 1);
        }
      });
    }

    // 2. Depuis sinaisDoMestre / activeSinaisDoMestre
    const rawSinais = (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0)
      ? piece.sinaisDoMestre
      : (Array.isArray(piece.activeSinaisDoMestre) ? piece.activeSinaisDoMestre : []);

    rawSinais.forEach((sig, idx) => {
      const sid = typeof sig === 'object' && sig !== null ? (sig.signalId || sig.id) : String(sig);
      const m = typeof sig === 'object' && sig !== null ? (sig.mesure ?? sig.bar ?? sig.barIndex) : null;
      const match = catalogSignals.find((cs) =>
        (sid && cs.id === sid) ||
        (sig.name && cs.name && cs.name.toLowerCase() === sig.name.toLowerCase()) ||
        (sig.nom && cs.nom && cs.nom.toLowerCase() === sig.nom.toLowerCase()) ||
        (sig.nom && cs.name && cs.name.toLowerCase() === sig.nom.toLowerCase()) ||
        (sig.name && cs.nom && cs.name.toLowerCase() === sig.nom.toLowerCase())
      );
      if (match) {
        addSignal(match, m);
      } else if (typeof sig === 'object' && sig !== null && (sig.name || sig.nom)) {
        const nameVal = (sig.name || sig.nom || '').trim();
        // Vérification contre les IDs bruts Firestore non résolus
        const isLikelyRawId = /^[a-zA-Z0-9_-]{16,}$/.test(nameVal);
        if (!isLikelyRawId && !nameVal.toLowerCase().startsWith('signe ')) {
          addSignal({
            id: sig.id || `custom_${idx}`,
            name: nameVal,
            consigne: sig.consigne || sig.action || sig.description || '',
            imageUrl: sig.imageUrl || null
          }, m);
        }
      }
    });

    return signalsList.sort((a, b) => {
      if (a.mesure && b.mesure) return a.mesure - b.mesure;
      if (a.mesure) return -1;
      if (b.mesure) return 1;
      return a.nom.localeCompare(b.nom);
    });
  }, [piece, catalogSignals]);

  if (!isOpen || !piece) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        {/* En-tête Cordel épuré */}
        <div className="w-full flex justify-between items-center px-4 py-2.5 bg-stone-100/90 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <span className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider truncate pr-2">
            🖐️ {t('signesTitle', 'Signes du Mestre')} — {piece.titre}
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

        {/* Corps : Galerie d'aide-mémoire en lecture directe */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-cordel-bg-light">
          {resolvedSignals.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-stone-500 bg-white/60 border border-dashed border-encre-noire/20 rounded">
              Aucun signe ou convention n'a encore été associé à ce morceau.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-2 rounded bg-white/80 border border-encre-noire/15">
                <span className="text-xs font-bold text-stone-700">
                  {resolvedSignals.length} convention{resolvedSignals.length > 1 ? 's' : ''} et geste{resolvedSignals.length > 1 ? 's' : ''} du Mestre
                </span>
                <span className="text-[10px] text-stone-500 italic">Aide-mémoire de jeu</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resolvedSignals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3 rounded bg-white border-2 border-encre-noire/20 flex gap-3 items-center shadow-2xs hover:border-encre-noire/40 transition-colors"
                  >
                    {/* Vignette visuelle */}
                    <div className="shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded border border-encre-noire/15 overflow-hidden flex items-center justify-center bg-stone-50">
                      {sig.imageUrl ? (
                        <img
                          src={sig.imageUrl}
                          alt={sig.nom}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-1 text-cordel-wood select-none">
                          <span className="text-2xl">✋</span>
                          <span className="text-[8px] font-bold uppercase text-stone-500 mt-0.5">Geste</span>
                        </div>
                      )}
                    </div>

                    {/* Informations du geste */}
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                      {sig.mesure && (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-amber-100 text-amber-950 w-fit border border-amber-300">
                          Mesure {sig.mesure}
                        </span>
                      )}
                      <h4 className="text-xs sm:text-sm font-black text-encre-noire truncate uppercase mt-0.5">
                        {sig.nom}
                      </h4>
                      {sig.consigne && (
                        <p className="text-[11px] text-stone-600 italic line-clamp-3 leading-tight mt-0.5">
                          {sig.consigne}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
