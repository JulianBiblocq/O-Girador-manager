import React from 'react';

/**
 * EventToggleSwitch - Reusable accessible toggle switch for event quick-editing in table views.
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Current boolean state
 * @param {Function} props.onChange - Callback triggered on toggle (passes new boolean)
 * @param {boolean} [props.disabled=false] - Whether toggle is disabled during saving
 * @param {string} [props.activeColor='bg-amber-600 dark:bg-amber-500'] - Background color when active
 * @param {string} [props.label=''] - Title/aria-label for the switch
 */
export default function EventToggleSwitch({
  checked = false,
  onChange,
  disabled = false,
  activeColor = 'bg-amber-600 dark:bg-amber-500',
  label = ''
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onChange) {
          onChange(!checked);
        }
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-encre-noire/30 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? activeColor : 'bg-black/10 dark:bg-white/10'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
