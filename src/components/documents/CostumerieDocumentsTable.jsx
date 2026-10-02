import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import DocumentUploadForm from '../DocumentUploadForm';
import { useTranslation } from '../LanguageContext';

/**
 * Vue et tableau unique du Pôle Costumerie (varal-costumerie) : "Patrons & Fiches de Confection"
 * Colonnes : Nom du costume / pièce, Patron PDF joint, Actions (Consulter, Éditer, Télécharger patron, Supprimer).
 */
export default function CostumerieDocumentsTable({
  documents = [],
  groupId,
  categories = [],
  canWrite = false,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc,
  onToggleViewMode
}) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [docUnderEdit, setDocUnderEdit] = useState(null);

  // Filtre strict Costumerie : domaine costumerie ou thématique textile / couture / patron
  const costumeDocs = useMemo(() => {
    return documents.filter((d) => {
      if (['Toadas', 'Culture', 'Administratif', 'ComptesRendus', 'PhotosPrestations'].includes(d.categoryId)) {
        return false;
      }
      if (d.type === 'song' || d.type === 'culture_fiche' || d.type === 'reunion' || d.type === 'reunion_pv') {
        return false;
      }
      const text = `${d.titre || ''} ${d.description || ''} ${d.domaine || ''} ${d.theme || ''} ${d.categorie || ''} ${d.categoryId || ''}`.toLowerCase();
      const isCostumeCategory = ['costumerie', 'patronscostumes', 'tutoscostumes'].includes((d.categoryId || '').toLowerCase());
      const hasCostumeKeywords = text.includes('costume') || text.includes('couture') || text.includes('textile') || text.includes('patron') || text.includes('tissu') || text.includes('vestiaire');

      return d.domain === 'costumerie' || d.domaine === 'costumerie' || isCostumeCategory || hasCostumeKeywords;
    });
  }, [documents]);

  const handleStartAdd = () => {
    setDocUnderEdit(null);
    setIsAdding(true);
  };

  const handleStartEdit = (docItem) => {
    setDocUnderEdit(docItem);
    setIsAdding(true);
  };

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-4xl mx-auto">
      {/* En-tête du tableau et barre d'actions */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-2 flex-wrap">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>✂️</span>
            <span>{t('costumerie.patronsFichesDeConfection')}</span>
            <span className="text-[10px] font-bold text-encre-noire/60">({costumeDocs.length})</span>
          </h3>
          <p className="text-[10px] text-cordel-master-dark/70">
            {t('costumerie.fichesDeCoupePatronsTelechargeables')}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-white text-encre-noire cursor-pointer transition-all shadow-2xs"
            >
              {t('costumerie.vueVaral')}
            </button>
          )}

          {canWrite && !isAdding && (
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleStartAdd}
              className="text-[10px] px-3 py-1 font-black uppercase tracking-wider"
            >
              {t('costumerie.nouveauPatronFiche')}
            </CordelButton>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout / modification */}
      {isAdding && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => { setIsAdding(false); setDocUnderEdit(null); }}
              className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
            >
              {t('costumerie.annulerEtRevenirAuTableau')}
            </button>
          </div>
          <DocumentUploadForm
            groupId={groupId}
            varalCategories={categories}
            documentToEdit={docUnderEdit}
            initialCategoryId="Costumerie"
            lockCategory={false}
            onClose={() => { setIsAdding(false); setDocUnderEdit(null); }}
          />
        </div>
      )}

      {/* Tableau unique Costumerie */}
      {!isAdding && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3">
          {costumeDocs.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-cordel-master-dark/60">
              {t('costumerie.aucunPatronOuFicheDe')}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs text-left">
                <thead>
                  <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                    <th className="px-3 py-2">{t('costumerie.nomDuCostumePiece')}</th>
                    <th className="px-3 py-2">{t('costumerie.patronPdfJoint')}</th>
                    <th className="px-3 py-2 text-right">{t('costumerie.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
                  {costumeDocs.map((docItem) => {
                    const costumeName = docItem.titre || docItem.nomCostume || docItem.pieceName || "Pièce de costume";
                    const fileUrl = docItem.fileUrl || docItem.patronUrl || docItem.pdfUrl || null;
                    const hasPdf = Boolean(fileUrl && (fileUrl.toLowerCase().includes('.pdf') || docItem.typeDoc === 'pdf'));

                    return (
                      <tr key={docItem.id} className="hover:bg-cordel-bg/40 transition-colors">
                        <td className="px-3 py-2 font-bold text-encre-noire flex items-center gap-2">
                          <span className="text-sm">👗</span>
                          <div className="flex flex-col min-w-0">
                            <button
                              type="button"
                              onClick={() => onSelectDoc && onSelectDoc(docItem)}
                              className="text-left font-bold hover:underline hover:text-cordel-wood truncate max-w-sm cursor-pointer"
                            >
                              {costumeName}
                            </button>
                            {docItem.description && (
                              <span className="text-[10px] text-cordel-master-dark/70 truncate max-w-xs">
                                {docItem.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {fileUrl ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300 text-[8.5px] font-bold uppercase flex items-center gap-1 w-fit">
                              <span>📎</span>
                              <span>{hasPdf ? 'Patron PDF' : 'Fichier joint'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 italic">{t('costumerie.aucunFichier')}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectDoc && onSelectDoc(docItem)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                            title={t('costumerie.consulterLaFiche')}
                          >
                            {t('costumerie.voir')}
                          </button>
                          {fileUrl && (
                            <button
                              type="button"
                              onClick={() => window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                              className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 text-amber-950 border border-amber-800/50 shadow-2xs hover:bg-amber-200 cursor-pointer"
                              title={t('costumerie.telechargerLePatronPdf')}
                            >
                              {t('costumerie.patron')}
                            </button>
                          )}
                          {canWrite && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(docItem)}
                                className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 border border-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                                title={t('costumerie.modifierCetteFiche')}
                              >
                                {t('costumerie.btnEditPencil')}
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteDoc && onDeleteDoc(docItem)}
                                className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-red-900 border border-red-900 shadow-2xs hover:bg-red-200 cursor-pointer"
                                title={t('costumerie.supprimerLaFiche')}
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CordelCard>
      )}
    </div>
  );
}
