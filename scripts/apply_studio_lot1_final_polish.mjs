import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '@babel/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const updates = [
  // 1. Step4Recapitulatif.jsx
  {
    file: 'src/components/studio/newsletter/Step4Recapitulatif.jsx',
    transform(content) {
      let res = content;
      res = res.replace(
        `{exportResult.data?.message || 'Le brouillon de votre newsletter a été transmis à votre service d\\'emailing.'}`,
        `{exportResult.data?.message || t('studio.newsletter.leBrouillonDeVotreNewsletter')}`
      );
      res = res.replace(
        `{exportResult.error || 'Une erreur est survenue lors de l\\'exportation.'}`,
        `{exportResult.error || t('studio.newsletter.uneErreurEstSurvenueLors')}`
      );
      return res;
    }
  },

  // 2. useNewsletterData.js
  {
    file: 'src/hooks/useNewsletterData.js',
    transform(content) {
      let res = content;
      res = res.replace(
        `setError('Impossible de charger les événements depuis Firestore.');`,
        `setError(t('studio.newsletter.impossibleDeChargerLesEvenements'));`
      );
      return res;
    }
  },

  // 3. StudioVaralPickerModal.jsx
  {
    file: 'src/components/studio/StudioVaralPickerModal.jsx',
    transform(content) {
      let res = content;
      res = res.replace(
        `className="text-xs px-3 py-1.5 font-bold shrink-0"\n            >\n              Annuler\n            </CordelButton>`,
        `className="text-xs px-3 py-1.5 font-bold shrink-0"\n            >\n              {t('studio.photos.annuler')}\n            </CordelButton>`
      );
      res = res.replace(
        `className="text-xs px-3 py-1.5 font-bold shrink-0"\r\n            >\r\n              Annuler\r\n            </CordelButton>`,
        `className="text-xs px-3 py-1.5 font-bold shrink-0"\r\n            >\r\n              {t('studio.photos.annuler')}\r\n            </CordelButton>`
      );
      res = res.replace(
        `className="text-xs px-4 py-1.5 font-black uppercase tracking-wider shrink-0"\n            >\n              Ajouter ({selectedUrls.length})\n            </CordelButton>`,
        `className="text-xs px-4 py-1.5 font-black uppercase tracking-wider shrink-0"\n            >\n              {t('studio.photos.ajouter')} ({selectedUrls.length})\n            </CordelButton>`
      );
      res = res.replace(
        `className="text-xs px-4 py-1.5 font-black uppercase tracking-wider shrink-0"\r\n            >\r\n              Ajouter ({selectedUrls.length})\r\n            </CordelButton>`,
        `className="text-xs px-4 py-1.5 font-black uppercase tracking-wider shrink-0"\r\n            >\r\n              {t('studio.photos.ajouter')} ({selectedUrls.length})\r\n            </CordelButton>`
      );
      return res;
    }
  },

  // 4. FramaspaceGalleryViewer.jsx
  {
    file: 'src/components/studio/FramaspaceGalleryViewer.jsx',
    transform(content) {
      let res = content;
      res = res.replace(
        `{item.name.toLowerCase().endsWith('.mov') ? 'MOV' : 'Vidéo'}`,
        `{item.name.toLowerCase().endsWith('.mov') ? 'MOV' : t('studio.photos.video')}`
      );
      res = res.replace(
        `Le fichier <strong className="text-white font-mono">{currentMedia.name}</strong> utilise un encodage (ex: conteneur Apple QuickTime .mov / HEVC) que votre navigateur ne peut pas lire directement en streaming sur ce système.`,
        `{t('studio.photos.leFichier')} <strong className="text-white font-mono">{currentMedia.name}</strong> {t('studio.photos.utiliseUnEncodageExConteneur')}`
      );
      return res;
    }
  },

  // 5. StudioEventMediaAccordionRow.jsx
  {
    file: 'src/components/studio/StudioEventMediaAccordionRow.jsx',
    transform(content) {
      let res = content;
      res = res.replace(
        `{isPresta ? '🎭 Prestation' : ev.type === 'repetition' ? '🥁 Répétition' : '📅 Sortie'}`,
        `{isPresta ? t('studio.photos.prestation') : ev.type === 'repetition' ? t('studio.photos.repetitionTitre') : t('studio.photos.sortie')}`
      );
      res = res.replace(
        `{ev.titre || "Événement sans titre"}`,
        `{ev.titre || t('studio.photos.evenementSansTitre')}`
      );
      res = res.replace(
        `{hasDepot && isRecolteActive ? '📷 Dépôt ouvert' : '📷 Dépôt inactif'}`,
        `{hasDepot && isRecolteActive ? t('studio.photos.depotOuvert') : t('studio.photos.depotInactif')}`
      );
      res = res.replace(
        `{provisioningStatus?.loading ? '⏳ Synchronisation...' : '⚡ Re-sync Framaspace'}`,
        `{provisioningStatus?.loading ? t('studio.photos.synchronisation') : t('studio.photos.reSyncFramaspace')}`
      );
      res = res.replaceAll(
        `className="px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-amber-300 border border-encre-noire cursor-pointer">\n                    📱 QR-Code\n                  </button>`,
        `className="px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-amber-300 border border-encre-noire cursor-pointer">\n                    {t('studio.photos.qrCode')}\n                  </button>`
      );
      res = res.replaceAll(
        `className="px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-amber-300 border border-encre-noire cursor-pointer">\r\n                    📱 QR-Code\r\n                  </button>`,
        `className="px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-amber-300 border border-encre-noire cursor-pointer">\r\n                    {t('studio.photos.qrCode')}\r\n                  </button>`
      );
      res = res.replace(
        `<span>🔗 Aligner avec le dépôt</span>`,
        `<span>{t('studio.photos.alignerAvecLeDepot')}</span>`
      );
      res = res.replace(
        `🔗 Aligner avec le dépôt`,
        `{t('studio.photos.alignerAvecLeDepot')}`
      );
      return res;
    }
  },

  // 6. StudioEventsManager.jsx
  {
    file: 'src/components/studio/StudioEventsManager.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`{t('common.back') || 'Retour'}`, `{t('studio.photos.retour')}`);
      res = res.replace(
        `{t('secretariat.eventsManagementSubtitle') || "Tableau de bord d'édition rapide et globale des événements pour l'administration."}`,
        `{t('studio.photos.tableauDeBordDEdition')}`
      );
      res = res.replace(
        `{t('secretariat.btnScheduleSeries') || "Planifier une série"}`,
        `{t('studio.photos.planifierUneSerie')}`
      );
      res = res.replace(
        `{t('agendaTemporal.filterLabel') || "Afficher :"}`,
        `{t('studio.photos.afficher')}`
      );
      res = res.replace(
        `{t('agendaTemporal.upcoming') || "À venir (Défaut)"}`,
        `{t('studio.photos.aVenirDefaut')}`
      );
      res = res.replace(
        `{t('agendaTemporal.past') || "Passés"}`,
        `{t('studio.photos.passes')}`
      );
      res = res.replace(
        `{t('agendaTemporal.all') || "Tous"}`,
        `{t('studio.photos.tous')}`
      );
      res = res.replace(
        `{t('secretariat.filterTypeLabel') || "Type :"}`,
        `{t('studio.photos.type')}`
      );
      res = res.replace(
        `{t('common.loading') || "Chargement des événements en direct..."}`,
        `{t('studio.photos.chargementDesEvenementsEnDirect')}`
      );
      return res;
    }
  },

  // 7. EventsDataGridRow.jsx
  {
    file: 'src/components/studio/EventsDataGridRow.jsx',
    transform(content) {
      let res = content;
      res = res.replace(`{t('secretariat.eventTypePrestation') || "Prestation"}`, `{t('studio.photos.prestationAlt')}`);
      res = res.replace(`{t('secretariat.eventTypeRepetition') || "Répétition"}`, `{t('studio.photos.repetition')}`);
      res = res.replace(`{t('secretariat.eventTypeStage') || "Stage"}`, `{t('studio.photos.stage')}`);
      res = res.replace(`{t('secretariat.eventTypeAtelier') || "Atelier"}`, `{t('studio.photos.atelier')}`);
      res = res.replace(`{t('secretariat.eventTypeReunion') || "Réunion"}`, `{t('studio.photos.reunion')}`);
      res = res.replace(`{t('secretariat.eventTypeAutre') || "Autre"}`, `{t('studio.photos.autre')}`);
      res = res.replace(`{localData.lieuSimple || "📍 Choisir un lieu..."}`, `{localData.lieuSimple || t('studio.photos.choisirUnLieu')}`);
      res = res.replace(`label="📍 Lieux habituels de l'association"`, `label={t('studio.photos.lieuxHabituelsDeLAssociation')}`);
      res = res.replaceAll(`<option value="tous">👥 Tous</option>`, `<option value="tous">{t('studio.photos.tousAlt')}</option>`);
      res = res.replaceAll(`<option value="aucun">Aucun</option>`, `<option value="aucun">{t('studio.photos.aucun')}</option>`);
      res = res.replace(`alt="Percussion"`, `alt={t('studio.photos.percussion')}`);
      res = res.replace(`📐 Oui`, `📐 {t('studio.photos.oui')}`);
      return res;
    }
  },

  // 8. ActivityReports.jsx
  {
    file: 'src/components/studio/ActivityReports.jsx',
    transform(content) {
      let res = content;
      res = res.replace(
        `: "En cours"}`,
        `: t('studio.photos.enCours')}`
      );
      res = res.replace(
        `{type === 'prestation' ? "Prestations" :
                       type === 'repetition' ? "Répétitions" :
                       type === 'stage' ? "Stages" :
                       type === 'atelier' ? "Ateliers" :
                       type === 'reunion' ? "Réunions" : type}`,
        `{type === 'prestation' ? t('studio.photos.prestations') :
                       type === 'repetition' ? t('studio.photos.repetitions') :
                       type === 'stage' ? t('studio.photos.stages') :
                       type === 'atelier' ? t('studio.photos.ateliers') :
                       type === 'reunion' ? t('studio.photos.reunions') : type}`
      );
      res = res.replace(
        `{exportingActivity ? "Génération..." : "📄 Exporter l'Activité (CSV)"}`,
        `{exportingActivity ? t('studio.photos.generation') : t('studio.photos.exporterLActiviteCsv')}`
      );
      return res;
    }
  },

  // 9. StudioCloudHeader.jsx
  {
    file: 'src/components/studio/StudioCloudHeader.jsx',
    transform(content) {
      let res = content;
      res = res.replace(
        `{t('studioPhotos.cloudTitle') || "Passerelle Stockage Cloud de l'Association"}`,
        `{t('studio.photos.passerelleStockageCloudDeL')}`
      );
      res = res.replace(
        `{t('studioPhotos.openCloud') || "Ouvrir notre Cloud ↗"}`,
        `{t('studio.photos.ouvrirNotreCloud')}`
      );
      res = res.replace(
        `{showFramaspaceSettings ? "Masquer API Framaspace" : "Automatisation Framaspace"}`,
        `{showFramaspaceSettings ? t('studio.photos.masquerApiFramaspace') : t('studio.photos.automatisationFramaspace')}`
      );
      res = res.replace(
        `>\n                Annuler\n              </button>`,
        `>\n                {t('studio.photos.annuler')}\n              </button>`
      );
      res = res.replace(
        `>\r\n                Annuler\r\n              </button>`,
        `>\r\n                {t('studio.photos.annuler')}\r\n              </button>`
      );
      return res;
    }
  }
];

console.log('--- Polissage final Lot 1 Studio ---');
for (const u of updates) {
  const filePath = path.resolve(rootDir, u.file);
  const content = fs.readFileSync(filePath, 'utf8');
  const updated = u.transform(content);

  babelParser.parse(updated, {
    sourceType: 'module',
    plugins: ['jsx']
  });

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`✅ ${u.file} poli et validé Babel.`);
}
console.log('--- Terminé avec succès ---');
