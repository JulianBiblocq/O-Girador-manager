import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import { normalizeString } from '../../utils/repertoireMatcher';
import { findNextRehearsalWithSetlist } from '../../utils/aisanceAutoSync';
import { useTranslation } from '../LanguageContext';

/**
 * Bandeau « Au Programme de la Prochaine Répétition » (< 120 lignes).
 * Règle Zéro Bloc Vide : retourne null si aucun événement futur n'a de setlist.
 */
export default function NextRehearsalAisanceBanner({
  groupId, repertoire = [], upcomingEvent = null, onFocusPiece = null, onRevisePiece = null
}) {
  const { t } = useTranslation();
  const [fetchedEvents, setFetchedEvents] = useState([]);

  useEffect(() => {
    if (upcomingEvent || !groupId) return;
    let isMounted = true;
    getDocs(query(collection(db, 'events'), where('groupId', '==', groupId)))
      .then((snap) => {
        if (!isMounted) return;
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setFetchedEvents(list);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [groupId, upcomingEvent]);

  const activeEvent = useMemo(
    () => upcomingEvent || findNextRehearsalWithSetlist(fetchedEvents),
    [upcomingEvent, fetchedEvents]
  );

  // Règle Zéro Bloc Vide
  if (!activeEvent || !Array.isArray(activeEvent.setlist) || activeEvent.setlist.length === 0) {
    return null;
  }

  const rawDate = activeEvent.dateDebut || activeEvent.date || '';
  const formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR') : '';
  const globalNote = activeEvent.noteIntention || activeEvent.notes || '';

  const resolveSetlistPiece = (item) => {
    const targetId = item.repertoireId || item.pieceId || item.itemId || item.id;
    const normTitle = normalizeString(item.titre || item.title || item.name);
    return (
      repertoire.find((p) => p.id === targetId || (normTitle && normalizeString(p.titre) === normTitle)) ||
      { id: targetId || item.id, titre: item.titre || item.title || 'Morceau', notes: item.notes }
    );
  };

  return (
    <CordelCard className="p-3.5 bg-amber-50/90 border-2 border-[var(--color-cordel-ocre)] flex flex-col gap-2.5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[var(--color-cordel-ocre)]/30 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-ocre)]">
            📅 {t('pedagogy.carnet.nextRehearsalBannerTitle')}
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white border border-encre-noire/20 text-encre-noire">
            {formattedDate ? `${formattedDate} — ` : ''}{activeEvent.titre || activeEvent.title || t('pedagogy.carnet.nextRehearsalDefaultName')}
          </span>
        </div>
        {globalNote && <p className="text-[11px] font-bold italic text-encre-noire/80">« {globalNote} »</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {activeEvent.setlist.map((item, idx) => {
          const pieceObj = resolveSetlistPiece(item);
          const itemNote = item.noteIntention || item.notes || '';
          return (
            <div key={item.id || idx} className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-encre-noire/25 shadow-2xs">
              <button
                type="button" onClick={() => onFocusPiece && onFocusPiece(pieceObj)}
                className="text-xs font-black text-encre-noire hover:text-cordel-wood cursor-pointer text-left"
                title={itemNote || t('pedagogy.carnet.btnFocusPieceAisance')}
              >
                🎼 {pieceObj.titre}
              </button>
              {onRevisePiece && (
                <button
                  type="button" onClick={() => onRevisePiece(pieceObj)}
                  className="text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white hover:brightness-110 cursor-pointer"
                  title={t('pedagogy.carnet.btnReviseThisPiece')}
                >
                  🎯 {t('pedagogy.carnet.btnReviseShort')}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
