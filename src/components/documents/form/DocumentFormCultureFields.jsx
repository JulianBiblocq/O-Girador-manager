import React from 'react';
import RichTextEditor from '../../RichTextEditor';

/**
 * Sous-formulaire pour les Fiches Culturelles du Varal :
 * Typologie de fiche (Orixás, Territoire, Cour Royale, Histoire, Musique & Danse, Cuisine, Folklore),
 * champs contextuels conditionnels, chapitres dynamiques, dictionnaire bilingue et section danse/gestuelle.
 */
export default function DocumentFormCultureFields({
  categorieFiche = 'Orixás',
  setCategorieFiche,
  setThemeCulture,
  iconeStamp = 'axe-default',
  setIconeStamp,
  villeRegion = '',
  setVilleRegion,
  climatGeographie = '',
  setClimatGeographie,
  personnageOrisha = '',
  setPersonnageOrisha,
  elementNaturel = '',
  setElementNaturel,
  hexPrimary = '#EAB308',
  setHexPrimary,
  hexSecondary = '#FFFFFF',
  setHexSecondary,
  outilAccessoire = '',
  setOutilAccessoire,
  symbolesSacres = '',
  setSymbolesSacres,
  roleCortejo = '',
  setRoleCortejo,
  epoque = '',
  setEpoque,
  rythme = '',
  setRythme,
  postureDanse = '',
  setPostureDanse,
  ingredientPrincipal = '',
  setIngredientPrincipal,
  danseData = { nomDuGeste: '', descriptionGeste: '', motsClesCorps: '', mediaGesteUrl: '' },
  setDanseData,
  chapitresCulture = [],
  setChapitresCulture,
  legendeImage = '',
  setLegendeImage,
  anecdote = '',
  setAnecdote,
  lexiqueMotsCles = '',
  setLexiqueMotsCles,
  lexique = [],
  setLexique,
  videoUrlCulture = '',
  setVideoUrlCulture,
  isEditMode = false,
  file = null,
  onFileChange,
  externalUrl = '',
  isSubmitting = false
}) {
  // Gestion des chapitres culturels
  const addChapitreCulture = () => {
    setChapitresCulture([...chapitresCulture, { id: Date.now(), sousTitre: '', texte: '' }]);
  };

  const updateChapitreCulture = (id, field, value) => {
    setChapitresCulture(chapitresCulture.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
  };

  const removeChapitreCulture = (id) => {
    setChapitresCulture(chapitresCulture.filter(ch => ch.id !== id));
  };

  const moveChapitreCultureUp = (index) => {
    if (index === 0) return;
    const newChapitres = [...chapitresCulture];
    const temp = newChapitres[index];
    newChapitres[index] = newChapitres[index - 1];
    newChapitres[index - 1] = temp;
    setChapitresCulture(newChapitres);
  };

  const moveChapitreCultureDown = (index) => {
    if (index === chapitresCulture.length - 1) return;
    const newChapitres = [...chapitresCulture];
    const temp = newChapitres[index];
    newChapitres[index] = newChapitres[index + 1];
    newChapitres[index + 1] = temp;
    setChapitresCulture(newChapitres);
  };

  // Gestion du lexique bilingue
  const addLexiqueItem = () => {
    setLexique([...lexique, { pt: '', fr: '' }]);
  };

  const updateLexiqueItem = (index, field, value) => {
    const updated = [...lexique];
    updated[index][field] = value;
    setLexique(updated);
  };

  const removeLexiqueItem = (index) => {
    const updated = [...lexique];
    updated.splice(index, 1);
    setLexique(updated);
  };

  return (
    <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
      {/* 1. Sélecteur de catégorie de fiche */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Catégorie (Type de fiche)
          </label>
          <select
            value={categorieFiche}
            onChange={(e) => {
              const val = e.target.value;
              setCategorieFiche(val);
              if (val === 'Orixás') { setThemeCulture('orixas'); setIconeStamp('axe-default'); }
              else if (val === 'Cuisine') setThemeCulture('cuisine');
              else if (val === 'Histoire') setThemeCulture('histoire');
              else if (val === 'Musique & Danse') setThemeCulture('musique');
              else if (val === 'Cour Royale') setThemeCulture('cortejo');
              else if (val === 'Territoire') setThemeCulture('territoire');
              else if (val === 'Folklore') setThemeCulture('folklore');
            }}
            disabled={isSubmitting}
            className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-wood/10 cursor-pointer"
          >
            <option value="Orixás">Orixás</option>
            <option value="Territoire">Territoire</option>
            <option value="Cour Royale">Cour Royale</option>
            <option value="Histoire">Histoire</option>
            <option value="Musique & Danse">Musique & Danse</option>
            <option value="Cuisine">Cuisine</option>
            <option value="Folklore">Folklore</option>
          </select>
        </div>
      </div>

      {/* 2. Champs contextuels selon la catégorie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-cordel-wood/5 border border-cordel-wood/20 rounded-md">
        {categorieFiche === 'Territoire' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Ville / Région</label>
              <input type="text" value={villeRegion || ''} onChange={(e) => setVilleRegion(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Climat / Géographie</label>
              <input type="text" value={climatGeographie || ''} onChange={(e) => setClimatGeographie(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
          </>
        )}

        {categorieFiche === 'Orixás' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Nom de l'Orixá</label>
              <input type="text" value={personnageOrisha || ''} onChange={(e) => setPersonnageOrisha(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Élément Naturel</label>
              <input type="text" value={elementNaturel || ''} onChange={(e) => setElementNaturel(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Couleurs (Primaire & Secondaire)</label>
              <div className="flex gap-2">
                <input type="color" value={hexPrimary || '#EAB308'} onChange={(e) => setHexPrimary(e.target.value)} disabled={isSubmitting} className="w-8 h-8 rounded cursor-pointer" />
                <input type="color" value={hexSecondary || '#FFFFFF'} onChange={(e) => setHexSecondary(e.target.value)} disabled={isSubmitting} className="w-8 h-8 rounded cursor-pointer" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Outil / Accessoire</label>
              <input type="text" value={outilAccessoire || ''} onChange={(e) => setOutilAccessoire(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Symboles Sacrés</label>
              <input type="text" value={symbolesSacres || ''} onChange={(e) => setSymbolesSacres(e.target.value)} disabled={isSubmitting} placeholder="Ex: Arc et flèche (Ofá), Miroir (Abebé)..." className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Selo de Axé (Tampon SVG)</label>
              <select value={iconeStamp} onChange={(e) => setIconeStamp(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs cursor-pointer">
                <option value="axe-default">Défaut / Générique</option>
                <option value="axe-oxala">Oxalá</option>
                <option value="axe-yemanja">Yemanjá</option>
                <option value="axe-oxum">Oxum</option>
                <option value="axe-iansa">Iansã</option>
                <option value="axe-oxossi">Oxóssi</option>
                <option value="axe-ogum">Ogum</option>
                <option value="axe-xango">Xangô</option>
                <option value="axe-nana">Nanã</option>
                <option value="axe-obaluai">Obaluaiê</option>
                <option value="axe-exu">Exu</option>
                <option value="axe-oxumare">Oxumarê</option>
                <option value="axe-logunede">Logun Edé</option>
              </select>
            </div>
          </>
        )}

        {(categorieFiche === 'Cour Royale' || categorieFiche === 'Cortège') && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Rôle dans le Cortejo</label>
              <input type="text" value={roleCortejo || ''} onChange={(e) => setRoleCortejo(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Accessoire / Objet</label>
              <input type="text" value={outilAccessoire || ''} onChange={(e) => setOutilAccessoire(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
          </>
        )}

        {categorieFiche === 'Histoire' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Époque / Date</label>
              <input type="text" value={epoque || ''} onChange={(e) => setEpoque(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Figure Historique</label>
              <input type="text" value={personnageOrisha || ''} onChange={(e) => setPersonnageOrisha(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
          </>
        )}

        {categorieFiche === 'Musique & Danse' && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Rythme (Baque)</label>
              <input type="text" value={rythme || ''} onChange={(e) => setRythme(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Posture de danse</label>
              <input type="text" value={postureDanse || ''} onChange={(e) => setPostureDanse(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
            </div>
          </>
        )}

        {categorieFiche === 'Cuisine' && (
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Ingrédient principal</label>
            <input type="text" value={ingredientPrincipal || ''} onChange={(e) => setIngredientPrincipal(e.target.value)} disabled={isSubmitting} className="theme-input w-full text-xs" />
          </div>
        )}
        
        {categorieFiche === 'Folklore' && (
          <div className="md:col-span-2 text-center text-xs text-cordel-master-dark/70 italic py-2">
            (Pas de champs spécifiques pour le folklore, utilisez la description et les chapitres)
          </div>
        )}
      </div>

      {/* 3. Image Principale (en mode création) */}
      {!isEditMode && onFileChange && (
        <div className="flex flex-col gap-1 mt-2">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Image Principale
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files[0] || null)}
            disabled={isSubmitting}
            className="theme-input w-full disabled:opacity-50 text-xs py-1 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
          />
          {externalUrl && !file && (
            <span className="text-[9px] text-cordel-vert font-bold">Image actuelle : {externalUrl.split('/').pop()}</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Légende de l'image
        </label>
        <input
          type="text"
          value={legendeImage}
          onChange={(e) => setLegendeImage(e.target.value)}
          disabled={isSubmitting}
          placeholder="Courte description de l'image..."
          className="theme-input w-full disabled:opacity-50 text-xs"
        />
      </div>

      {/* 4. Chapitres dynamiques */}
      <div className="flex flex-col gap-1 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
            📖 Chapitres
          </label>
          <button
            type="button"
            onClick={addChapitreCulture}
            disabled={isSubmitting}
            className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            + Ajouter un chapitre
          </button>
        </div>

        {chapitresCulture.length === 0 ? (
          <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
            Aucun chapitre défini.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {chapitresCulture.map((chap, index) => (
              <div key={chap.id} className="bg-cordel-bg border border-cordel-wood/20 p-4 rounded-md shadow-sm relative">
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveChapitreCultureUp(index)}
                    disabled={index === 0}
                    className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1 cursor-pointer"
                    title="Monter"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveChapitreCultureDown(index)}
                    disabled={index === chapitresCulture.length - 1}
                    className="text-xs text-cordel-master-dark hover:text-cordel-wood disabled:opacity-30 p-1 cursor-pointer"
                    title="Descendre"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => removeChapitreCulture(chap.id)}
                    className="text-xs text-cordel-rouge hover:opacity-80 p-1 cursor-pointer"
                    title="Supprimer"
                  >
                    ❌
                  </button>
                </div>
                
                <div className="flex flex-col gap-3 pr-16">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Sous-Titre
                    </label>
                    <input
                      type="text"
                      value={chap.sousTitre}
                      onChange={(e) => updateChapitreCulture(chap.id, 'sousTitre', e.target.value)}
                      placeholder="Ex: Origine et Symbole"
                      className="theme-input w-full text-xs font-bold"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Texte
                    </label>
                    <div className="mt-1">
                      <RichTextEditor
                        value={chap.texte}
                        onChange={(html) => updateChapitreCulture(chap.id, 'texte', html)}
                        disabled={isSubmitting}
                        placeholder="Contenu du chapitre..."
                        minHeight="120px"
                        showImage={true}
                        showLists={true}
                        showAlign={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Anecdote & Mots-clés */}
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Anecdote / Le saviez-vous ?
        </label>
        <textarea
          value={anecdote}
          onChange={(e) => setAnecdote(e.target.value)}
          disabled={isSubmitting}
          placeholder="Une petite phrase clé très marquante..."
          className="theme-input w-full disabled:opacity-50 text-xs min-h-[60px] resize-y"
        />
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Lexique / Mots-clés (Étiquettes simples)
        </label>
        <input
          type="text"
          value={lexiqueMotsCles}
          onChange={(e) => setLexiqueMotsCles(e.target.value)}
          disabled={isSubmitting}
          placeholder="Ex: Orixá, Tambour, Transe, Bahia..."
          className="theme-input w-full disabled:opacity-50 text-xs"
        />
      </div>

      {/* 6. Dictionnaire bilingue PT / FR */}
      <div className="flex flex-col gap-1 mt-2 border-t border-dashed border-cordel-master-dark/20 pt-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Dictionnaire Bilingue (Portugais / Français)
          </label>
          <button
            type="button"
            onClick={addLexiqueItem}
            disabled={isSubmitting}
            className="text-[9px] uppercase font-bold px-2 py-0.5 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            + Ajouter une traduction
          </button>
        </div>
        {lexique.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            {lexique.map((lex, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Mot Portugais"
                  value={lex.pt}
                  onChange={(e) => updateLexiqueItem(index, 'pt', e.target.value)}
                  className="theme-input flex-1 text-xs py-1"
                />
                <input
                  type="text"
                  placeholder="Traduction Française"
                  value={lex.fr}
                  onChange={(e) => updateLexiqueItem(index, 'fr', e.target.value)}
                  className="theme-input flex-1 text-xs py-1"
                />
                <button
                  type="button"
                  onClick={() => removeLexiqueItem(index)}
                  className="text-cordel-rouge text-xs px-2 hover:opacity-80 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Vidéo YouTube */}
      <div className="flex flex-col gap-1 mt-2">
        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
          Lien Vidéo YouTube (Optionnel)
        </label>
        <input
          type="url"
          value={videoUrlCulture}
          onChange={(e) => setVideoUrlCulture(e.target.value)}
          disabled={isSubmitting}
          placeholder="https://www.youtube.com/watch?v=..."
          className="theme-input w-full disabled:opacity-50 text-xs"
        />
      </div>

      {/* 8. Section Danse & Gestuelle */}
      <div className="flex flex-col gap-3 mt-4 border-2 border-dashed border-cordel-wood/30 p-4 rounded-md bg-cordel-wood/5">
        <label className="text-[11px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>💃</span> Section Danse & Gestuelle (Optionnel)
        </label>
        <p className="text-[10px] text-stone-600 dark:text-stone-400 italic">
          Renseignez cette section si ce document comporte une chorégraphie ou un pas spécifique (ex: Danse des Orixás, Cortejo).
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Nom du mouvement / geste</label>
            <input
              type="text"
              value={danseData.nomDuGeste || ''}
              onChange={(e) => setDanseData(prev => ({ ...prev, nomDuGeste: e.target.value }))}
              placeholder="Ex: Balancement des vagues de Yemanjá"
              className="theme-input text-xs w-full"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Mots-clés anatomiques</label>
            <input
              type="text"
              value={danseData.motsClesCorps || ''}
              onChange={(e) => setDanseData(prev => ({ ...prev, motsClesCorps: e.target.value }))}
              placeholder="Ex: Bras ondulés, Bassin ouvert, Pieds ancrés"
              className="theme-input text-xs w-full"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Description détaillée du mouvement</label>
            <textarea
              value={danseData.descriptionGeste || ''}
              onChange={(e) => setDanseData(prev => ({ ...prev, descriptionGeste: e.target.value }))}
              placeholder="Explications détaillées de l'attitude corporelle, de l'intention et de l'énergie du pas..."
              className="theme-input text-xs w-full min-h-[50px] resize-y"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Lien média de démonstration (Vidéo ou GIF du geste)</label>
            <input
              type="url"
              value={danseData.mediaGesteUrl || ''}
              onChange={(e) => setDanseData(prev => ({ ...prev, mediaGesteUrl: e.target.value }))}
              placeholder="https://... (Lien direct vers une courte vidéo ou animation du pas)"
              className="theme-input text-xs w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
