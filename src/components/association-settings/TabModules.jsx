import React from 'react';
import CordelCard from '../CordelCard';
import { DEFAULT_ENABLED_MODULES } from '../../hooks/useAssociationSettings';

const MODULES_CONFIG = [
  {
    key: 'tresorerie',
    icon: '🪙',
    title: 'Trésorerie & Finances',
    desc: 'Activer le pôle financier : tableau de bord, cotisations, dépenses et frais kilométriques.'
  },
  {
    key: 'logistique',
    icon: '📦',
    title: 'Logistique & Parc d\'Instruments',
    desc: 'Activer la gestion de l\'inventaire des instruments et l\'état du matériel.'
  },
  {
    key: 'commandes',
    icon: '🛒',
    title: 'Boutique & Commandes',
    desc: 'Activer la gestion des commandes de matériel et achats pour la troupe.'
  },
  {
    key: 'vestiaire',
    icon: '👗',
    title: 'Vestiaire & Costumes',
    desc: 'Activer le suivi du stock de costumes, mensurations et l\'atelier couture.'
  },
  {
    key: 'covoiturage',
    icon: '🚗',
    title: 'Covoiturage Événements',
    desc: 'Activer les fonctionnalités de covoiturage et la gestion des trajets sur l\'agenda.'
  },
  {
    key: 'studioSocial',
    icon: '📢',
    title: 'Studio Social & Varal Médias',
    desc: 'Activer les outils de publication sociale et le gestionnaire de Varal.'
  },
  {
    key: 'reunions',
    icon: '📝',
    title: 'Gestion des Réunions',
    desc: 'Activer les ordres du jour, compte-rendus et suivis de réunions.'
  },
  {
    key: 'forum',
    icon: '📣',
    title: 'Porte-voix (Forum & Discussions)',
    desc: 'Activer le forum de la troupe, les salons de discussion et la messagerie.'
  },
  {
    key: 'mestre',
    icon: '🥁',
    title: 'Espace Mestre & Direction Artistique',
    desc: 'Activer le séquenceur, le plan de scène et l\'espace pédagogique du Mestre.'
  }
];

export default function TabModules({
  formData,
  handleChange,
  saving,
  t
}) {
  const enabledModules = formData.enabledModules || DEFAULT_ENABLED_MODULES;

  const handleToggleModule = (moduleKey, isChecked) => {
    const updated = {
      ...enabledModules,
      [moduleKey]: isChecked
    };
    handleChange('enabledModules', updated);
  };

  const handleActivateAll = () => {
    const allActive = {};
    MODULES_CONFIG.forEach(m => { allActive[m.key] = true; });
    handleChange('enabledModules', allActive);
  };

  const handleDeactivateAll = () => {
    const allInactive = {};
    MODULES_CONFIG.forEach(m => { allInactive[m.key] = false; });
    handleChange('enabledModules', allInactive);
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood text-left flex items-center gap-2">
          <span>🧩</span> Activation des Modules (Marque Blanche)
        </h3>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleActivateAll}
            className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood hover:underline cursor-pointer select-none"
          >
            ⚡ Tout activer
          </button>
          <span className="text-[9px] opacity-40">|</span>
          <button
            type="button"
            onClick={handleDeactivateAll}
            className="text-[9px] font-bold uppercase tracking-wider text-neutral-600 hover:underline cursor-pointer select-none"
          >
            🔌 Tout désactiver
          </button>
        </div>
      </div>

      <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed mb-4 text-left">
        Activez ou désactivez les fonctionnalités selon les besoins de votre association. Lorsqu'un module est désactivé, ses onglets et boutons associés disparaissent totalement pour <strong>l'ensemble des membres (y compris les administrateurs)</strong>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
        {MODULES_CONFIG.map((mod) => {
          const isEnabled = enabledModules[mod.key] !== false;

          return (
            <div 
              key={mod.key}
              className={`p-3.5 border-2 rounded-[6px_10px_6px_8px] flex flex-col justify-between transition-all ${
                isEnabled 
                  ? 'border-encre-noire bg-cordel-bg-light shadow-[2.5px_2.5px_0px_0px_#181716]' 
                  : 'border-dashed border-cordel-master-dark/30 bg-neutral-100/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg select-none">{mod.icon}</span>
                  <div>
                    <h4 className="text-xs font-black text-encre-noire flex items-center gap-1.5">
                      {mod.title}
                    </h4>
                    <p className="text-[9px] text-cordel-master-dark/70 font-medium mt-0.5 leading-tight">
                      {mod.desc}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => handleToggleModule(mod.key, e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--cordel-wood)]"></div>
                </label>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-2 border-t border-dashed border-cordel-master-dark/15 flex justify-between items-center text-[8.5px] font-extrabold uppercase tracking-wider">
                <span className="opacity-60">Statut :</span>
                {isEnabled ? (
                  <span className="text-green-800 bg-green-100 px-2 py-0.5 rounded border border-green-700/30">
                    🟢 Actif (Visible)
                  </span>
                ) : (
                  <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-700/30">
                    🔴 Désactivé (Masqué)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Online Presence Status Settings */}
      <div className="mt-6 pt-4 border-t-2 border-dashed border-cordel-master-dark/20 text-left">
        <h4 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-2.5 flex items-center gap-2">
          <span>🟢</span> Présence en Ligne des Membres
        </h4>
        <div className={`p-4 border-2 rounded-[6px_10px_6px_8px] flex items-center justify-between transition-all ${
          formData.activerPresenceEnLigne !== false
            ? 'border-encre-noire bg-cordel-bg-light shadow-[2.5px_2.5px_0px_0px_#181716]'
            : 'border-dashed border-cordel-master-dark/30 bg-neutral-100/50 opacity-60'
        }`}>
          <div className="text-left pr-4">
            <h5 className="text-xs font-black text-encre-noire flex items-center gap-2">
              Afficher le statut en ligne des membres (Pastille verte)
            </h5>
            <p className="text-[9px] text-cordel-master-dark/70 font-medium mt-0.5 leading-relaxed">
              Affiche ou masque les pastilles vertes de présence en ligne sur le Trombinoscope, le Forum et la barre supérieure pour l'ensemble des membres de l'association.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
            <input
              type="checkbox"
              checked={formData.activerPresenceEnLigne !== false}
              onChange={(e) => handleChange('activerPresenceEnLigne', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--cordel-wood)]"></div>
          </label>
        </div>
      </div>
    </CordelCard>
  );
}
