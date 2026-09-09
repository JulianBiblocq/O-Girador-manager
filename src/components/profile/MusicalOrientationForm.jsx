import React, { useMemo } from 'react';
import { filterPublicPercussionInstruments, computePupitresList } from '../../utils/tagUtils';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';

const DEFAULT_INSTRUMENTS = [
  "Alfaia",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Chant"
];

/**
 * Composant MusicalOrientationForm
 * Rend la section "Pratique de la Danse & Orientation Percussions" avec niveaux granulaires.
 * Gère les pupitres consolidés (ex: Agbê & Mineiro) en conformité avec la configuration d'association.
 */
export default function MusicalOrientationForm({
  formData,
  setFormData,
  handleChange,
  saving,
  instrumentsDisponibles = DEFAULT_INSTRUMENTS,
  linkedInstruments = [],
  isAncien = false,
  t = (key, fallback) => fallback
}) {
  const rawList = Array.isArray(instrumentsDisponibles) && instrumentsDisponibles.length > 0
    ? instrumentsDisponibles
    : DEFAULT_INSTRUMENTS;

  // Filtrage automatique des percussions publiques (exclut Danse, Mestre, Direction)
  const instrumentsList = filterPublicPercussionInstruments(rawList);

  // Calcul dynamique des pupitres consolidés
  const pupitresList = useMemo(() => {
    return computePupitresList(instrumentsList, linkedInstruments);
  }, [instrumentsList, linkedInstruments]);

  const customCategories = DEFAULT_CUSTOM_CATEGORIES;
  const niveauxOptions = customCategories && customCategories.length > 0 ? customCategories : ['debutant', 'confirme'];

  const getPupitreConstituents = (pupitreName) => {
    const group = (linkedInstruments || []).find(g => {
      const gName = g.name && g.name.trim() ? g.name.trim() : (Array.isArray(g.instruments) ? g.instruments.join(' + ') : '');
      return gName.toLowerCase() === (pupitreName || '').toLowerCase();
    });
    if (group && Array.isArray(group.instruments) && group.instruments.length > 0) {
      return group.instruments;
    }
    return [pupitreName];
  };

  const isPupitreChecked = (pupitreName) => {
    const currentJoues = formData?.instrumentsJoues || [];
    if (currentJoues.includes(pupitreName)) return true;
    const constituents = getPupitreConstituents(pupitreName);
    return constituents.some(inst => currentJoues.includes(inst));
  };

  const handlePupitreToggle = (pupitreName) => {
    if (!setFormData) return;
    const constituents = getPupitreConstituents(pupitreName);
    setFormData(prev => {
      const prevInsts = prev.instrumentsJoues || [];
      const prevNiveaux = prev.niveauxParInstrument || {};
      const currentlyChecked = isPupitreChecked(pupitreName);

      if (currentlyChecked) {
        const nextInsts = prevInsts.filter(i => i !== pupitreName && !constituents.includes(i));
        const nextNiveaux = { ...prevNiveaux };
        delete nextNiveaux[pupitreName];
        constituents.forEach(c => delete nextNiveaux[c]);
        return {
          ...prev,
          instrumentsJoues: nextInsts,
          niveauxParInstrument: nextNiveaux
        };
      } else {
        const nextInsts = prevInsts.filter(i => i !== pupitreName && !constituents.includes(i));
        nextInsts.push(pupitreName);
        const existingNiveau = prevNiveaux[pupitreName] || constituents.map(c => prevNiveaux[c]).find(Boolean) || 'debutant';
        return {
          ...prev,
          instrumentsJoues: nextInsts,
          niveauxParInstrument: {
            ...prevNiveaux,
            [pupitreName]: existingNiveau
          }
        };
      }
    });
  };

  const handleNiveauPupitreChange = (pupitreName, niveau) => {
    if (!setFormData) return;
    const constituents = getPupitreConstituents(pupitreName);
    setFormData(prev => {
      const nextNiveaux = { ...(prev.niveauxParInstrument || {}) };
      nextNiveaux[pupitreName] = niveau;
      constituents.forEach(c => {
        if (c !== pupitreName) delete nextNiveaux[c];
      });
      return {
        ...prev,
        niveauxParInstrument: nextNiveaux
      };
    });
  };

  const activeSelectedPupitres = pupitresList.filter(isPupitreChecked);

  return (
    <div className="border-t border-dashed border-cordel-master-dark/15 pt-3.5 flex flex-col gap-3.5 text-left">
      <h5 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
        🥁 Pupitres Joués & Niveaux
      </h5>

      {/* Section Choix des Disciplines */}
      <div className="p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15 flex flex-col gap-2 text-left">
        <label className="text-[11px] font-black uppercase text-cordel-wood tracking-wider">
          🎭 Disciplines pratiquées
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Percussion */}
          <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/30 border border-cordel-wood/30 flex items-center justify-between gap-2">
            <span className="font-heading font-bold text-xs uppercase text-cordel-wood flex items-center gap-1.5">
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
            <span className="font-heading font-bold text-xs uppercase text-cordel-wood flex items-center gap-1.5">
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

      <div className="flex flex-col gap-3 p-3 rounded bg-white/60 dark:bg-black/20 border border-cordel-master-dark/15">
        <label className="text-[11px] font-black uppercase text-cordel-wood tracking-wider">
          Pupitre(s) joué(s)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-cordel-bg-light/60 border border-encre-noire/20 rounded">
          {pupitresList.map((pup) => (
            <label key={pup} className="flex items-center gap-2 text-xs cursor-pointer select-none py-1 px-1.5 hover:bg-black/5 rounded">
              <input
                type="checkbox"
                checked={isPupitreChecked(pup)}
                onChange={() => handlePupitreToggle(pup)}
                disabled={saving}
                className="rounded text-cordel-wood focus:ring-0 cursor-pointer"
              />
              <span>{pup}</span>
            </label>
          ))}
        </div>
      </div>

      {activeSelectedPupitres.length > 0 && (
        <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/30 border border-cordel-wood/30 flex flex-col gap-2 text-left">
          <label className="text-[11px] font-black uppercase text-cordel-wood tracking-wider">
            Niveaux par pupitre joué
          </label>
          <div className="grid grid-cols-1 gap-2 mt-1">
            {activeSelectedPupitres.map((pup) => {
              const currentNiveau = formData?.niveauxParInstrument?.[pup] ||
                getPupitreConstituents(pup).map(c => formData?.niveauxParInstrument?.[c]).find(Boolean) ||
                'debutant';
              return (
                <div key={pup} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white/50 dark:bg-black/10 rounded border border-cordel-master-dark/10">
                  <span className="text-xs font-bold text-cordel-wood">{pup}</span>
                  <select
                    value={currentNiveau}
                    onChange={(e) => handleNiveauPupitreChange(pup, e.target.value)}
                    disabled={saving}
                    className="theme-input text-[11px] font-bold py-1.5 px-2 w-full sm:w-40 bg-white"
                  >
                    <option value="debutant">Débutant</option>
                    {niveauxOptions.filter(cat => cat.toLowerCase() !== 'debutant').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
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
