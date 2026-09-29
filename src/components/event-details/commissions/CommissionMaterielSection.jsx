import React, { useState } from 'react';

const STATUS_MATERIEL_OPTIONS = [
  { value: 'a_trouver', label: 'À trouver', color: 'bg-amber-100 text-amber-900 border-[var(--color-cordel-ocre)]' },
  { value: 'reserve', label: 'Réservé', color: 'bg-blue-100 text-blue-900 border-blue-400' },
  { value: 'au_local', label: 'Au local', color: 'bg-emerald-100 text-emerald-900 border-[var(--color-cordel-vert)]' }
];

/**
 * Sous-composant du tiroir "Matériel & Outillage"
 * Checklist logistique des besoins matériels.
 */
export default function CommissionMaterielSection({
  besoins = [],
  onChangeBesoins
}) {
  const [article, setArticle] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [apportePar, setApportePar] = useState('');
  const [status, setStatus] = useState('a_trouver');

  const handleAddBesoin = (e) => {
    e.preventDefault();
    if (!article.trim()) return;

    const newBesoin = {
      id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      article: article.trim(),
      quantite: Number(quantite) || 1,
      apportePar: apportePar.trim() || '',
      status: status || 'a_trouver'
    };

    onChangeBesoins([...besoins, newBesoin]);
    setArticle('');
    setQuantite(1);
    setApportePar('');
    setStatus('a_trouver');
  };

  const handleStatusChange = (id, newStatus) => {
    onChangeBesoins(besoins.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
  };

  const handleDeleteBesoin = (id) => {
    onChangeBesoins(besoins.filter((b) => b.id !== id));
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg/50 rounded-lg border border-encre-noire/20 text-xs">
      <div className="flex items-center justify-between">
        <h4 className="font-black uppercase text-encre-noire flex items-center gap-1.5">
          <span>📦</span> Matériel & Outillage ({besoins.length} article{besoins.length > 1 ? 's' : ''})
        </h4>
      </div>

      {/* Liste des matériels */}
      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
        {besoins.length === 0 ? (
          <p className="text-[11px] text-stone-500 italic p-2 text-center">
            Aucun besoin matériel répertorié.
          </p>
        ) : (
          besoins.map((item) => {
            const currentStatus = STATUS_MATERIEL_OPTIONS.find((s) => s.value === item.status) || STATUS_MATERIEL_OPTIONS[0];

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded border border-encre-noire/20 bg-white"
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-encre-noire">
                      {item.quantite > 1 ? `(${item.quantite}x) ` : ''}{item.article}
                    </span>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${currentStatus.color}`}
                    >
                      {STATUS_MATERIEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {item.apportePar && (
                    <span className="text-[10px] text-stone-500 mt-0.5">
                      Prévu par : {item.apportePar}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteBesoin(item.id)}
                  className="text-stone-400 hover:text-[var(--color-cordel-rouge)] p-1 text-xs"
                  title="Supprimer cet article"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Formulaire ajout matériel */}
      <form onSubmit={handleAddBesoin} className="flex flex-wrap items-center gap-2 pt-2 border-t border-encre-noire/10">
        <input
          type="text"
          placeholder="Article (ex: Câble XLR 10m, Tonnelle)..."
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          className="flex-1 min-w-[140px] px-2 py-1.5 rounded border border-encre-noire/30 bg-white text-xs"
        />
        <input
          type="number"
          min="1"
          max="100"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          className="w-14 px-1.5 py-1.5 rounded border border-encre-noire/30 bg-white text-xs"
          title="Quantité"
        />
        <input
          type="text"
          placeholder="Apporté par..."
          value={apportePar}
          onChange={(e) => setApportePar(e.target.value)}
          className="w-28 px-2 py-1.5 rounded border border-encre-noire/30 bg-white text-xs"
        />
        <button
          type="submit"
          disabled={!article.trim()}
          className="px-3 py-1.5 font-black rounded border border-encre-noire bg-[var(--color-cordel-vert)] text-white hover:opacity-90 disabled:opacity-40"
        >
          + Article
        </button>
      </form>
    </div>
  );
}
