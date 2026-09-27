import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Volet 2 : Tableau des procès-verbaux et comptes-rendus de réunions classés par date décroissante
 */
export default function ReunionsPvTable({
  reunions = [],
  canDelete = false,
  onOpenPv,
  onDeleteReunion
}) {
  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3">
      {reunions.length === 0 ? (
        <div className="text-center py-8 text-xs font-bold text-cordel-master-dark/60">
          Aucun compte-rendu ou procès-verbal enregistré.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs text-left">
            <thead>
              <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                <th className="px-3 py-2">Titre de la réunion</th>
                <th className="px-3 py-2">Date de tenue</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
              {reunions.map((reunion) => {
                const isPublished = reunion.compteRenduStatus === 'publie';
                const hasPdf = Boolean(reunion.compteRenduPdfUrl || reunion.fileUrl);

                return (
                  <tr key={reunion.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-3 py-2 text-encre-noire">
                      <span className="font-bold">{reunion.titre || "Réunion sans titre"}</span>
                      {reunion.lieu && <span className="text-[10px] text-encre-noire/60 block">📍 {reunion.lieu}</span>}
                    </td>
                    <td className="px-3 py-2 font-bold text-encre-noire whitespace-nowrap">
                      {reunion.date ? new Date(reunion.date).toLocaleDateString('fr-FR') : "Date inconnue"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded-full border ${
                        isPublished
                          ? 'bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40'
                          : 'bg-amber-100 text-amber-900 border-amber-800/40'
                      }`}>
                        {isPublished ? "✓ Validé" : "📝 En rédaction"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenPv(reunion)}
                        className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                        title="Ouvrir le compte-rendu dans Organizad'Or"
                      >
                        📜 Aperçu
                      </button>
                      {hasPdf && (
                        <button
                          type="button"
                          onClick={() => window.open(reunion.compteRenduPdfUrl || reunion.fileUrl, '_blank', 'noopener,noreferrer')}
                          className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 text-amber-950 border border-amber-800/50 shadow-2xs hover:bg-amber-200 cursor-pointer"
                          title="Télécharger le fichier PDF du PV"
                        >
                          ⬇️ PDF
                        </button>
                      )}
                      {canDelete && onDeleteReunion && (
                        <button
                          type="button"
                          onClick={() => onDeleteReunion(reunion)}
                          className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-red-900 border border-red-900 shadow-2xs hover:bg-red-200 cursor-pointer"
                          title="Supprimer ce compte-rendu"
                        >
                          🗑️
                        </button>
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
