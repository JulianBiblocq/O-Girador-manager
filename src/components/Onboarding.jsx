import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';

export default function Onboarding({ user, onComplete }) {
  // Split the Google Auth display name into a first name and a last name
  const nameParts = user.displayName ? user.displayName.split(' ') : [];
  const initialFirstName = nameParts[0] || '';
  const initialLastName = nameParts.slice(1).join(' ') || '';

  const [formData, setFormData] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    phone: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Extract the group ID parameter from the URL if present
      const searchParams = new URLSearchParams(window.location.search);
      const groupId = searchParams.get('groupe') || null;

      // 2. Build the user document payload according to the specifications
      const userDoc = {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: user.email,
        telephone: formData.phone,
        role: "membre",
        statutActuel: "active",
        groupId: groupId,
        tags: []
      };

      // 3. Write user document to Firestore using Auth UID as the key
      await setDoc(doc(db, 'users', user.uid), userDoc);
      console.log("Onboarding - Profil créé avec succès dans Firestore !");

      // 4. Redirect the user by triggering the parent callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Onboarding - Erreur d'écriture dans Firestore :", error);
      alert("Erreur lors de l'enregistrement de votre profil. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LayoutShell>
      <div className="text-center py-4 border-b-2 border-dashed border-cordel-master-dark/30">
        <h1 className="panel-title text-2xl font-extrabold tracking-wider text-cordel-wood">
          NOUVEAU PROFIL
        </h1>
        <p className="text-[10px] font-bold tracking-widest text-cordel-master-dark opacity-75 mt-1">
          INSCRIPTION • ÉTAPE 1 SUR 2
        </p>
      </div>

      <CordelCard variant="default" useExtremeBorder={true}>
        <h2 className="panel-title text-lg font-bold mb-2">Bienvenue dans l'association !</h2>
        <p className="text-xs leading-relaxed opacity-80 mb-6">
          Nous avons besoin de quelques informations pour compléter votre fiche de membre.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {/* First Name Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Prénom
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>

          {/* Last Name Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Nom
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>

          {/* Phone Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={submitting}
              className="theme-input w-full disabled:opacity-50"
            />
          </div>

          <CordelButton 
            variant="ocre" 
            useExtremeBorder={true}
            className="w-full mt-4 py-3"
            disabled={submitting}
          >
            {submitting ? "Enregistrement..." : "Étape suivante"}
          </CordelButton>
        </form>
      </CordelCard>
    </LayoutShell>
  );
}
