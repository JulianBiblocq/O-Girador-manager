import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import PieceTutorialModal from './PieceTutorialModal';

/**
 * Fiches techniques et tutoriels par défaut si l'association n'a pas encore créé de fiches dans workshops.
 */
const DEFAULT_COUTURE_TUTOS = [
  {
    id: 'tuto_bracelets',
    titre: '🧵 Confection : Bracelets froncés et rubans',
    description: 'Fabrication des bracelets en tissu avec élastique et rubans colorés.',
    cost: 10,
    materiel: 'Tissu coloré ou doré, bande élastique 2cm, rubans de satin, fil assorti.',
    content: '1. Couper une bande de tissu de 40x8 cm.\n2. Coudre en tube endroit contre endroit puis retourner.\n3. Insérer un élastique de 18 cm et le coudre solidement.\n4. Coudre les rubans pendants et fermer le bracelet.'
  },
  {
    id: 'tuto_chapeau',
    titre: '🎩 Ornementation : Chapeau de paille & Varal de fitas',
    description: 'Pose des miroirs, galons et rubans flottants sur chapeaux de paille.',
    cost: 15,
    materiel: 'Chapeau de paille, rubans colorés 40-50 cm, miroirs adhésifs/à coudre, colle forte tissu.',
    content: '1. Poser un large ruban autour de la calotte.\n2. Fixer les miroirs décoratifs régulièrement espacés.\n3. Fixer le faisceau de rubans colorés à l\'arrière du chapeau.'
  },
  {
    id: 'tuto_jupes',
    titre: '👗 Jupe ample de Maracatu',
    description: 'Patron et montage de la jupe traditionnelle à volant pour la danse.',
    cost: 25,
    materiel: '3m de tissu coton/satin, élastique large 4cm, fil résistant.',
    content: '1. Assembler les laizes de tissu en cercle.\n2. Réaliser la coulisse de ceinture et glisser l\'élastique.\n3. Ourler le bas de jupe avec ou sans volant festonné.'
  }
];

/**
 * Vue adaptée pour le Vestiaire en mode 'collective_workshop' (Confection collective & Atelier).
 * Affiche :
 * 1. Le titre "Atelier Costumes" / "Mes Confections"
 * 2. Le récapitulatif déclaratif des pièces confectionnées par le membre pour l'association
 * 3. La progression du chantier collectif textile de la troupe (coutureProjects)
 * 4. Les boutons d'accès direct aux tutoriels et patrons (Varal / Atelier)
 */
