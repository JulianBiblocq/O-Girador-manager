import React from 'react';
import { XiloTrombinoscope, XiloEye } from '../XiloIcons';

/**
 * OnboardingPublicBlock - Bloc 1 : Ton Profil Public (Trombinoscope)
 * Regroupe le Prénom, Nom, Surnom et Genre qui figureront dans la fiche publique.
 */
export default function OnboardingPublicBlock({
  formData,
  setFormData,
  handleChange,
  submitting,
  isFieldVisible,
  isFieldRequired,
  instrumentsDisponibles = [],
  nomAssociation = '',
  t
}) {
  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <div className="flex flex-col gap-3.5 border-2 border-dashed border-cordel-wood/30 p-3.5 rounded bg-cordel-bg-light/40">
      {/* Title with Xilo Icon */}
      <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-950/60 text-cordel-wood border border-cordel-wood/40">
          <XiloTrombinoscope size={20} />
        </span>
        <div>
          <h3 className="font-cactus font-bold text-sm uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            Ton Profil Public <span className="text-[10px] lowercase font-normal opacity-80">(Trombinoscope)</span>
          </h3>
          <p className="text-[10px] text-cordel-master-dark/80 font-medium">
            Ces informations de base te permettront d'être identifié(e) par la communauté.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* First Name Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('onboarding.firstName', 'Prénom')} <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="Ex: Clara"
            className="theme-input w-full font-bold text-xs disabled:opacity-50"
          />
        </div>

        {/* Last Name Input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('onboarding.lastName', 'Nom')} <span className="text-red-500 font-bold ml-0.5">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={submitting}
            placeholder="Ex: Dupont"
            className="theme-input w-full font-bold text-xs disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {/* Surnom Input */}
        {isFieldVisible('surnom') && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {translate('onboarding.surnom', 'Surnom dans le groupe')}
              {isFieldRequired('surnom') && <span className="text-red-500 font-bold ml-1">*</span>}
            </label>
            <input
              type="text"
              name="surnom"
              placeholder="Facultatif (ex: Ritinha)"
              value={formData.surnom}
              onChange={handleChange}
              disabled={submitting}
              className="theme-input w-full text-xs disabled:opacity-50"
            />
          </div>
        )}

        {/* Genre / Civilité Select */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {translate('onboarding.genre', 'Genre (pour accorder les termes)')}
          </label>
          <select
            name="genre"
            value={formData.genre}
            onChange={handleChange}
            disabled={submitting}
            className="theme-input w-full text-xs font-semibold bg-cordel-bg-light disabled:opacity-50"
          >
            <option value="femme">{translate('onboarding.genderFemale', 'Femme')}</option>
            <option value="homme">{translate('onboarding.genderMale', 'Homme')}</option>
            <option value="autre">{translate('onboarding.genderOther', 'Autre')}</option>
          </select>
        </div>
      </div>

      {/* Question d'ancienneté (Routage Ancien / Nouveau membre) */}
      <div className="p-3 rounded bg-amber-100/80 border border-cordel-wood/30 flex flex-col gap-1.5 text-left">
        <label className="text-[11px] font-black uppercase text-cordel-wood tracking-wider">
          Est-ce une réinscription à {nomAssociation || "l'association"} ? <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="flex items-center gap-5 text-xs font-bold mt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="estAncienMembre"
              checked={formData.estAncienMembre === true}
              onChange={() => setFormData(prev => ({ ...prev, estAncienMembre: true }))}
              disabled={submitting}
              className="w-4 h-4 accent-cordel-wood cursor-pointer"
            />
            <span>Oui (Ancien membre)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="radio"
              name="estAncienMembre"
              checked={formData.estAncienMembre === false}
              onChange={() => setFormData(prev => ({ ...prev, estAncienMembre: false }))}
              disabled={submitting}
              className="w-4 h-4 accent-cordel-wood cursor-pointer"
            />
            <span>Non (Nouveau membre)</span>
          </label>
        </div>
      </div>

      {/* Section Choix des Disciplines */}
      <div className="p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15 flex flex-col gap-2.5 text-left">
        <label className="text-[11px] font-black uppercase text-cordel-wood tracking-wider flex items-center gap-1.5">
          🎭 Choisis ta / tes discipline(s) <span className="text-red-500 font-bold">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Discipline Percussion */}
          <div 
            onClick={() => !submitting && setFormData(prev => ({ ...prev, pratiquePercussion: !prev.pratiquePercussion }))}
            className={`p-3 rounded border cursor-pointer transition-all flex items-start gap-2.5 ${formData.pratiquePercussion ? 'bg-amber-100/90 border-amber-500 shadow-xs' : 'bg-white/40 dark:bg-black/10 border-cordel-master-dark/15 opacity-80'}`}
          >
            <input
              type="checkbox"
              id="pratiquePercussion"
              name="pratiquePercussion"
              checked={Boolean(formData.pratiquePercussion)}
              onChange={(e) => setFormData(prev => ({ ...prev, pratiquePercussion: e.target.checked }))}
              disabled={submitting}
              className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0 mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-cactus font-bold text-xs uppercase text-cordel-wood flex items-center gap-1">
                🥁 Percussion
              </span>
              <span className="text-[10px] text-cordel-master-dark/80 font-medium">
                Participer aux cours et ateliers de percussions
              </span>
            </div>
          </div>

          {/* Discipline Danse */}
          <div 
            onClick={() => !submitting && setFormData(prev => ({ ...prev, pratiqueDanse: !prev.pratiqueDanse }))}
            className={`p-3 rounded border cursor-pointer transition-all flex items-start gap-2.5 ${formData.pratiqueDanse ? 'bg-amber-100/90 border-amber-500 shadow-xs' : 'bg-white/40 dark:bg-black/10 border-cordel-master-dark/15 opacity-80'}`}
          >
            <input
              type="checkbox"
              id="pratiqueDanse"
              name="pratiqueDanse"
              checked={Boolean(formData.pratiqueDanse)}
              onChange={(e) => setFormData(prev => ({ ...prev, pratiqueDanse: e.target.checked }))}
              disabled={submitting}
              className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0 mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-cactus font-bold text-xs uppercase text-cordel-wood flex items-center gap-1">
                💃 Danse
              </span>
              <span className="text-[10px] text-cordel-master-dark/80 font-medium">
                Participer aux cours et ateliers de danse
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Aiguillage conditionnel selon le profil Ancien / Nouveau */}
      {formData.estAncienMembre === false ? (
        /* Message d'information pour Nouveau Membre */
        <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 flex items-start gap-2 text-left">
          <span className="text-base shrink-0">💡</span>
          <div className="flex flex-col gap-0.5 text-xs text-cordel-master-dark font-medium leading-relaxed">
            <strong className="text-amber-900 dark:text-amber-200">Parcours Nouveau Membre :</strong>
            <span>
              En tant que nouveau membre, vous découvrirez l'ensemble des percussions lors de vos cours d'essai. Vous n'avez pas besoin de choisir un instrument spécifique aujourd'hui !
            </span>
          </div>
        </div>
      ) : (
        /* Formulaire Ancien Élève (Si Percussion est cochée) */
        formData.pratiquePercussion && (
          <div className="flex flex-col gap-3 p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15 text-left">
            <span className="font-cactus font-bold text-xs uppercase text-cordel-wood flex items-center gap-1.5">
              🥁 Orientation Percussions (Ancien Membre)
            </span>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-[10.5px] uppercase font-black tracking-wider text-cordel-wood">
                Souhaites-tu apprendre un nouvel instrument cette année ?
              </label>
              <select
                name="souhaiteChangerInstrument"
                value={formData.souhaiteChangerInstrument ? 'oui' : 'non'}
                onChange={(e) => {
                  const val = e.target.value === 'oui';
                  setFormData(prev => ({ ...prev, souhaiteChangerInstrument: val }));
                }}
                disabled={submitting}
                className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
              >
                <option value="non">Non, je souhaite conserver mon instrument actuel</option>
                <option value="oui">Oui, je souhaite formuler des vœux pour un nouvel instrument</option>
              </select>
            </div>

            {formData.souhaiteChangerInstrument && (
              <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-cordel-master-dark/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-80">
                      Vœu 1 (Nouveau choix principal)
                    </span>
                    <select
                      value={(formData.voeuxInstruments || [])[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...(prev.voeuxInstruments || [])];
                          updated[0] = val;
                          return { ...prev, voeuxInstruments: updated, voeuPrincipal: val };
                        });
                      }}
                      disabled={submitting}
                      className="theme-input w-full text-xs font-semibold bg-cordel-bg-light"
                    >
                      <option value="">-- Choisir --</option>
                      {(instrumentsDisponibles || [])
                        .filter(inst => !['danse', 'mestre', 'direction', 'chef de bateria'].includes(inst.toLowerCase().trim()))
                        .map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-80">
                      Vœu 2 (Nouveau choix secondaire)
                    </span>
                    <select
                      value={(formData.voeuxInstruments || [])[1] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...(prev.voeuxInstruments || [])];
                          updated[1] = val;
                          return { ...prev, voeuxInstruments: updated, voeuSecondaire: val };
                        });
                      }}
                      disabled={submitting}
                      className="theme-input w-full text-xs font-semibold bg-cordel-bg-light"
                    >
                      <option value="">-- Optionnel --</option>
                      {(instrumentsDisponibles || [])
                        .filter(inst => !['danse', 'mestre', 'direction', 'chef de bateria'].includes(inst.toLowerCase().trim()))
                        .map(inst => (
                          <option key={inst} value={inst}>{inst}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded border border-dashed border-amber-500/40 flex items-start gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="volontaireAncienInstrument"
                    name="volontaireAncienInstrument"
                    checked={Boolean(formData.volontaireAncienInstrument)}
                    onChange={(e) => setFormData(prev => ({ ...prev, volontaireAncienInstrument: e.target.checked, accordRenfortAncienInstrument: e.target.checked }))}
                    disabled={submitting}
                    className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0 mt-0.5"
                  />
                  <label htmlFor="volontaireAncienInstrument" className="font-bold text-encre-noire cursor-pointer select-none">
                    🤝 <strong>Renfort en prestation :</strong> J'accepte de jouer mon ancien instrument lors des prestations si le groupe en a besoin.
                  </label>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
