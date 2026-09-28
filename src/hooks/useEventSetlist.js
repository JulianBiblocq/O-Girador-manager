import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export function useEventSetlist(event) {
  const [setlist, setSetlist] = useState(event.setlist || []);
  const [newMorceauTitre, setNewMorceauTitre] = useState('');
  const [selectedCatalogRhythmUrl, setSelectedCatalogRhythmUrl] = useState('');
  const [newMorceauJsonFile, setNewMorceauJsonFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [newMorceauNotes, setNewMorceauNotes] = useState('');
  const [updatingSetlist, setUpdatingSetlist] = useState(false);

  useEffect(() => {
    setSetlist(event.setlist || []);
  }, [event.id, event.setlist]);

  const handleAddMorceau = async (e) => {
    if (e) e.preventDefault();
    if (!newMorceauTitre.trim()) return;

    setUpdatingSetlist(true);
    try {
      let jsonUrl = '';
      if (newMorceauJsonFile) {
        const fileRef = ref(storage, `documents/${event.groupId}/events/${event.id}/setlist/${Date.now()}_${newMorceauJsonFile.name}`);
        const snapshot = await uploadBytes(fileRef, newMorceauJsonFile);
        jsonUrl = await getDownloadURL(snapshot.ref);
      } else if (selectedCatalogRhythmUrl) {
        jsonUrl = selectedCatalogRhythmUrl;
      }

      const updatedSetlist = [
        ...setlist,
        {
          id: `morceau_${Date.now()}`,
          titre: newMorceauTitre.trim(),
          notes: newMorceauNotes.trim(),
          jsonUrl: jsonUrl
        }
      ];

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });

      setSetlist(updatedSetlist);
      setNewMorceauTitre('');
      setSelectedCatalogRhythmUrl('');
      setNewMorceauNotes('');
      setNewMorceauJsonFile(null);
      setFileInputKey(prev => prev + 1);
    } catch (err) {
      console.error("EventDetails - Erreur handleAddMorceau :", err);
      alert("Erreur lors de l'ajout du morceau.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleRemoveMorceau = async (morceauId) => {
    setUpdatingSetlist(true);
    try {
      const updatedSetlist = setlist.filter(m => (m.id || m.pieceId) !== morceauId && m.pieceId !== morceauId);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });
      setSetlist(updatedSetlist);
    } catch (err) {
      console.error("EventDetails - Erreur handleRemoveMorceau :", err);
      alert("Erreur lors de la suppression.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleAddDancadorChoreo = async (choreoId) => {
    if (!choreoId) return;
    setUpdatingSetlist(true);
    try {
      const currentChoreos = event.dancadorChoreoIds || [];
      if (!currentChoreos.includes(choreoId)) {
        const updatedChoreos = [...currentChoreos, choreoId];
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
          dancadorChoreoIds: updatedChoreos
        });
      }
    } catch (err) {
      console.error("EventDetails - Erreur handleAddDancadorChoreo :", err);
      alert("Erreur lors de l'ajout de la chorégraphie.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleRemoveDancadorChoreo = async (choreoId) => {
    if (!choreoId) return;
    setUpdatingSetlist(true);
    try {
      const currentChoreos = event.dancadorChoreoIds || [];
      const updatedChoreos = currentChoreos.filter(id => id !== choreoId);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        dancadorChoreoIds: updatedChoreos
      });
    } catch (err) {
      console.error("EventDetails - Erreur handleRemoveDancadorChoreo :", err);
      alert("Erreur lors de la suppression de la chorégraphie.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleAddRepertoirePiece = async (piece, customNotes = '') => {
    if (!piece || !event?.id) return;
    setUpdatingSetlist(true);
    try {
      const newItem = {
        id: piece.id || `morceau_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        pieceId: piece.id || piece.pieceId,
        repertoireId: piece.id || piece.repertoireId || null,
        titre: (piece.titre || 'Morceau sans titre').trim(),
        notes: (customNotes || piece.notes || '').trim(),
        sequenceurId: piece.sequenceurId || null,
        sequenceurType: piece.sequenceurType || null,
        sequenceurFileUrl: piece.sequenceurFileUrl || piece.jsonUrl || null,
        jsonUrl: piece.sequenceurFileUrl || piece.jsonUrl || null,
        audioUrl: piece.audioUrl || null,
        toadaDocId: piece.toadaDocId || null,
        cultureDocId: piece.cultureDocId || (Array.isArray(piece.cultureDocIds) && piece.cultureDocIds.length > 0 ? piece.cultureDocIds[0] : null) || null,
        cultureDocIds: Array.isArray(piece.cultureDocIds) ? piece.cultureDocIds : (piece.cultureDocId ? [piece.cultureDocId] : []),
        dancadorChoreoId: piece.dancadorChoreoId || null,
        videos: Array.isArray(piece.videos) ? piece.videos : [],
        signalIds: Array.isArray(piece.signalIds) ? piece.signalIds : []
      };

      const updatedSetlist = [...setlist, newItem];
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });
      setSetlist(updatedSetlist);
    } catch (err) {
      console.error("useEventSetlist - Erreur handleAddRepertoirePiece :", err);
      alert("Erreur lors de l'ajout du morceau du répertoire.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  return {
    setlist,
    setSetlist,
    newMorceauTitre,
    setNewMorceauTitre,
    selectedCatalogRhythmUrl,
    setSelectedCatalogRhythmUrl,
    newMorceauJsonFile,
    setNewMorceauJsonFile,
    fileInputKey,
    setFileInputKey,
    newMorceauNotes,
    setNewMorceauNotes,
    updatingSetlist,
    handleAddMorceau,
    handleAddRepertoirePiece,
    handleRemoveMorceau,
    handleAddDancadorChoreo,
    handleRemoveDancadorChoreo,
    dancadorChoreoIds: event.dancadorChoreoIds || []
  };
}
