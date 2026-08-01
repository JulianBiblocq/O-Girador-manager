import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Modale Publique de Demande de Prestation / Booking pour la Vitrine SaaS.
 * Enregistre la demande dans Firestore sous associations/{groupId}/bookingRequests et dans le Pôle Diffusion (gigs).
 */
export default function PublicBookingModal({
  isOpen,
  onClose,
  groupId,
  associationName = 'l\'Association',
  publicTheme = {}
}) {
  const [organizer, setOrganizer] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('Festival');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!organizer.trim() || !contactEmail.trim() || !date || !location.trim()) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const gigPayload = {
        organizer: organizer.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        eventName: eventName.trim() || `Prestation ${eventType}`,
        date: date,
        location: location.trim(),
        eventType: eventType,
        amount: 0,
        notes: message.trim(),
        status: '1_demande_recue',
        source: 'vitrine_publique',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 1. Inscription dans la sous-collection dédiée bookingRequests
      await addDoc(collection(db, 'associations', groupId, 'bookingRequests'), gigPayload);

      // 2. Inscription simultanée dans la collection `gigs` du Pôle Diffusion pour un traitement direct Back-Office
      await addDoc(collection(db, 'associations', groupId, 'gigs'), gigPayload);

      setSubmitted(true);
    } catch (err) {
      console.error("PublicBookingModal - Erreur d'enregistrement :", err);
      setErrorMessage("Une erreur est survenue lors de la transmission. Veuillez réessayer ou nous contacter directement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setErrorMessage('');
    setOrganizer('');
    setContactEmail('');
    setContactPhone('');
    setEventName('');
    setDate('');
    setLocation('');
    setEventType('Festival');
    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      <div className="w-full max-w-xl bg-[var(--public-bg,#FAF6EE)] text-[var(--public-text,#1C1917)] rounded-xl shadow-2xl p-5 sm:p-7 border border-amber-900/20 max-h-[92vh] overflow-y-auto text-left relative">
        
        {/* Bouton de fermeture */}
        <button
          type="button"
          onClick={handleResetAndClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 text-xl font-bold cursor-pointer"
        >
          ✕
        </button>

        {submitted ? (
          /* Message de succès chaleureux */
          <div className="py-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🎉
            </div>
            <h3 className="text-xl font-extrabold uppercase tracking-wide text-emerald-950">
              Demande transmise avec succès !
            </h3>
            <p className="text-sm font-medium leading-relaxed text-stone-700 max-w-md">
              Un grand merci ! Votre demande de prestation pour <strong>{organizer}</strong> a bien été enregistrée par l'équipe de <strong>{associationName}</strong>.
            </p>
            <div className="p-3 bg-white border border-emerald-300 rounded text-xs font-semibold text-emerald-900 w-full max-w-md">
              📧 Nous avons conservé votre adresse <strong>{contactEmail}</strong> et nous reprendrons contact avec vous très rapidement avec une proposition adaptée.
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-4 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg bg-[var(--public-btn-bg,#D32F2F)] text-[var(--public-btn-text,#FFFFFF)] shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              Fermer la fenêtre
            </button>
          </div>
        ) : (
          /* Formulaire de booking */
          <div className="flex flex-col gap-4">
            <div className="border-b border-stone-300 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800">
                Espace Organisateur & Programmateurs
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold uppercase text-cordel-wood">
                Demande de Prestation / Devis
              </h2>
              <p className="text-xs text-stone-600 font-medium">
                Complétez ce formulaire pour soumettre votre projet d'événement directement aux responsables de {associationName}.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-900 text-xs font-bold rounded">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {/* Nom Organisation + Nom Event */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-800">
                    Organisation / Contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="ex: Mairie de Lille / Association ABC"
                    className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-800">
                    Nom de l'événement (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="ex: Festival des Musiques du Monde"
                    className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* Email + Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-800">
                    Adresse E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@organisateur.fr"
                    className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-800">
                    Téléphone (Optionnel)
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              {/* Date + Lieu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-800">
                    Date souhaitée *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-stone-800">
                    Lieu / Ville de l'événement *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ex: Place du Capitole, Toulouse"
                    className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white"
                  />
                </div>
              </div>

              {/* Type d'événement */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-800">
                  Type de Prestation
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="text-xs font-bold px-3 py-2 border border-stone-300 rounded bg-white w-full"
                >
                  <option value="Festival">Festival / Scène</option>
                  <option value="Carnaval">Carnaval / Parade de rue</option>
                  <option value="Concert">Concert / Événement culturel</option>
                  <option value="Prive">Événement privé / Mariage / Entreprise</option>
                  <option value="Atelier">Atelier / Workshop percussion</option>
                  <option value="Autre">Autre format</option>
                </select>
              </div>

              {/* Message libre */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-extrabold uppercase text-stone-800">
                  Détails du projet / Message (Optionnel)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Horaires souhaités, contraintes sonores, hébergement, restauration..."
                  className="text-xs p-3 border border-stone-300 rounded bg-white font-sans resize-none"
                />
              </div>

              {/* Bouton de Validation */}
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-stone-300">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  disabled={submitting}
                  className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg bg-[var(--public-btn-bg,#D32F2F)] text-[var(--public-btn-text,#FFFFFF)] shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? '⏳ Envoi en cours...' : '📤 Transmettre la demande'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
