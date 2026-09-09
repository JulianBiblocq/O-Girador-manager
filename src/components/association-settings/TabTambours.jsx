import React from 'react';
import CordelCard from '../CordelCard';
import {
  DEFAULT_MARACATU_NOMENCLATURE,
  PRESET_NOMENCLATURES,
  MARACATU_ROLES_LIST,
  getVoiceLabel
} from '../../constants/nomenclature';

export default function TabTambours({
  formData,
  handleChange,
  saving,
}) {
  const maracatuNom = formData.nomenclature?.maracatu || formData.nomenclature || DEFAULT_MARACATU_NOMENCLATURE;
  const currentPresetId = formData.nomenclaturePreset || 'traditional_baque_virado';

  // Application immédiate d'un preset rapide
  const handleSelectPreset = (presetId) => {
    const preset = PRESET_NOMENCLATURES.find(p => p.id === presetId);
    if (!preset) return;

    const newNomenclature = {
      ...DEFAULT_MARACATU_NOMENCLATURE,
      ...preset.mapping
    };

    handleChange('nomenclaturePreset', presetId);
    handleChange('nomenclature.maracatu', newNomenclature);
  };

  // Modification d'un champ personnalisé
  const handleRoleChange = (roleKey, value) => {
    const updated = {
      ...maracatuNom,
      [roleKey]: value
    };

    // Vérifier si la nouvelle configuration correspond encore à un preset
    let matchingPresetId = 'custom';
    for (const preset of PRESET_NOMENCLATURES) {
      let isMatch = true;
      for (const [k, v] of Object.entries(preset.mapping)) {
        if ((updated[k] || DEFAULT_MARACATU_NOMENCLATURE[k]) !== v) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        matchingPresetId = preset.id;
        break;
      }
    }

    handleChange('nomenclaturePreset', matchingPresetId);
    handleChange(`nomenclature.maracatu.${roleKey}`, value);
  };

  // Réinitialisation complète aux valeurs par défaut
  const handleResetDefaults = () => {
    handleChange('nomenclaturePreset', 'traditional_baque_virado');
    handleChange('nomenclature.maracatu', { ...DEFAULT_MARACATU_NOMENCLATURE });
  };

  // Regroupement des rôles par catégorie
  const categories = [
    {
      title: '🥁 Fûts (Alfaias)',
      roles: MARACATU_ROLES_LIST.filter(r => r.category === 'Fût'),
      description: 'Désignation des registres de tambours graves, médiums et aigus.'
    },
    {
      title: '🥁 Caisses & Percussions de main',
      roles: MARACATU_ROLES_LIST.filter(r => r.category === 'Caisse' || r.category === 'Main'),
      description: 'Lignes rythmiques conductrices et percussions solistes.'
    },
    {
      title: '🔔 Métal & Secoués',
      roles: MARACATU_ROLES_LIST.filter(r => r.category === 'Métal' || r.category === 'Secoué'),
      description: 'Horloges temporelles et textures d’accompagnement.'
    },
    {
      title: '🗣️ Voix & Direction',
      roles: MARACATU_ROLES_LIST.filter(r => r.category === 'Signal' || r.category === 'Voix'),
      description: 'Commandement de la batucada / cortejo et chant lead/chœur.'
    }
  ];

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* 1. Carte d'introduction et principes */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3 mb-3">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>🥁</span>
              <span>Les Tambours : Nomenclature des Pupitres</span>
            </h3>
            <p className="text-[10px] text-cordel-master-dark/70 font-medium mt-0.5">
              Personnalisez les noms d'affichage de vos instruments pour toute votre structure (Séquenciad'Or, plans de scène, carnets d'aisance).
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={saving}
            className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded border border-cordel-master-dark/30 bg-white hover:bg-neutral-100 transition-all text-cordel-master-dark self-start sm:self-auto cursor-pointer"
            title="Rétablir les dénominations standards de Recife"
          >
            ↺ Rétablir par défaut
          </button>
        </div>

        {/* Note de garantie technique */}
        <div className="bg-[#fdfaf2] border-l-4 border-cordel-wood p-2.5 rounded-r text-[9.5px] text-cordel-master-dark/80 leading-relaxed">
          <p>
            <strong>Garantie audio & rétrocompatibilité :</strong> Le moteur audio Tone.js et vos historiques de plans de scène utilisent des identifiants techniques fixes (ex: <code>alfaia_grave</code>, <code>marcante</code>). Modifier ces intitulés n'altère en rien la lecture audio ni la conformité de vos bases existantes.
          </p>
        </div>
      </CordelCard>

      {/* 2. Présélections rapides */}
      <CordelCard variant="default" useExtremeBorder={false} className="py-4 px-5">
        <h4 className="text-[11px] uppercase font-black tracking-wider text-cordel-master-dark mb-2 flex items-center justify-between">
          <span>⚡ Présélections Rapides</span>
          {currentPresetId === 'custom' && (
            <span className="text-[8.5px] font-bold uppercase tracking-wider bg-cordel-wood/10 text-cordel-wood border border-cordel-wood/30 px-2 py-0.5 rounded-full">
              ✏️ Saisie personnalisée
            </span>
          )}
        </h4>
        <p className="text-[9.5px] text-cordel-master-dark/70 mb-3">
          Sélectionnez une tradition d'un simple clic pour pré-remplir les noms des pupitres :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_NOMENCLATURES.map((preset) => {
            const isSelected = currentPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                disabled={saving}
                className={`flex flex-col p-3 rounded-lg border-2 text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-cordel-wood bg-cordel-wood/10 shadow-[2px_2px_0px_0px_#181716] -translate-y-0.5'
                    : 'border-cordel-master-dark/20 bg-white hover:border-cordel-master-dark hover:bg-[#fdfaf2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] text-cordel-wood font-black">✓ Actif</span>
                  )}
                </div>
                <p className="text-[9px] text-cordel-master-dark/75 leading-tight mb-2">
                  {preset.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-auto pt-1 border-t border-dashed border-cordel-master-dark/15">
                  {Object.entries(preset.mapping).slice(0, 3).map(([roleKey, label]) => (
                    <span key={roleKey} className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-white/80 border border-cordel-master-dark/20 text-cordel-master-dark">
                      {label}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </CordelCard>

      {/* 3. Aperçu en direct dans les applications */}
      <CordelCard variant="default" useExtremeBorder={false} className="py-3 px-4 bg-[#fbf8f0]">
        <span className="text-[9.5px] font-black uppercase tracking-wider text-cordel-wood block mb-2">
          👀 Aperçu en direct sur scène et au séquenceur :
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-white p-2 rounded border border-dashed border-cordel-master-dark/20">
            <span className="text-[8px] font-black uppercase text-cordel-master-dark/50 block">Grave / Fond :</span>
            <span className="text-xs font-black text-cordel-wood">
              {getVoiceLabel('alfaia_grave', maracatuNom)}
            </span>
            <span className="text-[9px] text-cordel-master-dark/60 block font-semibold mt-0.5">
              Abréviation scène : <strong>{getVoiceLabel('alfaia_grave', maracatuNom, true)}</strong>
            </span>
          </div>

          <div className="bg-white p-2 rounded border border-dashed border-cordel-master-dark/20">
            <span className="text-[8px] font-black uppercase text-cordel-master-dark/50 block">Médium / Liaison :</span>
            <span className="text-xs font-black text-cordel-wood">
              {getVoiceLabel('alfaia_medio', maracatuNom)}
            </span>
            <span className="text-[9px] text-cordel-master-dark/60 block font-semibold mt-0.5">
              Abréviation scène : <strong>{getVoiceLabel('alfaia_medio', maracatuNom, true)}</strong>
            </span>
          </div>

          <div className="bg-white p-2 rounded border border-dashed border-cordel-master-dark/20">
            <span className="text-[8px] font-black uppercase text-cordel-master-dark/50 block">Aigu / Coupe :</span>
            <span className="text-xs font-black text-cordel-wood">
              {getVoiceLabel('alfaia_agudo', maracatuNom)}
            </span>
            <span className="text-[9px] text-cordel-master-dark/60 block font-semibold mt-0.5">
              Abréviation scène : <strong>{getVoiceLabel('alfaia_agudo', maracatuNom, true)}</strong>
            </span>
          </div>
        </div>
      </CordelCard>

      {/* 4. Formulaire granulaire de personnalisation */}
      {categories.map((cat, catIdx) => (
        <CordelCard key={catIdx} variant="default" useExtremeBorder={false} className="py-3.5 px-4">
          <div className="border-b border-dashed border-cordel-master-dark/15 pb-2 mb-3">
            <h4 className="text-[11px] uppercase font-black tracking-wider text-cordel-wood">
              {cat.title}
            </h4>
            <p className="text-[9px] text-cordel-master-dark/65 mt-0.5">
              {cat.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cat.roles.map((role) => {
              const currentValue = maracatuNom[role.key] !== undefined
                ? maracatuNom[role.key]
                : role.defaultLabel;

              return (
                <div key={role.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`role-input-${role.key}`}
                      className="text-[9.5px] font-extrabold uppercase text-cordel-master-dark"
                    >
                      {role.defaultLabel}
                    </label>
                    <span className="text-[7.5px] font-mono text-cordel-master-dark/40 uppercase">
                      {role.key}
                    </span>
                  </div>
                  <input
                    id={`role-input-${role.key}`}
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleRoleChange(role.key, e.target.value)}
                    disabled={saving}
                    placeholder={role.defaultLabel}
                    className="theme-input text-xs py-1.5 px-2 bg-white font-bold rounded border border-cordel-master-dark/30 focus:border-cordel-wood transition-colors"
                  />
                </div>
              );
            })}
          </div>
        </CordelCard>
      ))}
    </div>
  );
}
