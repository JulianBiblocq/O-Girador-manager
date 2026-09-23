import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { cleanFirestorePayload } from '../../utils/firestoreUtils';
import { parseYouTubeMedia } from '../../utils/mediaUrlUtils';

/**
 * Modale passerelle permettant de créer instantanément une nouvelle fiche
 * du Varal Culture à partir d'un morceau du Répertoire (titre, vidéo YouTube et histoire).
 *
 * Lie automatiquement l'identifiant de la fiche créée (cultureDocId) au morceau dans Firestore.
 *
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture
 * @param {string} groupId - Identifiant de l'association
 * @param {Object} piece - Morceau du répertoire source
 * @param {Function} onSuccess - Callback après création et liaison réussie
 */
export default function CreateCultureFicheModal({
  isOpen,
  onClose,
  groupId,
  piece,
  onSuccess
}) {
  const [titre, setTitre] = useState('');
  const [categorieFiche, setCategorieFiche] = useState('Histoire');
  const [videoUrl, setVideoUrl] = useState('');
  const [sousTitre, setSousTitre] = useState('Origines & Histoire');
  const [texte, setTexte] = useState('');
  const [anecdote, setAnecdote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pré-remplissage automatique dès que la modale s'ouvre pour un morceau
  useEffect(() => {
    if (!isOpen || !piece) return;

    setTitre(piece.titre || '');
    setCategorieFiche('Histoire');
    setVideoUrl(piece.activeVideoUrl || piece.videoUrl || (piece.videos && piece.videos[0]?.url) || piece.preset?.videoUrl || piece.preset?.youtubeUrl || '');
    setSousTitre('Origines & Histoire');
    setTexte(
      piece.activeHistoire ||
      piece.contexteHistorique ||
      piece.histoire ||
      piece.preset?.histoire ||
      piece.preset?.parsedData?.metadata?.descriptionFr ||
      piece.preset?.parsedData?.metadata?.description ||
      piece.preset?.parsedData?.metadata?.descriptionPt ||
      piece.notes ||
      ''
    );
    setAnecdote('');
    setErrorMsg(null);
  }, [isOpen, piece]);

  if (!isOpen || !piece) return null;

  // Analyse YouTube pour aperçu en temps réel
  const ytParsed = videoUrl ? parseYouTubeMedia(videoUrl) : null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!titre.trim()) {
      setErrorMsg("Veuillez renseigner le titre de la fiche culture.");
      return;
    }
    if (!groupId) {
      setErrorMsg("Identifiant de groupe manquant.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Construction du document pour la collection 'documents' (Varal Culture)
      // Conforme à la directive : structuration en tableau pour les chapitres
      const newDoc = {
        groupId: groupId,
        titre: titre.trim(),
        title: titre.trim(),
        type: 'culture_fiche',
        categorie: 'Culture',
        categorieFiche: categorieFiche || 'Histoire',
        themeCulture: 'histoire',
        annee: new Date().getFullYear(),
        videoUrl: (videoUrl || '').trim() || '',
        chapitres: [
          {
            id: `chap_${Date.now()}`,
            sousTitre: (sousTitre || 'Origines & Histoire').trim(),
            titre: (sousTitre || 'Origines & Histoire').trim(),
            texte: (texte || '').trim(),
            contenu: (texte || '').trim()
          }
        ],
        anecdote: (anecdote || '').trim() || '',
        isArchived: false,
        isHidden: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 2. Nettoyage strict anti-undefined pour Firestore
      const cleanedPayload = cleanFirestorePayload(newDoc);
      const colRef = collection(db, 'documents');
      const docRef = await addDoc(colRef, cleanedPayload);

      // 3. Liaison automatique dans associations/{groupId}/repertoire/{piece.id} si le morceau existe
      if (piece.id) {
        const pieceRef = doc(db, 'associations', groupId, 'repertoire', piece.id);
        await updateDoc(pieceRef, {
          cultureDocId: docRef.id,
          updatedAt: new Date().toISOString()
        });
      }

      if (onSuccess) {
        onSuccess(docRef.id, { id: docRef.id, ...newDoc });
      }

      onClose();
    } catch (err) {
      console.error("Erreur lors de la création de la fiche culture :", err);
      setErrorMsg("Une erreur est survenue lors de la création de la fiche culture.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in text-left">
      <CordelCard className="w-full max-w-2xl p-5 md:p-6 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="border-b-2 border-dashed border-cordel-wood/30 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div className="flex flex-col">
              <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-cordel-wood">
                Créer la fiche Varal Culture
              </h3>
              <span className="text-[10px] text-encre-noire/60 font-semibold">
                Passerelle automatique depuis « {piece.titre || 'le morceau'} »
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-black text-xl p-1 cursor-pointer transition-colors"
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
          {/* Titre et Catégorie de fiche */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
                Titre de la fiche Culture <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                disabled={isSubmitting}
                className="theme-input text-xs font-bold p-2.5 bg-cordel-bg-light border-2 border-encre-noire rounded"
                placeholder="Ex: Baque de Luanda, Maracatu de Baque Virado..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
                Catégorie
              </label>
              <select
                value={categorieFiche}
                onChange={(e) => setCategorieFiche(e.target.value)}
                disabled={isSubmitting}
                className="theme-input text-xs font-semibold p-2.5 bg-cordel-bg-light border border-encre-noire/30 rounded cursor-pointer"
              >
                <option value="Histoire">📖 Histoire</option>
                <option value="Musique & Danse">🥁 Musique &amp; Danse</option>
                <option value="Tradition">👑 Tradition &amp; Cour</option>
                <option value="Orixás">🌿 Orixás</option>
                <option value="Territoire">📍 Territoire</option>
              </select>
            </div>
          </div>

          {/* Vidéo YouTube associée */}
          <div className="flex flex-col gap-1.5 p-3 rounded bg-white border border-encre-noire/15 shadow-xs">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark flex items-center gap-1.5">
              <span>🎬</span>
              <span>Vidéo YouTube associée</span>
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isSubmitting}
              className="theme-input text-xs font-semibold p-2 bg-cordel-bg-light border border-encre-noire/30 rounded"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {ytParsed && ytParsed.isValid && (
              <span className="text-[9px] text-green-800 font-bold flex items-center gap-1 mt-0.5">
                <span>✓</span>
                <span>Lien YouTube valide reconnu (ID : {ytParsed.videoId})</span>
              </span>
            )}
          </div>

          {/* Chapitre introductif : Histoire & Contexte */}
          <div className="flex flex-col gap-1.5 p-3 rounded bg-white border border-encre-noire/15 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark flex items-center gap-1.5">
                <span>📖</span>
                <span>Chapitre introductif / Histoire</span>
              </label>
              <input
                type="text"
                value={sousTitre}
                onChange={(e) => setSousTitre(e.target.value)}
                disabled={isSubmitting}
                className="text-[10px] font-bold p-1 bg-cordel-bg-light border border-encre-noire/25 rounded w-44"
                placeholder="Titre du chapitre"
              />
            </div>

            <textarea
              rows={5}
              required
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              disabled={isSubmitting}
              placeholder="Rédigez ou complétez le contexte historique, les origines, la nation ou l'anecdote de ce morceau..."
              className="theme-input text-xs font-medium p-2.5 bg-cordel-bg-light border border-encre-noire/30 rounded leading-relaxed font-serif"
            />
          </div>

          {/* Le Saviez-vous / Anecdote */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark flex items-center gap-1.5">
              <span>💡</span>
              <span>Le saviez-vous ? (Anecdote facultative)</span>
            </label>
            <input
              type="text"
              value={anecdote}
              onChange={(e) => setAnecdote(e.target.value)}
              disabled={isSubmitting}
              className="theme-input text-xs font-medium p-2 bg-cordel-bg-light border border-encre-noire/30 rounded"
              placeholder="Ex: Cette chanson était traditionnellement chantée au lever du soleil..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-2 pt-3 border-t border-dashed border-cordel-master-dark/15 mt-1">
            <span className="text-[9.5px] italic text-encre-noire/60">
              🔗 La fiche sera automatiquement enregistrée sur le Varal et liée à ce morceau.
            </span>

            <div className="flex items-center gap-2">
              <CordelButton
                type="button"
                variant="default"
                useExtremeBorder={false}
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold"
              >
                Annuler
              </CordelButton>

              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={isSubmitting || !titre.trim()}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                <span>{isSubmitting ? "Création..." : "✨ Créer & Lier la Fiche"}</span>
              </CordelButton>
            </div>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
