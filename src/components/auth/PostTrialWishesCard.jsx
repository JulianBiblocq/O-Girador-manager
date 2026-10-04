import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { filterPublicPercussionInstruments, computePupitresList } from '../../utils/tagUtils';

const DEFAULT_INSTRUMENTS = [
  "Alfaia",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Timbal",
  "Chant"
];

/**
 * Encart Cordel permettant aux adhérents en attente d'approbation d'exprimer
 * leurs 3 vœux d'instruments post-essai pour aider le Mestre à équilibrer les pupitres.
 *
 * @param {Object} props
 * @param {Object} props.profileData Données du profil membre en attente
 */
export default function PostTrialWishesCard({ profileData }) {
  const existingWishes = useMemo(() => {
    if (Array.isArray(profileData?.voeuxInstruments) && profileData.voeuxInstruments.length > 0) {
      return profileData.voeuxInstruments;
    }
    return [
      profileData?.voeuPrincipal || '',
      profileData?.voeuSecondaire || '',
      profileData?.voeuTertiaire || ''
    ];
  }, [profileData]);

  const [wish1, setWish1] = useState(existingWishes[0] || '');
  const [wish2, setWish2] = useState(existingWishes[1] || '');
  const [wish3, setWish3] = useState(existingWishes[2] || '');

  const [pupitresList, setPupitresList] = useState(DEFAULT_INSTRUMENTS);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Récupération de la liste des pupitres consolidés de l'association
  useEffect(() => {
    const groupId = profileData?.groupId;
    if (!groupId) return;

    let isMounted = true;
    const fetchAssocInstruments = async () => {
      try {
        const assocRef = doc(db, 'associations', groupId);
        const assocSnap = await getDoc(assocRef);
        if (assocSnap.exists() && isMounted) {
          const data = assocSnap.data();
          const rawInsts = (Array.isArray(data.instrumentsDisponibles) && data.instrumentsDisponibles.length > 0)
            ? data.instrumentsDisponibles
            : (Array.isArray(data.instrumentsActifs) && data.instrumentsActifs.length > 0)
              ? data.instrumentsActifs
              : DEFAULT_INSTRUMENTS;

          const percussions = filterPublicPercussionInstruments(rawInsts);
          const computed = computePupitresList(percussions, data.linkedInstruments || []);
          if (computed.length > 0) {
            setPupitresList(computed);
          }
        }
      } catch (err) {
        console.warn("PostTrialWishesCard - Impossible de charger les instruments d'association :", err);
      }
    };

    fetchAssocInstruments();
    return () => { isMounted = false; };
  }, [profileData?.groupId]);

  // Synchronisation si profileData change
  useEffect(() => {
    setWish1(existingWishes[0] || '');
    setWish2(existingWishes[1] || '');
    setWish3(existingWishes[2] || '');
  }, [existingWishes]);

  const handleSaveWishes = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const userId = profileData?.id || profileData?.uid || auth.currentUser?.uid;
    if (!userId) {
      setErrorMessage("Identifiant utilisateur introuvable.");
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      const cleanWishes = [wish1, wish2, wish3].map(w => (w || '').trim()).filter(Boolean);
      const userRef = doc(db, 'users', userId);

      const payload = {
        voeuxInstruments: cleanWishes,
        voeuPrincipal: cleanWishes[0] || '',
        voeuSecondaire: cleanWishes[1] || '',
        voeuTertiaire: cleanWishes[2] || '',
        dateVoeuxPostEssai: new Date().toISOString()
      };

      await updateDoc(userRef, payload);

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("PostTrialWishesCard - Erreur lors de l'enregistrement des vœux :", err);
      setErrorMessage("Erreur lors de l'enregistrement de vos souhaits. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const hasExistingWishes = Boolean(wish1 || wish2 || wish3);

  return (
    <CordelCard
      variant="default"
      useExtremeBorder={true}
      className="p-5 flex flex-col gap-3.5 text-left border-2 border-dashed border-cordel-wood/40 bg-cordel-bg-light/90 shadow-md"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-2xl shrink-0 p-1.5 bg-amber-100 dark:bg-amber-950/60 rounded-md border border-amber-300">
          🥁
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-cordel-wood">
            Souhaits d'instruments post-essai
          </h3>
          <p className="text-xs text-encre-noire leading-relaxed font-medium">
            Tu as réalisé tes séances d'essai ? Renseigne tes souhaits d'instruments pour aider le Mestre à équilibrer les pupitres.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-500/40 rounded text-xs text-green-800 dark:text-green-300 font-bold flex items-center gap-2">
          <span>✅</span> Vos souhaits d'instruments ont été enregistrés et transmis au Mestre avec succès !
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-500/40 rounded text-xs text-red-800 dark:text-red-300 font-bold flex items-center gap-2">
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {hasExistingWishes && !savedSuccess && (
        <div className="text-[11px] text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-dashed border-amber-300 flex items-center gap-1.5">
          <span>💡</span> Vos vœux actuels : <strong>{cleanWishesText([wish1, wish2, wish3])}</strong>. Vous pouvez les ajuster ci-dessous.
        </div>
      )}

      <form onSubmit={handleSaveWishes} className="flex flex-col gap-3 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Vœu 1 (Principal) */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
              🥇 Vœu 1 (Principal)
            </label>
            <select
              value={wish1}
              onChange={(e) => setWish1(e.target.value)}
              disabled={saving}
              className="theme-input w-full text-xs font-bold bg-white"
            >
              <option value="">-- Choix principal --</option>
              {pupitresList
                .filter(pup => pup !== wish2 && pup !== wish3)
                .map(pup => (
                  <option key={`w1-${pup}`} value={pup}>{pup}</option>
                ))}
            </select>
          </div>

          {/* Vœu 2 (Secondaire) */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark opacity-80 flex items-center gap-1">
              🥈 Vœu 2 (Secondaire)
            </label>
            <select
              value={wish2}
              onChange={(e) => setWish2(e.target.value)}
              disabled={saving}
              className="theme-input w-full text-xs font-semibold bg-white"
            >
              <option value="">-- Optionnel --</option>
              {pupitresList
                .filter(pup => pup !== wish1 && pup !== wish3)
                .map(pup => (
                  <option key={`w2-${pup}`} value={pup}>{pup}</option>
                ))}
            </select>
          </div>

          {/* Vœu 3 (Tertiaire) */}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark opacity-80 flex items-center gap-1">
              🥉 Vœu 3 (Tertiaire)
            </label>
            <select
              value={wish3}
              onChange={(e) => setWish3(e.target.value)}
              disabled={saving}
              className="theme-input w-full text-xs font-semibold bg-white"
            >
              <option value="">-- Optionnel --</option>
              {pupitresList
                .filter(pup => pup !== wish1 && pup !== wish2)
                .map(pup => (
                  <option key={`w3-${pup}`} value={pup}>{pup}</option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <CordelButton
            type="submit"
            variant="ocre"
            useExtremeBorder={true}
            disabled={saving || (!wish1 && !wish2 && !wish3)}
            className="w-full sm:w-auto py-2 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>{saving ? "⏳ Enregistrement..." : "💾 Transmettre mes vœux au Mestre"}</span>
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}

function cleanWishesText(wishes) {
  const valid = (wishes || []).filter(Boolean);
  if (valid.length === 0) return 'Aucun';
  return valid.join(' > ');
}
