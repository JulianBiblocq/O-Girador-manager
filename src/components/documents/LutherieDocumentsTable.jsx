import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import DocumentUploadForm from '../DocumentUploadForm';

/**
 * Vue et tableau unique du Pôle Lutherie (varal-lutherie) : "Fiches & Tutoriels de Lutherie"
 * Colonnes : Modèle d'instrument, Étape / Chapitre, Auteur, Actions (Consulter, Éditer, Supprimer).
 */
export default function LutherieDocumentsTable({
  documents = [],
  groupId,
  categories = [],
  canWrite = false,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc,
  onToggleViewMode
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [docUnderEdit, setDocUnderEdit] = useState(null);

  // Filtre strict Lutherie :
  // Inclusion : categoryId === 'TutosFabrication' OU issu de instrument_models OU domaine === 'lutherie'
  // Exclusion : UNIQUEMENT les fiches explicitement marquées pour la couture (domaine === 'costumerie' ou theme === 'couture' ou type === 'patron_costume')
  const lutherieDocs = useMemo(() => {
    return documents.filter((d) => {
      // 1. Exclusion stricte couture uniquement
      const isExplicitCostume = (
        d.domaine === 'costumerie' ||
        d.domain === 'costumerie' ||
        d.theme === 'couture' ||
        d.themeCulture === 'couture' ||
        d.type === 'patron_costume' ||
        d.typeDoc === 'patron_costume' ||
        d.categoryId === 'Costumerie' ||
        d.categoryId === 'PatronsCostumes' ||
        d.categoryId === 'TutosCostumes'
      );
      if (isExplicitCostume) return false;

      // Exclure les autres catégories explicites non-lutherie
      if (['Toadas', 'Culture', 'Administratif', 'ComptesRendus', 'PhotosPrestations'].includes(d.categoryId)) {
        return false;
      }
      if (d.type === 'song' || d.type === 'culture_fiche' || d.type === 'reunion' || d.type === 'reunion_pv') {
        return false;
      }

      // 2. Critère d'inclusion
      const isIncluded = (
        d.categoryId === 'TutosFabrication' ||
        d.categorie === 'Tutos Fabrication' ||
        d.categorie === 'TutosFabrication' ||
        d.domaine === 'lutherie' ||
        d.domain === 'lutherie' ||
        d.isVirtualAtelier === true ||
        d.isWorkshopVirtual === true ||
        d.type === 'instrument_model' ||
        d.typeDoc === 'instrument_model' ||
        (typeof d.id === 'string' && d.id.startsWith('model_'))
      );

      return isIncluded;
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
            <span>🪓</span>
            <span>Fiches & Tutoriels de Lutherie</span>
            <span className="text-[10px] font-bold text-encre-noire/60">({lutherieDocs.length})</span>
          </h3>
          <p className="text-[10px] text-cordel-master-dark/70">
            Guide de fabrication, fûts, cercles, peaux et réglages d'instruments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-white text-encre-noire cursor-pointer transition-all shadow-2xs"
            >
              🪢 Vue Varal
            </button>
          )}

          {canWrite && !isAdding && (
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleStartAdd}
              className="text-[10px] px-3 py-1 font-black uppercase tracking-wider"
            >
              ➕ Nouvelle fiche lutherie
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
              ⬅️ Annuler et revenir au tableau de lutherie
            </button>
          </div>
          <DocumentUploadForm
            groupId={groupId}
            varalCategories={categories}
            documentToEdit={docUnderEdit}
            initialCategoryId="TutosFabrication"
            lockCategory={true}
            onClose={() => { setIsAdding(false); setDocUnderEdit(null); }}
          />
        </div>
      )}

      {/* Tableau unique Lutherie */}
      {!isAdding && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3">
          {lutherieDocs.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-cordel-master-dark/60">
              Aucune fiche ou tutoriel de lutherie enregistré pour le moment.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs text-left">
                <thead>
                  <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                    <th className="px-3 py-2">Modèle d'instrument</th>
                    <th className="px-3 py-2">Étape / Chapitre</th>
                    <th className="px-3 py-2">Auteur</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
                  {lutherieDocs.map((docItem) => {
                    const instrumentName = docItem.instrumentName || docItem.instrumentModel || docItem.modele || docItem.titre || "Instrument";
                    const etape = docItem.etape || docItem.chapitre || docItem.partName || docItem.sousTitre || "Tutoriel complet";
                    const auteur = docItem.auteur || docItem.authorName || docItem.createur || "Atelier Lutherie";
                    const isVirtual = docItem.isVirtualWorkshopDoc === true;

                    return (
                      <tr key={docItem.id} className="hover:bg-cordel-bg/40 transition-colors">
                        <td className="px-3 py-2 font-bold text-encre-noire flex items-center gap-2">
                          <span className="text-sm">🪓</span>
                          <button
                            type="button"
                            onClick={() => onSelectDoc && onSelectDoc(docItem)}
                            className="text-left font-bold hover:underline hover:text-cordel-wood truncate max-w-xs cursor-pointer"
                          >
                            {instrumentName}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-[10.5px] text-cordel-master-dark whitespace-nowrap">
                          {etape}
                        </td>
                        <td className="px-3 py-2 text-[10px] text-encre-noire/70 whitespace-nowrap">
                          {auteur}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectDoc && onSelectDoc(docItem)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                            title="Consulter la fiche technique"
                          >
                            👁️ Consulter
                          </button>
                          {canWrite && !isVirtual && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(docItem)}
                                className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 border border-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                                title="Modifier cette fiche"
                              >
                                ✏️ Éditer
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteDoc && onDeleteDoc(docItem)}
                                className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-red-900 border border-red-900 shadow-2xs hover:bg-red-200 cursor-pointer"
                                title="Supprimer la fiche"
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
