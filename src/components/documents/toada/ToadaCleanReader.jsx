import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import { parseToadaMeasures } from '../../../utils/toadaMeasureParser';
import ToadaChordOverlay from './ToadaChordOverlay';

/**
 * Mode Lecture 100 % Épuré pour la fiche Toada élève.
 * Masque les symboles techniques (+, /), affiche le bandeau musical
 * et propose l'interrupteur d'affichage des accords (masqués par défaut).
 * Supporte le format par mesure ainsi que le HTML hérité TipTap.
 */
export default function ToadaCleanReader({
  content = '',
  signature = '4/4',
  bpm = null,
  tonalite = null,
  activePuxador = true,
  activeChoeur = true,
  isRevealedMode = true,
  className = ''
}) {
  const { t } = useTranslation();
  const [showChords, setShowChords] = useState(false);

  const parsed = useMemo(() => parseToadaMeasures(content), [content]);

  const hasAnyChords = useMemo(() => {
    if (!parsed.isMeasureFormat) return false;
    return parsed.measures.some((m) => m.hasChords);
  }, [parsed]);

  return (
    <div className={`flex flex-col gap-3 w-full text-left ${className}`}>
      {/* 1. Bandeau Musical & Interrupteur Accords */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[4px_6px_3px_5px] bg-cordel-bg-light/70 border border-encre-noire/15 shadow-2xs">
        <div className="flex items-center gap-3 text-xs font-bold text-encre-noire flex-wrap">
          {signature && (
            <span className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-black text-cordel-wood">Sign. :</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-encre-noire/20 font-black">{signature}</span>
            </span>
          )}
          {bpm && (
            <span className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-black text-cordel-wood">Tempo :</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-encre-noire/20 font-black">{bpm} BPM</span>
            </span>
          )}
          {tonalite && (
            <span className="flex items-center gap-1">
              <span className="text-[9px] uppercase font-black text-cordel-wood">Ton :</span>
              <span className="px-1.5 py-0.5 rounded bg-white border border-encre-noire/20 font-black uppercase">{tonalite}</span>
            </span>
          )}
        </div>

        {/* Interrupteur Accords */}
        {hasAnyChords && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold text-encre-noire hover:text-cordel-wood">
            <input
              type="checkbox"
              checked={showChords}
              onChange={(e) => setShowChords(e.target.checked)}
              className="w-3.5 h-3.5 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
            />
            <span>{t('toada.showChords') || "Afficher les accords"}</span>
          </label>
        )}
      </div>

      {/* 2. Affichage par mesure (Nouveau format .txt) */}
      {parsed.isMeasureFormat ? (
        <div className="flex flex-col gap-2.5 w-full">
          {parsed.measures.map((measure) => (
            <div
              key={measure.measureNumber}
              className={`p-2 rounded transition-colors ${
                measure.isLinked
                  ? 'pl-4 border-l-2 border-dashed border-cordel-master-dark/30'
                  : 'bg-white/40'
              }`}
            >
              <div className="flex flex-col gap-1">
                {measure.lines.map((line, lIdx) => (
                  <div
                    key={lIdx}
                    className={`flex items-baseline ${line.isVisualBreak ? 'pl-4' : ''}`}
                  >
                    <ToadaChordOverlay
                      segments={line.segments}
                      showChords={showChords}
                      activePuxador={activePuxador}
                      activeChoeur={activeChoeur}
                      isRevealedMode={isRevealedMode}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. Affichage rétrocompatible pour le HTML hérité TipTap */
        <div
          className={`leading-relaxed text-sm whitespace-pre-wrap font-medium text-encre-noire ${
            isRevealedMode ? 'leading-tight' : 'leading-relaxed'
          }`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}