export default function CollectiveWorkshopView({
  userId,
  groupId,
  profileData = {},
  workshops = [],
  costumes = [],
  onNavigateToTab,
  onNavigateToPole,
  onBack
}) {
  const { t } = useTranslation();
  // Compteur déclaratif de pièces confectionnées par l'adhérent
  const initialCount = profileData?.piecesConfectionneesCount || 0;
  const [piecesCount, setPiecesCount] = useState(initialCount);
  const [updatingCount, setUpdatingCount] = useState(false);
  const [isEditingCount, setIsEditingCount] = useState(false);
  const [manualCountInput, setManualCountInput] = useState(String(initialCount));

  // Projets de confection collective (coutureProjects)
  const [coutureProjects, setCoutureProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Modale de tutoriel
  const [activeTutorial, setActiveTutorial] = useState(null);

  // Synchronisation du compteur si profileData change
  useEffect(() => {
    const count = profileData?.piecesConfectionneesCount || 0;
    setPiecesCount(count);
    setManualCountInput(String(count));
  }, [profileData?.piecesConfectionneesCount]);

  // Écoute en temps réel des projets de confection collective de la troupe
  useEffect(() => {
    if (!groupId) {
      setLoadingProjects(false);
      return;
    }

    const q = query(collection(db, 'coutureProjects'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Trier : chantiers en cours d'abord
      fetched.sort((a, b) => {
        if (a.status === 'en_cours' && b.status !== 'en_cours') return -1;
        if (b.status === 'en_cours' && a.status !== 'en_cours') return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      setCoutureProjects(fetched);
      setLoadingProjects(false);
    }, (error) => {
      console.warn("CollectiveWorkshopView - Erreur snapshot coutureProjects :", error);
      setLoadingProjects(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Mise à jour du compteur déclaratif dans Firestore
  const handleUpdatePiecesCount = async (newVal) => {
    if (!userId) return;
    const sanitizedVal = Math.max(0, parseInt(newVal, 10) || 0);
    setPiecesCount(sanitizedVal);
    setUpdatingCount(true);

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        piecesConfectionneesCount: sanitizedVal,
        piecesConfectionneesUpdatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("CollectiveWorkshopView - Erreur updateDoc piecesConfectionneesCount :", err);
      // Rétablir l'ancienne valeur en cas d'erreur
      setPiecesCount(profileData?.piecesConfectionneesCount || 0);
      alert("Erreur lors de l'enregistrement de votre contribution : " + (err.message || err));
    } finally {
      setUpdatingCount(false);
      setIsEditingCount(false);
    }
  };

  // Liste combinée des tutoriels (workshops Firestore + fiches par défaut)
  const allTutorials = workshops && workshops.length > 0 ? workshops : DEFAULT_COUTURE_TUTOS;

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-4xl mx-auto">
      {/* 1. En-tête Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-heading font-black tracking-wider text-cordel-wood uppercase">
              {t('costumerie.atelierCostumesConfections')}
            </h2>
            <span className="theme-stamp-badge bg-emerald-800 text-white text-[8px] uppercase tracking-wider">
              {t('costumerie.parcMutualise')}
            </span>
          </div>
          <p className="text-[10px] text-cordel-master-dark opacity-75 mt-0.5">
            {t('costumerie.costumesConfectionnesPourLeStock')}
          </p>
        </div>
        {onBack && (
          <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs font-bold uppercase self-start sm:self-center">
            {t('costumerie.btnBackArrowSimple')}
          </CordelButton>
        )}
      </div>

      {/* 2. Raccourcis d'accès aux tutoriels et patrons (Varal & Atelier) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab('atelier');
            else if (onNavigateToPole) onNavigateToPole('mon-espace', 'atelier');
          }}
          className="p-3 rounded-[var(--theme-border-radius,6px_8px_5px_7px)] border-2 border-cordel-wood/30 bg-cordel-bg hover:bg-white/60 hover:border-cordel-wood transition-all flex items-center justify-between gap-3 shadow-[1.5px_1.5px_0px_0px_#181716] group cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">🪡</span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black uppercase text-encre-noire tracking-wide">
                {t('costumerie.fichesTechniquesAtelier')}
              </span>
              <span className="text-[9px] text-cordel-master-dark/75 font-semibold truncate">
                {t('costumerie.tutorielsPasAPasVideos')}
              </span>
            </div>
          </div>
          <span className="text-xs text-cordel-wood font-extrabold shrink-0 group-hover:translate-x-0.5 transition-transform">
            {t('costumerie.ouvrir')}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (onNavigateToTab) onNavigateToTab('varal');
            else if (onNavigateToPole) onNavigateToPole('mon-espace', 'varal');
          }}
          className="p-3 rounded-[var(--theme-border-radius,6px_8px_5px_7px)] border-2 border-cordel-master-dark/20 bg-cordel-bg hover:bg-white/60 hover:border-cordel-master-dark transition-all flex items-center justify-between gap-3 shadow-[1.5px_1.5px_0px_0px_#181716] group cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl group-hover:scale-110 transition-transform shrink-0">📁</span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-black uppercase text-encre-noire tracking-wide">
                {t('costumerie.patronsDocumentsVaral')}
              </span>
              <span className="text-[9px] text-cordel-master-dark/75 font-semibold truncate">
                {t('costumerie.patronsDeCoutureTelechargeablesPdf')}
              </span>
            </div>
          </div>
          <span className="text-xs text-cordel-wood font-extrabold shrink-0 group-hover:translate-x-0.5 transition-transform">
            {t('costumerie.consulter')}
          </span>
        </button>
      </div>

      {/* 3. Compteur déclaratif : Pièces confectionnées par le membre */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-cordel-bg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/15 pb-3">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-black tracking-widest text-cordel-wood">
              {t('costumerie.mesConfectionsPourLaTroupe')}
            </span>
            <h3 className="text-sm font-heading font-black text-encre-noire uppercase tracking-wider mt-0.5">
              {t('costumerie.piecesApporteesAuStockCommun')}
            </h3>
            <p className="text-[10px] text-cordel-master-dark/75 font-semibold mt-0.5">
              {t('costumerie.declarezIciLeNombreDe')}
            </p>
          </div>

          {/* Widget interactif de comptage */}
          <div className="flex items-center gap-2 bg-white/70 p-2 rounded-[var(--theme-border-radius,6px_8px_5px_7px)] border border-cordel-master-dark/25 shadow-xs self-start sm:self-center">
            {isEditingCount ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={manualCountInput}
                  onChange={(e) => setManualCountInput(e.target.value)}
                  className="w-16 px-2 py-1 text-center font-black text-sm rounded border border-cordel-master-dark/40 bg-white"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleUpdatePiecesCount(manualCountInput)}
                  disabled={updatingCount}
                  className="px-2 py-1 text-[10px] font-black uppercase bg-emerald-800 text-white rounded hover:bg-emerald-900 cursor-pointer"
                >
                  {t('costumerie.ok')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCount(false);
                    setManualCountInput(String(piecesCount));
                  }}
                  className="px-1.5 py-1 text-[10px] font-black text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdatePiecesCount(piecesCount - 1)}
                  disabled={piecesCount <= 0 || updatingCount}
                  title={t('costumerie.diminuer')}
                  className="w-7 h-7 rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                >
                  −
                </button>

                <div
                  onClick={() => setIsEditingCount(true)}
                  title={t('costumerie.cliquerPourModifierDirectementLe')}
                  className="px-3 py-1 flex items-baseline gap-1 cursor-pointer hover:bg-white/80 rounded transition-colors"
                >
                  <span className="text-xl font-heading font-black text-encre-noire">
                    {piecesCount}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase text-cordel-master-dark/80">
                    {piecesCount > 1 ? 'pièces' : 'pièce'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdatePiecesCount(piecesCount + 1)}
                  disabled={updatingCount}
                  title={t('costumerie.ajouterUnePieceConfectionnee')}
                  className="w-7 h-7 rounded border border-emerald-800 bg-emerald-800 text-white hover:bg-emerald-900 font-black text-sm flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
                >
                  +
                </button>
              </>
            )}
          </div>
        </div>

        {/* Message valorisant selon le nombre de pièces */}
        <div className="pt-2.5 flex items-center gap-2 text-[10px] font-semibold text-cordel-master-dark/85">
          {piecesCount === 0 ? (
            <span>{t('costumerie.vousNAvezPasEncore')}</span>
          ) : piecesCount < 5 ? (
            <span className="text-emerald-900 flex items-center gap-1">
              <span>🌟</span> {t('costumerie.merciPourVotreContributionAu')}
            </span>
          ) : (
            <span className="text-emerald-950 font-bold flex items-center gap-1">
              <span>🏆</span> {t('costumerie.formidableInvestissementVousFaitesPartie')}
            </span>
          )}
        </div>
      </CordelCard>

      {/* 4. Progression du chantier collectif textile de la troupe */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/15">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🪡</span>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('costumerie.chantierCollectifDeLaTroupe')}
            </h3>
          </div>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70">
            {coutureProjects.length} {t('costumerie.projetSEnregistreS')}
          </span>
        </div>

        {loadingProjects ? (
          <div className="py-4 text-center text-xs opacity-60 animate-pulse">
            {t('costumerie.chargementDesProjetsTextiles')}
          </div>
        ) : coutureProjects.length === 0 ? (
          <div className="p-4 rounded border border-dashed border-cordel-master-dark/20 text-center bg-white/40">
            <p className="text-xs italic text-cordel-master-dark/80">
              {t('costumerie.aucunChantierCoutureSpecifiqueN')}
            </p>
            <p className="text-[9.5px] text-cordel-master-dark/60 mt-1">
              {t('costumerie.lesConfectionsLibresSontLes')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coutureProjects.map((proj) => {
              const isEnCours = proj.status === 'en_cours';
              const isTermine = proj.status === 'termine';

              return (
                <div
                  key={proj.id}
                  className={`p-3 rounded border transition-all text-left flex flex-col justify-between ${
                    isEnCours
                      ? 'bg-white border-amber-600/40 shadow-xs'
                      : isTermine
                      ? 'bg-emerald-50/50 border-emerald-600/30 opacity-80'
                      : 'bg-white/40 border-stone-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-black uppercase text-encre-noire leading-snug">
                        {proj.name}
                      </h4>
                      <span
                        className={`text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wide shrink-0 ${
                          isEnCours
                            ? 'bg-amber-700 text-white'
                            : isTermine
                            ? 'bg-emerald-800 text-white'
                            : 'bg-stone-300 text-stone-800'
                        }`}
                      >
                        {isEnCours ? '⚡ En cours' : isTermine ? '✓ Achevé' : 'À lancer'}
                      </span>
                    </div>

                    {proj.needs && (
                      <p className="text-[10px] text-cordel-master-dark font-medium leading-relaxed mt-1">
                        <strong className="text-encre-noire">{t('costumerie.besoins')}</strong> {proj.needs}
                      </p>
                    )}
                  </div>

                  {proj.cost > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-dashed border-cordel-master-dark/15 text-[9px] font-bold text-cordel-wood flex justify-between items-center">
                      <span>{t('costumerie.budgetPrevu')}</span>
                      <span>{proj.cost} €</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CordelCard>

      {/* 5. Tutoriels de confection & Patrons disponibles */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg">
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-cordel-master-dark/15">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📖</span>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood">
              {t('costumerie.tutorielsFichesDeConfection')}
            </h3>
          </div>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70">
            {allTutorials.length} {t('costumerie.ficheS')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {allTutorials.map((tuto) => (
            <div
              key={tuto.id}
              className="p-3 rounded border border-cordel-master-dark/20 bg-white/60 hover:bg-white transition-all flex flex-col justify-between text-left shadow-2xs"
            >
              <div>
                <h4 className="text-[11px] font-black uppercase text-encre-noire leading-snug line-clamp-2">
                  {tuto.titre}
                </h4>
                {tuto.description && (
                  <p className="text-[9px] text-cordel-master-dark/80 font-medium mt-1 line-clamp-3 leading-snug">
                    {tuto.description}
                  </p>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15 flex items-center justify-between gap-2">
                {tuto.cost > 0 ? (
                  <span className="text-[8.5px] font-black text-cordel-wood">
                    ~{tuto.cost} €
                  </span>
                ) : (
                  <span className="text-[8.5px] text-stone-400 font-medium">{t('costumerie.libre')}</span>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTutorial(tuto)}
                  className="text-[9px] font-black uppercase px-2.5 py-1 rounded bg-cordel-wood text-white hover:bg-cordel-wood/90 cursor-pointer shadow-2xs"
                >
                  {t('costumerie.voirFiche')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </CordelCard>

      {/* Modale de consultation d'un tutoriel */}
      {activeTutorial && (
        <PieceTutorialModal
          piece={{ name: activeTutorial.titre, tutorialNotes: activeTutorial.content }}
          workshop={activeTutorial}
          onClose={() => setActiveTutorial(null)}
        />
      )}
    </div>
  );
}
