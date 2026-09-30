import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Composant : WelcomeTourModal
 * 
 * Modale de bienvenue et visite guidée pas-à-pas (Style Cordel)
 * affichée juste après l'enregistrement du formulaire d'inscription.
 * 
 * Étapes :
 * - Écran 0 : Accueil chaleureux (avec nom dynamique de l'association)
 * - Étape 1 : 📅 L'Agenda & le Covoiturage
 * - Étape 2 : 📜 Le Répertoire de saison & les Entraînements
 * - Étape 3 : 🧺 Le Varal (Chants, Toadas & Documents)
 * - Étape 4 : 👤 Mon Profil & le Trombinoscope
 * 
 * @param {boolean} isOpen - Indique si la modale est affichée
 * @param {string} nomAssociation - Nom dynamique de l'association
 * @param {string} userId - Identifiant de l'utilisateur pour le localStorage
 * @param {Function} onClose - Callback invoqué à la fermeture
 * @param {Function} onComplete - Callback invoqué à l'achèvement de la visite
 */
export default function WelcomeTourModal({
  isOpen = true,
  nomAssociation = '',
  userId = '',
  onClose,
  onComplete
}) {
  const { t } = useTranslation();
  // Étape active : 0 = Accueil, 1..4 = Les 4 piliers de l'application
  const [step, setStep] = useState(0);

  // Mémorisation de la complétion et clôture
  const handleFinish = useCallback(() => {
    if (userId) {
      try {
        localStorage.setItem(`welcome_tour_completed_${userId}`, 'true');
      } catch (err) {
        console.warn('Erreur enregistrement localStorage tour :', err);
      }
    }
    if (onComplete) {
      onComplete();
    } else if (onClose) {
      onClose();
    }
  }, [userId, onComplete, onClose]);

  // Gestion des raccourcis clavier (Échap pour fermer, Flèches pour naviguer)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleFinish();
      } else if (e.key === 'ArrowRight') {
        setStep((prev) => (prev < 4 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        setStep((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleFinish]);

  if (!isOpen) return null;

  // Définition des contenus des 4 étapes guidées
  const tourSteps = [
    {
      num: 1,
      icon: '📅',
      badge: 'Répétitions & Concerts',
      title: "L'Agenda & le Covoiturage",
      subtitle: "Ne rate aucun temps fort du groupe",
      items: [
        {
          emoji: '📍',
          titre: "Dates clés de l'année",
          texte: "Retrouve en temps réel toutes les répétitions, stages, ateliers manuels et sorties en public."
        },
        {
          emoji: '✅',
          titre: "Pointage Présent / Absent en 1 clic",
          texte: "Signale ta disponibilité à l'avance pour permettre à la direction artistique de composer les pupitres."
        },
        {
          emoji: '🚗',
          titre: "Covoiturage solidaire",
          texte: "Propose ou réserve des places de transport directement sur la fiche de chaque événement."
        }
      ]
    },
    {
      num: 2,
      icon: '📜',
      badge: 'Pédagogie & Pratique',
      title: "Le Répertoire de saison",
      subtitle: "Apprends et progresse à ton rythme",
      items: [
        {
          emoji: '🥁',
          titre: "Morceaux & Arrangements",
          texte: "Consulte l'ensemble des toadas, phrasés, breaks et partitions de la saison en cours."
        },
        {
          emoji: '🎧',
          titre: "Audios isolés par pupitre",
          texte: "Écoute ton instrument isolé (Alfaia, Caixa, Gonguê, Agbê, Tarol...) pour caler ton jeu chez toi."
        },
        {
          emoji: '⚡',
          titre: "Entraînements & Paliers d'Aisance",
          texte: "Entraîne-toi au tempo métronomique et hisse ton niveau de maîtrise, du semis 🌱 jusqu'à la couronne 👑."
        }
      ]
    },
    {
      num: 3,
      icon: '🧺',
      badge: 'Chants & Archives',
      title: "Le Varal (Chants & Documents)",
      subtitle: "Toute la culture suspendue au fil",
      items: [
        {
          emoji: '🎶',
          titre: "Paroles des Toadas & Traductions",
          texte: "Accède aux paroles complètes en portugais avec leur traduction française et leur signification culturelle."
        },
        {
          emoji: '📚',
          titre: "Livrets culturels & Histoire",
          texte: "Explore les racines et l'héritage des Maracatus du Nordeste brésilien ainsi que les archives de la troupe."
        },
        {
          emoji: '📎',
          titre: "Documents administratifs partagés",
          texte: "Télécharge les règlements, chartes, comptes-rendus et fiches de covoiturage en toute transparence."
        }
      ]
    },
    {
      num: 4,
      icon: '👤',
      badge: 'Vie de Troupe',
      title: "Mon Profil & le Trombinoscope",
      subtitle: "Reste connecté avec tous les membres",
      items: [
        {
          emoji: '🪪',
          titre: "Coordonnées & Vœux de pupitre",
          texte: "Mets à jour ton numéro, ta visibilité publique et formule tes souhaits d'apprentissage instrumental ou de danse."
        },
        {
          emoji: '✂️',
          titre: "Mensurations & Costumes",
          texte: "Renseigne tes tailles pour la confection collective des tenues de parade lors des ateliers couture."
        },
        {
          emoji: '👥',
          titre: "Trombinoscope interactif",
          texte: "Mets un visage sur chaque prénom, découvre les rôles de chacun et rejoins la discussion."
        }
      ]
    }
  ];

  const currentStepData = step > 0 ? tourSteps[step - 1] : null;

  const content = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-neutral-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tour-title"
    >
      <div 
        className="w-full max-w-lg bg-[#f4ecd8] text-[#181716] border-2 border-[#181716] rounded-[8px_12px_9px_14px] shadow-[4px_4px_0px_0px_#181716] overflow-hidden flex flex-col relative max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête Cordel de la modale */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-dashed border-[#181716]/20 bg-[#ebd9b8]/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧭</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8b2a1a]">
              {step === 0 
                ? (t('welcomeTour.welcomeBadge') || "Bienvenue dans la troupe") 
                : `${t('welcomeTour.guideBadge') || "Visite guidée"} • Étape ${step}/4`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-[11px] font-black uppercase tracking-wider text-[#181716]/60 hover:text-[#8b2a1a] transition-colors cursor-pointer px-2 py-0.5 rounded"
            title="Passer la visite guidée"
          >
            {t('welcomeTour.skip') || "Passer ✕"}
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {step === 0 ? (
            /* --- ÉCRAN 0 : ACCUEIL CHALEUREUX --- */
            <div className="text-center py-2 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ebd9b8] border-2 border-[#181716] shadow-[2px_2px_0px_0px_#181716] text-3xl">
                🥁
              </div>

              <div>
                <h2 
                  id="welcome-tour-title"
                  className="text-xl sm:text-2xl font-black uppercase tracking-wider text-[#8b2a1a] font-serif"
                >
                  {nomAssociation 
                    ? `Bienvenue chez ${nomAssociation} !` 
                    : (t('welcomeTour.welcomeTitle') || "Bienvenue dans la troupe !")}
                </h2>
                <p className="text-xs sm:text-sm font-medium text-[#181716]/80 mt-2 max-w-sm mx-auto leading-relaxed">
                  {t('welcomeTour.introText') || 
                    "Ton inscription est bien enregistrée ! Prends 1 minute pour découvrir les outils essentiels qui t'accompagneront tout au long de ta saison."}
                </p>
              </div>

              {/* Aperçu des 4 piliers */}
              <div className="grid grid-cols-2 gap-2 text-left pt-2">
                <div className="p-2.5 bg-white/70 border border-[#181716]/30 rounded-[5px_7px_6px_8px] shadow-[1px_1px_0px_0px_#181716]">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>📅</span>
                    <span className="text-[11px] uppercase tracking-wide">Agenda</span>
                  </div>
                  <p className="text-[10px] text-[#181716]/70 mt-0.5">Répétitions, concerts & covoiturages</p>
                </div>

                <div className="p-2.5 bg-white/70 border border-[#181716]/30 rounded-[5px_7px_6px_8px] shadow-[1px_1px_0px_0px_#181716]">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>📜</span>
                    <span className="text-[11px] uppercase tracking-wide">Répertoire</span>
                  </div>
                  <p className="text-[10px] text-[#181716]/70 mt-0.5">Audios par pupitre & Entraînements</p>
                </div>

                <div className="p-2.5 bg-white/70 border border-[#181716]/30 rounded-[5px_7px_6px_8px] shadow-[1px_1px_0px_0px_#181716]">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>🧺</span>
                    <span className="text-[11px] uppercase tracking-wide">Le Varal</span>
                  </div>
                  <p className="text-[10px] text-[#181716]/70 mt-0.5">Paroles, toadas & documents</p>
                </div>

                <div className="p-2.5 bg-white/70 border border-[#181716]/30 rounded-[5px_7px_6px_8px] shadow-[1px_1px_0px_0px_#181716]">
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>👤</span>
                    <span className="text-[11px] uppercase tracking-wide">Mon Profil</span>
                  </div>
                  <p className="text-[10px] text-[#181716]/70 mt-0.5">Pupitres, mensurations & trombi</p>
                </div>
              </div>
            </div>
          ) : (
            /* --- ÉTAPES 1 À 4 : PILIERS MÉTIERS --- */
            <div className="space-y-4 py-1">
              {/* En-tête de l'étape */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-12 h-12 rounded-[6px_9px_7px_8px] bg-white border-2 border-[#181716] shadow-[2px_2px_0px_0px_#181716] flex items-center justify-center text-2xl">
                  {currentStepData.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#c05621]/15 text-[#c05621] border border-[#c05621]/30 mb-0.5">
                    {currentStepData.badge}
                  </div>
                  <h3 
                    id="welcome-tour-title"
                    className="text-lg sm:text-xl font-black uppercase tracking-wide text-[#181716] font-serif"
                  >
                    {currentStepData.title}
                  </h3>
                  <p className="text-[11px] font-bold text-[#181716]/60">
                    {currentStepData.subtitle}
                  </p>
                </div>
              </div>

              {/* Liste des points clés */}
              <div className="space-y-2.5 pt-1">
                {currentStepData.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-white/80 border border-[#181716]/30 rounded-[6px_8px_7px_9px] shadow-[1.5px_1.5px_0px_0px_#181716] flex items-start gap-2.5"
                  >
                    <span className="text-base select-none shrink-0 pt-0.5">{item.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-[#181716] uppercase tracking-wide">
                        {item.titre}
                      </div>
                      <p className="text-[11px] text-[#181716]/80 mt-0.5 leading-snug">
                        {item.texte}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pied de modale : Progression & Actions */}
        <div className="p-4 sm:p-5 border-t-2 border-dashed border-[#181716]/20 bg-[#ebd9b8]/40 flex flex-col gap-3">
          {/* Indicateur de progression (points Cordel) */}
          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setStep(idx)}
                aria-label={`Aller à l'étape ${idx}`}
                className={`transition-all rounded-full border border-[#181716] cursor-pointer ${
                  step === idx
                    ? 'w-6 h-2 bg-[#c05621] border-[#181716]'
                    : 'w-2 h-2 bg-white/80 hover:bg-[#c05621]/40'
                }`}
              />
            ))}
          </div>

          {/* Rangée de boutons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {step === 0 ? (
              <>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#181716]/70 hover:text-[#8b2a1a] transition-colors cursor-pointer"
                >
                  {t('welcomeTour.skipBtn') || "Passer"}
                </button>

                <CordelButton
                  variant="vert"
                  useExtremeBorder={true}
                  onClick={() => setStep(1)}
                  className="text-xs font-black uppercase tracking-wider text-white px-5 py-2.5"
                >
                  {t('welcomeTour.discoverBtn') || "🧭 Découvrir l'application"}
                </CordelButton>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStep((prev) => prev - 1)}
                  className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#181716]/80 hover:text-[#181716] transition-colors cursor-pointer border border-[#181716]/30 rounded-[5px_7px_6px_8px] bg-white/60 hover:bg-white"
                >
                  {step === 1 ? (t('welcomeTour.backHome') || "← Accueil") : (t('welcomeTour.prev') || "← Précédent")}
                </button>

                {step < 4 ? (
                  <CordelButton
                    variant="ocre"
                    useExtremeBorder={true}
                    onClick={() => setStep((prev) => prev + 1)}
                    className="text-xs font-black uppercase tracking-wider px-5 py-2"
                  >
                    {t('welcomeTour.next') || "Étape suivante →"}
                  </CordelButton>
                ) : (
                  <CordelButton
                    variant="vert"
                    useExtremeBorder={true}
                    onClick={handleFinish}
                    className="text-xs font-black uppercase tracking-wider text-white px-5 py-2 animate-bounce hover:animate-none"
                  >
                    {t('welcomeTour.letsGo') || "C'est parti ! 🥁"}
                  </CordelButton>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}
