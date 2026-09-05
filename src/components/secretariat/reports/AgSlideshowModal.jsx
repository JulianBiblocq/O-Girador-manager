import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { XiloScroll } from '../../XiloIcons';

/**
 * Composant : AgSlideshowModal
 * 
 * Modale autonome de restitution pour l'Assemblée Générale :
 * 1. Vidéoprojection grand écran : diaporama de 6 slides plein écran pilotables au clavier.
 * 2. Rédaction interactive et persistance du Mot de la Présidence et du Trésorier.
 * 3. Impression A4 multi-pages : livret officiel prêt à l'emploi et fiche Cerfa (6 pages dédiées).
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen État de visibilité de la modale
 * @param {Function} props.onClose Callback de fermeture
 * @param {string} props.groupId Identifiant de l'association
 * @param {Object} props.indicators Indicateurs consolidés de la saison
 * @param {Object} props.assocInfo Données de l'association (nom, logo, adresse...)
 * @param {string} props.startDate Date de début de la période
 * @param {string} props.endDate Date de fin de la période
 */
export default function AgSlideshowModal({
  isOpen,
  onClose,
  groupId,
  indicators = {},
  assocInfo = {},
  startDate = '',
  endDate = ''
}) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 6;

  // Textes éditables de la présidence et de la trésorerie
  const defaultMotPresidence = "La saison écoulée a témoigné d'un dynamisme remarquable pour notre collectif. Grâce à l'engagement fidèle de nos membres bénévoles et au soutien de nos partenaires, nous avons continué à porter haut les couleurs de notre pratique culturelle tout en renforçant nos liens sur le territoire.";
  const defaultMotTresorier = "La gestion financière de cette saison s'inscrit dans une stricte discipline budgétaire. Les recettes issues de nos prestations, cotisations et subventions permettent de couvrir l'ensemble de nos charges d'exploitation et d'envisager sereinement les investissements de la saison prochaine.";

  const [motPresidence, setMotPresidence] = useState(
    assocInfo?.agReports?.motPresidence || defaultMotPresidence
  );
  const [motTresorier, setMotTresorier] = useState(
    assocInfo?.agReports?.motTresorier || defaultMotTresorier
  );
  const [savingField, setSavingField] = useState(null);

  // Synchronisation avec les données de l'association si elles changent
  useEffect(() => {
    if (assocInfo?.agReports?.motPresidence) {
      setMotPresidence(assocInfo.agReports.motPresidence);
    }
    if (assocInfo?.agReports?.motTresorier) {
      setMotTresorier(assocInfo.agReports.motTresorier);
    }
  }, [assocInfo]);

  // Sauvegarde persistante dans Firestore sur événement onBlur
  const handleSaveField = async (fieldName, value) => {
    if (!groupId) return;
    setSavingField(fieldName);
    try {
      const assocRef = doc(db, 'associations', groupId);
      await setDoc(assocRef, {
        agReports: {
          [fieldName]: value
        }
      }, { merge: true });
    } catch (err) {
      console.error("AgSlideshowModal - Erreur lors de la sauvegarde du champ :", err);
    } finally {
      setTimeout(() => setSavingField(null), 800);
    }
  };

  // Bascule du mode plein écran navigateur
  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {
      console.warn("Plein écran non supporté ou bloqué :", e);
    }
  };

  // Gestion des touches clavier pour la vidéoprojection
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Ne pas intercepter les touches si l'utilisateur tape du texte dans un textarea
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(totalSlides, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Données déstructurées avec valeurs de repli
  const assocNom = assocInfo?.nom || 'Association O Girador';
  const logoSrc = assocInfo?.branding?.logoUrl || assocInfo?.logoUrl || '';
  const territorial = indicators.territorialStats || {};
  const volunteering = indicators.volunteeringStats || {};
  const audience = indicators.audienceStats || {};

  // Titres des 6 diapositives
  const slideTitles = [
    "Ouverture & Émargement",
    "Rapport Moral de la Présidence",
    "Vie de Troupe & Ancrage Territorial (Cerfa)",
    "Bilan Scénique & Rayonnement",
    "Rapport Financier & Quitus de Gestion",
    "Chantiers, Perspectives & Vote du Bureau"
  ];

  // Rendu modulaire du contenu de chaque diapositive
  const renderSlideContent = (slideIndex, isPrint = false) => {
    switch (slideIndex) {
      // -----------------------------------------------------------------------
      // SLIDE 1 : OUVERTURE & ÉMARGEMENT
      // -----------------------------------------------------------------------
      case 1:
        return (
          <div className="flex flex-col gap-6 w-full text-left">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-encre-noire pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f] block mb-1">
                  Assemblée Générale Ordinaire
                </span>
                <h1 className="text-2xl sm:text-4xl font-black uppercase text-encre-noire tracking-tight">
                  {assocNom}
                </h1>
                <p className="text-xs sm:text-sm text-encre-noire/70 font-semibold mt-1">
                  Période d'exercice : du <strong>{startDate}</strong> au <strong>{endDate}</strong>
                </p>
              </div>

              {logoSrc && (
                <img
                  src={logoSrc}
                  alt={assocNom}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg border border-encre-noire/20 bg-white p-1 shadow-xs"
                />
              )}
            </div>

            {/* Constat du Quorum statutaire */}
            <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-5 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>📜</span> Constat officiel du Quorum & Émargement
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#2d6a4f] text-white">
                  Quorum Atteint
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-encre-noire/20 rounded flex flex-col items-center text-center">
                  <span className="text-[10px] font-black uppercase text-encre-noire/60">Membres Enregistrés</span>
                  <span className="text-2xl font-black text-cordel-wood mt-0.5">{indicators.totalMembers}</span>
                </div>
                <div className="p-3 bg-white border border-encre-noire/20 rounded flex flex-col items-center text-center">
                  <span className="text-[10px] font-black uppercase text-encre-noire/60">Membres Actifs</span>
                  <span className="text-2xl font-black text-emerald-800 mt-0.5">{indicators.activeMembers}</span>
                </div>
                <div className="p-3 bg-white border border-encre-noire/20 rounded flex flex-col items-center text-center">
                  <span className="text-[10px] font-black uppercase text-encre-noire/60">Cotisations à jour</span>
                  <span className="text-2xl font-black text-[#2d6a4f] mt-0.5">
                    {indicators.cotisationsUpToDate} <span className="text-xs font-bold text-encre-noire/50">
                      ({indicators.totalMembers ? Math.round((indicators.cotisationsUpToDate / indicators.totalMembers) * 100) : 0}%)
                    </span>
                  </span>
                </div>
              </div>

              <p className="text-xs text-encre-noire/80 font-medium leading-relaxed italic bg-emerald-50/70 p-3 rounded border border-emerald-300/40">
                « Les membres du bureau constatent que les conditions de quorum requises par les statuts associatifs sont pleinement satisfaites. L'Assemblée Générale est déclarée valablement constituée et peut délibérer sur l'ordre du jour. »
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] font-semibold text-encre-noire/60 pt-2">
              <span>Édité le {new Date().toLocaleDateString('fr-FR')}</span>
              <span>Association Loi 1901 — Dossier officiel d'AG</span>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // SLIDE 2 : RAPPORT MORAL (PRÉSIDENCE)
      // -----------------------------------------------------------------------
      case 2:
        return (
          <div className="flex flex-col gap-5 w-full text-left">
            <div className="border-b-2 border-encre-noire pb-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f]">
                  Orientation & Vision
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-encre-noire">
                  Rapport Moral de la Présidence
                </h2>
              </div>
              <span className="text-2xl">🖋️</span>
            </div>

            <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-5 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                  Bilan d'activité & Perspectives associatives
                </span>
                {savingField === 'motPresidence' && (
                  <span className="text-[10px] font-bold text-[#2d6a4f] animate-pulse">
                    ✓ Sauvegardé
                  </span>
                )}
              </div>

              {/* Champ interactif à l'écran, texte pur à l'impression */}
              {!isPrint ? (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={8}
                    value={motPresidence}
                    onChange={(e) => setMotPresidence(e.target.value)}
                    onBlur={(e) => handleSaveField('motPresidence', e.target.value)}
                    placeholder="Rédigez ici le mot de la présidence pour la saison..."
                    className="theme-input w-full p-3.5 text-xs sm:text-sm font-semibold leading-relaxed bg-white rounded border-2 border-encre-noire/30 focus:border-encre-noire shadow-inner resize-y"
                  />
                  <span className="text-[9.5px] text-encre-noire/50 italic">
                    ℹ️ Texte modifiable en direct. La sauvegarde est automatique lors de la sortie du champ.
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-white border border-stone-300 rounded text-xs sm:text-sm font-serif leading-relaxed text-encre-noire whitespace-pre-wrap">
                  {motPresidence}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/20 flex justify-between items-end text-xs font-black">
                <span className="text-encre-noire/70 italic">Pour le Conseil d'Administration</span>
                <span className="text-cordel-wood uppercase">La Présidence & la Mestria</span>
              </div>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // SLIDE 3 : VIE DE TROUPE & ANCRAGE TERRITORIAL (CERFA)
      // -----------------------------------------------------------------------
      case 3:
        return (
          <div className="flex flex-col gap-5 w-full text-left">
            <div className="border-b-2 border-encre-noire pb-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f]">
                  Territoire & Bénévolat
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-encre-noire">
                  Vie de Troupe & Ancrage Communal (Cerfa 12156)
                </h2>
              </div>
              <span className="text-2xl">🥁</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Colonne gauche : Répartition par pupitre */}
              <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>🎶</span> Répartition par pupitre ({indicators.activeMembers} actifs)
                </span>
                <div className="flex flex-col gap-2 mt-1">
                  {(indicators.sortedPupitres || []).slice(0, 5).map(p => (
                    <div key={p.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span>{p.name}</span>
                        <span className="text-encre-noire/70">{p.count} ({p.percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-white border border-encre-noire/30 rounded-full overflow-hidden">
                        <div className="h-full bg-cordel-wood" style={{ width: `${p.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colonne droite : Ancrage territorial & Bénévolat */}
              <div className="flex flex-col gap-4">
                {/* Jauge territoriale */}
                <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs font-black uppercase">
                    <span className="text-[#2d6a4f]">Commune siège : {territorial.communeMembersPercent}%</span>
                    <span className="text-[#8b2a1a]">Extérieurs : {territorial.externalMembersPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-white border border-encre-noire/30 rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#2d6a4f]" style={{ width: `${territorial.communeMembersPercent}%` }} />
                    <div className="h-full bg-[#8b2a1a]" style={{ width: `${territorial.externalMembersPercent}%` }} />
                  </div>
                  <span className="text-[10px] text-encre-noire/70 font-semibold">
                    Commune du siège : <strong>{territorial.siegeVille || 'Non renseignée'}</strong> ({territorial.communeMembersCount} résidents)
                  </span>
                </div>

                {/* Bénévolat Cerfa 12156 */}
                <div className="bg-emerald-50/90 border-2 border-[#2d6a4f] rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-[#2d6a4f]">
                      Total Bénévolat Valorisable (Cerfa)
                    </span>
                    <span className="text-xl font-black text-[#2d6a4f]">
                      {volunteering.totalCerfaVolunteerHours} h
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-emerald-950/80 pt-1 border-t border-dashed border-[#2d6a4f]/30">
                    <span>Activité collective : {volunteering.totalCollectiveVolunteerHours} h</span>
                    <span>Forfaits bureau/atelier : {volunteering.forfaitHeuresAdmin + volunteering.forfaitHeuresArtisanat} h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // SLIDE 4 : BILAN SCÉNIQUE & RAYONNEMENT
      // -----------------------------------------------------------------------
      case 4:
        return (
          <div className="flex flex-col gap-5 w-full text-left">
            <div className="border-b-2 border-encre-noire pb-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f]">
                  Diffusion & Scène
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-encre-noire">
                  Bilan Scénique, Sorties & Rayonnement Vitrine
                </h2>
              </div>
              <span className="text-2xl">🎺</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-encre-noire/60">Prestations</span>
                <span className="text-2xl font-black text-cordel-wood mt-0.5">{indicators.eventsByType?.prestation || 0}</span>
                <span className="text-[9px] text-encre-noire/70 mt-1">Concerts et sorties</span>
              </div>

              <div className="p-3 bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-encre-noire/60">Répétitions & Ateliers</span>
                <span className="text-2xl font-black text-encre-noire mt-0.5">
                  {(indicators.eventsByType?.repetition || 0) + (indicators.eventsByType?.stage || 0) + (indicators.eventsByType?.atelier || 0)}
                </span>
                <span className="text-[9px] text-encre-noire/70 mt-1">Séances régulières</span>
              </div>

              <div className="p-3 bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-encre-noire/60">Jeu public (scène)</span>
                <span className="text-2xl font-black text-emerald-800 mt-0.5">{volunteering.totalPublicPlayingHours} h</span>
                <span className="text-[9px] text-emerald-900/70 mt-1">Temps de spectacle</span>
              </div>

              <div className="p-3 bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-encre-noire/60">Moyenne Musiciens</span>
                <span className="text-2xl font-black text-cordel-wood mt-0.5">{indicators.avgPresencePrestation}</span>
                <span className="text-[9px] text-encre-noire/70 mt-1">Mobilisés par prestation</span>
              </div>
            </div>

            {/* Rayonnement Vitrine publique */}
            <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-3 mt-1">
              <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                <span>🌐</span> Rayonnement numérique & Vitrine publique
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-white border border-encre-noire/20 rounded text-center">
                  <span className="text-[9px] font-bold text-encre-noire/60 uppercase block">Consultations Vitrine</span>
                  <span className="text-lg font-black text-cordel-wood">{audience.vitrineViews?.toLocaleString('fr-FR')}</span>
                </div>

                <div className="p-2.5 bg-white border border-encre-noire/20 rounded text-center">
                  <span className="text-[9px] font-bold text-encre-noire/60 uppercase block">Demandes reçues</span>
                  <span className="text-lg font-black text-encre-noire">{audience.vitrineRequestsTotal}</span>
                </div>

                <div className="p-2.5 bg-white border border-encre-noire/20 rounded text-center">
                  <span className="text-[9px] font-bold text-[#2d6a4f] uppercase block">Concrétisations</span>
                  <span className="text-lg font-black text-[#2d6a4f]">
                    {audience.vitrineRequestsConverted} ({audience.conversionRate}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // SLIDE 5 : RAPPORT FINANCIER (TRÉSORERIE)
      // -----------------------------------------------------------------------
      case 5:
        return (
          <div className="flex flex-col gap-5 w-full text-left">
            <div className="border-b-2 border-encre-noire pb-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f]">
                  Finances & Bilan Comptable
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-encre-noire">
                  Rapport Financier & Quitus de Gestion
                </h2>
              </div>
              <span className="text-2xl">🪙</span>
            </div>

            {/* Rapprochement Recettes / Dépenses / Solde */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-800/40 rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col">
                <span className="text-[10px] font-black uppercase text-emerald-900">Recettes Consolidées</span>
                <span className="text-xl font-black text-[#2d6a4f] mt-1">
                  +{indicators.recettesGlobales?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[9px] text-emerald-900/70 mt-1">Cotisations, billetterie, subventions</span>
              </div>

              <div className="p-3.5 bg-red-50 border-2 border-red-800/40 rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col">
                <span className="text-[10px] font-black uppercase text-red-900">Dépenses Consolidées</span>
                <span className="text-xl font-black text-[#8b2a1a] mt-1">
                  -{indicators.depensesGlobales?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </span>
                <span className="text-[9px] text-red-900/70 mt-1">Déplacements, matériels, achats</span>
              </div>

              <div className={`p-3.5 border-2 rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] flex flex-col justify-between ${
                indicators.soldeNet > 0
                  ? 'bg-emerald-100 border-[#2d6a4f] text-[#2d6a4f]'
                  : indicators.soldeNet < 0
                  ? 'bg-red-100 border-[#8b2a1a] text-[#8b2a1a]'
                  : 'bg-amber-100 border-[#c05621] text-[#c05621]'
              }`}>
                <div>
                  <span className="text-[10px] font-black uppercase">Résultat Net d'Exercice</span>
                  <span className="text-xl font-black block mt-1">
                    {indicators.soldeNet > 0 ? '+' : ''}
                    {indicators.soldeNet?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
                <span className="text-[10px] font-bold opacity-80 mt-1">
                  {indicators.soldeNet > 0 ? '🟢 Excédent de clôture' : indicators.soldeNet < 0 ? '🔴 Déficit d\'exercice' : '🟡 Budget équilibré'}
                </span>
              </div>
            </div>

            {/* Mot du Trésorier */}
            <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                  Commentaire du Trésorier & Affectation du résultat
                </span>
                {savingField === 'motTresorier' && (
                  <span className="text-[10px] font-bold text-[#2d6a4f] animate-pulse">✓ Sauvegardé</span>
                )}
              </div>

              {!isPrint ? (
                <textarea
                  rows={4}
                  value={motTresorier}
                  onChange={(e) => setMotTresorier(e.target.value)}
                  onBlur={(e) => handleSaveField('motTresorier', e.target.value)}
                  placeholder="Rédigez ici le mot du trésorier..."
                  className="theme-input w-full p-3 text-xs sm:text-sm font-semibold leading-relaxed bg-white rounded border border-encre-noire/30 resize-y"
                />
              ) : (
                <div className="p-3 bg-white border border-stone-300 rounded text-xs font-serif leading-relaxed text-encre-noire whitespace-pre-wrap">
                  {motTresorier}
                </div>
              )}

              <span className="text-[10px] font-bold text-encre-noire/70 italic text-right">
                Résolution n° 2 : Quitus de gestion financière soumis au vote de l'Assemblée.
              </span>
            </div>
          </div>
        );

      // -----------------------------------------------------------------------
      // SLIDE 6 : PERSPECTIVES, VOTES & CLÔTURE
      // -----------------------------------------------------------------------
      case 6:
        return (
          <div className="flex flex-col gap-5 w-full text-left">
            <div className="border-b-2 border-encre-noire pb-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f]">
                  Clôture & Avenir
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-encre-noire">
                  Patrimoine, Perspectives & Résolutions Statutaires
                </h2>
              </div>
              <span className="text-2xl">🗳️</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patrimoine matériel */}
              <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>👗</span> Ateliers, Costumerie & Lutherie
                </span>
                <div className="flex justify-between text-xs font-semibold">
                  <span>Costumes confectionnés :</span>
                  <span className="font-black text-[#2d6a4f]">{indicators.coutureFinished}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span>Chantiers en cours :</span>
                  <span className="font-black text-[#c05621]">{indicators.coutureInProgress}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold border-t border-dashed border-encre-noire/15 pt-1">
                  <span>Instruments opérationnels en service :</span>
                  <span className="font-black text-[#2d6a4f]">{indicators.instrumentsInService}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span>Instruments en maintenance / réparation :</span>
                  <span className="font-black text-[#8b2a1a]">{indicators.instrumentsMaintenance}</span>
                </div>
              </div>

              {/* Résolutions soumises aux suffrages */}
              <div className="bg-cordel-bg/80 border-2 border-encre-noire rounded-[6px_10px_7px_9px] p-4 shadow-[2px_2px_0px_0px_#181716] flex flex-col gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>⚖️</span> Résolutions Soumises aux Votes
                </span>

                <div className="p-2 bg-white border border-encre-noire/20 rounded text-[11px] font-bold flex items-center gap-2">
                  <span>1️⃣</span>
                  <span>Vote 1 : Approbation du rapport moral et d'activité</span>
                </div>

                <div className="p-2 bg-white border border-encre-noire/20 rounded text-[11px] font-bold flex items-center gap-2">
                  <span>2️⃣</span>
                  <span>Vote 2 : Approbation des comptes et affectation du résultat</span>
                </div>

                <div className="p-2 bg-white border border-encre-noire/20 rounded text-[11px] font-bold flex items-center gap-2">
                  <span>3️⃣</span>
                  <span>Vote 3 : Renouvellement ou élection des membres du bureau</span>
                </div>
              </div>
            </div>

            {/* Remerciements officiels */}
            <div className="p-4 bg-emerald-50/80 border-2 border-[#2d6a4f] rounded-[6px_10px_7px_9px] text-center flex flex-col items-center gap-1">
              <span className="text-xs font-black uppercase tracking-widest text-[#2d6a4f]">
                Clôture de l'Assemblée Générale
              </span>
              <p className="text-xs text-emerald-950/80 font-medium leading-relaxed max-w-xl">
                Un immense merci à l'ensemble des adhérents, bénévoles, encadrants artistiques et partenaires territoriaux pour leur investissement indéfectible au service de notre collectif.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between select-none overflow-y-auto">
      {/* ========================================================================= */}
      {/* STYLES D'IMPRESSION LIVRET A4 MULTI-PAGES & FORMAT PLEIN ÉCRAN            */}
      {/* ========================================================================= */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm;
          }
          body, html {
            background: #ffffff !important;
            color: #181716 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            min-height: 96vh !important;
            page-break-after: always !important;
            break-after: page !important;
            padding: 10px 0 !important;
            background: #ffffff !important;
            color: #181716 !important;
            box-shadow: none !important;
            border-bottom: 2px solid #181716 !important;
            margin-bottom: 20px !important;
          }
          .print-only {
            display: block !important;
          }
          .screen-only {
            display: none !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. BARRE DE COMMANDE SUPÉRIEURE (ÉCRAN SEULEMENT)                          */}
      {/* ========================================================================= */}
      <div className="no-print w-full bg-stone-900/90 border-b border-stone-700 px-4 sm:px-8 py-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">📽️</span>
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
              {assocNom} — Présentation Assemblée Générale
            </h2>
            <p className="text-[10px] text-stone-400 font-medium">
              Diapositive {currentSlide} sur {totalSlides} : <strong>{slideTitles[currentSlide - 1]}</strong>
            </p>
          </div>
        </div>

        {/* Boutons d'action : Plein écran, Impression, Fermeture */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-stone-200 cursor-pointer flex items-center gap-1.5 transition-all"
            title="Basculer en mode plein écran (Vidéoprojection)"
          >
            <span>⛶</span>
            <span className="hidden sm:inline">Plein Écran</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[#2d6a4f] hover:bg-emerald-700 border border-emerald-500 rounded text-white cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
            title="Imprimer le livret A4 d'AG ou exporter en PDF"
          >
            <span>🖨️</span>
            <span>Imprimer le Livret A4</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded bg-[#8b2a1a] hover:bg-red-800 text-white font-black text-sm flex items-center justify-center cursor-pointer transition-all ml-1"
            title="Fermer la présentation (Échap)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ZONE CENTRALE DE PROJECTION (MODE ÉCRAN)                                */}
      {/* ========================================================================= */}
      <div className="screen-only flex-1 flex items-center justify-center p-4 sm:p-8 w-full max-w-5xl mx-auto">
        <div className="w-full bg-cordel-card-bg text-encre-noire border-3 border-encre-noire rounded-[8px_16px_9px_14px] p-6 sm:p-10 shadow-[6px_6px_0px_0px_#181716] min-h-[520px] flex flex-col justify-between animate-fade-in">
          {renderSlideContent(currentSlide, false)}

          {/* Pied de diapositive avec indicateur de progression */}
          <div className="mt-6 pt-3 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-between text-xs font-bold text-encre-noire/60">
            <span>
              Naviguez avec <strong>[←]</strong> et <strong>[→]</strong> ou la barre d'espace
            </span>
            <span className="font-black text-cordel-wood">
              Diapositive {currentSlide} / {totalSlides}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLÈCHES DE NAVIGATION LATÉRALES (ÉCRAN SEULEMENT)                       */}
      {/* ========================================================================= */}
      <div className="no-print w-full px-8 py-3 bg-stone-900/90 border-t border-stone-700 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
          disabled={currentSlide === 1}
          className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded text-stone-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          <span>⬅️ Précédent</span>
        </button>

        {/* Indicateurs à pastilles cliquables */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5, 6].map(idx => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                currentSlide === idx 
                  ? 'bg-amber-400 scale-125 border border-white' 
                  : 'bg-stone-600 hover:bg-stone-400'
              }`}
              title={`Aller à la diapositive ${idx}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
          disabled={currentSlide === totalSlides}
          className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#2d6a4f] hover:bg-emerald-700 border border-emerald-500 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          <span>Suivant ➡️</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. DÉROULÉ INTÉGRAL MULTI-PAGES LIVRET A4 (IMPRESSION SEULEMENT)          */}
      {/* ========================================================================= */}
      <div className="print-only w-full">
        {[1, 2, 3, 4, 5, 6].map(idx => (
          <div key={idx} className="print-page">
            <div className="flex justify-between items-center border-b border-encre-noire pb-2 mb-4 text-[10px] font-black uppercase text-encre-noire/70">
              <span>{assocNom} — Livret d'Assemblée Générale</span>
              <span>Page {idx} / {totalSlides}</span>
            </div>

            <div className="flex-1 flex flex-col justify-start">
              {renderSlideContent(idx, true)}
            </div>

            <div className="mt-8 pt-2 border-t border-encre-noire/30 flex justify-between items-center text-[9px] text-encre-noire/60 font-medium">
              <span>Rapport d'activité & Bilan de saison — Cerfa 12156</span>
              <span>Édité le {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
