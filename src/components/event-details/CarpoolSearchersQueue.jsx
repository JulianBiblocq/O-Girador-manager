import React from 'react';
import { useTranslation } from '../LanguageContext';

/**
 * File d'attente des membres en recherche de place de covoiturage ou de transport d'instrument.
 * Intègre la case à cocher pour l'impératif de retour direct et les badges de statut.
 *
 * @param {Object} props
 */
export default function CarpoolSearchersQueue({
  searchers = [],
  currentUser,
  submittingCovoit = false,
  doitRentrerDirectSearch,
  setDoitRentrerDirectSearch,
  handleChercherPlace,
  handleAnnulerCherchePlace
}) {
  const { t } = useTranslation();
  const isUserSearching = (searchers || []).some(p => p.uid === currentUser?.uid);

  return (
    <div className="mt-5 pt-4 border-t border-dashed border-cordel-master-dark/15 text-left">
      <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5">
        📋 {t('agenda.carpoolSearchSeats') || "Membres en recherche de place"}
      </h5>

      {!isUserSearching ? (
        <div className="flex flex-col gap-2 mb-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] font-bold text-amber-950 bg-amber-50 p-2 rounded border border-amber-200">
            <input
              type="checkbox"
              checked={doitRentrerDirectSearch}
              onChange={(e) => setDoitRentrerDirectSearch(e.target.checked)}
              disabled={submittingCovoit}
              className="accent-amber-700 w-4 h-4 cursor-pointer"
            />
            {/* ⚡ Retour direct après le jeu (impératif horaire) */}
            <span>⚡ {t('agenda.directReturnImperative') || "Retour direct après le jeu (impératif horaire)"}</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-1.5">
            <button
              type="button"
              disabled={submittingCovoit}
              onClick={() => handleChercherPlace({ cherchePassager: true, chercheInstrument: false, doitRentrerDirect: doitRentrerDirectSearch })}
              className="text-[9px] font-black uppercase bg-cordel-bg-light hover:bg-cordel-hover border border-encre-noire px-2.5 py-1.5 rounded shadow-xs cursor-pointer flex-1 text-center"
            >
              🚗 {t('agenda.carpoolSearchSeats') || "Place passager"}
            </button>
            <button
              type="button"
              disabled={submittingCovoit}
              onClick={() => handleChercherPlace({ cherchePassager: false, chercheInstrument: true, doitRentrerDirect: doitRentrerDirectSearch })}
              className="text-[9px] font-black uppercase bg-cordel-bg-light hover:bg-cordel-hover border border-encre-noire px-2.5 py-1.5 rounded shadow-xs cursor-pointer flex-1 text-center"
            >
              🥁 Place instrument seul
            </button>
            <button
              type="button"
              disabled={submittingCovoit}
              onClick={() => handleChercherPlace({ cherchePassager: true, chercheInstrument: true, doitRentrerDirect: doitRentrerDirectSearch })}
              className="text-[9px] font-black uppercase bg-cordel-bg-light hover:bg-cordel-hover border border-encre-noire px-2.5 py-1.5 rounded shadow-xs cursor-pointer flex-1 text-center"
            >
              🚗🥁 {t('agenda.filterBoth') || "Les deux"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <button
            type="button"
            disabled={submittingCovoit}
            onClick={handleAnnulerCherchePlace}
            className="text-[9px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 border border-encre-noire px-2 py-1 rounded cursor-pointer"
          >
            Annuler ma recherche
          </button>
        </div>
      )}

      {(searchers || []).length === 0 ? (
        <p className="text-[11px] italic opacity-60">{t('agenda.noCarpoolSearchers') || "Aucun membre en recherche de place actuellement."}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {(searchers || []).map((p) => {
            const icons = [(p.cherchePassager !== false) ? '🚗' : null, p.chercheInstrument ? '🥁' : null].filter(Boolean).join('');
            return (
              <span
                key={p.uid}
                className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed flex items-center gap-1"
              >
                <span>⏳{icons} {p.nom}</span>
                {p.doitRentrerDirect && (
                  <span className="text-[8px] font-black text-amber-900 bg-amber-200 border border-amber-400 px-1 py-0.2 rounded ml-1">
                    ⚡ Impératif retour direct
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
