import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import LiteYouTubeEmbed, { extractYouTubeVideoId } from '../common/LiteYouTubeEmbed';
import { XiloMegaphone } from '../XiloIcons';

/**
 * Icône Chevron vers le haut stylisée gravure sur bois (Cordel)
 */
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

/**
 * Icône Chevron vers le bas stylisée gravure sur bois (Cordel)
 */
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

/**
 * Métadonnées descriptives de chaque bloc réorganisable du tableau de bord adhérent
 */
const WIDGET_DEFINITIONS = {
  annonces: {
    title: "Le Mégaphone (Annonces) 📢",
    desc: "Annonces officielles de l'association ciblées par étiquettes et badges.",
    icon: "📢"
  },
  videoALaUne: {
    title: "Vidéo à la une (YouTube) 🎬",
    desc: "Vidéo mise en avant sur l'accueil (concert, tutoriel de toada, rétrospective).",
    icon: "🎬"
  },
  motMestre: {
    title: "Le Mot du Mestre 📝",
    desc: "Bloc d'actualité et mot d'orientation rédigé en direct par le Mestre.",
    icon: "📝"
  },
  agenda: {
    title: "Dates à Venir (Agenda) 📅",
    desc: "Liste chronologique des répétitions, concerts et stages de la Roda.",
    icon: "📅"
  },
  commandes: {
    title: "Achats de Matériel (Commandes) 📦",
    desc: "Campagnes de commandes groupées de baguettes, peaux, T-shirts et accessoires.",
    icon: "📦"
  },
  forum: {
    title: "Le Porte-Voix (Forum) 💬",
    desc: "Discussions communautaires, canaux d'échanges et ateliers couture.",
    icon: "💬"
  },
  documents: {
    title: "Varal de Documents 📂",
    desc: "Partage de partitions, paroles, grilles de percussions et documents officiels.",
    icon: "📂"
  },
  tresorerie: {
    title: "Adhésion & Cotisation 🪙",
    desc: "Suivi individuel des cotisations et bouton de règlement en ligne.",
    icon: "🪙"
  }
};

const DEFAULT_WIDGETS_ORDER = [
  "annonces",
  "videoALaUne",
  "motMestre",
  "agenda",
  "commandes",
  "forum",
  "documents",
  "tresorerie"
];

/**
 * Composant : TabMemberLayout
 * 
 * Permet aux responsables et Mestres de configurer :
 * 1. La Vidéo à la une (activation, lien YouTube, titre et prévisualisation en direct).
 * 2. L'emplacement du bloc Anniversaires (en haut sous le mégaphone ou en bas de page).
 * 3. L'ordre d'affichage de tous les blocs d'accueil des adhérents (drag & drop et flèches tactiles).
 * 
 * @param {string} groupId - Identifiant de l'association
 */
