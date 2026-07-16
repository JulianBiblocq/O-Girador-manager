import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function TagManager({ groupId, onBack, role, isSystemAdmin }) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          setTags(data.tagsDisponibles);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("TagManager - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  const handleAddTag = async (e) => {
    e.preventDefault();
    const cleanTag = newTag.trim();
    if (!cleanTag || !groupId) return;

    // Check for duplicates (case insensitive)
    if (tags.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
      alert("Cette étiquette existe déjà !");
      return;
    }

    setSaving(true);
    try {
      const assocRef = doc(db, 'associations', groupId);
      const updatedTags = [...tags, cleanTag];
      await setDoc(assocRef, { tagsDisponibles: updatedTags }, { merge: true });
      setNewTag("");
    } catch (error) {
      console.error("TagManager - Erreur d'ajout d'étiquette :", error);
      alert("Impossible d'ajouter l'étiquette.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    if (!groupId) return;
    const confirmDelete = window.confirm(`Voulez-vous vraiment supprimer l'étiquette "${tagToDelete}" ?\nNote : Cela ne la retirera pas automatiquement des membres qui la possèdent déjà, mais elle ne sera plus disponible pour attribution.`);
    if (!confirmDelete) return;

    setSaving(true);
    try {
      const assocRef = doc(db, 'associations', groupId);
      const updatedTags = tags.filter(t => t !== tagToDelete);
      await setDoc(assocRef, { tagsDisponibles: updatedTags }, { merge: true });
    } catch (error) {
      console.error("TagManager - Erreur de suppression d'étiquette :", error);
      alert("Impossible de supprimer l'étiquette.");
    } finally {
      setSaving(false);
    }
  };

  // Render Access Denied card if security fails
  if (!isAuthorized) {
    return (
      <LayoutShell>
        <div className="text-center py-12 select-none">
          <CordelCard variant="default" useExtremeBorder={true} className="p-8">
            <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
            <p className="text-xs opacity-75 mt-3 leading-relaxed">
              Vous devez avoir le rôle de Mestre ou d'Administrateur pour gérer les étiquettes personnalisées.
            </p>
            <div className="mt-6 flex justify-center">
              <CordelButton variant="default" onClick={onBack} className="text-xs">
                ⬅️ Retour
              </CordelButton>
            </div>
          </CordelCard>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="flex flex-col gap-5 text-left">
        {/* Header bar */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 select-none">
          <button 
            type="button" 
            onClick={onBack} 
            disabled={saving}
            className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50"
          >
            ⬅️ Retour
          </button>
          
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
            🏷️ Gérer les étiquettes
          </h2>
        </div>

        {/* Add Tag Form */}
        <CordelCard variant="default" useExtremeBorder={true} className="p-5">
          <h3 className="panel-title text-sm font-bold text-cordel-wood mb-3">
            Créer une nouvelle étiquette
          </h3>
          
          <form onSubmit={handleAddTag} className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              disabled={saving}
              placeholder="Ex : Référent Caixa, Logistique..."
              required
              maxLength={24}
              className="theme-input flex-1 disabled:opacity-50 text-xs py-2 font-bold"
            />
            <CordelButton 
              type="submit" 
              variant="ocre" 
              disabled={saving || !newTag.trim()} 
              className="text-xs py-2 font-extrabold uppercase tracking-widest shrink-0"
            >
              + Ajouter
            </CordelButton>
          </form>
        </CordelCard>

        {/* Tags List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase">
            Étiquettes disponibles ({tags.length})
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
            </div>
          ) : tags.length === 0 ? (
            <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center">
              <p className="text-xs opacity-75 font-semibold">Aucune étiquette personnalisée créée pour le moment.</p>
            </CordelCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tags.map((tag) => (
                <div 
                  key={tag}
                  className="flex items-center justify-between border-2 border-encre-noire bg-cordel-bg shadow-[2px_2px_0px_0px_#181716] rounded-[5px_8px_4px_6px] p-2"
                >
                  <span className="theme-stamp-badge theme-stamp-badge-wood text-xs px-2 py-0.5 pointer-events-none select-none font-black truncate max-w-[80%]">
                    {tag}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleDeleteTag(tag)}
                    disabled={saving}
                    className="w-7 h-7 flex items-center justify-center border border-encre-noire bg-cordel-wood text-cordel-bg-light rounded-[3px_5px_2px_4px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 cursor-pointer disabled:opacity-50 text-xs font-bold"
                    title="Supprimer cette étiquette"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
