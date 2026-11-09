/**
 * VocalPaperOrganizadorModal.jsx
 * Modale « Atelier Papier du Chant (A4 Paysage 100 % N&B) » dans Organizador (< 138 lignes).
 * Panier d'impression multi-feuilles (quantités 0..20, mode [P__]/continu/par feuille, aperçu) et lecture optique multi-photos.
 */
import React, { useState, useRef } from 'react';
import { buildOrganizadorVocalSheetHTML, buildOrganizadorVocalCartBatchHTML, printOrganizadorHtmlDocument } from '../../../utils/vocalPaperSheetPrinter';
import { scanVocalPaperMultiPhotos } from '../../../utils/vocalPaperToOrganizadorConverter';
import { scanManuscriptSheet, saveScanApiKey, getScanApiKey } from '../../../utils/toadaManuscriptScannerService';

const SHEETS = [
  { key: 'sequence', id: 'sequence', code: 'CHANT-SEQ', title: 'Feuille 1 — Séquence (Pux / Cor)', desc: 'Grille large M1..M32 A4 Paysage (Pux / Cor) + Aide-mémoire P1..P10.' },
  { key: 'notes', id: 'notes_1m', code: 'CHANT-NOTES-1M', title: 'Feuille 2 — Patterns & Notes (Clavier + Syllabes)', desc: '3 systèmes A4 Paysage (8 temps libres) : Piano Roll A (en bas) ➔ G# (en haut), OCT (3/4/5) & SYLLABES ouverte.' },
  { key: 'rhythm', id: 'rhythm_only', code: 'CHANT-RYTHME', title: 'Feuille 3 — Paroles & Rythme seul', desc: '6 systèmes A4 Paysage (32 subdivisions) : bande TEMPS libre, RYTHME (5.5mm) + SYLLABES ouverte (11mm).' },
  { key: 'instructions', id: 'instructions', code: 'CHANT-GUIDE', title: 'Feuille 4 — Guide & Instructions', desc: 'Mémo illustré A4 Paysage : grille 8 temps libres, traits (───), tirets "-" et élisions.' },
];

const PrintSvg = () => <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>;
const CamSvg = () => <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;

