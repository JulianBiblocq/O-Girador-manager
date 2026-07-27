import React, { useState } from 'react';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';

/**
 * WorkshopEditorModal Component
 * Modal form for creating and editing Atelier Couture tutorials with rich media:
 * title, short description, cost, material list, step-by-step instructions, video URL,
 * and multiple image & PDF file uploads to Firebase Storage under `workshops_media/`.
 */
export default function WorkshopEditorModal({ groupId, workshop, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    titre: workshop?.titre || '',
    description: workshop?.description || '',
    cost: workshop?.cost !== undefined ? String(workshop.cost) : '',
    isPublished: workshop?.isPublished !== false,
    materiel: workshop?.materiel || '',
    content: workshop?.content || '',
    videoUrl: workshop?.videoUrl || '',
    images: workshop?.images || [],
    pdfFiles: workshop?.pdfFiles || []
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Upload image/patron file to Firebase Storage under `workshops_media/{groupId}/{workshopId}/`
  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image (JPG, PNG, WebP).");
      return;
    }

    setUploadingImage(true);
    try {
      const folderId = workshop?.id || 'temp_' + Date.now();
      const storageRef = ref(storage, `workshops_media/${groupId || 'global'}/${folderId}/images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, { name: file.name, url: downloadURL }]
      }));
    } catch (err) {
      console.error("WorkshopEditorModal - Image upload error:", err);
      alert("Erreur lors du téléversement de l'image.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Upload PDF document file to Firebase Storage under `workshops_media/{groupId}/{workshopId}/`
  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert("Veuillez sélectionner un fichier au format PDF.");
      return;
    }

    setUploadingPdf(true);
    try {
      const folderId = workshop?.id || 'temp_' + Date.now();
      const storageRef = ref(storage, `workshops_media/${groupId || 'global'}/${folderId}/pdfs/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData(prev => ({
        ...prev,
        pdfFiles: [...prev.pdfFiles, { name: file.name, url: downloadURL }]
      }));
    } catch (err) {
      console.error("WorkshopEditorModal - PDF upload error:", err);
      alert("Erreur lors du téléversement du document PDF.");
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleRemovePdf = (index) => {
    setFormData(prev => ({
      ...prev,
      pdfFiles: prev.pdfFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) {
      setErrorMsg("Veuillez saisir un titre pour le tutoriel.");
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        groupId: groupId || '',
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        cost: parseFloat(formData.cost) || 0,
        isPublished: Boolean(formData.isPublished),
        materiel: formData.materiel.trim(),
        content: formData.content.trim(),
        videoUrl: formData.videoUrl.trim(),
        images: formData.images,
        pdfFiles: formData.pdfFiles,
        updatedAt: new Date().toISOString()
      };

      if (workshop?.id) {
        await updateDoc(doc(db, 'workshops', workshop.id), payload);
      } else {
        payload.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'workshops'), payload);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("WorkshopEditorModal - Submit error:", err);
      setErrorMsg("Erreur d'enregistrement : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CordelCard variant="default" useExtremeBorder={true} className="p-6 flex flex-col gap-4 text-left bg-cordel-bg shadow-2xl">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-3">
            <div>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase tracking-wider mb-1 inline-block">
                🧵 Éditeur de Tutoriel Atelier Couture
              </span>
              <h3 className="font-cactus font-black text-lg text-encre-noire tracking-wide">
                {workshop ? "Modifier le Tutoriel" : "+ Créer un Tutoriel Multimédia"}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer p-1"
            >
              <XiloClose size={20} />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-bold rounded">
              ⚠️ {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
            {/* Title & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  Titre du Tutoriel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  required
                  placeholder="ex: Tutoriel : Bracelets de Maracatu"
                  className="theme-input font-bold text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  Coût estimé (€)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder="ex: 15.00"
                  className="theme-input font-bold text-xs"
                />
              </div>
            </div>

            {/* Description & Visibility Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  Description courte / Résumé
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="ex: Fiche de confection complète des bracelets dorés et rubans"
                  className="theme-input font-bold text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  Statut de publication
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="w-4 h-4 accent-cordel-wood cursor-pointer"
                  />
                  <span>{formData.isPublished ? "✅ Publié (Visible par tous)" : "🔒 Brouillon (Mestre uniquement)"}</span>
                </label>
              </div>
            </div>

            {/* Material List */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-cordel-wood flex items-center gap-1">
                🧵 Liste du Matériel Nécessaire
              </label>
              <textarea
                name="materiel"
                value={formData.materiel}
                onChange={handleChange}
                rows={3}
                placeholder={"- Tissu satiné doré\n- Élastique 2 cm de large\n- Fil à coudre assorti\n- Rubans et miroirs décoratifs"}
                className="theme-input text-xs font-semibold leading-relaxed"
              />
            </div>

            {/* Step by Step Instructions */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-cordel-wood flex items-center gap-1">
                📜 Étapes de Fabrication pas à pas
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={6}
                placeholder={"1. Mesurez votre tour de poignet...\n2. Coupez une bande de tissu...\n3. Assembler et coudre..."}
                className="theme-input text-xs font-semibold leading-relaxed"
              />
            </div>

            {/* Video Link */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-cordel-wood flex items-center gap-1">
                🎬 Lien Vidéo (YouTube / Vimeo)
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                className="theme-input font-bold text-xs"
              />
              <span className="text-[8px] text-cordel-master-dark opacity-70 italic">
                La vidéo sera automatiquement intégrée sous forme de lecteur embarqué (iframe responsive) dans la fiche livret.
              </span>
            </div>

            {/* Patrons & Images Upload Module */}
            <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood flex items-center gap-1">
                  🎨 Patrons & Images de démonstration
                </label>
                <label className="cursor-pointer text-[9px] font-black uppercase bg-cordel-wood text-white px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716] hover:opacity-90 transition-opacity">
                  {uploadingImage ? "⏳ Téléversement..." : "+ Ajouter une image"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.images.length === 0 ? (
                <span className="text-[9px] italic opacity-60">Aucun visuel ni patron image ajouté pour le moment.</span>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group border-2 border-encre-noire rounded overflow-hidden bg-white h-20 shadow-sm">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-800"
                        title="Supprimer cette image"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Documents Upload Module */}
            <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood flex items-center gap-1">
                  📄 Documents joints (Fichiers PDF / Patrons imprimables)
                </label>
                <label className="cursor-pointer text-[9px] font-black uppercase bg-cordel-wood text-white px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716] hover:opacity-90 transition-opacity">
                  {uploadingPdf ? "⏳ Téléversement..." : "+ Ajouter un PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleUploadPdf}
                    disabled={uploadingPdf}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.pdfFiles.length === 0 ? (
                <span className="text-[9px] italic opacity-60">Aucun document PDF joint.</span>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {formData.pdfFiles.map((pdf, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/60 p-2 rounded border border-dashed border-cordel-master-dark/20">
                      <span className="text-xs font-bold text-encre-noire truncate flex items-center gap-1.5">
                        📄 {pdf.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePdf(idx)}
                        className="text-red-700 hover:text-red-900 font-extrabold text-xs px-1.5 py-0.5"
                        title="Supprimer ce document"
                      >
                        ✕ Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t-2 border-dashed border-cordel-master-dark/20 mt-2">
              <CordelButton
                type="button"
                variant="default"
                onClick={onClose}
                disabled={saving}
                className="py-2 px-4 text-xs font-bold uppercase"
              >
                Annuler
              </CordelButton>
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving}
                className="py-2 px-5 text-xs font-black uppercase tracking-wider"
              >
                {saving ? "Enregistrement..." : (workshop ? "Enregistrer les modifications" : "Publier le Tutoriel")}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
