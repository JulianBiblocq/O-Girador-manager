import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

// Wobbly, block-print stylized Up Chevron SVG (matches BaqueMix/Sequencer aesthetics)
const ChevronUp = ({ size = 10, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="4" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 15 L12 9 C11.8 8.8 12.2 8.8 12 9 L6 15" />
  </svg>
);

// Wobbly, block-print stylized Down Chevron SVG (matches BaqueMix/Sequencer aesthetics)
const ChevronDown = ({ size = 10, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="4" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 9 L12 15 C12.2 15.2 11.8 15.2 12 15 L18 9" />
  </svg>
);

const WIDGET_NAMES = {
  motMestre: {
    title: "Le Mot du Mestre 📝",
    desc: "Bloc d'actualité rédigé en direct par le Mestre."
  },
  annonces: {
    title: "Le Mégaphone (Annonces) 📢",
    desc: "Annonces officielles de l'association ciblées par étiquettes."
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
  const [items, setItems] = useState(["motMestre", "annonces", "agenda", "forum", "documents"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const touchStartIndex = useRef(null);

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

  const handleTouchStart = (index) => {
    touchStartIndex.current = index;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = targetEl?.closest('[data-index]');
    if (itemEl) {
      const targetIndex = parseInt(itemEl.getAttribute('data-index'), 10);
      if (!isNaN(targetIndex) && targetIndex !== touchStartIndex.current) {
        const sourceIndex = touchStartIndex.current;
        const listCopy = [...items];
        const [draggedItem] = listCopy.splice(sourceIndex, 1);
        listCopy.splice(targetIndex, 0, draggedItem);
        setItems(listCopy);
        touchStartIndex.current = targetIndex;
      }
    }
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    
    const listCopy = [...items];
    const [movedItem] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, movedItem);
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
        <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-80 border border-dashed border-cordel-master-dark/30 p-3 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
          💡 <strong>Glissez-déposez</strong> les blocs ci-dessous par leurs poignées ou utilisez les flèches <strong>▲ / ▼</strong> pour choisir l'ordre d'affichage des widgets.
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
                  data-index={index}
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

                    {/* Reordering Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Arrow buttons for touch/mobile devices */}
                      <div className="flex flex-col gap-1 select-none">
                        <button
                          type="button"
                          onClick={() => handleMove(index, -1)}
                          disabled={index === 0 || saving}
                          className="w-8 h-6 border border-encre-noire bg-cordel-bg text-encre-noire dark:text-cordel-bg-light hover:bg-cordel-wood hover:text-cordel-bg-light rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                          title="Monter"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, 1)}
                          disabled={index === items.length - 1 || saving}
                          className="w-8 h-6 border border-encre-noire bg-cordel-bg text-encre-noire dark:text-cordel-bg-light hover:bg-cordel-wood hover:text-cordel-bg-light rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                          title="Descendre"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>

                      {/* Drag Handle (Desktop drag-and-drop & Mobile touch swipe) */}
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onTouchStart={() => handleTouchStart(index)}
                        onTouchMove={handleTouchMove}
                        className="w-10 h-10 border-2 border-encre-noire bg-cordel-wood text-cordel-bg-light rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
                        title="Glisser pour déplacer"
                      >
                        <span className="text-xl font-bold tracking-tighter select-none pointer-events-none">🪢</span>
                      </div>
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
