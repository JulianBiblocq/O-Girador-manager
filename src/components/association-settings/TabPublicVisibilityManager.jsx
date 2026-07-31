import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Composant d'administration permettant de contrôler dynamiquement la visibilité 
 * (activation / désactivation) des différentes sections du site vitrine public.
 * 
 * @param {Object} props
 * @param {Object} props.formData - Données globales des paramètres de l'association.
 * @param {Function} props.handleChange - Callback de mise à jour des paramètres.
 * @param {boolean} props.saving - État de sauvegarde en cours.
 */
export default function TabPublicVisibilityManager({ formData, handleChange, saving }) {
  const publicTheme = formData.publicTheme || {};

  /**
   * Modifie un drapeau de visibilité dans publicTheme.
   * 
   * @param {string} flagKey - Clé du drapeau (ex: 'afficherVieAssociative', 'afficherRecrutement')
   * @param {boolean} value - Nouvelle valeur (activé / désactivé)
   */
  const handleToggleVisibility = (flagKey, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [flagKey]: value
    });
  };

  const sectionsConfig = [
    {
      key: 'afficherVieAssociative',
      title: '🌿 Section Vie Associative & Organisation',
      description: 'Affiche la présentation du quotidien, des répétitions et des ateliers.',
      defaultValue: publicTheme.afficherVieAssociative !== false
    },
    {
      key: 'afficherRecrutement',
      title: '📣 Section Recrutement & Formules d\'Adhésion',
      description: 'Affiche les cartes de formules (Danse, Percu...) et les boutons d\'inscription.',
      defaultValue: publicTheme.afficherRecrutement !== false
    },
    {
      key: 'afficherGalerie',
      title: '📸 Section Galerie Photos & Carrousel',
      description: 'Affiche le carrousel d\'images de vos prestations scéniques et défilés.',
      defaultValue: publicTheme.afficherGalerie !== false
    },
    {
      key: 'afficherAgenda',
      title: '📅 Section Agenda Public & Prestations',
      description: 'Affiche la liste des prochains événements ouverts au public.',
      defaultValue: publicTheme.afficherAgenda !== false
    },
    {
      key: 'enableOrganizerSection',
      title: '🎪 Section Espace Organisateur & Fiche Technique',
      description: 'Affiche la fiche technique, les formats de prestation et documents pro.',
      defaultValue: publicTheme.enableOrganizerSection !== false
    },
    {
      key: 'afficherNewsletter',
      title: '📬 Section Infolettre & Inscription Email',
      description: 'Affiche le formulaire de collecte des adresses e-mails pour la newsletter.',
      defaultValue: publicTheme.afficherNewsletter !== false
    }
  ];

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30 select-none">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood flex items-center gap-2">
          <span>🎛️ Sélecteur de Visibilité des Sections Vitrine</span>
        </h4>
        <span className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
          Marque Blanche & SaaS
        </span>
      </div>

      <p className="text-xs text-stone-600 font-medium leading-relaxed">
        Cochez ou décochez les interrupteurs ci-dessous pour choisir librement quelles sections apparaissent sur votre vitrine publique.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {sectionsConfig.map((sec) => {
          const isChecked = sec.defaultValue;

          return (
            <div 
              key={sec.key}
              className={`p-3.5 rounded-[4px_6px_3px_5px] border-2 transition-all flex items-start gap-3 cursor-pointer ${
                isChecked
                  ? 'bg-emerald-50/60 border-emerald-700/40 shadow-xs'
                  : 'bg-stone-50 border-stone-300 opacity-70 hover:opacity-100'
              }`}
              onClick={() => !saving && handleToggleVisibility(sec.key, !isChecked)}
            >
              <input
                type="checkbox"
                id={`toggle-${sec.key}`}
                checked={isChecked}
                onChange={(e) => handleToggleVisibility(sec.key, e.target.checked)}
                disabled={saving}
                className="mt-0.5 w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)] shrink-0"
              />
              <div className="flex flex-col gap-1 text-left">
                <label 
                  htmlFor={`toggle-${sec.key}`}
                  className="text-xs font-extrabold uppercase tracking-wider text-stone-900 cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{sec.title}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isChecked ? 'bg-emerald-700 text-white font-bold' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {isChecked ? 'ACTIVÉE' : 'MASQUÉE'}
                  </span>
                </label>
                <p className="text-[11px] text-stone-600 leading-tight">
                  {sec.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
