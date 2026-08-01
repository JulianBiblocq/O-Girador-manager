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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto text-left"
      >
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood flex items-center gap-2">
            <span>{initialData ? '✏️ Modifier le Dossier' : '🎷 Nouveau Dossier de Prestation'}</span>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Nom Événement & Organisateur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Nom de l'Événement *</label>
              <input
                type="text"
                required
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                placeholder="Ex: Festival des Rythmes 2026"
                className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Organisateur / Structure</label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="Ex: Mairie de Lille, Association Musique..."
                className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          {/* Contact (Email & Téléphone) */}
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
              <label className="text-[10px] font-bold uppercase text-stone-700">Téléphone de contact</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="text-xs font-mono px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          {/* Date, Lieu & Montant */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Date Prévue</label>
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
                placeholder="Ex: Place de la République, Lille"
                className="text-xs px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Montant Estimé (€)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Ex: 1500"
                className="text-xs font-mono font-bold px-3 py-1.5 border border-stone-300 rounded bg-white"
              />
            </div>
          </div>

          {/* Statut & Prochaine relance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase text-stone-700">Étape du Pipeline (Statut)</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="text-xs font-bold px-3 py-1.5 border border-stone-300 rounded bg-white cursor-pointer"
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

          {/* Boutons d'Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-dashed">
            <CordelButton type="button" variant="default" onClick={onClose} disabled={saving} className="text-xs">
              Annuler
            </CordelButton>
            <CordelButton type="submit" variant="vert" disabled={saving} className="text-xs font-bold uppercase">
              {saving ? '⏳ Enregistrement...' : (initialData ? '💾 Sauvegarder modifications' : '➕ Créer le dossier')}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
