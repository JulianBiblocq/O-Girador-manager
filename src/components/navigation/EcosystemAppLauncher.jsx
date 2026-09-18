import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../../firebase';
import { launchCrossApp } from '../../utils/crossAppAuth';
import { getVitrineUrl } from '../../utils/urlUtils';
import { isDemoMode } from '../../demo/demoManager';

/**
 * Icône SVG Cordel 3x3 représentant le "Gaufrier" applicatif
 * dans un style gravure sur bois / xilogravure.
 */
export function CordelGridIcon({ size = 16, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="4.5" height="4.5" rx="1" />
      <rect x="9.75" y="3" width="4.5" height="4.5" rx="1" />
      <rect x="16.5" y="3" width="4.5" height="4.5" rx="1" />
      <rect x="3" y="9.75" width="4.5" height="4.5" rx="1" />
      <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1" />
      <rect x="16.5" y="9.75" width="4.5" height="4.5" rx="1" />
      <rect x="3" y="16.5" width="4.5" height="4.5" rx="1" />
      <rect x="9.75" y="16.5" width="4.5" height="4.5" rx="1" />
      <rect x="16.5" y="16.5" width="4.5" height="4.5" rx="1" />
    </svg>
  );
}

/**
 * Lanceur applicatif Écosystème O Girador sous forme de bouton gaufrier compact.
 * Déploie un popover Cordel sécurisé (z-[100]) listant les applications de la suite
 * avec gestion du SSO transparent (launchCrossApp) et des autorisations (ecosystemAccess).
 * 
 * @param {Object} props
 * @param {Object} [props.urls] - URLs spécifiques du locataire
 * @param {Object} [props.associationData] - Données de l'association (dont ecosystemAccess)
 * @param {string} [props.className] - Classes de conteneur additionnelles
 */
export default function EcosystemAppLauncher({ urls, associationData, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [launchingAppKey, setLaunchingAppKey] = useState(null);
  const popoverRef = useRef(null);

  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const ecosystemAccess = associationData?.ecosystemAccess || {
    vitrine: true,
    sequenciador: true,
    dancador: true,
    hub: true
  };

  const isDemo = isDemoMode();

  const apps = [
    {
      key: 'vitrine',
      url: getVitrineUrl(urls, associationData),
      img: '/ecosystem/logo-mostrador.png',
      label: 'Mostrador',
      subtitle: 'Site vitrine public',
      isPublic: true
    },
    {
      key: 'sequenciador',
      url: isLocal ? 'http://localhost:5174' : 'https://sequenciador.o-girador.com',
      img: '/ecosystem/favicon.svg',
      label: 'Sequenciador',
      subtitle: 'Partitions & Rythmes',
      isPublic: false
    },
    {
      key: 'dancador',
      url: isLocal ? 'http://localhost:5175' : 'https://dancador.o-girador.com',
      img: '/ecosystem/dancador-logo.png',
      label: 'Dancador',
      subtitle: 'Atelier chorégraphique',
      isPublic: false
    },
    {
      key: 'hub',
      url: isLocal ? 'http://localhost:5176' : 'https://o-girador.com',
      img: '/ecosystem/hub-logo.png',
      label: 'Orquestrador',
      subtitle: 'Portail central O Girador',
      isPublic: false
    }
  ];

  // Fermeture au clic extérieur et touche Échap
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLaunchApp = async (e, app) => {
    e.preventDefault();
    if (launchingAppKey) return;

    // Vitrine publique ou non connecté : ouverture directe en nouvel onglet
    if (app.isPublic || !auth.currentUser) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
      return;
    }

    setLaunchingAppKey(app.key);
    try {
      await launchCrossApp(app.url, { appLabel: app.label });
      setIsOpen(false);
    } finally {
      setLaunchingAppKey(null);
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Bouton déclencheur Gaufrier avec cible tactile minimale 40x40 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 min-w-[38px] min-h-[38px] border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center transition-all select-none ${
          isOpen
            ? 'bg-amber-200 text-encre-noire'
            : 'bg-cordel-bg hover:bg-white text-encre-noire'
        }`}
        title="Applications de l'écosystème O Girador"
        aria-label="Applications de l'écosystème"
        aria-expanded={isOpen}
      >
        <CordelGridIcon size={16} />
      </button>

      {/* Popover Écosystème (z-[100] élevé pour survoler les conteneurs et bannières) */}
      {isOpen && (
        <>
          {/* Arrière-plan semi-transparent tactile pour fermeture facile sur petit écran */}
          <div
            className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-[99] sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div 
            className="absolute right-0 mt-2 w-72 sm:w-80 p-3 bg-cordel-bg border-2 border-encre-noire rounded-[8px_12px_9px_11px] shadow-[3px_3px_0px_0px_#181716] z-[100] text-encre-noire animate-fadeIn select-none"
            role="dialog"
            aria-label="Menu des applications"
          >
            {/* En-tête du Popover */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-dashed border-cordel-master-dark/20">
              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-cordel-wood">
                <CordelGridIcon size={13} />
                <span>Suite O Girador</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-black text-cordel-master-dark hover:text-cordel-wood p-1 cursor-pointer"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Grille des applications */}
            <div className="flex flex-col gap-1.5">
              {apps.map(app => {
                const isEnabled = ecosystemAccess[app.key] !== false;
                const isLaunching = launchingAppKey === app.key;

                if (!isEnabled) {
                  return (
                    <div
                      key={app.key}
                      className="p-2 border border-dashed border-encre-noire/20 rounded-[5px_7px_4px_6px] bg-neutral-100/60 opacity-50 grayscale cursor-not-allowed flex items-center justify-between"
                      title="Module non activé pour votre association"
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={app.img} alt={app.label} className="w-6 h-6 object-contain shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-extrabold text-[11px] leading-tight text-neutral-600">{app.label}</span>
                          <span className="text-[9px] text-neutral-500">{app.subtitle}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 bg-neutral-200/80 px-1.5 py-0.5 rounded">
                        Inactif
                      </span>
                    </div>
                  );
                }

                return (
                  <a
                    key={app.key}
                    href={app.url}
                    onClick={(e) => handleLaunchApp(e, app)}
                    className={`p-2 border-2 border-encre-noire/25 hover:border-encre-noire rounded-[5px_7px_4px_6px] bg-white hover:bg-amber-50/60 transition-all flex items-center justify-between cursor-pointer group shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                      isLaunching ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={app.img} alt={app.label} className="w-6 h-6 object-contain shrink-0 group-hover:scale-105 transition-transform" />
                      <div className="flex flex-col text-left truncate">
                        <span className="font-extrabold text-[11px] leading-tight text-encre-noire group-hover:text-cordel-wood truncate">
                          {app.label}
                        </span>
                        <span className="text-[9px] text-cordel-master-dark/70 truncate">
                          {app.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 ml-2">
                      {isLaunching ? (
                        <div className="w-4 h-4 border-2 border-cordel-wood border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-xs text-cordel-wood font-black opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                          ↗
                        </span>
                      )}
                    </div>
                  </a>
                );
              })}

              {/* Raccourci Démo si actif */}
              {isDemo && (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/demo?app=mostrador';
                  }}
                  className="mt-1 p-2 border-2 border-encre-noire bg-[var(--color-cordel-vert,#2d6a4f)] text-white rounded-[5px_7px_4px_6px] shadow-[1px_1px_0px_0px_#181716] hover:brightness-110 active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider"
                >
                  <span>🌍 Voir le site public (Démo)</span>
                  <span>↗</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
