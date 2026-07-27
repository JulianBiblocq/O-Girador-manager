import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import WorkshopEditorModal from '../mestre/WorkshopEditorModal';
import ImageLightboxModal from '../ImageLightboxModal';
import useConfirm from '../../hooks/useConfirm';

/**
 * Utility helper to convert YouTube and Vimeo URLs into clean responsive embed iframe URLs.
 */
export function getEmbedVideoUrl(url) {
  if (!url) return null;
  const str = url.trim();

  // YouTube watch link
  const ytMatch = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }

  // Vimeo link
  const vimeoMatch = str.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }
  return null;
}

const FALLBACK_TUTORIALS = {
  bracelets: {
    titre: "🧵 Tutoriel de Fabrication : Bracelets de Maracatu",
    description: "Fiche technique pour fabriquer les bracelets froncés dorés et rubans pendants.",
    cost: 12.5,
    materiel: `- Tissu coloré ou doré (chutes de satin, brocart ou coton)\n- Bande d'élastique de 2 cm de large\n- Fils à coudre assortis\n- Rubans colorés, miroirs de décoration, paillettes ou perles`,
    content: `1. Mesurez votre tour de poignet et coupez une bande d'élastique de cette longueur + 2 cm.
2. Coupez une bande de tissu deux fois plus large que l'élastique (+ 2 cm pour les coutures) et environ 1,5 fois la longueur de l'élastique (pour l'effet froncé).
3. Pliez le tissu en deux dans le sens de la longueur, endroit contre endroit, et cousez tout le long du bord pour former un tube.
4. Retournez le tube de tissu sur l'endroit.
5. Insérez l'élastique à l'intérieur du tube à l'aide d'une épingle à nourrice.
6. Cousez ensemble les deux extrémités de l'élastique solidement.
7. Fermez proprement les extrémités du tissu en les rentrant l'une dans l'autre et cousez-les.
8. Personnalisez votre bracelet : cousez des rubans colorés pendants, fixez de petits miroirs décoratifs !`
  },
  chapeau: {
    titre: "🧵 Tutoriel de Décoration : Chapeau de Maracatu",
    description: "Fiche d'ornementation du chapeau de paille avec miroirs et varal de fitas.",
    cost: 20.0,
    materiel: `- Chapeau de paille classique (à bords larges ou type Borsalino)\n- Larges rubans de satin colorés\n- Miroirs ronds adhésifs ou à coudre\n- Sequins, perles, aiguilles et fil\n- Colle forte pour tissu/paille`,
    content: `1. Ajustement du bandeau principal : Mesurez le tour de la calotte du chapeau. Coupez un morceau de ruban de satin large assorti et fixez-le autour de la base du chapeau.
2. Décoration du bandeau : Collez des miroirs décoratifs à intervalles réguliers sur ce bandeau de ruban.
3. Ajout des rubans pendants (Varal de Fitas) : Coupez plusieurs morceaux de rubans fins de différentes couleurs d'environ 40 à 50 cm. Cousez-les ou collez-les à l'arrière du chapeau.
4. Finitions : Ajoutez des perles aux extrémités des rubans pendants ou cousez des sequins sur le bord extérieur.`
  }
};

