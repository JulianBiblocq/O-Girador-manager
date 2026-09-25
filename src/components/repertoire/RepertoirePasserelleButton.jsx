import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Bouton passerelle Varal ➔ Répertoire (< 110 lignes).
 * Affiche un bouton stylisé Cordel vers la fiche Répertoire si une Toada ou Fiche Culture est associée.
 * Règle zéro bloc vide : retourne null si aucune pièce n'est liée.
 *
 * @param {string} toadaId - ID de la toada Varal
 * @param {string} cultureId - ID de la fiche culture Varal
 * @param {string} groupId - ID de l'association
 * @param {Array} repertoirePieces - Morceaux du répertoire pré-chargés (optionnel)
 * @param {Function} onNavigateToView - Callback de navigation globale (optionnel)
 * @param {string} className - Classes CSS additionnelles
 */
export default function RepertoirePasserelleButton({
  toadaId = null,
  cultureId = null,
  groupId = null,
  repertoirePieces = null,
  onNavigateToView = null,
  className = ''
}) {
  const [localPieces, setLocalPieces] = useState([]);

  // Écoute de secours si les morceaux ne sont pas fournis
  useEffect(() => {
    if (repertoirePieces !== null || !groupId || (!toadaId && !cultureId)) return;
    const colRef = collection(db, 'associations', groupId, 'repertoire');
    const unsub = onSnapshot(colRef, (snap) => {
      const items = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
      setLocalPieces(items);
    }, () => {});
    return () => unsub();
  }, [repertoirePieces, groupId, toadaId, cultureId]);

  const pieces = repertoirePieces !== null ? repertoirePieces : localPieces;

  // Détection de la pièce liée
  const matchedPiece = useMemo(() => {
    if (!pieces || pieces.length === 0) return null;
    return pieces.find((p) => {
      if (toadaId && p.toadaDocId === toadaId) return true;
      if (cultureId) {
        if (Array.isArray(p.cultureDocIds) && p.cultureDocIds.includes(cultureId)) return true;
        if (p.cultureDocId === cultureId) return true;
      }
      return false;
    }) || null;
  }, [pieces, toadaId, cultureId]);

  if (!matchedPiece) return null;

  const handleClick = (e) => {
    e.stopPropagation();

    // 1. Émission d'événement global
    window.dispatchEvent(
      new CustomEvent('open-repertoire-piece', {
        detail: { pieceId: matchedPiece.id, piece: matchedPiece }
      })
    );

    // 2. Mise à jour de l'URL
    try {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('tab', 'repertoire');
      searchParams.set('pieceId', matchedPiece.id);
      window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    } catch (_err) {
      // Ignorer si indisponible
    }

    // 3. Callback de routage interne
    if (onNavigateToView) {
      onNavigateToView('repertoire', { pieceId: matchedPiece.id });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0px_0px_#181716] transition-all cursor-pointer select-none active:translate-x-[0.5px] active:translate-y-[0.5px] ${className}`}
      title={`Accéder directement à la fiche du morceau « ${matchedPiece.titre} » dans le Répertoire`}
    >
      <span>📜</span>
      <span className="truncate max-w-[220px]">
        Fiche Répertoire : {matchedPiece.titre || 'Morceau'}
      </span>
      <span className="text-[10px] font-black">↗</span>
    </button>
  );
}
