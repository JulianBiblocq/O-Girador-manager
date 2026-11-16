/**
 * VocalPaperOrganizadorModal.jsx
 * Modale « Atelier Papier du Chant (5 feuilles A4 Paysage 100 % N&B) » dans Organizador (< 142 lignes).
 * Contraste Jour / Nuit Cordel garanti sur les cartes (qty > 0 et qty === 0), les contrôles et le bandeau récapitulatif.
 */
import React, { useState, useRef } from 'react';
import { buildOrganizadorVocalSheetHTML, buildOrganizadorVocalCartBatchHTML, printOrganizadorHtmlDocument } from '../../../utils/vocalPaperSheetPrinter';
import { scanVocalPaperMultiPhotos } from '../../../utils/vocalPaperToOrganizadorConverter';
import { scanManuscriptSheet, saveScanApiKey, getScanApiKey } from '../../../utils/toadaManuscriptScannerService';

export const ORGANIZADOR_VOCAL_SHEETS = [
  { key: 'sequence', id: 'sequence', code: 'CHANT-SEQ', title: 'Feuille 1 — Séquence (Pux / Cor)', desc: 'Grille large M1..M32 A4 Paysage (Pux / Cor) + Aide-mémoire P1..P10.' },
  { key: 'notes', id: 'notes_1m', code: 'CHANT-NOTES-1M', title: 'Feuille 2 — Patterns & Notes (Clavier + Syllabes)', desc: '3 systèmes A4 Paysage (8 temps libres) : Piano Roll A (en bas) ➔ G# (en haut), OCT (3/4/5) & SYLLABES ouverte.' },
  { key: 'rhythm', id: 'rhythm_only', code: 'CHANT-RYTHME', title: 'Feuille 3 — Paroles & Rythme seul', desc: '6 systèmes A4 Paysage (32 subdivisions) : bande TEMPS libre, RYTHME (5.5mm) + SYLLABES ouverte (11mm).' },
  { key: 'instructions', id: 'instructions', code: 'CHANT-GUIDE', title: 'Feuille 4 — Guide & Instructions', desc: 'Mémo illustré A4 Paysage : grille 8 temps libres, traits (───), tirets "-" et élisions.' },
  { key: 'tab4e', id: 'tab_4e', code: 'CHANT-TAB-4E', title: 'Feuille 5 — Tablature 4 Étages', desc: '5 systèmes A4 Paysage (4 bandes : TEMPS / SUBDIV. 4, 2+2, 4/4 / NOTES ou 0 / SYLLABES et _).' },
];

const PrintSvg = () => <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>;
const CamSvg = () => <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;
const CheckSvg = () => <svg className="w-4 h-4 shrink-0 text-emerald-800 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>;

const BTN_IDLE = 'border border-[#bfa98a] dark:border-[#4a392d] bg-[#faf5e8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#f5ebd6] hover:bg-[#e5d5b5] dark:hover:bg-[#2a1f18]';
const BTN_ACT = 'bg-[#9a3412] dark:bg-[#c2410c] text-white border border-[#9a3412] dark:border-[#c2410c]';

