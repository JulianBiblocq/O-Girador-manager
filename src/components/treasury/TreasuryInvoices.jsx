import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useInvoices } from '../../hooks/useInvoices';
import InvoiceFormModal from './InvoiceFormModal';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import BankDetailsBlock from '../association-settings/blocks/BankDetailsBlock';

export default function TreasuryInvoices({ groupId, associationSettings, handleSaveAssociationSettings }) {
  const {
    invoices,
    loading,
    error,
    saving,
    getNextNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
    convertDevisToInvoice
  } = useInvoices(groupId);

  const [filterType, setFilterType] = useState('all'); // 'all', 'facture', 'devis'
  const [filterStatut, setFilterStatut] = useState('all'); // 'all', 'brouillon', 'envoye', 'en_attente', 'paye'

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Filtrage des documents
  const filteredInvoices = invoices.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatut !== 'all' && item.statut !== filterStatut) return false;
    return true;
  });

  // Calculs statistiques
  const totalFacture = invoices
    .filter(i => i.type === 'facture')
    .reduce((sum, i) => sum + (parseFloat(i.montantTTC || i.montantHT) || 0), 0);

  const totalEnAttente = invoices
    .filter(i => i.type === 'facture' && i.statut !== 'paye')
    .reduce((sum, i) => sum + (parseFloat(i.montantTTC || i.montantHT) || 0), 0);

  const totalEncaisse = invoices
    .filter(i => i.type === 'facture' && (i.statut === 'paye' || i.paidTransactionId))
    .reduce((sum, i) => sum + (parseFloat(i.montantTTC || i.montantHT) || 0), 0);

  // Actions
  const handleOpenCreate = (type = 'facture') => {
    setEditingInvoice(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (invoice) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, formData);
        alert("Document mis à jour avec succès !");
      } else {
        await createInvoice(formData);
        alert("Nouveau document créé avec succès !");
      }
      setIsFormOpen(false);
    } catch (err) {
      alert(err.message || "Erreur lors de l'enregistrement.");
    }
  };

  const handleDelete = async (invoiceId, numero) => {
    if (window.confirm(`Voulez-vous vraiment supprimer le document ${numero || ''} ?`)) {
      try {
        await deleteInvoice(invoiceId);
      } catch (err) {
        alert(err.message || "Erreur lors de la suppression.");
      }
    }
  };

  const handleDirectMarkPaid = async (invoice) => {
    const isPaid = invoice.statut === 'paye' || Boolean(invoice.paidTransactionId);
    if (isPaid) return;

    const amount = invoice.montantTTC || invoice.montantHT || 0;
    const confirmText = `Confirmez-vous l'encaissement de la facture ${invoice.numero} (${amount} €) ?\n\nUne entrée de recette sera automatiquement créée en Trésorerie.`;

    if (window.confirm(confirmText)) {
      try {
        await markInvoiceAsPaid(invoice);
        alert(`Facture ${invoice.numero} marquée comme payée et enregistrée en Trésorerie !`);
      } catch (err) {
        alert(err.message || "Erreur lors du règlement.");
      }
    }
  };

  const [showConfig, setShowConfig] = useState(false);
  const [formConfig, setFormConfig] = useState({
    banqueNom: '',
    banqueTitulaire: '',
    banqueIBAN: '',
    banqueBIC: '',
    tvaIntracom: ''
  });

  useEffect(() => {
    if (associationSettings) {
      setFormConfig({
        banqueNom: associationSettings.banqueNom || '',
        banqueTitulaire: associationSettings.banqueTitulaire || '',
        banqueIBAN: associationSettings.banqueIBAN || '',
        banqueBIC: associationSettings.banqueBIC || '',
        tvaIntracom: associationSettings.tvaIntracom || ''
      });
    }
  }, [associationSettings]);

  const handleConfigChange = (key, value) => {
    setFormConfig(prev => ({ ...prev, [key]: value }));
  };

  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      if (handleSaveAssociationSettings) {
        await handleSaveAssociationSettings(formConfig);
      }
    } catch(err) {
      alert("Erreur: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full text-left select-none">
      {/* Configuration Section (Accordeon) */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-2">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowConfig(!showConfig)}>
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
            ⚙️ Coordonnées Bancaires & TVA (Pour les factures)
          </h3>
          <span className="text-xs font-black">{showConfig ? '▲ Masquer' : '▼ Déployer'}</span>
        </div>

        {showConfig && (
          <form onSubmit={handleSaveConfig} className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left">
            <BankDetailsBlock 
              formData={formConfig}
              handleChange={handleConfigChange}
              saving={savingSettings}
            />
            <div className="flex justify-end mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer les Coordonnées Bancaires"}
              </CordelButton>
            </div>
          </form>
        )}
      </CordelCard>

      {/* Explication du module */}
      <div className="text-xs text-encre-noire dark:text-cordel-bg-light opacity-85 border border-dashed border-cordel-master-dark/30 p-3.5 rounded-[6px_4px_8px_5px] bg-[#fdfaf2] dark:bg-[#201d1a] leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          📄 <strong>Module Facturation & Devis :</strong> Émettez vos devis et factures de prestations pour vos clients. Toute facture marquée comme payée s'enregistre automatiquement dans votre bilan financier.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenCreate('facture')}
            className="text-[10px] font-black uppercase bg-cordel-vert text-white border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 cursor-pointer"
          >
            ➕ Créer une Facture
          </button>
          <button
            type="button"
            onClick={() => handleOpenCreate('devis')}
            className="text-[10px] font-black uppercase bg-amber-800 text-white border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 cursor-pointer"
          >
            ➕ Créer un Devis
          </button>
        </div>
      </div>

      {/* Cartes statistiques globales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-stone-200">
          <span className="text-[10px] font-extrabold uppercase text-stone-500">Total Facturé (TTC)</span>
          <span className="text-lg font-black text-cordel-wood font-mono">
            {totalFacture.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </CordelCard>

        <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-amber-300">
          <span className="text-[10px] font-extrabold uppercase text-amber-900">En Attente d'Encaissement</span>
          <span className="text-lg font-black text-amber-800 font-mono">
            {totalEnAttente.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </CordelCard>

        <CordelCard variant="default" useExtremeBorder={false} className="p-3.5 bg-white flex flex-col gap-1 border-2 border-emerald-300">
          <span className="text-[10px] font-extrabold uppercase text-emerald-900">Total Encaissé en Trésorerie</span>
          <span className="text-lg font-black text-emerald-800 font-mono">
            {totalEncaisse.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
          </span>
        </CordelCard>
      </div>

      {/* Filtres par Type & Statut */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-100 border border-stone-200 rounded">
        {/* Filtre Type */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-stone-600">Type :</span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border cursor-pointer ${
              filterType === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => setFilterType('facture')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border cursor-pointer ${
              filterType === 'facture' ? 'bg-cordel-wood text-white border-cordel-wood' : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            Factures
          </button>
          <button
            type="button"
            onClick={() => setFilterType('devis')}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded border cursor-pointer ${
              filterType === 'devis' ? 'bg-amber-800 text-white border-amber-800' : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            Devis
          </button>
        </div>

        {/* Filtre Statut */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-stone-600">Statut :</span>
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="text-[11px] font-bold px-2 py-1 border border-stone-300 rounded bg-white cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="brouillon">📝 Brouillons</option>
            <option value="envoye">📤 Envoyés</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="paye">✅ Payés</option>
          </select>
        </div>
      </div>

      {/* Liste des Documents */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg">
        {loading ? (
          <div className="py-8 text-center text-xs font-bold animate-pulse text-stone-500">
            ⏳ Chargement des factures et devis...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs font-bold text-red-600">{error}</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-stone-500">
            Aucun devis ou facture ne correspond aux filtres.
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-x-auto">
            {/* Header de la Table */}
            <div className="grid grid-cols-12 gap-2 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-2 min-w-[680px] px-1">
              <div className="col-span-2 text-left">Type & N°</div>
              <div className="col-span-3 text-left">Client / Organisme</div>
              <div className="col-span-2 text-left">Date Émission</div>
              <div className="col-span-2 text-right">Montant (TTC)</div>
              <div className="col-span-2 text-center">Statut</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>

            {/* Lignes de la Table */}
            <div className="flex flex-col gap-1.5 min-w-[680px] max-h-[500px] overflow-y-auto pr-1">
              {filteredInvoices.map((inv) => {
                const isPaid = inv.statut === 'paye' || Boolean(inv.paidTransactionId);
                const isDevis = inv.type === 'devis';
                const amount = inv.montantTTC || inv.montantHT || 0;

                return (
                  <div
                    key={inv.id}
                    className="grid grid-cols-12 gap-2 items-center text-xs border-b border-dashed border-stone-200 py-2 px-1 hover:bg-stone-50/80 rounded"
                  >
                    {/* Type & N° */}
                    <div className="col-span-2 font-bold text-left flex items-center gap-1.5">
                      <span className="text-xs">{isDevis ? '📋' : '📄'}</span>
                      <span className="font-mono text-stone-900">{inv.numero}</span>
                    </div>

                    {/* Client */}
                    <div className="col-span-3 text-left truncate" title={inv.client?.nom}>
                      <span className="font-bold text-stone-800">{inv.client?.nom || 'Client inconnu'}</span>
                    </div>

                    {/* Date Émission */}
                    <div className="col-span-2 text-left font-medium text-stone-600">
                      {inv.dateEmission || '-'}
                    </div>

                    {/* Montant */}
                    <div className="col-span-2 text-right font-mono font-bold text-stone-900">
                      {amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>

                    {/* Statut & Action Payée rapide */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {isPaid ? (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✅ Payé
                        </span>
                      ) : inv.statut === 'envoye' ? (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                          📤 Envoyé
                        </span>
                      ) : inv.statut === 'en_attente' ? (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ En attente
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-700 border border-stone-300">
                          📝 Brouillon
                        </span>
                      )}

                      {!isDevis && !isPaid && (
                        <button
                          type="button"
                          onClick={() => handleDirectMarkPaid(inv)}
                          disabled={saving}
                          className="text-[9px] font-black uppercase bg-emerald-800 text-white px-1.5 py-0.5 rounded hover:bg-emerald-900 cursor-pointer shadow-xs"
                          title="Encaisser et inscrire en trésorerie"
                        >
                          💰 Payé
                        </button>
                      )}
                    </div>

                    {/* Boutons d'Action */}
                    <div className="col-span-1 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDetails(inv)}
                        className="text-stone-700 hover:text-black font-bold text-xs cursor-pointer"
                        title="Voir détails & PDF"
                      >
                        🔍
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(inv)}
                        disabled={saving || isPaid}
                        className="text-stone-700 hover:text-black font-bold text-xs cursor-pointer disabled:opacity-30"
                        title="Éditer"
                      >
                        ✏️
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(inv.id, inv.numero)}
                        disabled={saving || isPaid}
                        className="text-red-700 hover:text-red-900 font-bold text-xs cursor-pointer disabled:opacity-30"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CordelCard>

      {/* Modale d'édition / création */}
      <InvoiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingInvoice}
        getNextNumber={getNextNumber}
        saving={saving}
      />

      {/* Modale de détails & impression PDF */}
      <InvoiceDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        invoice={selectedInvoice}
        associationSettings={associationSettings}
        onMarkAsPaid={markInvoiceAsPaid}
        onConvertDevisToInvoice={convertDevisToInvoice}
        onEdit={handleOpenEdit}
        saving={saving}
      />
    </div>
  );
}
