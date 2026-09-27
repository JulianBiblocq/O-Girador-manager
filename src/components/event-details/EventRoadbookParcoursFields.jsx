import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

/**
 * Sous-composant pour le tracé et les étapes de déambulation.
 */
export default function EventRoadbookParcoursFields({ parcours = {}, onChange, groupId, disabled = false }) {
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handleUploadParcoursFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !groupId) return;
    setUploadingPdf(true);
    try {
      const storagePath = `documents/${groupId}/events/parcours_${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onChange('urlFichierParcours', downloadURL);
    } catch (err) {
      console.error("Erreur téléversement tracé parcours :", err);
      alert("Erreur lors du téléversement du tracé.");
    } finally {
      setUploadingPdf(false);
    }
  };

  return (
    <div className="p-2.5 bg-white/70 dark:bg-stone-800/70 rounded border border-encre-noire/10 flex flex-col gap-2">
      <span className="text-[9px] font-black uppercase text-cordel-wood">🗺️ Parcours &amp; Tracé</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Point de départ (ex: Place de la Mairie)"
          value={parcours.pointDepart || ''}
          onChange={(e) => onChange('pointDepart', e.target.value)}
          disabled={disabled}
          className="theme-input text-[9px] py-1 px-1.5"
        />
        <input
          type="text"
          placeholder="Point d'arrivée (ex: Parc municipal)"
          value={parcours.pointArrivee || ''}
          onChange={(e) => onChange('pointArrivee', e.target.value)}
          disabled={disabled}
          className="theme-input text-[9px] py-1 px-1.5"
        />
      </div>
      <textarea
        rows={2}
        placeholder="Itinéraire / Rues empruntées / Étapes..."
        value={parcours.itineraire || ''}
        onChange={(e) => onChange('itineraire', e.target.value)}
        disabled={disabled}
        className="theme-input text-[9px] py-1 px-1.5"
      />
      <input
        type="text"
        placeholder="Ravitaillement eau / pauses"
        value={parcours.ravitaillementEau || ''}
        onChange={(e) => onChange('ravitaillementEau', e.target.value)}
        disabled={disabled}
        className="theme-input text-[9px] py-1 px-1.5"
      />
      <div className="flex items-center gap-2">
        <input
          type="url"
          placeholder="Lien du plan (PDF/Image) ou uploader"
          value={parcours.urlFichierParcours || ''}
          onChange={(e) => onChange('urlFichierParcours', e.target.value)}
          disabled={disabled}
          className="theme-input text-[9px] py-1 px-1.5 flex-1"
        />
        <label className="text-[8px] font-black uppercase px-2 py-1.5 rounded bg-cordel-wood text-white cursor-pointer hover:brightness-110 shrink-0 select-none">
          {uploadingPdf ? '⏳...' : '📎 Plan'}
          <input type="file" accept=".pdf,image/*" onChange={handleUploadParcoursFile} disabled={disabled || uploadingPdf} className="hidden" />
        </label>
      </div>
    </div>
  );
}
