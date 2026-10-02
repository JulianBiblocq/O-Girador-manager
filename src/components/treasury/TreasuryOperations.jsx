import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EmptyState from '../EmptyState';
import Tooltip from '../Tooltip';
import useConfirm from '../../hooks/useConfirm';
import { getEffectiveTransactionDate } from '../../hooks/useTreasury';
import { useTranslation } from '../LanguageContext';

export default function TreasuryOperations({
  transactions,
  savingTx,
  handleAddTx,
  handleDeleteTx,
  associationSettings,
  handleSaveAssociationSettings
}) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const defaultCategories = ['Matériel', 'Intervenant', 'Local', 'Subvention', 'Don', 'Autre'];
  const categories = Array.isArray(associationSettings?.categoriesTransactions)
    ? associationSettings.categoriesTransactions
    : defaultCategories;

  const getCategoryLabel = (cat) => {
    if (!cat) return '';
    const upper = String(cat).toUpperCase();
    if (upper === 'MATÉRIEL' || upper === 'MATERIEL') return t('treasury.catMaterial');
    if (upper === 'COTISATION' || upper === 'COTISATIONS') return t('treasury.tagCotisations');
    return cat;
  };

  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'depense',
    montant: '',
    categorie: categories[0] || 'Matériel',
    libelle: ''
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Synchroniser category default if categories list changes
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(txForm.categorie)) {
      setTxForm(prev => ({ ...prev, categorie: categories[0] }));
    }
  }, [categories]);

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    const catName = newCategoryName.trim();
    if (categories.includes(catName)) {
      alert("Cette catégorie existe déjà.");
      return;
    }
    try {
      await handleSaveAssociationSettings({
        categoriesTransactions: [...categories, catName]
      });
      setTxForm(prev => ({ ...prev, categorie: catName }));
      setNewCategoryName('');
      setIsAddingCategory(false);
      alert("Nouvelle catégorie créée avec succès !");
    } catch (err) {
      alert("Erreur lors de la création de la catégorie : " + err.message);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!txForm.montant || !txForm.libelle) return;
    try {
      await handleAddTx(txForm, documentFile);
      setTxForm(prev => ({
        ...prev,
        montant: '',
        libelle: ''
      }));
      setDocumentFile(null);
      alert("Opération enregistrée avec succès !");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement de l'opération.");
    }
  };

  const onDelete = async (txId) => {
    const isOk = await confirm({
      title: t('common.deleteConfirmTitle') || "Supprimer l'opération",
      message: t('common.deleteConfirmMessage') || "Voulez-vous vraiment supprimer cette opération ?",
      confirmText: t('common.yesDelete') || "Oui, supprimer",
      cancelText: t('common.cancel') || "Annuler",
      variant: "danger"
    });
    if (!isOk) return;
    try {
      await handleDeleteTx(txId);
      alert("Opération supprimée avec succès !");
    } catch (err) {
      alert(err.message || "Erreur lors de la suppression de l'opération.");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* Form */}
      <div className="col-span-1">
        <CordelCard variant="default" useExtremeBorder={true} className="p-4">
          <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3 text-left">
            {t('treasury.btnAddOperation')}
          </h4>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 text-left">
            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('treasury.fieldDate')}</label>
              <input 
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm(prev => ({ ...prev, date: e.target.value }))}
                required
                disabled={savingTx}
                className="theme-input w-full text-xs font-bold"
              />
            </div>

            {/* Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('common.type') || "Type"}</label>
              <select
                value={txForm.type}
                onChange={(e) => setTxForm(prev => ({ ...prev, type: e.target.value }))}
                required
                disabled={savingTx}
                className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
              >
                <option value="depense">{t('treasury.categoryExpense')}</option>
                <option value="recette">{t('treasury.categoryIncome')}</option>
              </select>
            </div>

            {/* Categorie */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center select-none">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('treasury.fieldCategory')}</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-[8px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
                >
                  {isAddingCategory ? (t('common.cancel') || "Annuler") : t('treasury.btnNewCategory')}
                </button>
              </div>

              {isAddingCategory ? (
                <div className="flex gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nom de la catégorie..."
                    className="theme-input text-xs flex-1 py-1 px-2 font-semibold"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="text-[9px] font-black bg-cordel-wood text-cordel-bg-light border border-encre-noire px-2.5 py-1 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-opacity-95 cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <select
                  value={txForm.categorie}
                  onChange={(e) => setTxForm(prev => ({ ...prev, categorie: e.target.value }))}
                  required
                  disabled={savingTx}
                  className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Libellé */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('treasury.fieldLabel')}</label>
              <input 
                type="text"
                placeholder={t('treasury.labelPlaceholder')}
                value={txForm.libelle}
                onChange={(e) => setTxForm(prev => ({ ...prev, libelle: e.target.value }))}
                required
                disabled={savingTx}
                className="theme-input w-full text-xs"
              />
            </div>

            {/* Montant */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('treasury.fieldAmount')}</label>
              <input 
                type="number"
                min="0.01"
                step="any"
                placeholder="0.00"
                value={txForm.montant}
                onChange={(e) => setTxForm(prev => ({ ...prev, montant: e.target.value }))}
                required
                disabled={savingTx}
                className="theme-input w-full text-xs"
              />
            </div>

            {/* Justificatif / Facture */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex justify-between items-center">
                <span>{t('treasury.fieldReceipt')}</span>
                <span className="text-[8px] font-normal italic opacity-60">{t('treasury.uploadReceiptNotice')}</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <label className="text-[9px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light border border-encre-noire px-2.5 py-1.5 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer shrink-0 select-none">
                  📁 {t('treasury.chooseFileBtn')}
                  <input 
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                    disabled={savingTx}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-stone-600 dark:text-stone-300 truncate">
                  {documentFile ? `📎 ${documentFile.name}` : t('treasury.noFileChosen')}
                </span>
              </div>
            </div>

            <CordelButton 
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={savingTx}
              className="w-full text-xs py-2 mt-2 font-bold uppercase tracking-wider"
            >
              {savingTx ? t('common.saving', "Enregistrement...") : t('treasury.btnSaveOperation')}
            </CordelButton>
          </form>
        </CordelCard>
      </div>

      {/* List */}
      <div className="col-span-2 flex flex-col gap-3">
        <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex-1">
          <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3 text-left flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span>{t('treasury.operationsJournalTitle')}</span>
              <Tooltip text="Historique complet des mouvements financiers crédités et débités du compte de l'association." />
            </div>
            {transactions.length > 0 && (
              <span className="text-[9px] font-black text-cordel-master-dark/60 bg-cordel-bg-light px-2 py-0.5 rounded border border-encre-noire/15">
                {transactions.length > 1
                  ? t('treasury.entriesCountPlural', { count: transactions.length })
                  : t('treasury.entriesCount', { count: transactions.length })}
              </span>
            )}
          </h4>
          
          {transactions.length === 0 ? (
            <EmptyState
              icon="💰"
              title={t('treasury.noOperationsFound')}
              description="Le livre de caisse est vide. Saisissez votre première recette ou dépense à l'aide du formulaire ci-contre."
            />
          ) : (
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              {/* Header Table */}
              <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 px-1">
                <div className="col-span-2 text-left">{t('treasury.fieldDate')}</div>
                <div className="col-span-2 text-left">{t('treasury.fieldCategory')}</div>
                <div className="col-span-3 text-left">{t('treasury.fieldLabel')}</div>
                <div className="col-span-2 text-center">{t('treasury.fieldReceipt')}</div>
                <div className="col-span-2 text-right">{t('treasury.fieldAmount')}</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {/* Rows */}
              {transactions.map(tx => {
                const effectiveDate = getEffectiveTransactionDate(tx);
                const txDateStr = effectiveDate
                  ? effectiveDate.toISOString().split('T')[0]
                  : (typeof tx.date === 'string' && tx.date && !tx.date.includes('[object') ? tx.date.substring(0, 10) : '—');
                const displayLibelle = typeof tx.libelle === 'string' && tx.libelle.includes('Paiement HelloAsso')
                  ? tx.libelle.replace('Paiement HelloAsso', t('treasury.helloassoPaymentLabel'))
                  : tx.libelle;
                return (
                  <div key={tx.id} className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-encre-noire/5 py-2 px-1 hover:bg-cordel-hover/10 rounded">
                    <div className="col-span-2 font-semibold text-left">{txDateStr}</div>
                    <div className="col-span-2 text-left">
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-1.5 py-0.5">
                        {getCategoryLabel(tx.categorie)}
                      </span>
                    </div>
                    <div className="col-span-3 font-bold text-encre-noire dark:text-cordel-bg-light truncate text-left" title={displayLibelle}>
                      {displayLibelle}
                    </div>
                    <div className="col-span-2 text-center">
                      {tx.justificatifUrl ? (
                        <a
                          href={tx.justificatifUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9px] font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 border border-amber-600/40 px-2 py-0.5 rounded hover:underline cursor-pointer"
                          title={tx.justificatifNom || t('treasury.viewReceipt')}
                        >
                          📎 {t('treasury.viewReceipt')}
                        </a>
                      ) : (
                        <span className="text-[9px] text-neutral-400 italic" title={t('treasury.noReceipt')}>{t('treasury.noReceipt')}</span>
                      )}
                    </div>
                    <div className={`col-span-2 text-right font-black ${tx.type === 'recette' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === 'recette' ? '+' : '-'}{tx.montant} €
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        className="text-red-700 hover:text-red-900 font-bold hover:underline select-none text-[10px] cursor-pointer"
                        title={t('common.delete') || "Supprimer cette opération"}
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CordelCard>
      </div>
    </div>
  );
}
