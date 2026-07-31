import React, { useState } from 'react';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import RichTextEditor from '../RichTextEditor';

// Formules d'adhésion par défaut si la liste est initialement vide
const DEFAULT_FORMULES = [
  {
    id: 'percussion',
    titre: 'Formule Percussion',
    icone: '🥁',
    description: 'Ateliers hebdomadaires de percussion maracatu (Alfaia, Caixa, Gonguê, Agbê, Mineiro).',
    tarif: 'Adhésion annuelle',
    avantages: ['Prêt des instruments inclus', 'Accès aux répétitions & prestations', 'Apprentissage des rythmes et de la technique']
  },
  {
    id: 'danse',
    titre: 'Formule Danse & Chant',
    icone: '💃',
    description: 'Ateliers de danse traditionnelle brésilienne, expression scénique et chant polyphonique.',
    tarif: 'Adhésion annuelle',
    avantages: ['Développement corporel & chorégraphies', 'Accès aux costumes et sorties scéniques', 'Ouvert à tous niveaux']
  },
  {
    id: 'complete',
    titre: 'Formule Complète',
    icone: '✨',
    description: 'Accès illimité à l\'ensemble des ateliers de percussion, de danse, de chant et aux stages.',
    tarif: 'Tarif préférentiel',
    avantages: ['Accès à tous les ateliers de la semaine', 'Participation prioritaire aux stages', 'Immersion totale dans la culture Maracatu']
  }
];

/**
 * Sous-composant d'administration permettant de gérer les cartes de formules d'adhésion 
 * pour la section Recrutement de la vitrine publique.
 *
 * @param {Object} props
 * @param {Array} props.formules - Liste actuelle des formules
 * @param {Function} props.onChangeFormules - Callback pour enregistrer la mise à jour des formules
 * @param {boolean} props.saving - État de sauvegarde
 * @param {string} props.groupId - Identifiant de l'association pour Firebase Storage
 */
