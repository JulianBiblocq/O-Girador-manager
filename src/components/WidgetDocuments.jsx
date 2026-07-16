import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';

export default function WidgetDocuments({ role, isSystemAdmin, groupId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Real-time synchronization with Firestore documents collection
  useEffect(() => {
    if (!groupId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const docsRef = collection(db, 'documents');
    const q = query(docsRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedDocs = [];
      querySnapshot.forEach((doc) => {
        fetchedDocs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by upload date (most recent first)
      fetchedDocs.sort((a, b) => new Date(b.dateAjout) - new Date(a.dateAjout));
      setDocuments(fetchedDocs);
      setLoading(false);
    }, (error) => {
      console.error("WidgetDocuments - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Group documents by category in JavaScript
  const groupedDocs = documents.reduce((acc, doc) => {
    const cat = doc.categorie || 'Autre';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(doc);
    return acc;
  }, {});

  const categoryVariants = {
    'Partitions': 'ocre',
    'Tutoriels': 'vert',
    'Administratif': 'bleu',
    'Comptes Rendus': 'kraft'
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Title & Action Bar */}
      <div className="flex justify-between items-center pl-1 pr-1">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left">
          Varal de Documents
        </h3>
        {!loading && isAuthorized && !isAdding && (
          <CordelButton 
            variant="default" 
            onClick={() => setIsAdding(true)} 
            className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
          >
            + Ajouter
          </CordelButton>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Upload Form view */}
      {!loading && isAdding && (
        <DocumentUploadForm 
          groupId={groupId} 
          onClose={() => setIsAdding(false)} 
        />
      )}

      {/* Documents Clothesline View (grouped by category) */}
      {!loading && !isAdding && (
        documents.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 text-center">
            <p className="text-xs opacity-75 font-semibold">Aucun document suspendu.</p>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(groupedDocs).map(([categoryName, docList]) => {
              const variant = categoryVariants[categoryName] || 'default';
              
              return (
                <CordelCard key={categoryName} variant="default" useExtremeBorder={true} className="pb-8 pt-4 relative overflow-hidden bg-cordel-bg-light">
                  {/* Category Title Stamp */}
                  <div className="text-left mb-2 pl-2">
                    <span className={`theme-stamp-badge theme-stamp-badge-${variant === 'ocre' || variant === 'vert' ? 'wood' : 'dark'} text-[8px] tracking-wider`}>
                      {categoryName}
                    </span>
                  </div>

                  {/* SVG Curved Clothesline Rope */}
                  <div className="absolute top-10 left-0 right-0 h-10 w-full z-0 select-none pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 350 30" preserveAspectRatio="none">
                      <path 
                        d="M 10 10 Q 175 30 340 10" 
                        fill="none" 
                        stroke="var(--cordel-border)" 
                        strokeWidth="2" 
                        strokeDasharray="4 3" 
                      />
                    </svg>
                  </div>

                  {/* Hanging Booklets */}
                  <div className="flex flex-wrap justify-around items-start gap-4 mt-8 relative z-10">
                    {docList.map((docItem, index) => {
                      // Alternate rotation slightly for that organic handcrafted feel
                      const rotationClass = index % 2 === 0 ? 'rotate-[-3deg]' : 'rotate-[2.5deg]';
                      
                      return (
                        <div 
                          key={docItem.id}
                          onClick={() => window.open(docItem.fileUrl, '_blank')}
                          className={`
                            relative flex flex-col items-center group cursor-pointer
                            transition-all duration-300 origin-top
                            ${rotationClass} hover:rotate-0 hover:scale-105
                          `}
                          title={`Ouvrir ${docItem.titre}`}
                        >
                          {/* Clothespin Simulator (Pince à linge) */}
                          <div className="absolute -top-3 w-2.5 h-6 bg-[#a67a53] border border-encre-noire rounded-sm shadow-sm z-30 flex flex-col justify-between py-0.5 items-center select-none">
                            <div className="w-1.5 h-0.5 bg-neutral-800 opacity-60"></div>
                            <div className="w-1.5 h-0.5 bg-neutral-800 opacity-40"></div>
                          </div>

                          {/* Booklet Cover */}
                          <div 
                            className={`
                              w-28 h-36 border-2 border-encre-noire p-3 flex flex-col justify-between text-left
                              bg-cordel-bg-light shadow-[3px_3px_0px_0px_#181716]
                              rounded-[4px_10px_3px_8px]
                              border-l-4 border-l-double
                              theme-bg-${variant}
                            `}
                          >
                            {/* Booklet Top */}
                            <div className="flex flex-col min-w-0">
                              <div className="w-full border-b border-dashed border-encre-noire/25 pb-1 select-none">
                                <span className="text-[6px] font-black uppercase tracking-widest opacity-60">
                                  DOC
                                </span>
                              </div>
                              <h4 className="font-extrabold text-[10px] text-encre-noire leading-tight mt-1.5 break-words line-clamp-3">
                                {docItem.titre}
                              </h4>
                            </div>

                            {/* Booklet Bottom */}
                            <div className="mt-auto select-none">
                              <div className="text-[7px] text-right font-black uppercase mt-1">
                                Lire ➜
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CordelCard>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