export default function AtelierCouture({ groupId, activePiece, onClearActivePiece, onBack, role, isSystemAdmin, hasAccessLogistique }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState(null);

  // Editor Modal State
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true || hasAccessLogistique === true;

  // Load workshops from Firestore
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'workshops'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort recent first
      fetched.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
      setWorkshops(fetched);
      setLoading(false);
    }, (err) => {
      console.error("AtelierCouture - Error loading workshops:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Handle auto-expanding the activePiece redirect
  useEffect(() => {
    if (activePiece && !loading) {
      const matched = workshops.find(ws => 
        (ws.id === activePiece) ||
        ws.titre?.toLowerCase().includes(activePiece.toLowerCase())
      );

      if (matched) {
        setExpandedIds(new Set([matched.id]));
      } else {
        setExpandedIds(new Set([activePiece]));
      }

      const timer = setTimeout(() => {
        if (onClearActivePiece) onClearActivePiece();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activePiece, loading, workshops]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleOpenAddTutorial = () => {
    setEditingWorkshop(null);
    setShowEditorModal(true);
  };

  const handleOpenEditTutorial = (ws, e) => {
    if (e) e.stopPropagation();
    setEditingWorkshop(ws);
    setShowEditorModal(true);
  };

  const handleDeleteTutorial = async (ws, e) => {
    if (e) e.stopPropagation();
    const isOk = await confirm({
      title: "Supprimer le tutoriel",
      message: `Êtes-vous sûr de vouloir supprimer le tutoriel "${ws.titre}" ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!isOk) return;

    try {
      await deleteDoc(doc(db, 'workshops', ws.id));
    } catch (err) {
      console.error("Error deleting workshop:", err);
      alert("Erreur lors de la suppression du tutoriel.");
    }
  };

  // Filter visible workshops (non-admins see only published tutorials)
  const visibleWorkshops = workshops.filter(ws => isAuthorized || ws.isPublished !== false);

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-cactus font-black tracking-wider text-cordel-wood uppercase">
            🧵 Atelier Couture & Bibliothèque de Tutoriels
          </h2>
          <p className="text-[10px] text-cordel-master-dark opacity-75">
            Fiches techniques multimédias, liste du matériel, patrons et tutoriels vidéo de confection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAuthorized && (
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleOpenAddTutorial}
              className="text-[10px] px-3 py-1.5 font-black uppercase tracking-wider"
            >
              + Créer un Tutoriel
            </CordelButton>
          )}

          {onBack && (
            <CordelButton
              type="button"
              variant="default"
              onClick={onBack}
              className="text-[10px] px-3 py-1.5 font-bold uppercase tracking-wider"
            >
              Retour
            </CordelButton>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement des tutoriels...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 1. Firestore Workshops List */}
          {visibleWorkshops.map(ws => {
            const isExpanded = expandedIds.has(ws.id);
            const embedVideo = getEmbedVideoUrl(ws.videoUrl);

            return (
              <CordelCard
                key={ws.id}
                variant="default"
                useExtremeBorder={true}
                className={`p-5 transition-all ${isExpanded ? 'ring-2 ring-cordel-wood bg-white/60 dark:bg-black/40' : 'bg-white/30 dark:bg-black/20 hover:bg-white/40'}`}
              >
                {/* Booklet Header Bar */}
                <div
                  className="flex justify-between items-start cursor-pointer select-none gap-3"
                  onClick={() => toggleExpand(ws.id)}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-cactus font-black text-sm text-encre-noire flex items-center gap-2">
                        📖 {ws.titre}
                      </h3>
                      {ws.cost > 0 && (
                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] font-black uppercase">
                          Coût : {ws.cost} €
                        </span>
                      )}
                      {isAuthorized && (
                        <span className={`theme-stamp-badge text-[8px] uppercase ${ws.isPublished !== false ? 'theme-stamp-badge-dark' : 'theme-stamp-badge-ocre'}`}>
                          {ws.isPublished !== false ? '✅ Publié' : '🔒 Brouillon'}
                        </span>
                      )}
                    </div>

                    {ws.description && (
                      <p className="text-xs text-cordel-master-dark font-medium italic opacity-90">
                        {ws.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAuthorized && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditTutorial(ws, e)}
                          className="text-[9px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-1 rounded border border-amber-400 hover:bg-amber-200 cursor-pointer"
                          title="Modifier ce tutoriel"
                        >
                          ✏️ Éditer
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTutorial(ws, e)}
                          className="text-[9px] font-bold uppercase bg-red-100 text-red-900 px-2 py-1 rounded border border-red-400 hover:bg-red-200 cursor-pointer"
                          title="Supprimer ce tutoriel"
                        >
                          🗑️
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] font-black uppercase text-cordel-wood bg-cordel-bg px-2.5 py-1 rounded border border-cordel-master-dark/30">
                      {isExpanded ? '▲ Masquer le livret' : '▼ Consulter le livret'}
                    </span>
                  </div>
                </div>

                {/* Booklet Full Body Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col gap-5 text-xs text-encre-noire leading-relaxed">
                    
                    {/* Section A: Matériel Nécessaire */}
                    {ws.materiel && (
                      <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded border border-dashed border-amber-600/30 flex flex-col gap-1.5">
                        <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                          🧵 Matériel Nécessaire
                        </h4>
                        <div className="whitespace-pre-wrap font-medium opacity-90 pl-1">
                          {ws.materiel}
                        </div>
                      </div>
                    )}

                    {/* Section B: Étapes de Fabrication */}
                    {ws.content && (
                      <div className="flex flex-col gap-1.5">
                        <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                          📜 Étapes de Fabrication pas à pas
                        </h4>
                        <div className="bg-white/60 dark:bg-black/30 p-4 rounded border border-dashed border-cordel-master-dark/20 whitespace-pre-wrap leading-relaxed">
                          {ws.content}
                        </div>
                      </div>
                    )}

                    {/* Section C: Video Embed */}
                    {embedVideo && (
                      <div className="flex flex-col gap-2">
                        <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                          🎬 Tutoriel Vidéo de démonstration
                        </h4>
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-encre-noire shadow-md bg-black">
                          <iframe
                            src={embedVideo}
                            title={`Vidéo - ${ws.titre}`}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Section D: Images & Patrons Gallery */}
                    {ws.images && ws.images.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                          🎨 Patrons & Images de démonstration ({ws.images.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {ws.images.map((img, idx) => (
                            <div
                              key={idx}
                              onClick={() => setLightboxImage(img.url)}
                              className="relative group border-2 border-encre-noire rounded overflow-hidden bg-white aspect-square cursor-pointer shadow-sm hover:scale-[1.02] transition-transform"
                            >
                              <img src={img.url} alt={img.name || 'Patron'} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-encre-noire/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-wider">
                                🔍 Agrrandir
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section E: PDF Documents */}
                    {ws.pdfFiles && ws.pdfFiles.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider flex items-center gap-1.5">
                          📄 Documents Joints (PDF / Patrons à imprimer)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {ws.pdfFiles.map((pdf, idx) => (
                            <a
                              key={idx}
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 bg-cordel-wood text-white hover:bg-cordel-wood/90 px-3 py-2 rounded font-extrabold text-xs border border-encre-noire shadow-[2px_2px_0px_0px_#181716] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                            >
                              <span>📄 {pdf.name}</span>
                              <span className="text-[9px] uppercase bg-white/20 px-1.5 py-0.5 rounded">Ouvrir / Télécharger ↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </CordelCard>
            );
          })}

          {/* 2. Fallback Built-in Tutorials for Costumes */}
          {Object.entries(FALLBACK_TUTORIALS).map(([key, value]) => {
            const hasFirestoreOverride = visibleWorkshops.some(ws =>
              ws.titre.toLowerCase().includes(key.toLowerCase())
            );
            if (hasFirestoreOverride) return null;

            const isExpanded = expandedIds.has(key);

            return (
              <CordelCard
                key={key}
                variant="default"
                useExtremeBorder={true}
                className={`p-5 transition-all ${isExpanded ? 'ring-2 ring-cordel-wood bg-white/50 dark:bg-black/30' : 'bg-white/20'}`}
              >
                <div
                  className="flex justify-between items-start cursor-pointer select-none gap-3"
                  onClick={() => toggleExpand(key)}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-cactus font-black text-sm text-encre-noire flex items-center gap-2">
                      {value.titre}
                    </h3>
                    <p className="text-xs text-cordel-master-dark font-medium italic opacity-90">
                      {value.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase text-cordel-wood bg-cordel-bg px-2.5 py-1 rounded border border-cordel-master-dark/30 shrink-0">
                    {isExpanded ? '▲ Masquer le livret' : '▼ Consulter le livret'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col gap-4 text-xs text-encre-noire leading-relaxed">
                    <div className="bg-amber-50/70 p-3.5 rounded border border-dashed border-amber-600/30 flex flex-col gap-1.5">
                      <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider">
                        🧵 Matériel Nécessaire
                      </h4>
                      <div className="whitespace-pre-wrap font-medium opacity-90 pl-1">
                        {value.materiel}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h4 className="font-cactus font-black text-xs text-cordel-wood uppercase tracking-wider">
                        📜 Étapes de Fabrication pas à pas
                      </h4>
                      <div className="bg-white/60 p-4 rounded border border-dashed border-cordel-master-dark/20 whitespace-pre-wrap leading-relaxed">
                        {value.content}
                      </div>
                    </div>
                  </div>
                )}
              </CordelCard>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {showEditorModal && (
        <WorkshopEditorModal
          groupId={groupId}
          workshop={editingWorkshop}
          onClose={() => setShowEditorModal(false)}
        />
      )}

      {/* Lightbox Modal for Patrons & Images */}
      {lightboxImage && (
        <ImageLightboxModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
