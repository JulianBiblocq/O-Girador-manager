import React, { useState } from 'react';
import RichTextEditor from '../../RichTextEditor';
import ToadaAudioWitnessField from './ToadaAudioWitnessField';
import ToadaHeaderMetadataForm from '../toada/ToadaHeaderMetadataForm';
import ToadaMeasureEditor from '../toada/ToadaMeasureEditor';

/**
 * Sous-formulaire modulaire pour la saisie des chants et Toadas (< 140 lignes) :
 * Métadonnées musicales d'en-tête, grille 2 colonnes (Originale & Phonétique),
 * éditeur par mesure (.txt) ou texte riche, et audio témoin.
 */
export default function DocumentFormToadaFields({
  category = 'Toadas',
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
  parolesPhonetiques = '',
  setParolesPhonetiques,
  traduction = '',
  setTraduction,
  anecdote = '',
  setAnecdote,
  isSubmitting = false
}) {
  const isHtml = /<[a-z][\s\S]*>/i.test(parolesOriginales || '');
  const [editorMode, setEditorMode] = useState(isHtml ? 'richtext' : 'measures');

  return (
    <div className="flex flex-col gap-3.5 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4 text-left">
      {/* 1. Origine & Rythme */}
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

      {/* 2. En-tête Musical de la Toada (Signature, BPM, Tonalité) */}
      {category === 'Toadas' && (
        <ToadaHeaderMetadataForm signature={signature} onChangeSignature={setSignature} bpmDefaut={bpmDefaut} onChangeBpm={setBpmDefaut} tonaliteDefaut={tonaliteDefaut} onChangeTonalite={setTonaliteDefaut} disabled={isSubmitting} />
      )}

      {/* 3. Audio Témoin du Chant */}
      <ToadaAudioWitnessField audioUploadType={audioUploadType} setAudioUploadType={setAudioUploadType} audioFile={audioFile} setAudioFile={setAudioFile} audioUrl={audioUrl} setAudioUrl={setAudioUrl} isSubmitting={isSubmitting} />

      {/* 4. Format des Paroles */}
      {category === 'Toadas' && (
        <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1">
          <span className="text-[9.5px] uppercase font-black tracking-wider text-cordel-wood">Format des Paroles</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setEditorMode('measures')} className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer ${editorMode === 'measures' ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300'}`}>Mesures (.txt)</button>
            <button type="button" onClick={() => setEditorMode('richtext')} className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded cursor-pointer ${editorMode === 'richtext' ? 'bg-cordel-wood text-white shadow-2xs' : 'bg-white text-stone-700 border border-stone-300'}`}>Texte Riche</button>
          </div>
        </div>
      )}

      {/* 5. Paroles Originales & Paroles Phonétiques (Grille 2 colonnes) */}
      <div className={`grid grid-cols-1 ${category === 'Toadas' ? 'md:grid-cols-2' : ''} gap-3`}>
        {/* Paroles Originales */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {category === 'Culture' ? "Contenu Fiche" : "Paroles Originales (Langue d'origine)"}
          </label>
          {editorMode === 'measures' && category === 'Toadas' ? (
            <ToadaMeasureEditor value={parolesOriginales} onChange={setParolesOriginales} disabled={isSubmitting} placeholder="+ *Soliste* [Dm7] Première mesure...\n\n/ Suite du chœur liée..." title="paroles-originales" />
          ) : (
            <RichTextEditor value={parolesOriginales} onChange={(html) => setParolesOriginales(html)} disabled={isSubmitting} placeholder="Paroles..." minHeight="120px" />
          )}
        </div>

        {/* Paroles Phonétiques */}
        {category === 'Toadas' && (
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Paroles Phonétiques (Prononciation)
            </label>
            {editorMode === 'measures' ? (
              <ToadaMeasureEditor value={parolesPhonetiques} onChange={setParolesPhonetiques} disabled={isSubmitting} placeholder="+ *Soliste* Prononciation phonétique...\n\n/ Suite phonétique..." title="paroles-phonetiques" />
            ) : (
              <RichTextEditor value={parolesPhonetiques} onChange={(html) => setParolesPhonetiques(html)} disabled={isSubmitting} placeholder="Prononciation..." minHeight="120px" />
            )}
          </div>
        )}
      </div>

      {/* 6. Traduction & Informations */}
      {category === 'Toadas' && (
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Traduction</label>
          <textarea value={traduction} onChange={(e) => setTraduction(e.target.value)} disabled={isSubmitting} placeholder="Traduction française..." className="theme-input w-full text-xs min-h-[45px] resize-y" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Informations</label>
        <textarea value={anecdote} onChange={(e) => setAnecdote(e.target.value)} disabled={isSubmitting} placeholder="Contexte supplémentaire..." className="theme-input w-full text-xs min-h-[45px] resize-y" />
      </div>
    </div>
  );
}
