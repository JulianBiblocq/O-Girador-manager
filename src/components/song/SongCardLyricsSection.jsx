import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import ToadaCleanReader from '../documents/toada/ToadaCleanReader';

/**
 * Section des paroles de la fiche SongCard :
 * Contrôles d'apprentissage flashcard (Puxador / Coro), bascule paroles phonétiques
 * et affichage épuré via ToadaCleanReader (Signature, BPM, Tonalité et Accords).
 */
export default function SongCardLyricsSection({
  song,
  activePuxador = true,
  setActivePuxador,
  activeChoeur = true,
  setActiveChoeur,
  isRevealedMode = true
}) {
  const { t } = useTranslation();
  const [lyricsType, setLyricsType] = useState('original'); // 'original' | 'phonetic'

  const hasPhonetic = Boolean(song?.parolesPhonetiques && song.parolesPhonetiques.trim() !== '');
  const rawLyrics = lyricsType === 'phonetic' && hasPhonetic
    ? song.parolesPhonetiques
    : (song?.rawTxtCode || song?.parolesOriginales || song?.paroles || song?.texte || '');

  return (
    <div className="flex flex-col gap-3 w-full text-left">
      {/* Contrôles d'apprentissage Puxador / Coro et bascule Phonétique */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2">
        {!isRevealedMode ? (
          <div className="flex items-center gap-3 text-xs font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activePuxador}
                onChange={(e) => setActivePuxador(e.target.checked)}
                className="w-3.5 h-3.5 cursor-pointer accent-cordel-wood"
              />
              <span className="font-black text-encre-noire">Puxador (Soliste)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activeChoeur}
                onChange={(e) => setActiveChoeur(e.target.checked)}
                className="w-3.5 h-3.5 cursor-pointer accent-cordel-wood"
              />
              <span className="italic font-bold text-encre-noire/90">Coro (Chœur)</span>
            </label>
          </div>
        ) : (
          <span className="text-[10px] uppercase font-black tracking-wider text-cordel-wood">
            📜 {t('repertoire.lyricsTab') || "Paroles"}
          </span>
        )}

        {/* Bascule Paroles Originales / Phonétiques */}
        {hasPhonetic && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setLyricsType('original')}
              className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer transition-all ${
                lyricsType === 'original'
                  ? 'bg-cordel-wood text-white shadow-2xs'
                  : 'bg-white text-stone-700 border border-stone-300'
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => setLyricsType('phonetic')}
              className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer transition-all ${
                lyricsType === 'phonetic'
                  ? 'bg-cordel-wood text-white shadow-2xs'
                  : 'bg-white text-stone-700 border border-stone-300'
              }`}
            >
              Phonétique
            </button>
          </div>
        )}
      </div>

      {/* Rendu des Paroles épurées */}
      {rawLyrics ? (
        <ToadaCleanReader
          content={rawLyrics}
          signature={song?.signature || song?.timeSignature || '4/4'}
          bpm={song?.bpmDefaut || song?.bpm || song?.tempo || null}
          tonalite={song?.tonaliteDefaut || song?.tonalite || song?.key || null}
          activePuxador={activePuxador}
          activeChoeur={activeChoeur}
          isRevealedMode={isRevealedMode}
        />
      ) : (
        <p className="text-xs text-stone-500 italic py-4">
          {t('repertoire.emptyLyrics') || "Aucune parole renseignée pour ce chant."}
        </p>
      )}
    </div>
  );
}
