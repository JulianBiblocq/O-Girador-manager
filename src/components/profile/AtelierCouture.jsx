import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

const FALLBACK_TUTORIALS = {
  bracelets: {
    titre: "🧵 Tutoriel de Fabrication : Bracelets de Maracatu",
    content: `Matériel nécessaire :
- Tissu coloré ou doré (chutes de satin, brocart ou coton)
- Bande d'élastique de 2 cm de large
- Fils à coudre assortis
- Rubans colorés, miroirs de décoration, paillettes ou perles.

Instructions pas à pas :
1. Mesurez votre tour de poignet et coupez une bande d'élastique de cette longueur + 2 cm.
2. Coupez une bande de tissu deux fois plus large que l'élastique (+ 2 cm pour les coutures) et environ 1,5 fois la longueur de l'élastique (pour l'effet froncé).
3. Pliez le tissu en deux dans le sens de la longueur, endroit contre endroit, et cousez tout le long du bord pour former un tube.
4. Retournez le tube de tissu sur l'endroit.
5. Insérez l'élastique à l'intérieur du tube à l'aide d'une épingle à nourrice en veillant à ne pas le laisser glisser complètement.
6. Cousez ensemble les deux extrémités de l'élastique solidement.
7. Fermez proprement les extrémités du tissu en les rentrant l'une dans l'autre et cousez-les.
8. Personnalisez votre bracelet : cousez des rubans colorés pendants, fixez de petits miroirs décoratifs avec du fil ou de la colle forte pour capter la lumière pendant la danse !`
  },
  chapeau: {
    titre: "🧵 Tutoriel de Décoration : Chapeau de Maracatu",
    content: `Matériel nécessaire :
- Chapeau de paille classique (à bords larges ou type Borsalino selon le pupitre)
- Larges rubans de satin colorés (jaune, rouge, bleu, vert selon l'identité de la troupe)
- Miroirs ronds adhésifs ou à coudre
- Sequins, perles, aiguilles et fil.
- Colle forte pour tissu/paille.

Instructions pas à pas :
1. Ajustement du bandeau principal : Mesurez le tour de la calotte du chapeau. Coupez un morceau de ruban de satin large assorti et fixez-le autour de la base du chapeau à l'aide de quelques points de couture ou de colle forte.
2. Décoration du bandeau : Collez des miroirs décoratifs à intervalles réguliers sur ce bandeau de ruban. Les miroirs sont essentiels pour chasser les mauvais esprits et briller sous le soleil !
3. Ajout des rubans pendants (Varal de Fitas) : Coupez plusieurs morceaux de rubans fins de différentes couleurs d'environ 40 à 50 cm. Cousez-les ou collez-les à l'arrière du chapeau de manière à ce qu'ils pendent gracieusement sur votre nuque ou vos épaules.
4. Finitions : Ajoutez des perles aux extrémités des rubans pendants ou cousez des sequins sur le bord extérieur du chapeau pour ajouter une touche festive supplémentaire.`
  }
};

export default function AtelierCouture({ groupId, activePiece, onClearActivePiece, onBack }) {
  const { t } = useTranslation();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());

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
      // Find workshop from Firestore matching activePiece name (e.g. "bracelets" or "chapeau")
      const matched = workshops.find(ws => 
        ws.titre.toLowerCase().includes(activePiece.toLowerCase())
      );

      if (matched) {
        setExpandedIds(new Set([matched.id]));
      } else {
        // Fallback: expand fallback key
        setExpandedIds(new Set([activePiece]));
      }
      
      // Clear redirect state after applying
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

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-3">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          🧵 Atelier Couture & Tutoriels
        </h2>
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

      <p className="text-xs opacity-75 leading-relaxed">
        Bienvenue dans l'espace Atelier Couture de la troupe. Retrouvez ici les fiches techniques et fiches de confection pour fabriquer ou préparer les différents éléments de votre tenue.
      </p>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* 1. Firestore workshops list */}
          {workshops.map(ws => {
            const isExpanded = expandedIds.has(ws.id);
            return (
              <CordelCard 
                key={ws.id} 
                variant="default" 
                useExtremeBorder={true} 
                className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-cordel-wood bg-white/40' : 'bg-white/20'}`}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => toggleExpand(ws.id)}
                >
                  <h4 className="font-extrabold text-xs text-encre-noire flex items-center gap-2">
                    📖 {ws.titre}
                  </h4>
                  <span className="text-[10px] font-black uppercase text-cordel-wood">
                    {isExpanded ? '▲ Masquer' : '▼ Lire le tuto'}
                  </span>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/15 text-xs text-encre-noire dark:text-cordel-bg-light whitespace-pre-wrap leading-relaxed">
                    {ws.content}
                  </div>
                )}
              </CordelCard>
            );
          })}

          {/* 2. Fallback Built-in Tutorials for Costumes */}
          {Object.entries(FALLBACK_TUTORIALS).map(([key, value]) => {
            // Only show fallback if no Firestore workshop overrides it (contains the key name in the title)
            const hasFirestoreOverride = workshops.some(ws => 
              ws.titre.toLowerCase().includes(key.toLowerCase())
            );
            if (hasFirestoreOverride) return null;

            const isExpanded = expandedIds.has(key);

            return (
              <CordelCard 
                key={key} 
                variant="default" 
                useExtremeBorder={true} 
                className={`p-4 transition-all ${isExpanded ? 'ring-2 ring-cordel-wood bg-white/50' : 'bg-white/20'}`}
              >
                <div 
                  className="flex justify-between items-center cursor-pointer select-none"
                  onClick={() => toggleExpand(key)}
                >
                  <h4 className="font-extrabold text-xs text-encre-noire flex items-center gap-2">
                    {value.titre}
                  </h4>
                  <span className="text-[10px] font-black uppercase text-cordel-wood">
                    {isExpanded ? '▲ Masquer' : '▼ Lire le tuto'}
                  </span>
                </div>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/15 text-xs text-encre-noire dark:text-cordel-bg-light whitespace-pre-wrap leading-relaxed">
                    {value.content}
                  </div>
                )}
              </CordelCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
