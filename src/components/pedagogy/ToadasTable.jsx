import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Tableau A du Pôle Pédagogie : Toadas (Chants & Paroles)
 * Colonnes : Titre, Rythme / Baque, Nation / École, Actions (Éditer les 8 points, Supprimer, Consulter).
 */
export default function ToadasTable({
  toadas = [],
  canWrite = false,
  onSelectDoc,
  onEditDoc,
  onDeleteDoc
}) {
  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3">
      {toadas.length === 0 ? (
        <div className="text-center py-8 text-xs font-bold text-cordel-master-dark/60">
          Aucune Toada enregistrée dans le répertoire pour le moment.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs text-left">
            <thead>
              <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                <th className="px-3 py-2">Titre du chant</th>
                <th className="px-3 py-2">Rythme / Baque</th>
                <th className="px-3 py-2">Nation / École</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
              {toadas.map((song) => {
                const rythme = song.rythme || song.baque || song.toadaData?.rythme || "—";
                const nation = song.nation || song.ecole || song.toadaData?.nation || "Traditionnel";

                return (
                  <tr key={song.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-3 py-2 font-bold text-encre-noire flex items-center gap-2">
                      <span className="text-sm">🎵</span>
                      <button
                        type="button"
                        onClick={() => onSelectDoc && onSelectDoc(song)}
                        className="text-left font-bold hover:underline hover:text-cordel-wood truncate max-w-xs cursor-pointer"
                      >
                        {song.titre || "Toada sans titre"}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-950 border border-amber-300 text-[8.5px] font-bold uppercase">
                        {rythme}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10.5px] text-cordel-master-dark/80 whitespace-nowrap">
                      {nation}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectDoc && onSelectDoc(song)}
                        className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                        title="Consulter le livret de la toada"
                      >
                        👁️ Paroles
                      </button>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditDoc && onEditDoc(song)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 border border-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                            title="Éditer les paroles et les 8 points pédagogiques"
                          >
                            ✏️ Éditer les 8 points
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDoc && onDeleteDoc(song)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-red-900 border border-red-900 shadow-2xs hover:bg-red-200 cursor-pointer"
                            title="Supprimer la toada"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CordelCard>
  );
}
