import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloDrum, XiloMandacaru } from '../XiloIcons';

/**
 * InstrumentReminderBanner - Bannière d'invitation pédagogique sur le Dashboard
 * S'affiche lorsqu'un nouveau membre n'a pas encore choisi ou fait valider son instrument de prédilection.
 *
 * @param {Object} props
 * @param {Function} props.onNavigateToView Callback de navigation vers les différentes vues (ex: 'profil')
 */
export default function InstrumentReminderBanner({ onNavigateToView }) {
  return (
    <div className="w-full my-1 animate-fade-in select-none">
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-orange-500/15 border-2 border-dashed border-cordel-wood/40 p-3.5 sm:p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
        <div className="flex items-start gap-3 flex-1">
          <span className="p-2.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-cordel-wood border border-cordel-wood/40 shrink-0 shadow-sm mt-0.5 sm:mt-0">
            <XiloDrum size={26} />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-cactus font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <span>Roda de Maracatu</span>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-2 py-0.2 rotate-1">
                Période d'essai
              </span>
            </span>
            <p className="text-xs font-bold text-encre-noire leading-relaxed">
              🥁 Tu as fait tes premières séances d'essai ? Il est temps de choisir ton instrument de prédilection !
            </p>
          </div>
        </div>

        <CordelButton
          variant="ocre"
          useExtremeBorder={true}
          onClick={() => onNavigateToView && onNavigateToView('profil')}
          className="w-full sm:w-auto text-xs py-2 px-4 font-black uppercase tracking-wider shrink-0 shadow-md hover:scale-105 transition-transform"
        >
          🎵 Choisir mon instrument
        </CordelButton>
      </div>
    </div>
  );
}
