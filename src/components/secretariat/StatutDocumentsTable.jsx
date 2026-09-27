import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Volet 1 : Tableau compact des documents officiels permanents & statutaires
 */
export default function StatutDocumentsTable({
  docs = [],
  canWrite = false,
  onViewDoc,
  onEditDoc,
  onDeleteDoc
}) {
  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-3">
      {docs.length === 0 ? (
        <div className="text-center py-8 text-xs font-bold text-cordel-master-dark/60">
          Aucun document statutaire versé pour le moment.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs text-left">
            <thead>
              <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                <th className="px-3 py-2">Nom du document</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Date de mise à jour</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
              {docs.map((docItem) => {
                const dateVal = docItem.updatedAt || docItem.dateModification || docItem.dateAjout || docItem.createdAt;
                const formattedDate = dateVal ? new Date(dateVal).toLocaleDateString('fr-FR') : "—";
                const isPdf = docItem.fileUrl?.toLowerCase().includes('.pdf') || docItem.typeDoc === 'pdf' || docItem.format === 'pdf';

                return (
                  <tr key={docItem.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-3 py-2 font-bold text-encre-noire flex items-center gap-2">
                      <span>📄</span>
                      <span className="truncate max-w-xs">{docItem.titre || "Sans titre"}</span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-cordel-wood font-bold">
                      <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 text-stone-700 text-[8.5px] uppercase font-mono">
                        {isPdf ? 'PDF' : (docItem.typeDoc || 'Doc')}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-encre-noire/70">
                      {formattedDate}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                      {docItem.fileUrl && (
                        <button
                          type="button"
                          onClick={() => onViewDoc(docItem)}
                          className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                        >
                          👁️ Aperçu
                        </button>
                      )}
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditDoc(docItem)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 border border-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                          >
                            ✏️ Remplacer
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDoc(docItem)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-red-100 text-red-900 border border-red-900 shadow-2xs hover:bg-red-200 cursor-pointer"
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
