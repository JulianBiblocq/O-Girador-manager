import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import MusicalOrientationForm from './MusicalOrientationForm';
import { 
  XiloEye, 
  XiloEyeOff, 
  XiloLock, 
  XiloShield, 
  XiloTrombinoscope, 
  XiloPhone, 
  XiloHome, 
  XiloBirthday, 
  XiloPin, 
  XiloShirt, 
  XiloHand, 
  XiloSparkles, 
  XiloUser 
} from '../XiloIcons';

import AddressAutocomplete from '../AddressAutocomplete';

/**
 * ProfileEditForm component renders the profile editing form for the current user.
 * Extracted from UserProfile to keep components modular and clean.
 *
 * @param {Object} props Component properties
 * @param {Object} props.formData The profile form state object
 * @param {Function} props.setFormData The form state setter function
 * @param {Function} props.handleChange Field change event handler
 * @param {Function} props.handleSave Submit handler to persist profile updates
 * @param {Function} props.setIsEditing State function to exit editing mode
 * @param {boolean} props.saving Loading state indicator for database saves
 * @param {Function} props.isFieldVisible Helper function to check configuration rules for fields visibility
 * @param {boolean} props.demanderTailles Association configuration for displaying sizes
 * @param {boolean} props.demanderAttestationSante Association configuration for medical certificates
 * @param {Function} props.t Translation helper function
 */