export default function FormulesManager({ formules = [], onChangeFormules, saving, groupId }) {
  // Si aucune formule n'est encore enregistrée, initialiser avec les formules par défaut
  const activeFormules = Array.isArray(formules) && formules.length > 0 ? formules : DEFAULT_FORMULES;

  const [editingIndex, setEditingIndex] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingModalImage, setUploadingModalImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [formState, setFormState] = useState({
    titre: '',
    icone: '🥁',
    tarif: '',
    description: '',
    boutonText: 'En savoir plus',
    descriptionDetaillee: '',
    modalImageUrl: '',
    lienHelloAsso: '',
    avantagesText: '',
    backgroundImageUrl: '',
    imageUrl: ''
  });

  // Ouverture du formulaire de création / modification
  const handleOpenEdit = (index = null) => {
    setUploadError(null);
    if (index !== null && activeFormules[index]) {
      const item = activeFormules[index];
      const bgUrl = item.backgroundImageUrl || item.imageUrl || '';
      setFormState({
        titre: item.titre || '',
        icone: item.icone || '🥁',
        tarif: item.tarif || '',
        description: item.description || '',
        boutonText: item.boutonText || 'En savoir plus',
        descriptionDetaillee: item.descriptionDetaillee || '',
        modalImageUrl: item.modalImageUrl || '',
        lienHelloAsso: item.lienHelloAsso || '',
        avantagesText: Array.isArray(item.avantages) ? item.avantages.join('\n') : '',
        backgroundImageUrl: bgUrl,
        imageUrl: bgUrl
      });
      setEditingIndex(index);
    } else {
      setFormState({
        titre: '',
        icone: '🥁',
        tarif: 'Adhésion annuelle',
        description: '',
        boutonText: 'En savoir plus',
        descriptionDetaillee: '',
        modalImageUrl: '',
        lienHelloAsso: '',
        avantagesText: '',
        backgroundImageUrl: '',
        imageUrl: ''
      });
      setEditingIndex('new');
    }
  };

  // Fermeture du formulaire
  const handleCancel = () => {
    setEditingIndex(null);
    setUploadError(null);
  };

  // Téléversement de l'image de fond de carte
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError("Le fichier sélectionné doit être une image (JPG, PNG, WebP...).");
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = groupId
        ? `associations/${groupId}/formules/${Date.now()}_${cleanFileName}`
        : `formules/${Date.now()}_${cleanFileName}`;

      const imgRef = storageRef(storage, storagePath);
      const snapshot = await uploadBytes(imgRef, file, { contentType: file.type || 'image/jpeg' });
      const downloadUrl = await getDownloadURL(snapshot.ref);

      setFormState(prev => ({
        ...prev,
        backgroundImageUrl: downloadUrl,
        imageUrl: downloadUrl
      }));
    } catch (err) {
      console.error("Erreur lors du téléversement vers Firebase Storage :", err);
      setUploadError("Une erreur est survenue pendant l'envoi de l'image.");
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Téléversement de la photo d'illustration HD pour la modale
  const handleModalImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError("Le fichier sélectionné doit être une image (JPG, PNG, WebP...).");
      return;
    }

    setUploadingModalImage(true);
    setUploadError(null);

    try {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = groupId
        ? `associations/${groupId}/formules/modal_${Date.now()}_${cleanFileName}`
        : `formules/modal_${Date.now()}_${cleanFileName}`;

      const imgRef = storageRef(storage, storagePath);
      const snapshot = await uploadBytes(imgRef, file, { contentType: file.type || 'image/jpeg' });
      const downloadUrl = await getDownloadURL(snapshot.ref);

      setFormState(prev => ({
        ...prev,
        modalImageUrl: downloadUrl
      }));
    } catch (err) {
      console.error("Erreur lors du téléversement vers Firebase Storage :", err);
      setUploadError("Une erreur est survenue pendant l'envoi de l'image de la modale.");
    } finally {
      setUploadingModalImage(false);
      e.target.value = '';
    }
  };

  // Suppression de l'image d'arrière-plan
  const handleRemoveImage = () => {
    setFormState(prev => ({
      ...prev,
      backgroundImageUrl: '',
      imageUrl: ''
    }));
  };

  // Suppression de l'image modale
  const handleRemoveModalImage = () => {
    setFormState(prev => ({
      ...prev,
      modalImageUrl: ''
    }));
  };

  // Enregistrement d'une formule dans la liste
  const handleSaveFormule = (e) => {
    e.preventDefault();
    if (!formState.titre.trim()) return;

    const avantagesList = formState.avantagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const bgUrl = formState.backgroundImageUrl?.trim() || formState.imageUrl?.trim() || '';

    const updatedItem = {
      id: editingIndex === 'new' ? `formule_${Date.now()}` : activeFormules[editingIndex]?.id || `formule_${Date.now()}`,
      titre: formState.titre.trim(),
      icone: formState.icone.trim() || '🥁',
      tarif: formState.tarif.trim(),
      description: formState.description.trim(),
      boutonText: formState.boutonText.trim() || 'En savoir plus',
      descriptionDetaillee: formState.descriptionDetaillee.trim(),
      modalImageUrl: formState.modalImageUrl.trim(),
      lienHelloAsso: formState.lienHelloAsso.trim(),
      avantages: avantagesList,
      backgroundImageUrl: bgUrl,
      imageUrl: bgUrl
    };

    let nextList = [...activeFormules];
    if (editingIndex === 'new') {
      nextList.push(updatedItem);
    } else {
      nextList[editingIndex] = updatedItem;
    }

    onChangeFormules(nextList);
    setEditingIndex(null);
  };

  // Suppression d'une formule
  const handleDeleteFormule = (index) => {
    const nextList = activeFormules.filter((_, idx) => idx !== index);
    onChangeFormules(nextList);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/90 flex items-center gap-1.5">
          <span>🎫 Formules d'Adhésion & Cartes Recrutement</span>
        </label>
        <button
          type="button"
          onClick={() => handleOpenEdit(null)}
          disabled={saving || editingIndex !== null}
          className="text-[10px] font-black uppercase bg-cordel-vert text-white border border-encre-noire px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 cursor-pointer disabled:opacity-50 flex items-center gap-1"
        >
          <span>➕ Ajouter une formule</span>
        </button>
      </div>

      <p className="text-[11px] text-stone-600 leading-relaxed">
        Personnalisez les cartes d'adhésion affichées dans la section recrutement du site public (ex: Danse, Percussion, Formule Complète).
      </p>

      {/* Liste des cartes actuelles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {activeFormules.map((f, idx) => (
          <div 
            key={f.id || idx}
            className="p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between gap-3 relative"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg">{f.icone || '🥁'}</span>
                <span className="text-[9px] font-mono bg-stone-200 px-1.5 py-0.5 rounded text-stone-700 font-bold">
                  {f.tarif || 'Formule'}
                </span>
              </div>
              <h5 className="text-xs font-bold text-cordel-wood truncate">{f.titre}</h5>
              {f.description && (
                <p className="text-[10px] text-stone-600 line-clamp-2 leading-tight">
                  {f.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>
              )}
            </div>

            {/* Actions Modifier / Supprimer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-stone-300">
              <button
                type="button"
                onClick={() => handleOpenEdit(idx)}
                disabled={saving || editingIndex !== null}
                className="text-[9px] font-bold text-stone-700 hover:text-black cursor-pointer"
              >
                ✏️ Éditer
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFormule(idx)}
                disabled={saving || editingIndex !== null}
                className="text-[9px] font-bold text-red-700 hover:text-red-900 cursor-pointer ml-1"
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire d'édition / création d'une formule */}
      {editingIndex !== null && (
        <form onSubmit={handleSaveFormule} className="p-4 bg-white border-2 border-cordel-wood rounded-[6px_8px_5px_7px] flex flex-col gap-3 shadow-md animate-fade-in mt-2">
          <h5 className="text-xs font-black uppercase text-cordel-wood flex items-center justify-between border-b pb-1">
            <span>{editingIndex === 'new' ? "➕ Nouvelle Formule d'Adhésion" : "✏️ Modifier la Formule"}</span>
            <button type="button" onClick={handleCancel} className="text-xs text-stone-400 hover:text-black">✕</button>
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase">Icône / Émoji</label>
              <input
                type="text"
                required
                value={formState.icone}
                onChange={(e) => setFormState({ ...formState, icone: e.target.value })}
                placeholder="🥁"
                className="text-xs px-2 py-1.5 border rounded bg-white"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase">Titre de la Formule *</label>
              <input
                type="text"
                required
                value={formState.titre}
                onChange={(e) => setFormState({ ...formState, titre: e.target.value })}
                placeholder="Formule Percussion"
                className="text-xs px-2 py-1.5 border rounded bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase">Libellé du Tarif / Période</label>
              <input
                type="text"
                value={formState.tarif}
                onChange={(e) => setFormState({ ...formState, tarif: e.target.value })}
                placeholder="Adhésion annuelle / Tarif réduit"
                className="text-xs px-2 py-1.5 border rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase">Texte du bouton sur la carte</label>
              <input
                type="text"
                value={formState.boutonText}
                onChange={(e) => setFormState({ ...formState, boutonText: e.target.value })}
                placeholder="En savoir plus"
                className="text-xs px-2 py-1.5 border rounded bg-white font-bold"
              />
            </div>
          </div>

          {/* Description courte sur la carte */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-encre-noire flex items-center justify-between">
              <span>Description courte (Affichée sur la carte)</span>
              <span className="text-[9px] text-stone-500 font-normal">Texte riche (Gras, puces...)</span>
            </label>
            <RichTextEditor
              value={formState.description || ''}
              onChange={(val) => setFormState(prev => ({ ...prev, description: val }))}
              disabled={saving}
              placeholder="Ateliers hebdomadaires de percussion maracatu..."
              minHeight="100px"
              showLists={true}
              showImage={false}
              showAlign={false}
            />
          </div>

          {/* Description détaillée dans la modale "En savoir plus" */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-encre-noire flex items-center justify-between">
              <span>Description détaillée (Dans la modale "En savoir plus")</span>
              <span className="text-[9px] text-stone-500 font-normal">Texte riche structuré (Gras, puces, tirets...)</span>
            </label>
            <RichTextEditor
              value={formState.descriptionDetaillee || ''}
              onChange={(val) => setFormState(prev => ({ ...prev, descriptionDetaillee: val }))}
              disabled={saving}
              placeholder="Précisez le fonctionnement, les lieux, les horaires exacts, la tenue requise, les objectifs d'apprentissage..."
              minHeight="140px"
              showLists={true}
              showImage={false}
              showAlign={true}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase flex items-center justify-between">
              <span>💳 Lien d'inscription HelloAsso spécifique (Optionnel)</span>
              <span className="text-[9px] text-stone-400 font-normal">Surcharge le lien global si rempli</span>
            </label>
            <input
              type="url"
              value={formState.lienHelloAsso}
              onChange={(e) => setFormState({ ...formState, lienHelloAsso: e.target.value })}
              placeholder="https://www.helloasso.com/associations/.../adhesions/..."
              className="text-xs px-2 py-1.5 border rounded bg-white font-mono"
            />
          </div>

          {/* Section Upload d'image de fond via Firebase Storage */}
          <div className="flex flex-col gap-2 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded">
            <label className="text-[10px] font-bold uppercase tracking-wider text-encre-noire flex items-center justify-between">
              <span>🖼️ Image d'Arrière-Plan de la Carte (Formule)</span>
              <span className="text-[9px] text-stone-500 font-normal">Photo d'arrière-plan</span>
            </label>

            {/* Boutons d'action pour le téléversement d'image */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-cordel-vert text-white px-3 py-1.5 rounded cursor-pointer hover:brightness-105 transition-all shadow-[1.5px_1.5px_0px_0px_#181716] disabled:opacity-50">
                <span>{uploadingImage ? '⏳ Téléversement...' : '📁 Choisir une photo locale'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage || saving}
                  className="hidden"
                />
              </label>

              {(formState.backgroundImageUrl || formState.imageUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={uploadingImage || saving}
                  className="text-[10px] font-bold text-red-700 hover:text-red-900 border border-red-300 bg-red-50 px-2 py-1 rounded cursor-pointer"
                >
                  🗑️ Retirer l'image
                </button>
              )}
            </div>

            {/* URL manuelle alternative ou d'appoint */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-stone-500 font-medium">Ou URL directe de l'image de carte :</span>
              <input
                type="url"
                value={formState.backgroundImageUrl || formState.imageUrl || ''}
                onChange={(e) => setFormState({ ...formState, backgroundImageUrl: e.target.value, imageUrl: e.target.value })}
                placeholder="https://firebasestorage.googleapis.com/... ou https://..."
                className="text-xs px-2 py-1 border rounded bg-white font-mono"
              />
            </div>
          </div>

          {/* Section Upload de Photo d'Illustration HD pour la Modale */}
          <div className="flex flex-col gap-2 p-3 bg-amber-50/60 border border-amber-300/80 rounded">
            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-950 flex items-center justify-between">
              <span>📸 Photo d'Illustration pour la Modale HD ("En savoir plus")</span>
              <span className="text-[9px] text-amber-700 font-normal">Grand format</span>
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-stone-800 text-white px-3 py-1.5 rounded cursor-pointer hover:brightness-110 transition-all shadow-[1.5px_1.5px_0px_0px_#181716] disabled:opacity-50">
                <span>{uploadingModalImage ? '⏳ Téléversement...' : '📁 Uploader photo HD modale'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleModalImageUpload}
                  disabled={uploadingModalImage || saving}
                  className="hidden"
                />
              </label>

              {formState.modalImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveModalImage}
                  disabled={uploadingModalImage || saving}
                  className="text-[10px] font-bold text-red-700 hover:text-red-900 border border-red-300 bg-red-50 px-2 py-1 rounded cursor-pointer"
                >
                  🗑️ Retirer l'image HD
                </button>
              )}
            </div>

            {/* URL directe image modale */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[9px] text-stone-500 font-medium">Ou URL de l'image modale HD :</span>
              <input
                type="url"
                value={formState.modalImageUrl || ''}
                onChange={(e) => setFormState({ ...formState, modalImageUrl: e.target.value })}
                placeholder="https://exemple.com/photo-hd-activite.jpg"
                className="text-xs px-2 py-1 border rounded bg-white font-mono"
              />
            </div>

            {/* Message d'erreur d'upload */}
            {uploadError && (
              <p className="text-[10px] text-red-700 font-medium">
                ⚠️ {uploadError}
              </p>
            )}
          </div>

            {/* Aperçu dynamique de l'image de fond avec la couche d'assombrissement (overlay) */}
            {(formState.backgroundImageUrl || formState.imageUrl) && (
              <div className="mt-1 relative h-20 w-full rounded overflow-hidden border border-stone-300 bg-stone-900 shadow-inner">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${formState.backgroundImageUrl || formState.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                />
                {/* Overlay d'assombrissement bg-black/60 */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none z-0" />
                <div className="relative z-10 h-full flex items-center justify-center p-2 text-center">
                  <span className="text-[11px] font-bold text-white drop-shadow-md">
                    Aperçu du rendu final avec assombrissement (bg-black/60)
                  </span>
                </div>
              </div>
            )}

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase flex items-center justify-between">
              <span>Points Forts / Avantages inclus (Un par ligne)</span>
              <span className="text-[9px] text-stone-400 font-normal">Chaque ligne deviendra une puce ✓</span>
            </label>
            <textarea
              rows={3}
              value={formState.avantagesText}
              onChange={(e) => setFormState({ ...formState, avantagesText: e.target.value })}
              placeholder="Prêt des instruments inclus&#10;Accès aux répétitions & prestations&#10;Ouvert à tous niveaux"
              className="text-xs px-2 py-1.5 border rounded bg-white font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <CordelButton type="button" variant="default" onClick={handleCancel} className="text-[10px] px-3 py-1">
              Annuler
            </CordelButton>
            <CordelButton type="submit" variant="vert" className="text-[10px] px-4 py-1 font-bold uppercase">
              Valider la formule
            </CordelButton>
          </div>
        </form>
      )}
    </div>
  );
}
