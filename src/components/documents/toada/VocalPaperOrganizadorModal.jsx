/**
 * VocalPaperOrganizadorModal.jsx
 * Modale « Atelier Papier du Chant (A4 100 % N&B) » dans Organizador (< 135 lignes).
 * Impression des feuilles A4 N&B (Grille Paysage 8 Temps Libres sur Feuilles 2 & 3) et lecture optique multi-photos.
 */
import React, { useState, useRef } from 'react';
import { printOrganizadorVocalSheet } from '../../../utils/vocalPaperSheetPrinter';
import { scanVocalPaperMultiPhotos } from '../../../utils/vocalPaperToOrganizadorConverter';
import { scanManuscriptSheet, saveScanApiKey, getScanApiKey } from '../../../utils/toadaManuscriptScannerService';

const SHEETS = [
  { id: 'sequence', code: 'CHANT-SEQ', title: 'Feuille 1 — Séquence & Paroles (Pux / Cor)', desc: 'Grille M1..M32 sur 2 lignes (Pux / Cor) pour attribuer P1..Pn, X (Pause) et Unisson.' },
  { id: 'notes_1m', code: 'CHANT-NOTES-1M', title: 'Feuille 2 — Patterns & Clavier 1 Octave (Paysage • 8 Temps Libres)', desc: '4 systèmes [ P__ ] A4 Paysage (32 subdivisions de 8.4mm) : TEMPS libre (1M+Ana ou 2M), OCTAVE (3/4/5), Clavier La➔Sol# & SYLLABES ouverte.' },
  { id: 'rhythm_only', code: 'CHANT-RYTHME', title: 'Feuille 3 — Paroles & Rythme Seul (Paysage • 8 Temps Libres)', desc: '6 systèmes [ P__ ] A4 Paysage (32 subdivisions de 8.4mm) : bande TEMPS libre, bande RYTHME (5.5mm) + bande SYLLABES ouverte (11mm).' },
  { id: 'instructions', code: 'CHANT-GUIDE', title: "Feuille 4 — Guide & Conventions d'écriture", desc: 'Mémo illustré : grille 8 temps libres (2|3|4|1|2|3|4|1 ou 2M), tirets "-" intra-mots, élisions "E\'O" et traits (───).' },
];

const PrintSvg = () => <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" /></svg>;
const CamSvg = () => <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;