export default function ProfileEditForm({
  formData,
  setFormData,
  handleChange,
  handleSave,
  setIsEditing,
  saving,
  isFieldVisible,
  isFieldRequired = () => false,
  validationError = '',
  isInstrumentsValid = true,
  demanderDroitImage = true,
  demanderAttestationSante = true,
  instrumentsDisponibles,
  t
}) {
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const isAncien = Boolean(formData.instrument && formData.instrument.trim() !== '');

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      {validationError && (
        <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-400 text-red-700 dark:text-red-300 text-xs font-bold rounded">
          ⚠️ {validationError}
        </div>
      )}

      {/* EN-TÊTE : IDENTITÉ & ACCORD DU VOCABULAIRE */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/10 pb-1 flex items-center gap-1.5">
          <XiloUser size={14} /> Identité & Préférences Vocabulaire
        </h4>

        {/* First Name & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.firstName', "Prénom")} <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              required
              disabled={saving}
              className="theme-input w-full text-xs font-bold"
            />
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.lastName', "Nom")} <span className="text-red-500 font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
              disabled={saving}
              className="theme-input w-full text-xs font-bold"
            />
          </div>
        </div>

        {/* Genre pour accord du vocabulaire */}
        <div className="flex flex-col gap-1 text-left bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
            <XiloSparkles size={12} /> Accord du vocabulaire (Genre)
          </label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
            disabled={saving}
            className="theme-input w-full text-xs bg-white font-medium"
          >
            <option value="homme">{translate('onboarding.genderMale', "Masculin (ex: Membre, Mestre)")}</option>
            <option value="femme">{translate('onboarding.genderFemale', "Féminin (ex: Membre, Mestra)")}</option>
            <option value="autre">{translate('onboarding.genderOther', "Autre / Non spécifié")}</option>
          </select>
          <span className="text-[9px] text-cordel-master-dark opacity-75 italic mt-0.5">
            💡 Permet d'accorder automatiquement les titres et rôles dans l'interface. N'est pas affiché séparément dans le trombinoscope.
          </span>
        </div>
      </CordelCard>

      {/* BLOC 1 : PROFIL PUBLIC (Trombinoscope) */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
        <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border-2 border-dashed border-emerald-500/40 p-3 rounded-[6px] text-left">
          <div className="flex items-center gap-2.5">
            <XiloEye size={22} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-black text-xs uppercase text-emerald-900 dark:text-emerald-300">
                1. Mon Profil Public (Trombinoscope)
              </h4>
              <p className="text-[10px] text-emerald-800 dark:text-emerald-200 opacity-90 font-medium">
                Ces informations apparaissent sur votre fiche dans le Trombinoscope de l'association.
              </p>
            </div>
          </div>
        </div>

        {/* Surnom */}
        {isFieldVisible('surnom') && (
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.nickname', "Surnom (Affiché entre guillemets)")}
              {isFieldRequired('surnom') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="text"
              name="surnom"
              value={formData.surnom}
              onChange={handleChange}
              disabled={saving}
              placeholder="Ex : Zé, Cacau..."
              className="theme-input w-full text-xs font-bold"
            />
          </div>
        )}

        {/* Évolution & Souhaits d'Instruments */}
        <MusicalOrientationForm
          formData={formData}
          handleChange={handleChange}
          saving={saving}
          instrumentsDisponibles={instrumentsDisponibles}
          isAncien={isAncien}
          t={t}
        />
      </CordelCard>

      {/* BLOC 2 : COORDONNÉES & CONFIDENTIALITÉ */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border-2 border-dashed border-amber-500/40 p-3 rounded-[6px] text-left">
          <div className="flex items-center gap-2.5">
            <XiloLock size={22} className="text-amber-700 dark:text-amber-400 shrink-0" />
            <div>
              <h4 className="font-black text-xs uppercase text-amber-900 dark:text-amber-300">
                2. Coordonnées & Contrôle de Visibilité
              </h4>
              <p className="text-[10px] text-amber-800 dark:text-amber-200 opacity-90 font-medium">
                Cochez ci-dessous les informations que vous acceptez de partager dans l'annuaire.
              </p>
            </div>
          </div>
        </div>

        {/* Telephone */}
        {isFieldVisible('telephone') && (
          <div className="flex flex-col gap-2 text-left bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                <XiloPhone size={12} /> {translate('userProfile.phone', "Téléphone")}
                {isFieldRequired('telephone') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={saving}
                placeholder="Ex : 06 12 34 56 78"
                className="theme-input w-full text-xs font-bold"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-encre-noire cursor-pointer select-none mt-1">
              <input
                type="checkbox"
                name="afficherTelephone"
                checked={formData.afficherTelephone !== false}
                onChange={(e) => setFormData(prev => ({ ...prev, afficherTelephone: e.target.checked }))}
                disabled={saving}
                className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0"
              />
              <span className="flex items-center gap-1"><XiloEye size={12} /> Afficher mon numéro aux membres dans le Trombinoscope</span>
            </label>
          </div>
        )}

        {/* Adresse Postale */}
        {isFieldVisible('adresse') && (
          <div className="flex flex-col gap-2.5 text-left bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                <XiloHome size={12} /> {translate('userProfile.address', "Adresse postale complète (Admin / Logistique)")}
                {isFieldRequired('adresse') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <React.Suspense fallback={
                <div className="text-[10px] font-bold py-2 text-cordel-wood animate-pulse">
                  ⏳ Chargement du champ adresse...
                </div>
              }>
                <AddressAutocomplete
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  onSelect={(details) => {
                    setFormData(prev => ({
                      ...prev,
                      adresse: details.address,
                      adresseRue: details.street || details.address,
                      adresseCodePostal: details.zipcode || prev.adresseCP,
                      adresseVille: details.city || prev.adresseVille
                    }));
                  }}
                  disabled={saving}
                  placeholder="Rechercher une adresse..."
                  className="theme-input w-full text-xs font-bold"
                />
              </React.Suspense>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-encre-noire cursor-pointer select-none mt-1">
              <input
                type="checkbox"
                name="afficherVille"
                checked={Boolean(formData.afficherVille)}
                onChange={(e) => setFormData(prev => ({ ...prev, afficherVille: e.target.checked, visibiliteAdresse: e.target.checked ? 'ville' : 'masquee' }))}
                disabled={saving}
                className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0"
              />
              <span className="flex items-center gap-1"><XiloPin size={12} /> Afficher ma ville uniquement aux membres (Ex: Nantes)</span>
            </label>
          </div>
        )}

        {/* Date de naissance */}
        {isFieldVisible('dateNaissance') && (
          <div className="flex flex-col gap-2 text-left bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
                <XiloBirthday size={12} /> {translate('userProfile.birthdate', "Date de naissance")}
                {isFieldRequired('dateNaissance') && <span className="text-red-500 font-bold ml-1">*</span>}
              </label>
              <input
                type="date"
                name="dateNaissance"
                value={formData.dateNaissance}
                onChange={handleChange}
                disabled={saving}
                className="theme-input w-full text-xs font-semibold"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-encre-noire cursor-pointer select-none mt-1">
              <input
                type="checkbox"
                name="afficherDateNaissance"
                checked={Boolean(formData.afficherDateNaissance)}
                onChange={(e) => setFormData(prev => ({ ...prev, afficherDateNaissance: e.target.checked }))}
                disabled={saving}
                className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0"
              />
              <span className="flex items-center gap-1"><XiloBirthday size={12} /> Afficher mon anniversaire dans le Trombinoscope (Jour & Mois uniquement, sans l'année)</span>
            </label>
          </div>
        )}
      </CordelCard>

      {/* BLOC 3 : LOGISTIQUE, PLACEMENT SCÉNIQUE & SANTÉ (Strictement Confidentiel Admin / Mestre) */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
        <div className="bg-sky-50/90 dark:bg-sky-950/30 border-2 border-dashed border-sky-500/40 p-3 rounded-[6px] text-left">
          <div className="flex items-center gap-2.5">
            <XiloShield size={22} className="text-sky-700 dark:text-sky-400 shrink-0" />
            <div>
              <h4 className="font-black text-xs uppercase text-sky-900 dark:text-sky-300">
                3. Placement Scénique, Costumes & Santé (Confidentiel Mestre / Admin)
              </h4>
              <p className="text-[10px] text-sky-800 dark:text-sky-200 opacity-90 font-medium">
                Réservé au Mestre (pour le placement sur scène dans le Séquenceur) et aux administrateurs. <strong>Ne sera jamais affiché dans le trombinoscope.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Latéralité */}
        {isFieldVisible('lateralite') && (
          <div className="flex flex-col gap-1 text-left bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
              <XiloHand size={12} /> {translate('userProfile.laterality', "Latéralité (Placement scène pour le Mestre & Séquenceur)")}
              {isFieldRequired('lateralite') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <select
              name="lateralite"
              value={formData.lateralite}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-white font-semibold mt-1"
            >
              <option value="droitier">{translate('userProfile.lateralityRight', "Droitier")}</option>
              <option value="gaucher">{translate('userProfile.lateralityLeft', "Gaucher")}</option>
            </select>
          </div>
        )}

        {/* Tailles Vêtements */}
        {(isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
          <div className="flex flex-col gap-2 text-left">
            <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1">
              <XiloShirt size={12} /> Mensurations / Taille des Costumes
            </h5>
            
            <div className="grid grid-cols-2 gap-3">
              {isFieldVisible('tailleTshirt') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                    T-shirt
                    {isFieldRequired('tailleTshirt') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <select
                    name="tailleTshirt"
                    value={formData.tailleTshirt}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input text-xs py-1.5 bg-cordel-bg-light font-bold"
                  >
                    <option value="">-- Sélectionnez --</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="3XL">3XL</option>
                  </select>
                </div>
              )}

              {isFieldVisible('taillePantalon') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                    Pantalon / Bas
                    {isFieldRequired('taillePantalon') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <select
                    name="taillePantalon"
                    value={formData.taillePantalon}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input text-xs py-1.5 bg-cordel-bg-light font-bold"
                  >
                    <option value="">-- Sélectionnez --</option>
                    <option value="34">34</option>
                    <option value="36">36</option>
                    <option value="38">38</option>
                    <option value="40">40</option>
                    <option value="42">42</option>
                    <option value="44">44</option>
                    <option value="46">46</option>
                    <option value="48">48</option>
                    <option value="50">50</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Droit à l'image & Charte */}
        {(demanderDroitImage !== false && isFieldVisible('droitImage')) && (
          <div className="border-t border-dashed border-cordel-master-dark/10 pt-3 flex flex-col gap-1 text-left">
            <label className="flex items-start gap-2.5 text-xs font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                name="droitImage"
                checked={Boolean(formData.droitImage)}
                onChange={(e) => setFormData(prev => ({ ...prev, droitImage: e.target.checked }))}
                disabled={saving}
                className="w-4 h-4 accent-cordel-wood shrink-0 mt-0.5"
              />
              <span className="leading-tight">
                {translate('userProfile.imageRightsCheckbox', "J'autorise l'association à utiliser les photos et vidéos prises lors des événements pour la promotion des activités (Droit à l'image).")}
                {isFieldRequired('droitImage') && <span className="text-red-500 font-bold ml-1">*</span>}
              </span>
            </label>
          </div>
        )}

        {/* Attestation médicale / Santé */}
        {(demanderAttestationSante !== false && isFieldVisible('aptitudeMedicale')) && (
          <div className="border-t border-dashed border-cordel-master-dark/10 pt-3 flex flex-col gap-1 text-left">
            <label className="flex items-start gap-2.5 text-xs font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                name="aptitudeMedicale"
                checked={Boolean(formData.aptitudeMedicale)}
                onChange={(e) => setFormData(prev => ({ ...prev, aptitudeMedicale: e.target.checked }))}
                disabled={saving}
                className="w-4 h-4 accent-cordel-wood shrink-0 mt-0.5"
              />
              <span className="leading-tight">
                {translate('userProfile.medicalCertCheckbox', "J'atteste sur l'honneur être en bonne condition physique pour la pratique de la percussion et/ou de la danse de maracatu.")}
                {isFieldRequired('aptitudeMedicale') && <span className="text-red-500 font-bold ml-1">*</span>}
              </span>
            </label>
          </div>
        )}

        {/* Préférences Alimentaires & Allergies (Confidentiel) */}
        <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 mt-1 flex flex-col gap-3 text-left">
          <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            🍽️ Préférences Alimentaires & Allergies (Confidentiel Admin)
          </h5>

          <p className="text-[10px] text-cordel-master-dark/80 italic font-medium leading-tight">
            💡 Ces informations permettent aux organisateurs de prévoir les repas adaptés lors des stages, répétitions ou prestations avec restauration.
          </p>

          <div className="flex flex-col gap-2 bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
            <span className="text-[9px] uppercase font-bold text-cordel-master-dark">
              Régime alimentaire :
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["Végétarien", "Végétalien", "Sans Gluten", "Sans Lactose"].map(option => {
                const isChecked = (formData.dietaryRestrictions || []).includes(option);
                return (
                  <label key={option} className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const current = formData.dietaryRestrictions || [];
                        const updated = isChecked
                          ? current.filter(item => item !== option)
                          : [...current, option];
                        setFormData(prev => ({ ...prev, dietaryRestrictions: updated }));
                      }}
                      disabled={saving}
                      className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0"
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1 bg-cordel-bg-light/60 p-3 rounded border border-dashed border-cordel-master-dark/20">
            <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
              Allergies ou précisions (arachides, fruits de mer, etc.) :
            </label>
            <textarea
              name="allergies"
              value={formData.allergies || ''}
              onChange={handleChange}
              disabled={saving}
              rows={2}
              placeholder="Ex : Allergie sévère aux arachides, fruits à coque..."
              className="theme-input w-full text-xs font-medium resize-y"
            />
          </div>
        </div>
      </CordelCard>

      {/* Actions Buttons */}
      <div className="flex gap-3 mt-2 select-none">
        <CordelButton 
          type="button" 
          variant="default" 
          useExtremeBorder={true}
          disabled={saving}
          onClick={() => setIsEditing(false)}
          className="flex-1 py-3 text-xs uppercase font-extrabold"
        >
          {translate('common.cancel', "Annuler")}
        </CordelButton>
        <CordelButton 
          type="submit"
          variant="ocre" 
          useExtremeBorder={true}
          disabled={saving || !isInstrumentsValid}
          className="flex-1 py-3 text-xs uppercase font-extrabold opacity-100 disabled:opacity-50"
        >
          {saving ? translate('common.saving', "Envoi...") : translate('common.validate', "Valider et enregistrer")}
        </CordelButton>
      </div>
    </form>
  );
}
