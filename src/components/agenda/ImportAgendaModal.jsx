import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';

/**
 * Modèles d'ordre du jour par défaut intégrés au Studio.
 * Ces modèles servent de base à l'administrateur s'il n'a pas encore enregistré de modèles personnalisés.
 */
const DEFAULT_STUDIO_TEMPLATES = [
  {
    id: 'tpl_ag_rentree',
    titre: '🎓 AG de Rentrée / Assemblée Générale',
    categorie: 'Assemblée Générale',
    description: 'Structure classique pour une réunion d\'ouverture de saison ou Assemblée Générale.',
    points: [
      'Ouverture et rapport moral de la Présidence',
      'Rapport financier et bilan des comptes de l\'année écoulée',
      'Vote des cotisations et du budget prévisionnel',
      'Présentation du programme d\'activités & calendrier des prestations',
      'Élection des membres du Bureau et Conseil d\'Administration',
      'Questions diverses et verre de l\'amitié'
    ]
  },
  {
    id: 'tpl_reunion_bureau',
    titre: '💼 Réunion de Bureau / Conseil d\'Administration',
    categorie: 'Gestion & Bureau',
    description: 'Modèle standard pour les réunions régulières des membres du Bureau.',
    points: [
      'Tour de table & approbation du compte-rendu précédent',
      'Point trésorerie et suivi des adhésions',
      'Logistique des prestations à venir (transports, costumes, matériel)',
      'Projets d\'ateliers, stages et intervenants extérieurs',
      'Examen des suggestions et demandes des adhérents'
    ]
  },
  {
    id: 'tpl_commission_logistique',
    titre: '🚚 Commission Logistique & Matériel',
    categorie: 'Logistique',
    description: 'Pour préparer l\'organisation technique et le matériel d\'un événement majeur.',
    points: [
      'Inventaire des instruments et entretien du parc matériel',
      'Organisation du covoiturage et chargement véhicule',
      'Gestion des créneaux bénévoles et buvette',
      'Autorisations administratives, conventions et sécurité des sites'
    ]
  },
  {
    id: 'tpl_direction_musicaled',
    titre: '🥁 Direction Musicale & Pupitres',
    categorie: 'Musique & Danse',
    description: 'Pour cadrer les réunions artistiques, répertoires et répétitions générales.',
    points: [
      'Bilan du répertoire musical et nouveaux arrangements',
      'Évaluation des besoins par pupitre (Alfaia, Caixa, Gonguê, Agbê, Timbal, Chant, Danse)',
      'Planning des ateliers d\'initiation et perfectionnement',
      'Organisation des filages et répétitions générales'
    ]
  }
];

/**
 * Composant de modale pour l'importation d'ordres du jour pré-enregistrés ou issus de réunions passées.
 *
 * @param {Object} props Propriétés du composant
 * @param {boolean} props.isOpen Indique si la modale est ouverte
 * @param {Function} props.onClose Fonction de fermeture de la modale
 * @param {Function} props.onSelectTemplate Fonction appelée lors du choix d'un modèle (reçoit les points et/ou titre)
 * @param {string} props.groupId Identifiant du groupe de l'association
 */
