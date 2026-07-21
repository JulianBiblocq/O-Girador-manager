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
      const updatedSetlist = setlist.filter(m => m.id !== morceauId);
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
    handleRemoveMorceau
  };
}
