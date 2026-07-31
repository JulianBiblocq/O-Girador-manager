import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale de création d'événement pré-remplie pour poser une Option dans l'Agenda
 * depuis le Pôle Diffusion (gigs_pipeline).
 */
export default function GigAgendaOptionModal({
  isOpen,
  onClose,
  gig,
  groupId,
  onSuccess
}) {
  const [formData, setFormData] = useState({
    titre: '',
    date: '',
    dateFin: '',
    lieu: '',
    type: 'prestation',
    amount: '',
    description: '',
    horairesPassages: '',
    status: 'a_confirmer',
    isPublic: false
  });
  const [saving, setSaving] = useState(false);

  // Pré-remplissage dynamique sélectif des champs lors de l'ouverture
  useEffect(() => {
    if (gig) {
      setFormData({
        titre: `[OPTION] - ${gig.eventName || ''}`,
        date: gig.date || new Date().toISOString().split('T')[0],
        dateFin: '',
        lieu: gig.location || '',
        type: 'prestation',
        amount: gig.amount ? String(gig.amount) : '',
        description: '', // Champ laissé sciemment vide pour saisie manuelle (confidentialité contact)
        horairesPassages: '',
        status: 'a_confirmer', // Positionné par défaut sur "À confirmer"
        isPublic: false // Décoché par défaut pour rester interne à la troupe
      });
    }
  }, [gig, isOpen]);

  if (!isOpen || !gig) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.date) {
      alert("Le titre et la date sont obligatoires pour poser une option dans l'Agenda.");
      return;
    }

    setSaving(true);
    try {
      const budgetAmount = parseFloat(formData.amount) || 0;

      // 1. Création de l'événement dans la collection `events`
      const eventDoc = {
        groupId: gig.groupId || groupId,
        titre: formData.titre.trim(),
        type: formData.type || 'prestation',
        date: formData.date,
        dateFin: formData.dateFin || '',
        lieu: formData.lieu?.trim() || '',
        description: formData.description?.trim() || '', // Laissé vide ou saisi manuellement
        horairesPassages: formData.horairesPassages?.trim() || '',
        isOption: true,
        isPublic: Boolean(formData.isPublic), // Désactivé par défaut
        status: formData.status || 'a_confirmer', // Positionné par défaut sur "a_confirmer"
        montantRecette: budgetAmount,
        budgetRecettes: budgetAmount > 0 ? [{ id: '1', libelle: 'Cachet prestation', montant: budgetAmount }] : [],
        inscriptions: [],
        createdFromGigId: gig.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'events'), eventDoc);

      // 2. Passage du dossier de prestation au statut 2_option ("Option posée")
      const gigRef = doc(db, 'gigs_pipeline', gig.id);
      await updateDoc(gigRef, {
        status: '2_option',
        updatedAt: serverTimestamp()
      });

      // 3. Callback de succès & fermeture de la modale
      if (onSuccess) {
        onSuccess(gig.id);
      }
      onClose();
    } catch (err) {
      console.error("GigAgendaOptionModal - Erreur lors de la création d'événement :", err);
      alert("Une erreur s'est produite lors de la création de l'option dans l'Agenda.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-xl bg-white p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left relative"
      >
        {/* Header Modale */}
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood">
                Poser une Option dans l'Agenda
              </h3>
              <p className="text-[10px] text-stone-500 font-medium">
                Vérifiez et ajustez les détails avant d'enregistrer l'événement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Formulaire pré-rempli */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          {/* Titre de l'événement */}
          <div className="flex flex-col gap-1">
            <label className="font-extrabold uppercase text-stone-700 text-[10px]">
              Titre de l'événement (Marqueur Option) *
            </label>
            <input
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              className="p-2 border border-stone-300 rounded font-bold text-stone-900 bg-amber-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cordel-wood"
            />
          </div>

          {/* Date & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Date de la prestation *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="p-2 border border-stone-300 rounded font-semibold text-stone-900 bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Type d'événement
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="p-2 border border-stone-300 rounded font-semibold text-stone-900 bg-white cursor-pointer"
              >
                <option value="prestation">Prestation (Concert / Roda)</option>
                <option value="stage">Stage / Ateliers</option>
                <option value="repetition">Répétition</option>
                <option value="reunion">Réunion</option>
              </select>
            </div>
          </div>

          {/* Lieu & Cachet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Lieu ou Adresse
              </label>
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleChange}
                placeholder="ex: Place de la Mairie, Brest"
                className="p-2 border border-stone-300 rounded font-semibold text-stone-900 bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Cachet / Tarif Estimé (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="ex: 850"
                className="p-2 border border-stone-300 rounded font-bold font-mono text-cordel-wood bg-amber-50"
              />
            </div>
          </div>

          {/* Statut de validation & Horaires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Statut de validation
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="p-2 border border-amber-300 rounded font-bold text-amber-900 bg-amber-50 cursor-pointer"
              >
                <option value="a_confirmer">⏳ À confirmer (Option posée)</option>
                <option value="confirme">✅ Confirmé</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Horaires de passage / Logistique
              </label>
              <input
                type="text"
                name="horairesPassages"
                value={formData.horairesPassages}
                onChange={handleChange}
                placeholder="ex: Balance 16h, Concert 20h"
                className="p-2 border border-stone-300 rounded text-stone-900 bg-white"
              />
            </div>
          </div>

          {/* Description (Vide par défaut) */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-extrabold uppercase text-stone-700 text-[10px]">
                Description interne de l'événement
              </label>
              <span className="text-[9px] text-stone-500 font-medium">
                (Champ laissé vide par confidentialité)
              </span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Saisissez des remarques ou consignes internes si nécessaire..."
              className="p-2 border border-stone-300 rounded text-stone-900 bg-white leading-relaxed text-[11px]"
            />
          </div>

          {/* Visibilité sur la Vitrine (Décochée par défaut) */}
          <div className="flex items-center gap-2 p-2.5 bg-stone-50 rounded border border-stone-200">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="w-4 h-4 text-cordel-wood rounded cursor-pointer"
            />
            <label htmlFor="isPublic" className="font-extrabold text-stone-800 text-[11px] cursor-pointer">
              🔒 Option interne (Décoché par défaut — non visible sur la Vitrine)
            </label>
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-dashed">
            <CordelButton type="button" variant="default" onClick={onClose} className="text-xs">
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="vert"
              disabled={saving}
              className="text-xs font-bold"
            >
              {saving ? 'Enregistrement...' : '✅ Valider & Poser l\'Option dans l\'Agenda'}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
