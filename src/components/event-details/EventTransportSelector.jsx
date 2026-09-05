import React from 'react';

/**
 * Normalise la valeur du transport pour garantir une compatibilité
 * ascendante et descendante parfaite avec les données historiques.
 *
 * @param {string} value Valeur brute stockée dans l'inscription
 * @returns {'autonome' | 'cherche_place' | 'propose_voiture'}
 */
export const normalizeTransport = (value) => {
  if (!value) return 'autonome';
  if (value === 'cherche' || value === 'cherche_place') return 'cherche_place';
  if (value === 'propose' || value === 'propose_voiture') return 'propose_voiture';
  return 'autonome';
};

/**
 * Composant : EventTransportSelector
 * 
 * Permet à un membre présent de définir clairement comment il se rend sur l'événement :
 * 1. Autonome (par ses propres moyens, sans défraiement kilométrique)
 * 2. Cherche une place (rejoint la file d'attente du convoi)
 * 3. Propose son véhicule (ouvre un véhicule dans le convoi)
 * 
 * @param {Object} props Propriétés du composant
 * @param {string} props.value Statut de transport sélectionné
 * @param {Function} props.onChange Callback de modification du transport
 * @param {boolean} props.disabled Indique si le sélecteur est désactivé (enregistrement, événement clos)
 */
export default function EventTransportSelector({ value, onChange, disabled = false }) {
  const current = normalizeTransport(value);

  const options = [
    {
      id: 'autonome',
      icon: '🚶🚗',
      label: "Par mes propres moyens",
      description: "Je gère mon trajet en autonomie (aucun défraiement kilométrique asso)."
    },
    {
      id: 'cherche_place',
      icon: '🙋',
      label: "Cherche une place en convoi",
      description: "Je souhaite monter dans un véhicule du convoi au départ du local."
    },
    {
      id: 'propose_voiture',
      icon: '🚘',
      label: "Je propose mon véhicule",
      description: "J'emmène des membres de la troupe et participe au convoi officiel."
    }
  ];

  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
        🚗 Mode de Déplacement pour ce trajet
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const isSelected = current === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.id)}
              className={`p-2.5 rounded-[6px_8px_5px_7px] border-2 transition-all text-left flex flex-col justify-between cursor-pointer select-none ${
                isSelected
                  ? 'bg-amber-100/90 border-encre-noire shadow-[2px_2px_0px_0px_#181716] translate-x-[0.5px] translate-y-[0.5px]'
                  : 'bg-cordel-bg/60 border-encre-noire/25 hover:border-encre-noire/60 hover:bg-cordel-bg shadow-xs'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-base">{opt.icon}</span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full border border-encre-noire flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-cordel-wood' : 'bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <div className="text-xs font-black text-encre-noire leading-snug">
                  {opt.label}
                </div>
              </div>
              <div className="text-[9.5px] font-medium text-cordel-master-dark/75 mt-1.5 leading-tight">
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
