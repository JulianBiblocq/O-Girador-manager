const fs = require('fs');

const file = 'E:/projets/Roda de maracatu/o-girador-manager/src/components/DocumentUploadForm.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add missing state variables
const stateBlock = `  const [videoUrlCulture, setVideoUrlCulture] = useState(documentToEdit ? documentToEdit.videoUrl || '' : '');`;
const newStateBlock = `  const [videoUrlCulture, setVideoUrlCulture] = useState(documentToEdit ? documentToEdit.videoUrl || '' : '');
  const [climatGeographie, setClimatGeographie] = useState(documentToEdit ? documentToEdit.climatGeographie || '' : '');
  const [outilAccessoire, setOutilAccessoire] = useState(documentToEdit ? documentToEdit.outilAccessoire || '' : '');
  const [roleCortejo, setRoleCortejo] = useState(documentToEdit ? documentToEdit.roleCortejo || '' : '');
  const [postureDanse, setPostureDanse] = useState(documentToEdit ? documentToEdit.postureDanse || '' : '');
  const [ingredientPrincipal, setIngredientPrincipal] = useState(documentToEdit ? documentToEdit.ingredientPrincipal || '' : '');`;
content = content.replace(stateBlock, newStateBlock);

// 2. Change categorieFiche default
const oldCategorie = `  const [categorieFiche, setCategorieFiche] = useState(documentToEdit ? documentToEdit.categorieFiche || 'Cour Royale & Personnages' : 'Cour Royale & Personnages');`;
const newCategorie = `  const [categorieFiche, setCategorieFiche] = useState(documentToEdit ? documentToEdit.categorieFiche || 'Orixás' : 'Orixás');`;
content = content.replace(oldCategorie, newCategorie);

// 3. Update updateData payload building logic (lines ~500)
const oldUpdateLogic = `        if (computedType === 'culture_fiche') {
          updateData.categorieFiche = categorieFiche;
          updateData.themeCulture = themeCulture;
          updateData.elementNaturel = elementNaturel;
          updateData.symbolesSacres = symbolesSacres;
          updateData.hexPrimary = hexPrimary;
          updateData.hexSecondary = hexSecondary;
          updateData.iconeStamp = iconeStamp;
          updateData.danseData = danseData;
          updateData.personnageOrisha = personnageOrisha;
          updateData.villeRegion = villeRegion;
          updateData.epoque = epoque;
          updateData.legendeImage = legendeImage;
          updateData.chapitres = chapitresCulture;
          updateData.anecdote = anecdote;
          updateData.lexiqueMotsCles = lexiqueMotsCles;
          updateData.lexique = lexique;
          updateData.videoUrl = videoUrlCulture;
        }`;

const newUpdateLogic = `        if (computedType === 'culture_fiche') {
          const cleanPayload = (docData) => {
            docData.categorieFiche = categorieFiche;
            docData.themeCulture = themeCulture;
            docData.legendeImage = legendeImage;
            docData.chapitres = chapitresCulture;
            docData.anecdote = anecdote;
            docData.lexiqueMotsCles = lexiqueMotsCles;
            docData.lexique = lexique;
            docData.videoUrl = videoUrlCulture;

            // Reset conditionnels
            docData.villeRegion = null;
            docData.climatGeographie = null;
            docData.personnageOrisha = null;
            docData.elementNaturel = null;
            docData.hexPrimary = null;
            docData.hexSecondary = null;
            docData.iconeStamp = null;
            docData.outilAccessoire = null;
            docData.roleCortejo = null;
            docData.epoque = null;
            docData.rythme = null;
            docData.postureDanse = null;
            docData.ingredientPrincipal = null;
            docData.symbolesSacres = null;

            if (categorieFiche === 'Territoire') {
              docData.villeRegion = villeRegion;
              docData.climatGeographie = climatGeographie;
            } else if (categorieFiche === 'Orixás') {
              docData.personnageOrisha = personnageOrisha;
              docData.elementNaturel = elementNaturel;
              docData.hexPrimary = hexPrimary;
              docData.hexSecondary = hexSecondary;
              docData.outilAccessoire = outilAccessoire;
              docData.iconeStamp = iconeStamp;
              docData.symbolesSacres = symbolesSacres;
            } else if (categorieFiche === 'Cour Royale' || categorieFiche === 'Cortège') {
              docData.roleCortejo = roleCortejo;
              docData.outilAccessoire = outilAccessoire;
            } else if (categorieFiche === 'Histoire') {
              docData.epoque = epoque;
              docData.personnageOrisha = personnageOrisha;
            } else if (categorieFiche === 'Musique & Danse') {
              docData.rythme = rythme;
              docData.postureDanse = postureDanse;
            } else if (categorieFiche === 'Cuisine') {
              docData.ingredientPrincipal = ingredientPrincipal;
            }
          };
          cleanPayload(updateData);
        }`;
content = content.replace(oldUpdateLogic, newUpdateLogic);

// 4. Update newDoc payload building logic (lines ~608)
const oldAddLogic = `      if (computedType === 'culture_fiche') {
        newDoc.categorieFiche = categorieFiche;
        newDoc.themeCulture = themeCulture;
        newDoc.elementNaturel = elementNaturel;
        newDoc.symbolesSacres = symbolesSacres;
        newDoc.hexPrimary = hexPrimary;
        newDoc.hexSecondary = hexSecondary;
        newDoc.iconeStamp = iconeStamp;
        newDoc.danseData = danseData;
        newDoc.personnageOrisha = personnageOrisha;
        newDoc.villeRegion = villeRegion;
        newDoc.epoque = epoque;
        newDoc.legendeImage = legendeImage;
        newDoc.chapitres = chapitresCulture;
        newDoc.anecdote = anecdote;
        newDoc.lexiqueMotsCles = lexiqueMotsCles;
        newDoc.lexique = lexique;
        newDoc.videoUrl = videoUrlCulture;
      }`;

