import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import EventRepertoireItemCard from './EventRepertoireItemCard';
import { canonicalizeGroupId } from '../../utils/tenantUtils';
import { useTranslation } from '../LanguageContext';

/**
 * EventRepertoireProgramSelector - Sélecteur de morceaux du Répertoire pour l'Agenda
 * Remplace la sélection brute de fichiers du séquenceur par les fiches réelles du Répertoire.
 * Permet la sélection par cases à cocher / menu déroulant et la saisie de notes d'intention par morceau.
 */
export default function EventRepertoireProgramSelector({
  formData,
  setFormData,
  groupId,
  disabled = false
}) {
  const { t } = useTranslation();
  const [allPieces, setAllPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPieceToAdd, setSelectedPieceToAdd] = useState('');

  // 1. Écoute temps réel du Répertoire de l'association (avec normalisation de casse canonique)
  useEffect(() => {
    const rawGroup = groupId || 'Samambaia';
    const targetGroupId = canonicalizeGroupId(rawGroup) || rawGroup;
    if (!targetGroupId) {
      setAllPieces([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const colRef = collection(db, 'associations', targetGroupId, 'repertoire');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });

        // Repli résilient si la collection avec la casse canonique est vide
        if (list.length === 0 && targetGroupId !== targetGroupId.toLowerCase()) {
          const fallbackRef = collection(db, 'associations', targetGroupId.toLowerCase(), 'repertoire');
          onSnapshot(fallbackRef, (fallbackSnap) => {
            if (!fallbackSnap.empty) {
              const fallbackList = [];
              fallbackSnap.forEach((d) => fallbackList.push({ id: d.id, ...d.data() }));
              setAllPieces(fallbackList);
            } else {
              setAllPieces([]);
            }
            setLoading(false);
          }, () => {
            setAllPieces([]);
            setLoading(false);
          });
          return;
        }

        setAllPieces(list);
        setLoading(false);
      },
      (err) => {
        console.warn("EventRepertoireProgramSelector - Erreur lecture répertoire :", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // 2. Filtrage des morceaux actifs (saison, chantier ou non archivés)
  const activePieces = useMemo(() => {
    return allPieces
      .filter((p) => {
        if (!p) return false;
        // Exclure uniquement les morceaux explicitement archivés
        if (p.isArchived || p.archived || p.statutSaison === 'archive') return false;
        return true;
      })
      .sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
  }, [allPieces]);

  // Setlist actuelle et identifiants déjà sélectionnés
  const currentSetlist = useMemo(() => {
    return Array.isArray(formData.setlist) ? formData.setlist : [];
  }, [formData.setlist]);

  const selectedPieceIds = useMemo(() => {
    return new Set(currentSetlist.map((item) => item.pieceId || item.id));
  }, [currentSetlist]);

  // Morceaux non encore ajoutés pour le menu déroulant
  const availableToAdd = useMemo(() => {
    return activePieces.filter((p) => !selectedPieceIds.has(p.id));
  }, [activePieces, selectedPieceIds]);

  // Filtrage pour la vue cases à cocher
  const filteredForCheckboxes = useMemo(() => {
    if (!searchTerm.trim()) return activePieces;
    const term = searchTerm.toLowerCase().trim();
    return activePieces.filter((p) => (p.titre || '').toLowerCase().includes(term));
  }, [activePieces, searchTerm]);

  // Détermination des badges de disciplines d'un morceau
  const getDisciplineBadges = (item) => {
    const badges = [];
    const hasPercu = Boolean(item.sequenceurId || item.sequenceurFileUrl || item.jsonUrl || item.tracks || (!item.toadaDocId && !item.dancadorChoreoId));
    const hasChant = Boolean(item.toadaDocId || item.lyrics || item.paroles);
    const hasDanse = Boolean(item.dancadorChoreoId);
    const hasCulture = Boolean(item.cultureDocId || (Array.isArray(item.cultureDocIds) && item.cultureDocIds.length > 0) || item.histoire);

    if (hasPercu) badges.push({ key: 'percu', label: 'Percussion', emoji: '🥁', cls: 'bg-emerald-50 text-emerald-900 border-emerald-300' });
    if (hasChant) badges.push({ key: 'chant', label: 'Toada/Chant', emoji: '🗣️', cls: 'bg-amber-50 text-amber-900 border-amber-300' });
    if (hasDanse) badges.push({ key: 'danse', label: 'Danse', emoji: '💃', cls: 'bg-pink-50 text-pink-900 border-pink-300' });
    if (hasCulture) badges.push({ key: 'culture', label: 'Culture', emoji: '📖', cls: 'bg-blue-50 text-blue-900 border-blue-300' });

    return badges;
  };

  // Construction d'un item de setlist propre et sécurisé (zéro undefined)
  const buildSetlistItem = (piece, customNote = '') => ({
    id: piece.id || `morceau_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    pieceId: piece.id || piece.pieceId,
    repertoireId: piece.id || piece.repertoireId || null,
    titre: (piece.titre || 'Morceau sans titre').trim(),
    notes: (customNote !== undefined && customNote !== null ? customNote : (piece.notes || '')).trim(),
    sequenceurId: piece.sequenceurId || null,
    sequenceurType: piece.sequenceurType || null,
    sequenceurFileUrl: piece.sequenceurFileUrl || piece.jsonUrl || null,
    jsonUrl: piece.sequenceurFileUrl || piece.jsonUrl || null,
    audioUrl: piece.audioUrl || null,
    toadaDocId: piece.toadaDocId || null,
    cultureDocId: piece.cultureDocId || (Array.isArray(piece.cultureDocIds) && piece.cultureDocIds.length > 0 ? piece.cultureDocIds[0] : null) || null,
    cultureDocIds: Array.isArray(piece.cultureDocIds) ? piece.cultureDocIds : (piece.cultureDocId ? [piece.cultureDocId] : []),
    dancadorChoreoId: piece.dancadorChoreoId || null,
    videos: Array.isArray(piece.videos) ? piece.videos : [],
    signalIds: Array.isArray(piece.signalIds) ? piece.signalIds : []
  });

  // Ajout d'un morceau
  const handleAddPiece = (pieceId) => {
    if (!pieceId) return;
    const piece = activePieces.find((p) => p.id === pieceId);
    if (!piece) return;

    const newItem = buildSetlistItem(piece);
    const updated = [...currentSetlist, newItem];
    const updatedPatterns = updated.map((s) => s.sequenceurId).filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      setlist: updated,
      linkedPatterns: updatedPatterns
    }));
    setSelectedPieceToAdd('');
  };

  // Retrait d'un morceau
  const handleRemovePiece = (targetId) => {
    const updated = currentSetlist.filter((m) => (m.pieceId || m.id) !== targetId);
    const updatedPatterns = updated.map((s) => s.sequenceurId).filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      setlist: updated,
      linkedPatterns: updatedPatterns
    }));
  };

  // Modification de la note d'intention
  const handleNoteChange = (targetId, noteText) => {
    const updated = currentSetlist.map((item) => {
      if ((item.pieceId || item.id) === targetId) {
        return { ...item, notes: noteText };
      }
      return item;
    });

    setFormData((prev) => ({
      ...prev,
      setlist: updated
    }));
  };

  return (
    <div className="flex flex-col gap-2 pt-1 text-left">
      {/* En-tête de section */}
      <div className="flex items-center justify-between">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
          <span>📜</span>
          <span>{t('agenda.repertoirePiecesProgramTitle') || "Morceaux du répertoire au programme"}</span>
        </label>
        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-cordel-wood/10 text-cordel-wood">
          {t('agenda.countInProgram', { count: currentSetlist.length }) || `${currentSetlist.length} au programme`}
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-cordel-wood animate-pulse">Chargement du répertoire...</p>
      ) : activePieces.length === 0 ? (
        <p className="text-xs italic text-encre-noire/60">Aucun morceau actif trouvé dans le Répertoire.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Barre d'action rapide : Menu d'ajout et bascule vers les cases à cocher */}
          <div className="flex flex-row items-center gap-2 w-full">
            <select
              value={selectedPieceToAdd}
              onChange={(e) => handleAddPiece(e.target.value)}
              disabled={disabled || availableToAdd.length === 0}
              className="theme-input text-xs font-bold py-1.5 bg-white flex-1 min-w-0 truncate cursor-pointer"
            >
              <option value="">
                {availableToAdd.length === 0 ? "✓ Tous les morceaux sont au programme" : (t('agenda.addPiecePlaceholder') || "+ Ajouter un morceau du répertoire...")}
              </option>
              {availableToAdd.map((p) => {
                const b = getDisciplineBadges(p).map((x) => x.emoji).join(' ');
                const icon = p.statutSaison === 'chantier' ? '🔨 ' : '📜 ';
                const chantierLabel = p.statutSaison === 'chantier' ? ' (En chantier)' : '';
                return (
                  <option key={p.id} value={p.id}>
                    {icon}{p.titre}{chantierLabel} {b ? `(${b})` : ''}
                  </option>
                );
              })}
            </select>

            <button
              type="button"
              onClick={() => setShowCheckboxes(!showCheckboxes)}
              title={showCheckboxes ? "Fermer le classeur" : "Parcourir le répertoire"}
              aria-label={showCheckboxes ? "Fermer le classeur" : "Parcourir le répertoire"}
              className="shrink-0 flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 rounded border border-[var(--color-cordel-encre,#181716)] bg-white text-sm font-bold uppercase hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-colors"
            >
              <span className="text-base">{showCheckboxes ? '✕' : '📋'}</span>
              <span className="hidden sm:inline ml-1.5 tracking-wide">
                {showCheckboxes ? 'Fermer' : (t('agenda.btnBrowse') || 'Parcourir')}
              </span>
            </button>
          </div>

          {/* Tiroir déroulant des cases à cocher avec recherche */}
          {showCheckboxes && (
            <div className="p-2.5 rounded border border-dashed border-cordel-master-dark/30 bg-[#fdfaf2] flex flex-col gap-2 animate-fadeIn">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer les morceaux par titre..."
                className="theme-input text-xs py-1 px-2 bg-white w-full"
              />
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {filteredForCheckboxes.map((piece) => {
                  const isChecked = selectedPieceIds.has(piece.id);
                  const badges = getDisciplineBadges(piece);
                  return (
                    <label
                      key={piece.id}
                      className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer transition-colors select-none ${
                        isChecked ? 'bg-emerald-100/70 font-bold' : 'hover:bg-black/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => (isChecked ? handleRemovePiece(piece.id) : handleAddPiece(piece.id))}
                          className="w-3.5 h-3.5 accent-[var(--color-cordel-vert,#2d6a4f)] cursor-pointer"
                        />
                        <span className="truncate text-encre-noire">{piece.titre}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {badges.map((b) => (
                          <span key={b.key} className="text-[10px]" title={b.label}>
                            {b.emoji}
                          </span>
                        ))}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Panier des morceaux au programme avec champs de note d'intention */}
          {currentSetlist.length > 0 && (
            <div className="space-y-2 pt-1">
              {currentSetlist.map((item) => (
                <EventRepertoireItemCard
                  key={item.pieceId || item.id}
                  item={item}
                  badges={getDisciplineBadges(item)}
                  disabled={disabled}
                  onRemove={handleRemovePiece}
                  onNoteChange={handleNoteChange}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
