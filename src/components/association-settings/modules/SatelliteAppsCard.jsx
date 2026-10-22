import React from 'react';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import { DEFAULT_ECOSYSTEM_ACCESS } from '../../../hooks/useAssociationSettings';

const APPS_CONFIG = [
  { key: 'sequenciador', name: "Séquenciad'Or", icon: '🎛️', desc: "Séquenceur rythmique & métronome interactif" },
  { key: 'dancador', name: "Dançad'Or", icon: '💃', desc: "Simulateur de chorégraphies & pas de danse" },
  { key: 'cantador', name: "Cantad'Or", icon: '🎤', desc: "Carnet de chants & prompteur de toadas" },
  { key: 'vitrine', name: "Mostrad'Or", icon: '🌐', desc: "Site vitrine public de l'association" }
];

/**
 * Carte des Applications Satellites de l'Écosystème O Girador et options transversales.
 */
export default function SatelliteAppsCard({ formData = {}, handleChange, saving }) {
  const { t } = useTranslation();
  const ecosystemAccess = formData.ecosystemAccess || DEFAULT_ECOSYSTEM_ACCESS;

  const handleToggleEcosystem = (key, isChecked) => {
    handleChange('ecosystemAccess', { ...ecosystemAccess, [key]: isChecked });
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 mb-4">
      <div className="mb-3 pb-2 border-b border-dashed border-cordel-master-dark/20 text-left">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
          🚀 {t('settings.modules.modulesSwitchesTable.ecosystemApps') || 'Applications Satellites & Options Transversales'}
        </h3>
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
          Activez l'accès direct aux outils compagnons de l'écosystème O Girador pour vos adhérents.
        </p>
      </div>

      {/* Grille des applications satellites */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-left mb-3">
        {APPS_CONFIG.map(app => {
          const isEnabled = ecosystemAccess[app.key] !== false;
          return (
            <div 
              key={app.key}
              className={`p-2.5 rounded border transition-all flex items-center justify-between ${
                isEnabled ? 'bg-white border-encre-noire/30 shadow-2xs' : 'bg-stone-100 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 pr-1">
                <span className="text-lg">{app.icon}</span>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-encre-noire">{app.name}</span>
                  <span className="text-[8px] text-stone-500 font-medium leading-tight">{app.desc}</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => handleToggleEcosystem(app.key, e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)] shrink-0"
              />
            </div>
          );
        })}
      </div>

      {/* Option transversale : Statut de présence en ligne */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/15 text-left">
        <label className="flex items-center justify-between p-2 rounded bg-white border border-stone-200 cursor-pointer">
          <div className="flex items-center gap-2">
            <span>🟢</span>
            <span className="text-[10.5px] font-bold text-stone-700">
              {t('settings.modules.modulesSwitchesTable.pastillesDeStatutEnLigne') || 'Pastilles de statut en ligne (visibilité des membres connectés)'}
            </span>
          </div>
          <input
            type="checkbox"
            checked={formData.activerPresenceEnLigne !== false}
            onChange={(e) => handleChange('activerPresenceEnLigne', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
          />
        </label>
      </div>
    </CordelCard>
  );
}