const newAddLogic = `      if (computedType === 'culture_fiche') {
        const cleanPayload = (docData) => {
            docData.categorieFiche = categorieFiche;
            docData.themeCulture = themeCulture;
            docData.legendeImage = legendeImage;
            docData.chapitres = chapitresCulture;
            docData.anecdote = anecdote;
            docData.lexiqueMotsCles = lexiqueMotsCles;
            docData.lexique = lexique;
            docData.videoUrl = videoUrlCulture;

            if (categorieFiche === 'Territoire') {
              docData.villeRegion = villeRegion;
              docData.climatGeographie = climatGeographie;
            } else if (categorieFiche === 'Orixás') {
              docData.personnageOrisha = personnageOrisha;
              docData.elementNaturel = elementNaturel;
              docData.hexPrimary = hexPrimary;
              docData.hexSecondary = hexSecondary;
              docData.outilAccessoire = outilAccessoire;
              docData.iconeStamp = iconeStamp;
              docData.symbolesSacres = symbolesSacres;
            } else if (categorieFiche === 'Cour Royale' || categorieFiche === 'Cortège') {
              docData.roleCortejo = roleCortejo;
              docData.outilAccessoire = outilAccessoire;
            } else if (categorieFiche === 'Histoire') {
              docData.epoque = epoque;
              docData.personnageOrisha = personnageOrisha;
            } else if (categorieFiche === 'Musique & Danse') {
              docData.rythme = rythme;
              docData.postureDanse = postureDanse;
            } else if (categorieFiche === 'Cuisine') {
              docData.ingredientPrincipal = ingredientPrincipal;
            }
        };
        cleanPayload(newDoc);
      }`;
content = content.replace(oldAddLogic, newAddLogic);

// 5. Replace the UI
const uiStart = \`            {/* Culture Text fields */}
            {computedType === 'culture_fiche' && (
              <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">\`;

const uiEnd = \`                {!isEditMode && (
                  <div className="flex flex-col gap-1 mt-2">\`;

// find the indices
const startIdx = content.indexOf(uiStart);
const endIdx = content.indexOf(uiEnd);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = \`            {/* Culture Text fields */}
            {computedType === 'culture_fiche' && (
              <div className="flex flex-col gap-4 mt-2 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
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
                      disabled={isUploading}
                      className="theme-input w-full disabled:opacity-50 text-xs font-bold bg-cordel-wood/10"
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

                {/* RENDU CONDITIONNEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-cordel-wood/5 border border-cordel-wood/20 rounded-md">
                  {categorieFiche === 'Territoire' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Ville / Région</label>
                        <input type="text" value={villeRegion || ''} onChange={(e) => setVilleRegion(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Climat / Géographie</label>
                        <input type="text" value={climatGeographie || ''} onChange={(e) => setClimatGeographie(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Orixás' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Nom de l'Orixá</label>
                        <input type="text" value={personnageOrisha || ''} onChange={(e) => setPersonnageOrisha(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Élément Naturel</label>
                        <input type="text" value={elementNaturel || ''} onChange={(e) => setElementNaturel(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Couleurs (Primaire & Secondaire)</label>
                        <div className="flex gap-2">
                          <input type="color" value={hexPrimary || '#EAB308'} onChange={(e) => setHexPrimary(e.target.value)} disabled={isUploading} className="w-8 h-8 rounded cursor-pointer" />
                          <input type="color" value={hexSecondary || '#FFFFFF'} onChange={(e) => setHexSecondary(e.target.value)} disabled={isUploading} className="w-8 h-8 rounded cursor-pointer" />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Outil / Accessoire</label>
                        <input type="text" value={outilAccessoire || ''} onChange={(e) => setOutilAccessoire(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Selo de Axé (Tampon SVG)</label>
                        <select value={iconeStamp} onChange={(e) => setIconeStamp(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs">
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
                        <input type="text" value={roleCortejo || ''} onChange={(e) => setRoleCortejo(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Accessoire / Objet</label>
                        <input type="text" value={outilAccessoire || ''} onChange={(e) => setOutilAccessoire(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Histoire' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Époque / Date</label>
                        <input type="text" value={epoque || ''} onChange={(e) => setEpoque(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Figure Historique</label>
                        <input type="text" value={personnageOrisha || ''} onChange={(e) => setPersonnageOrisha(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Musique & Danse' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Rythme (Baque)</label>
                        <input type="text" value={rythme || ''} onChange={(e) => setRythme(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Posture de danse</label>
                        <input type="text" value={postureDanse || ''} onChange={(e) => setPostureDanse(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}

                  {categorieFiche === 'Cuisine' && (
                    <>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Ingrédient principal</label>
                        <input type="text" value={ingredientPrincipal || ''} onChange={(e) => setIngredientPrincipal(e.target.value)} disabled={isUploading} className="theme-input w-full text-xs" />
                      </div>
                    </>
                  )}
                  
                  {categorieFiche === 'Folklore' && (
                    <div className="md:col-span-2 text-center text-xs text-cordel-master-dark/70 italic py-2">
                      (Pas de champs spécifiques pour le folklore, utilisez la description)
                    </div>
                  )}
                </div>

`;
    
    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
    
    fs.writeFileSync(file, content);
    console.log("Successfully updated the file!");
} else {
    console.log("Could not find the UI start/end indices");
}
