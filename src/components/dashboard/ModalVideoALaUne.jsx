import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelButton from '../CordelButton';
import { extractYouTubeVideoId } from '../common/LiteYouTubeEmbed';

/**
 * Composant : ModalVideoALaUne
 * 
 * Modale d'administration directe pour configurer la « Vidéo à la une » du Dashboard.
 * Permet aux Mestres et Administrateurs d'ajouter, modifier, désactiver ou prévisualiser
 * une vidéo YouTube sans quitter l'Accueil.
 * 
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {Function} onClose - Callback de fermeture
 * @param {Object} videoALaUne - Données actuelles : { url, titre, active }
 * @param {string} groupId - Identifiant de l'association courante
 */
export default function ModalVideoALaUne({ isOpen, onClose, videoALaUne, groupId }) {
  const [url, setUrl] = useState('');
  const [titre, setTitre] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialisation du formulaire à chaque ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      setUrl(videoALaUne?.url || '');
      setTitre(videoALaUne?.titre || '');
      setActive(videoALaUne?.active ?? true);
      setErrorMsg('');
      setSaving(false);
    }
  }, [isOpen, videoALaUne]);

  if (!isOpen) return null;

  const currentVideoId = extractYouTubeVideoId(url);

  // Enregistrement des réglages de la vidéo dans Firestore
  const handleSave = async (shouldBeActive = active) => {
    if (!groupId) {
      setErrorMsg("Aucune association associée à votre compte.");
      return;
    }

    const cleanUrl = url.trim();
    const cleanTitre = titre.trim();

    if (shouldBeActive && !cleanUrl) {
      setErrorMsg("Veuillez saisir un lien YouTube valide pour diffuser la vidéo.");
      return;
    }

    if (shouldBeActive && !extractYouTubeVideoId(cleanUrl)) {
      setErrorMsg("Le lien ou l'identifiant YouTube saisi n'est pas reconnu.");
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        videoALaUne: {
          url: cleanUrl,
          titre: cleanTitre,
          active: Boolean(shouldBeActive)
        }
      });
      onClose();
    } catch (err) {
      console.error("ModalVideoALaUne - Erreur lors de la sauvegarde :", err);
      setErrorMsg("Erreur lors de l'enregistrement : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Retirer complètement la vidéo de l'accueil
  const handleDeactivate = async () => {
    await handleSave(false);
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none outline-none"
    >
      <div className="max-w-lg w-full bg-cordel-bg text-left relative rounded-[8px_12px_10px_9px] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête Cordel de la modale */}
        <div className="p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex items-center justify-between bg-cordel-bg">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <div>
              <h3 className="font-heading font-black text-sm uppercase tracking-wide text-cordel-wood">
                Vidéo à la une (Accueil)
              </h3>
              <p className="text-[10px] text-cordel-master-dark/75 font-semibold">
                Diffusez un concert, un tutoriel ou un débrief vidéo auprès de toute la troupe.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-7 h-7 rounded border border-encre-noire/30 bg-white hover:bg-neutral-100 flex items-center justify-center font-bold text-xs text-encre-noire cursor-pointer disabled:opacity-50"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps du formulaire */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* Commutateur Actif / Inactif */}
          <div className="p-3 bg-white/70 border border-encre-noire/20 rounded flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black uppercase text-encre-noire block">
                Statut de diffusion
              </span>
              <span className="text-[10px] text-cordel-master-dark/75">
                {active ? "La vidéo est actuellement visible sur l'Accueil" : "La vidéo est masquée"}
              </span>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-cordel-vert,#2d6a4f)] relative"></div>
              <span className="text-xs font-bold text-encre-noire select-none">
                {active ? 'Active' : 'Masquée'}
              </span>
            </label>
          </div>

          {/* Saisie de l'URL ou identifiant YouTube */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
              Lien YouTube (URL, Shorts, Live ou identifiant) *
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setErrorMsg('');
              }}
              placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
              disabled={saving}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-inner"
            />
            <p className="text-[10px] text-cordel-master-dark/65 mt-1 italic">
              Tolère tous les formats : youtube.com, youtu.be, shorts, direct/live ou identifiant à 11 caractères.
            </p>
          </div>

          {/* Validation en temps réel et aperçu de la miniature */}
          {currentVideoId ? (
            <div className="flex flex-col gap-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <span>✓</span>
                <span>ID YouTube validé : <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">{currentVideoId}</code></span>
              </div>

              {/* Aperçu miniature 16:9 */}
              <div className="relative aspect-video w-full rounded overflow-hidden border border-encre-noire/30 bg-black">
                <img
                  src={`https://img.youtube.com/vi/${currentVideoId}/hqdefault.jpg`}
                  alt="Aperçu YouTube"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="w-10 h-10 rounded-full bg-[var(--color-cordel-rouge,#8b2a1a)] text-white flex items-center justify-center text-sm font-bold shadow-md pl-0.5">
                    ▶
                  </span>
                </div>
              </div>
            </div>
          ) : url.trim() ? (
            <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded text-[var(--color-cordel-ocre,#c05621)] text-xs font-bold">
              <span>⚠️</span>
              <span>Lien non reconnu. Assurez-vous d'avoir collé un lien ou un identifiant YouTube valide.</span>
            </div>
          ) : null}

          {/* Saisie du Titre descriptif */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-cordel-master-dark mb-1">
              Titre descriptif ou consigne (optionnel)
            </label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="ex: Débrief du concert d'Erdeven, Tutoriel Toada..."
              disabled={saving}
              className="w-full px-3 py-2 text-xs font-semibold bg-white border border-cordel-master-dark/30 rounded focus:outline-hidden focus:border-cordel-wood shadow-inner"
            />
          </div>

          {/* Message d'erreur éventuel */}
          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Pied de modale et boutons d'action */}
        <div className="p-3 border-t-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg flex items-center justify-between gap-2 flex-wrap">
          {videoALaUne?.url ? (
            <CordelButton
              type="button"
              variant="rouge"
              useExtremeBorder={true}
              onClick={handleDeactivate}
              disabled={saving}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5"
            >
              🗑️ Retirer de l'Accueil
            </CordelButton>
          ) : <div />}

          <div className="flex items-center gap-2 ml-auto">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={saving}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5"
            >
              Annuler
            </CordelButton>

            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={() => handleSave(active)}
              disabled={saving}
              className="text-[10px] font-black uppercase tracking-wider px-4 py-1.5 shadow-[2px_2px_0px_0px_#181716]"
            >
              {saving ? "Enregistrement..." : "💾 Enregistrer"}
            </CordelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
