import React, { useState, useMemo } from 'react';
import useMestreSignals from '../../hooks/useMestreSignals';
import PieceReflexConfigModal from '../mestre/PieceReflexConfigModal';
import { useTranslation } from '../LanguageContext';

/**
 * Modale Cordel d'aide-mémoire des Signes du Mestre pour un morceau du Répertoire (< 135 lignes).
 * Inclut pour le Mestre l'accès direct à l'Inspecteur d'Arbitrage (PieceReflexConfigModal).
 */
export default function PieceSignalsModal({
  isOpen,
  onClose,
  piece,
  groupId = null,
  profileData = null
}) {
  const { t } = useTranslation();
  const { signals: catalogSignals = [] } = useMestreSignals(groupId);
  const [isReflexConfigOpen, setIsReflexConfigOpen] = useState(false);

  const isSequenced = Boolean(piece?.hasSequencer || piece?.sequenceurId || piece?.sequenceurFileUrl || piece?.activeSequencerUrl);
  const isMestre = Boolean(
    profileData?.role === 'mestre' || profileData?.role === 'admin' || profileData?.isSuperAdmin || !profileData
  );

  const resolvedSignals = useMemo(() => {
    if (!piece) return [];
    const signalsList = [];
    const seenIds = new Set();
    const seenNames = new Set();

    const addSignal = (sig, barNumber = null) => {
      if (!sig || !sig.id) return;
      const nom = (sig.name || sig.nom || '').trim();
      if (!nom || /^[a-zA-Z0-9_-]{16,}$/.test(nom) || nom.toLowerCase().startsWith('signe ')) return;
      const normName = nom.toLowerCase();
      if (seenIds.has(sig.id) || seenNames.has(normName)) return;
      seenIds.add(sig.id);
      seenNames.add(normName);
      signalsList.push({
        id: sig.id,
        mesure: isSequenced && barNumber ? Number(barNumber) : null,
        nom,
        consigne: (sig.consigne || sig.action || sig.description || '').trim(),
        imageUrl: sig.imageUrl || null
      });
    };

    const rawSinais = (Array.isArray(piece.sinaisDoMestre) && piece.sinaisDoMestre.length > 0)
      ? piece.sinaisDoMestre
      : (Array.isArray(piece.activeSinaisDoMestre) ? piece.activeSinaisDoMestre : []);

    rawSinais.forEach((sig, idx) => {
      const sid = typeof sig === 'object' && sig !== null ? (sig.signalId || sig.id) : String(sig);
      const m = isSequenced && typeof sig === 'object' && sig !== null ? (sig.mesure ?? sig.bar ?? sig.barIndex) : null;
      const match = catalogSignals.find((cs) =>
        (sid && cs.id === sid) ||
        (sig.name && cs.name && cs.name.toLowerCase() === sig.name.toLowerCase()) ||
        (sig.nom && cs.nom && cs.nom.toLowerCase() === sig.nom.toLowerCase())
      );
      if (match) addSignal(match, m);
      else if (typeof sig === 'object' && sig !== null && (sig.name || sig.nom)) {
        addSignal({ id: sig.id || `custom_${idx}`, name: sig.name || sig.nom, consigne: sig.consigne || sig.action || '', imageUrl: sig.imageUrl || null }, m);
      }
    });

    if (rawSinais.length === 0 && Array.isArray(piece.signalIds)) {
      piece.signalIds.forEach((sigId) => {
        const match = catalogSignals.find((cs) => cs.id === sigId);
        if (match) addSignal(match, null);
      });
    }

    return signalsList.sort((a, b) => {
      if (isSequenced && (a.mesure || b.mesure)) return (a.mesure || 999) - (b.mesure || 999);
      return a.nom.localeCompare(b.nom);
    });
  }, [piece, catalogSignals, isSequenced]);

  if (!isOpen || !piece) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#fdfaf2] rounded-lg shadow-2xl overflow-hidden border-2 border-encre-noire text-left">
        <div className="w-full flex justify-between items-center gap-3 p-4 bg-stone-100/90 border-b-2 border-dashed border-cordel-master-dark/20 shrink-0">
          <span className="text-xs sm:text-sm font-black uppercase text-cordel-wood tracking-wider truncate">
            🖐️ {t('repertoire.signalsTitle') || t('pedagogy.modals.signesConventionsDuMestre')} — {piece.titre}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {isMestre && isSequenced && (
              <button
                type="button"
                onClick={() => setIsReflexConfigOpen(true)}
                className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-cordel-wood text-white border border-encre-noire cursor-pointer"
              >
                🎯 {t('pedagogy.reflex.mestreReflexConfigBtn')}
              </button>
            )}
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-encre-noire text-white font-black text-sm flex items-center justify-center hover:bg-red-700 cursor-pointer">✕</button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-cordel-bg-light">
          {resolvedSignals.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-stone-500 bg-white/60 border border-dashed border-encre-noire/20 rounded">
              {t('repertoire.emptySignals') || t('pedagogy.modals.aucunAppelOuSignal')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {resolvedSignals.map((sig) => (
                <div key={sig.id} className="p-3 rounded bg-white border-2 border-encre-noire/20 flex gap-3 items-center shadow-2xs">
                  <div className="shrink-0 w-16 h-16 rounded border border-encre-noire/15 overflow-hidden flex items-center justify-center bg-stone-50">
                    {sig.imageUrl ? <img src={sig.imageUrl} alt={sig.nom} className="w-full h-full object-contain p-1" loading="lazy" /> : <span className="text-2xl">✋</span>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5 text-left">
                    {isSequenced && sig.mesure && <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase bg-amber-100 text-amber-950 w-fit border border-amber-300">{t('pedagogy.modals.mesure')} {sig.mesure}</span>}
                    <h4 className="text-xs sm:text-sm font-black text-encre-noire truncate uppercase">{sig.nom}</h4>
                    {sig.consigne && <p className="text-[11px] text-stone-600 italic line-clamp-3 leading-tight">{sig.consigne}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isReflexConfigOpen && (
          <PieceReflexConfigModal isOpen={isReflexConfigOpen} onClose={() => setIsReflexConfigOpen(false)} piece={piece} groupId={groupId} />
        )}
      </div>
    </div>
  );
}
