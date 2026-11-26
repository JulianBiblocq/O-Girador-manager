import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Formulaire condensé d'ajout rapide d'un créneau général depuis l'onglet « 🤝 Bénévoles »
 * réservé aux gestionnaires d'événements (`canManageEvents`).
 */
export default function VolunteerQuickShiftCreator({ event, canManageEvents = false, tr }) {
  const [nomTache, setNomTache] = useState('');
  const [heureDebut, setHeureDebut] = useState('');
  const [heureFin, setHeureFin] = useState('');
  const [quotaRequis, setQuotaRequis] = useState(2);
  const [saving, setSaving] = useState(false);

  if (!canManageEvents || !event?.id) return null;
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomTache.trim() || saving) return;
    setSaving(true);
    try {
      const dateJour = String(event.date || event.dateDebut || '').slice(0, 10);
      const q = Math.max(0, parseInt(quotaRequis, 10) || 0);
      const horaires = heureDebut && heureFin ? `${heureDebut} - ${heureFin}` : heureDebut;
      const newShift = {
        id: `shift_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        nomTache: nomTache.trim(), label: nomTache.trim(), dateJour,
        heureDebut, heureFin, horaires, quotaRequis: q, neededCount: q,
        consigne: '', commissionId: null, commissionTitre: '', inscrits: []
      };
      await updateDoc(doc(db, 'events', event.id), {
        enableVolunteers: true,
        volunteerShifts: [...(event.volunteerShifts || []), newShift]
      });
      setNomTache('');
      setHeureDebut('');
      setHeureFin('');
    } catch (err) {
      console.error('Erreur ajout rapide créneau bénévole :', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2.5 rounded-lg bg-[var(--cordel-bg)]/70 border border-dashed border-[var(--theme-border)]/30 flex flex-wrap items-center gap-1.5 text-xs">
      <input type="text" value={nomTache} onChange={(e) => setNomTache(e.target.value)} placeholder={t('agenda.volunteerQuickAddPlaceholder') || 'Création rapide de créneau (ex. : Accueil public)...'} className="theme-input py-1 px-2 text-xs flex-1 min-w-[160px]" />
      <input type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} className="theme-input py-1 px-1.5 text-xs" title={t('agenda.volunteerStartTime') || 'Début'} />
      <input type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} className="theme-input py-1 px-1.5 text-xs" title={t('agenda.volunteerEndTime') || 'Fin'} />
      <input type="number" min="0" max="99" value={quotaRequis} onChange={(e) => setQuotaRequis(e.target.value)} className="theme-input py-1 px-1.5 text-xs w-14 text-center" title="Quota" />
      <button type="submit" disabled={!nomTache.trim() || saving} className="px-2.5 py-1 rounded bg-[var(--color-cordel-vert)] text-white text-[10px] font-black uppercase disabled:opacity-40 cursor-pointer">
        ＋ {t('agenda.volunteerAddPostBtn') || 'Ajouter'}
      </button>
    </form>
  );
}
