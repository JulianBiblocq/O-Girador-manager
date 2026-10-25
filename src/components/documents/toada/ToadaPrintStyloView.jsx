import React from 'react';
import { useTranslation } from '../../LanguageContext';

function getBeatsCount(sig = '4/4') {
  if (sig === '2/4') return 2;
  if (sig === '3/4') return 3;
  if (sig === '6/8') return 6;
  if (sig === '12/8') return 12;
  return 4;
}

export default function ToadaPrintStyloView({ isOpen, onClose, lines = [], metadata = {} }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const sig = metadata.signature || '4/4';
  const beats = getBeatsCount(sig);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-cordel-master-dark/30 max-w-2xl w-full p-6 flex flex-col gap-4 text-left my-auto">
        <div className="flex items-center justify-between border-b pb-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
                {t('toada.printStyloTitle') || "Feuille de travail Manuscrite (Stylo / Crayon)"}
              </h3>
              <p className="text-[9.5px] text-stone-500">
                {metadata.titre || "Toada"} • Signature {sig} (Temps 1 à {beats})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded text-[10px] font-black uppercase bg-cordel-wood text-white hover:bg-cordel-master-dark shadow-xs cursor-pointer"
            >
              {t('common.print') || "🖨️ Imprimer"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-300 cursor-pointer"
            >
              {t('common.close') || "✕"}
            </button>
          </div>
        </div>

        <div className="print:p-0 flex flex-col gap-4 font-serif text-encre-noire">
          <div className="border-b-2 border-encre-noire pb-2">
            <h1 className="text-lg font-black tracking-wide">{metadata.titre || t('toada.defaultTitle') || "Toada de Maracatu"}</h1>
            <div className="flex flex-wrap gap-4 text-[10px] text-stone-600 mt-1 uppercase font-sans font-bold">
              <span>⏱️ Signature : {sig} — Temps 1 à {beats}</span>
              {metadata.rythme && <span>🥁 Rythme : {metadata.rythme}</span>}
              {metadata.bpmDefaut && <span>⚡ BPM : {metadata.bpmDefaut}</span>}
              {metadata.tonaliteDefaut && <span>🎵 Tom : {metadata.tonaliteDefaut}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-5 pt-2">
            {lines.map((line, idx) => {
              const cleanLine = line.replace(/\[\d+\]/g, '').replace(/_/g, ' ').replace(/\s{2,}/g, ' ').trim();
              const isPuxador = /\*[^*]+\*/.test(line);
              const displayText = cleanLine.replace(/\*([^*]+)\*/g, '$1');

              return (
                <div key={idx} className="flex flex-col">
                  <div className="h-6 border-b border-dashed border-stone-400/80 mb-1 flex items-end px-1">
                    <span className="text-[8px] font-mono text-stone-400 select-none pb-0.5">Temps 1..{beats} ➔</span>
                  </div>
                  <div className="text-sm font-sans tracking-wide px-1">
                    {isPuxador ? (
                      <span className="font-black underline decoration-stone-800 decoration-2">{displayText}</span>
                    ) : (
                      <span className="font-normal text-stone-800">{displayText}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-300 text-center text-[9px] font-sans text-stone-500 italic select-none">
            💡 Mémo : Écrivez les chiffres des temps au-dessus des syllabes • 1 rouge = début de mesure • _ = temps dans le vide
          </div>
        </div>
      </div>
    </div>
  );
}
