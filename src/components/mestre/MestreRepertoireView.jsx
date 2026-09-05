import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import RepertoirePieceModal from './RepertoirePieceModal';
import ProgramPieceModal from './ProgramPieceModal';
import useConfirm from '../../hooks/useConfirm';

/**
 * Vue principale du Répertoire de la troupe (Mestria).
 * Classeur central de tous les morceaux, rythmes et créations de la saison.
 *
 * @param {string} groupId - Identifiant du groupe/association
 * @param {Object} user - Données utilisateur de session
 * @param {Object} profileData - Profil adhérent
 * @param {string} sequenceurUrl - URL de base du Séquenceur
 */
export default function MestreRepertoireView({ groupId, user, profileData, sequenceurUrl }) {
  const { confirm } = useConfirm();
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [seasonFilter, setSeasonFilter] = useState('saison'); // 'saison' | 'chantier' | 'archive' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Gestion des modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pieceToEdit, setPieceToEdit] = useState(null);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [pieceToProgram, setPieceToProgram] = useState(null);

  // Notification toast
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const [fetchError, setFetchError] = useState(null);

  // Écoute en temps réel de la collection repertoire
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setFetchError(null);

    const colRef = collection(db, 'associations', groupId, 'repertoire');
    const unsubscribe = onSnapshot(
      colRef,
      (snap) => {
        const fetched = [];
        snap.forEach((d) => {
          fetched.push({ id: d.id, ...d.data() });
        });
        // Tri alphabétique par titre
        fetched.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        setPieces(fetched);
        setLoading(false);
        setFetchError(null);
      },
      (err) => {
        console.error("Erreur lors de l'écoute du répertoire :", err);
        setFetchError("Impossible d'accéder au répertoire. Vérifiez vos autorisations d'accès.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Compteurs par statut de saison
  const counts = useMemo(() => {
    let saison = 0;
    let chantier = 0;
    let archive = 0;

    pieces.forEach((p) => {
      if (p.statutSaison === 'saison') saison++;
      else if (p.statutSaison === 'chantier') chantier++;
      else if (p.statutSaison === 'archive') archive++;
    });

    return {
      saison,
      chantier,
      archive,
      all: pieces.length
    };
  }, [pieces]);

  // Morceaux filtrés par saison et recherche
  const filteredPieces = useMemo(() => {
    return pieces.filter((p) => {
      // Filtre de saison
      if (seasonFilter !== 'all' && p.statutSaison !== seasonFilter) {
        return false;
      }
      // Filtre de recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitre = (p.titre || '').toLowerCase().includes(q);
        const inNotes = (p.notes || '').toLowerCase().includes(q);
        return inTitre || inNotes;
      }
      return true;
    });
  }, [pieces, seasonFilter, searchQuery]);

  // Suppression d'un morceau
  const handleDeletePiece = async (piece) => {
    const isOk = await confirm({
      title: "Supprimer du répertoire",
      message: `Êtes-vous sûr de vouloir supprimer définitivement le morceau « ${piece.titre} » du classeur de répertoire ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });

    if (!isOk) return;

    try {
      const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
      await deleteDoc(pieceRef);
      showToast(`« ${piece.titre} » retiré du répertoire.`);
    } catch (e) {
      console.error("Erreur suppression morceau répertoire :", e);
      alert("Erreur lors de la suppression.");
    }
  };

  // Ouverture modale d'ajout
  const handleOpenAddModal = () => {
    setPieceToEdit(null);
    setIsEditModalOpen(true);
  };

  // Ouverture modale d'édition
  const handleOpenEditModal = (piece) => {
    setPieceToEdit(piece);
    setIsEditModalOpen(true);
  };

  // Ouverture modale de programmation dans l'Agenda
  const handleOpenProgramModal = (piece) => {
    setPieceToProgram(piece);
    setIsProgramModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 text-left select-none w-full max-w-5xl mx-auto">
      {/* Toast de confirmation */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 p-3 bg-emerald-800 text-white text-xs font-black uppercase tracking-wider rounded shadow-[2px_2px_0px_0px_#181716] border border-emerald-900 animate-bounce">
          ✓ {toastMsg}
        </div>
      )}

      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b-2 border-dashed border-cordel-master-dark/30">
        <div>
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <span>📜</span>
            <span>Direction Artistique — Répertoire de la Troupe</span>
          </h2>
          <p className="text-[11px] font-bold text-encre-noire/70 mt-0.5">
            Classeur central des morceaux, rythmes et intentions artistiques de la saison
          </p>
        </div>

        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={handleOpenAddModal}
          className="py-1.5 px-4 text-xs font-black uppercase tracking-wider shrink-0"
        >
          ➕ Ajouter un morceau
        </CordelButton>
      </div>

      {/* Barre de filtrage & Recherche */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Filtres de saison */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setSeasonFilter('saison')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'saison'
                ? 'bg-green-700 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            🟢 Au programme ({counts.saison})
          </button>

          <button
            type="button"
            onClick={() => setSeasonFilter('chantier')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'chantier'
                ? 'bg-amber-600 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            🟡 En préparation ({counts.chantier})
          </button>

          <button
            type="button"
            onClick={() => setSeasonFilter('archive')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'archive'
                ? 'bg-stone-700 text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            ⚪ Archives ({counts.archive})
          </button>

          <button
            type="button"
            onClick={() => setSeasonFilter('all')}
            className={`px-3 py-1.5 text-xs font-black uppercase rounded-[4px_6px_3px_5px] transition-all cursor-pointer border ${
              seasonFilter === 'all'
                ? 'bg-cordel-wood text-white border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                : 'bg-black/5 dark:bg-white/10 text-cordel-master-dark/70 hover:bg-black/10 border-encre-noire/20'
            }`}
          >
            Tous ({counts.all})
          </button>
        </div>

        {/* Barre de recherche rapide */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="🔍 Rechercher un morceau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full text-xs font-bold py-1.5 px-3 bg-cordel-bg-light border-2 border-encre-noire rounded"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="p-3 bg-red-100 border-2 border-[var(--color-cordel-rouge,#8b2a1a)] text-[var(--color-cordel-rouge,#8b2a1a)] rounded font-bold text-xs flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>{fetchError}</span>
        </div>
      )}

      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">
            ⏳ Chargement du répertoire...
          </span>
        </div>
      ) : filteredPieces.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={true} className="p-10 text-center flex flex-col items-center gap-3">
          <span className="text-4xl">📜</span>
          <p className="text-xs font-bold opacity-75">
            {searchQuery
              ? "Aucun morceau ne correspond à votre recherche."
              : "Aucun morceau dans cette catégorie de répertoire."}
          </p>
          {!searchQuery && (
            <CordelButton
              type="button"
              variant="ocre"
              onClick={handleOpenAddModal}
              className="py-1 px-3 text-xs font-black uppercase tracking-wider mt-1"
            >
              ➕ Ajouter un premier morceau
            </CordelButton>
          )}
        </CordelCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredPieces.map((piece) => {
            const isPret = piece.etatValidation === 'pret';

            // Lien Séquenceur
            let targetSeqUrl = '';
            if (piece.sequenceurFileUrl) {
              const baseUrl = sequenceurUrl || 'https://sequenceur.app';
              targetSeqUrl = baseUrl.includes('?')
                ? `${baseUrl}&file=${encodeURIComponent(piece.sequenceurFileUrl)}`
                : `${baseUrl}?file=${encodeURIComponent(piece.sequenceurFileUrl)}`;
            }

            return (
              <div
                key={piece.id}
                className="border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[2.5px_2.5px_0px_0px_#181716] bg-white p-4 flex flex-col justify-between gap-3 hover:shadow-[3.5px_3.5px_0px_0px_#181716] transition-all text-left"
              >
                {/* Haut de la carte : Titre & Pastille d'état */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-sm md:text-base text-encre-noire leading-tight">
                        {piece.titre}
                      </h3>
                      {/* Statut de saison sous forme de sous-titre si vue 'all' */}
                      {seasonFilter === 'all' && (
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-master-dark/60 mt-0.5">
                          {piece.statutSaison === 'saison'
                            ? '🟢 Au programme cette année'
                            : piece.statutSaison === 'chantier'
                              ? '🟡 En préparation'
                              : '⚪ Archives'}
                        </span>
                      )}
                    </div>

                    {/* Pastille de maturité artistique */}
                    <span
                      className={`px-2.5 py-0.5 border border-dashed rounded-[4px_6px_3px_5px] font-black uppercase text-[9.5px] shrink-0 ${
                        isPret
                          ? 'bg-green-100 text-green-900 border-green-400'
                          : 'bg-amber-100 text-amber-900 border-amber-400'
                      }`}
                    >
                      {isPret ? '🟢 Validé / Prêt' : '🟡 En chantier'}
                    </span>
                  </div>

                  {/* Notes du Mestre */}
                  {piece.notes && (
                    <p className="text-[11px] text-encre-noire/80 bg-[#fdfaf2] p-2 rounded border border-dashed border-encre-noire/15 italic leading-snug">
                      💡 {piece.notes}
                    </p>
                  )}

                  {/* Badges discrets des liaisons actives */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {piece.sequenceurFileUrl && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-50 text-amber-900 border border-amber-300">
                        <span>🥁</span>
                        <span>Séquenceur</span>
                      </span>
                    )}

                    {piece.toadaDocId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-emerald-50 text-emerald-900 border border-emerald-300">
                        <span>🗣️</span>
                        <span>Toada</span>
                      </span>
                    )}

                    {piece.dancadorChoreoId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-pink-50 text-pink-900 border border-pink-300">
                        <span>💃</span>
                        <span>Danse</span>
                      </span>
                    )}

                    {piece.cultureDocId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase rounded bg-blue-50 text-blue-900 border border-blue-300">
                        <span>📖</span>
                        <span>Culture</span>
                      </span>
                    )}

                    {!piece.sequenceurFileUrl && !piece.toadaDocId && !piece.dancadorChoreoId && !piece.cultureDocId && (
                      <span className="text-[9.5px] italic text-encre-noire/50">
                        Autonome (joué de mémoire)
                      </span>
                    )}
                  </div>
                </div>

                {/* Bas de la carte : Barre d'actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed border-cordel-master-dark/15 mt-1">
                  {/* Bouton pour écouter dans le séquenceur si disponible */}
                  {targetSeqUrl ? (
                    <a
                      href={targetSeqUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:underline inline-flex items-center gap-1"
                    >
                      <span>🎧</span>
                      <span>Écouter</span>
                    </a>
                  ) : (
                    <div />
                  )}

                  {/* Actions rapides */}
                  <div className="flex items-center gap-1.5">
                    <CordelButton
                      type="button"
                      variant="ocre"
                      useExtremeBorder={false}
                      onClick={() => handleOpenProgramModal(piece)}
                      className="py-1 px-2.5 text-[9.5px] uppercase tracking-wider font-black"
                      title="Ajouter au fil conducteur d'une répétition ou d'un concert"
                    >
                      ➕ Programmer
                    </CordelButton>

                    <CordelButton
                      type="button"
                      variant="default"
                      useExtremeBorder={false}
                      onClick={() => handleOpenEditModal(piece)}
                      className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-stone-100 hover:bg-stone-200 border border-encre-noire/20"
                      title="Modifier les informations"
                    >
                      ✏️
                    </CordelButton>

                    <CordelButton
                      type="button"
                      variant="default"
                      useExtremeBorder={false}
                      onClick={() => handleDeletePiece(piece)}
                      className="py-1 px-2 text-[9.5px] uppercase tracking-wider font-black bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                      title="Supprimer du répertoire"
                    >
                      🗑️
                    </CordelButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'ajout / modification */}
      <RepertoirePieceModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        groupId={groupId}
        pieceToEdit={pieceToEdit}
        onSaveSuccess={(saved) => {
          showToast(`Morceau « ${saved.titre} » enregistré.`);
        }}
      />

      {/* Modale d'injection dans l'Agenda */}
      <ProgramPieceModal
        isOpen={isProgramModalOpen}
        onClose={() => setIsProgramModalOpen(false)}
        groupId={groupId}
        piece={pieceToProgram}
        onSuccess={(event, item) => {
          const evName = event ? (event.titre || event.title || 'l\'événement') : 'l\'événement';
          showToast(`« ${item.titre} » programmé sur ${evName} !`);
        }}
      />
    </div>
  );
}
