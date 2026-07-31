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

  const isVitrinePublished = publicTheme.isPublished !== false;

  return (
    <div className="flex flex-col gap-5 text-left select-none">
      {/* Interrupteur Prioritaire : Statut Général de Publication (Mode Brouillon / En ligne) */}
      <CordelCard variant="default" className={`p-5 flex flex-col gap-3 border-2 transition-all ${
        isVitrinePublished 
          ? 'bg-emerald-50/80 border-emerald-700 shadow-md' 
          : 'bg-amber-50/90 border-amber-600 shadow-md'
      }`}>
        <div className="flex items-center justify-between border-b border-dashed border-stone-300 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">{isVitrinePublished ? '🟢' : '🟡'}</span>
            <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">
              Statut de Publication de la Vitrine Publique
            </h4>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border shadow-2xs ${
            isVitrinePublished
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-amber-600 text-white border-amber-700 animate-pulse'
          }`}>
            {isVitrinePublished ? '🌐 EN LIGNE (PUBLIÉ)' : '🚧 MODE BROUILLON (MASQUÉ)'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black uppercase tracking-wide text-stone-900 flex items-center gap-2">
              <span>🌍 Publier la vitrine (Accessible au public)</span>
            </label>
            <p className="text-[11px] text-stone-700 leading-relaxed max-w-xl">
              {isVitrinePublished
                ? "Votre site vitrine est actuellement en ligne et accessible par tous les visiteurs externes."
                : "Mode Brouillon actif : le grand public verra une page d'attente \"En construction\". Seuls les administrateurs connectés peuvent prévisualiser le site."}
            </p>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleToggleVisibility('isPublished', !isVitrinePublished)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-[6px_8px_5px_7px] border-2 shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              isVitrinePublished
                ? 'bg-red-800 text-white border-encre-noire hover:brightness-110'
                : 'bg-emerald-700 text-white border-encre-noire hover:brightness-110'
            }`}
          >
            <span>{isVitrinePublished ? '🔒 Passager en Mode Brouillon' : '🌍 Publier la Vitrine Maintenant'}</span>
          </button>
        </div>
      </CordelCard>

      <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-cordel-master-dark/30">
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
    </div>
  );
}