export default function VocalPaperOrganizadorModal({ isOpen, onClose, onApplyResult, tab1Lyrics = '', signature = '4/4', metadata = {}, initialTab = 'print', onOpenLegacyStylo }) {
  const [tab, setTab] = useState(initialTab), [photos, setPhotos] = useState([]), [scanMode, setScanMode] = useState('grid');
  const [cart, setCart] = useState({ sequence: 1, notes: 3, rhythm: 1, instructions: 0, tab4e: 0 });
  const [numberingMode, setNumberingMode] = useState('blank'), [prefillTab4E, setPrefillTab4E] = useState(false), [previewSheet, setPreviewSheet] = useState(null);
  const [alsoFillVaral, setAlsoFillVaral] = useState(true), [isScanning, setIsScanning] = useState(false), [errorMsg, setErrorMsg] = useState(null);
  const [showKey, setShowKey] = useState(() => !getScanApiKey()), [keyDraft, setKeyDraft] = useState(() => getScanApiKey() || '');
  const fileRef = useRef(null);
  if (!isOpen) return null;

  const setQty = (k, v) => setCart((prev) => ({ ...prev, [k]: Math.max(0, Math.min(20, v)) }));
  const totalPages = cart.sequence + cart.notes + cart.rhythm + cart.instructions + (cart.tab4e || 0);
  const prefillPatterns = tab1Lyrics
    ? String(tab1Lyrics).replace(/<[^>]+>/g, ' ').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l, i) => ({ code: `P${i + 1}`, lyricsText: l }))
    : [];
  const printOpts = { patternNumberingMode: numberingMode, blankPatternLabels: numberingMode === 'blank', prefillFromProject: prefillTab4E, prefillPatterns };
  const handlePrintBatch = () => { if (totalPages > 0) printOrganizadorHtmlDocument(buildOrganizadorVocalCartBatchHTML(cart, metadata, printOpts)); };

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
      <div className="bg-[#f4ecd8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#f5ebd6] rounded-lg shadow-2xl border-2 border-[#9a3412] dark:border-[#c2410c] max-w-3xl w-full p-4 flex flex-col gap-2.5 text-left font-mono text-xs">
        <div className="flex items-center justify-between border-b-2 border-[#9a3412] dark:border-[#c2410c] pb-2">
          <div className="flex items-center gap-2 text-[#9a3412] dark:text-[#fdba74]"><PrintSvg /><div><h3 className="text-sm font-black uppercase text-[#1c1613] dark:text-[#f5ebd6]">Atelier Papier du Chant (5 feuilles A4 Paysage 100 % N&B)</h3><p className="text-[10.5px] text-[#4a3b31] dark:text-[#cbbba0]">Panier d&apos;impression A4 Paysage monochrome &amp; lecture optique multi-pages</p></div></div>
          <button type="button" onClick={onClose} className={`select-none px-2 py-0.5 rounded font-bold cursor-pointer ${BTN_IDLE}`}>✕</button>
        </div>
        <div className="flex flex-wrap gap-1.5 border-b border-[#9a3412]/30 dark:border-[#4a392d] pb-2 select-none">
          <button type="button" onClick={() => setTab('print')} className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer ${tab === 'print' ? BTN_ACT : BTN_IDLE}`}><PrintSvg /><span>1. Panier d&apos;Impression (A4 Paysage N&amp;B)</span></button>
          <button type="button" onClick={() => setTab('scan')} className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer ${tab === 'scan' ? BTN_ACT : BTN_IDLE}`}><CamSvg /><span>2. Photographier / Lire le Manuscrit (Multi-pages)</span></button>
        </div>

        {tab === 'print' ? (
          <div className="space-y-2">
            <div className="p-2 rounded bg-[#efe6d0] dark:bg-[#211a15] text-[#1c1613] dark:text-[#f5ebd6] border border-[#9a3412]/30 dark:border-[#4a392d] flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold select-none">
              {[['blank', '[ P__ ] vierge'], ['continuous', 'Continu (P1..Pn)'], ['per_sheet', 'Par feuille']].map(([m, label]) => (
                <label key={m} className="inline-flex items-center gap-1 cursor-pointer"><input type="radio" name="orgPatNum" checked={numberingMode === m} onChange={() => setNumberingMode(m)} className="accent-[#9a3412]" /><span>{label}</span></label>
              ))}
              <label className="inline-flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={prefillTab4E} onChange={(e) => setPrefillTab4E(e.target.checked)} className="accent-[#9a3412]" /><span>Pré-remplir paroles sur Feuille 5</span></label>
            </div>
            <div className="space-y-1.5">
              {ORGANIZADOR_VOCAL_SHEETS.map((sh) => {
                const qty = cart[sh.key] || 0, active = qty > 0;
                const cardCls = active ? 'bg-[#efe4cc] border-[#9a3412] text-[#1c1613] dark:bg-[#2a1f18] dark:border-[#c2410c] dark:text-[#f5ebd6]' : 'bg-[#f8f2e4] border-[#cbbba0] text-[#3a2e26] dark:bg-[#1b1511] dark:border-[#3d2f25] dark:text-[#d6c8b2]';
                const badgeCls = active ? 'bg-[#faf5e8] text-[#1c1613] border-[#9a3412]/55 dark:bg-[#16120e] dark:text-[#f5ebd6] dark:border-[#c2410c]/70' : 'bg-[#efe6d0] text-[#4a3b31] border-[#b5a48b] dark:bg-[#14100d] dark:text-[#cbbba0] dark:border-[#4a392d]';
                return (
                  <div key={sh.id} className={`p-2 rounded border-2 flex flex-wrap items-center justify-between gap-2 transition-colors ${cardCls}`}>
                    <div className="min-w-[200px] flex-1"><div className="flex items-center gap-2 font-bold"><span>{sh.title}</span><span className={`text-[9.5px] px-1 border rounded font-bold ${badgeCls}`}>[{sh.code}]</span></div><p className={`text-[10px] mt-0.5 ${active ? 'text-[#4a3b31] dark:text-[#cbbba0]' : 'text-[#5c4b3e] dark:text-[#9c8c76]'}`}>{sh.desc}</p></div>
                    <div className="flex items-center gap-1.5 select-none">
                      <div className="inline-flex items-center border border-[#9a3412]/40 dark:border-[#5c4333] rounded overflow-hidden bg-[#faf5e8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#f5ebd6]"><button type="button" onClick={() => setQty(sh.key, qty - 1)} className="select-none px-2 py-0.5 font-black hover:bg-[#e5d5b5] dark:hover:bg-[#36281f] cursor-pointer">-</button><span className="select-none w-7 text-center font-black">{qty}</span><button type="button" onClick={() => setQty(sh.key, qty + 1)} className="select-none px-2 py-0.5 font-black hover:bg-[#e5d5b5] dark:hover:bg-[#36281f] cursor-pointer">+</button></div>
                      {[0, 1, 3, 6].map((p) => <button key={p} type="button" onClick={() => setQty(sh.key, p)} className={`select-none px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${qty === p ? BTN_ACT : BTN_IDLE}`}>{p}</button>)}
                      <button type="button" onClick={() => setPreviewSheet(previewSheet === sh.id ? null : sh.id)} className={`select-none px-2 py-0.5 rounded font-bold cursor-pointer ${BTN_IDLE}`}>Aperçu</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {previewSheet && <div className="p-2 rounded border-2 border-[#9a3412] bg-white text-black space-y-1 select-none"><div className="flex items-center justify-between font-bold text-[11px] bg-white text-black"><span>Aperçu A4 Paysage — {previewSheet}</span><button type="button" onClick={() => setPreviewSheet(null)} className="px-1.5 py-0.5 border border-black bg-stone-100 hover:bg-stone-200 text-black rounded cursor-pointer">Fermer</button></div><iframe title="Aperçu A4 Paysage" srcDoc={buildOrganizadorVocalSheetHTML(previewSheet, metadata, printOpts)} className="w-full h-56 border border-black rounded bg-white text-black" /></div>}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded bg-[#efe4cc] text-[#1c1613] border border-[#9a3412]/40 dark:bg-[#241c16] dark:text-[#f5ebd6] dark:border-[#c2410c]/50">
              {onOpenLegacyStylo ? <button type="button" onClick={() => { onClose(); onOpenLegacyStylo(); }} className={`select-none px-2.5 py-1 rounded font-bold cursor-pointer ${BTN_IDLE}`}>Feuille Stylo pré-remplie</button> : <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold"><CheckSvg /><span>Ouverture directe en A4 Paysage • 100 % N&amp;B monochrome strict.</span></span>}
              <button type="button" disabled={totalPages <= 0} onClick={handlePrintBatch} className="select-none px-3.5 py-1.5 rounded bg-[#9a3412] hover:bg-[#7c2d12] dark:bg-[#c2410c] dark:hover:bg-[#ea580c] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"><PrintSvg /><span>Imprimer le lot sélectionné ({totalPages} feuille{totalPages > 1 ? 's' : ''} A4 Paysage)</span></button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-[#efe6d0] dark:bg-[#211a15] border border-[#9a3412]/30 dark:border-[#4a392d] select-none">
              <div className="flex items-center gap-2"><button type="button" onClick={() => setScanMode('grid')} className={`px-2.5 py-1 rounded font-bold cursor-pointer ${scanMode === 'grid' ? BTN_ACT : BTN_IDLE}`}>Grilles Atelier Papier (Séquence + Patterns)</button><button type="button" onClick={() => setScanMode('stylo')} className={`px-2.5 py-1 rounded font-bold cursor-pointer ${scanMode === 'stylo' ? BTN_ACT : BTN_IDLE}`}>Feuille Stylo libre</button></div>
              <div className="flex items-center gap-1.5"><button type="button" onClick={() => setShowKey((v) => !v)} className={`px-2 py-1 rounded font-bold cursor-pointer ${BTN_IDLE}`}>Clé optique</button><button type="button" onClick={() => fileRef.current?.click()} className="px-2.5 py-1 rounded bg-[#9a3412] dark:bg-[#c2410c] text-white font-bold cursor-pointer">+ Ajouter photo(s)</button><input ref={fileRef} type="file" accept="image/*" multiple onChange={handleAddFiles} className="hidden" /></div>
            </div>
            {showKey && <div className="flex items-center gap-2 p-2 rounded bg-[#efe4cc] text-[#1c1613] border border-[#9a3412]/40 dark:bg-[#241c16] dark:text-[#f5ebd6] dark:border-[#c2410c]/50"><input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder="Clé d'accès du service de lecture optique..." className="flex-1 px-2 py-1 rounded border border-[#9a3412]/35 dark:border-[#5c4333] bg-[#faf5e8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#f5ebd6]" /><button type="button" onClick={() => { saveScanApiKey(keyDraft); setShowKey(false); }} className="select-none px-2.5 py-1 rounded bg-[#9a3412] dark:bg-[#c2410c] text-white font-bold cursor-pointer">Enregistrer</button></div>}
            {photos.length === 0 ? <div onClick={() => fileRef.current?.click()} className="py-5 border-2 border-dashed border-[#9a3412]/40 dark:border-[#5c4333] bg-[#efe6d0] dark:bg-[#211a15] text-[#4a3b31] dark:text-[#cbbba0] rounded text-center cursor-pointer hover:text-[#1c1613] dark:hover:text-[#f5ebd6] flex flex-col items-center gap-1 select-none"><CamSvg /><div className="font-bold">Cliquez pour ajouter vos photos (Feuille Séquence + Feuilles Patterns P1..Pn)</div></div> : <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">{photos.map((p, idx) => <div key={p.id} className="p-1.5 rounded border border-[#9a3412]/35 dark:border-[#4a392d] bg-[#faf5e8] dark:bg-[#16120e] text-[#1c1613] dark:text-[#f5ebd6] flex flex-col gap-1"><img src={p.dataUrl} alt={p.name} className="h-16 w-full object-cover rounded bg-white" /><div className="flex items-center justify-between text-[10px] font-bold"><span>Page {idx + 1}</span><button type="button" onClick={() => setPhotos((arr) => arr.filter((x) => x.id !== p.id))} className="text-red-700 dark:text-red-400 font-bold cursor-pointer">✕</button></div></div>)}</div>}
            <div className="flex items-center justify-between pt-2 border-t border-[#9a3412]/30 dark:border-[#4a392d] select-none">
              <label className="inline-flex items-center gap-1.5 font-bold cursor-pointer"><input type="checkbox" checked={alsoFillVaral} onChange={(e) => setAlsoFillVaral(e.target.checked)} className="accent-[#9a3412]" /><span>Mettre à jour les paroles soulignées (<u>syllabes</u>) sur la Fiche Varal</span></label>
              <button type="button" disabled={photos.length === 0 || isScanning} onClick={handleRunOpticalScan} className="px-3.5 py-1.5 rounded bg-[#9a3412] dark:bg-[#c2410c] text-white font-bold cursor-pointer disabled:opacity-50">{isScanning ? 'Lecture optique en cours...' : 'Lire et appliquer le manuscrit'}</button>
            </div>
            {errorMsg && <div className="p-2 rounded bg-red-100 dark:bg-red-950/60 border border-red-700/40 dark:border-red-500/40 text-red-950 dark:text-red-200 font-bold">{errorMsg}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
