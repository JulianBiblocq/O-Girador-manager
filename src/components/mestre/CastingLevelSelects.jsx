import React from 'react';
import {
  sanitizeCastingCategories,
  normalizeCastingLevelValue
} from '../../utils/categoryUtils';

/**
 * Sélecteur de niveau pour les instruments (Principal, 2e instrument, Apprentissage saison).
 */
export function CastingInstrumentLevelSelect({
  value,
  onChange,
  disabled = false,
  customCategories = [],
  placeholderLabel = '- Niv. -',
  className = 'theme-input text-[10px] py-1 bg-white max-w-[80px]'
}) {
  const categories = sanitizeCastingCategories(customCategories);
  const resolvedValue = normalizeCastingLevelValue(value, categories, false);

  return (
    <select
      value={resolvedValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className}
    >
      <option value="aucun">{placeholderLabel}</option>
      {categories.map((catName) => (
        <option key={`inst-lvl-${catName}`} value={catName}>
          {catName}
        </option>
      ))}
    </select>
  );
}

/**
 * Sélecteur de la colonne « DANSE & NIVEAU » du Casting (strictement 3 choix : Non inscrit(e), 💃 La relève, 💃 La référence).
 */
export function CastingDanceLevelSelect({
  member,
  onChange,
  disabled = false,
  customCategories = [],
  notEnrolledLabel = 'Non inscrit(e)'
}) {
  const categories = sanitizeCastingCategories(customCategories);
  const isEnrolledInDance = Boolean(
    member?.pratiqueDanse || (member?.niveauDanse && member.niveauDanse !== 'aucun')
  );
  const resolvedValue = isEnrolledInDance
    ? normalizeCastingLevelValue(member?.niveauDanse, categories, true)
    : 'aucun';

  return (
    <select
      value={resolvedValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`theme-input text-[10px] py-1 bg-white font-bold ${
        isEnrolledInDance
          ? 'text-amber-900 border-amber-400 bg-amber-50/50'
          : 'text-cordel-master-dark/60 border-cordel-master-dark/20'
      }`}
    >
      <option value="aucun">{notEnrolledLabel}</option>
      {categories.map((catName) => (
        <option key={`danse-lvl-${catName}`} value={catName}>
          💃 {catName}
        </option>
      ))}
    </select>
  );
}
