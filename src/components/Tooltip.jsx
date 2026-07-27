import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip component for contextual micro-help explanations.
 * Fully multi-theme compliant using semantic CSS variables.
 * Supports hover, keyboard focus, and mobile touch toggle.
 *
 * @param {Object} props
 * @param {string|React.ReactNode} props.text - Tooltip message content
 * @param {React.ReactNode} [props.children] - Custom trigger element. If omitted, renders a discrete [?] icon button.
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top'] - Position relative to trigger
 * @param {string} [props.className] - Additional wrapper CSS classes
 * @param {string} [props.iconVariant='default'] - Preset icon style ('default' [?], 'info' (i))
 */
export default function Tooltip({
  text,
  children,
  position = 'top',
  className = '',
  iconVariant = 'default'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setIsVisible(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible]);

  if (!text) return children || null;

  // Position classes for tooltip popover
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2'
  }[position] || 'bottom-full mb-2 left-1/2 -translate-x-1/2';

  // Arrow classes
  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--cordel-border)] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--cordel-border)] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--cordel-border)] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--cordel-border)] border-t-transparent border-b-transparent border-l-transparent'
  }[position] || 'top-full left-1/2 -translate-x-1/2 border-t-[var(--cordel-border)] border-l-transparent border-r-transparent border-b-transparent';

  return (
    <div className={`relative inline-flex items-center align-middle ${className}`}>
      {/* Trigger element */}
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible((prev) => !prev);
        }}
        tabIndex={0}
        role="button"
        aria-label="Aide d'information"
        className="cursor-pointer inline-flex items-center justify-center focus:outline-none"
      >
        {children ? (
          children
        ) : (
          <span className="w-4 h-4 rounded-full border border-[var(--cordel-border)] bg-[var(--cordel-card-bg)] text-[var(--cordel-wood)] hover:bg-[var(--cordel-hover-bg)] flex items-center justify-center text-[10px] font-bold shadow-xs transition-colors duration-150 ml-1">
            {iconVariant === 'info' ? 'i' : '?'}
          </span>
        )}
      </div>

      {/* Tooltip popover */}
      {isVisible && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`absolute z-50 w-64 max-w-[85vw] p-2.5 bg-[var(--cordel-card-bg)] text-[var(--cordel-text)] text-[11px] font-medium leading-tight rounded-[var(--theme-border-radius,6px)] border border-[var(--cordel-border)] shadow-lg animate-fadeIn pointer-events-none ${positionClasses}`}
        >
          {text}
          <div className={`absolute w-0 h-0 border-4 ${arrowClasses}`} />
        </div>
      )}
    </div>
  );
}
