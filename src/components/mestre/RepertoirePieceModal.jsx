import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useSequencerRhythms } from '../../hooks/useSequencerRhythms';
import { useDancadorChoreographies } from '../../hooks/useDancadorData';

/**
 * Modale de création et d'édition d'un morceau du répertoire musical.
 * Gère les métadonnées de saison, l'état de validation artistique
 * et les liaisons optionnelles transversales (Toada, Séquenceur, Dançador, Culture).
 *
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture
 * @param {string} groupId - Identifiant de l'association
 * @param {Object|null} pieceToEdit - Objet morceau à éditer ou null pour création
 * @param {Function} onSaveSuccess - Callback après enregistrement réussi
 */
export default function RepertoirePieceModal({
  isOpen,
  onClose,
  groupId,
  pieceToEdit = null,
  onSaveSuccess
}) {
  // Champs du formulaire
  const [titre, setTitre] = useState('');
  const [statutSaison, setStatutSaison] = useState('saison'); // 'saison' | 'chantier' | 'archive'
  const [etatValidation, setEtatValidation] = useState('pret'); // 'pret' | 'a_faire'
  const [notes, setNotes] = useState('');

  // Liaisons optionnelles
  const [selectedToadaId, setSelectedToadaId] = useState('');
  const [selectedSeqUrl, setSelectedSeqUrl] = useState('');
  const [selectedChoreoId, setSelectedChoreoId] = useState('');
  const [selectedCultureId, setSelectedCultureId] = useState('');

  // Données pour les listes déroulantes
  const [toadasList, setToadasList] = useState([]);
  const [cultureDocsList, setCultureDocsList] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Hooks externes pour le Séquenceur et Dançador
  const { catalogRhythms, loadingRhythms } = useSequencerRhythms(groupId);
  const { choreographies, loading: loadingChoreos } = useDancadorChoreographies(groupId);

  // Initialisation à l'ouverture (création vs modification)
  useEffect(() => {
    if (!isOpen) return;

    if (pieceToEdit) {
      setTitre(pieceToEdit.titre || '');
      setStatutSaison(pieceToEdit.statutSaison || 'saison');
      setEtatValidation(pieceToEdit.etatValidation || 'pret');
      setNotes(pieceToEdit.notes || '');
      setSelectedToadaId(pieceToEdit.toadaDocId || '');
      setSelectedSeqUrl(pieceToEdit.sequenceurFileUrl || '');
      setSelectedChoreoId(pieceToEdit.dancadorChoreoId || '');
      setSelectedCultureId(pieceToEdit.cultureDocId || '');
    } else {
      // Valeurs par défaut pour un nouveau morceau
      setTitre('');
      setStatutSaison('saison');
      setEtatValidation('pret');
      setNotes('');
      setSelectedToadaId('');
      setSelectedSeqUrl('');
      setSelectedChoreoId('');
      setSelectedCultureId('');
    }
    setErrorMsg(null);
  }, [isOpen, pieceToEdit]);

  // Récupération des Toadas et fiches culturelles depuis la collection documents
  useEffect(() => {
    if (!isOpen || !groupId) return;

    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const qDocs = query(collection(db, 'documents'), where('groupId', '==', groupId));
        const snap = await getDocs(qDocs);
        const fetchedSongs = [];
        const fetchedCulture = [];

        snap.forEach((d) => {
          const data = d.data();
          if (data.type === 'song') {
            fetchedSongs.push({ id: d.id, ...data });
          } else if (data.type === 'culture_fiche' || data.type === 'fiche_pedagogique') {
            fetchedCulture.push({ id: d.id, ...data });
          }
        });

        // Tri alphabétique
        fetchedSongs.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
        fetchedCulture.sort((a, b) => (a.titre || a.name || '').localeCompare(b.titre || b.name || ''));

        setToadasList(fetchedSongs);
        setCultureDocsList(fetchedCulture);
      } catch (err) {
        console.error("Erreur lors de la récupération des documents du Varal :", err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  // Enregistrement sécurisé (anti-undefined Firestore)
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim()) {
      setErrorMsg("Veuillez renseigner le titre du morceau.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Trouver l'identifiant du rythme sélectionné si une URL est choisie
      let matchedSeqId = null;
      if (selectedSeqUrl && catalogRhythms.length > 0) {
        const found = catalogRhythms.find((r) => r.jsonUrl === selectedSeqUrl);
        if (found) matchedSeqId = found.id || null;
      }

      // Construction de l'objet strictement assaini
      const pieceData = {
        titre: titre.trim(),
        statutSaison: statutSaison || 'saison',
        etatValidation: etatValidation || 'pret',
        notes: (notes || '').trim(),
        sequenceurId: matchedSeqId || null,
        sequenceurFileUrl: selectedSeqUrl || null,
        dancadorChoreoId: selectedChoreoId || null,
        toadaDocId: selectedToadaId || null,
        cultureDocId: selectedCultureId || null,
        updatedAt: new Date().toISOString()
      };

      if (pieceToEdit?.id) {
        // Mise à jour d'un morceau existant
        const pieceRef = doc(db, 'associations', groupId, 'repertoire', pieceToEdit.id);
        await updateDoc(pieceRef, pieceData);
        if (onSaveSuccess) onSaveSuccess({ id: pieceToEdit.id, ...pieceData });
      } else {
        // Création d'un nouveau morceau
        pieceData.createdAt = new Date().toISOString();
        const colRef = collection(db, 'associations', groupId, 'repertoire');
        const docRef = await addDoc(colRef, pieceData);
        if (onSaveSuccess) onSaveSuccess({ id: docRef.id, ...pieceData });
      }

      onClose();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du morceau :", err);
      setErrorMsg("Erreur lors de l'enregistrement dans le répertoire.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <CordelCard className="w-full max-w-2xl p-6 flex flex-col gap-4 animate-scale-in bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="border-b-2 border-dashed border-cordel-wood/30 pb-3 flex items-center justify-between">
          <h3 className="text-base md:text-lg font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
            <span>📜</span>
            <span>{pieceToEdit ? "Modifier le morceau" : "Ajouter un morceau au répertoire"}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-black text-lg p-1 cursor-pointer transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-100 border border-red-400 text-red-800 text-xs font-bold rounded">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Titre du morceau */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              Titre du morceau / Rythme <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Baque de Luanda, Fatras, Virada Samambaia..."
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              disabled={submitting}
              className="theme-input text-xs font-bold p-2.5 bg-cordel-bg-light border-2 border-encre-noire rounded"
            />
          </div>

          {/* Statut de saison & État de validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Statut de saison */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-white border border-encre-noire/15 shadow-xs">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-wood">
                Statut de la saison
              </label>
              <div className="flex flex-col gap-1.5 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="statutSaison"
                    value="saison"
                    checked={statutSaison === 'saison'}
                    onChange={() => setStatutSaison('saison')}
                    className="accent-green-700 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟢</span>
                    <span>Au programme cette année</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="statutSaison"
                    value="chantier"
                    checked={statutSaison === 'chantier'}
                    onChange={() => setStatutSaison('chantier')}
                    className="accent-amber-600 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟡</span>
                    <span>En préparation / Chantier</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="statutSaison"
                    value="archive"
                    checked={statutSaison === 'archive'}
                    onChange={() => setStatutSaison('archive')}
                    className="accent-stone-600 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>⚪</span>
                    <span>Au frigo / Archives</span>
                  </span>
                </label>
              </div>
            </div>

            {/* État de validation artistique */}
            <div className="flex flex-col gap-1.5 p-3 rounded bg-white border border-encre-noire/15 shadow-xs">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-wood">
                Maturité artistique
              </label>
              <p className="text-[9.5px] text-encre-noire/60 leading-tight mb-1">
                La validation est libre : un morceau peut être prêt même sans ressource externe attachée.
              </p>
              <div className="flex flex-col gap-1.5 text-xs font-bold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="etatValidation"
                    value="pret"
                    checked={etatValidation === 'pret'}
                    onChange={() => setEtatValidation('pret')}
                    className="accent-green-700 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟢</span>
                    <span>Validé / Prêt pour la scène</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="etatValidation"
                    value="a_faire"
                    checked={etatValidation === 'a_faire'}
                    onChange={() => setEtatValidation('a_faire')}
                    className="accent-amber-600 w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <span>🟡</span>
                    <span>À affiner / En répétition</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Section Liaisons transversales optionnelles */}
          <div className="p-3.5 rounded bg-white border border-encre-noire/15 shadow-xs flex flex-col gap-3">
            <h4 className="text-[10px] uppercase font-black tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center gap-1.5">
              <span>🔗</span>
              <span>Liaisons transversales optionnelles (Varal, Séquenceur, Danse)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {/* 1. Toada (Chant) */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>🗣️</span>
                  <span>Chant / Toada associée</span>
                </label>
                <select
                  value={selectedToadaId}
                  onChange={(e) => setSelectedToadaId(e.target.value)}
                  disabled={submitting || loadingDocs}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucun chant associé --</option>
                  {toadasList.map((song) => (
                    <option key={song.id} value={song.id}>
                      🗣️ {song.titre} {song.nacao ? `(${song.nacao})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Rythme du Séquenceur */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>🥁</span>
                  <span>Rythme Séquenceur associé</span>
                </label>
                <select
                  value={selectedSeqUrl}
                  onChange={(e) => setSelectedSeqUrl(e.target.value)}
                  disabled={submitting || loadingRhythms}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucun rythme séquenceur lié --</option>
                  {catalogRhythms.map((rhythm) => (
                    <option key={rhythm.id} value={rhythm.jsonUrl}>
                      🥁 {rhythm.titre}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Chorégraphie Dançador */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>💃</span>
                  <span>Chorégraphie Dançador associée</span>
                </label>
                <select
                  value={selectedChoreoId}
                  onChange={(e) => setSelectedChoreoId(e.target.value)}
                  disabled={submitting || loadingChoreos}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucune chorégraphie liée --</option>
                  {choreographies.map((choreo) => (
                    <option key={choreo.id} value={choreo.id}>
                      💃 {choreo.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Fiche Culturelle */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1">
                  <span>📖</span>
                  <span>Fiche Culturelle associée</span>
                </label>
                <select
                  value={selectedCultureId}
                  onChange={(e) => setSelectedCultureId(e.target.value)}
                  disabled={submitting || loadingDocs}
                  className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
                >
                  <option value="">-- Aucune fiche culturelle liée --</option>
                  {cultureDocsList.map((docItem) => (
                    <option key={docItem.id} value={docItem.id}>
                      📖 {docItem.titre || docItem.name || 'Fiche Culturelle'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes d'intention / mémo du Mestre */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
              Notes du Mestre &amp; Consignes artistiques
            </label>
            <textarea
              rows={3}
              placeholder="Ex: Tempo cible 128 BPM, break avec virada en 2 temps, entrée soliste au repique..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              className="theme-input text-xs font-medium p-2.5 bg-cordel-bg-light border-2 border-encre-noire rounded"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 justify-end pt-3 border-t border-dashed border-cordel-master-dark/15">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={submitting || !titre.trim()}
              className="px-6 py-2 text-xs font-black uppercase tracking-wider"
            >
              {submitting ? "Enregistrement..." : (pieceToEdit ? "💾 Enregistrer les modifications" : "➕ Ajouter au répertoire")}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
