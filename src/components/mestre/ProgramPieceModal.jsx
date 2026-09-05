import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale de programmation rapide d'un morceau du répertoire dans un événement futur.
 * Permet d'injecter la pièce dans la setlist (fil conducteur) d'une répétition ou d'un concert.
 *
 * @param {boolean} isOpen - Indique si la modale est ouverte
 * @param {Function} onClose - Fonction de fermeture
 * @param {string} groupId - Identifiant de l'association
 * @param {Object} piece - Objet du morceau du répertoire
 * @param {Function} onSuccess - Callback après injection réussie
 */
export default function ProgramPieceModal({
  isOpen,
  onClose,
  groupId,
  piece,
  onSuccess
}) {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initialisation des notes d'intention d'après le morceau
  useEffect(() => {
    if (piece) {
      setCustomNotes(piece.notes || '');
      setErrorMsg(null);
    }
  }, [piece]);

  // Chargement des événements futurs éligibles (Répétitions, Prestations, Ateliers)
  useEffect(() => {
    if (!isOpen || !groupId) return;

    const fetchFutureEvents = async () => {
      setLoadingEvents(true);
      setErrorMsg(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const eventsRef = collection(db, 'events');
        const snap = await getDocs(eventsRef);
        const list = [];

        snap.forEach((d) => {
          const data = d.data();
          // Filtrage temporel hybride (dateDebut ou date)
          const rawDate = data.dateDebut || data.date || '';
          const eventDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;

          // On exclut les réunions administratives
          if (data.groupId === groupId && eventDate >= today && data.type !== 'reunion') {
            list.push({ id: d.id, ...data, computedDate: eventDate });
          }
        });

        // Tri chronologique ascendant
        list.sort((a, b) => (a.computedDate || '').localeCompare(b.computedDate || ''));
        setEvents(list);
        if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des événements futurs :", err);
        setErrorMsg("Impossible de charger les événements de l'agenda.");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchFutureEvents();
  }, [isOpen, groupId]);

  if (!isOpen || !piece) return null;

  // Soumission et enregistrement sécurisé dans Firestore
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEventId) {
      setErrorMsg("Veuillez sélectionner un événement de destination.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Détermination de la discipline dominante
      let resolvedType = 'percussion';
      if (piece.toadaDocId) resolvedType = 'song';
      else if (piece.dancadorChoreoId) resolvedType = 'danse';

      // Construction stricte de l'objet sans aucune clé undefined (anti-crash Firestore)
      const setlistItem = {
        id: `morceau_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        titre: piece.titre ? piece.titre.trim() : 'Morceau sans titre',
        notes: (customNotes || '').trim(),
        type: resolvedType,
        repertoireId: piece.id || null
      };

      if (piece.sequenceurFileUrl) {
        setlistItem.jsonUrl = piece.sequenceurFileUrl;
      }
      if (piece.sequenceurId) {
        setlistItem.sequenceurId = piece.sequenceurId;
      }
      if (piece.toadaDocId) {
        setlistItem.toadaDocId = piece.toadaDocId;
      }
      if (piece.dancadorChoreoId) {
        setlistItem.dancadorChoreoId = piece.dancadorChoreoId;
      }
      if (piece.cultureDocId) {
        setlistItem.cultureDocId = piece.cultureDocId;
      }

      const updates = {
        setlist: arrayUnion(setlistItem)
      };

      // Si le morceau comprend une chorégraphie, on l'associe également à la section danse de l'événement
      if (piece.dancadorChoreoId) {
        updates.dancadorChoreoIds = arrayUnion(piece.dancadorChoreoId);
      }

      const eventRef = doc(db, 'events', selectedEventId);
      await updateDoc(eventRef, updates);

      const targetedEvent = events.find((ev) => ev.id === selectedEventId);
      if (onSuccess) {
        onSuccess(targetedEvent, setlistItem);
      }
      onClose();
    } catch (err) {
      console.error("Erreur lors de l'injection dans le fil conducteur :", err);
      setErrorMsg("Erreur lors de l'enregistrement dans l'événement.");
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'prestation':
        return { label: 'Concert', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'repetition':
        return { label: 'Répétition', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'atelier':
        return { label: 'Atelier', bg: 'bg-yellow-100 text-yellow-900 border-yellow-300' };
      default:
        return { label: type || 'Événement', bg: 'bg-stone-100 text-stone-800 border-stone-300' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <CordelCard className="w-full max-w-lg p-6 flex flex-col gap-4 animate-scale-in bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716]">
        {/* En-tête de la modale */}
        <div className="border-b-2 border-dashed border-cordel-wood/30 pb-3 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
            <span>➕</span>
            <span>Programmer ce morceau</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-black text-lg p-1 cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Détails du morceau */}
        <div className="p-3 bg-white rounded border border-encre-noire/15 flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-encre-noire flex items-center gap-1.5">
              <span>📜</span>
              <span>{piece.titre}</span>
            </span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${piece.etatValidation === 'pret' ? 'bg-green-100 text-green-900 border-green-300' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
              {piece.etatValidation === 'pret' ? '🟢 Prêt' : '🟡 En chantier'}
            </span>
          </div>

          {/* Badges des liaisons actives */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[9px] font-bold text-encre-noire/70">
            {piece.sequenceurFileUrl && <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">🥁 Séquenceur lié</span>}
            {piece.toadaDocId && <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">🗣️ Toada liée</span>}
            {piece.dancadorChoreoId && <span className="px-1.5 py-0.5 rounded bg-pink-50 border border-pink-200">💃 Danse liée</span>}
            {piece.cultureDocId && <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">📖 Culture liée</span>}
            {!piece.sequenceurFileUrl && !piece.toadaDocId && !piece.dancadorChoreoId && !piece.cultureDocId && (
              <span className="italic opacity-60">Morceau autonome (sans ressource externe)</span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-100 border border-red-400 text-red-800 text-xs font-bold rounded">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
          {/* Sélection de l'événement futur */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Choisir un événement de destination (Répétition ou Concert) *
            </label>
            {loadingEvents ? (
              <p className="text-xs italic opacity-60">Chargement de l'agenda...</p>
            ) : events.length === 0 ? (
              <p className="text-xs italic text-red-700 font-semibold bg-red-50 p-2 rounded border border-red-200">
                Aucun événement futur (répétition ou prestation) trouvé dans l'agenda.
              </p>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={submitting}
                required
                className="theme-input text-xs font-bold py-2 bg-cordel-bg-light border-2 border-encre-noire rounded cursor-pointer"
              >
                {events.map((ev) => {
                  const badge = getTypeBadge(ev.type);
                  return (
                    <option key={ev.id} value={ev.id}>
                      [{badge.label}] {ev.computedDate} — {ev.titre || ev.title || 'Événement'}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Notes d'intention spécifiques pour cette séance */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Consignes &amp; Notes d'intention pour la séance (optionnel)
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Travailler l'appel du Mestre, caler le tempo à 120 BPM, vérifier la relance des caixas..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              disabled={submitting}
              className="theme-input text-xs font-medium p-2 bg-cordel-bg-light border-2 border-encre-noire rounded"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end pt-2 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={submitting || events.length === 0}
              className="px-5 py-2 text-xs font-black uppercase tracking-wider"
            >
              {submitting ? "Injection..." : "➕ Injecter au fil conducteur"}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
