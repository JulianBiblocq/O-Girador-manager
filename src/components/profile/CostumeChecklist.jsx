import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';

const COSTUME_ITEMS = [
  { key: 'chaussures', label: 'Chaussures blanches', needsTutorial: false },
  { key: 'pantalon', label: 'Pantalon blanc', needsTutorial: false },
  { key: 'robe', label: 'Robe blanche', needsTutorial: false },
  { key: 'bracelets', label: 'Bracelets', needsTutorial: true },
  { key: 'chapeau', label: 'Chapeau', needsTutorial: true }
];

export default function CostumeChecklist({ userId, costumeChecklist = {}, onNavigateToTuto }) {
  const [updating, setUpdating] = useState(null);

  const handleToggle = async (itemKey, currentValue) => {
    if (!userId) return;
    setUpdating(itemKey);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`costumeChecklist.${itemKey}`]: !currentValue
      });
    } catch (err) {
      console.error("CostumeChecklist - Error updating costume status:", err);
      alert("Impossible de modifier le statut : " + (err.message || err));
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 select-none">
      <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5 font-black">
        🎭 Suivi de ma Tenue / Costumes
      </h4>
      <p className="text-[10px] opacity-70 leading-relaxed text-left">
        Cochez les éléments de votre costume au fur et à mesure que vous les rassemblez ou les fabriquez.
      </p>

      <div className="flex flex-col gap-1.5 mt-1">
        {COSTUME_ITEMS.map((item) => {
          const isDone = !!costumeChecklist[item.key];
          const isPending = updating === item.key;

          return (
            <CordelCard
              key={item.key}
              variant="default"
              useExtremeBorder={false}
              className="p-2.5 bg-cordel-bg flex items-center justify-between gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all"
            >
              <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  disabled={isPending}
                  checked={isDone}
                  onChange={() => handleToggle(item.key, isDone)}
                  className="theme-checkbox h-4 w-4 text-cordel-wood focus:ring-cordel-wood border-encre-noire rounded cursor-pointer shrink-0"
                />
                <span className={`text-xs font-bold truncate ${isDone ? 'line-through text-encre-noire/40 font-normal' : 'text-encre-noire dark:text-cordel-bg-light'}`}>
                  {item.label}
                </span>
                {isPending && <span className="text-[8px] animate-pulse">⏳</span>}
              </label>

              {item.needsTutorial && (
                <button
                  type="button"
                  onClick={() => onNavigateToTuto && onNavigateToTuto(item.key)}
                  className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light hover:bg-cordel-hover hover:brightness-105 border border-encre-noire px-2 py-1 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1 shrink-0"
                >
                  🧵 Voir le tuto
                </button>
              )}
            </CordelCard>
          );
        })}
      </div>
    </div>
  );
}
