import React from 'react';

/**
 * Modale d'aide et de légende pour la syntaxe des Toadas (< 85 lignes).
 * Détaille la convention 1 paragraphe = 1 mesure, +, /, *soliste*, [Section] et [Accord].
 */
export default function ToadaLegendModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="flex flex-col gap-3 max-w-lg w-full bg-cordel-bg p-4 rounded-[6px_8px_5px_7px] border-2 border-cordel-master-dark text-encre-noire shadow-2xl animate-fade-in text-left">
        {/* En-tête de la modale */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">ℹ️</span>
            <h3 className="font-title text-base font-black uppercase text-cordel-wood">
              Légende de la Notation Toada
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-stone-200 hover:bg-stone-300 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Corps des explications */}
        <div className="flex flex-col gap-2.5 text-xs leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
          <div className="p-2 bg-white/70 rounded border border-stone-200">
            <p className="font-bold text-cordel-wood">📐 Structure des Mesures :</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-stone-700">
              <li><strong>1 paragraphe (2 sauts de ligne)</strong> = 1 mesure musicale complète.</li>
              <li><strong>Shift + Entrée</strong> (ligne débutant par un espace) = retour visuel sans changer de mesure.</li>
            </ul>
          </div>

          <div className="p-2 bg-white/70 rounded border border-stone-200">
            <p className="font-bold text-cordel-wood">🎼 Symboles Techniques :</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-stone-700">
              <li><code className="font-mono font-black text-amber-700">+</code> en début de mesure = <strong>Anacrouse</strong> (départ anticipé).</li>
              <li><code className="font-mono font-black text-emerald-700">/</code> en début de mesure = <strong>Mesure liée</strong> (continuité avec la précédente).</li>
              <li><code className="font-mono font-black text-stone-800">*texte*</code> = <strong>Puxador (Soliste)</strong>. Le texte normal est chanté par le chœur.</li>
            </ul>
          </div>

          <div className="p-2 bg-white/70 rounded border border-stone-200">
            <p className="font-bold text-cordel-wood">🏷️ Sections & Accords :</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-stone-700">
              <li><code className="font-mono font-bold text-purple-700">[Intro]</code>, <code className="font-mono font-bold text-purple-700">[Refrain]</code> = Balises de section.</li>
              <li><code className="font-mono font-bold text-emerald-800">[Dm7]</code>, <code className="font-mono font-bold text-emerald-800">[A7]</code> = Accords harmoniques intégrés aux paroles.</li>
            </ul>
          </div>
        </div>

        {/* Bouton de fermeture */}
        <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-black uppercase text-white bg-[var(--color-cordel-vert,#2d6a4f)] hover:bg-emerald-800 rounded cursor-pointer transition-colors shadow-2xs"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}
