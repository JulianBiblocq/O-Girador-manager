import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

export default function DocumentUploadForm({ groupId, varalCategories = [], onClose, documentToEdit }) {
  const { t } = useTranslation();
  const isEditMode = !!documentToEdit;
  const [title, setTitle] = useState(documentToEdit ? documentToEdit.titre : '');
  const [category, setCategory] = useState(() => {
    if (!documentToEdit) {
      return varalCategories && varalCategories.length > 0 ? varalCategories[0].id : 'Partitions';
    }
    const catId = documentToEdit.categoryId || documentToEdit.categorie;
    const match = varalCategories.find(c => c.id === catId || c.nom === catId);
    return match ? match.id : (catId || 'Partitions');
  });
  const [sousCategorie, setSousCategorie] = useState(documentToEdit && documentToEdit.sousCategorie ? documentToEdit.sousCategorie : 'Comptes Rendus');
  const [annee, setAnnee] = useState(documentToEdit ? documentToEdit.annee : new Date().getFullYear());
  const [file, setFile] = useState(null);
  const [type, setType] = useState(documentToEdit ? (documentToEdit.type || 'pdf') : 'pdf');
  const [externalUrl, setExternalUrl] = useState(documentToEdit ? documentToEdit.fileUrl : '');
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
    if (!groupId || !title) return;

    if (isEditMode) {
      setIsUploading(true);
      try {
        const categoryObj = varalCategories.find(c => c.id === category);
        const categoryName = categoryObj ? categoryObj.nom : category;

        const docRef = doc(db, 'documents', documentToEdit.id);
        await updateDoc(docRef, {
          titre: title,
          categoryId: category,
          categorie: categoryName,
          sousCategorie: category === 'Administratif' ? sousCategorie : '',
          annee: parseInt(annee, 10) || new Date().getFullYear(),
        });

        console.log("DocumentUploadForm - Document mis a jour avec succes !");
        onClose();
      } catch (error) {
        console.error("DocumentUploadForm - Erreur d'update :", error);
        alert(t('common.saveError'));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    const isLinkType = type === 'video' || type === 'web';
    if (!isLinkType && !file) {
      alert("Veuillez sélectionner un fichier.");
      return;
    }
    if (isLinkType && !externalUrl) {
      alert("Veuillez entrer une URL.");
      return;
    }

    // Audio file size limit (15MB)
    if (!isLinkType && type === 'audio' && file.size > 15 * 1024 * 1024) {
      alert(t('documents.audioSizeError') || "Le fichier audio est trop volumineux (max 15 Mo).");
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = '';

      if (isLinkType) {
        finalUrl = externalUrl;
      } else {
        // 1. Upload the file to Firebase Storage
        const storagePath = `documents/${groupId}/${Date.now()}_${file.name}`;
        const fileRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(fileRef, file);
        
        // 2. Retrieve download URL
        finalUrl = await getDownloadURL(snapshot.ref);
      }

      // 3. Write metadata document to Firestore
      const categoryObj = varalCategories.find(c => c.id === category);
      const categoryName = categoryObj ? categoryObj.nom : category;

      await addDoc(collection(db, 'documents'), {
        titre: title,
        categoryId: category,
        categorie: categoryName,
        sousCategorie: category === 'Administratif' ? sousCategorie : '',
        annee: parseInt(annee, 10) || new Date().getFullYear(),
        fileUrl: finalUrl,
        type: type,
        groupId: groupId,
        dateAjout: new Date().toISOString(),
        order: 9999
      });

      console.log("DocumentUploadForm - Document mis en ligne avec succès !");
      onClose();
    } catch (error) {
      console.error("DocumentUploadForm - Erreur d'upload :", error);
      alert(t('common.saveError'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood">
        {isEditMode ? (t('documents.editDocTitle') || "Modifier le document") : t('documents.addDocTitle')}
      </h4>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('documents.docTitleLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isUploading}
            placeholder={t('documents.docTitlePlaceholder')}
            className="theme-input w-full disabled:opacity-50"
          />
        </div>

        {/* Resource Type Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('documents.typeLabel') || "Type de ressource"}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            disabled={isUploading || isEditMode}
            className="theme-input w-full disabled:opacity-50"
          >
            <option value="pdf">{t('documents.typePdf') || "Document PDF"}</option>
            <option value="audio">{t('documents.typeAudio') || "Fichier Audio (max 15 Mo)"}</option>
            <option value="image">{t('documents.typeImage') || "Image / Photo"}</option>
            <option value="video">{t('documents.typeVideo') || "Vidéo (Lien externe)"}</option>
            <option value="web">{t('documents.typeWeb') || "Lien Web (Externe)"}</option>
          </select>
        </div>

        {/* Category Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('documents.categoryLabel')}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={isUploading}
            className="theme-input w-full disabled:opacity-50"
          >
            {varalCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {t(`documents.${cat.nom}`) || cat.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory (Only for Administratif) */}
        {category === 'Administratif' && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('documents.subcategoryLabel')}
            </label>
            <select
              value={sousCategorie}
              onChange={(e) => setSousCategorie(e.target.value)}
              required
              disabled={isUploading}
              className="theme-input w-full disabled:opacity-50"
            >
              <option value="Comptes Rendus">{t('documents.Comptes Rendus')}</option>
              <option value="Statuts & Assurances">{t('documents.Statuts & Assurances')}</option>
              <option value="Inscriptions">{t('documents.Inscriptions')}</option>
            </select>
          </div>
        )}

        {/* Document Year */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('documents.yearLabel')}
          </label>
          <input
            type="number"
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
            required
            disabled={isUploading}
            min="1900"
            max="2100"
            placeholder={t('documents.yearPlaceholder')}
            className="theme-input w-full disabled:opacity-50 text-xs font-bold"
          />
        </div>

        {/* Dynamic Input based on Resource Type */}
        {!isEditMode && (
          (type === 'pdf' || type === 'audio' || type === 'image') ? (
            /* File Picker */
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('documents.fileLabel') || "Fichier"}
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                required
                disabled={isUploading}
                accept={type === 'pdf' ? 'application/pdf' : type === 'audio' ? 'audio/*' : 'image/*'}
                className="theme-input w-full disabled:opacity-50 text-xs py-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
              />
            </div>
          ) : (
            /* External URL Input */
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('documents.externalUrlLabel') || "URL Externe"}
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required
                disabled={isUploading}
                placeholder={t('documents.externalUrlPlaceholder') || "https://..."}
                className="theme-input w-full disabled:opacity-50 text-xs"
              />
            </div>
          )
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-2">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={onClose} 
            disabled={isUploading}
            className="text-xs px-4 py-2"
          >
            {t('common.cancel')}
          </CordelButton>
          <CordelButton 
            type="submit"
            variant="ocre" 
            useExtremeBorder={true}
            disabled={isUploading}
            className="text-xs px-4 py-2"
          >
            {isUploading ? t('documents.uploadingMsg') : (t('common.confirm') || "Valider")}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
