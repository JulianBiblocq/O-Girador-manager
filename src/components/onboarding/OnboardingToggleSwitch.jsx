import React from 'react';

/**
 * OnboardingToggleSwitch - Interrupteur direct (toggle switch) style Cordel / Xilo
 * Accessible et responsive pour le contrôle de visibilité dans le Trombinoscope.
 *
 * @param {Object} props
 * @param {boolean} props.checked - État actuel activé / désactivé
 * @param {Function} props.onChange - Callback retournant la nouvelle valeur booléenne
 * @param {boolean} [props.disabled=false] - Désactive l'interrupteur
 * @param {string} [props.label=''] - Libellé affiché à côté de l'interrupteur
 * @param {string} [props.sublabel=''] - Description secondaire (ex: "(L'année ne sera pas notée)")
 */
export default function OnboardingToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  label = '',
  sublabel = '',
  id
}) {
  const switchId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex items-start justify-between gap-3 p-2.5 rounded border border-dashed border-cordel-master-dark/20 bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors">
      <div className="flex flex-col text-left select-none pr-2">
        <label htmlFor={switchId} className="text-xs font-bold text-cordel-master-dark cursor-pointer flex items-center gap-1.5">
          {label}
        </label>
        {sublabel && (
          <span className="text-[10px] text-cordel-wood font-medium leading-tight mt-0.5">
            {sublabel}
          </span>
        )}
      </div>

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-encre-noire/30 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked 
            ? 'bg-amber-600 dark:bg-amber-500 shadow-inner' 
            : 'bg-black/15 dark:bg-white/15'
        }`}
      >
        <span
          className={`pointer-events-none inline-flex h-4 w-4 items-center justify-center transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
            checked ? 'translate-x-5 text-amber-700' : 'translate-x-0.5 text-gray-400'
          }`}
        >
          <span className="text-[8px] font-black">{checked ? '✓' : ''}</span>
        </span>
      </button>
    </div>
  );
}
