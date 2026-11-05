import React, { useState, useMemo } from 'react';
import CordelButton from '../CordelButton';
import DocumentUploadForm from '../DocumentUploadForm';
import ToadasTable from './ToadasTable';
import CultureFichesTable from './CultureFichesTable';
import { useTranslation } from '../LanguageContext';

/**
 * Vue Pédagogie avec 2 tableaux étanches :
 * - TABLEAU A : Toadas (Chants & Paroles)
 * - TABLEAU B : Fiches Culture & Histoire
 * Sur Desktop (xl:), lorsque les 2 tableaux sont affichés simultanément, ils sont placés côte à côte en grille 2 colonnes.
 */
export default function PedagogyDocumentsView({
  documents = [],
  groupId,
  categories = [],
  canWrite = false,
  onSelectDoc,
  onEditDoc: _onEditDoc,
  onDeleteDoc,
  onToggleViewMode
}) {
  const { t } = useTranslation();
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
    <div className="flex flex-col gap-6 text-left select-none w-full max-w-none">
      {/* Barre d'actions et sélecteur de tableaux */}
      <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-cordel-master-dark/30 pb-2 flex-wrap w-full">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter('both')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'both'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >{t('documents.btnBothTables')}</button>
          <button
            type="button"
            onClick={() => setActiveFilter('toadas')}
            className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
              activeFilter === 'toadas'
                ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-2xs font-extrabold'
                : 'bg-cordel-bg text-encre-noire/70 border-encre-noire/30 hover:border-encre-noire'
            }`}
          >
            {t('pedagogy.cards.toadasParenthese')}{toadasDocs.length})
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
            {t('pedagogy.cards.cultureHistoireParenthese')}{cultureDocs.length})
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-white text-encre-noire cursor-pointer transition-all shadow-2xs"
            >{t('pedagogy.cards.vueVaral')}</button>
          )}

          {canWrite && !isAdding && (
            <div className="flex items-center gap-1.5">
              <CordelButton
                variant="ocre"
                useExtremeBorder={true}
                onClick={() => handleStartAdd('Toadas')}
                className="text-[10px] px-2.5 py-1 font-black uppercase tracking-wider"
              >{t('documents.btnNewToada')}</CordelButton>
              <CordelButton
                variant="vert"
                useExtremeBorder={true}
                onClick={() => handleStartAdd('Culture')}
                className="text-[10px] px-2.5 py-1 font-black uppercase tracking-wider text-white"
              >{t('pedagogy.cards.ajouterFicheCulture')}</CordelButton>
            </div>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout / modification */}
      {isAdding && (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleCloseForm}
              className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
            >{t('pedagogy.cards.annulerEtRevenirAuxTableaux')}</button>
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

      {/* Grille 2 colonnes sur Desktop lorsque les deux tableaux sont affichés */}
      {!isAdding && (
        <div
          className={
            activeFilter === 'both'
              ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 items-start w-full'
              : 'flex flex-col gap-6 w-full'
          }
        >
          {/* TABLEAU A : Toadas (Chants & Paroles) */}
          {(activeFilter === 'both' || activeFilter === 'toadas') && (
            <div className="flex flex-col gap-2 min-w-0 w-full">
              <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1 gap-2 flex-wrap">
                <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>🎵</span>
                  <span>{t('pedagogy.cards.tableauAToadasChantsParoles')}</span>
                  <span className="text-[10px] font-bold text-encre-noire/60">({toadasDocs.length})</span>
                </h3>
                <span className="text-[9.5px] italic text-encre-noire/60">{t('pedagogy.cards.repertoireMusicalEtLivretsDe')}</span>
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
          {(activeFilter === 'both' || activeFilter === 'culture') && (
            <div className="flex flex-col gap-2 min-w-0 w-full">
              <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1 gap-2 flex-wrap">
                <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
                  <span>📖</span>
                  <span>{t('documents.tableBCultureTitle', { count: cultureDocs.length })}</span>
                </h3>
                <span className="text-[9.5px] italic text-encre-noire/60">{t('documents.tableBCultureSubtitle')}</span>
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
      )}
    </div>
  );
}