export default function VocalPaperOrganizadorModal({ isOpen, onClose, onApplyResult, tab1Lyrics = '', signature = '4/4', metadata = {}, initialTab = 'print', onOpenLegacyStylo }) {
  const [tab, setTab] = useState(initialTab), [photos, setPhotos] = useState([]), [scanMode, setScanMode] = useState('grid');
  const [cart, setCart] = useState({ sequence: 1, notes: 3, rhythm: 1, instructions: 0 });
  const [numberingMode, setNumberingMode] = useState('blank'), [previewSheet, setPreviewSheet] = useState(null);
  const [alsoFillVaral, setAlsoFillVaral] = useState(true), [isScanning, setIsScanning] = useState(false), [errorMsg, setErrorMsg] = useState(null);
  const [showKey, setShowKey] = useState(() => !getScanApiKey()), [keyDraft, setKeyDraft] = useState(() => getScanApiKey() || '');
  const fileRef = useRef(null);
  if (!isOpen) return null;

  const setQty = (k, v) => setCart((prev) => ({ ...prev, [k]: Math.max(0, Math.min(20, v)) }));
  const totalPages = cart.sequence + cart.notes + cart.rhythm + cart.instructions;

  const handlePrintBatch = () => {
    if (totalPages > 0) printOrganizadorHtmlDocument(buildOrganizadorVocalCartBatchHTML(cart, metadata, { patternNumberingMode: numberingMode, blankPatternLabels: numberingMode === 'blank' }));
  };

  const handleAddFiles = (e) => {
    Array.from(e.target.files || []).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) => { if (ev.target?.result) setPhotos((prev) => [...prev, { id: `ph-${Date.now()}-${Math.random()}`, name: file.name, dataUrl: ev.target.result }]); };
      r.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRunOpticalScan = async () => {
    if (photos.length === 0) return;
    if (keyDraft.trim()) saveScanApiKey(keyDraft.trim());
    setIsScanning(true); setErrorMsg(null);
    if (scanMode === 'stylo' && photos.length === 1) {
      const res = await scanManuscriptSheet(photos[0].dataUrl, { lang: 'pt', signature, tab1Lyrics, apiKey: keyDraft.trim() });
      setIsScanning(false);
      if (!res.success) { setErrorMsg(res.error); if (res.needsApiKey) setShowKey(true); return; }
      if (onApplyResult) onApplyResult(res.text, alsoFillVaral, null);
      onClose(); return;
    }
    const res = await scanVocalPaperMultiPhotos(photos.map((p) => p.dataUrl), { apiKey: keyDraft.trim(), signature, referenceLyrics: tab1Lyrics });
    setIsScanning(false);
    if (!res.success) { setErrorMsg(res.error); if (res.needsApiKey) setShowKey(true); return; }
    if (onApplyResult) onApplyResult(res.rawTxtCode, alsoFillVaral, res.parolesOriginales);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 overflow-y-auto">
      <div className="bg-[#fdfbf7] dark:bg-stone-900 rounded-lg shadow-2xl border-2 border-cordel-wood max-w-3xl w-full p-4 flex flex-col gap-2.5 text-left font-mono text-xs">
        <div className="flex items-center justify-between border-b-2 border-cordel-wood pb-2">
          <div className="flex items-center gap-2 text-cordel-wood"><PrintSvg /><div><h3 className="text-sm font-black uppercase text-stone-900 dark:text-stone-100">Atelier Papier du Chant (A4 Paysage 100 % N&B)</h3><p className="text-[10.5px] text-stone-600 dark:text-stone-400">Panier d'impression A4 Paysage monochrome & lecture optique multi-pages</p></div></div>
          <button type="button" onClick={onClose} className="px-2 py-0.5 rounded border border-stone-300 hover:bg-stone-100 font-bold cursor-pointer">✕</button>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-stone-300 pb-2">
          <button type="button" onClick={() => setTab('print')} className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer ${tab === 'print' ? 'bg-cordel-wood text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}><PrintSvg /><span>1. Panier d'Impression (A4 Paysage N&B)</span></button>
          <button type="button" onClick={() => setTab('scan')} className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer ${tab === 'scan' ? 'bg-cordel-wood text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}><CamSvg /><span>2. Photographier / Lire le Manuscrit (Multi-pages)</span></button>
        </div>

        {tab === 'print' ? (
          <div className="space-y-2">
            <div className="p-2 rounded bg-stone-100 border border-stone-300 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
              {[['blank', 'Laisser [ P__ ] vierge (numérotation libre à la main)'], ['continuous', 'Numéroter en continu sur tout le lot (P1..Pn)'], ['per_sheet', 'Numéroter P1..P3 par feuille']].map(([m, label]) => (
                <label key={m} className="inline-flex items-center gap-1 cursor-pointer"><input type="radio" name="orgPatNum" checked={numberingMode === m} onChange={() => setNumberingMode(m)} /><span>{label}</span></label>
              ))}
            </div>
            <div className="space-y-1.5">
              {SHEETS.map((sh) => {
                const qty = cart[sh.key];
                return (
                  <div key={sh.id} className={`p-2 rounded border flex flex-wrap items-center justify-between gap-2 ${qty > 0 ? 'border-cordel-wood bg-amber-50/40' : 'border-stone-300 bg-white opacity-80'}`}>
                    <div className="min-w-[200px] flex-1"><div className="flex items-center gap-2 font-bold text-stone-900"><span>{sh.title}</span><span className="text-[9.5px] px-1 border border-stone-800 rounded">[{sh.code}]</span></div><p className="text-[10px] text-stone-600 mt-0.5">{sh.desc}</p></div>
                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex items-center border border-stone-400 rounded bg-white"><button type="button" onClick={() => setQty(sh.key, qty - 1)} className="px-2 py-0.5 font-black cursor-pointer">-</button><span className="w-7 text-center font-black">{qty}</span><button type="button" onClick={() => setQty(sh.key, qty + 1)} className="px-2 py-0.5 font-black cursor-pointer">+</button></div>
                      {[0, 1, 3, 6].map((p) => <button key={p} type="button" onClick={() => setQty(sh.key, p)} className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${qty === p ? 'bg-cordel-wood text-white border-cordel-wood' : 'bg-white border-stone-300'}`}>{p}</button>)}
                      <button type="button" onClick={() => setPreviewSheet(previewSheet === sh.id ? null : sh.id)} className="px-2 py-0.5 rounded border border-stone-400 bg-white font-bold cursor-pointer">Aperçu</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {previewSheet && <div className="p-2 rounded border-2 border-cordel-wood bg-white space-y-1"><div className="flex items-center justify-between font-bold text-[11px]"><span>Aperçu A4 Paysage — {previewSheet}</span><button type="button" onClick={() => setPreviewSheet(null)} className="px-1.5 py-0.5 border border-stone-400 rounded cursor-pointer">Fermer</button></div><iframe title="Aperçu A4 Paysage" srcDoc={buildOrganizadorVocalSheetHTML(previewSheet, metadata, { patternNumberingMode: numberingMode, blankPatternLabels: numberingMode === 'blank' })} className="w-full h-56 border border-stone-400 rounded bg-white" /></div>}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-stone-300">
              {onOpenLegacyStylo ? <button type="button" onClick={() => { onClose(); onOpenLegacyStylo(); }} className="px-2.5 py-1 rounded border border-stone-400 bg-white font-bold cursor-pointer">Feuille Stylo pré-remplie</button> : <span className="text-[10.5px] font-bold">Format A4 Paysage • Monochrome strict</span>}
              <button type="button" disabled={totalPages <= 0} onClick={handlePrintBatch} className="px-3.5 py-1.5 rounded bg-cordel-wood text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"><PrintSvg /><span>Imprimer le lot sélectionné ({totalPages} feuille{totalPages > 1 ? 's' : ''} A4 Paysage)</span></button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-stone-100 border border-stone-300">
              <div className="flex items-center gap-2"><button type="button" onClick={() => setScanMode('grid')} className={`px-2.5 py-1 rounded font-bold cursor-pointer ${scanMode === 'grid' ? 'bg-cordel-wood text-white' : 'bg-white border border-stone-300'}`}>Grilles Atelier Papier (Séquence + Patterns)</button><button type="button" onClick={() => setScanMode('stylo')} className={`px-2.5 py-1 rounded font-bold cursor-pointer ${scanMode === 'stylo' ? 'bg-cordel-wood text-white' : 'bg-white border border-stone-300'}`}>Feuille Stylo libre</button></div>
              <div className="flex items-center gap-1.5"><button type="button" onClick={() => setShowKey((v) => !v)} className="px-2 py-1 rounded border border-stone-400 bg-white font-bold cursor-pointer">Clé optique</button><button type="button" onClick={() => fileRef.current?.click()} className="px-2.5 py-1 rounded bg-cordel-wood text-white font-bold cursor-pointer">+ Ajouter photo(s)</button><input ref={fileRef} type="file" accept="image/*" multiple onChange={handleAddFiles} className="hidden" /></div>
            </div>
            {showKey && <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-300"><input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder="Clé d'accès du service de lecture optique..." className="flex-1 px-2 py-1 rounded border border-stone-300 bg-white" /><button type="button" onClick={() => { saveScanApiKey(keyDraft); setShowKey(false); }} className="px-2.5 py-1 rounded bg-cordel-wood text-white font-bold cursor-pointer">Enregistrer</button></div>}
            {photos.length === 0 ? <div onClick={() => fileRef.current?.click()} className="py-5 border-2 border-dashed border-stone-300 rounded text-center cursor-pointer hover:bg-stone-50 flex flex-col items-center gap-1"><CamSvg /><div className="font-bold">Cliquez pour ajouter vos photos (Feuille Séquence + Feuilles Patterns P1..Pn)</div></div> : <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{photos.map((p, idx) => <div key={p.id} className="p-1.5 rounded border border-stone-300 bg-white flex flex-col gap-1"><img src={p.dataUrl} alt={p.name} className="h-16 w-full object-cover rounded" /><div className="flex items-center justify-between text-[10px] font-bold"><span>Page {idx + 1}</span><button type="button" onClick={() => setPhotos((arr) => arr.filter((x) => x.id !== p.id))} className="text-red-600 font-bold cursor-pointer">✕</button></div></div>)}</div>}
            <div className="flex items-center justify-between pt-2 border-t border-stone-300">
              <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer"><input type="checkbox" checked={alsoFillVaral} onChange={(e) => setAlsoFillVaral(e.target.checked)} /><span>Mettre à jour les paroles soulignées (<u>syllabes</u>) sur la Fiche Varal</span></label>
              <button type="button" disabled={photos.length === 0 || isScanning} onClick={handleRunOpticalScan} className="px-3.5 py-1.5 rounded bg-cordel-wood text-white font-bold cursor-pointer disabled:opacity-50">{isScanning ? 'Lecture optique en cours...' : 'Lire et appliquer le manuscrit'}</button>
            </div>
            {errorMsg && <div className="p-2 rounded bg-red-50 border border-red-300 text-red-700 font-bold">{errorMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