export default function ImportAgendaModal({ isOpen, onClose, onSelectTemplate, groupId }) {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' ou 'pasto'
  const [customTemplates, setCustomTemplates] = useState([]);
  const [pastMeetings, setPastMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Charger les modèles enregistrés et les réunions passées depuis Firestore
  useEffect(() => {
    if (!isOpen || !groupId) return;

    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        // 1. Modèles d'ordre du jour personnalisés dans le Studio
        const tplRef = collection(db, 'agendaTemplates');
        const tplQuery = query(tplRef, where('groupId', '==', groupId));
        const tplSnap = await getDocs(tplQuery);
        const fetchedTemplates = [];
        tplSnap.forEach(docSnap => {
          fetchedTemplates.push({ id: docSnap.id, ...docSnap.data() });
        });

        // 2. Réunions passées avec ordre du jour renseigné
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(eventsRef, where('groupId', '==', groupId), where('type', '==', 'reunion'));
        const eventsSnap = await getDocs(eventsQuery);
        const fetchedMeetings = [];
        eventsSnap.forEach(docSnap => {
          const data = docSnap.data();
          // Ne retenir que les réunions ayant au moins un point d'ordre du jour
          if ((data.pointsOrdreDuJour && data.pointsOrdreDuJour.length > 0) || data.description) {
            fetchedMeetings.push({
              id: docSnap.id,
              titre: data.titre || 'Réunion sans titre',
              date: data.date,
              description: data.description || '',
              points: (data.pointsOrdreDuJour || []).map(p => typeof p === 'string' ? p : p.titre)
            });
          }
        });

        if (isMounted) {
          setCustomTemplates(fetchedTemplates);
          setPastMeetings(fetchedMeetings);
          setLoading(false);
        }
      } catch (err) {
        console.error("ImportAgendaModal - Erreur chargement modèles :", err);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  // Combiner les modèles par défaut du Studio et les modèles personnalisés enregistrés
  const allStudioTemplates = [...DEFAULT_STUDIO_TEMPLATES, ...customTemplates];

  // Modèle actuellement sélectionné pour l'aperçu
  const currentList = activeTab === 'studio' ? allStudioTemplates : pastMeetings;
  const activeTemplate = currentList.find(t => t.id === selectedTemplateId) || currentList[0];

  const handleConfirmImport = () => {
    if (!activeTemplate) return;

    // Formater les points pour l'ordre du jour
    const pointsList = (activeTemplate.points || []).map(p => {
      if (typeof p === 'string') return p;
      return p.titre || String(p);
    });

    onSelectTemplate({
      titre: activeTemplate.titre,
      points: pointsList,
      description: activeTemplate.description || ''
    });

    onClose();
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none outline-none animate-fade-in"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-cordel-bg text-left rounded-lg overflow-hidden shadow-2xl border-2 border-cordel-master-dark/40">
        {/* 1. Header Modal (Fixe) */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light">
          <div className="flex items-center gap-2">
            <span className="text-xl">📥</span>
            <div>
              <h3 className="font-extrabold text-sm text-cordel-wood uppercase tracking-wider">
                Importer un Ordre du Jour
              </h3>
              <p className="text-[10px] text-encre-noire/70">
                Sélectionnez un modèle préparé dans le Studio ou réutilisez celui d'une réunion passée.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-cordel-wood hover:text-cordel-rouge transition-colors p-1 rounded cursor-pointer"
            title="Fermer (Échap)"
          >
            <XiloClose className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs navigation (Fixes sous le header) */}
        <div className="flex-shrink-0 flex border-b border-cordel-master-dark/15 bg-white/40 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('studio'); setSelectedTemplateId(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-cordel-bg text-cordel-wood border-cordel-wood shadow-sm'
                : 'bg-transparent text-cordel-master-dark/60 border-transparent hover:text-cordel-wood'
            }`}
          >
            🎯 Modèles du Studio ({allStudioTemplates.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('past'); setSelectedTemplateId(null); }}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t border-t border-x transition-colors cursor-pointer ${
              activeTab === 'past'
                ? 'bg-cordel-bg text-cordel-wood border-cordel-wood shadow-sm'
                : 'bg-transparent text-cordel-master-dark/60 border-transparent hover:text-cordel-wood'
            }`}
          >
            📅 Réunions passées ({pastMeetings.length})
          </button>
        </div>

        {/* 2. Body (Défilable verticalement) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column: List of templates */}
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
            {loading ? (
              <div className="text-xs font-bold text-cordel-wood animate-pulse py-8 text-center">
                ⏳ Chargement des modèles...
              </div>
            ) : currentList.length === 0 ? (
              <p className="text-xs italic opacity-60 py-6 text-center">
                {activeTab === 'studio'
                  ? "Aucun modèle d'ordre du jour trouvé."
                  : "Aucune réunion passée avec ordre du jour n'a été trouvée."}
              </p>
            ) : (
              currentList.map((item) => {
                const isSelected = activeTemplate?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(item.id)}
                    className={`p-3 rounded border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-amber-100/90 border-cordel-wood text-cordel-wood font-bold shadow-[2px_2px_0px_0px_#8b2a1a]'
                        : 'bg-white/60 border-cordel-master-dark/20 text-encre-noire hover:bg-white'
                    }`}
                  >
                    <span className="text-xs font-extrabold flex items-center justify-between">
                      <span>{item.titre}</span>
                      {isSelected && <span className="text-[10px]">👉</span>}
                    </span>
                    {item.categorie && (
                      <span className="text-[9px] uppercase tracking-wider text-cordel-master-dark opacity-75">
                        {item.categorie}
                      </span>
                    )}
                    <span className="text-[10px] opacity-70 line-clamp-1">
                      {item.points ? `${item.points.length} point(s) au programme` : item.description}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Right column: Selected Template Preview */}
          <div className="bg-white/80 p-4 rounded border border-cordel-master-dark/25 flex flex-col justify-between min-h-[280px]">
            {activeTemplate ? (
              <div className="flex flex-col gap-3">
                <div className="border-b border-dashed border-cordel-master-dark/20 pb-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-cordel-wood">
                    Aperçu du modèle sélectionné
                  </span>
                  <h4 className="text-sm font-extrabold text-encre-noire mt-0.5">
                    {activeTemplate.titre}
                  </h4>
                  {activeTemplate.description && (
                    <p className="text-[10px] italic text-encre-noire/70 mt-1">
                      {activeTemplate.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px]">
                  <span className="text-[9.5px] uppercase font-black tracking-wider text-cordel-master-dark">
                    📋 Points de l'ordre du jour :
                  </span>
                  {activeTemplate.points && activeTemplate.points.length > 0 ? (
                    activeTemplate.points.map((pt, idx) => (
                      <div key={idx} className="text-xs pl-2.5 border-l-2 border-cordel-vert font-semibold text-encre-noire">
                        {idx + 1}. {typeof pt === 'string' ? pt : pt.titre}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic opacity-60">Aucun point structuré.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs italic opacity-60">
                Sélectionnez un modèle pour voir son aperçu.
              </div>
            )}
          </div>
        </div>

        {/* 3. Footer (Fixe en bas) */}
        <div className="flex-shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/20 flex justify-end gap-2 bg-cordel-bg">
          <CordelButton
            type="button"
            variant="rouge"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold"
          >
            Annuler
          </CordelButton>
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            disabled={!activeTemplate}
            onClick={handleConfirmImport}
            className="px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider"
          >
            📥 Importer cet ordre du jour
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
