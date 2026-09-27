import React, { useState, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

/**
 * Tableau éditable des fiches d'atelier pour les pôles Lutherie, Costumerie et Pédagogie.
 * Offre une interface compacte et rapide de gestion des documents et livrets techniques.
 */
export default function WorkshopDocumentsTable({
  documents = [],
  categories = [],
  canWrite = false,
  onOpenAdd,
  onEditDoc,
  onDeleteDoc,
  onSelectDoc,
  onToggleViewMode
}) {
  const { t } = useTranslation();
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrage par catégorie et recherche textuelle
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      if (filterCategory !== 'all') {
        const catMatch = d.categoryId === filterCategory || d.categorie === filterCategory;
        if (!catMatch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titreMatch = (d.titre || '').toLowerCase().includes(q);
        const descMatch = (d.description || '').toLowerCase().includes(q);
        if (!titreMatch && !descMatch) return false;
      }
      return true;
    });
  }, [documents, filterCategory, searchQuery]);

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-4 flex flex-col gap-4 text-left select-none">
      {/* Barre d'outils supérieure */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Recherche */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une fiche ou patron..."
            className="theme-input text-xs font-semibold py-1 px-2.5 w-full sm:w-56 bg-cordel-bg-light"
          />

          {/* Filtre par thématique */}
          {categories.length > 1 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light cursor-pointer"
            >
              <option value="all">Toutes les thématiques</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className="px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded border border-cordel-master-dark/30 bg-cordel-bg hover:bg-white text-encre-noire cursor-pointer transition-all shadow-2xs"
              title="Basculer vers l'affichage visuel des cordes"
            >
              🪢 Vue Varal
            </button>
          )}

          {canWrite && (
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={onOpenAdd}
              className="text-[10px] px-3 py-1 font-black uppercase tracking-wider"
            >
              ➕ Nouvelle fiche / patron
            </CordelButton>
          )}
        </div>
      </div>

      {/* Tableau des fiches d'atelier */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-10 text-xs font-bold text-cordel-master-dark/60 border border-dashed border-cordel-master-dark/15 rounded bg-cordel-bg/30">
          Aucun livret technique ou fiche d'atelier trouvé.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-cordel-master-dark/15 text-xs">
            <thead>
              <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark text-left">
                <th className="px-3 py-2">Titre de la fiche / patron</th>
                <th className="px-3 py-2">Thématique & Tampon</th>
                <th className="px-3 py-2">Dernière modification</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cordel-master-dark/10 font-semibold">
              {filteredDocs.map((docItem) => {
                const dateStr = docItem.dateModification || docItem.updatedAt || docItem.dateAjout || docItem.createdAt;
                const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('fr-FR') : "—";
                const isVirtual = docItem.isVirtualWorkshopDoc === true;

                return (
                  <tr key={docItem.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-3 py-2 text-encre-noire">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {docItem.type === 'song' ? '🎵' : docItem.type === 'culture_fiche' ? '📖' : '📜'}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectDoc(docItem)}
                            className="text-left font-bold hover:underline hover:text-cordel-wood truncate max-w-sm cursor-pointer"
                          >
                            {docItem.titre || "Sans titre"}
                          </button>
                          {docItem.description && (
                            <span className="text-[10px] text-cordel-master-dark/70 truncate max-w-xs">
                              {docItem.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] tracking-wider border-dashed">
                        {docItem.categorie || docItem.categoryId || "Atelier"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-encre-noire/70 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectDoc(docItem)}
                        className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-cordel-bg border border-encre-noire shadow-2xs hover:bg-white cursor-pointer"
                      >
                        Consulter
                      </button>
                      {canWrite && !isVirtual && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditDoc(docItem)}
                            className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-amber-100 border border-amber-900 shadow-2xs hover:bg-amber-200 cursor-pointer"
                          >
                            Éditer
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
