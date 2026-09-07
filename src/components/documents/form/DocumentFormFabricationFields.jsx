import React, { useState } from 'react';
import RichTextEditor from '../../RichTextEditor';

/**
 * Sous-formulaire pour les tutoriels de confection et fiches de lutherie :
 * Visuel animé, instrument concerné, liste des matières & outils, étapes illustrées pas-à-pas et conseils d'atelier.
 */
export default function DocumentFormFabricationFields({
  visuelAnimeType = 'url',
  setVisuelAnimeType,
  visuelAnimeUrl = '',
  setVisuelAnimeUrl,
  visuelAnimeFile = null,
  setVisuelAnimeFile,
  instrumentConcerne = '',
  setInstrumentConcerne,
  materielRequisList = [],
  setMaterielRequisList,
  outilsNecessairesList = [],
  setOutilsNecessairesList,
  etapesFabrication = [],
  setEtapesFabrication,
  contenuFabrication = '',
  setContenuFabrication,
  anecdote = '',
  setAnecdote,
  isSubmitting = false
}) {
  const [newMaterielInput, setNewMaterielInput] = useState('');
  const [newOutilInput, setNewOutilInput] = useState('');

  // Gestion des matières premières
  const handleAddMateriel = (e) => {
    e?.preventDefault();
    if (!newMaterielInput.trim()) return;
    const items = newMaterielInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    setMaterielRequisList(prev => [...new Set([...prev, ...items])]);
    setNewMaterielInput('');
  };

  const removeMateriel = (mat) => {
    setMaterielRequisList(prev => prev.filter(m => m !== mat));
    setEtapesFabrication(prev => prev.map(etape => ({
      ...etape,
      materiaux: (etape.materiaux || []).filter(m => m !== mat)
    })));
  };

  // Gestion des outils
  const handleAddOutil = (e) => {
    e?.preventDefault();
    if (!newOutilInput.trim()) return;
    const items = newOutilInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    setOutilsNecessairesList(prev => [...new Set([...prev, ...items])]);
    setNewOutilInput('');
  };

  const removeOutil = (outil) => {
    setOutilsNecessairesList(prev => prev.filter(o => o !== outil));
    setEtapesFabrication(prev => prev.map(etape => ({
      ...etape,
      outils: (etape.outils || []).filter(o => o !== outil)
    })));
  };

  // Toggles pour associer outils et matières à une étape spécifique
  const toggleEtapeMateriel = (etapeId, mat) => {
    setEtapesFabrication(prev => prev.map(etape => {
      if (etape.id !== etapeId) return etape;
      const materiaux = etape.materiaux || [];
      return {
        ...etape,
        materiaux: materiaux.includes(mat) ? materiaux.filter(m => m !== mat) : [...materiaux, mat]
      };
    }));
  };

  const toggleEtapeOutil = (etapeId, outil) => {
    setEtapesFabrication(prev => prev.map(etape => {
      if (etape.id !== etapeId) return etape;
      const outils = etape.outils || [];
      return {
        ...etape,
        outils: outils.includes(outil) ? outils.filter(o => o !== outil) : [...outils, outil]
      };
    }));
  };

  // Gestion des étapes
  const addEtape = () => {
    setEtapesFabrication([...etapesFabrication, {
      id: Date.now(),
      sousTitre: '',
      description: '',
      imageUploadType: 'url',
      imageUrl: '',
      imageFile: null,
      materiaux: [],
      outils: []
    }]);
  };

  const updateEtape = (id, field, value) => {
    setEtapesFabrication(etapesFabrication.map(etape => 
      etape.id === id ? { ...etape, [field]: value } : etape
    ));
  };

  const removeEtape = (id) => {
    setEtapesFabrication(etapesFabrication.filter(etape => etape.id !== id));
  };

  const moveEtapeUp = (index) => {
    if (index === 0) return;
    const newEtapes = [...etapesFabrication];
    const temp = newEtapes[index];
    newEtapes[index] = newEtapes[index - 1];
    newEtapes[index - 1] = temp;
    setEtapesFabrication(newEtapes);
  };

  const moveEtapeDown = (index) => {
    if (index === etapesFabrication.length - 1) return;
    const newEtapes = [...etapesFabrication];
    const temp = newEtapes[index];
    newEtapes[index] = newEtapes[index + 1];
    newEtapes[index + 1] = temp;
    setEtapesFabrication(newEtapes);
  };

  return (
    <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
      {/* 1. Visuel animé en boucle */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Visuel animé en boucle (GIF ou petite vidéo MP4)
        </label>
        <div className="flex gap-2 p-1 bg-encre-noire/5 rounded w-fit mb-1">
          <button
            type="button"
            onClick={() => setVisuelAnimeType('url')}
            className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all cursor-pointer ${
              visuelAnimeType === 'url' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'
            }`}
          >
            Lien URL
          </button>
          <button
            type="button"
            onClick={() => setVisuelAnimeType('file')}
            className={`text-[9px] uppercase font-bold px-2 py-1 rounded transition-all cursor-pointer ${
              visuelAnimeType === 'file' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-encre-noire hover:bg-encre-noire/10'
            }`}
          >
            Uploader fichier
          </button>
        </div>
        
        {visuelAnimeType === 'url' ? (
          <input
            type="url"
            value={visuelAnimeUrl}
            onChange={(e) => setVisuelAnimeUrl(e.target.value)}
            disabled={isSubmitting}
            placeholder="https://..."
            className="theme-input w-full text-xs"
          />
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*,video/mp4,image/gif"
              onChange={(e) => setVisuelAnimeFile(e.target.files[0] || null)}
              disabled={isSubmitting}
              className="theme-input w-full text-xs py-1 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
            />
            {(visuelAnimeUrl && !visuelAnimeFile) && (
              <span className="text-[9px] text-cordel-vert font-bold flex-shrink-0">✓ Fichier actuel conservé</span>
            )}
          </div>
        )}
      </div>
      
      {/* 2. Instrument concerné */}
      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Instrument concerné
        </label>
        <input
          type="text"
          value={instrumentConcerne}
          onChange={(e) => setInstrumentConcerne(e.target.value)}
          disabled={isSubmitting}
          placeholder="Ex: Alfaia, Agbê, Mineiro..."
          className="theme-input w-full disabled:opacity-50 text-xs"
        />
      </div>
      
      {/* 3. Matériel & Outils */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Matériel requis */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Matériel Requis
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {materielRequisList.map(mat => (
              <span key={mat} className="text-[10px] flex items-center gap-1 bg-[#fdfaf2] text-encre-noire border border-encre-noire/20 px-2 py-1 rounded shadow-sm">
                {mat}
                <button type="button" onClick={() => removeMateriel(mat)} className="text-cordel-rouge font-bold hover:opacity-80 ml-1 cursor-pointer">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMaterielInput}
              onChange={(e) => setNewMaterielInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMateriel(e)}
              disabled={isSubmitting}
              placeholder="Ex: Fût, Peau..."
              className="theme-input flex-1 disabled:opacity-50 text-xs"
            />
            <button type="button" onClick={handleAddMateriel} disabled={!newMaterielInput.trim() || isSubmitting} className="bg-cordel-wood text-[#fdfaf2] px-3 py-1 rounded text-xs font-bold disabled:opacity-50 cursor-pointer">+</button>
          </div>
        </div>

        {/* Outils nécessaires */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Outils Nécessaires
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {outilsNecessairesList.map(outil => (
              <span key={outil} className="text-[10px] flex items-center gap-1 bg-[#fdfaf2] text-encre-noire border border-encre-noire/20 px-2 py-1 rounded shadow-sm">
                {outil}
                <button type="button" onClick={() => removeOutil(outil)} className="text-cordel-rouge font-bold hover:opacity-80 ml-1 cursor-pointer">✕</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newOutilInput}
              onChange={(e) => setNewOutilInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOutil(e)}
              disabled={isSubmitting}
              placeholder="Ex: Scie, Tournevis..."
              className="theme-input flex-1 disabled:opacity-50 text-xs"
            />
            <button type="button" onClick={handleAddOutil} disabled={!newOutilInput.trim() || isSubmitting} className="bg-cordel-wood text-[#fdfaf2] px-3 py-1 rounded text-xs font-bold disabled:opacity-50 cursor-pointer">+</button>
          </div>
        </div>
      </div>

      {/* 4. Étapes de Confection pas-à-pas */}
      <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
            🛠️ Étapes de Confection (Pas à Pas)
          </label>
          <button
            type="button"
            onClick={addEtape}
            disabled={isSubmitting}
            className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            + Ajouter une étape
          </button>
        </div>

        {etapesFabrication.length === 0 ? (
          <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
            Aucune étape définie pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {etapesFabrication.map((etape, index) => (
              <div key={etape.id} className="bg-cordel-bg border border-cordel-wood/20 p-4 rounded-md shadow-sm relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveEtapeUp(index)}
                    disabled={index === 0}
                    className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1 cursor-pointer"
                    title="Monter"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveEtapeDown(index)}
                    disabled={index === etapesFabrication.length - 1}
                    className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1 cursor-pointer"
                    title="Descendre"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEtape(etape.id)}
                    className="text-xs text-cordel-rouge hover:opacity-80 p-1 cursor-pointer"
                    title="Supprimer"
                  >
                    ❌
                  </button>
                </div>

                <div className="flex flex-col gap-3 pr-16">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Étape {index + 1} : Titre
                    </label>
                    <input
                      type="text"
                      value={etape.sousTitre}
                      onChange={(e) => updateEtape(etape.id, 'sousTitre', e.target.value)}
                      placeholder="Ex: Découpe du cuir ou ponçage du fût"
                      className="theme-input w-full text-xs font-bold"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Description / Consignes
                    </label>
                    <textarea
                      value={etape.description}
                      onChange={(e) => updateEtape(etape.id, 'description', e.target.value)}
                      placeholder="Détaillez le geste, les précautions ou les astuces..."
                      className="theme-input w-full text-xs min-h-[60px]"
                    />
                  </div>

                  {/* Association Matériel / Outils pour cette étape */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {materielRequisList.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Matières utilisées pour cette étape :</label>
                        <div className="flex flex-wrap gap-1">
                          {materielRequisList.map(mat => {
                            const isSelected = (etape.materiaux || []).includes(mat);
                            return (
                              <button
                                key={mat}
                                type="button"
                                onClick={() => toggleEtapeMateriel(etape.id, mat)}
                                className={`text-[9px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-cordel-vert text-[#fdfaf2] border-cordel-vert font-bold shadow-xs' 
                                    : 'bg-white/50 text-stone-600 border-dashed border-stone-300 hover:bg-stone-100'
                                }`}
                              >
                                {mat} {isSelected && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {outilsNecessairesList.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Outils nécessaires pour cette étape :</label>
                        <div className="flex flex-wrap gap-1">
                          {outilsNecessairesList.map(outil => {
                            const isSelected = (etape.outils || []).includes(outil);
                            return (
                              <button
                                key={outil}
                                type="button"
                                onClick={() => toggleEtapeOutil(etape.id, outil)}
                                className={`text-[9px] px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'bg-cordel-vert text-[#fdfaf2] border-cordel-vert font-bold shadow-xs' 
                                    : 'bg-white/50 text-stone-600 border-dashed border-stone-300 hover:bg-stone-100'
                                }`}
                              >
                                {outil} {isSelected && '✓'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Illustration / Média de l'étape */}
                  <div className="flex flex-col gap-1 mt-1 p-2 bg-black/5 rounded border border-cordel-master-dark/10">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                        Illustration ou Vidéo d'étape
                      </label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateEtape(etape.id, 'imageUploadType', 'url')}
                          className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded cursor-pointer ${etape.imageUploadType === 'url' ? 'bg-cordel-wood text-[#fdfaf2]' : 'text-encre-noire'}`}
                        >
                          Lien URL
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEtape(etape.id, 'imageUploadType', 'file')}
                          className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded cursor-pointer ${etape.imageUploadType === 'file' ? 'bg-cordel-wood text-[#fdfaf2]' : 'text-encre-noire'}`}
                        >
                          Fichier
                        </button>
                      </div>
                    </div>

                    {etape.imageUploadType === 'file' ? (
                      <input
                        type="file"
                        accept="image/*,video/mp4"
                        onChange={(e) => updateEtape(etape.id, 'imageFile', e.target.files[0] || null)}
                        disabled={isSubmitting}
                        className="theme-input w-full text-xs py-1 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                      />
                    ) : (
                      <input
                        type="url"
                        value={etape.imageUrl || ''}
                        onChange={(e) => updateEtape(etape.id, 'imageUrl', e.target.value)}
                        placeholder="https://..."
                        className="theme-input w-full text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Contenu descriptif additionnel */}
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Contenu descriptif ou introduction
        </label>
        <div className="mt-1">
          <RichTextEditor
            value={contenuFabrication}
            onChange={(html) => setContenuFabrication(html)}
            disabled={isSubmitting}
            placeholder="Introduction, précautions, contexte de fabrication..."
            minHeight="120px"
            showImage={true}
            showLists={true}
            showAlign={true}
          />
        </div>
      </div>

      {/* 6. Conseils / Astuces */}
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Astuces & Conseils du luthier
        </label>
        <textarea
          value={anecdote}
          onChange={(e) => setAnecdote(e.target.value)}
          disabled={isSubmitting}
          placeholder="Ex: Toujours huiler le cuir avant de serrer..."
          className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
        />
      </div>
    </div>
  );
}
