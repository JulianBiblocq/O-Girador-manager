import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function DocumentUploadForm({ groupId, onClose }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Partitions');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto fill title with file name (without extension) if title is empty
      if (!title) {
        const nameWithoutExt = e.target.files[0].name.substring(0, e.target.files[0].name.lastIndexOf('.')) || e.target.files[0].name;
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId || !file || !title) return;

    setIsUploading(true);
    try {
      // 1. Upload the file to Firebase Storage
      const storagePath = `documents/${groupId}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      
      // 2. Retrieve download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // 3. Write metadata document to Firestore
      await addDoc(collection(db, 'documents'), {
        titre: title,
        categorie: category,
        fileUrl: downloadUrl,
        groupId: groupId,
        dateAjout: new Date().toISOString()
      });

      console.log("DocumentUploadForm - Document mis en ligne avec succès !");
      onClose();
    } catch (error) {
      console.error("DocumentUploadForm - Erreur d'upload :", error);
      alert("Erreur lors de la mise en ligne du fichier. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood">
        Ajouter un document
      </h4>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Titre du document
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isUploading}
            placeholder="Ex : Paroles Samba, Compte rendu AG"
            className="theme-input w-full disabled:opacity-50"
          />
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Catégorie
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={isUploading}
            className="theme-input w-full disabled:opacity-50"
          >
            <option value="Partitions">Partitions (Ocre)</option>
            <option value="Tutoriels">Tutoriels (Vert)</option>
            <option value="Administratif">Administratif (Bleu)</option>
            <option value="Comptes Rendus">Comptes Rendus (Kraft)</option>
          </select>
        </div>

        {/* File Picker */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Fichier (PDF, Image, etc.)
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            required
            disabled={isUploading}
            className="theme-input w-full disabled:opacity-50 text-xs py-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-2">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={onClose} 
            disabled={isUploading}
            className="text-xs px-4 py-2"
          >
            Annuler
          </CordelButton>
          <CordelButton 
            type="submit"
            variant="ocre" 
            useExtremeBorder={true}
            disabled={isUploading}
            className="text-xs px-4 py-2"
          >
            {isUploading ? "Envoi en cours..." : "Valider"}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
