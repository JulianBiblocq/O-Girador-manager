import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

const AddressAutocomplete = React.lazy(() => import('../AddressAutocomplete'));

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
  demanderAttestationSante,
  t
}) {
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4">
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/10 pb-1">
          {translate('userProfile.personalInfo', "Informations personnelles")}
        </h4>

        {validationError && (
          <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-400 text-red-700 dark:text-red-300 text-xs font-bold rounded">
            ⚠️ {validationError}
          </div>
        )}

        {/* First Name */}
        <div className="flex flex-col gap-1.5 text-left">
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

        {/* Last Name */}
        <div className="flex flex-col gap-1.5 text-left">
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

        {/* Genre */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
            {translate('onboarding.genre', "Genre")}
          </label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            required
            disabled={saving}
            className="theme-input w-full text-xs bg-cordel-bg-light"
          >
            <option value="homme">{translate('onboarding.genderMale', "Homme")}</option>
            <option value="femme">{translate('onboarding.genderFemale', "Femme")}</option>
            <option value="autre">{translate('onboarding.genderOther', "Autre")}</option>
          </select>
        </div>

        {/* Telephone */}
        {isFieldVisible('telephone') && (
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.phone', "Téléphone")}
              {isFieldRequired('telephone') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs"
            />
          </div>
        )}

        {/* Surnom */}
        {isFieldVisible('surnom') && (
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.nickname', "Surnom")}
              {isFieldRequired('surnom') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="text"
              name="surnom"
              value={formData.surnom}
              onChange={handleChange}
              disabled={saving}
              placeholder="Facultatif"
              className="theme-input w-full text-xs"
            />
          </div>
        )}

        {/* Instrument Principal */}
        <div className="flex flex-col gap-1.5 text-left">
          <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
            {translate('onboarding.instrument', "Instrument principal")}
          </label>
          <select
            name="instrument"
            value={formData.instrument}
            onChange={handleChange}
            required
            disabled={saving}
            className="theme-input w-full text-xs bg-cordel-bg-light"
          >
            <option value="Alfaia">Alfaia</option>
            <option value="Caixa">Caixa</option>
            <option value="Agbê">Agbê</option>
            <option value="Gonguê">Gonguê</option>
            <option value="Mineiro">Mineiro</option>
            <option value="Apito">Apito / Mestre</option>
            <option value="Timbal">Timbal</option>
            <option value="Chant">Chant</option>
            <option value="Danse">Danse</option>
            <option value="Autre">Autre / Polyvalent</option>
          </select>
        </div>

        {/* Adresse (Google Places Autocomplete) */}
        {isFieldVisible('adresse') && (
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.address', "Adresse")}
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
                    adresseRue: details.street,
                    adresseCodePostal: details.zipcode,
                    adresseVille: details.city
                  }));
                }}
                disabled={saving}
                placeholder="Entrez votre adresse"
                className="theme-input w-full text-xs"
              />
            </React.Suspense>
          </div>
        )}

        {/* Tailles Vêtements */}
        {(isFieldVisible('tailleTshirt') || isFieldVisible('taillePantalon')) && (
          <div className="border-t border-dashed border-cordel-master-dark/10 pt-3.5 mt-1 flex flex-col gap-3.5 text-left">
            <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.clothingSizesHeading', "Tailles Vêtements")}
            </h5>
            
            <div className="grid grid-cols-2 gap-3">
              {isFieldVisible('tailleTshirt') && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-semibold text-cordel-master-dark">
                    T-shirt
                    {isFieldRequired('tailleTshirt') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <select
                    name="tailleTshirt"
                    value={formData.tailleTshirt}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input text-xs py-1.5 bg-cordel-bg-light"
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
                  <label className="text-[9px] uppercase font-semibold text-cordel-master-dark">
                    Pantalon
                    {isFieldRequired('taillePantalon') && <span className="text-red-500 font-bold ml-1">*</span>}
                  </label>
                  <select
                    name="taillePantalon"
                    value={formData.taillePantalon}
                    onChange={handleChange}
                    disabled={saving}
                    className="theme-input text-xs py-1.5 bg-cordel-bg-light"
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

        {/* Latéralité */}
        {isFieldVisible('lateralite') && (
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.laterality', "Latéralité (Gaucher/Droitier)")}
              {isFieldRequired('lateralite') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <select
              name="lateralite"
              value={formData.lateralite}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="droitier">{translate('userProfile.lateralityRight', "Droitier")}</option>
              <option value="gaucher">{translate('userProfile.lateralityLeft', "Gaucher")}</option>
            </select>
          </div>
        )}

        {/* Date de naissance */}
        {isFieldVisible('dateNaissance') && (
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              {translate('userProfile.birthdate', "Date de naissance")}
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
        )}

        {/* Attestation médicale / Santé */}
        {demanderAttestationSante && (
          <div className="border-t border-dashed border-cordel-master-dark/10 pt-3 flex flex-col gap-1 text-left">
            <label className="flex items-start gap-2 text-xs font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                name="aptitudeMedicale"
                checked={formData.aptitudeMedicale}
                onChange={(e) => setFormData(prev => ({ ...prev, aptitudeMedicale: e.target.checked }))}
                disabled={saving}
                className="accent-cordel-wood scale-105 mt-0.5"
              />
              <span className="leading-tight">
                {translate('userProfile.medicalCertCheckbox', "J'atteste sur l'honneur être en bonne condition physique pour la pratique de la percussion et/ou de la danse de maracatu.")}
                {isFieldRequired('aptitudeMedicale') && <span className="text-red-500 font-bold ml-1">*</span>}
              </span>
            </label>
          </div>
        )}

        {/* Confidentialité / Visibilité dans le Trombinoscope */}
        <div className="border-t border-dashed border-cordel-master-dark/15 pt-3 flex flex-col gap-3 text-left">
          <h5 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            🔒 Confidentialité (Trombinoscope)
          </h5>
          
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              name="afficherTelephone"
              checked={formData.afficherTelephone !== false}
              onChange={(e) => setFormData(prev => ({ ...prev, afficherTelephone: e.target.checked }))}
              disabled={saving}
              className="accent-cordel-wood scale-105"
            />
            <span>Afficher mon numéro de téléphone aux autres membres</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
            <input
              type="checkbox"
              name="afficherDateNaissance"
              checked={Boolean(formData.afficherDateNaissance)}
              onChange={(e) => setFormData(prev => ({ ...prev, afficherDateNaissance: e.target.checked }))}
              disabled={saving}
              className="accent-cordel-wood scale-105"
            />
            <span>Afficher ma date de naissance aux autres membres</span>
          </label>

          <div className="flex flex-col gap-1 mt-1">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Visibilité de mon adresse dans le Trombinoscope
            </label>
            <select
              name="visibiliteAdresse"
              value={formData.visibiliteAdresse || 'complete'}
              onChange={handleChange}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="complete">Adresse complète (Rue, code postal, ville)</option>
              <option value="ville">Uniquement la ville</option>
              <option value="masquee">Masquée (Ne rien afficher)</option>
            </select>
          </div>
        </div>

        {/* Actions buttons */}
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
            disabled={saving}
            className="flex-1 py-3 text-xs uppercase font-extrabold"
          >
            {saving ? translate('common.saving', "Envoi...") : translate('common.validate', "Valider")}
          </CordelButton>
        </div>
      </CordelCard>
    </form>
  );
}
