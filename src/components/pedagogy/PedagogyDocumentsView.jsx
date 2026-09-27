import React, { useState, useMemo } from 'react';
import CordelButton from '../CordelButton';
import DocumentUploadForm from '../DocumentUploadForm';
import ToadasTable from './ToadasTable';
import CultureFichesTable from './CultureFichesTable';

/**
 * Vue Pédagogie avec 2 tableaux étanches :
 * - TABLEAU A : Toadas (Chants & Paroles)
 * - TABLEAU B : Fiches Culture & Histoire
 */
export default function PedagogyDocumentsView({
  documents = [],
  groupId,
  categories = [],
  canWrite = false,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc,
  onToggleViewMode
}) {
  const [activeFilter, setActiveFilter] = useState('both'); // 'both' | 'toadas' | 'culture'
  const [isAdding, setIsAdding] = useState(false);
  const [addCategoryTarget, setAddCategoryTarget] = useState('Toadas');
  const [docUnderEdit, setDocUnderEdit] = useState(null);

  // TABLEAUX A & B : Filtrage strict Toadas & Culture
  const toadasDocs = useMemo(() => documents.filter(d => 
    !['Administratif', 'ComptesRendus', 'TutosFabrication', 'PhotosPrestations', 'Costumerie', 'PatronsCostumes'].includes(d.categoryId) &&
    (d.categoryId === 'Toadas' || d.type === 'song' || d.toadaData !== undefined)
  ), [documents]);

  const cultureDocs = useMemo(() => documents.filter(d => 
    !['Administratif', 'ComptesRendus', 'TutosFabrication', 'PhotosPrestations', 'Costumerie', 'PatronsCostumes'].includes(d.categoryId) &&
    (d.categoryId === 'Culture' || d.type === 'culture_fiche')
  ), [documents]);

  const handleStartAdd = (catId) => { setAddCategoryTarget(catId); setDocUnderEdit(null); setIsAdding(true); };
  const handleStartEdit = (docItem) => { setDocUnderEdit(docItem); setIsAdding(true); };
  const handleCloseForm = () => { setIsAdding(false); setDocUnderEdit(null); };

  return (
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-4xl mx-auto">
      {/* Barre d'actions et sélecteur de tableaux */}
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
            onClick={() => setActiveFilter('toadas')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'toadas'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            🎵 Toadas ({toadasDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('culture')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'culture'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            📖 Culture & Histoire ({cultureDocs.length})
          </button>
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
            <div className="flex items-center gap-1.5">
              <CordelButton
                variant="ocre"
                useExtremeBorder={true}
                onClick={() => handleStartAdd('Toadas')}
                className="text-[10px] px-2.5 py-1 font-black uppercase tracking-wider"
              >
                ➕ Nouvelle Toada
              </CordelButton>
              <CordelButton
                variant="vert"
                useExtremeBorder={true}
                onClick={() => handleStartAdd('Culture')}
                className="text-[10px] px-2.5 py-1 font-black uppercase tracking-wider text-white"
              >
                ➕ Fiche Culture
              </CordelButton>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout / modification */}
      {isAdding && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
            >
              ⬅️ Annuler et revenir aux tableaux pédagogiques
            </button>
          </div>
          <DocumentUploadForm
            groupId={groupId}
            varalCategories={categories}
            documentToEdit={docUnderEdit}
            initialCategoryId={addCategoryTarget}
            lockCategory={true}
            onClose={handleCloseForm}
          />
        </div>
      )}

      {/* TABLEAU A : Toadas (Chants & Paroles) */}
      {!isAdding && (activeFilter === 'both' || activeFilter === 'toadas') && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🎵</span>
              <span>Tableau A : Toadas (Chants & Paroles)</span>
              <span className="text-[10px] font-bold text-encre-noire/60">({toadasDocs.length})</span>
            </h3>
            <span className="text-[9.5px] italic text-encre-noire/60">Répertoire musical et livrets de chants</span>
          </div>
          <ToadasTable
            toadas={toadasDocs}
            canWrite={canWrite}
            onSelectDoc={onSelectDoc}
            onEditDoc={handleStartEdit}
            onDeleteDoc={onDeleteDoc}
          />
        </div>
      )}

      {/* TABLEAU B : Fiches Culture & Histoire */}
      {!isAdding && (activeFilter === 'both' || activeFilter === 'culture') && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>📖</span>
              <span>Tableau B : Fiches Culture & Histoire</span>
              <span className="text-[10px] font-bold text-encre-noire/60">({cultureDocs.length})</span>
            </h3>
            <span className="text-[9.5px] italic text-encre-noire/60">Histoire, traditions, figures et folklore</span>
          </div>
          <CultureFichesTable
            fiches={cultureDocs}
            canWrite={canWrite}
            onSelectDoc={onSelectDoc}
            onEditDoc={handleStartEdit}
            onDeleteDoc={onDeleteDoc}
          />
        </div>
      )}
    </div>
  );
}
