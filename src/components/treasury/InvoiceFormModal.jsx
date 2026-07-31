import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function InvoiceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  getNextNumber,
  saving = false
}) {
  const [formData, setFormData] = useState({
    type: 'facture',
    numero: '',
    clientNom: '',
    clientEmail: '',
    clientAdresse: '',
    clientSiret: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    statut: 'brouillon',
    lignes: [{ id: 'line_1', description: 'Prestation musicale / Concert Maracatu', quantite: 1, prixUnitaire: 500 }],
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          type: initialData.type || 'facture',
          numero: initialData.numero || '',
          clientNom: initialData.client?.nom || '',
          clientEmail: initialData.client?.email || '',
          clientAdresse: initialData.client?.adresse || '',
          clientSiret: initialData.client?.siret || '',
          dateEmission: initialData.dateEmission || new Date().toISOString().split('T')[0],
          dateEcheance: initialData.dateEcheance || '',
          statut: initialData.statut || 'brouillon',
          lignes: Array.isArray(initialData.lignes) && initialData.lignes.length > 0
            ? initialData.lignes
            : [{ id: 'line_1', description: '', quantite: 1, prixUnitaire: 0 }],
          notes: initialData.notes || ''
        });
      } else {
        const defaultType = 'facture';
        const autoNum = getNextNumber ? getNextNumber(defaultType) : '';
        setFormData({
          type: defaultType,
          numero: autoNum,
          clientNom: '',
          clientEmail: '',
          clientAdresse: '',
          clientSiret: '',
          dateEmission: new Date().toISOString().split('T')[0],
          dateEcheance: '',
          statut: 'brouillon',
          lignes: [{ id: 'line_1', description: 'Prestation musicale Maracatu', quantite: 1, prixUnitaire: 500 }],
          notes: ''
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Changement de type (Devis <-> Facture)
  const handleTypeChange = (newType) => {
    const autoNum = getNextNumber ? getNextNumber(newType) : '';
    setFormData(prev => ({
      ...prev,
      type: newType,
      numero: autoNum
    }));
  };

  // Gestion des lignes de facturation
  const handleLineChange = (index, field, value) => {
    const updatedLignes = [...formData.lignes];
    updatedLignes[index] = {
      ...updatedLignes[index],
      [field]: field === 'description' ? value : parseFloat(value) || 0
    };
    setFormData(prev => ({ ...prev, lignes: updatedLignes }));
  };

  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lignes: [
        ...prev.lignes,
        { id: `line_${Date.now()}`, description: '', quantite: 1, prixUnitaire: 0 }
      ]
    }));
  };

  const handleRemoveLine = (index) => {
    if (formData.lignes.length <= 1) return;
    const updatedLignes = formData.lignes.filter((_, idx) => idx !== index);
    setFormData(prev => ({ ...prev, lignes: updatedLignes }));
  };

  // Calculs financiers
  const totalHT = formData.lignes.reduce((sum, item) => sum + ((item.quantite || 0) * (item.prixUnitaire || 0)), 0);
  const totalTTC = totalHT; // Exonération TVA pour association

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.clientNom.trim()) {
      alert("Veuillez saisir le nom du client.");
      return;
    }

    onSubmit({
      ...formData,
      montantHT: totalHT,
      montantTTC: totalTTC
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-2xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood flex items-center gap-2">
            <span>{initialData ? '✏️ Modifier le Document' : '📄 Nouveau Devis / Facture'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* Sélection du Type & Numéro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire/80">Type de Document</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('facture')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold uppercase rounded border transition-all cursor-pointer ${
                    formData.type === 'facture'
                      ? 'bg-cordel-wood text-white border-cordel-wood shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  📄 Facture
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('devis')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold uppercase rounded border transition-all cursor-pointer ${
                    formData.type === 'devis'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-300'
                  }`}
                >
                  📋 Devis
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire/80">N° Chronologique</label>
              <input
                type="text"
                required
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="FAC-2026-001"
                className="text-xs font-mono font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-encre-noire/80">Statut initial</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white cursor-pointer"
              >
                <option value="brouillon">📝 Brouillon</option>
                <option value="envoye">📤 Envoyé</option>
                <option value="en_attente">⏳ En attente</option>
                <option value="paye">✅ Payé</option>
              </select>
            </div>
          </div>

          {/* Informations Client / Organisme */}
          <div className="flex flex-col gap-2 p-3 bg-stone-50 border border-stone-200 rounded">
            <h4 className="text-[11px] font-extrabold uppercase text-cordel-wood border-b pb-1">
              🏢 Client / Organisme Destinataire
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Nom du Client / Organisme *</label>
                <input
                  type="text"
                  required
                  value={formData.clientNom}
                  onChange={(e) => setFormData({ ...formData, clientNom: e.target.value })}
                  placeholder="Ex: Mairie de Lille, Association culturelle..."
                  className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Adresse E-mail Client</label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="contact@client.com"
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold uppercase text-stone-700">Adresse postale</label>
                <input
                  type="text"
                  value={formData.clientAdresse}
                  onChange={(e) => setFormData({ ...formData, clientAdresse: e.target.value })}
                  placeholder="Hôtel de Ville, Place du Théâtre, 59000 Lille"
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">SIRET Client (Optionnel)</label>
                <input
                  type="text"
                  value={formData.clientSiret}
                  onChange={(e) => setFormData({ ...formData, clientSiret: e.target.value })}
                  placeholder="123 456 789 00012"
                  className="text-xs font-mono px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-700">Date Émission</label>
                  <input
                    type="date"
                    value={formData.dateEmission}
                    onChange={(e) => setFormData({ ...formData, dateEmission: e.target.value })}
                    className="text-xs font-medium px-2 py-1.5 border border-stone-300 rounded bg-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-stone-700">Date Échéance</label>
                  <input
                    type="date"
                    value={formData.dateEcheance}
                    onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                    className="text-xs font-medium px-2 py-1.5 border border-stone-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tableau Dynamique des Prestations */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-extrabold uppercase text-cordel-wood">
                📦 Lignes de Prestations / Facturation
              </h4>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-[10px] font-bold uppercase bg-emerald-800 text-white px-2.5 py-1 rounded shadow-xs hover:brightness-110 cursor-pointer flex items-center gap-1"
              >
                ➕ Ajouter une ligne
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {formData.lignes.map((ligne, idx) => (
                <div key={ligne.id || idx} className="grid grid-cols-12 gap-2 items-center bg-stone-50 p-2 rounded border border-stone-200 text-xs">
                  <div className="col-span-6 flex flex-col gap-0.5">
                    <input
                      type="text"
                      required
                      placeholder="Description de la prestation..."
                      value={ligne.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                      className="text-xs font-semibold px-2 py-1 border border-stone-300 rounded bg-white"
                    />
                  </div>

                  <div className="col-span-2 flex flex-col gap-0.5">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qté"
                      value={ligne.quantite}
                      onChange={(e) => handleLineChange(idx, 'quantite', e.target.value)}
                      className="text-xs font-bold text-center px-2 py-1 border border-stone-300 rounded bg-white"
                    />
                  </div>

                  <div className="col-span-3 flex flex-col gap-0.5">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Prix unit. €"
                      value={ligne.prixUnitaire}
                      onChange={(e) => handleLineChange(idx, 'prixUnitaire', e.target.value)}
                      className="text-xs font-bold text-right px-2 py-1 border border-stone-300 rounded bg-white"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {formData.lignes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-700 hover:text-red-900 font-bold text-sm cursor-pointer"
                        title="Supprimer la ligne"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif Total HT / TTC */}
            <div className="flex items-center justify-end gap-4 p-3 bg-amber-50/70 border border-amber-300 rounded mt-1">
              <span className="text-xs font-bold text-stone-700">Total Net à payer (TTC) :</span>
              <span className="text-base font-black text-cordel-wood font-mono">
                {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>

          {/* Notes / Conditions */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Notes / Conditions particulières</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Mentions particulières, délais de règlement..."
              className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed">
            <CordelButton type="button" variant="default" onClick={onClose} disabled={saving} className="text-xs">
              Annuler
            </CordelButton>
            <CordelButton type="submit" variant="vert" disabled={saving} className="text-xs font-bold uppercase">
              {saving ? '⏳ Enregistrement...' : (initialData ? '💾 Enregistrer modifications' : '➕ Créer le document')}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
