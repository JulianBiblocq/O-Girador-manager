import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { normalizeTag, getTagId } from '../utils/tagUtils';

export default function TagManager({ groupId, onBack, role, isSystemAdmin }) {
  const { t } = useTranslation();
  const [rawTags, setRawTags] = useState([]);
  
  // Creation form state
  const [nomM, setNomM] = useState("");
  const [nomF, setNomF] = useState("");
  
  // Edit modal state
  const [editingTag, setEditingTag] = useState(null); // normalized tag object
  const [editNomM, setEditNomM] = useState("");
  const [editNomF, setEditNomF] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Security Check: Mestres, Super-Admins and System Admins only
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  useEffect(() => {
    if (!isAuthorized || !groupId) {
      setLoading(false);
      return;
    }

    // Real-time listener for the association's custom tags
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.tagsDisponibles)) {
          setRawTags(data.tagsDisponibles);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("TagManager - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  // Normalize all tags for presentation
  const tagsList = rawTags.map(t => normalizeTag(t));

  // Move tag up/down
  const handleMoveTagOrder = async (index, direction) => {
    if (!groupId || saving) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rawTags.length) return;

    const newRawTags = [...rawTags];
    const temp = newRawTags[index];
    newRawTags[index] = newRawTags[targetIndex];
    newRawTags[targetIndex] = temp;

    setRawTags(newRawTags);
    setSaving(true);
    try {
      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, { tagsDisponibles: newRawTags }, { merge: true });
    } catch (error) {
      console.error("TagManager - Erreur d'ordonnancement :", error);
      alert("Erreur lors de la réorganisation des étiquettes.");
    } finally {
      setSaving(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !groupId || saving) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newRawTags = [...rawTags];
    const [movedItem] = newRawTags.splice(draggedIndex, 1);
    newRawTags.splice(dropIndex, 0, movedItem);

    setRawTags(newRawTags);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setSaving(true);

    try {
      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, { tagsDisponibles: newRawTags }, { merge: true });
    } catch (error) {
      console.error("TagManager - Erreur d'ordonnancement Drag&Drop :", error);
      alert("Erreur lors du déplacement de l'étiquette.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    const cleanM = nomM.trim();
    const cleanF = nomF.trim();
    if (!cleanM || !cleanF || !groupId) return;

    // Check for duplicate IDs or names (case insensitive)
    const isDuplicate = tagsList.some(t => 
      t.id.toLowerCase() === cleanM.toLowerCase() ||
      t.nomM.toLowerCase() === cleanM.toLowerCase()
    );

    if (isDuplicate) {
      alert(t('tagManager.alreadyExists') || "Cette étiquette existe déjà.");
      return;
    }

    setSaving(true);
    try {
      const newTagObject = {
        id: cleanM,
        nomM: cleanM,
        nomF: cleanF
      };

      const assocRef = doc(db, 'associations', groupId);
      const updatedTags = [...rawTags, newTagObject];
      await setDoc(assocRef, { tagsDisponibles: updatedTags }, { merge: true });
      
      setNomM("");
      setNomF("");
    } catch (error) {
      console.error("TagManager - Erreur d'ajout d'étiquette :", error);
      alert(t('tagManager.errorAdd') || "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (normTag) => {
    setEditingTag(normTag);
    setEditNomM(normTag.nomM);
    setEditNomF(normTag.nomF);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const cleanM = editNomM.trim();
    const cleanF = editNomF.trim();
    if (!editingTag || !cleanM || !cleanF || !groupId) return;

    setSaving(true);
    try {
      const targetId = editingTag.id;
      const updatedTags = rawTags.map(item => {
        const itemId = getTagId(item);
        if (itemId === targetId || (typeof item === 'string' && item === targetId)) {
          return {
            id: targetId,
            nomM: cleanM,
            nomF: cleanF
          };
        }
        return item;
      });

      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, { tagsDisponibles: updatedTags }, { merge: true });

      setEditingTag(null);
    } catch (error) {
      console.error("TagManager - Erreur de modification d'étiquette :", error);
      alert("Erreur lors de la mise à jour de l'étiquette.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (normTag) => {
    if (!groupId) return;
    const confirmDelete = window.confirm(
      (t('tagManager.deleteConfirmText') || `Voulez-vous vraiment supprimer l'étiquette "{tag}" ?`).replace('{tag}', normTag.nomM)
    );
    if (!confirmDelete) return;

    setSaving(true);
    try {
      const targetId = normTag.id;
      const updatedTags = rawTags.filter(item => {
        const itemId = getTagId(item);
        return itemId !== targetId && (typeof item !== 'string' || item !== targetId);
      });

      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, { tagsDisponibles: updatedTags }, { merge: true });
    } catch (error) {
      console.error("TagManager - Erreur de suppression d'étiquette :", error);
      alert(t('tagManager.errorDelete') || "Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  // Render Access Denied card if security fails
  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 {t('layoutEditor.accessDenied')}</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {t('tagManager.accessDeniedDesc')}
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ← {t('common.back')}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={onBack} 
          disabled={saving}
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50"
        >
          ← {t('common.back')}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          🏷️ {t('tags.managerTitle') || "Gestionnaire d'Étiquettes / Rôles"}
        </h2>
      </div>

      {/* Add Tag Form */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-5">
        <h3 className="panel-title text-sm font-bold text-cordel-wood mb-1">
          {t('tags.createLabel') || "Créer une nouvelle étiquette"}
        </h3>
        <p className="text-[10px] text-cordel-master-dark opacity-75 mb-4">
          Spécifiez le nom au masculin et au féminin pour un accord dynamique selon le profil du membre.
        </p>

        <form onSubmit={handleAddTag} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Masculin */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                👨 Nom (Masculin) *
              </label>
              <input
                type="text"
                value={nomM}
                onChange={(e) => setNomM(e.target.value)}
                disabled={saving}
                placeholder="Ex: Trésorier, Modérateur..."
                required
                maxLength={30}
                className="theme-input text-xs py-2 font-bold w-full"
              />
            </div>

            {/* Féminin */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                👩 Nom (Féminin) *
              </label>
              <input
                type="text"
                value={nomF}
                onChange={(e) => setNomF(e.target.value)}
                disabled={saving}
                placeholder="Ex: Trésorière, Modératrice..."
                required
                maxLength={30}
                className="theme-input text-xs py-2 font-bold w-full"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <CordelButton 
              type="submit" 
              variant="ocre" 
              useExtremeBorder={true}
              disabled={saving || !nomM.trim() || !nomF.trim()} 
              className="text-xs py-2 px-4 font-extrabold uppercase tracking-widest shrink-0"
            >
              + {t('tagManager.createBtn') || "Créer l'étiquette"}
            </CordelButton>
          </div>
        </form>
      </CordelCard>

      {/* Tags List */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase">
          {t('tagManager.availableTags') || "Étiquettes de l'association"} ({tagsList.length})
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : tagsList.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center">
            <p className="text-xs opacity-75 font-semibold">{t('tagManager.noTags') || "Aucune étiquette configurée."}</p>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tagsList.map((tag, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div 
                  key={tag.id}
                  draggable={!saving}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`flex items-center justify-between border-2 border-encre-noire bg-cordel-bg shadow-[2px_2px_0px_0px_#181716] rounded-[5px_8px_4px_6px] p-2.5 gap-2.5 transition-all select-none ${
                    isDragging ? 'opacity-30 border-dashed border-cordel-wood scale-[0.99]' : ''
                  } ${
                    isDragOver ? 'border-cordel-wood bg-cordel-bg-light scale-[1.01] shadow-md' : ''
                  }`}
                >
                  {/* Reorder controls: Grip & Up/Down Arrows */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span 
                      className="cursor-grab active:cursor-grabbing text-cordel-master-dark opacity-60 hover:opacity-100 px-1 py-0.5 text-sm font-black select-none"
                      title="Glisser-déposer pour réorganiser"
                    >
                      ⋮⋮
                    </span>

                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveTagOrder(index, 'up')}
                        disabled={index === 0 || saving}
                        className="p-1 text-[10px] font-black leading-none text-cordel-wood hover:text-encre-noire disabled:opacity-20 cursor-pointer"
                        title="Monter"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveTagOrder(index, 'down')}
                        disabled={index === tagsList.length - 1 || saving}
                        className="p-1 text-[10px] font-black leading-none text-cordel-wood hover:text-encre-noire disabled:opacity-20 cursor-pointer"
                        title="Descendre"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Badge Names */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 min-w-0 flex-1">
                    <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 font-black truncate">
                      👨 {tag.nomM}
                    </span>
                    <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] px-2 py-0.5 font-black truncate">
                      👩 {tag.nomF}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tag)}
                      disabled={saving}
                      className="w-7 h-7 flex items-center justify-center border border-encre-noire bg-cordel-bg-light text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] hover:bg-white cursor-pointer disabled:opacity-50 text-xs font-bold"
                      title="Modifier l'accord masculin/féminin"
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTag(tag)}
                      disabled={saving}
                      className="w-7 h-7 flex items-center justify-center border border-encre-noire bg-cordel-wood text-cordel-bg-light rounded shadow-[1px_1px_0px_0px_#181716] hover:brightness-110 cursor-pointer disabled:opacity-50 text-xs font-bold"
                      title={t('tagManager.deleteTitle') || "Supprimer cette étiquette"}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-md">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase">
                  ✏️ Modifier l'étiquette
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    👨 Nom (Masculin) *
                  </label>
                  <input
                    type="text"
                    value={editNomM}
                    onChange={(e) => setEditNomM(e.target.value)}
                    required
                    maxLength={30}
                    className="theme-input text-xs py-2 font-bold w-full"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                    👩 Nom (Féminin) *
                  </label>
                  <input
                    type="text"
                    value={editNomF}
                    onChange={(e) => setEditNomF(e.target.value)}
                    required
                    maxLength={30}
                    className="theme-input text-xs py-2 font-bold w-full"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => setEditingTag(null)}
                    disabled={saving}
                    className="py-2 px-4 text-xs font-bold uppercase"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={saving || !editNomM.trim() || !editNomF.trim()}
                    className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}
    </div>
  );
}
