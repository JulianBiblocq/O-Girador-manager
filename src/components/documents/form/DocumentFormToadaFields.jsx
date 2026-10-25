import React, { useState, useEffect } from 'react';
import ToadaAudioWitnessField from './ToadaAudioWitnessField';
import ToadaHeaderMetadataForm from '../toada/ToadaHeaderMetadataForm';
import ToadaMusicalStructureEditor from '../toada/ToadaMusicalStructureEditor';
import ToadaChantTabFields from './ToadaChantTabFields';
import { cleanHistoricalHtml } from '../../../utils/toadaHtmlCleaner';

export default function DocumentFormToadaFields({
  category = 'Toadas',
  titre = '',
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  nacao = '',
  setNacao,
  rythme = '',
  setRythme,
  signature = '4/4',
  setSignature,
  bpmDefaut = '',
  setBpmDefaut,
  tonaliteDefaut = '',
  setTonaliteDefaut,
  audioUploadType = 'file',
  setAudioUploadType,
  audioFile = null,
  setAudioFile,
  audioUrl = '',
  setAudioUrl,
  parolesOriginales = '',
  setParolesOriginales,
  rawTxtCode = '',
  setRawTxtCode,
  parolesPhonetiques = '',
  setParolesPhonetiques,
  traduction = '',
  setTraduction,
  anecdote = '',
  setAnecdote,
  isSubmitting = false
}) {
  const [localActiveTab, setLocalActiveTab] = useState('chant');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  useEffect(() => {
    if (parolesOriginales && typeof parolesOriginales === 'string') {
      let cleaned = parolesOriginales;
      if (/<[a-z][\s\S]*>/i.test(cleaned)) cleaned = cleanHistoricalHtml(cleaned);
      if (/\[(?:[1-9]|1[0-2])\]|_|\[sig:[^\]]+\]/i.test(cleaned)) {
        cleaned = cleaned.replace(/\[(?:[1-9]|1[0-2])\]/g, '').replace(/\[sig:[^\]]+\]/gi, '').replace(/_/g, '').replace(/\s{2,}/g, ' ').trim();
      }
      if (cleaned !== parolesOriginales && setParolesOriginales) setParolesOriginales(cleaned);
    }
    if (parolesPhonetiques && /<[a-z][\s\S]*>/i.test(parolesPhonetiques) && setParolesPhonetiques) {
      setParolesPhonetiques(cleanHistoricalHtml(parolesPhonetiques));
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4 text-left w-full">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Origine / Auteur</label>
          <input type="text" value={nacao} onChange={(e) => setNacao(e.target.value)} disabled={isSubmitting} placeholder="Ex: Porto Rico" className="theme-input w-full text-xs" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{category === 'Culture' ? "Période" : "Rythme"}</label>
          <input type="text" value={rythme} onChange={(e) => setRythme(e.target.value)} disabled={isSubmitting} placeholder={category === 'Culture' ? "19ème Siècle" : "Baque de Virada"} className="theme-input w-full text-xs" />
        </div>
      </div>

      {category === 'Toadas' && (
        <ToadaHeaderMetadataForm signature={signature} onChangeSignature={setSignature} bpmDefaut={bpmDefaut} onChangeBpm={setBpmDefaut} tonaliteDefaut={tonaliteDefaut} onChangeTonalite={setTonaliteDefaut} disabled={isSubmitting} />
      )}

      <ToadaAudioWitnessField audioUploadType={audioUploadType} setAudioUploadType={setAudioUploadType} audioFile={audioFile} setAudioFile={setAudioFile} audioUrl={audioUrl} setAudioUrl={setAudioUrl} isSubmitting={isSubmitting} />

      {category === 'Toadas' && (
        <div className="flex items-center gap-2 border-b-2 border-cordel-master-dark/20 pt-2 pb-1">
          <button
            type="button" onClick={() => setActiveTab('chant')}
            className={`px-3 py-1.5 rounded-t text-[10px] font-black uppercase cursor-pointer transition-all ${
              activeTab === 'chant' ? 'bg-cordel-wood text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            📖 Fiche Chant (Varal & Impression)
          </button>
          <button
            type="button" onClick={() => setActiveTab('structure')}
            className={`px-3 py-1.5 rounded-t text-[10px] font-black uppercase cursor-pointer transition-all ${
              activeTab === 'structure' ? 'bg-cordel-wood text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🎼 Structure Musicale (Cantador & Sequenciador)
          </button>
        </div>
      )}

      {(category !== 'Toadas' || activeTab === 'chant') && (
        <ToadaChantTabFields
          category={category} parolesOriginales={parolesOriginales} setParolesOriginales={setParolesOriginales}
          parolesPhonetiques={parolesPhonetiques} setParolesPhonetiques={setParolesPhonetiques}
          traduction={traduction} setTraduction={setTraduction} anecdote={anecdote} setAnecdote={setAnecdote} disabled={isSubmitting}
        />
      )}

      {category === 'Toadas' && activeTab === 'structure' && (
        <ToadaMusicalStructureEditor
          value={rawTxtCode} onChange={setRawTxtCode} tab1Lyrics={parolesOriginales}
          onUpdateTab1Lyrics={setParolesOriginales} signature={signature} onChangeSignature={setSignature}
          bpmDefaut={bpmDefaut} tonaliteDefaut={tonaliteDefaut} rythme={rythme} titre={titre} disabled={isSubmitting}
        />
      )}
    </div>
  );
}
