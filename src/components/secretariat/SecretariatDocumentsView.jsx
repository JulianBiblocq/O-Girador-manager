import React, { useState, useMemo } from 'react';
import CordelButton from '../CordelButton';
import DocumentUploadForm from '../DocumentUploadForm';
import ReunionViewModal from '../ReunionViewModal';
import DocumentViewerModal from '../documents/DocumentViewerModal';
import StatutDocumentsTable from './StatutDocumentsTable';
import ReunionsPvTable from './ReunionsPvTable';
import useVaralData, { isAdministrativeDoc } from '../../hooks/useVaralData';
import { useTranslation } from '../LanguageContext';

/**
 * Vue Secrétariat avec 2 tableaux étanches :
 * - TABLEAU A : Documents administratifs permanents (Statuts, RI, RIB, Assurance).
 * - TABLEAU B : Comptes-rendus & Procès-Verbaux de réunions.
 */
export default function SecretariatDocumentsView({
  groupId,
  role,
  isSystemAdmin,
  canWrite = false,
  user,
  profileData,
  userTags
}) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState('both'); // 'both' | 'statuts' | 'reunions'
  const [isAdding, setIsAdding] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [selectedDocumentView, setSelectedDocumentView] = useState(null);
  const [selectedReunion, setSelectedReunion] = useState(null);

  const {
    documents,
    reunions,
    loading,
    handleDelete,
    varalCategories
  } = useVaralData({
    groupId,
    poleId: 'secretariat',
    userTags,
    profileData,
    role,
    isSystemAdmin,
    canWrite
  });

  // TABLEAU A : Documents administratifs permanents (filtrage strict)
  const statutDocs = useMemo(() => {
    return documents.filter(d => {
      if (['Toadas', 'Culture', 'TutosFabrication', 'PhotosPrestations', 'Costumerie', 'PatronsCostumes'].includes(d.categoryId)) {
        return false;
      }
      if (d.type === 'song' || d.type === 'culture_fiche' || d.type === 'fabrication_booklet' || d.type === 'instrument_model') {
        return false;
      }
      if (d.type === 'reunion' || d.type === 'reunion_pv' || d.reunionData) {
        return false;
      }
      return d.categoryId === 'Administratif' || d.categorie === 'Administratif' || isAdministrativeDoc(d) || d.typeDoc === 'statuts';
    });
  }, [documents]);

  // TABLEAU B : Comptes-rendus & Procès-Verbaux de réunions (filtrage strict)
  const sortedReunions = useMemo(() => {
    const agendaReunions = (reunions || []).map(r => ({
      id: r.id,
      titre: r.titre || `Réunion du ${r.date ? new Date(r.date).toLocaleDateString('fr-FR') : ''}`,
      date: r.date,
      lieu: r.lieu,
      compteRenduStatus: r.compteRenduStatus || 'publie',
      compteRenduPdfUrl: r.compteRenduPdfUrl || r.fileUrl || null,
      rawReunion: r
    }));

    const docReunions = documents
      .filter(d => (d.categoryId === 'ComptesRendus' || d.type === 'reunion_pv' || d.typeDoc === 'reunion') && !d.reunionData)
      .map(d => ({
        id: d.id,
        titre: d.titre || "Procès-verbal",
        date: d.date || d.dateAjout || d.createdAt,
        lieu: d.lieu || null,
        compteRenduStatus: 'publie',
        compteRenduPdfUrl: d.fileUrl || null,
        rawDoc: d
      }));

    return [...agendaReunions, ...docReunions].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [reunions, documents]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs font-black uppercase tracking-widest text-cordel-wood animate-pulse">
        ⏳ Chargement du registre officiel du Secrétariat...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-4xl mx-auto">
      {/* Barre de navigation et filtre rapide entre les 2 tableaux */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter('both')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'both'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            📋 Les 2 Tableaux
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('statuts')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'statuts'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            🏛️ Statuts permanents ({statutDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('reunions')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'reunions'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            📜 Comptes-Rendus & PV ({sortedReunions.length})
          </button>
        </div>

        {canWrite && !isAdding && (
          <CordelButton
            variant="ocre"
            useExtremeBorder={true}
            onClick={() => { setIsAdding(true); setDocumentToEdit(null); }}
            className="text-[10px] px-3 py-1 font-black uppercase tracking-wider shrink-0"
          >
            ➕ Verser un document officiel
          </CordelButton>
        )}
      </div>

      {/* Formulaire de versement */}
      {isAdding && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setDocumentToEdit(null); }}
              className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
            >
              ⬅️ Annuler et revenir aux tableaux
            </button>
          </div>
          <DocumentUploadForm
            groupId={groupId}
            varalCategories={varalCategories}
            documentToEdit={documentToEdit}
            initialCategoryId="Administratif"
            lockCategory={false}
            onClose={() => { setIsAdding(false); setDocumentToEdit(null); }}
          />
        </div>
      )}

      {/* TABLEAU A : Documents administratifs permanents */}
      {!isAdding && (activeFilter === 'both' || activeFilter === 'statuts') && (
        <div data-tour="sec-docs-permanent-table" className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🏛️</span>
              <span>Tableau A : Documents administratifs permanents</span>
              <span className="text-[10px] font-bold text-encre-noire/60">({statutDocs.length})</span>
            </h3>
            <span className="text-[9.5px] italic text-encre-noire/60">Statuts, Règlement Intérieur, RIB, Assurance</span>
          </div>
          <StatutDocumentsTable
            docs={statutDocs}
            canWrite={canWrite}
            onViewDoc={(doc) => setSelectedDocumentView(doc)}
            onEditDoc={(doc) => { setDocumentToEdit(doc); setIsAdding(true); }}
            onDeleteDoc={(doc) => handleDelete(doc)}
          />
        </div>
      )}

      {/* TABLEAU B : Comptes-rendus & Procès-Verbaux de réunions */}
      {!isAdding && (activeFilter === 'both' || activeFilter === 'reunions') && (
        <div data-tour="sec-docs-reunions-table" className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>📜</span>
              <span>Tableau B : Comptes-rendus & Procès-Verbaux de réunions</span>
              <span className="text-[10px] font-bold text-encre-noire/60">({sortedReunions.length})</span>
            </h3>
            <span className="text-[9.5px] italic text-encre-noire/60">Assemblées générales, réunions de CA et comités</span>
          </div>
          <ReunionsPvTable
            reunions={sortedReunions}
            canDelete={canWrite}
            onOpenPv={(reunion) => setSelectedReunion(reunion.rawReunion || reunion)}
            onDeleteReunion={(reunion) => {
              if (reunion.rawDoc) handleDelete(reunion.rawDoc);
            }}
          />
        </div>
      )}

      {/* Modale de consultation réunion */}
      {selectedReunion && (
        <ReunionViewModal
          event={selectedReunion}
          user={user}
          profileData={profileData}
          onClose={() => setSelectedReunion(null)}
        />
      )}

      {/* Lecteur de document PDF / fichier */}
      {selectedDocumentView && (
        <DocumentViewerModal
          document={selectedDocumentView}
          onClose={() => setSelectedDocumentView(null)}
        />
      )}
    </div>
  );
}
