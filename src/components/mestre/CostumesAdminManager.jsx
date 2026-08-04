import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';

/**
 * CostumesAdminManager Component
 * Admin tool for creating Costumes and adding/configuring Pièces (Obligatoire/Optionnelle)
 * and linking them to Atelier Couture tutorial notes or workshops.
 */
export default function CostumesAdminManager({ groupId }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [costumes, setCostumes] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Costume Form State
  const [showCostumeModal, setShowCostumeModal] = useState(false);
  const [editingCostume, setEditingCostume] = useState(null);
  const [costumeForm, setCostumeForm] = useState({
    title: '',
    targetCategory: 'Danse',
    description: '',
    pieces: []
  });

  // New Piece Form State inside modal
  const [pieceForm, setPieceForm] = useState({
    name: '',
    emplacement: 'torse',
    isMandatory: true,
    description: '',
    tutorialId: ''
  });

  // Fetch costumes
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'costumes'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      fetched.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      setCostumes(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Fetch workshops for tutorial linking
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, 'workshops'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setWorkshops(fetched);
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [groupId]);

  const handleOpenAddCostume = () => {
    setEditingCostume(null);
    setCostumeForm({
      title: '',
      targetCategory: 'Danse',
      description: '',
      pieces: []
    });
    setPieceForm({ name: '', emplacement: 'torse', isMandatory: true, description: '', tutorialId: '' });
    setShowCostumeModal(true);
  };

  const handleOpenEditCostume = (costume) => {
    setEditingCostume(costume);
    setCostumeForm({
      title: costume.title || '',
      targetCategory: costume.targetCategory || 'Danse',
      description: costume.description || '',
      pieces: costume.pieces || []
    });
    setPieceForm({ name: '', emplacement: 'torse', isMandatory: true, description: '', tutorialId: '' });
    setShowCostumeModal(true);
  };

  const handleAddPieceToCostume = () => {
    if (!pieceForm.name.trim()) return;
    const newPiece = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: pieceForm.name.trim(),
      emplacement: pieceForm.emplacement || 'torse',
      isMandatory: pieceForm.isMandatory,
      description: pieceForm.description.trim(),
      tutorialId: pieceForm.tutorialId || ''
    };

    setCostumeForm(prev => ({
      ...prev,
      pieces: [...prev.pieces, newPiece]
    }));

    setPieceForm({ name: '', emplacement: 'torse', isMandatory: true, description: '', tutorialId: '' });
  };

  const handleRemovePieceFromCostume = (pieceId) => {
    setCostumeForm(prev => ({
      ...prev,
      pieces: prev.pieces.filter(p => p.id !== pieceId)
    }));
  };

  const handleSaveCostume = async (e) => {
    e.preventDefault();
    if (!costumeForm.title.trim()) {
      alert("Veuillez saisir un titre pour le costume.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        groupId,
        title: costumeForm.title.trim(),
        targetCategory: costumeForm.targetCategory,
        description: costumeForm.description.trim(),
        pieces: costumeForm.pieces,
        updatedAt: new Date()
      };

      if (editingCostume) {
        await updateDoc(doc(db, 'costumes', editingCostume.id), payload);
      } else {
        payload.createdAt = new Date();
        await addDoc(collection(db, 'costumes'), payload);
      }

      setShowCostumeModal(false);
    } catch (err) {
      console.error("Error saving costume:", err);
      alert("Erreur lors de l'enregistrement du costume : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCostume = async (costumeId) => {
    const isOk = await confirm({
      title: "Supprimer le costume",
      message: "Êtes-vous sûr de vouloir supprimer ce costume ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    try {
      await deleteDoc(doc(db, 'costumes', costumeId));
    } catch (err) {
      console.error("Error deleting costume:", err);
      alert("Erreur lors de la suppression : " + (err.message || err));
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full">
      {/* Top Controls */}
      <div className="flex justify-between items-center pb-2 border-b border-dashed border-cordel-master-dark/15">
        <div>
          <h3 className="font-cactus font-black text-sm text-cordel-wood uppercase tracking-wider">
            🎭 Gestion des Costumes & Pièces
          </h3>
          <p className="text-[10px] text-cordel-master-dark opacity-75">
            Définissez les costumes de la troupe, associez leurs pièces et les instructions de l'Atelier Couture.
          </p>
        </div>
        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={handleOpenAddCostume}
          className="text-[10px] px-3 py-1.5 font-black uppercase tracking-wider shrink-0"
        >
          + Créer un Costume
        </CordelButton>
      </div>

      {/* Costumes List */}
      {loading ? (
        <div className="py-8 text-center text-xs opacity-60 animate-pulse">⏳ Chargement des costumes...</div>
      ) : costumes.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center bg-cordel-bg">
          <p className="text-xs italic text-cordel-master-dark/70">
            Aucun costume créé. Cliquez sur "+ Créer un Costume" pour commencer.
          </p>
        </CordelCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {costumes.map(costume => (
            <CordelCard key={costume.id} variant="default" useExtremeBorder={true} className="p-4 flex flex-col justify-between gap-3 bg-cordel-bg">
              <div>
                <div className="flex justify-between items-start gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2">
                  <div>
                    <h4 className="font-black text-xs text-encre-noire uppercase tracking-wider">
                      {costume.title}
                    </h4>
                    <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] uppercase mt-0.5 inline-block">
                      {costume.targetCategory || 'Tous'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCostume(costume)}
                      className="text-[9px] font-bold px-2 py-0.5 bg-cordel-bg-light border border-encre-noire rounded hover:bg-white cursor-pointer"
                    >
                      ✏️ Éditer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCostume(costume.id)}
                      className="text-[9px] font-bold px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {costume.description && (
                  <p className="text-[10px] italic text-cordel-master-dark opacity-75 mt-2">
                    {costume.description}
                  </p>
                )}

                {/* Pieces list */}
                <div className="mt-3 flex flex-col gap-1.5">
                  <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-70">
                    Pièces associées ({costume.pieces?.length || 0}) :
                  </span>
                  {(!costume.pieces || costume.pieces.length === 0) ? (
                    <span className="text-[9px] italic opacity-50">Aucune pièce liée.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {costume.pieces.map(p => (
                        <span
                          key={p.id}
                          className={`text-[9px] px-2 py-0.5 rounded border border-dashed flex items-center gap-1 font-bold ${
                            p.isMandatory !== false 
                              ? 'bg-cordel-master-dark/10 text-encre-noire border-cordel-wood' 
                              : 'bg-white/40 text-cordel-master-dark/80 border-cordel-master-dark/20'
                          }`}
                        >
                          {p.name} {p.isMandatory !== false ? '(Obligatoire)' : '(Optionnelle)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CordelCard>
          ))}
        </div>
      )}

      {/* Costume Form Modal */}
      {showCostumeModal && (
        <div
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && !saving && setShowCostumeModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-xs select-none outline-none animate-fade-in"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-cordel-bg shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
            {/* 1. Header (Fixe) */}
            <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex justify-between items-center bg-cordel-bg">
              <h3 className="font-cactus font-black text-base text-encre-noire tracking-wider uppercase">
                {editingCostume ? '✏️ Modifier le Costume' : '➕ Créer un nouveau Costume'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCostumeModal(false)}
                className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                title="Fermer (Échap)"
              >
                ✕
              </button>
            </div>

            {/* Form Wrapper */}
            <form onSubmit={handleSaveCostume} className="flex flex-col flex-1 overflow-hidden">
              {/* 2. Body (Défilable verticalement) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Titre du Costume *
                  </label>
                  <input
                    type="text"
                    value={costumeForm.title}
                    onChange={(e) => setCostumeForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Costume Blanc Percussion"
                    required
                    disabled={saving}
                    className="theme-input text-xs font-bold w-full"
                  />
                </div>

                {/* Target Category */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Catégorie Cible
                  </label>
                  <select
                    value={costumeForm.targetCategory}
                    onChange={(e) => setCostumeForm(prev => ({ ...prev, targetCategory: e.target.value }))}
                    disabled={saving}
                    className="theme-input text-xs font-bold w-full bg-cordel-bg-light"
                  >
                    <option value="Danse">💃 Danse</option>
                    <option value="Percussion">🥁 Percussion</option>
                    <option value="Tous">🌐 Tous les pupitres</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Description (facultative)
                  </label>
                  <textarea
                    value={costumeForm.description}
                    onChange={(e) => setCostumeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description du costume, événements associés..."
                    rows={2}
                    disabled={saving}
                    className="theme-input text-xs w-full resize-none"
                  />
                </div>

                {/* Section Pièces du Costume */}
                <div className="border-t border-dashed border-cordel-master-dark/20 pt-3 flex flex-col gap-3">
                  <h4 className="font-extrabold text-xs text-cordel-wood uppercase tracking-wider">
                    📌 Pièces composant ce costume ({costumeForm.pieces.length})
                  </h4>

                  {/* List of existing pieces in form */}
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {costumeForm.pieces.length === 0 ? (
                      <span className="text-[10px] italic opacity-60">Aucune pièce ajoutée pour le moment.</span>
                    ) : (
                      costumeForm.pieces.map((piece, index) => (
                        <div key={piece.id || index} className="p-2.5 bg-white/40 border border-dashed border-cordel-master-dark/20 rounded flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-encre-noire">
                              {piece.name}
                            </span>
                            <span className="text-[9px] text-cordel-master-dark opacity-75">
                              {piece.isMandatory !== false ? "★ Obligatoire" : "Optionnelle"}
                              {piece.tutorialNotes ? " • Tuto enregistré" : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePieceFromCostume(index)}
                            className="text-red-700 hover:text-red-900 font-extrabold text-xs cursor-pointer px-2 py-0.5"
                          >
                            Supprimer
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Form to add a piece */}
                  <div className="p-3 bg-cordel-master-light/10 border border-cordel-master-dark/20 rounded flex flex-col gap-2 mt-1">
                    <span className="text-[10px] font-black uppercase text-cordel-wood">
                      ➕ Ajouter une pièce à ce costume
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nom de la pièce (ex: Jupe Roda)..."
                        value={pieceForm.name}
                        onChange={(e) => setPieceForm(prev => ({ ...prev, name: e.target.value }))}
                        className="theme-input text-xs font-bold"
                      />
                      <select
                        value={pieceForm.emplacement || 'torse'}
                        onChange={(e) => setPieceForm(prev => ({ ...prev, emplacement: e.target.value }))}
                        className="theme-input text-xs font-bold bg-cordel-bg-light"
                      >
                        <option value="tete">👑 Tête / Accessoire haut</option>
                        <option value="torse">👕 Torse / Haut</option>
                        <option value="jambes">👖 Jambes / Bas</option>
                        <option value="pieds">👟 Pieds / Chaussures</option>
                        <option value="accessoire">🎒 Accessoire / Portatif</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-encre-noire cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pieceForm.isMandatory !== false}
                          onChange={(e) => setPieceForm(prev => ({ ...prev, isMandatory: e.target.checked }))}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span>Pièce obligatoire pour ce costume</span>
                      </label>
                    </div>



                    {/* Short Description / Materials */}
                    <input
                      type="text"
                      placeholder="Description / Matériaux (ex: Fait avec des perles de l'association)"
                      value={pieceForm.description || ''}
                      onChange={(e) => setPieceForm(prev => ({ ...prev, description: e.target.value }))}
                      className="theme-input text-xs font-bold w-full"
                    />

                    {/* Tutorial dropdown selection */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                        🧵 Liaison avec un tutoriel de l'Atelier Couture
                      </label>
                      <select
                        value={pieceForm.tutorialId || ''}
                        onChange={(e) => setPieceForm(prev => ({ ...prev, tutorialId: e.target.value }))}
                        className="theme-input text-xs font-bold bg-white"
                      >
                        <option value="">-- Aucun tutoriel lié --</option>
                        {workshops.map(ws => (
                          <option key={ws.id} value={ws.id}>📖 {ws.titre}</option>
                        ))}
                      </select>
                      <span className="text-[8px] text-cordel-master-dark opacity-70 italic">
                        Lier cette pièce à un tutoriel débloque le bouton "Tutoriel de fabrication" sur la fiche du membre.
                      </span>
                    </div>

                    <div className="flex justify-end mt-1">
                      <CordelButton
                        type="button"
                        variant="default"
                        onClick={handleAddPieceToCostume}
                        disabled={!pieceForm.name.trim()}
                        className="text-[9px] py-1 px-3 uppercase font-black"
                      >
                        + Valider cette pièce
                      </CordelButton>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => setShowCostumeModal(false)}
                    disabled={saving}
                    className="py-2 px-4 text-xs font-bold uppercase"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={saving || costumeForm.pieces.length === 0}
                    className="py-2 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer le Costume"}
                  </CordelButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
