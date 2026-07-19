import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function TreasuryOperations({
  transactions,
  savingTx,
  handleAddTx,
  handleDeleteTx,
  associationSettings,
  handleSaveAssociationSettings
}) {
  const defaultCategories = ['Matériel', 'Intervenant', 'Local', 'Subvention', 'Don', 'Autre'];
  const categories = Array.isArray(associationSettings?.categoriesTransactions)
    ? associationSettings.categoriesTransactions
    : defaultCategories;

  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'depense',
    montant: '',
    categorie: categories[0] || 'Matériel',
    libelle: ''
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Sync category default if categories list changes
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
      await handleAddTx(txForm);
      setTxForm(prev => ({
        ...prev,
        montant: '',
        libelle: ''
      }));
      alert("Opération enregistrée avec succès !");
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement de l'opération.");
    }
  };

  const onDelete = async (txId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette opération ?")) return;
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
            Saisir une opération
          </h4>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 text-left">
            {/* Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Date</label>
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
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Type</label>
              <select
                value={txForm.type}
                onChange={(e) => setTxForm(prev => ({ ...prev, type: e.target.value }))}
                required
                disabled={savingTx}
                className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
              >
                <option value="depense">Dépense (Débit)</option>
                <option value="recette">Recette (Crédit)</option>
              </select>
            </div>

            {/* Categorie */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center select-none">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Catégorie</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-[8px] font-black uppercase text-cordel-wood hover:underline cursor-pointer"
                >
                  {isAddingCategory ? "Annuler" : "➕ Nouvelle catégorie"}
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
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Libellé */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Libellé</label>
              <input 
                type="text"
                placeholder="Ex: Achat peaux Alfaia"
                value={txForm.libelle}
                onChange={(e) => setTxForm(prev => ({ ...prev, libelle: e.target.value }))}
                required
                disabled={savingTx}
                className="theme-input w-full text-xs"
              />
            </div>

            {/* Montant */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Montant (€)</label>
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

            <CordelButton 
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={savingTx}
              className="w-full text-xs py-2 mt-2 font-bold uppercase tracking-wider"
            >
              {savingTx ? "Enregistrement..." : "Enregistrer"}
            </CordelButton>
          </form>
        </CordelCard>
      </div>

      {/* List */}
      <div className="col-span-2 flex flex-col gap-3">
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex-1">
          <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3 text-left">
            Opérations Enregistrées
          </h4>
          
          {transactions.length === 0 ? (
            <p className="text-xs italic opacity-60 text-center py-8">Aucune opération libre saisie.</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
              {/* Header Table */}
              <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 px-1">
                <div className="col-span-2 text-left">Date</div>
                <div className="col-span-2 text-left">Catégorie</div>
                <div className="col-span-4 text-left">Libellé</div>
                <div className="col-span-3 text-right">Montant</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {/* Rows */}
              {transactions.map(tx => {
                const txDateStr = tx.date ? (tx.date.toDate ? tx.date.toDate().toISOString().split('T')[0] : String(tx.date).substring(0, 10)) : '';
                return (
                  <div key={tx.id} className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-encre-noire/5 py-2 px-1 hover:bg-cordel-hover/10 rounded">
                    <div className="col-span-2 font-semibold text-left">{txDateStr}</div>
                    <div className="col-span-2 text-left">
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-1.5 py-0.5">
                        {tx.categorie}
                      </span>
                    </div>
                    <div className="col-span-4 font-bold text-encre-noire dark:text-cordel-bg-light truncate text-left" title={tx.libelle}>
                      {tx.libelle}
                    </div>
                    <div className={`col-span-3 text-right font-black ${tx.type === 'recette' ? 'text-green-700' : 'text-red-700'}`}>
                      {tx.type === 'recette' ? '+' : '-'}{tx.montant} €
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => onDelete(tx.id)}
                        className="text-red-700 hover:text-red-900 font-bold hover:underline select-none text-[10px] cursor-pointer"
                        title="Supprimer cette opération"
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
