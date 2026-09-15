import React, { useState } from 'react';
import { CULTURAL_EQUIVALENCES } from '../../config/studioSocialConfig';

export { CULTURAL_EQUIVALENCES };

/**
 * Composant StudioWritingGuide
 * Tiroir rétractable compact offrant un guide de recommandations terminologiques et culturelles.
 *
 * @param {Object} props
 * @param {Function} [props.onInsertTerm] Optionnel : permet d'insérer directement le terme recommandé au clic
 */
export default function StudioWritingGuide({ onInsertTerm }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col border-t border-dashed border-cordel-master-dark/20 pt-1.5 mt-1.5">
      {/* Bouton déclencheur discret */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-[10.5px] font-black uppercase text-cordel-wood hover:text-encre-noire flex items-center gap-1.5 cursor-pointer select-none py-0.5"
          title="Consulter les équivalences culturelles et bonnes pratiques"
        >
          <span>💡 Lexique & Recommandations de rédaction</span>
          <span className="text-[9px] transition-transform duration-200">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {isOpen && (
          <span className="text-[9px] text-cordel-master-dark/70 italic hidden sm:inline select-none">
            Cliquez sur un terme vert pour l'insérer
          </span>
        )}
      </div>

      {/* Accordéon déroulant avec tableau d'équivalences */}
      {isOpen && (
        <div className="mt-2 p-2 bg-cordel-bg-light border border-encre-noire/25 rounded-[6px] shadow-xs text-left animate-fade-in">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-[11px] border-collapse min-w-[340px]">
              <thead>
                <tr className="border-b-2 border-encre-noire/20 text-[9.5px] uppercase font-black tracking-wider text-cordel-wood">
                  <th className="py-1 px-2">Terme recommandé</th>
                  <th className="py-1 px-2">À éviter / Imprécis</th>
                  <th className="py-1 px-2">Contexte & Nuance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cordel-master-dark/10">
                {CULTURAL_EQUIVALENCES.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/60 transition-colors">
                    <td className="py-1 px-2 whitespace-nowrap">
                      {onInsertTerm ? (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => onInsertTerm(item.recommande)}
                          className="font-bold text-[var(--color-cordel-vert,#2d6a4f)] hover:underline cursor-pointer flex items-center gap-0.5"
                          title={`Insérer "${item.recommande}"`}
                        >
                          <span>✓</span>
                          <span>{item.recommande}</span>
                        </button>
                      ) : (
                        <span className="font-bold text-[var(--color-cordel-vert,#2d6a4f)]">
                          ✓ {item.recommande}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-[var(--color-cordel-rouge,#8b2a1a)] font-semibold line-through opacity-85 whitespace-nowrap">
                      {item.aEviter}
                    </td>
                    <td className="py-1 px-2 text-[10px] text-cordel-master-dark opacity-90 leading-tight">
                      {item.contexte}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
