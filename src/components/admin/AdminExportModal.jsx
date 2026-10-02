import React from 'react';
import CordelButton from '../CordelButton';

/**
 * Modale de configuration et d'export CSV pour l'Annuaire des membres.
 * Conforme à la règle anti-monolithe et au standard Excel France (BOM UTF-8, séparateur point-virgule).
 */
export default function AdminExportModal({
  isOpen,
  onClose,
  columnsConfig,
  checkedFields,
  handleCheckboxChange,
  handleToggleCategory,
  onExport,
  membersCount = 0
}) {
  if (!isOpen) return null;

  const totalSelectedColumns = Object.values(checkedFields).filter(Boolean).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-encre-noire/70 backdrop-blur-xs animate-fade-in outline-none select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[8px] bg-cordel-bg border-2 border-encre-noire shadow-[6px_6px_0px_0px_#181716] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête de la modale */}
        <div className="flex-shrink-0 p-4 border-b-2 border-dashed border-cordel-master-dark/25 flex justify-between items-center bg-cordel-bg">
          <div>
            <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase">
              📥 Exporter les données de l'annuaire
            </h3>
            <p className="text-[10px] text-cordel-master-dark/70 font-semibold mt-0.5">
              Sélectionnez les colonnes à inclure dans l'export CSV Excel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer p-1"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Corps défilable : Sélection des colonnes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(columnsConfig).map(([catKey, category]) => {
              const catFields = category.fields;
              const checkedCount = catFields.filter(f => checkedFields[f.key]).length;
              const allChecked = checkedCount === catFields.length;

              return (
                <div 
                  key={catKey} 
                  className="border border-dashed border-cordel-master-dark/20 p-3 rounded-[4px_6px_3px_5px] bg-white/40 shadow-xs"
                >
                  <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-dashed border-cordel-master-dark/15">
                    <span className="font-extrabold text-xs text-encre-noire">
                      {category.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(catKey, allChecked)}
                      className="text-[9px] font-black uppercase tracking-wider text-cordel-wood hover:opacity-80 transition-opacity cursor-pointer border border-dashed border-cordel-wood/30 px-1.5 py-0.5 rounded bg-white"
                    >
                      {allChecked ? "Aucun" : "Tous"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {catFields.map(field => (
                      <label 
                        key={field.key} 
                        className="flex items-center gap-2 text-xs font-semibold text-encre-noire cursor-pointer select-none py-0.5 hover:translate-x-[1px] transition-transform"
                      >
                        <input
                          type="checkbox"
                          checked={checkedFields[field.key] || false}
                          onChange={() => handleCheckboxChange(field.key)}
                          className="w-3.5 h-3.5 border-2 border-encre-noire text-cordel-wood rounded-sm focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-[11px]">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note technique de compatibilité Excel France */}
          <div className="p-3 bg-cordel-bg-light border border-dashed border-cordel-master-dark/20 rounded text-[10px] text-cordel-master-dark/80 flex flex-col gap-1">
            <span className="font-bold text-encre-noire">ℹ️ Format du fichier généré :</span>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>• Séparateur : <strong>point-virgule (;)</strong></span>
              <span>• Encodage : <strong>UTF-8 avec BOM</strong> (accents préservés)</span>
              <span>• Colonnes sélectionnées : <strong>{totalSelectedColumns}</strong></span>
              <span>• Adhérents inclus : <strong>{membersCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Pied de page : Actions */}
        <div className="flex-shrink-0 p-4 border-t-2 border-dashed border-cordel-master-dark/25 flex justify-end gap-3 bg-cordel-bg">
          <CordelButton variant="default" onClick={onClose} className="px-4 py-2 text-xs">
            Annuler
          </CordelButton>
          <CordelButton
            variant="vert"
            onClick={() => {
              onExport();
              onClose();
            }}
            disabled={totalSelectedColumns === 0}
            className="px-5 py-2 text-xs font-black uppercase tracking-wider"
          >
            📥 Télécharger le CSV ({membersCount})
          </CordelButton>
        </div>
      </div>
    </div>
  );
}
