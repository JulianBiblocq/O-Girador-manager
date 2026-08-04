import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export const GIG_STATUSES = [
  { id: '1_demande', label: '🟢 1. Demande reçue', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: '3_devis', label: '📙 2. Devis transmis', color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: '2_option', label: '🟡 3. Option posée', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: '4_contrat', label: '📧 4. Contrat envoyé', color: 'bg-purple-100 text-purple-900 border-purple-300' },
  { id: '5_facture', label: '🧾 5. Facture émise', color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { id: '6_paye', label: '✅ 6. Confirmé & Payé', color: 'bg-green-600 text-white border-green-700' },
  { id: '7_annule', label: '❌ Annulé / Refusé', color: 'bg-stone-200 text-stone-700 border-stone-300' }
];

export default function GigFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  saving = false
}) {
  const [formData, setFormData] = useState({
    eventName: '',
    organizer: '',
    contactEmail: '',
    contactPhone: '',
    date: '',
    location: '',
    amount: '',
    nextRelanceDate: '',
    status: '1_demande',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          eventName: initialData.eventName || '',
          organizer: initialData.organizer || '',
          contactEmail: initialData.contactEmail || '',
          contactPhone: initialData.contactPhone || '',
          date: initialData.date || '',
          location: initialData.location || '',
          amount: initialData.amount || '',
          nextRelanceDate: initialData.nextRelanceDate || '',
          status: initialData.status || '1_demande',
          notes: initialData.notes || ''
        });
      } else {
        setFormData({
          eventName: '',
          organizer: '',
          contactEmail: '',
          contactPhone: '',
          date: '',
          location: '',
          amount: '',
          nextRelanceDate: '',
          status: '1_demande',
          notes: ''
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.eventName.trim()) {
      alert("Veuillez renseigner le nom de l'événement.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex items-center justify-between bg-white">
          <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood flex items-center gap-2">
            <span>{initialData ? '✏️ Modifier le Dossier' : '🎷 Nouveau Dossier de Prestation'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Nom & Organisateur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Nom de l'événement *</label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="Ex: Prestation Festival du Monde"
                  className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Organisateur / Client</label>
                <input
                  type="text"
                  value={formData.organizer}
                  onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  placeholder="Mairie, Asso X..."
                  className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>
            </div>

            {/* Email & Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">E-mail de contact</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@organisateur.fr"
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Téléphone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>
            </div>

            {/* Date & Lieu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Date prévue</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-xs font-medium px-2 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Lieu / Ville</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Lille, Place du Théâtre..."
                  className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>
            </div>

            {/* Montant, Statut & Relance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3 rounded border border-stone-200">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Cachet / Budget (€)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="800"
                  className="text-xs font-mono font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Statut du dossier</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="text-xs font-bold px-2 py-1.5 border border-stone-300 rounded bg-white cursor-pointer"
                >
                  {GIG_STATUSES.map(st => (
                    <option key={st.id} value={st.id}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-stone-700">Prochaine Relance</label>
                <input
                  type="date"
                  value={formData.nextRelanceDate}
                  onChange={(e) => setFormData({ ...formData, nextRelanceDate: e.target.value })}
                  className="text-xs font-medium px-2 py-1.5 border border-stone-300 rounded bg-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Notes & Historique des échanges</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ex: Premier contact par mail le 12/04. Attente confirmation horaire..."
                className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white resize-none"
              />
            </div>
          </div>

          {/* 3. Footer (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/20 flex items-center justify-end gap-3 bg-stone-50">
            <CordelButton type="button" variant="default" onClick={onClose} disabled={saving} className="text-xs">
              Annuler
            </CordelButton>
            <CordelButton type="submit" variant="vert" disabled={saving} className="text-xs font-bold uppercase">
              {saving ? '⏳ Enregistrement...' : (initialData ? '💾 Sauvegarder modifications' : '➕ Créer le dossier')}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
