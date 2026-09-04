import React from 'react';

export default function PartAssignmentBadge({ assignment }) {
  if (!assignment) return null;

  switch (assignment.type) {
    case 'libre':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 shadow-sm">
          <span>🟢</span>
          <span>Disponible</span>
        </span>
      );

    case 'projet':
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border border-[var(--color-cordel-ocre)]/40 shadow-sm cursor-help" title={`Affectée au projet : ${assignment.projectName}`}>
            <span>🟠</span>
            <span>En Projet</span>
          </span>
          <span className="text-[9px] font-bold text-stone-600 px-1 line-clamp-1" title={assignment.projectName}>
            {assignment.projectName}
          </span>
        </div>
      );

    case 'instrument':
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 shadow-sm cursor-help" title={`Montée sur l'instrument : ${assignment.instrumentName}`}>
            <span>🔵</span>
            <span>Montée</span>
          </span>
          <span className="text-[9px] font-bold text-stone-600 px-1 line-clamp-1" title={assignment.instrumentName}>
            {assignment.instrumentName}
          </span>
        </div>
      );

    default:
      return null;
  }
}
