import React, { useState } from 'react';
import CordelButton from './CordelButton';

export default function PrintConfigModal({ onClose, onConfirm, title = "Impression du Carnet", allowBulk = false }) {
  const [format, setFormat] = useState('A4');
  const [isBW, setIsBW] = useState(false);
  const [isBulk, setIsBulk] = useState(false);

  const handlePrint = () => {
    onConfirm({ format, isBW, isBulk });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden backdrop-blur-sm">
      <div className="bg-[#fdfaf2] dark:bg-[#1a1816] rounded-xl shadow-2xl max-w-md w-full border-2 border-encre-noire overflow-hidden">
        <div className="bg-[#f5f0e6] dark:bg-[#2a2622] p-4 border-b-2 border-encre-noire flex justify-between items-center">
          <h2 className="font-cactus tracking-widest text-xl text-encre-noire dark:text-stone-200">
            🖨️ {title}
          </h2>
          <button onClick={onClose} className="text-encre-noire hover:text-cordel-rouge font-black text-xl">
            ×
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-6 text-encre-noire dark:text-stone-200">
          
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase tracking-wider text-sm">Format de Papier</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={() => setFormat('A5')}
                className={`flex-1 py-2 px-2 border-2 rounded font-black uppercase text-xs tracking-wider transition-colors ${format === 'A5' ? 'bg-[var(--color-cordel-vert,#2d6a4f)] border-[var(--color-cordel-vert,#2d6a4f)] text-white' : 'bg-white border-encre-noire text-encre-noire hover:bg-neutral-100 dark:bg-black dark:text-white dark:hover:bg-neutral-800'}`}
              >
                📄 A5 Livret
              </button>
              <button 
                onClick={() => setFormat('A4')}
                className={`flex-1 py-2 px-2 border-2 rounded font-black uppercase text-xs tracking-wider transition-colors ${format === 'A4' ? 'bg-[var(--color-cordel-vert,#2d6a4f)] border-[var(--color-cordel-vert,#2d6a4f)] text-white' : 'bg-white border-encre-noire text-encre-noire hover:bg-neutral-100 dark:bg-black dark:text-white dark:hover:bg-neutral-800'}`}
              >
                📑 A4 Standard
              </button>
              <button 
                onClick={() => setFormat('A3')}
                className={`flex-1 py-2 px-2 border-2 rounded font-black uppercase text-xs tracking-wider transition-colors ${format === 'A3' ? 'bg-[var(--color-cordel-vert,#2d6a4f)] border-[var(--color-cordel-vert,#2d6a4f)] text-white' : 'bg-white border-encre-noire text-encre-noire hover:bg-neutral-100 dark:bg-black dark:text-white dark:hover:bg-neutral-800'}`}
              >
                📜 A3 Grand
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-6 h-6 border-2 border-encre-noire rounded group-hover:border-[var(--color-cordel-vert)] transition-colors">
                <input 
                  type="checkbox" 
                  checked={isBW} 
                  onChange={(e) => setIsBW(e.target.checked)}
                  className="opacity-0 absolute w-full h-full cursor-pointer"
                />
                {isBW && <div className="w-3 h-3 bg-encre-noire dark:bg-white rounded-sm"></div>}
              </div>
              <span className="font-black uppercase tracking-wider text-sm">Forcer Noir & Blanc</span>
            </label>

            {allowBulk && (
              <label className="flex items-center gap-3 cursor-pointer group bg-[var(--color-cordel-vert)]/10 p-3 rounded-lg border border-[var(--color-cordel-vert)]">
                <div className="relative flex items-center justify-center w-6 h-6 border-2 border-[var(--color-cordel-vert)] rounded bg-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isBulk} 
                    onChange={(e) => setIsBulk(e.target.checked)}
                    className="opacity-0 absolute w-full h-full cursor-pointer"
                  />
                  {isBulk && <div className="w-3 h-3 bg-[var(--color-cordel-vert)] rounded-sm"></div>}
                </div>
                <span className="font-black uppercase tracking-wider text-sm text-[var(--color-cordel-vert)]">Imprimer TOUT le livret (Toutes les Toadas)</span>
              </label>
            )}
          </div>

            <div className="bg-[#f5f0e6]/60 dark:bg-[#201d1a] border-l-4 border-[var(--color-cordel-ocre,#c05621)] p-4 rounded-r text-sm">
              <h4 className="font-black uppercase tracking-widest text-[var(--color-cordel-ocre,#c05621)] mb-2 text-xs">
                💡 Astuce : Mode Livret & PDF
              </h4>
              <p className="font-medium opacity-90">
                Une fois que vous cliquerez sur "Lancer l'impression", la fenêtre de votre navigateur va s'ouvrir.
              </p>
              <ul className="list-disc pl-5 mt-2 opacity-90 space-y-1">
                <li><b>Pour exporter en PDF :</b> Choisissez l'imprimante "Enregistrer au format PDF" (ou "Microsoft Print to PDF").</li>
                <li><b>Pour un vrai carnet plié :</b> Cherchez et cochez l'option <b>"Mode Livret"</b> ou <b>"Booklet"</b> de votre imprimante physique.</li>
                <li>Activez le <b>Recto/Verso</b> (sur les bords courts pour un livret).</li>
              </ul>
            </div>

          <div className="flex justify-end gap-3 mt-2">
            <CordelButton variant="secondary" onClick={onClose}>
              Annuler
            </CordelButton>
            <CordelButton variant="primary" onClick={handlePrint} className="bg-cordel-vert text-white border-cordel-vert hover:bg-cordel-vert/90">
              🖨️ Lancer l'impression
            </CordelButton>
          </div>
        </div>
      </div>
    </div>
  );
}
