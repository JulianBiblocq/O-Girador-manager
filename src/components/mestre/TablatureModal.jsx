import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Modale de consultation et d'impression papier de la tablature d'un morceau.
 * Affiche la partition textuelle en police monospace avec gestion sécurisée du défilement
 * horizontal et exploitation du conteneur #print-tablature-area stylisé pour l'impression.
 *
 * @param {boolean} isOpen - Indique si la modale est visible
 * @param {Function} onClose - Callback de fermeture
 * @param {Object|null} piece - Morceau du répertoire dont la tablature est affichée
 */
export default function TablatureModal({ isOpen, onClose, piece }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !piece) return null;

  const tablatureText = piece.tablature || '';
  const pieceTitle = piece.titre || 'Morceau';

  // Copie de la tablature dans le presse-papier avec confirmation visuelle
  const handleCopy = async () => {
    if (!tablatureText) return;
    try {
      await navigator.clipboard.writeText(tablatureText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Erreur lors de la copie de la tablature :", err);
    }
  };

  // Déclenchement de l'impression native du navigateur
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <CordelCard className="w-full max-w-4xl p-4 md:p-6 flex flex-col gap-4 bg-[#fdfaf2] border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716] max-h-[92vh] overflow-hidden">
        {/* En-tête de la modale */}
        <div className="border-b-2 border-dashed border-cordel-wood/30 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">📄</span>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm md:text-base font-black uppercase tracking-wider text-cordel-wood truncate">
                Tablature : {pieceTitle}
              </h3>
              <span className="text-[10px] text-encre-noire/60 font-semibold truncate">
                Partition textuelle monospace générée depuis le Séquenceur
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 font-black text-xl p-1 cursor-pointer transition-colors leading-none"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Barre d'outils d'action (Imprimer, Copier) */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-white/70 p-2.5 rounded border border-encre-noire/15 shadow-xs">
          <div className="flex items-center gap-2">
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={false}
              onClick={handlePrint}
              className="py-1 px-3 text-xs uppercase tracking-wider font-black flex items-center gap-1.5"
              title="Lancer l'impression papier de cette tablature"
            >
              <span>🖨️</span>
              <span>Imprimer</span>
            </CordelButton>

            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase rounded-[4px_6px_3px_5px] border transition-all cursor-pointer shadow-xs select-none ${
                copied
                  ? 'bg-green-100 text-green-900 border-green-500'
                  : 'bg-white hover:bg-stone-100 text-encre-noire border-encre-noire/30'
              }`}
              title="Copier l'intégralité du texte dans le presse-papier"
            >
              <span>{copied ? '✓' : '📋'}</span>
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>

          <span className="text-[10px] italic text-encre-noire/60">
            Astuce : défilement horizontal disponible pour les longues mesures.
          </span>
        </div>

        {/* Zone imprimable et consultable identifiée pour @media print */}
        <div
          id="print-tablature-area"
          className="flex-1 overflow-y-auto overflow-x-auto p-3.5 bg-white rounded border border-encre-noire/20 shadow-inner"
        >
          {tablatureText ? (
            <pre className="font-mono text-xs md:text-[12.5px] leading-relaxed text-encre-noire whitespace-pre min-w-max select-text">
              {tablatureText}
            </pre>
          ) : (
            <p className="text-xs text-encre-noire/60 italic p-4 text-center">
              Aucune tablature n'a encore été générée pour ce morceau.
            </p>
          )}
        </div>

        {/* Pied de modale */}
        <div className="flex justify-end pt-2 border-t border-dashed border-cordel-master-dark/15">
          <CordelButton
            type="button"
            variant="default"
            useExtremeBorder={false}
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold"
          >
            Fermer
          </CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
