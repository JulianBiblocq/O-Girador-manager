import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function MestrePedagogyNotepad({ groupId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [pushing, setPushing] = useState(false);

  useEffect(() => {
    if (!groupId) return;

    const q = collection(db, 'associations', groupId, 'blocNotes');
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedNotes = [];
      snap.forEach(d => {
        fetchedNotes.push({ id: d.id, ...d.data() });
      });
      // Sort by date (newest first)
      fetchedNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotes(fetchedNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const toggleNote = (noteId) => {
    const newSet = new Set(selectedNotes);
    if (newSet.has(noteId)) {
      newSet.delete(noteId);
    } else {
      newSet.add(noteId);
    }
    setSelectedNotes(newSet);
  };

  const handleOpenProgramModal = async () => {
    if (selectedNotes.size === 0) return;
    setIsModalOpen(true);
    
    // Fetch future events
    const today = new Date().toISOString().split('T')[0];
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef); // Can't easily complex query without index, so fetch all active for group
    // Actually we can just fetch all events for the group
    // Let's just fetch all events and filter client side
    const snap = await getDocs(q);
    const fetchedEvents = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.groupId === groupId && data.date >= today) {
        fetchedEvents.push({ id: d.id, ...data });
      }
    });
    fetchedEvents.sort((a, b) => a.date.localeCompare(b.date));
    setEvents(fetchedEvents);
    if (fetchedEvents.length > 0) setSelectedEventId(fetchedEvents[0].id);
  };

  const handlePushToEvent = async () => {
    if (!selectedEventId || selectedNotes.size === 0) return;
    setPushing(true);
    try {
      const eventRef = doc(db, 'events', selectedEventId);
      
      const newItems = Array.from(selectedNotes).map(noteId => {
        const note = notes.find(n => n.id === noteId);
        return {
          id: `revision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          titre: note.titre || '🛠️ À travailler',
          notes: note.contenu
        };
      });

      // Push to setlist (assuming setlist is an array of objects)
      // The event schema uses 'setlist' as an array
      // If it doesn't exist, arrayUnion handles it? Firebase arrayUnion requires the field to exist or creates it.
      // Wait, we need to push multiple objects
      for (const item of newItems) {
        await updateDoc(eventRef, {
          setlist: arrayUnion(item)
        });
      }

      // Delete the notes from the notepad
      for (const noteId of selectedNotes) {
        const noteRef = doc(db, 'associations', groupId, 'blocNotes', noteId);
        await deleteDoc(noteRef);
      }

      setSelectedNotes(new Set());
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout à l'agenda", err);
    } finally {
      setPushing(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const noteRef = doc(db, 'associations', groupId, 'blocNotes', noteId);
      await deleteDoc(noteRef);
      const newSet = new Set(selectedNotes);
      newSet.delete(noteId);
      setSelectedNotes(newSet);
    } catch (e) {
      console.error("Erreur suppression note", e);
    }
  };

  return (
    <CordelCard variant="default" className="flex flex-col h-full bg-[#fdfaf2] border-2 border-encre-noire relative overflow-hidden">
      <div className="bg-cordel-wood text-[#fdfaf2] p-4 text-center border-b-2 border-encre-noire">
        <h3 className="font-cactus text-2xl tracking-widest uppercase">
          📌 Bloc-Notes
        </h3>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">
          À Travailler en Répétition
        </p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3 min-h-[300px]">
        {loading ? (
          <div className="text-center opacity-50 font-black text-xs animate-pulse p-4">Chargement...</div>
        ) : notes.length === 0 ? (
          <div className="text-center opacity-50 font-medium text-xs p-4 flex flex-col items-center gap-2">
            <span className="text-2xl">🌱</span>
            Aucun point épinglé.
          </div>
        ) : (
          notes.map(note => (
            <div 
              key={note.id} 
              className={`p-3 border-2 border-dashed rounded relative transition-all ${
                selectedNotes.has(note.id) 
                  ? 'border-cordel-vert bg-cordel-vert/10' 
                  : 'border-cordel-master-dark/30 hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  checked={selectedNotes.has(note.id)}
                  onChange={() => toggleNote(note.id)}
                  className="mt-1 cursor-pointer"
                />
                <div className="flex-1 flex flex-col gap-1 cursor-pointer" onClick={() => toggleNote(note.id)}>
                  <h4 className="text-xs font-black uppercase text-encre-noire">{note.titre}</h4>
                  <p className="text-[11px] font-medium leading-snug text-encre-noire/80">{note.contenu}</p>
                  <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark/40 mt-1">
                    Épinglé par {note.createdBy}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                  className="text-cordel-master-dark/40 hover:text-cordel-rouge transition-colors"
                  title="Supprimer cette note"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {notes.length > 0 && (
        <div className="p-4 border-t-2 border-encre-noire/10 bg-white">
          <CordelButton 
            variant="primary" 
            onClick={handleOpenProgramModal}
            disabled={selectedNotes.size === 0}
            className="w-full text-xs"
          >
            📅 Programmer ({selectedNotes.size})
          </CordelButton>
        </div>
      )}

      {/* Modal Programmation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <CordelCard className="w-full max-w-md p-6 flex flex-col gap-4 animate-scale-in">
            <h3 className="text-lg font-black uppercase tracking-widest text-cordel-wood border-b-2 border-dashed border-cordel-wood/30 pb-2">
              📅 Ajouter à un événement
            </h3>
            
            <p className="text-xs font-medium text-encre-noire/80">
              Les {selectedNotes.size} notes sélectionnées seront ajoutées au programme de révision de l'événement choisi.
            </p>

            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full p-2 border-2 border-encre-noire rounded text-sm font-bold bg-[#fdfaf2]"
            >
              <option value="" disabled>-- Choisir un événement --</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {new Date(ev.date).toLocaleDateString('fr-FR')} - {ev.title}
                </option>
              ))}
            </select>

            <div className="flex gap-2 justify-end mt-4">
              <CordelButton variant="secondary" onClick={() => setIsModalOpen(false)}>
                Annuler
              </CordelButton>
              <CordelButton 
                variant="primary" 
                onClick={handlePushToEvent}
                disabled={pushing || !selectedEventId}
              >
                {pushing ? 'Ajout...' : 'Valider'}
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      )}
    </CordelCard>
  );
}
