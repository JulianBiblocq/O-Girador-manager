import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

const defaultAccounts = [
  { id: 'acc_courant', name: 'Compte Courant', balance: 0, threshold: 0, updatedAt: null },
  { id: 'acc_livreta', name: 'Livret A', balance: 0, threshold: 0, updatedAt: null },
  { id: 'acc_caisse', name: 'Caisse Espèces', balance: 0, threshold: 0, updatedAt: null }
];

export default function BankAccountsTracker({
  associationSettings,
  handleSaveAssociationSettings,
  bilanOperationnel = 0
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [accounts, setAccounts] = useState(defaultAccounts);
  const [saving, setSaving] = useState(false);

  // Sync with Firestore settings
  useEffect(() => {
    if (!isEditing) {
      if (associationSettings && Array.isArray(associationSettings.bankAccounts)) {
        setAccounts(associationSettings.bankAccounts);
      } else {
        setAccounts(defaultAccounts);
      }
    }
  }, [associationSettings, isEditing]);

  // Calculations
  const totalBankBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const projectedBalance = totalBankBalance + parseFloat(bilanOperationnel);

  const handleFieldChange = (id, field, value) => {
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === id) {
          let parsedValue = value;
          if (field === 'balance' || field === 'threshold') {
            // Keep empty input or parse to number
            parsedValue = value === '' ? '' : parseFloat(value) || 0;
          }
          return { ...acc, [field]: parsedValue };
        }
        return acc;
      })
    );
  };

  const handleAddAccount = () => {
    const newId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setAccounts(prev => [
      ...prev,
      { id: newId, name: '', balance: 0, threshold: 0, updatedAt: null }
    ]);
  };

  const handleRemoveAccount = (id) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (associationSettings && Array.isArray(associationSettings.bankAccounts)) {
      setAccounts(associationSettings.bankAccounts);
    } else {
      setAccounts(defaultAccounts);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate that all accounts have a name
      const hasEmptyName = accounts.some(acc => !acc.name.trim());
      if (hasEmptyName) {
        alert("Veuillez donner un nom à tous les comptes.");
        setSaving(false);
        return;
      }

      // Determine original accounts for comparison
      const originalAccounts = associationSettings?.bankAccounts || defaultAccounts;

      // Update updatedAt timestamp only if balance, threshold, or name changed
      const updatedAccounts = accounts.map(acc => {
        const original = originalAccounts.find(o => o.id === acc.id);
        const nameVal = acc.name.trim();
        const balanceVal = parseFloat(acc.balance) || 0;
        const thresholdVal = parseFloat(acc.threshold) || 0;

        const changed =
          !original ||
          original.name !== nameVal ||
          (parseFloat(original.balance) || 0) !== balanceVal ||
          (parseFloat(original.threshold) || 0) !== thresholdVal;

        return {
          ...acc,
          name: nameVal,
          balance: balanceVal,
          threshold: thresholdVal,
          updatedAt: changed ? new Date().toISOString() : (original?.updatedAt || null)
        };
      });

      await handleSaveAssociationSettings({
        bankAccounts: updatedAccounts
      });

      setIsEditing(false);
    } catch (err) {
      alert("Erreur lors de la sauvegarde : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Jamais mis à jour";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Format invalide";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full mt-6 text-left">
      {/* Title */}
      <div className="flex justify-between items-center pb-2 border-b border-dashed border-cordel-master-dark/20">
        <h3 className="text-xs font-black tracking-widest text-cordel-wood uppercase">
          🏦 Suivi & Projection de Trésorerie
        </h3>
        {!isEditing && (
          <CordelButton
            variant="ocre"
            onClick={() => setIsEditing(true)}
            className="text-[10px] py-1 px-3"
          >
            ✏️ Éditer les soldes
          </CordelButton>
        )}
      </div>

      {/* Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total current bank balance */}
        <div className="border border-encre-noire/25 p-3.5 bg-cordel-master-bg dark:bg-cordel-master-dark/10 rounded-[5px_3px_6px_4px] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="text-[10px] uppercase font-black text-cordel-wood opacity-80 tracking-wider">
            Solde Bancaire Actuel
          </div>
          <div className="text-xl font-black text-cordel-wood mt-1">
            {totalBankBalance.toFixed(2)} €
          </div>
        </div>

        {/* Operating Balance Impact */}
        <div className="border border-encre-noire/25 p-3.5 bg-cordel-master-bg dark:bg-cordel-master-dark/10 rounded-[4px_6px_3px_5px] text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]">
          <div className="text-[10px] uppercase font-black text-encre-noire/80 dark:text-cordel-bg-light/80 tracking-wider">
            Bilan Opérationnel (Période)
          </div>
          <div className={`text-xl font-black mt-1 ${bilanOperationnel >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {bilanOperationnel >= 0 ? '+' : ''}{bilanOperationnel.toFixed(2)} €
          </div>
        </div>

        {/* Projected Bank Balance */}
        <div className={`border-2 border-encre-noire p-3.5 rounded-[6px_4px_5px_3px] text-center shadow-[2px_2px_0px_0px_#181716] ${projectedBalance >= 0 ? 'bg-[#e2ecc8] dark:bg-emerald-950/20' : 'bg-[#f7d6d0] dark:bg-rose-950/20'}`}>
          <div className="text-[10px] uppercase font-black text-encre-noire tracking-wider">
            Trésorerie Projetée
          </div>
          <div className={`text-xl font-black mt-1 ${projectedBalance >= 0 ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
            {projectedBalance >= 0 ? '+' : ''}{projectedBalance.toFixed(2)} €
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <CordelCard variant="jaune" useExtremeBorder={false} className="p-4 text-left">
            <h4 className="text-[10px] uppercase font-black text-cordel-wood mb-3 tracking-wider">
              Saisie des Soldes Réels & Seuils
            </h4>
            <div className="flex flex-col gap-3.5">
              {accounts.map((acc) => (
                <div key={acc.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-3.5 border-b border-dashed border-encre-noire/10 last:border-0 last:pb-0">
                  {/* Account Name */}
                  <div className="flex-1 flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Nom du compte
                    </label>
                    <input
                      type="text"
                      value={acc.name}
                      onChange={(e) => handleFieldChange(acc.id, 'name', e.target.value)}
                      placeholder="Ex: Compte Courant"
                      className="theme-input font-bold text-xs"
                      required
                    />
                  </div>

                  {/* Balance input */}
                  <div className="w-full sm:w-32 flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Solde Actuel (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={acc.balance === '' ? '' : acc.balance}
                      onChange={(e) => handleFieldChange(acc.id, 'balance', e.target.value)}
                      className="theme-input font-bold text-xs"
                    />
                  </div>

                  {/* Critical Threshold input */}
                  <div className="w-full sm:w-32 flex flex-col gap-1 text-left">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Seuil Critique (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={acc.threshold === '' ? '' : acc.threshold}
                      onChange={(e) => handleFieldChange(acc.id, 'threshold', e.target.value)}
                      className="theme-input font-bold text-xs"
                    />
                  </div>

                  {/* Delete button */}
                  <div className="flex items-end justify-end sm:self-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(acc.id)}
                      className="p-2 border border-red-700/30 rounded bg-red-50 dark:bg-red-950/10 text-red-700 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer text-xs flex items-center justify-center h-8"
                      title="Supprimer ce compte"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-start">
              <button
                type="button"
                onClick={handleAddAccount}
                className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-dashed border-encre-noire px-3 py-1.5 rounded hover:bg-cordel-hover cursor-pointer"
              >
                ➕ Ajouter un Compte
              </button>
            </div>
          </CordelCard>

          <div className="flex gap-3 justify-end">
            <CordelButton
              type="button"
              variant="default"
              onClick={handleCancel}
              disabled={saving}
              className="text-xs"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="vert"
              disabled={saving}
              className="text-xs"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </CordelButton>
          </div>
        </form>
      ) : (
        <CordelCard className="p-0 overflow-hidden">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                  <th className="py-2 px-1.5 md:py-2.5 md:px-3">Nom du Compte</th>
                  <th className="py-2 px-1.5 md:py-2.5 md:px-3 text-right">Solde Actuel</th>
                  <th className="py-2 px-1.5 md:py-2.5 md:px-3 text-center">Seuil Alerte</th>
                  <th className="py-2 px-1.5 md:py-2.5 md:px-3 text-right">Dernière Mise à jour</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center italic opacity-60">
                      Aucun compte configuré. Cliquez sur "Éditer les soldes" pour en ajouter.
                    </td>
                  </tr>
                ) : (
                  accounts.map(acc => {
                    const balanceVal = parseFloat(acc.balance) || 0;
                    const thresholdVal = parseFloat(acc.threshold) || 0;
                    const isBelowThreshold = thresholdVal !== 0 && balanceVal < thresholdVal;

                    return (
                      <tr
                        key={acc.id}
                        className="border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover/30 transition-colors"
                      >
                        <td className="py-2 px-1.5 md:py-2.5 md:px-3 font-bold text-encre-noire dark:text-cordel-bg-light">
                          {acc.name || "Compte sans nom"}
                        </td>
                        <td className={`py-2 px-1.5 md:py-2.5 md:px-3 text-right font-black ${
                          isBelowThreshold 
                            ? 'text-red-700 dark:text-red-400 animate-pulse font-extrabold' 
                            : 'text-encre-noire dark:text-cordel-bg-light'
                        }`}>
                          {isBelowThreshold && <span className="mr-1.5" title="Sous le seuil critique !">⚠️</span>}
                          {balanceVal.toFixed(2)} €
                        </td>
                        <td className="py-2 px-1.5 md:py-2.5 md:px-3 text-center font-semibold text-encre-noire/60 dark:text-cordel-bg-light/60">
                          {thresholdVal !== 0 ? `${thresholdVal.toFixed(2)} €` : '-'}
                        </td>
                        <td className="py-2 px-1.5 md:py-2.5 md:px-3 text-right text-encre-noire/60 dark:text-cordel-bg-light/60 font-mono text-[10px]">
                          {formatDate(acc.updatedAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CordelCard>
      )}
    </div>
  );
}
