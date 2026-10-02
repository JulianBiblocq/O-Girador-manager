import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import FabricationCard from '../FabricationCard';
import { getInstrumentStamp } from '../InstrumentStampSVG';

/**
 * Composant AtelierArtisanat :
 * Galerie des fiches et tutoriels d'artisanat du Varal pour l'espace adhérent
 * (reliure de carnets de toadas, pochoirs, travail du cuir, accessoires).
 */
export default function AtelierArtisanat({ groupId, user: _user, profileData: _profileData, onNavigateToVaral }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiche, setSelectedFiche] = useState(null);

  // Synchronisation en temps réel des documents du groupe
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'documents'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Tri ante-chronologique (plus récents en premier)
      fetched.sort((a, b) => {
        const dateA = new Date(b.updatedAt || b.dateAjout || b.createdAt || 0);
        const dateB = new Date(a.updatedAt || a.dateAjout || a.createdAt || 0);
        return dateA - dateB;
      });

      setDocuments(fetched);
      setLoading(false);
    }, (err) => {
      console.error("AtelierArtisanat - Erreur Firestore documents :", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Filtrage des tutoriels spécifiques à l'artisanat
  const artisanatFiches = useMemo(() => {
    return documents.filter((d) => {
      const isFabCategory = 
        d.categoryId === 'TutosFabrication' ||
        d.categorie === 'TutosFabrication' ||
        d.categorie === 'Tutos Fabrication' ||
        d.type === 'fabrication' ||
        d.typeDoc === 'fabrication';

      const isArtisanatTheme = (
        d.thematiqueFabrication === 'artisanat' ||
        d.thematiqueConfection === 'artisanat' ||
        d.thematiqueConfection === 'reliure' ||
        d.thematiqueConfection === 'autre' ||
        d.domaine === 'artisanat' ||
        d.domain === 'artisanat' ||
        d.sousCategorie === 'artisanat' ||
        d.sousCategorie === 'reliure' ||
        /artisanat|reliure|carnet|cuir|pochoir|accessoire|tampon/i.test(d.titre || '') ||
        /artisanat|reliure|carnet|cuir|pochoir|accessoire/i.test(d.instrumentConcerne || '')
      );

      // Exclusion des fiches purement costumerie ou lutherie instrumentale sans lien artisanat
      const isExplicitOther = (
        (d.domaine === 'costumerie' || d.thematiqueFabrication === 'costumerie' || d.domaine === 'lutherie' || d.thematiqueFabrication === 'lutherie') &&
        !isArtisanatTheme
      );
      if (isExplicitOther) return false;

      return isFabCategory && isArtisanatTheme;
    });
  }, [documents]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-bold text-stone-500 animate-pulse">
        {t('lutherie.loadingYourWorkshop')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* En-tête de section Artisanat */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-[#fdfaf2] border-2 border-encre-noire p-4 shadow-[3px_3px_0px_0px_#181716] rounded-[var(--theme-border-radius)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <h3 className="font-heading font-black text-lg text-cordel-wood uppercase tracking-wider">
              {t('workshopMember.craftsHeaderTitle')}
            </h3>
          </div>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            {t('workshopMember.craftsHeaderSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase font-black text-cordel-master-dark bg-white border border-encre-noire px-2.5 py-1 rounded shadow-2xs">
            {artisanatFiches.length} {artisanatFiches.length > 1 ? t('costumerie.pieces') : t('costumerie.piece')}
          </span>
          {onNavigateToVaral && (
            <CordelButton
              variant="default"
              onClick={onNavigateToVaral}
              className="text-xs font-bold px-3 py-1"
            >
              {t('workshopMember.btnOpenVaral')}
            </CordelButton>
          )}
        </div>
      </div>

      {/* Galerie des fiches ou état vide */}
      {artisanatFiches.length === 0 ? (
        <CordelCard
          variant="default"
          useExtremeBorder={true}
          className="p-8 sm:p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-4 bg-white/70"
        >
          <div className="w-16 h-16 rounded-full bg-amber-100/80 border-2 border-dashed border-[var(--color-cordel-wood)] flex items-center justify-center text-3xl shadow-inner">
            🎨
          </div>
          <div className="space-y-1">
            <h4 className="font-heading font-black text-base text-cordel-wood uppercase tracking-wide">
              {t('workshopMember.emptyCraftsTitle')}
            </h4>
            <p className="text-xs text-stone-600 max-w-md leading-relaxed">
              {t('workshopMember.emptyCraftsDesc')}
            </p>
          </div>
        </CordelCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artisanatFiches.map((fiche) => {
            const hasEtapes = Array.isArray(fiche.etapesFabrication) && fiche.etapesFabrication.length > 0;
            const thumbnail = fiche.visuelAnimeUrl || fiche.imageUrl || fiche.fileUrl;
            const isVideo = thumbnail && (thumbnail.includes('.mp4') || thumbnail.includes('video'));

            return (
              <div
                key={fiche.id}
                className="relative group flex flex-col justify-between bg-[#fdfaf2] border-2 border-encre-noire rounded-[var(--theme-border-radius)] shadow-[3px_3px_0px_0px_#181716] overflow-hidden hover:translate-y-[-2px] transition-transform"
              >
                {/* Pince à linge stylisée Cordel */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-3 h-5 bg-amber-800/90 rounded-b-sm border border-black shadow-xs z-10 pointer-events-none" />

                {/* Visuel ou illustration */}
                <div className="relative w-full h-40 bg-stone-100 border-b-2 border-dashed border-encre-noire/20 overflow-hidden flex items-center justify-center">
                  {thumbnail ? (
                    isVideo ? (
                      <video
                        src={thumbnail}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={thumbnail}
                        alt={fiche.titre}
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 opacity-80">
                      <div className="w-12 h-12 text-[var(--color-cordel-wood)]">
                        {getInstrumentStamp('artisanat', 'currentColor')}
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-stone-500">
                        {fiche.instrumentConcerne || t('lutherie.filterCategoryArtisanat')}
                      </span>
                    </div>
                  )}

                  {/* Badge thématique supérieur */}
                  <span className="absolute bottom-2 left-2 text-[9px] uppercase font-black px-2 py-0.5 rounded bg-black/75 text-white backdrop-blur-xs">
                    {fiche.instrumentConcerne || t('lutherie.filterCategoryArtisanat')}
                  </span>
                </div>

                {/* Contenu textuel */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="font-heading font-black text-sm text-encre-noire leading-snug line-clamp-2">
                      {fiche.titre}
                    </h4>
                    {fiche.contenuFabrication && (
                      <p className="text-[11px] text-stone-600 line-clamp-2 mt-1 leading-normal">
                        {fiche.contenuFabrication.replace(/<[^>]+>/g, '')}
                      </p>
                    )}
                  </div>

                  {/* Indicateurs clés (étapes, gabarit, outils) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-dashed border-encre-noire/15 text-[10px] font-bold text-stone-600">
                    {hasEtapes && (
                      <span className="bg-amber-100/80 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                        {fiche.etapesFabrication.length} {fiche.etapesFabrication.length > 1 ? 'étapes' : 'étape'}
                      </span>
                    )}
                    {fiche.patronUrl && (
                      <span className="bg-emerald-100/80 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                        📐 Gabarit
                      </span>
                    )}
                  </div>

                  {/* Bouton d'action standard */}
                  <CordelButton
                    variant="default"
                    onClick={() => setSelectedFiche(fiche)}
                    className="w-full text-xs font-black uppercase tracking-wider py-2 mt-1"
                  >
                    📖 {t('lutherie.btnConsult')}
                  </CordelButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale standard de tutoriel pas-à-pas */}
      {selectedFiche && (
        <FabricationCard
          fabrication={selectedFiche}
          onClose={() => setSelectedFiche(null)}
        />
      )}
    </div>
  );
}
