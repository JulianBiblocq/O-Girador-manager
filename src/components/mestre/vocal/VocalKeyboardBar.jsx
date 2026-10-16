import React from 'react';
import { KEYBOARD_MIN_MIDI, KEYBOARD_MAX_MIDI } from '../../../utils/vocalAmbitusUtils';

const TICKS = [
  { midi: 40, label: 'Mi2' },
  { midi: 48, label: 'Do3' },
  { midi: 60, label: 'Do4' },
  { midi: 72, label: 'Do5' },
];

export default function VocalKeyboardBar({
  lowestMidi,
  highestMidi,
  centerMidi,
  lowestNote,
  highestNote,
  centerNote,
  role = 'Coro',
  isCollective = false,
  className = '',
}) {
  const span = KEYBOARD_MAX_MIDI - KEYBOARD_MIN_MIDI;
  const toPct = (m) => Math.max(0, Math.min(100, ((m - KEYBOARD_MIN_MIDI) / span) * 100));

  const left = toPct(lowestMidi);
  const right = toPct(highestMidi);
  const width = Math.max(2.5, right - left);
  const center = toPct(centerMidi);

  const isPuxador = role === 'Puxador';
  const barGradient = isCollective
    ? 'bg-gradient-to-r from-amber-600 via-rose-500 to-amber-500 shadow-amber-500/20'
    : isPuxador
      ? 'bg-gradient-to-r from-amber-600 to-orange-500 shadow-orange-500/20'
      : 'bg-gradient-to-r from-teal-600 to-emerald-500 shadow-teal-500/20';

  return (
    <div className={`flex flex-col gap-1 w-full min-w-[210px] select-none ${className}`}>
      {/* Clavier / Piste */}
      <div className="relative h-6 w-full rounded bg-stone-100 dark:bg-stone-900/60 border border-cordel-master-dark/20 overflow-hidden shadow-inner">
        {/* Repères des octaves en fond */}
        {TICKS.map((t) => {
          const tickPct = toPct(t.midi);
          return (
            <div
              key={`tick-${t.midi}`}
              style={{ left: `${tickPct}%` }}
              className="absolute top-0 bottom-0 w-px bg-cordel-master-dark/15 dark:bg-white/10 z-0 pointer-events-none"
            />
          );
        })}

        {/* Barre de puissance de l'ambitus */}
        <div
          style={{ left: `${left}%`, width: `${width}%` }}
          className={`absolute top-1 bottom-1 rounded-sm shadow-xs transition-all duration-300 z-10 flex items-center justify-between px-1 ${barGradient}`}
          title={`${lowestNote} ➔ ${highestNote} (Centre : ${centerNote})`}
        >
          <span className="text-[8px] font-black text-white/90 drop-shadow-xs">{lowestNote}</span>
          <span className="text-[8px] font-black text-white/90 drop-shadow-xs">{highestNote}</span>
        </div>

        {/* Curseur de confort central */}
        <div
          style={{ left: `${center}%` }}
          className="absolute top-0 bottom-0 w-1.5 -ml-[3px] bg-white dark:bg-amber-300 border border-black/40 rounded-full z-20 shadow-md pointer-events-none"
          title={`Note de confort : ${centerNote}`}
        />
      </div>

      {/* Graduation inférieure */}
      <div className="relative h-3 w-full text-[8px] font-bold text-cordel-master-dark/60">
        {TICKS.map((t) => (
          <span
            key={`lbl-${t.midi}`}
            style={{ left: `${toPct(t.midi)}%` }}
            className="absolute transform -translate-x-1/2"
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
