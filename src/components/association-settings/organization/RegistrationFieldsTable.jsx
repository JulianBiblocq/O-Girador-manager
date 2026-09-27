import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import { DEFAULT_FIELDS_CONFIG } from '../../../hooks/useAssociationSettings';

/**
 * Accordéon repliable du formulaire d'inscription et des champs de profil des adhérents.
 * Fermé par défaut avec comptage dynamique des champs actifs et obligatoires.
 */
export default function RegistrationFieldsTable({ formData = {}, handleChange, saving }) {
  const fieldsConfig = formData.fieldsConfig || DEFAULT_FIELDS_CONFIG;

  const handleToggleActive = (key) => {
    const current = fieldsConfig[key] || DEFAULT_FIELDS_CONFIG[key] || { enabled: true, isRequired: false };
    const updated = {
      ...fieldsConfig,
      [key]: {
        ...current,
        enabled: !current.enabled
      }
    };
    handleChange('fieldsConfig', updated);
  };

  const handleToggleRequired = (key) => {
    const current = fieldsConfig[key] || DEFAULT_FIELDS_CONFIG[key] || { enabled: true, isRequired: false };
    const updated = {
      ...fieldsConfig,
      [key]: {
        ...current,
        isRequired: !current.isRequired
      }
    };
    handleChange('fieldsConfig', updated);
  };

  const FIELDS_METADATA = [
    { key: 'telephone', label: '📞 Téléphone', desc: 'Contact mobile du membre' },
    { key: 'adresse', label: '🏠 Adresse physique', desc: 'Domicile / Ville' },
    { key: 'surnom', label: '🎭 Surnom / Nom de scène', desc: 'Apelido au sein de la Roda' },
    { key: 'tailleTshirt', label: '👕 Taille T-shirt', desc: 'Mensurations textile haut' },
    { key: 'taillePantalon', label: '👖 Taille Pantalon/Bas', desc: 'Mensurations costume bas' },
    { key: 'droitImage', label: '📷 Droit à l\'image', desc: 'Autorisation captations & diffusions' },
    { key: 'aptitudeMedicale', label: '🩺 Aptitude médicale', desc: 'Questionnaire QS-Sport / Décharge' },
    { key: 'lateralite', label: '✋ Latéralité', desc: 'Gaucher ou Droitier' },
    { key: 'dateNaissance', label: '🎂 Date de naissance', desc: 'Anniversaires & Catégories d\'âge' },
    { key: 'niveaux', label: '🎖️ Niveaux trombinoscope', desc: 'Affichage des badges sur l\'annuaire' }
  ];

  // Calcul dynamique des champs configurés (actifs) et obligatoires
  const activeCount = FIELDS_METADATA.filter(f => {
    const cfg = fieldsConfig[f.key] || DEFAULT_FIELDS_CONFIG[f.key] || { enabled: true };
    return cfg.enabled !== false;
  }).length;

  const requiredCount = FIELDS_METADATA.filter(f => {
    const cfg = fieldsConfig[f.key] || DEFAULT_FIELDS_CONFIG[f.key] || { enabled: true, isRequired: false };
    return cfg.enabled !== false && cfg.isRequired;
  }).length;

  return (
    <CordelAccordion
      title="Formulaire d'inscription & Profil membre"
      subtitle={`${activeCount} champs configurés (${requiredCount} obligatoire${requiredCount > 1 ? 's' : ''})`}
      icon="👥"
      defaultOpen={false}
      className="mb-4"
    >
      <div className="flex flex-col gap-2 pt-1 text-left">
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold mb-2">
          Définissez les informations collectées lors de l'adhésion et leur niveau d'exigence.
        </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-cordel-master-dark/20 text-[9px] uppercase font-black text-cordel-master-dark/70">
              <th className="py-2 px-2">Champ standard</th>
              <th className="py-2 px-2 text-center w-28">Activation</th>
              <th className="py-2 px-2 text-center w-28">Exigence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cordel-master-dark/10">
            {FIELDS_METADATA.map((f) => {
              const currentCfg = fieldsConfig[f.key] || DEFAULT_FIELDS_CONFIG[f.key] || { enabled: true, isRequired: false };
              const isEnabled = currentCfg.enabled !== false;
              const isRequired = Boolean(currentCfg.isRequired);

              return (
                <tr key={f.key} className="hover:bg-cordel-bg-light/40 transition-colors">
                  <td className="py-2.5 px-2">
                    <span className="font-extrabold text-encre-noire block text-[11px]">{f.label}</span>
                    <span className="text-[9px] text-stone-500 font-medium block">{f.desc}</span>
                  </td>

                  {/* Toggle Actif / Inactif */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(f.key)}
                      disabled={saving}
                      className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                        isEnabled
                          ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs hover:brightness-110'
                          : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                      }`}
                    >
                      {isEnabled ? '✓ Actif' : '✕ Inactif'}
                    </button>
                  </td>

                  {/* Toggle Obligatoire / Facultatif */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRequired(f.key)}
                      disabled={saving || !isEnabled}
                      className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
                        !isEnabled 
                          ? 'opacity-30 cursor-not-allowed bg-stone-100 text-stone-400' 
                          : isRequired
                            ? 'bg-[var(--color-cordel-rouge,#8b2a1a)] text-white shadow-2xs hover:brightness-110'
                            : 'bg-stone-100 text-stone-700 border border-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {isRequired ? '★ Obligatoire' : 'Facultatif'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </CordelAccordion>
  );
}
