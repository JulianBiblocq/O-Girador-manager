import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale Cordel réutilisable pour programmer directement un item (point chaud ou note)
 * dans le fil conducteur de la prochaine répétition sans passer par le bloc-notes.
 *
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture
 * @param {string} groupId - Identifiant du groupe/association
 * @param {Object} item - L'item à programmer ({ id, titre, discipline, type, itemId, requestCount, rawItem, detail })
 * @param {Function} onSuccess - Callback appelé après injection réussie avec l'événement ciblé
 */
export default function ProgramRehearsalModal({
  isOpen,
  onClose,
  groupId,
  item,
  onSuccess
}) {
  const [rehearsals, setRehearsals] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Initialisation de la note d'intention par défaut lors de la sélection de l'item
  useEffect(() => {
    if (item) {
      const defaultNote = item.detail 
        ? item.detail 
        : `Point prioritaire : ${item.titre}.${item.requestCount > 0 ? ` 🙋 Signalé par ${item.requestCount} élève(s).` : ''}`;
      setCustomNotes(defaultNote);
      setErrorMsg(null);
    }
  }, [item]);

  // Chargement des répétitions futures
  useEffect(() => {
    if (!isOpen || !groupId) return;

    const fetchFutureRehearsals = async () => {
      setLoadingEvents(true);
      setErrorMsg(null);
      try {
        const today = new Date().toISOString().split('T')[0];
        const eventsRef = collection(db, 'events');
        const snap = await getDocs(eventsRef);
        const list = [];

        snap.forEach(d => {
          const data = d.data();
          const eventDate = data.dateDebut || data.date || '';
          if (data.groupId === groupId && data.type === 'repetition' && eventDate >= today) {
            list.push({ id: d.id, ...data });
          }
        });

        // Tri chronologique par date ascendante
        list.sort((a, b) => (a.dateDebut || a.date || '').localeCompare(b.dateDebut || b.date || ''));
        setRehearsals(list);
        if (list.length > 0) {
          setSelectedEventId(list[0].id);
        }
      } catch (err) {
        console.error("Erreur chargement des répétitions :", err);
        setErrorMsg("Impossible de charger les répétitions futures.");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchFutureRehearsals();
  }, [isOpen, groupId]);

  if (!isOpen || !item) return null;

  // Soumission et injection dans Firestore (events.setlist)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedEventId) {
      setErrorMsg("Veuillez sélectionner une répétition.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Détermination sécurisée du type sans valeur undefined
      const resolvedType = item.type || (
        item.discipline?.toLowerCase().includes('danse') 
          ? 'danse' 
          : (item.discipline?.toLowerCase().includes('chant') || item.discipline?.toLowerCase().includes('toada') ? 'song' : 'percussion')
      );

      // Construction de l'objet setlist conforme (garantie stricte : aucune clé undefined)
      const setlistItem = {
        id: `revision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        titre: item.titre || 'Morceau à travailler',
        notes: (customNotes || '').trim(),
        type: resolvedType
      };

      if (item.itemId) {
        setlistItem.itemId = item.itemId;
      }
      if (item.requestCount && typeof item.requestCount === 'number') {
        setlistItem.requestCount = item.requestCount;
      }
      if (item.rawItem?.sequenceurUrl) {
        setlistItem.sequenceurUrl = item.rawItem.sequenceurUrl;
      }
      if (item.rawItem?.jsonUrl) {
        setlistItem.jsonUrl = item.rawItem.jsonUrl;
      }

      // Injection atomique via arrayUnion
      const eventRef = doc(db, 'events', selectedEventId);
      await updateDoc(eventRef, {
        setlist: arrayUnion(setlistItem)
      });

      const targetedEvent = rehearsals.find(r => r.id === selectedEventId);

      if (onSuccess) {
        onSuccess(setlistItem, targetedEvent);
      }
      onClose();
    } catch (err) {
      console.error("Erreur lors de la programmation en répétition :", err);
      setErrorMsg("Erreur lors de l'enregistrement dans la répétition.");
    } finally {
      setSubmitting(false);
    }
  };

  // Libellé de discipline pour le badge
  const getDisciplineLabel = () => {
    if (item.type === 'danse' || item.discipline?.includes('Danse')) return { label: 'Danse', emoji: '💃' };
    if (item.type === 'song' || item.discipline?.includes('Chant')) return { label: 'Chant & Toada', emoji: '🗣️' };
    return { label: item.discipline || 'Percussion', emoji: '🥁' };
  };

  const disc = getDisciplineLabel();

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <CordelCard className="w-full max-w-lg p-6 flex flex-col gap-4 animate-scale-in bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716]">
        {/* En-tête */}
        <div className="border-b-2 border-dashed border-cordel-wood/30 pb-3 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
            <span>⚡</span>
            <span>Programmer en répétition</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-cordel-master-dark/50 hover:text-cordel-rouge font-black text-sm transition-colors cursor-pointer"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Récapitulatif du point chaud ciblé */}
        <div className="p-3 rounded bg-white border border-encre-noire/20 flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded bg-[var(--color-cordel-ocre,#c05621)]/15 text-[var(--color-cordel-ocre,#c05621)] border border-[var(--color-cordel-ocre,#c05621)]/30 flex items-center gap-1">
                <span>{disc.emoji}</span>
                <span>{disc.label}</span>
              </span>
              {item.requestCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[var(--color-cordel-vert,#2d6a4f)]/15 text-[var(--color-cordel-vert,#2d6a4f)] border border-[var(--color-cordel-vert,#2d6a4f)]/30 flex items-center gap-1">
                  <span>🙋</span>
                  <span>{item.requestCount} demande{item.requestCount > 1 ? 's' : ''} d'élèves</span>
                </span>
              )}
            </div>
            {item.pct !== undefined && (
              <span className="text-xs font-black px-2 py-0.5 rounded bg-[var(--color-cordel-rouge,#8b2a1a)]/10 text-[var(--color-cordel-rouge,#8b2a1a)]">
                {item.pct}% maîtrise
              </span>
            )}
          </div>
          <h4 className="font-extrabold text-sm md:text-base text-encre-noire">
            {item.titre}
          </h4>
        </div>

        {/* Message d'erreur éventuel */}
        {errorMsg && (
          <div className="p-2.5 rounded bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Sélection de la répétition */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              1. Choisir la répétition cible *
            </label>
            {loadingEvents ? (
              <div className="p-2 text-xs font-bold text-cordel-master-dark/60 animate-pulse bg-white border border-encre-noire/20 rounded">
                Recherche des répétitions à venir...
              </div>
            ) : rehearsals.length === 0 ? (
              <div className="p-3 text-xs font-bold text-[var(--color-cordel-ocre,#c05621)] bg-[var(--color-cordel-ocre,#c05621)]/10 border border-[var(--color-cordel-ocre,#c05621)]/30 rounded">
                ⚠️ Aucune répétition planifiée dans l'Agenda à compter d'aujourd'hui. Veuillez d'abord créer une répétition dans l'Agenda.
              </div>
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={submitting}
                className="w-full p-2.5 border-2 border-encre-noire rounded text-xs md:text-sm font-bold bg-white text-encre-noire cursor-pointer"
              >
                {rehearsals.map(rev => {
                  const evDate = rev.dateDebut || rev.date;
                  const formattedDate = evDate ? new Date(evDate).toLocaleDateString('fr-FR') : 'Date indéfinie';
                  return (
                    <option key={rev.id} value={rev.id}>
                      {formattedDate} — {rev.titre || rev.title || 'Répétition'}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Note d'intention éditable */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              2. Note d'intention pour le fil conducteur (modifiable)
            </label>
            <textarea
              rows="3"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              disabled={submitting}
              placeholder="Ex: Travailler le calage rythmique et le pont vers le chant..."
              className="w-full p-2.5 border-2 border-encre-noire/40 rounded text-xs font-medium bg-white text-encre-noire focus:border-encre-noire"
            />
            <span className="text-[9px] text-encre-noire/60 italic">
              Cette note apparaîtra directement dans l'onglet « Fil conducteur » de l'événement.
            </span>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-dashed border-cordel-wood/20">
            <CordelButton 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="primary"
              disabled={submitting || rehearsals.length === 0 || !selectedEventId}
              className="text-xs flex items-center gap-1.5"
            >
              <span>{submitting ? '⏳ Enregistrement...' : '⚡ Valider et injecter'}</span>
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
