import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { createManualMember } from '../../services/memberService';
import { filterPublicPercussionInstruments, computePupitresList } from '../../utils/tagUtils';

const DEFAULT_PUPITRES = [
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
 * Modale Cordel de création manuelle d'un adhérent par le Bureau (Secrétariat / Mestre / Admin)
 *
 * @param {Object} props
 * @param {boolean} props.isOpen Indique si la modale est affichée
 * @param {Function} props.onClose Callback de fermeture de la modale
 * @param {string} props.groupId Identifiant de l'association
 * @param {Object} props.profileData Profil de l'utilisateur courant (auteur)
 * @param {Function} [props.onMemberCreated] Callback appelé après création réussie
 */
export default function ManualMemberModal({ isOpen, onClose, groupId, profileData, onMemberCreated }) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [pratiquePercussion, setPratiquePercussion] = useState(true);
  const [pratiqueDanse, setPratiqueDanse] = useState(false);
  const [instrument, setInstrument] = useState('');
  const [cotisationAjour, setCotisationAjour] = useState(false);

  const [pupitresList, setPupitresList] = useState(DEFAULT_PUPITRES);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Chargement dynamique des pupitres de l'association
  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;

    const fetchPupitres = async () => {
      try {
        const assocRef = doc(db, 'associations', groupId);
        const snap = await getDoc(assocRef);
        if (snap.exists() && isMounted) {
          const data = snap.data();
          const raw = Array.isArray(data.instrumentsDisponibles) && data.instrumentsDisponibles.length > 0
            ? data.instrumentsDisponibles
            : DEFAULT_PUPITRES;
          const filtered = filterPublicPercussionInstruments(raw);
          const computed = computePupitresList(filtered, data.linkedInstruments || []);
          setPupitresList(computed);
        }
      } catch (err) {
        console.warn("ManualMemberModal - Erreur chargement pupitres :", err);
      }
    };

    fetchPupitres();
    return () => { isMounted = false; };
  }, [groupId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!prenom.trim() || !nom.trim()) {
      setErrorMessage("Le prénom et le nom sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const res = await createManualMember({
        prenom,
        nom,
        email,
        telephone,
        pratiquePercussion,
        pratiqueDanse,
        instrument,
        cotisationAjour
      }, groupId, profileData);

      alert(`Adhérent « ${prenom.trim()} ${nom.trim()} » inscrit avec succès ! Son profil est actif.`);
      if (onMemberCreated) onMemberCreated(res.member);
      onClose();
    } catch (err) {
      console.error("ManualMemberModal - Erreur lors de l'enregistrement :", err);
      setErrorMessage(err.message || "Erreur lors de la création du membre.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in select-none">
      <div className="relative w-full max-w-lg my-auto">
        <CordelCard
          variant="default"
          useExtremeBorder={true}
          className="p-5 sm:p-6 flex flex-col gap-4 text-left border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] bg-cordel-bg-light"
        >
          {/* En-tête */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-cordel-master-dark/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">➕</span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-cordel-wood">
                  Inscrire un membre manuellement
                </h3>
                <p className="text-[10px] text-cordel-master-dark opacity-75 font-semibold">
                  Pôle Secrétariat & Administration
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-500 hover:text-encre-noire font-bold text-lg p-1 cursor-pointer"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Prénom & Nom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
                  Prénom <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex : Julien"
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 px-2 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
                  Nom <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : Dupont"
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 px-2 bg-white"
                />
              </div>
            </div>

            {/* Email & Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center justify-between">
                  <span>Adresse e-mail</span>
                  <span className="text-[8px] font-semibold text-stone-500 normal-case">(optionnel)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adherent@exemple.com"
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 px-2 bg-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center justify-between">
                  <span>Téléphone</span>
                  <span className="text-[8px] font-semibold text-stone-500 normal-case">(optionnel)</span>
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="06 12 34 56 78"
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 px-2 bg-white"
                />
              </div>
            </div>

            {/* Note d'information réconciliation */}
            <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 text-[10px] text-amber-900 dark:text-amber-200 leading-relaxed">
              💡 <strong>Réconciliation automatique :</strong> Si une adresse e-mail est renseignée, l'adhérent récupérera automatiquement sa fiche dès sa première connexion (par Google ou e-mail classique) sans créer de doublon.
            </div>

            {/* Pratiques : Percussion & Danse */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-dashed border-cordel-master-dark/15">
              <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
                Disciplines pratiquées
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 rounded bg-white/70 border border-cordel-master-dark/15 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pratiquePercussion}
                    onChange={(e) => setPratiquePercussion(e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4 accent-cordel-wood cursor-pointer"
                  />
                  <span className="text-xs font-bold text-encre-noire">🥁 Percussion</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded bg-white/70 border border-cordel-master-dark/15 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pratiqueDanse}
                    onChange={(e) => setPratiqueDanse(e.target.checked)}
                    disabled={saving}
                    className="w-4 h-4 accent-cordel-wood cursor-pointer"
                  />
                  <span className="text-xs font-bold text-encre-noire">💃 Danse</span>
                </label>
              </div>
            </div>

            {/* Pupitre / Instrument principal */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark flex items-center justify-between">
                <span>Pupitre / Instrument principal</span>
                <span className="text-[8px] font-semibold text-stone-500 normal-case">(optionnel)</span>
              </label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 px-2 bg-white"
              >
                <option value="">-- Non attribué pour l'instant --</option>
                {pupitresList.map(pup => (
                  <option key={pup} value={pup}>{pup}</option>
                ))}
              </select>
            </div>

            {/* Statut administratif adhésion / cotisation */}
            <div className="p-2.5 rounded bg-white/70 border border-cordel-master-dark/15 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-black text-encre-noire uppercase tracking-wider">
                  Cotisation / Adhésion
                </span>
                <span className="text-[10px] text-cordel-master-dark opacity-70">
                  {cotisationAjour ? 'Statut : À jour (validée)' : 'Statut : En attente de règlement'}
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cotisationAjour}
                  onChange={(e) => setCotisationAjour(e.target.checked)}
                  disabled={saving}
                  className="w-4 h-4 accent-[var(--color-cordel-vert,#2d6a4f)] cursor-pointer"
                />
                <span className={`text-xs font-bold ${cotisationAjour ? 'text-green-800' : 'text-stone-600'}`}>
                  {cotisationAjour ? '✅ À jour' : '⏳ En attente'}
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded bg-red-50 text-xs font-bold text-red-800 border border-red-300">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton
                type="button"
                variant="default"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold uppercase"
              >
                Annuler
              </CordelButton>
              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={saving || !prenom.trim() || !nom.trim()}
                className="px-5 py-2 text-xs font-black uppercase tracking-wider shadow-sm"
              >
                {saving ? "Enregistrement..." : "💾 Valider l'adhérent"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
