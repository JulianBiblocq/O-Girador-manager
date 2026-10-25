import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToadaScanDropZone from './ToadaScanDropZone';
import { scanManuscriptSheet, saveScanApiKey, buildVisionManuscriptPrompt } from '../../../utils/toadaManuscriptScannerService';

export default function ToadaScanPromptModal({
  isOpen, onClose, onApplyResult, tab1Lyrics = '', signature = '4/4'
}) {
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState('pt');
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [alsoFillVaral, setAlsoFillVaral] = useState(!tab1Lyrics || !tab1Lyrics.trim());
  const [showManual, setShowManual] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) { setImagePreview(null); setScanError(null); setIsScanning(false); }
    else { setAlsoFillVaral(!tab1Lyrics || !tab1Lyrics.trim()); }
  }, [isOpen, tab1Lyrics]);

  if (!isOpen) return null;

  const handleFileSelected = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => { setImagePreview(e.target?.result || null); setScanError(null); };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFileSelected(file);
        break;
      }
    }
  };

  const handleRunScan = async () => {
    if (!imagePreview) return;
    setIsScanning(true);
    setScanError(null);
    const res = await scanManuscriptSheet(imagePreview, { lang: selectedLang, signature, tab1Lyrics, apiKey: customKey });
    setIsScanning(false);
    if (!res.success) {
      setScanError(res.error);
      if (res.needsApiKey) setNeedsApiKey(true);
      return;
    }
    if (onApplyResult) onApplyResult(res.text, alsoFillVaral);
    onClose();
  };

  const manualPrompt = buildVisionManuscriptPrompt({ lang: selectedLang, signature, tab1Lyrics });

  return (
    <div onPaste={handlePaste} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-[#fdfbf7] dark:bg-stone-900 rounded-lg shadow-2xl border border-cordel-master-dark/30 max-w-lg w-full p-5 flex flex-col gap-3.5 text-left my-auto">
        <div className="flex items-center justify-between border-b border-cordel-master-dark/20 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {t('toada.scanModalTitle') || "Lecture optique du manuscrit"}
            </h3>
          </div>
          <button type="button" onClick={onClose} disabled={isScanning} className="text-stone-400 hover:text-stone-700 text-sm font-bold cursor-pointer">✕</button>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded border border-stone-200">
          <span className="text-[10px] font-bold text-stone-600 px-1">Langue :</span>
          {[{ id: 'pt', label: t('toada.langPt') || '🇧🇷 Portugais' }, { id: 'fr', label: t('toada.langFr') || '🇫🇷 Français' }, { id: 'other', label: t('toada.langOther') || '🌍 Autre' }].map((l) => (
            <button key={l.id} type="button" onClick={() => setSelectedLang(l.id)} disabled={isScanning}
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase cursor-pointer transition-all ${selectedLang === l.id ? 'bg-cordel-wood text-white shadow-2xs' : 'text-stone-600 hover:bg-stone-200'}`}>
              {l.label}
            </button>
          ))}
        </div>

        <ToadaScanDropZone imagePreview={imagePreview} onFileSelected={handleFileSelected} onClearImage={() => setImagePreview(null)} disabled={isScanning} />

        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-stone-700 dark:text-stone-300">
          <input type="checkbox" checked={alsoFillVaral} onChange={(e) => setAlsoFillVaral(e.target.checked)} disabled={isScanning} className="rounded text-cordel-wood focus:ring-cordel-wood" />
          <span>{t('toada.alsoFillVaralLabel') || "Remplir aussi le texte Portugais de la Fiche Varal (sans les temps)"}</span>
        </label>

        {scanError && <p className="text-[11px] text-red-600 font-semibold bg-red-50 p-2 rounded border border-red-200">{scanError}</p>}

        {needsApiKey && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
            <input type="password" value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="Clé d'accès..." className="text-xs px-2 py-1 bg-white border border-stone-300 rounded flex-1" />
            <button type="button" onClick={() => { saveScanApiKey(customKey); setNeedsApiKey(false); }} className="px-2.5 py-1 text-[10px] font-bold bg-cordel-wood text-white rounded cursor-pointer">Enregistrer</button>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-stone-200">
          <button type="button" onClick={() => setShowManual(!showManual)} className="text-[10px] font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer">
            {showManual ? "Masquer mode secours" : (t('toada.manualModeAccordion') || "Mode manuel sans connexion")}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} disabled={isScanning} className="px-3 py-1.5 rounded text-[10px] font-bold text-stone-600 hover:bg-stone-100 border border-stone-300 cursor-pointer">
              {t('common.cancel') || "Annuler"}
            </button>
            <button type="button" onClick={handleRunScan} disabled={!imagePreview || isScanning}
              className="px-3.5 py-1.5 rounded text-[10px] font-black uppercase bg-cordel-wood hover:bg-cordel-master-dark text-white disabled:opacity-40 cursor-pointer shadow-xs flex items-center gap-1.5">
              {isScanning ? <span>⏳ {t('toada.scanningInProgress') || "Lecture optique en cours..."}</span> : <span>{t('toada.scanApplyBtn') || "🔍 Lire et appliquer les temps"}</span>}
            </button>
          </div>
        </div>

        {showManual && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-dashed border-stone-300 text-left">
            <pre className="text-[9px] font-mono bg-stone-100 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">{manualPrompt}</pre>
            <button type="button" onClick={async () => { await navigator.clipboard.writeText(manualPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="self-end px-2.5 py-1 text-[9.5px] font-bold bg-stone-200 hover:bg-stone-300 rounded cursor-pointer">
              {copied ? "✓ Copié !" : "📋 Copier les instructions"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
