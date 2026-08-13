import React, { useState, useEffect } from 'react';

/**
 * CordelAccordion component for progressive disclosure in forms and details views.
 * Fully multi-theme compliant using semantic CSS variables.
 * Automatically auto-expands if any nested input triggers HTML5 form validation (onInvalid).
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.title - Title of the accordion panel
 * @param {string|React.ReactNode} [props.subtitle] - Secondary text underneath title
 * @param {string|React.ReactNode} [props.icon] - Optional icon element or string emoji
 * @param {string|number|React.ReactNode} [props.badge] - Optional badge or status tag
 * @param {boolean} [props.isOpen] - Controlled open state
 * @param {boolean} [props.defaultOpen=false] - Initial state for uncontrolled usage
 * @param {Function} [props.onToggle] - Callback when toggled (receives boolean newState)
 * @param {string} [props.className] - Additional wrapper CSS classes
 * @param {string} [props.headerClassName] - Custom header CSS classes
 * @param {React.ReactNode} props.children - Panel contents
 */
export default function CordelAccordion({
  title,
  subtitle,
  icon,
  badge,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onToggle,
  className = '',
  headerClassName = '',
  restrictedState, // 'hidden' | 'published' | undefined
  children
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const nextState = !open;
    if (!isControlled) {
      setInternalIsOpen(nextState);
    }
    if (onToggle) {
      onToggle(nextState);
    }
  };

  // If a child input triggers HTML5 validation error while closed, auto-expand accordion
  const handleInvalid = (e) => {
    if (!open) {
      if (!isControlled) {
        setInternalIsOpen(true);
      }
      if (onToggle) {
        onToggle(true);
      }
    }
  };

  return (
    <div 
      className={`theme-card overflow-hidden border-2 border-[var(--cordel-border)] rounded-[var(--theme-border-radius,8px)] transition-all duration-200 ${className}`}
      onInvalidCapture={handleInvalid}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 text-left transition-colors duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--cordel-wood)] ${
          open ? 'bg-[var(--cordel-hover-bg)] border-b border-[var(--cordel-border)]' : 'hover:bg-[var(--cordel-hover-bg)]'
        } ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 pr-2">
          {icon && (
            <span className="text-lg flex-shrink-0 text-[var(--cordel-wood)] flex items-center justify-center">
              {icon}
            </span>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm sm:text-base text-[var(--cordel-wood)] truncate leading-tight flex items-center gap-1.5">
              {title}
              {restrictedState === 'hidden' && (
                <span title="🔒 Masqué aux adhérents" className="text-amber-600 text-sm flex-shrink-0 cursor-help" onClick={(e) => e.stopPropagation()}>🔒</span>
              )}
              {restrictedState === 'published' && (
                <span title="🌐 Visible par la troupe" className="text-emerald-600 text-sm flex-shrink-0 cursor-help" onClick={(e) => e.stopPropagation()}>🌐</span>
              )}
            </span>
            {subtitle && (
              <span className="text-[11px] font-medium text-[var(--encre-noire)] opacity-75 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {badge !== undefined && badge !== null && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--cordel-wood)] text-white">
              {badge}
            </span>
          )}
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] text-[var(--cordel-text)] transition-transform duration-200">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {open && (
        <div className="p-4 bg-[var(--cordel-card-bg)] animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Utilitaire container to manage multiple accordions (e.g., expand all / collapse all)
 */
export function CordelAccordionGroup({ children, className = '' }) {
  return <div className={`flex flex-col gap-3.5 ${className}`}>{children}</div>;
}