export default function VocalPaperOrganizadorModal({ isOpen, onClose, onApplyResult, tab1Lyrics = '', signature = '4/4', metadata = {}, initialTab = 'print', onOpenLegacyStylo }) {
  const [tab, setTab] = useState(initialTab), [photos, setPhotos] = useState([]), [scanMode, setScanMode] = useState('grid');
  const [alsoFillVaral, setAlsoFillVaral] = useState(true), [isScanning, setIsScanning] = useState(false), [errorMsg, setErrorMsg] = useState(null);
  const [showKey, setShowKey] = useState(() => !getScanApiKey()), [keyDraft, setKeyDraft] = useState(() => getScanApiKey() || '');
  const fileRef = useRef(null);
  if (!isOpen) return null;

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
      <div className="bg-[#fdfbf7] dark:bg-stone-900 rounded-lg shadow-2xl border-2 border-cordel-wood max-w-3xl w-full p-4 flex flex-col gap-3 text-left font-mono text-xs">
        <div className="flex items-center justify-between border-b-2 border-cordel-wood pb-2">
          <div className="flex items-center gap-2 text-cordel-wood">
            <PrintSvg />
            <div>
              <h3 className="text-sm font-black uppercase text-stone-900 dark:text-stone-100">Atelier Papier du Chant (A4 100 % N&B)</h3>
              <p className="text-[10.5px] text-stone-600 dark:text-stone-400">Impression A4 monochrome & lecture optique multi-pages (Séquence + Patterns P1..Pn)</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="px-2 py-0.5 rounded border border-stone-300 hover:bg-stone-100 font-bold cursor-pointer">✕</button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-stone-300 pb-2">
          <button type="button" onClick={() => setTab('print')} className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer ${tab === 'print' ? 'bg-cordel-wood text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}><PrintSvg /><span>1. Imprimer Feuilles Vierges (100 % N&B)</span></button>
          <button type="button" onClick={() => setTab('scan')} className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 cursor-pointer ${tab === 'scan' ? 'bg-cordel-wood text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}><CamSvg /><span>2. Photographier / Lire le Manuscrit (Multi-pages)</span></button>
        </div>

        {tab === 'print' ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHEETS.map((sh) => (
                <div key={sh.id} className="p-2.5 rounded border border-stone-300 bg-white dark:bg-stone-800 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-1 font-bold text-stone-900 dark:text-stone-100"><span>{sh.title}</span><span className="text-[9.5px] px-1 border border-stone-800 rounded">[{sh.code}]</span></div>
                    <p className="text-[10.5px] text-stone-600 dark:text-stone-300 mt-1">{sh.desc}</p>
                  </div>
                  <button type="button" onClick={() => printOrganizadorVocalSheet(sh.id, metadata)} className="self-end px-2.5 py-1 rounded bg-cordel-wood text-white font-bold flex items-center gap-1 cursor-pointer"><PrintSvg /><span>Imprimer A4 N&B</span></button>
                </div>
              ))}
            </div>
            {onOpenLegacyStylo && (
              <div className="flex items-center justify-between p-2 rounded bg-stone-100 border border-stone-300">
                <span className="text-[11px] font-bold">Imprimer la feuille à lignes pré-remplies avec les paroles saisies ?</span>
                <button type="button" onClick={() => { onClose(); onOpenLegacyStylo(); }} className="px-2.5 py-1 rounded border border-stone-400 bg-white font-bold cursor-pointer">Feuille Stylo pré-remplie</button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-stone-100 border border-stone-300">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setScanMode('grid')} className={`px-2.5 py-1 rounded font-bold cursor-pointer ${scanMode === 'grid' ? 'bg-cordel-wood text-white' : 'bg-white border border-stone-300'}`}>Grilles Atelier Papier (Séquence + Patterns)</button>
                <button type="button" onClick={() => setScanMode('stylo')} className={`px-2.5 py-1 rounded font-bold cursor-pointer ${scanMode === 'stylo' ? 'bg-cordel-wood text-white' : 'bg-white border border-stone-300'}`}>Feuille Stylo libre</button>
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setShowKey((v) => !v)} className="px-2 py-1 rounded border border-stone-400 bg-white font-bold cursor-pointer">Clé optique</button>
                <button type="button" onClick={() => fileRef.current?.click()} className="px-2.5 py-1 rounded bg-cordel-wood text-white font-bold cursor-pointer">+ Ajouter photo(s)</button>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleAddFiles} className="hidden" />
              </div>
            </div>
            {showKey && (
              <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-300">
                <input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder="Clé d'accès du service de lecture optique..." className="flex-1 px-2 py-1 rounded border border-stone-300 bg-white" />
                <button type="button" onClick={() => { saveScanApiKey(keyDraft); setShowKey(false); }} className="px-2.5 py-1 rounded bg-cordel-wood text-white font-bold cursor-pointer">Enregistrer</button>
              </div>
            )}
            {photos.length === 0 ? (
              <div onClick={() => fileRef.current?.click()} className="py-5 border-2 border-dashed border-stone-300 rounded text-center cursor-pointer hover:bg-stone-50 flex flex-col items-center gap-1"><CamSvg /><div className="font-bold">Cliquez pour ajouter vos photos (Feuille Séquence + Feuilles Patterns P1..Pn)</div></div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photos.map((p, idx) => (
                  <div key={p.id} className="p-1.5 rounded border border-stone-300 bg-white flex flex-col gap-1">
                    <img src={p.dataUrl} alt={p.name} className="h-16 w-full object-cover rounded" />
                    <div className="flex items-center justify-between text-[10px] font-bold"><span>Page {idx + 1}</span><button type="button" onClick={() => setPhotos((arr) => arr.filter((x) => x.id !== p.id))} className="text-red-600 font-bold cursor-pointer">✕</button></div>
                  </div>
                ))}
              </div>
            )}
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
