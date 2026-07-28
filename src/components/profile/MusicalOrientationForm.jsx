import React from 'react';
import { filterPublicPercussionInstruments } from '../../utils/tagUtils';

const DEFAULT_INSTRUMENTS = [
  "Alfaia Marcante",
  "Alfaia Meião",
  "Alfaia Repique",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Timbal",
  "Chant"
];

/**
 * Composant MusicalOrientationForm
 * Rend la section "Pratique de la Danse & Orientation Percussions" dans la modification du profil.
 */
export default function MusicalOrientationForm({
  formData,
  handleChange,
  saving,
  instrumentsDisponibles = DEFAULT_INSTRUMENTS,
  isAncien = false,
  t = (key, fallback) => fallback
}) {
  const rawList = Array.isArray(instrumentsDisponibles) && instrumentsDisponibles.length > 0
    ? instrumentsDisponibles
    : DEFAULT_INSTRUMENTS;

  // Filtrage automatique des percussions publiques (exclut Danse, Mestre, Direction)
  const instrumentsList = filterPublicPercussionInstruments(rawList);

  const souhaiteChanger = Boolean(formData.souhaiteChangerInstrument);

  return (
    <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 flex flex-col gap-3.5 text-left">
      <h5 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
        🥁 Orientation Musicale & Danse
      </h5>

      {/* Section Choix des Disciplines */}
      <div className="p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15 flex flex-col gap-2 text-left">
        <label className="text-[11px] font-black uppercase text-cordel-wood tracking-wider">
          🎭 Disciplines pratiquées
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Percussion */}
          <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-cordel-wood/30 flex items-center justify-between gap-2">
            <span className="font-cactus font-bold text-xs uppercase text-cordel-wood flex items-center gap-1.5">
              🥁 Percussion
            </span>
            <input
              type="checkbox"
              name="pratiquePercussion"
              checked={formData.pratiquePercussion !== undefined ? Boolean(formData.pratiquePercussion) : true}
              onChange={(e) => handleChange({ target: { name: 'pratiquePercussion', type: 'checkbox', checked: e.target.checked, value: e.target.checked } })}
              disabled={saving}
              className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0"
            />
          </div>

          {/* Danse */}
          <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-cordel-wood/30 flex items-center justify-between gap-2">
            <span className="font-cactus font-bold text-xs uppercase text-cordel-wood flex items-center gap-1.5">
              💃 Danse
            </span>
            <input
              type="checkbox"
              name="pratiqueDanse"
              checked={Boolean(formData.pratiqueDanse)}
              onChange={(e) => handleChange({ target: { name: 'pratiqueDanse', type: 'checkbox', checked: e.target.checked, value: e.target.checked } })}
              disabled={saving}
              className="w-4 h-4 accent-cordel-wood cursor-pointer shrink-0"
            />
          </div>
        </div>
      </div>

      {isAncien ? (
        /* Parcours Ancien Élève */
        <div className="flex flex-col gap-3 p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15">
          {/* Instrument actuel */}
          <div className="bg-white/50 dark:bg-black/10 p-2.5 rounded border border-dashed border-cordel-master-dark/20 flex flex-col gap-1 text-xs text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-cordel-wood uppercase text-[10px] tracking-wider block">
                Mon instrument actuel :
              </span>
              {(formData.instrumentPrincipal && formData.instrumentPrincipal !== 'En attente') ? (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 font-bold">
                  Attribué
                </span>
              ) : (
                <span className="theme-stamp-badge theme-stamp-badge-secondary text-[9px] px-2 py-0.5 font-bold">
                  À préciser
                </span>
              )}
            </div>

            <select
              name="instrumentPrincipal"
              value={formData.instrumentPrincipal || formData.instrument || ''}
              onChange={(e) => {
                const val = e.target.value;
                handleChange({ target: { name: 'instrumentPrincipal', value: val } });
                handleChange({ target: { name: 'instrument', value: val } });
              }}
              disabled={saving}
              className="theme-input w-full text-xs font-bold bg-cordel-bg-light mt-1"
            >
              <option value="">-- Sélectionner mon instrument actuel --</option>
              {instrumentsList.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Question : Souhaites-tu apprendre un nouvel instrument cette année ? */}
          <div className="flex flex-col gap-1 text-left mt-1">
            <label className="text-[10.5px] uppercase font-black tracking-wider text-cordel-wood">
              Souhaites-tu apprendre un nouvel instrument cette année ?
            </label>
            <select
              name="souhaiteChangerInstrument"
              value={souhaiteChanger ? 'oui' : 'non'}
              onChange={(e) => {
                const val = e.target.value === 'oui';
                handleChange({
                  target: {
                    name: 'souhaiteChangerInstrument',
                    type: 'checkbox',
                    checked: val,
                    value: val
                  }
                });
              }}
              disabled={saving}
              className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
            >
              <option value="non">Non, je conserve mon instrument actuel</option>
              <option value="oui">Oui, je souhaite formuler des vœux pour un nouvel instrument</option>
            </select>
          </div>

          {/* Si OUI : Sélection des vœux + case à cocher de dépannage sur ancien instrument */}
          {souhaiteChanger && (
            <div className="flex flex-col gap-3 pt-2 border-t border-dashed border-cordel-master-dark/20">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Nouveau vœu principal (Choix 1) <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  name="voeuPrincipal"
                  value={formData.voeuPrincipal || ''}
                  onChange={(e) => {
                    handleChange(e);
                    const val = e.target.value;
                    const updated = [val, formData.voeuSecondaire].filter(Boolean);
                    handleChange({ target: { name: 'voeuxInstruments', value: updated } });
                  }}
                  disabled={saving}
                  className="theme-input w-full text-xs font-semibold bg-cordel-bg-light"
                >
                  <option value="">-- Choisir un nouvel instrument principal --</option>
                  {instrumentsList.map(inst => (
                    <option key={`ancien-p-${inst}`} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark opacity-80">
                  Nouveau vœu secondaire (Choix 2 optionnel)
                </label>
                <select
                  name="voeuSecondaire"
                  value={formData.voeuSecondaire || ''}
                  onChange={(e) => {
                    handleChange(e);
                    const val = e.target.value;
                    const updated = [formData.voeuPrincipal, val].filter(Boolean);
                    handleChange({ target: { name: 'voeuxInstruments', value: updated } });
                  }}
                  disabled={saving}
                  className="theme-input w-full text-xs font-semibold bg-cordel-bg-light"
                >
                  <option value="">-- Pas de choix secondaire --</option>
                  {instrumentsList.map(inst => (
                    <option key={`ancien-s-${inst}`} value={inst} disabled={inst === formData.voeuPrincipal}>
                      {inst} {inst === formData.voeuPrincipal ? '(Déjà choisi)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Case à cocher obligatoire de dépannage sur l'ancien instrument */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded border border-dashed border-amber-500/40 flex flex-col gap-1.5 text-left text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer font-bold text-encre-noire select-none">
                  <input
                    type="checkbox"
                    name="volontaireAncienInstrument"
                    checked={Boolean(formData.volontaireAncienInstrument)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleChange({
                        target: {
                          name: 'volontaireAncienInstrument',
                          type: 'checkbox',
                          checked: checked,
                          value: checked
                        }
                      });
                      handleChange({
                        target: {
                          name: 'accordRenfortAncienInstrument',
                          type: 'checkbox',
                          checked: checked,
                          value: checked
                        }
                      });
                    }}
                    disabled={saving}
                    className="w-4 h-4 accent-cordel-wood shrink-0 mt-0.5"
                  />
                  <span>
                    🤝 <strong>Renfort en prestation :</strong> J'accepte de jouer mon ancien instrument (<strong>{formData.instrumentPrincipal || formData.instrument}</strong>) lors des prestations si le groupe en a besoin.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Parcours Nouvel Élève */
        <div className="flex flex-col gap-3 p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15">
          <p className="text-xs font-black text-cordel-wood uppercase tracking-wider">
            🥁 Vœux d'Instruments (Nouvel Élève)
          </p>
          <p className="text-[10px] text-cordel-master-dark/80 font-medium">
            Sélectionnez entre 2 et 3 percussions par ordre de préférence. Votre attribution définitive sera validée par le Mestre.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
            {['Vœu 1 (Préféré)', 'Vœu 2 (Second choix)', 'Vœu 3 (Troisième choix)'].map((label, idx) => {
              const cleanVoeux = Array.isArray(formData.voeuxInstruments) && formData.voeuxInstruments.length > 0
                ? formData.voeuxInstruments
                : [formData.voeuPrincipal, formData.voeuSecondaire, formData.voeuTertiaire].filter(Boolean);
              const currentVal = cleanVoeux[idx] || '';

              return (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-80">
                    {label} {idx < 2 && <span className="text-red-500">*</span>}
                  </span>
                  <select
                    value={currentVal}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      const updated = [...cleanVoeux];
                      updated[idx] = nextVal;
                      handleChange({ target: { name: 'voeuxInstruments', value: updated } });
                      if (idx === 0) handleChange({ target: { name: 'voeuPrincipal', value: nextVal } });
                      if (idx === 1) handleChange({ target: { name: 'voeuSecondaire', value: nextVal } });
                      if (idx === 2) handleChange({ target: { name: 'voeuTertiaire', value: nextVal } });
                    }}
                    disabled={saving}
                    className="theme-input w-full text-xs font-semibold bg-cordel-bg-light disabled:opacity-50"
                  >
                    <option value="">-- Choisir --</option>
                    {instrumentsList.map((inst) => (
                      <option 
                        key={inst} 
                        value={inst}
                        disabled={cleanVoeux.some((v, i) => i !== idx && v === inst)}
                      >
                        {inst}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