export default function TabMemberLayout({ groupId }) {
  const [items, setItems] = useState(DEFAULT_WIDGETS_ORDER);
  const [birthdayWidgetPosition, setBirthdayWidgetPosition] = useState('bottom');

  // État de la vidéo à la une
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isVideoActive, setIsVideoActive] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const touchStartIndex = useRef(null);

  // 1. Chargement temps réel depuis Firestore (associations/{groupId})
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Résolution de l'ordre des widgets
        if (Array.isArray(data.layoutEleves) && data.layoutEleves.length > 0) {
          const loadedLayout = data.layoutEleves.filter(id => id !== "anniversaires");
          // Garantir la présence de tous les widgets officiels
          DEFAULT_WIDGETS_ORDER.forEach(wid => {
            if (!loadedLayout.includes(wid)) {
              loadedLayout.push(wid);
            }
          });
          setItems(loadedLayout);
        } else {
          setItems(DEFAULT_WIDGETS_ORDER);
        }

        // Emplacement du widget anniversaires
        if (data.birthdayWidgetPosition) {
          setBirthdayWidgetPosition(data.birthdayWidgetPosition);
        }

        // Configuration de la vidéo à la une
        if (data.videoALaUne) {
          setVideoUrl(data.videoALaUne.url || '');
          setVideoTitle(data.videoALaUne.titre || '');
          setIsVideoActive(Boolean(data.videoALaUne.active));
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("TabMemberLayout - Erreur chargement Firestore :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Extraction de l'ID YouTube pour validation et aperçu en direct
  const currentVideoId = extractYouTubeVideoId(videoUrl);

  // Déplacement d'un widget (boutons monter/descendre)
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
  };

  // Drag & Drop Desktop
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
    const sourceIndexStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const newItems = [...items];
    const [moved] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, moved);
    setItems(newItems);
  };

  // Support tactile mobile pour le glisser-déposer
  const handleTouchStart = (index) => {
    touchStartIndex.current = index;
  };

  const handleTouchMove = (e) => {
    if (touchStartIndex.current === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = element?.closest('[data-index]');
    if (dropZone) {
      const targetIndex = parseInt(dropZone.getAttribute('data-index'), 10);
      if (!isNaN(targetIndex) && targetIndex !== touchStartIndex.current) {
        const newItems = [...items];
        const [moved] = newItems.splice(touchStartIndex.current, 1);
        newItems.splice(targetIndex, 0, moved);
        touchStartIndex.current = targetIndex;
        setItems(newItems);
      }
    }
  };

  // Sauvegarde globale dans associations/{groupId}
  const handleSave = async () => {
    if (!groupId) return;
    setSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    // Validation légère si la vidéo est activée
    if (isVideoActive && videoUrl.trim() && !currentVideoId) {
      setErrorMessage("Le lien YouTube renseigné n'est pas valide.");
      setSaving(false);
      return;
    }

    try {
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        layoutEleves: items,
        birthdayWidgetPosition,
        videoALaUne: {
          url: videoUrl.trim(),
          titre: videoTitle.trim(),
          active: isVideoActive && Boolean(currentVideoId)
        }
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("TabMemberLayout - Erreur enregistrement :", err);
      setErrorMessage("Une erreur est survenue lors de l'enregistrement de la disposition.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">
          ⏳ Chargement de la disposition...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-left select-none">
      {/* 1. Bloc de présentation */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-85 border border-dashed border-cordel-master-dark/30 p-3.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed">
        <span className="font-bold">📐 Personnalisation de la Vue Membre :</span> Configurez la vidéo mise en avant sur l'Accueil et organisez l'ordre d'affichage des blocs pour tous les adhérents de l'association.
      </div>

      {/* Notifications de succès et d'erreur */}
      {saveSuccess && (
        <div className="p-3 bg-[var(--color-cordel-vert,#2d6a4f)] text-white font-black text-xs rounded-[4px_6px_3px_5px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] animate-fade-in flex items-center gap-2">
          <span>✓</span> Disposition et réglages de la vue membre enregistrés avec succès !
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-[var(--color-cordel-rouge,#8b2a1a)] text-white font-black text-xs rounded-[4px_6px_3px_5px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] flex items-center gap-2">
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* 2. SECTION : Vidéo à la Une */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎬</span>
            <div>
              <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-cordel-wood">
                Vidéo à la une (Accueil)
              </h3>
              <p className="text-[10px] opacity-75 mt-0.5">
                Mettez en avant un concert, une prestation ou un tutoriel vidéo sur la page d'accueil des adhérents.
              </p>
            </div>
          </div>

          {/* Interrupteur Activer / Désactiver */}
          <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-center">
            <input
              type="checkbox"
              checked={isVideoActive}
              onChange={(e) => setIsVideoActive(e.target.checked)}
              className="accent-[var(--color-cordel-vert,#2d6a4f)] w-4 h-4 cursor-pointer"
            />
            <span className={`text-xs font-black uppercase tracking-wider ${
              isVideoActive ? 'text-[var(--color-cordel-vert,#2d6a4f)]' : 'text-stone-500'
            }`}>
              {isVideoActive ? 'Actif sur l\'Accueil' : 'Désactivé'}
            </span>
          </label>
        </div>

        {/* Formulaire des paramètres vidéo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              Titre affiché de la vidéo
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Ex: Rétrospective Carnaval 2026, Tutoriel Toada..."
              className="w-full p-2.5 text-xs rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-white dark:bg-stone-900 text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] focus:outline-none focus:border-cordel-wood"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
              Lien YouTube (URL standard, partage ou Shorts)
            </label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
              className={`w-full p-2.5 text-xs rounded-[4px_6px_3px_5px] border-2 bg-white dark:bg-stone-900 text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] focus:outline-none ${
                videoUrl.trim() && !currentVideoId 
                  ? 'border-[var(--color-cordel-rouge,#8b2a1a)]' 
                  : 'border-encre-noire focus:border-cordel-wood'
              }`}
            />
            {videoUrl.trim() && !currentVideoId && (
              <span className="text-[9px] text-[var(--color-cordel-rouge,#8b2a1a)] font-bold">
                ⚠️ Lien non reconnu. Collez un lien valide YouTube ou youtu.be
              </span>
            )}
          </div>
        </div>

        {/* Prévisualisation de la vidéo en direct */}
        {currentVideoId && (
          <div className="mt-1 p-3 bg-cordel-bg-light/50 border border-dashed border-cordel-master-dark/30 rounded-[4px_6px_3px_5px]">
            <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood block mb-2">
              Aperçu en direct :
            </span>
            <div className="max-w-md mx-auto aspect-video rounded overflow-hidden border-2 border-encre-noire shadow-md">
              <LiteYouTubeEmbed 
                url={videoUrl} 
                title={videoTitle || "Aperçu vidéo"} 
              />
            </div>
          </div>
        )}
      </CordelCard>

      {/* 3. SECTION : Emplacement du bloc Anniversaires */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col gap-2.5">
        <label className="font-extrabold text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5 select-none">
          🎂 Emplacement du bloc Anniversaires
        </label>
        <p className="text-[11px] opacity-75 leading-snug">
          Choisissez si le bloc des anniversaires du mois s'affiche en haut du tableau de bord (sous le Mégaphone et la Vidéo) ou tout en bas de page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-1 select-none">
          <label 
            className={`flex-1 flex items-center gap-2.5 p-3 rounded-[6px_8px_5px_7px] border-2 border-encre-noire cursor-pointer transition-all ${
              birthdayWidgetPosition === 'top' 
                ? 'theme-bg-ocre font-black shadow-[2px_2px_0px_0px_#181716]' 
                : 'bg-cordel-bg-light/40 opacity-75 hover:opacity-100'
            }`}
          >
            <input
              type="radio"
              name="birthdayPosition"
              value="top"
              checked={birthdayWidgetPosition === 'top'}
              onChange={() => setBirthdayWidgetPosition('top')}
              className="accent-cordel-wood cursor-pointer w-4 h-4"
            />
            <span className="text-xs uppercase font-extrabold tracking-wider">
              ⬆️ En haut du tableau de bord
            </span>
          </label>

          <label 
            className={`flex-1 flex items-center gap-2.5 p-3 rounded-[6px_8px_5px_7px] border-2 border-encre-noire cursor-pointer transition-all ${
              birthdayWidgetPosition === 'bottom' 
                ? 'theme-bg-ocre font-black shadow-[2px_2px_0px_0px_#181716]' 
                : 'bg-cordel-bg-light/40 opacity-75 hover:opacity-100'
            }`}
          >
            <input
              type="radio"
              name="birthdayPosition"
              value="bottom"
              checked={birthdayWidgetPosition === 'bottom'}
              onChange={() => setBirthdayWidgetPosition('bottom')}
              className="accent-cordel-wood cursor-pointer w-4 h-4"
            />
            <span className="text-xs uppercase font-extrabold tracking-wider">
              ⬇️ En bas du tableau de bord
            </span>
          </label>
        </div>
      </CordelCard>

      {/* 4. SECTION : Ordre d'affichage des Blocs (Vue Membre) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            🪢 Agencement des Blocs de l'Accueil
          </h4>
          <span className="text-[10px] opacity-60 font-mono">
            {items.length} blocs configurés
          </span>
        </div>
        <p className="text-[11px] opacity-75 leading-snug">
          Utilisez les boutons ⬆️ et ⬇️ ou glissez-déposez le bouton 🪢 pour organiser les blocs dans l'ordre souhaité.
        </p>

        <div className="flex flex-col gap-2.5 mt-2">
          {items.map((widgetId, index) => {
            const widget = WIDGET_DEFINITIONS[widgetId] || { title: widgetId, desc: "", icon: "📌" };
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
                  className="p-3 flex items-center justify-between gap-3 bg-cordel-bg hover:bg-white/80"
                >
                  {/* Position et Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 rounded-full border-2 border-encre-noire bg-cordel-bg-light flex items-center justify-center text-[10px] font-black shrink-0 shadow-[1px_1px_0px_0px_#181716]">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h5 className="font-extrabold text-xs sm:text-sm text-cordel-wood truncate flex items-center gap-1.5">
                        {widgetId === 'annonces' ? <XiloMegaphone size={14} className="text-cordel-wood inline" /> : null}
                        {widget.title}
                        {widgetId === 'videoALaUne' && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ml-1 ${
                            isVideoActive && Boolean(currentVideoId)
                              ? 'bg-green-100 text-green-800 border-green-400'
                              : 'bg-stone-100 text-stone-500 border-stone-300'
                          }`}>
                            {isVideoActive && Boolean(currentVideoId) ? 'Actif' : 'Inactif'}
                          </span>
                        )}
                      </h5>
                      <p className="text-[10px] opacity-75 mt-0.5 leading-snug truncate">
                        {widget.desc}
                      </p>
                    </div>
                  </div>

                  {/* Boutons de réorganisation */}
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    {/* Flèches pour appareils mobiles et tactiles */}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0 || saving}
                        className="w-7 h-6 border border-encre-noire bg-cordel-bg text-encre-noire hover:bg-cordel-wood hover:text-white rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                        title="Monter ce bloc"
                        aria-label="Monter"
                      >
                        <ChevronUp size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === items.length - 1 || saving}
                        className="w-7 h-6 border border-encre-noire bg-cordel-bg text-encre-noire hover:bg-cordel-wood hover:text-white rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
                        title="Descendre ce bloc"
                        aria-label="Descendre"
                      >
                        <ChevronDown size={11} />
                      </button>
                    </div>

                    {/* Poignée Glisser-Déposer Desktop / Mobile Swipe */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onTouchStart={() => handleTouchStart(index)}
                      onTouchMove={handleTouchMove}
                      className="w-9 h-9 border-2 border-encre-noire bg-cordel-wood text-white rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
                      title="Glisser pour réorganiser"
                    >
                      <span className="text-base select-none pointer-events-none">🪢</span>
                    </div>
                  </div>
                </CordelCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Bouton de sauvegarde globale */}
      <div className="pt-2">
        <CordelButton
          type="button"
          variant="vert"
          useExtremeBorder={true}
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2"
        >
          {saving ? "Enregistrement en cours..." : "💾 Enregistrer la disposition de la vue membre"}
        </CordelButton>
      </div>
    </div>
  );
}
