import React, { useState } from 'react';
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';

/**
 * WorkshopEditorModal Component
 * Modal form for creating and editing Atelier Couture tutorials with rich media:
 * title, short description, cost, material list, step-by-step instructions, video URL,
 * and multiple image & PDF file uploads to Firebase Storage under `workshops_media/`.
 */
export default function WorkshopEditorModal({ groupId, workshop, onClose, onSaved }) {
  const { t } = useTranslation();
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
      alert(t('mestre.repertoire.alertSelectImageFile'));
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
      alert(t('mestre.repertoire.alertUploadImageError'));
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
      alert(t('mestre.repertoire.alertSelectPdfFile'));
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
      alert(t('mestre.repertoire.alertUploadPdfError'));
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
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-xs select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-cordel-bg border-2 border-cordel-master-dark/40 shadow-2xl overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex justify-between items-start bg-cordel-bg">
          <div>
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase tracking-wider mb-1 inline-block">
              {t('mestre.repertoire.workshopEditorTitle')}
            </span>
            <h3 className="font-heading font-black text-lg text-encre-noire tracking-wide">
              {workshop ? "Modifier le Tutoriel" : "+ Créer un Tutoriel Multimédia"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer p-1"
            title={t('mestre.repertoire.closeEscapeTitle')}
          >
            <XiloClose size={20} />
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-xs font-bold rounded">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Title & Cost */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  {t('mestre.repertoire.workshopTitleLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="titre"
                  value={formData.titre}
                  onChange={handleChange}
                  required
                  placeholder={t('mestre.repertoire.workshopTitlePlaceholder')}
                  className="theme-input font-bold text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  {t('mestre.repertoire.estimatedCostLabel')}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  placeholder={t('mestre.repertoire.costPlaceholder')}
                  className="theme-input font-bold text-xs"
                />
              </div>
            </div>

            {/* Description & Visibility Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  {t('mestre.repertoire.shortDescLabel')}
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder={t('mestre.repertoire.shortDescPlaceholder')}
                  className="theme-input font-bold text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  {t('mestre.repertoire.publicationStatusLabel')}
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleChange}
                    className="w-4 h-4 accent-cordel-wood cursor-pointer"
                  />
                  <span>{formData.isPublished ? "✅ Publié" : "🔒 Brouillon"}</span>
                </label>
              </div>
            </div>

            {/* Material List */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                {t('mestre.repertoire.materialsAndSuppliesLabel')}
              </label>
              <textarea
                rows={3}
                name="materiel"
                value={formData.materiel}
                onChange={handleChange}
                placeholder={t('mestre.repertoire.materialsPlaceholder')}
                className="theme-input text-xs resize-none"
              />
            </div>

            {/* Step-by-Step Content instructions */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                {t('mestre.repertoire.instructionsAndStepsLabel')}
              </label>
              <textarea
                rows={6}
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder={t('mestre.repertoire.stepsInstructionsPlaceholder')}
                className="theme-input text-xs font-mono resize-none"
              />
            </div>

            {/* Video Tutorial URL */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                {t('mestre.repertoire.tutorialVideoLinkLabel')}
              </label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="theme-input font-bold text-xs"
              />
            </div>

            {/* Image Gallery Uploads */}
            <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 rounded">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  {t('mestre.repertoire.galleryPhotosPrefix')}{formData.images.length})
                </label>
                <label className="cursor-pointer bg-cordel-wood text-white px-2.5 py-1 rounded text-[10px] font-bold hover:opacity-90">
                  {uploadingImage ? "Envoi en cours..." : "+ Ajouter des images"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group border border-cordel-master-dark/20 rounded overflow-hidden bg-white">
                      <img src={img.url} alt={img.name} className="w-full h-20 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs font-extrabold flex items-center justify-center cursor-pointer shadow-xs hover:bg-red-800"
                        title={t('mestre.repertoire.deletePhotoTitle')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Patron / Document Uploads */}
            <div className="flex flex-col gap-2 p-3 bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 rounded">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-extrabold text-cordel-wood">
                  {t('mestre.repertoire.sewingPatternsPdfPrefix')}{formData.pdfFiles.length})
                </label>
                <label className="cursor-pointer bg-cordel-wood text-white px-2.5 py-1 rounded text-[10px] font-bold hover:opacity-90">
                  {uploadingPdf ? "Envoi en cours..." : "+ Ajouter des PDF"}
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleUploadPdf}
                    disabled={uploadingPdf}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.pdfFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  {formData.pdfFiles.map((pdf, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/60 p-2 rounded border border-dashed border-cordel-master-dark/20">
                      <span className="text-xs font-bold text-encre-noire truncate flex items-center gap-1.5">
                        📄 {pdf.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePdf(idx)}
                        className="text-red-700 hover:text-red-900 font-extrabold text-xs px-1.5 py-0.5"
                        title={t('mestre.repertoire.deleteDocumentTitle')}
                      >
                        {t('mestre.repertoire.btnDeleteWithIcon')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 3. Footer / Modal Actions (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex justify-end gap-2.5 bg-cordel-bg">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={saving}
              className="py-2 px-4 text-xs font-bold uppercase"
            >
              {t('common.cancel')}
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
      </div>
    </div>
  );
}
