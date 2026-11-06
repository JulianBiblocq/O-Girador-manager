import React, { useState } from 'react';
import ToadaAudioWitnessField from './ToadaAudioWitnessField';
import ToadaHeaderMetadataForm from '../toada/ToadaHeaderMetadataForm';
import ToadaMusicalStructureEditor from '../toada/ToadaMusicalStructureEditor';
import ToadaChantTabFields from './ToadaChantTabFields';

export function formatCantadorLockedTonalite(tonaliteDefaut = '', tonaliteChanteeOrigine = '', transpositionSemitones = undefined) {
  if (!tonaliteDefaut) return '';
  const hasShift = transpositionSemitones !== undefined && transpositionSemitones !== null && Number(transpositionSemitones) !== 0;
  const stBadge = hasShift ? `${Number(transpositionSemitones) > 0 ? '+' : ''}${Number(transpositionSemitones)} st` : '0 st';
  if (tonaliteChanteeOrigine) {
    const shortOrig = String(tonaliteChanteeOrigine).split(/\s+/)[0] || tonaliteChanteeOrigine;
    return `🔒 ${tonaliteDefaut} (prise chantée en ${shortOrig} • ${stBadge})`;
  }
  if (hasShift) return `🔒 ${tonaliteDefaut} (${stBadge})`;
  return `🔒 ${tonaliteDefaut}`;
}

export default function DocumentFormToadaFields({
  category = 'Toadas', titre = '', activeTab: propActiveTab, setActiveTab: propSetActiveTab,
  nacao = '', setNacao, rythme = '', setRythme, signature = '4/4', setSignature,
  bpmDefaut = '', setBpmDefaut, tonaliteDefaut = '', setTonaliteDefaut,
  tonaliteChanteeOrigine = '', transpositionSemitones = undefined, cantadorToadaId = '',
  audioUploadType = 'file', setAudioUploadType, audioFile = null, setAudioFile,
  audioUrl = '', setAudioUrl, videoUrl = '', setVideoUrl,
  cantadorValidated = false, setCantadorValidated, parolesOriginales = '', setParolesOriginales,
  rawTxtCode = '', setRawTxtCode, parolesPhonetiques = '', setParolesPhonetiques,
  traduction = '', setTraduction, anecdote = '', setAnecdote, isSubmitting = false
}) {
  const [localActiveTab, setLocalActiveTab] = useState('chant');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

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
        <ToadaHeaderMetadataForm
          signature={signature} onChangeSignature={setSignature}
          bpmDefaut={bpmDefaut} onChangeBpm={setBpmDefaut}
          tonaliteDefaut={tonaliteDefaut} onChangeTonalite={setTonaliteDefaut}
          tonaliteChanteeOrigine={tonaliteChanteeOrigine}
          transpositionSemitones={transpositionSemitones}
          cantadorToadaId={cantadorToadaId}
          cantadorValidated={cantadorValidated}
          lockedTonaliteDisplay={formatCantadorLockedTonalite(tonaliteDefaut, tonaliteChanteeOrigine, transpositionSemitones)}
          disabled={isSubmitting}
        />
      )}

      <ToadaAudioWitnessField
        category={category}
        audioUploadType={audioUploadType}
        setAudioUploadType={setAudioUploadType}
        audioFile={audioFile}
        setAudioFile={setAudioFile}
        audioUrl={audioUrl}
        setAudioUrl={setAudioUrl}
        videoUrl={videoUrl}
        setVideoUrl={setVideoUrl}
        cantadorValidated={cantadorValidated}
        setCantadorValidated={setCantadorValidated}
        isSubmitting={isSubmitting}
      />

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
