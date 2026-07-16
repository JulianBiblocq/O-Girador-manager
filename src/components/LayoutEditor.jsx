import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

const WIDGET_NAMES = {
  motMestre: {
    title: "Le Mot du Mestre 📝",
    desc: "Bloc d'actualité rédigé en direct par le Mestre."
  },
  agenda: {
    title: "Dates à Venir (Agenda) 📅",
    desc: "Liste des répétitions, concerts et stages de la Roda."
  },
  forum: {
    title: "Le Porte-Voix (Forum) 💬",
    desc: "Discussions communautaires et ateliers couture/costumes."
  },
  documents: {
    title: "Varal de Documents 📂",
    desc: "Partage de paroles, grilles de percussions et administratifs."
  }
};

export default function LayoutEditor({ groupId, onBack, role, isSystemAdmin }) {
  const [items, setItems] = useState(["motMestre", "agenda", "forum", "documents"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Security Check: Mestres, Super-Admins and System Admins only
  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  useEffect(() => {
    if (!isAuthorized || !groupId) {
      setLoading(false);
      return;
    }

    // Load initial layout configuration from associations/{groupId}
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.layoutEleves) && data.layoutEleves.length > 0) {
          setItems(data.layoutEleves);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("LayoutEditor - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const listCopy = [...items];
    const [draggedItem] = listCopy.splice(sourceIndex, 1);
    listCopy.splice(targetIndex, 0, draggedItem);
    
    setItems(listCopy);
  };

  const handleSave = async () => {
    if (!groupId) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'associations', groupId);
      // setDoc with merge creates document if it does not exist
      await setDoc(docRef, { layoutEleves: items }, { merge: true });
      alert("Nouvel agencement enregistré avec succès !");
      onBack();
    } catch (error) {
      console.error("LayoutEditor - Erreur de mise à jour layout :", error);
      alert("Erreur lors de l'enregistrement de la mise en page.");
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
              Vous devez avoir le rôle de Mestre ou d'Administrateur pour réorganiser la disposition de l'accueil.
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
            ⚙️ Organiser l'accueil
          </h2>
        </div>

        {/* Info card */}
        <div className="text-xs opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
          💡 <strong>Glissez-déposez</strong> les blocs ci-dessous par leurs poignées pour choisir l'ordre dans lequel les élèves verront les widgets sur leur tableau de bord.
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((widgetId, index) => {
              const widget = WIDGET_NAMES[widgetId] || { title: widgetId, desc: "" };
              const isOver = dragOverIndex === index;

              return (
                <div
                  key={widgetId}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`transition-all duration-150 ${isOver ? 'scale-[1.02] border-dashed border-cordel-wood border-2 rounded-lg' : ''}`}
                >
                  <CordelCard
                    variant="default"
                    useExtremeBorder={false}
                    className="p-3 flex items-center justify-between gap-3 bg-cordel-bg hover:bg-cordel-bg-light/10"
                  >
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-cordel-wood truncate">
                        {widget.title}
                      </h4>
                      <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
                        {widget.desc}
                      </p>
                    </div>

                    {/* Drag Handle (Draggable block wrapper with custom Woodcut aesthetics) */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      className="w-10 h-10 border-2 border-encre-noire bg-cordel-wood text-cordel-bg-light rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
                      title="Glisser pour déplacer"
                    >
                      <span className="text-xl font-bold tracking-tighter">🪢</span>
                    </div>
                  </CordelCard>
                </div>
              );
            })}
          </div>
        )}

        {/* Save button */}
        {!loading && (
          <div className="mt-2">
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 font-extrabold text-sm tracking-wider"
            >
              {saving ? "Sauvegarde en cours..." : "Sauvegarder la disposition"}
            </CordelButton>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
