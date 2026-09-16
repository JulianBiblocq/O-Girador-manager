/**
 * Bandeau d'avertissement et de contrôle du Mode Démo
 * Affiche l'indication de l'association vitrine « Maracatu Na Chuva »
 * et fournit les boutons « Réinitialiser » et « Quitter ».
 */

import React, { useState } from 'react';
import { resetDemoData, exitDemoMode } from '../../demo/demoManager';
import CordelButton from '../CordelButton';

export default function DemoTopBanner({ isVitrine }) {
  const [resetting, setResetting] = useState(false);

  // Détection automatique du mode vitrine si non transmis explicitement
  const currentIsVitrine = isVitrine !== undefined 
    ? isVitrine 
    : (typeof window !== 'undefined' && (
        new URLSearchParams(window.location.search).get('app') === 'mostrador' ||
        window.location.pathname.includes('/vitrine') ||
        window.location.pathname.includes('/mostrador')
      ));

  const handleReset = () => {
    if (resetting) return;
    setResetting(true);
    resetDemoData();
    setTimeout(() => {
      setResetting(false);
      window.location.reload();
    }, 300);
  };

  const handleExit = () => {
    exitDemoMode();
  };

  const handleToggleView = () => {
    if (currentIsVitrine) {
      window.location.href = '/demo?app=organizador';
    } else {
      window.location.href = '/demo?app=mostrador';
    }
  };

  return (
    <aside
      role="status"
      aria-label="Mode Démonstration"
      className="sticky top-0 z-50 w-full bg-[#f4ecd8] border-b-2 border-encre-noire text-encre-noire px-3 py-1.5 shadow-xs select-none transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
        {/* Message d'information démo */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none">🥁</span>
          <p className="font-bold text-[11px] sm:text-xs truncate">
            <strong className="text-[var(--color-cordel-ocre,#c05621)]">Démo Maracatu Na Chuva</strong> — {currentIsVitrine ? "Vitrine Publique (Mostrador)" : "Manager Associatif (Organizador)"}
          </p>
        </div>

        {/* Boutons d'action : Bascule Vitrine/Manager, Réinitialiser & Quitter */}
        <div className="flex items-center gap-2 shrink-0">
          <CordelButton
            variant="vert"
            size="small"
            onClick={handleToggleView}
            className="text-[10px] sm:text-[10.5px] py-1 px-2.5 font-bold uppercase tracking-wider cursor-pointer shadow-xs"
            title={currentIsVitrine ? "Retourner au tableau de bord du Manager" : "Visualiser la Vitrine Publique One-Page"}
          >
            {currentIsVitrine ? "🛠️ Espace Manager" : "🌍 Voir le site public"}
          </CordelButton>

          <CordelButton
            variant="ocre"
            size="small"
            onClick={handleReset}
            disabled={resetting}
            className="text-[10px] sm:text-[10.5px] py-1 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
            title="Réinitialiser toutes les données de démonstration à leur état d'origine"
          >
            {resetting ? "🔄 Réinitialisation..." : "🔄 Réinitialiser"}
          </CordelButton>

          <CordelButton
            variant="rouge"
            size="small"
            onClick={handleExit}
            className="text-[10px] sm:text-[10.5px] py-1 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
            title="Quitter le mode démo et revenir à la page de connexion habituelle"
          >
            🚪 Quitter
          </CordelButton>
        </div>
      </div>
    </aside>
  );
}
