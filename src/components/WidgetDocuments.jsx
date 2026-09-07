import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import DocumentUploadForm from './DocumentUploadForm';
import SongCard from './SongCard';
import CultureCard from './CultureCard';
import FabricationCard from './FabricationCard';
import InstrumentModelCard from './InstrumentModelCard';
import PrintConfigModal from './PrintConfigModal';
import ReunionViewModal from './ReunionViewModal';
import DocumentViewerModal from './documents/DocumentViewerModal';
import VaralCategoryRope from './documents/varal/VaralCategoryRope';
import useVaralData, { DEFAULT_VARAL_CATEGORIES, DEFAULT_POLE_ROPES } from '../hooks/useVaralData';
import { isWorkshopVirtualDoc } from '../utils/workshopProjectionUtils';
import { useTranslation } from './LanguageContext';

// Réexport des constantes pour garantir une compatibilité descendante absolue
export { DEFAULT_VARAL_CATEGORIES, DEFAULT_POLE_ROPES };

/**
 * Composant d'orchestration principal du Varal de documents Cordel.
 * Coordonne les flux de données (via useVaralData), l'affichage des cordes
 * de catégories et l'ouverture étanche des différentes modales de consultation.
 */
export default function WidgetDocuments({
  role,
  isSystemAdmin,
  groupId,
  user,
  profileData,
  poleId = null,
  userTags = null,
  canWrite = false,
  onNavigateToView = null
}) {
  const { t } = useTranslation();

  // Consommation du custom hook centralisant les flux Firestore et les mutations du Varal
  const {
    hasMoreDocs,
    varalCategories,
    loading,
    isAuthorized,
    newestDocumentId,
    groupedDocs,
    visibleCategories,
    canDepositOnCategory,
    handleDelete,
    handleMoveLeft,
    handleMoveRight,
    saveCategory,
    loadMoreDocs,
    getDocType
  } = useVaralData({
    groupId,
    poleId,
    userTags,
    profileData,
    role,
    isSystemAdmin,
    canWrite
  });

  // États locaux de navigation et formulaires d'ajout / édition
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState(null);
  const [documentToEdit, setDocumentToEdit] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // États locaux des modales de consultation spécialisées
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedToada, setSelectedToada] = useState(null);
  const [selectedCultureCard, setSelectedCultureCard] = useState(null);
  const [selectedFabrication, setSelectedFabrication] = useState(null);
  const [selectedInstrumentModel, setSelectedInstrumentModel] = useState(null);
  const [selectedReunion, setSelectedReunion] = useState(null);
  const [selectedDocumentView, setSelectedDocumentView] = useState(null);

  // États de l'impression groupée du livret de toadas
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printCategory, setPrintCategory] = useState(null);
  const [printSections, setPrintSections] = useState(null);

  // Gestionnaire d'impression groupée avec injection CSS isolée
  const handleBulkPrint = ({ format, isBW, printSections: selectedSections }) => {
    setShowBulkPrintModal(false);
    setPrintSections(selectedSections);
    setIsPrinting(true);

    if (isBW) document.body.classList.add('print-bw');
    document.body.classList.add(`print-format-${format}`);
    document.body.classList.add('printing-song');

    const styleId = 'dynamic-print-style';
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const margins = { 'A5': '10mm', 'A4': '15mm', 'A3': '20mm' };
    styleEl.innerHTML = `@media print { @page { size: ${format}; margin: ${margins[format] || '15mm'}; } }`;

    setTimeout(() => {
      window.print();
      if (isBW) document.body.classList.remove('print-bw');
      document.body.classList.remove(`print-format-${format}`);
      document.body.classList.remove('printing-song');
      if (styleEl) styleEl.innerHTML = '';
      setIsPrinting(false);
      setPrintCategory(null);
    }, 100);
  };

  // Dispatch de sélection et d'ouverture du document selon son type métier
  const handleSelectDoc = (docItem) => {
    const docType = getDocType(docItem);

    if (isWorkshopVirtualDoc(docItem) || docItem.typeDoc === 'instrument_model' || docItem.typeDoc === 'instrument_part') {
      setSelectedInstrumentModel({
        ...(docItem.modelData || docItem),
        focusedPartId: docItem.partId || null
      });
    } else if (docType === 'report') {
      // Si le compte-rendu est un fichier PDF sans points structurés rédigés, l'ouvrir dans le lecteur universel
      if (docItem.fileUrl && (!docItem.points || docItem.points.length === 0) && !docItem.texte) {
        setSelectedDocumentView(docItem);
      } else {
        setSelectedReport(docItem);
      }
    } else if (docType === 'song') {
      setSelectedToada(docItem);
    } else if (docType === 'culture_fiche') {
      setSelectedCultureCard(docItem);
    } else if (docType === 'fabrication') {
      setSelectedFabrication(docItem);
    } else if (docType === 'reunion') {
      setSelectedReunion(docItem);
    } else {
      setSelectedDocumentView(docItem);
    }
  };

  // Dépôt contextuel sur une corde ciblée
  const handleOpenAddForCategory = (cat) => {
    setSelectedCategoryForAdd(cat);
    setDocumentToEdit(null);
    setIsAdding(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Barre de titre et bouton d'ajout global */}
      <div className="flex justify-between items-center pl-1 pr-1">
        <h3 className="text-xs font-extrabold tracking-wider text-cordel-master-dark opacity-75 uppercase text-left">
          {t('widgetDocuments.title')}
        </h3>
        {!loading && (isAuthorized || canWrite) && !isAdding && poleId !== 'secretariat' && poleId !== 'pedagogie' && (
          <CordelButton
            variant="default"
            onClick={() => {
              setSelectedCategoryForAdd(null);
              setDocumentToEdit(null);
              setIsAdding(true);
            }}
            className="text-[10px] px-2 py-1 uppercase tracking-widest font-black"
          >
            {t('widgetDocuments.uploadBtn')}
          </CordelButton>
        )}
      </div>

      {/* Indicateur de chargement initial */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      )}

      {/* Formulaire modulaire de dépôt ou de modification d'un livret */}
      {!loading && (isAdding || documentToEdit) && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-start select-none">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setDocumentToEdit(null);
                setSelectedCategoryForAdd(null);
              }}
              className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <span>⬅️</span>
              <span>{t('common.back') || "Retour au Varal"}</span>
            </button>
          </div>

          <DocumentUploadForm
            groupId={groupId}
            varalCategories={visibleCategories.length > 0 ? visibleCategories : varalCategories}
            documentToEdit={documentToEdit}
            initialCategoryId={selectedCategoryForAdd ? selectedCategoryForAdd.id : undefined}
            lockCategory={!!selectedCategoryForAdd}
            onClose={() => {
              setIsAdding(false);
              setDocumentToEdit(null);
              setSelectedCategoryForAdd(null);
            }}
          />
        </div>
      )}

      {/* Galerie des cordes suspendues du Varal */}
      {!loading && !isAdding && !documentToEdit && (
        visibleCategories.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-6 text-center bg-cordel-bg">
            <p className="text-xs font-bold text-cordel-master-dark opacity-75">
              Aucun document ou corde accessible dans ce pôle.
            </p>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {visibleCategories.map((category) => (
              <VaralCategoryRope
                key={category.id}
                category={category}
                documents={groupedDocs[category.id] || []}
                newestDocumentId={newestDocumentId}
                isAuthorized={isAuthorized}
                canWrite={canWrite}
                canDeposit={canDepositOnCategory(category)}
                getDocType={getDocType}
                onOpenAdd={handleOpenAddForCategory}
                onNavigateToView={onNavigateToView}
                onEditCategory={setEditingCategory}
                onSelectDoc={handleSelectDoc}
                onMoveLeft={handleMoveLeft}
                onMoveRight={handleMoveRight}
                onEditDoc={setDocumentToEdit}
                onDeleteDoc={handleDelete}
              />
            ))}

            {hasMoreDocs && (
              <div className="flex justify-center p-4">
                <CordelButton
                  variant="default"
                  onClick={loadMoreDocs}
                  className="text-xs px-4 py-2 font-bold uppercase tracking-wider"
                >
                  📜 {t('documents.loadMore', "Charger plus de documents (+40)")}
                </CordelButton>
              </div>
            )}
          </div>
        )
      )}

      {/* Modale d'édition des paramètres d'une corde (nom, upload public) */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-md p-6 text-left relative bg-cordel-bg shadow-xl">
            <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase mb-4 border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
              ✏️ Modifier la Corde / Catégorie
            </h3>

            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  value={editingCategory.nom}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, nom: e.target.value }))}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={editingCategory.activerUploadPublic}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, activerUploadPublic: e.target.checked }))}
                  className="w-4 h-4 cursor-pointer mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-encre-noire">Activer l'upload public</span>
                  <span className="text-[9px] text-cordel-master-dark/70 font-semibold leading-relaxed">
                    Permet aux membres d'accéder à un lien externe pour verser des fichiers.
                  </span>
                </div>
              </label>

              {editingCategory.activerUploadPublic && (
                <div className="flex flex-col gap-1 pl-6">
                  <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Lien d'upload (Drive, Dropbox...)
                  </label>
                  <input
                    type="url"
                    value={editingCategory.lienUploadPublic || ''}
                    onChange={(e) => setEditingCategory(prev => ({ ...prev, lienUploadPublic: e.target.value }))}
                    placeholder="https://..."
                    className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4 border-t border-dashed border-cordel-master-dark/20 pt-4">
                <CordelButton
                  type="button"
                  variant="default"
                  onClick={() => setEditingCategory(null)}
                  className="text-[10px] px-3 py-1.5 uppercase font-bold"
                >
                  Annuler
                </CordelButton>
                <CordelButton
                  type="button"
                  variant="ocre"
                  onClick={async () => {
                    await saveCategory(editingCategory);
                    setEditingCategory(null);
                  }}
                  className="text-[10px] px-3 py-1.5 uppercase font-bold"
                >
                  Enregistrer
                </CordelButton>
              </div>
            </div>
          </CordelCard>
        </div>
      )}

      {/* Modale de consultation d'un compte-rendu textuel ou archivé */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
          <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-2xl p-6 text-left relative bg-cordel-bg shadow-xl max-h-[85vh] flex flex-col">
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
                {t('common.close') || "Fermer"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs">
              {selectedReport.presents && selectedReport.presents.length > 0 && (
                <div className="bg-cordel-bg-light/45 p-3 rounded border border-dashed border-encre-noire/15 flex flex-col gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-wider text-cordel-master-dark opacity-65">
                    Membres présents à cette réunion :
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedReport.presents.map((name, i) => (
                      <span key={`${name}-${i}`} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/50 rounded">
                        👤 {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                    {selectedReport.texte || (selectedReport.fileUrl ? "Document officiel joint ci-dessous." : "Aucun contenu.")}
                  </div>
                )}

                {selectedReport.fileUrl && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
                        📄 Document officiel (PDF joint) :
                      </span>
                      <a
                        href={selectedReport.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-black uppercase text-blue-700 hover:underline"
                      >
                        Ouvrir en plein écran ↗
                      </a>
                    </div>
                    <div className="w-full h-72 rounded border-2 border-encre-noire overflow-hidden bg-white shadow-inner">
                      <iframe
                        src={`${selectedReport.fileUrl}#toolbar=1&navpanes=0`}
                        title={selectedReport.titre}
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-cordel-master-dark/15 text-center text-[9px] font-black text-cordel-wood opacity-55 shrink-0 select-none uppercase tracking-widest">
              O Girador - Document Officiel Archivé
            </div>
          </CordelCard>
        </div>
      )}

      {/* Modale de consultation d'une Toada (Carnet de chants) */}
      {selectedToada && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-6 md:p-12 animate-fadeIn overflow-hidden">
          <div className="relative w-full max-w-[560px] max-h-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedToada(null)}
              className="absolute -top-3 -right-3 z-50 bg-[var(--theme-primary)] text-white w-8 h-8 rounded-full font-black flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors border-2 border-white cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>
            <div className="w-full h-full overflow-y-auto scrollbar-hide rounded-lg shadow-2xl flex justify-center">
              <SongCard
                song={selectedToada}
                defaultRevisionMode={false}
                allDocsToPrint={groupedDocs['Toadas'] || []}
                onPrintAll={(config) => {
                  setSelectedToada(null);
                  setPrintCategory('Toadas');
                  handleBulkPrint(config);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modale de consultation d'une fiche Culture */}
      {selectedCultureCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 sm:p-6 md:p-12 animate-fadeIn overflow-hidden">
          <div className="relative w-full max-w-[560px] max-h-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setSelectedCultureCard(null)}
              className="absolute -top-3 -right-3 z-50 bg-[var(--theme-primary)] text-white w-8 h-8 rounded-full font-black flex items-center justify-center shadow-lg hover:bg-red-700 transition-colors border-2 border-white cursor-pointer"
              title="Fermer"
            >
              ✕
            </button>
            <div className="w-full h-full overflow-y-auto scrollbar-hide rounded-lg shadow-2xl flex justify-center">
              <CultureCard culture={selectedCultureCard} />
            </div>
          </div>
        </div>
      )}

      {/* Modale de fiche de fabrication */}
      {selectedFabrication && (
        <FabricationCard fabrication={selectedFabrication} onClose={() => setSelectedFabrication(null)} />
      )}

      {/* Modale de modèle d'instrument d'atelier */}
      {selectedInstrumentModel && (
        <InstrumentModelCard
          model={selectedInstrumentModel}
          initialPartId={selectedInstrumentModel.focusedPartId}
          profileData={profileData}
          onClose={() => setSelectedInstrumentModel(null)}
        />
      )}

      {/* Modale d'événement de type réunion */}
      {selectedReunion && (
        <ReunionViewModal
          event={selectedReunion.reunionData}
          user={user}
          profileData={profileData}
          onClose={() => setSelectedReunion(null)}
        />
      )}

      {/* Lecteur universel de documents (PDF, vidéos, dossiers partagés, liens web) */}
      {selectedDocumentView && (
        <DocumentViewerModal
          document={selectedDocumentView}
          onClose={() => setSelectedDocumentView(null)}
        />
      )}

      {/* Conteneur d'impression groupée rendu dans le body via Portal */}
      {isPrinting && printCategory && createPortal(
        <div className="print:block bg-white w-full">
          {(groupedDocs[printCategory] || [])
            .filter(d => d.type === 'song' || !d.type)
            .map(song => (
              <div key={song.id} className="print-song-page">
                <SongCard song={song} defaultRevisionMode={false} isPrintVersion={true} printSections={printSections} />
              </div>
            ))}
        </div>,
        document.body
      )}

      {/* Modale de configuration de l'impression groupée */}
      {showBulkPrintModal && printCategory && (
        <PrintConfigModal
          title={`Imprimer le Carnet (${(groupedDocs[printCategory] || []).length} chants)`}
          onClose={() => setShowBulkPrintModal(false)}
          onConfirm={handleBulkPrint}
        />
      )}
    </div>
  );
}
