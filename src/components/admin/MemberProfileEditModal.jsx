import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { formatTagGender, getTagId } from '../../utils/tagUtils';
import { VALID_SYSTEM_ROLES } from '../../utils/roleMigration';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';
import { XiloUser, XiloLock, XiloShirt, XiloPhone, XiloHome, XiloBirthday, XiloSparkles, XiloShield, XiloTag } from '../XiloIcons';

/**
 * Modale MemberProfileEditModal
 * Permet aux administrateurs (Mestre / Bureau) d'éditer l'intégralité du profil d'un membre.
 * 
 * Sécurité : L'email et le mot de passe (gérés par Firebase Auth) sont verrouillés en lecture seule.
 * Seules les données du document Firestore de l'utilisateur peuvent être modifiées.
 */
export default function MemberProfileEditModal({
  userItem,
  availableTags = [],
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  instrumentsDisponibles = ["Alfaia Marcante", "Alfaia Meião", "Alfaia Repique", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant"],
  onClose,
  onSave,
  onValidateNewMember,
  saving = false
}) {
  if (!userItem) return null;

  // État local pour le formulaire d'édition du profil
  const [formData, setFormData] = useState({
    prenom: userItem.prenom || '',
    nom: userItem.nom || '',
    surnom: userItem.surnom || '',
    genre: userItem.genre || 'femme',
    telephone: userItem.telephone || '',
    adresseRue: userItem.adresseRue || userItem.adresse || '',
    adresseCP: userItem.adresseCP || '',
    adresseVille: userItem.adresseVille || '',
    dateNaissance: userItem.dateNaissance || '',
    tailleTshirt: userItem.tailleTshirt || 'M',
    taillePantalon: userItem.taillePantalon || 'M',
    lateralite: userItem.lateralite || 'droitier',
    droitImage: userItem.droitImage !== false,
    aptitudeMedicale: userItem.aptitudeMedicale === true,
    role: userItem.role || 'membre',
    niveau: userItem.niveau || userItem.niveauMusique || 'aucun',
    niveauDanse: userItem.niveauDanse || 'aucun',
    instrument: userItem.instrument || userItem.instrumentPrincipal || '',
    instrumentSecondaire: userItem.instrumentSecondaire || '',
    voeuPrincipal: userItem.voeuPrincipal || '',
    voeuSecondaire: userItem.voeuSecondaire || '',
    voeuTertiaire: userItem.voeuTertiaire || '',
    pratiquePercussion: userItem.pratiquePercussion !== false,
    pratiqueDanse: userItem.pratiqueDanse === true,
    estAncienMembre: userItem.estAncienMembre === true,
    souhaiteChangerInstrument: userItem.souhaiteChangerInstrument === true,
    accordRenfortAncienInstrument: userItem.accordRenfortAncienInstrument === true,
    dietaryRestrictionsText: Array.isArray(userItem.dietaryRestrictions) ? userItem.dietaryRestrictions.join(', ') : (userItem.dietaryRestrictions || ''),
    allergies: userItem.allergies || '',
    tags: Array.isArray(userItem.tags) ? [...userItem.tags] : [],
    instrumentsJoues: Array.isArray(userItem.instrumentsJoues) ? [...userItem.instrumentsJoues] : (userItem.instrument ? [userItem.instrument] : []),
    niveauxParInstrument: userItem.niveauxParInstrument || {}
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagToggle = (tagId, isChecked) => {
    setFormData(prev => {
      const currentTags = prev.tags || [];
      if (isChecked) {
        return { ...prev, tags: [...currentTags, tagId] };
      } else {
        return { ...prev, tags: currentTags.filter(t => t !== tagId) };
      }
    });
  };

  const handleInstrumentToggle = (inst, isChecked) => {
    setFormData(prev => {
      const currentInsts = prev.instrumentsJoues || [];
      const currentNiveaux = prev.niveauxParInstrument || {};
      
      if (isChecked) {
        return { ...prev, instrumentsJoues: [...currentInsts, inst] };
      } else {
        const { [inst]: removed, ...restNiveaux } = currentNiveaux;
        return { 
          ...prev, 
          instrumentsJoues: currentInsts.filter(i => i !== inst),
          niveauxParInstrument: restNiveaux
        };
      }
    });
  };

  const handleNiveauInstrumentChange = (inst, niveau) => {
    setFormData(prev => ({
      ...prev,
      niveauxParInstrument: {
        ...(prev.niveauxParInstrument || {}),
        [inst]: niveau
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Traitement des restrictions alimentaires depuis la chaîne de caractères
    const cleanRestrictions = formData.dietaryRestrictionsText
      ? formData.dietaryRestrictionsText.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const updatedPayload = {
      prenom: formData.prenom.trim(),
      nom: formData.nom.trim(),
      surnom: formData.surnom.trim(),
      genre: formData.genre,
      telephone: formData.telephone.trim(),
      adresseRue: formData.adresseRue.trim(),
      adresseCP: formData.adresseCP.trim(),
      adresseVille: formData.adresseVille.trim(),
      dateNaissance: formData.dateNaissance,
      tailleTshirt: formData.tailleTshirt,
      taillePantalon: formData.taillePantalon,
      lateralite: formData.lateralite,
      droitImage: formData.droitImage,
      aptitudeMedicale: formData.aptitudeMedicale,
      role: VALID_SYSTEM_ROLES.includes(formData.role) ? formData.role : 'membre',
      niveau: formData.niveau,
      niveauDanse: formData.niveauDanse,
      instrument: formData.instrument,
      instrumentPrincipal: formData.instrument,
      instrumentSecondaire: formData.instrumentSecondaire,
      voeuPrincipal: formData.voeuPrincipal,
      voeuSecondaire: formData.voeuSecondaire,
      voeuTertiaire: formData.voeuTertiaire,
      pratiquePercussion: formData.pratiquePercussion,
      pratiqueDanse: formData.pratiqueDanse,
      estAncienMembre: formData.estAncienMembre,
      souhaiteChangerInstrument: formData.souhaiteChangerInstrument,
      accordRenfortAncienInstrument: formData.accordRenfortAncienInstrument,
      dietaryRestrictions: cleanRestrictions,
      allergies: formData.allergies.trim(),
      tags: formData.tags,
      instrumentsJoues: formData.instrumentsJoues,
      niveauxParInstrument: formData.niveauxParInstrument
    };

    onSave(userItem.id, updatedPayload);
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-cordel-bg-light border-4 border-encre-noire shadow-2xl overflow-hidden text-left">
        {/* 1. En-tête de la modale (Fixe) */}
        <div className="bg-cordel-bg border-b-2 border-dashed border-cordel-master-dark/30 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {userItem.photoUrl ? (
              <img src={userItem.photoUrl} alt={userItem.prenom} className="w-10 h-10 rounded-full border border-encre-noire object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full border border-encre-noire bg-cordel-bg-light flex items-center justify-center font-black text-cordel-wood shrink-0">
                {userItem.prenom?.charAt(0)}{userItem.nom?.charAt(0)}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <h3 className="font-extrabold text-base uppercase text-encre-noire truncate leading-tight">
                Fiche Membre : {userItem.prenom} {userItem.nom}
              </h3>
              <span className="text-[10px] font-bold text-cordel-wood">
                Édition Administrateur Système
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {userItem.isNew === true && onValidateNewMember && (
              <button
                type="button"
                onClick={() => onValidateNewMember(userItem.id)}
                disabled={saving}
                className="text-[10px] font-black uppercase tracking-wider bg-[#2d6a4f] hover:bg-[#2d6a4f]/90 text-white border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1.5 animate-pulse"
                title="Valider l'inscription de ce nouveau membre"
              >
                ✅ Valider la nouvelle inscription
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-black bg-cordel-bg hover:bg-neutral-200 border border-encre-noire px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer"
              title="Fermer (Échap)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form Wrapper */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* 2. Body (Défilable verticalement) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-encre-noire">
            {/* Section 1 : Identité */}
            <div className="border border-dashed border-cordel-master-dark/20 p-4 rounded bg-white/40 flex flex-col gap-3">
              <h4 className="font-extrabold uppercase text-cordel-wood text-[11px] flex items-center gap-1.5">
                <XiloUser size={14} /> 1. Identité, Surnom & Date de Naissance
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Prénom</label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    className="theme-input text-xs font-bold w-full py-1 px-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Nom</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    className="theme-input text-xs font-bold w-full py-1 px-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Surnom</label>
                  <input
                    type="text"
                    name="surnom"
                    value={formData.surnom}
                    onChange={handleChange}
                    className="theme-input text-xs font-bold w-full py-1 px-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Date de naissance</label>
                <input
                  type="date"
                  name="dateNaissance"
                  value={formData.dateNaissance}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
            </div>

          {/* Section 2 : Coordonnées */}
          <div className="border border-dashed border-cordel-master-dark/20 p-4 rounded bg-white/40 flex flex-col gap-3">
            <h4 className="font-extrabold uppercase text-cordel-wood text-[11px] flex items-center gap-1.5">
              <XiloPhone size={14} /> 2. Coordonnées & Adresse physique
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Téléphone</label>
                <input
                  type="text"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Rue / Voie</label>
                <input
                  type="text"
                  name="adresseRue"
                  value={formData.adresseRue}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Code Postal</label>
                <input
                  type="text"
                  name="adresseCP"
                  value={formData.adresseCP}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Ville</label>
                <input
                  type="text"
                  name="adresseVille"
                  value={formData.adresseVille}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
            </div>
          </div>

          {/* Section 3 : Placement, Mensurations & Santé */}
          <div className="border border-dashed border-cordel-master-dark/20 p-4 rounded bg-white/40 flex flex-col gap-3">
            <h4 className="font-extrabold uppercase text-cordel-wood text-[11px] flex items-center gap-1.5">
              <XiloShirt size={14} /> 3. Costumes, Mensurations, Placement & Santé
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Taille T-shirt</label>
                <select
                  name="tailleTshirt"
                  value={formData.tailleTshirt}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Taille Pantalon / Bas</label>
                <select
                  name="taillePantalon"
                  value={formData.taillePantalon}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Latéralité (Séquenceur)</label>
                <select
                  name="lateralite"
                  value={formData.lateralite}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="droitier">Droitier</option>
                  <option value="gaucher">Gaucher</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  name="droitImage"
                  checked={formData.droitImage}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-encre-noire text-cordel-wood"
                />
                <span>Droit à l'image accordé</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  name="aptitudeMedicale"
                  checked={formData.aptitudeMedicale}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-encre-noire text-cordel-wood"
                />
                <span>Aptitude médicale attestée sur l'honneur</span>
              </label>
            </div>
          </div>

          {/* Section 4 : Discipline, Instruments & Niveaux */}
          <div className="border border-dashed border-cordel-master-dark/20 p-4 rounded bg-white/40 flex flex-col gap-3">
            <h4 className="font-extrabold uppercase text-cordel-wood text-[11px] flex items-center gap-1.5">
              <XiloSparkles size={14} /> 4. Discipline, Instruments & Niveaux Musique/Danse
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Instrument Principal (Statut/Mestre)</label>
                <select
                  name="instrument"
                  value={formData.instrument}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="">-- Non attribué --</option>
                  {instrumentsDisponibles.map(inst => (
                    <option key={`p-${inst}`} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Instrument Secondaire</label>
                <select
                  name="instrumentSecondaire"
                  value={formData.instrumentSecondaire}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="">-- Aucun --</option>
                  {instrumentsDisponibles.map(inst => (
                    <option key={`s-${inst}`} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3 mt-1">
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-1">
                  Tous les instruments joués (sélection multiple)
                </label>
                <div className="flex flex-wrap gap-2">
                  {instrumentsDisponibles.map((inst) => (
                    <label key={`check-${inst}`} className="flex items-center gap-1.5 text-xs cursor-pointer select-none bg-cordel-bg-light/60 border border-cordel-master-dark/20 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={formData.instrumentsJoues.includes(inst)}
                        onChange={(e) => handleInstrumentToggle(inst, e.target.checked)}
                        className="rounded text-cordel-wood focus:ring-0"
                      />
                      <span>{inst}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {formData.instrumentsJoues.length > 0 && (
                <div className="sm:col-span-3 bg-amber-50 dark:bg-amber-950/30 border border-cordel-wood/30 p-2.5 rounded mt-1">
                  <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-1">
                    Niveaux par instrument joué
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {formData.instrumentsJoues.map((inst) => (
                      <div key={`niv-${inst}`} className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-cordel-wood">{inst}</span>
                        <select
                          value={formData.niveauxParInstrument[inst] || 'debutant'}
                          onChange={(e) => handleNiveauInstrumentChange(inst, e.target.value)}
                          className="theme-input text-xs font-bold py-1 px-1.5 bg-white"
                        >
                          <option value="debutant">Débutant</option>
                          {customCategories.filter(cat => cat.toLowerCase() !== 'debutant').map(cat => (
                            <option key={`cat-${inst}-${cat}`} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Niveau Musique (Global)</label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="aucun">Aucun</option>
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Niveau Danse</label>
                <select
                  name="niveauDanse"
                  value={formData.niveauDanse}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="aucun">Aucun</option>
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Vœu 1 (Orientation)</label>
                <select
                  name="voeuPrincipal"
                  value={formData.voeuPrincipal}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="">-- Aucun --</option>
                  {instrumentsDisponibles.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">Vœu 2 (Orientation)</label>
                <select
                  name="voeuSecondaire"
                  value={formData.voeuSecondaire}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2 bg-cordel-bg-light"
                >
                  <option value="">-- Aucun --</option>
                  {instrumentsDisponibles.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-2 border-t border-dashed border-cordel-master-dark/10 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  name="pratiquePercussion"
                  checked={formData.pratiquePercussion}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-encre-noire text-cordel-wood"
                />
                <span>Pratique la percussion</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  name="pratiqueDanse"
                  checked={formData.pratiqueDanse}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-encre-noire text-cordel-wood"
                />
                <span>Pratique la danse</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  name="estAncienMembre"
                  checked={formData.estAncienMembre}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-encre-noire text-cordel-wood"
                />
                <span>Ancien membre</span>
              </label>
            </div>
          </div>

          {/* Section 5 : Régime Alimentaire & Allergies */}
          <div className="border border-dashed border-cordel-master-dark/20 p-4 rounded bg-white/40 flex flex-col gap-3">
            <h4 className="font-extrabold uppercase text-cordel-wood text-[11px] flex items-center gap-1.5">
              🍽️ 5. Régime Alimentaire & Allergies (Confidentiel Organisiation)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">
                  Restrictions / Régimes (séparés par des virgules)
                </label>
                <input
                  type="text"
                  name="dietaryRestrictionsText"
                  placeholder="Ex: Végétarien, Sans Gluten, Halal"
                  value={formData.dietaryRestrictionsText}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-cordel-master-dark mb-0.5">
                  Allergies & Précisions de santé
                </label>
                <input
                  type="text"
                  name="allergies"
                  placeholder="Ex: Allergie arachides, Asthme"
                  value={formData.allergies}
                  onChange={handleChange}
                  className="theme-input text-xs font-bold w-full py-1 px-2"
                />
              </div>
            </div>
          </div>

          {/* Section 6 : Étiquettes (Tags) */}
          {availableTags.length > 0 && (
            <div className="border border-dashed border-cordel-master-dark/20 p-4 rounded bg-white/40 flex flex-col gap-2">
              <h4 className="font-extrabold uppercase text-cordel-wood text-[11px] flex items-center gap-1.5">
                <XiloTag size={14} /> 6. Étiquettes d'organisation attribuées
              </h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                {availableTags.map(tag => {
                  const tagId = getTagId(tag);
                  const isChecked = formData.tags.includes(tagId) || (typeof tag === 'string' && formData.tags.includes(tag));
                  const formattedLabel = formatTagGender(tag, formData.genre, false, availableTags);
                  return (
                    <label key={tagId} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold select-none hover:opacity-80">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleTagToggle(tagId, e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-encre-noire text-cordel-wood focus:ring-cordel-wood"
                      />
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-1.5 py-0.5 bg-transparent border border-dashed">
                        {formattedLabel}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. Footer / Actions de la modale (Fixe en bas) */}
          <div className="flex-shrink-0 p-4 border-t border-dashed border-cordel-master-dark/30 flex justify-between items-center bg-cordel-bg-light">
            <CordelButton
              type="button"
              variant="default"
              onClick={onClose}
              disabled={saving}
              className="py-2 px-4 text-xs font-bold uppercase"
            >
              Annuler
            </CordelButton>

            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={saving}
              className="py-2 px-6 text-xs font-extrabold uppercase tracking-wider !bg-amber-600 !text-white shadow-[2px_2px_0px_0px_#181716]"
            >
              {saving ? "Enregistrement en cours..." : "💾 Enregistrer toutes les modifications"}
            </CordelButton>
          </div>
        </form>
      </div>
    </div>
  );
}
