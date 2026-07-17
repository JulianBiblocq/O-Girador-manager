import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function MestreWorkshops({ groupId }) {
  const { t } = useTranslation();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form / Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null); // null for new sheet
  const [titre, setTitre] = useState('');
  const [content, setContent] = useState('');

  // Expanded workshop IDs for viewing
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Load workshops
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const q = query(collection(db, 'workshops'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort: recent first
      fetched.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      setWorkshops(fetched);
      setLoading(false);
    }, (error) => {
      console.error("MestreWorkshops - Error query workshops:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        // Edit existing
        const ref = doc(db, 'workshops', editingId);
        await updateDoc(ref, {
          titre: titre.trim(),
          content: content.trim(),
          updatedAt: Date.now()
        });
      } else {
        // Create new
        await addDoc(collection(db, 'workshops'), {
          groupId,
          titre: titre.trim(),
          content: content.trim(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      // Reset
      setTitre('');
      setContent('');
      setEditingId(null);
      setIsEditing(false);
    } catch (error) {
      console.error("MestreWorkshops - Error saving workshop:", error);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (workshop) => {
    setEditingId(workshop.id);
    setTitre(workshop.titre);
    setContent(workshop.content || '');
    setIsEditing(true);
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    const confirmMsg = t('mestre.workshopDeleteConfirm') || "Voulez-vous vraiment supprimer cette fiche d'atelier ?";
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteDoc(doc(db, 'workshops', id));
    } catch (error) {
      console.error("MestreWorkshops - Error deleting workshop:", error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          📖 {t('mestre.workshopsTitle') || "Fiches Pédagogiques des Ateliers"}
        </h2>
        
        {!isEditing && (
          <CordelButton
            type="button"
            variant="ocre"
            useExtremeBorder={true}
            onClick={() => {
              setEditingId(null);
              setTitre('');
              setContent('');
              setIsEditing(true);
            }}
            className="py-1 px-3 text-[10px] uppercase font-black tracking-widest"
          >
            ➕ {t('mestre.addWorkshopBtn') || "Créer une fiche"}
          </CordelButton>
        )}
      </div>

      {isEditing ? (
        <CordelCard variant="default" useExtremeBorder={true} className="p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
              {editingId ? "Modifier la Fiche" : "Créer une nouvelle Fiche"}
            </h3>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-bold text-[9px] uppercase tracking-wider text-cordel-master-dark">
                {t('mestre.workshopTitle') || "Titre de l'atelier"} *
              </label>
              <input
                type="text"
                required
                disabled={saving}
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Rythme Ijexá - Variations et transitions"
                className="theme-input font-bold py-1.5 bg-cordel-bg-light"
              />
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <label className="font-bold text-[9px] uppercase tracking-wider text-cordel-master-dark">
                {t('mestre.workshopContent') || "Contenu pédagogique / Descriptif"}
              </label>
              <textarea
                disabled={saving}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('mestre.workshopPlaceholder') || "Décrivez le contenu ici..."}
                rows={12}
                className="theme-input font-bold py-2 bg-cordel-bg-light resize-y whitespace-pre-wrap leading-relaxed"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <CordelButton
                type="button"
                variant="default"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="py-2 px-4 text-[10px] font-black uppercase tracking-widest bg-cordel-bg hover:bg-neutral-100"
              >
                {t('common.cancel') || "Annuler"}
              </CordelButton>
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={saving || !titre.trim()}
                className="py-2 px-5 text-[10px] font-black uppercase tracking-widest"
              >
                {saving ? "..." : (t('mestre.saveWorkshopBtn') || "Enregistrer la fiche")}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : workshops.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={true} className="p-12 text-center">
          <p className="text-xs font-bold opacity-75">{t('mestre.noWorkshops') || "Aucune fiche pédagogique d'atelier disponible."}</p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-3.5">
          {workshops.map((ws) => {
            const isExpanded = expandedIds.has(ws.id);
            return (
              <CordelCard
                key={ws.id}
                variant="default"
                useExtremeBorder={false}
                className={`p-4 bg-cordel-bg-light cursor-pointer transition-all hover:brightness-105 border-[1.5px] border-encre-noire/15`}
                onClick={() => toggleExpand(ws.id)}
              >
                <div className="flex justify-between items-center select-none">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-encre-noire">{ws.titre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CordelButton
                      type="button"
                      variant="default"
                      useExtremeBorder={false}
                      className="py-0.5 px-2 text-[9px] uppercase tracking-wider font-black bg-cordel-bg hover:bg-neutral-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(ws);
                      }}
                    >
                      ✏️ {t('mestre.editWorkshopBtn') || "Modifier"}
                    </CordelButton>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(ws.id, e)}
                      className="text-xs hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                      title="Supprimer"
                    >
                      ✕
                    </button>
                    <span className="text-xs opacity-60 ml-2">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {isExpanded && ws.content && (
                  <div className="mt-3.5 pt-3.5 border-t border-dashed border-cordel-master-dark/15 text-xs text-encre-noire leading-relaxed whitespace-pre-wrap select-text">
                    {ws.content}
                  </div>
                )}
              </CordelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
