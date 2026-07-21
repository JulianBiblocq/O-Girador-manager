import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import PieceTutorialModal from './PieceTutorialModal';
import CostumeVisualizer from './CostumeVisualizer';

/**
 * MonVestiaire Component
 * Interactive wardrobe component for members.
 * Displays costumes with a Mannequin Silhouette visualizer, pieces checklist, fabrication progress,
 * validation status, and access to Atelier Couture tutorials.
 */
export default function MonVestiaire({ userId, groupId, userChecklist = {}, userSection = '', onBack }) {
  const { t } = useTranslation();
  const [costumes, setCostumes] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('tous'); // 'tous', 'Danse', 'Percussion'
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'list'
  
  const [activeTutorialPiece, setActiveTutorialPiece] = useState(null);
  const [activeTutorialWorkshop, setActiveTutorialWorkshop] = useState(null);
  const [actionPiece, setActionPiece] = useState(null);
  const [updatingPiece, setUpdatingPiece] = useState(null);

  // 1. Fetch costumes from Firestore
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'costumes'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      fetched.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setCostumes(fetched);
      setLoading(false);
    }, (err) => {
      console.error("MonVestiaire - Error loading costumes:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 2. Fetch workshops (Atelier Couture tutorials)
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'workshops'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setWorkshops(fetched);
    }, (err) => {
      console.error("MonVestiaire - Error loading workshops:", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Handle piece checkbox toggle
  const handleTogglePiece = async (costumeId, pieceId, currentValue) => {
    if (!userId) return;
    const keyPath = `${costumeId}.${pieceId}`;
    setUpdatingPiece(keyPath);

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`userCostumeChecklist.${keyPath}`]: !currentValue
      });
    } catch (err) {
      console.error("MonVestiaire - Error updating piece checklist:", err);
      alert("Erreur lors de la mise à jour : " + (err.message || err));
    } finally {
      setUpdatingPiece(null);
    }
  };

  // Handle opening tutorial modal for a piece
  const handleOpenTutorial = (piece) => {
    const linkedWorkshop = workshops.find(ws => 
      (piece.tutorialId && ws.id === piece.tutorialId) ||
      ws.titre?.toLowerCase().includes((piece.name || '').toLowerCase())
    );
    setActiveTutorialPiece(piece);
    setActiveTutorialWorkshop(linkedWorkshop || null);
  };

  // Filter costumes based on target category
  const filteredCostumes = costumes.filter(c => {
    if (selectedFilter === 'tous') return true;
    return (c.targetCategory || 'Tous').toLowerCase() === selectedFilter.toLowerCase() || (c.targetCategory || 'Tous') === 'Tous';
  });

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-3">
        <div>
          <h2 className="text-base font-cactus font-black tracking-wider text-cordel-wood uppercase">
            🎭 Mon Vestiaire & Garde-Robe
          </h2>
          <p className="text-[10px] text-cordel-master-dark opacity-75">
            Mannequin d'habillage visuel, validation de vos pièces et Atelier Couture.
          </p>
        </div>
        {onBack && (
          <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs font-bold uppercase">
            ← Retour
          </CordelButton>
        )}
      </div>

      {/* Filter Tabs & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/15 pb-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFilter('tous')}
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border transition-all ${
              selectedFilter === 'tous'
                ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                : 'bg-cordel-bg text-cordel-master-dark border-cordel-master-dark/30 hover:bg-white/40'
            }`}
          >
            Tous les Costumes ({costumes.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('Danse')}
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border transition-all ${
              selectedFilter === 'Danse'
                ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                : 'bg-cordel-bg text-cordel-master-dark border-cordel-master-dark/30 hover:bg-white/40'
            }`}
          >
            💃 Danse
          </button>
          <button
            type="button"
            onClick={() => setSelectedFilter('Percussion')}
            className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded border transition-all ${
              selectedFilter === 'Percussion'
                ? 'bg-cordel-wood text-white border-encre-noire shadow-[1px_1px_0px_0px_#181716]'
                : 'bg-cordel-bg text-cordel-master-dark border-cordel-master-dark/30 hover:bg-white/40'
            }`}
          >
            🥁 Percussion
          </button>
        </div>

        {/* View Mode Toggle: Visual Mannequin vs List */}
        <div className="flex items-center gap-1 bg-white/40 p-1 rounded border border-cordel-master-dark/20 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('visual')}
            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
              viewMode === 'visual'
                ? 'bg-cordel-wood text-white shadow-sm'
                : 'text-cordel-master-dark hover:bg-white/60'
            }`}
          >
            🎨 Mannequin
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
              viewMode === 'list'
                ? 'bg-cordel-wood text-white shadow-sm'
                : 'text-cordel-master-dark hover:bg-white/60'
            }`}
          >
            📋 Liste
          </button>
        </div>
      </div>

      {/* Costumes Display */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement de votre vestiaire...</span>
        </div>
      ) : filteredCostumes.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
          <p className="text-xs italic text-cordel-master-dark/70">
            {costumes.length === 0 
              ? "Aucun costume configuré pour le moment dans l'association."
              : "Aucun costume ne correspond à cette catégorie."}
          </p>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredCostumes.map((costume) => {
            const pieces = costume.pieces || [];
            const mandatoryPieces = pieces.filter(p => p.isMandatory !== false);
            const costumeChecklist = userChecklist[costume.id] || {};

            const checkedMandatoryCount = mandatoryPieces.filter(p => Boolean(costumeChecklist[p.id])).length;
            const checkedTotalCount = pieces.filter(p => Boolean(costumeChecklist[p.id])).length;

            const totalMandatory = mandatoryPieces.length;
            const isFullyValidated = totalMandatory > 0 ? checkedMandatoryCount === totalMandatory : (pieces.length > 0 && checkedTotalCount === pieces.length);

            const progressPct = totalMandatory > 0 
              ? Math.round((checkedMandatoryCount / totalMandatory) * 100)
              : (pieces.length > 0 ? Math.round((checkedTotalCount / pieces.length) * 100) : 0);

            return (
              <CordelCard
                key={costume.id}
                variant="default"
                useExtremeBorder={true}
                className={`p-4 flex flex-col gap-4 transition-all bg-cordel-bg ${
                  isFullyValidated ? 'ring-2 ring-emerald-600/80 bg-emerald-50/20' : ''
                }`}
              >
                {/* Costume Header & Validation Stamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2.5">
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-cactus font-black text-sm text-encre-noire uppercase tracking-wider">
                        🎭 {costume.title}
                      </h3>
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase">
                        {costume.targetCategory || 'Tous'}
                      </span>
                    </div>
                    {costume.description && (
                      <p className="text-[10px] text-cordel-master-dark opacity-75 mt-0.5">
                        {costume.description}
                      </p>
                    )}
                  </div>

                  {/* Validation Badge Animation */}
                  {isFullyValidated ? (
                    <div className="animate-bounce flex items-center gap-1.5 self-start sm:self-center">
                      <span className="theme-stamp-badge bg-emerald-700 text-white text-[10px] px-3 py-1 font-black uppercase tracking-widest border border-emerald-900 shadow-[2px_2px_0px_0px_#064e3b]">
                        ✅ Costume Validé !
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-extrabold text-cordel-wood self-start sm:self-center">
                      Progression : {checkedMandatoryCount}/{totalMandatory} obligatoire(s)
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-cordel-master-dark/10 h-2.5 rounded-full overflow-hidden border border-cordel-master-dark/20 relative">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isFullyValidated ? 'bg-emerald-600' : 'bg-cordel-wood'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* View Mode 1: Interactive Mannequin Visualizer */}
                {viewMode === 'visual' ? (
                  <div className="flex flex-col items-center gap-3">
                    <CostumeVisualizer
                      costume={costume}
                      checklist={costumeChecklist}
                      onSelectPiece={(piece) => setActionPiece({ ...piece, costumeId: costume.id })}
                    />
                  </div>
                ) : (
                  /* View Mode 2: Standard Checklist Grid */
                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-cordel-master-dark opacity-70">
                      Pièces requises ({pieces.length}) :
                    </span>

                    {pieces.length === 0 ? (
                      <span className="text-[10px] italic opacity-60">Aucune pièce définie pour ce costume.</span>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pieces.map((piece) => {
                          const isChecked = Boolean(costumeChecklist[piece.id]);
                          const isUpdating = updatingPiece === `${costume.id}.${piece.id}`;

                          return (
                            <div
                              key={piece.id}
                              className={`p-2.5 rounded border border-dashed flex items-center justify-between gap-2 text-left transition-all ${
                                isChecked
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-600/40'
                                  : 'bg-white/40 dark:bg-black/10 border-cordel-master-dark/20'
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  disabled={isUpdating}
                                  onChange={() => handleTogglePiece(costume.id, piece.id, isChecked)}
                                  className="h-4 w-4 accent-cordel-wood cursor-pointer shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className={`text-xs font-bold truncate ${
                                    isChecked ? 'line-through opacity-60 text-encre-noire' : 'text-encre-noire'
                                  }`}>
                                    {piece.name}
                                  </span>
                                  <span className="text-[8px] font-semibold text-cordel-master-dark opacity-70">
                                    {piece.isMandatory !== false ? "★ Obligatoire" : "Optionnel"}
                                  </span>
                                </div>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleOpenTutorial(piece)}
                                className="text-[8px] font-black uppercase tracking-wider bg-cordel-bg hover:bg-cordel-bg-light border border-encre-noire px-2 py-1 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
                                title="Voir la fiche dans l'Atelier Couture"
                              >
                                🧵 Tuto
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CordelCard>
            );
          })}
        </div>
      )}

      {/* Interactive Piece Action Modal (when clicking a marker on Mannequin) */}
      {actionPiece && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-sm">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg shadow-2xl">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <div>
                  <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase tracking-wider mb-1 inline-block">
                    📌 Pièce de costume
                  </span>
                  <h3 className="font-cactus font-black text-base text-encre-noire tracking-wide">
                    {actionPiece.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActionPiece(null)}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status & Location badges */}
              <div className="flex items-center gap-2">
                <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] uppercase">
                  Location: {actionPiece.emplacement || 'Corps'}
                </span>
                {actionPiece.isMandatory !== false ? (
                  <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase">
                    ★ Obligatoire
                  </span>
                ) : (
                  <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] uppercase opacity-80">
                    Optionnel
                  </span>
                )}
              </div>

              {/* Validation Action Button */}
              {(() => {
                const costumeChecklist = userChecklist[actionPiece.costumeId] || {};
                const isChecked = Boolean(costumeChecklist[actionPiece.id]);

                return (
                  <div className="flex flex-col gap-3.5 pt-1">
                    <CordelButton
                      type="button"
                      variant={isChecked ? "default" : "ocre"}
                      useExtremeBorder={true}
                      onClick={async () => {
                        await handleTogglePiece(actionPiece.costumeId, actionPiece.id, isChecked);
                        setActionPiece(null);
                      }}
                      className="w-full py-2.5 text-xs font-black uppercase tracking-wider"
                    >
                      {isChecked ? "↩️ Marquer comme non possédé" : "✅ Je l'ai fabriqué / Je l'ai"}
                    </CordelButton>

                    <CordelButton
                      type="button"
                      variant="default"
                      onClick={() => {
                        handleOpenTutorial(actionPiece);
                        setActionPiece(null);
                      }}
                      className="w-full py-2 text-xs font-bold uppercase tracking-wider"
                    >
                      🧵 Voir dans l'Atelier Couture
                    </CordelButton>
                  </div>
                );
              })()}
            </CordelCard>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {activeTutorialPiece && (
        <PieceTutorialModal
          piece={activeTutorialPiece}
          workshop={activeTutorialWorkshop}
          onClose={() => {
            setActiveTutorialPiece(null);
            setActiveTutorialWorkshop(null);
          }}
        />
      )}
    </div>
  );
}
