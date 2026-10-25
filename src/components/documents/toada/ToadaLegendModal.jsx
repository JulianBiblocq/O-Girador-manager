import React from 'react';
import { useTranslation } from '../../LanguageContext';

export default function ToadaLegendModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const rules = [
    {
      num: 1,
      badge: "Gras / Normal",
      color: "bg-stone-800 text-white",
      desc: "Gras = Puxador (Soliste) • Normal / Italique = Coro (Chœur). Utilisez Ctrl+B en mode texte pour marquer le soliste."
    },
    {
      num: 2,
      badge: "1..4 ou 1..6",
      color: "bg-slate-700 text-white",
      desc: "Poser un temps : cliquez sur une lettre ou un porte-temps _, puis tapez le chiffre au clavier (ou cliquez un tampon du bandeau)."
    },
    {
      num: 3,
      badge: "Temps 1 (Rouge)",
      color: "bg-[#b91c1c] text-white",
      desc: "Chaque 1 rouge ouvre une nouvelle mesure (M1, M2...). Tout ce qui est noté avant le premier 1 constitue l'anacrouse."
    },
    {
      num: 4,
      badge: "Tiret _",
      color: "bg-stone-300 text-stone-900 border border-stone-400 font-mono",
      desc: "Porte-temps muet : sert à placer un temps dans le vide entre deux syllabes (Tra_zen), entre mots (Trazen _ dou), en fin de phrase, ou pour une mesure de silence (_ _ _ _)."
    },
    {
      num: 5,
      badge: "Métrique 🎼",
      color: "bg-amber-600 text-white",
      desc: "Changement de métrique : sélectionnez un temps 1 et choisissez une nouvelle signature (ex: 6/8, 12/8) dans le bandeau du haut si le rythme change en cours de morceau."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#fdfbf7] dark:bg-stone-900 rounded-lg shadow-2xl border border-cordel-master-dark/30 max-w-lg w-full p-5 flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between border-b border-cordel-master-dark/20 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {t('toada.legendTitle') || "Légende & Guide de Notation Musicale"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 rounded text-[10px] font-black uppercase bg-cordel-wood text-white hover:bg-cordel-master-dark shadow-xs cursor-pointer"
            >
              🖨️ {t('toada.printLegendBtn') || "Imprimer"}
            </button>
            <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer">✕</button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {rules.map((r) => (
            <div key={r.num} className="flex items-start gap-2.5 p-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-2xs">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded shrink-0 ${r.color}`}>
                {r.badge}
              </span>
              <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-snug">
                {r.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-cordel-master-dark/15 text-[10px] text-stone-500 italic">
          <span>O Girador • Écosystème Musical & Pédagogique</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded text-[10px] font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 cursor-pointer"
          >
            {t('common.close') || "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}
