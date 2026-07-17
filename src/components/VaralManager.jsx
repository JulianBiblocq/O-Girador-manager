import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';
import { useTranslation } from './LanguageContext';
import { XiloChisel } from './XiloIcons';

const DEFAULT_VARAL_CATEGORIES = [
  { id: 'Partitions', nom: 'Partitions', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Tutoriels', nom: 'Tutoriels', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Culture', nom: 'Culture', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: false },
  { id: 'Administratif', nom: 'Administratif', activerUploadPublic: false, lienUploadPublic: '', activerOpaciteArchive: true }
];

export default function VaralManager({ groupId, onBack, role, isSystemAdmin }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [varalCategories, setVaralCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // 1. Charger les catégories de Varal de l'association
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        setVaralCategories(docSnap.data().varalCategories || DEFAULT_VARAL_CATEGORIES);
      } else {
        setVaralCategories(DEFAULT_VARAL_CATEGORIES);
      }
    }, (err) => {
      console.error("VaralManager - Error fetching association:", err);
    });
    return () => unsubscribe();
  }, [groupId]);

  // 2. Charger tous les documents du groupe
  useEffect(() => {
    if (!groupId || !isAuthorized) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'documents'), where('groupId', '==', groupId));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = [];
      snap.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      // Trier par ordre et par dateCreation
      fetched.sort((a, b) => {
        if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
        return new Date(b.dateAjout || 0) - new Date(a.dateAjout || 0);
      });
      setDocuments(fetched);
      setLoading(false);
    }, (err) => {
      console.error("VaralManager - Error fetching documents:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [groupId, isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="text-center py-12 select-none">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-xl font-bold text-cordel-wood">🚨 ACCÈS REFUSÉ</h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous devez être administrateur pour accéder au gestionnaire de Varal.
          </p>
          <div className="mt-6 flex justify-center">
            <CordelButton variant="default" onClick={onBack} className="text-xs">
              ⬅️ {t('common.back')}
            </CordelButton>
          </div>
        </CordelCard>
      </div>
    );
  }

  const handleDelete = async (docItem) => {
    const confirmMsg = t('documents.deleteConfirm') || "Voulez-vous vraiment supprimer ce document ?";
    if (!window.confirm(confirmMsg)) return;

    try {
      if (docItem.fileUrl && docItem.fileUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const fileRef = ref(storage, docItem.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("VaralManager - Error deleting storage file:", storageError);
        }
      }

      await deleteDoc(doc(db, 'documents', docItem.id));
    } catch (error) {
      console.error("VaralManager - Error deleting document:", error);
      alert(t('documents.deleteError') || "Erreur lors de la suppression du document.");
    }
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'audio': return '🎵 Audio';
      case 'video': return '🎥 Vidéo';
      case 'image': return '🖼️ Image';
      case 'web': return '🌐 Web / URL';
      default: return '📄 PDF / Fichier';
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={onBack} 
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
        >
          ⬅️ {t('common.back')}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloChisel size={16} /> Gestionnaire de documents (Varal)
        </h2>
      </div>

      {/* Main Workspace */}
      {isAdding || documentToEdit ? (
        <div className="max-w-xl mx-auto w-full">
          <DocumentUploadForm 
            groupId={groupId}
            varalCategories={varalCategories}
            documentToEdit={documentToEdit}
            onClose={() => {
              setIsAdding(false);
              setDocumentToEdit(null);
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-xs opacity-75 leading-relaxed max-w-xl">
              Gérez les fichiers, partitions, tutoriels et enregistrements audios de votre groupe sous forme de tableau épuré. Les modifications apportées ici se répercutent automatiquement sur le Varal de l'accueil.
            </p>
            <CordelButton 
              variant="ocre" 
              useExtremeBorder={true}
              onClick={() => setIsAdding(true)}
              className="text-xs px-4 py-2 font-bold whitespace-nowrap"
            >
              ➕ Ajouter un document
            </CordelButton>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <span className="text-xs font-bold uppercase tracking-widest text-cordel-master-dark opacity-65 animate-pulse">
                Chargement des documents...
              </span>
            </div>
          ) : documents.length === 0 ? (
            <CordelCard className="p-8 text-center bg-white/50">
              <p className="text-xs italic opacity-60">Aucun document chargé dans le Varal pour le moment.</p>
            </CordelCard>
          ) : (
            <CordelCard className="p-0 overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                      <th className="py-2.5 px-3">Nom du fichier</th>
                      <th className="py-2.5 px-3">Corde assignée</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((docItem) => (
                      <tr 
                        key={docItem.id} 
                        className="border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover/50 transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-encre-noire">
                          {docItem.titre}
                          {docItem.sousCategorie && (
                            <span className="block text-[8px] font-bold text-cordel-wood uppercase tracking-wider mt-0.5">
                              📁 {docItem.sousCategorie} ({docItem.annee})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold opacity-85">
                          🎗️ {docItem.categorie || docItem.categoryId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[10px]">
                          {getDocTypeBadge(docItem.type || 'pdf')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(docItem.fileUrl || docItem.type === 'report') && (
                              <button
                                onClick={() => {
                                  if (docItem.type === 'report') {
                                    setSelectedReport(docItem);
                                  } else {
                                    window.open(docItem.fileUrl, '_blank');
                                  }
                                }}
                                className="text-[10px] font-black uppercase bg-neutral-100 hover:bg-neutral-200 text-encre-noire border border-encre-noire/30 px-2.5 py-1 rounded"
                              >
                                Aperçu
                              </button>
                            )}
                            <button
                              onClick={() => setDocumentToEdit(docItem)}
                              className="text-[10px] font-black uppercase bg-[#d99f4d]/80 hover:bg-[#d99f4d] text-encre-noire border border-encre-noire/30 px-2.5 py-1 rounded"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(docItem)}
                              className="text-[10px] font-black uppercase bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-2.5 py-1 rounded"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CordelCard>
          )}
        </div>
      )}

      {/* Modale de lecture du Compte-Rendu (Gestionnaire / Cordel) */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-2xl p-6 text-left relative bg-cordel-bg shadow-xl max-h-[85vh] flex flex-col">
            {/* Header / Stamp */}
            <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/20 pb-3 mb-4 shrink-0">
              <div>
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] tracking-wider mb-1 inline-block">
                  📜 COMPTE-RENDU DE RÉUNION
                </span>
                <h3 className="text-base font-extrabold text-cordel-wood uppercase">
                  {selectedReport.titre}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-xs font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs">
              
              {/* Presents Badge Row */}
              {selectedReport.presents && selectedReport.presents.length > 0 && (
                <div className="bg-cordel-bg-light/45 p-3 rounded border border-dashed border-encre-noire/15 flex flex-col gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-cordel-master-dark opacity-65">
                    Membres présents à cette réunion :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedReport.presents.map((name, i) => (
                      <span key={i} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/50 rounded">
                        👤 {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured points list */}
              <div className="flex flex-col gap-4 mt-2">
                {selectedReport.points && selectedReport.points.length > 0 ? (
                  selectedReport.points.map((p, idx) => (
                    <div key={p.id || idx} className="theme-inner-panel p-4 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
                      <span className="font-extrabold text-encre-noire border-b border-dashed border-encre-noire/10 pb-1">
                        📌 {p.titre}
                      </span>
                      <p className="opacity-90 leading-relaxed font-semibold italic whitespace-pre-wrap pl-2 text-encre-noire">
                        {p.notesCR || "Aucune note rédigée pour ce point."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="theme-inner-panel p-4 rounded-[4px_6px_3px_5px] whitespace-pre-wrap leading-relaxed italic font-semibold text-encre-noire">
                    {selectedReport.texte || "Aucun contenu."}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/15 text-center text-[9px] font-black text-cordel-wood opacity-55 shrink-0 select-none uppercase tracking-widest">
              O Girador - Document Officiel Archivé
            </div>
          </CordelCard>
        </div>
      )}
    </div>
  );
}
