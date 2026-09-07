import React, { useState } from 'react';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useDocumentUploadPipeline } from '../hooks/useDocumentUploadPipeline';
import DocumentFormBatchSection from './documents/form/DocumentFormBatchSection';
import DocumentFormToadaFields from './documents/form/DocumentFormToadaFields';
import DocumentFormCultureFields from './documents/form/DocumentFormCultureFields';
import DocumentFormFabricationFields from './documents/form/DocumentFormFabricationFields';
import DocumentFormQuizBuilder from './documents/form/DocumentFormQuizBuilder';

/**
 * Utilitaire de normalisation des listes de tags / mots-clés.
 */
const parseTagsList = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  }
  return [];
};

/**
 * Conteneur d'orchestration pour le dépôt et l'édition de documents du Varal.
 * Rôle : gestion des métadonnées globales, sélection du type et affichage modulaire des sous-formulaires.
 */
export default function DocumentUploadForm({ 
  groupId, 
  varalCategories = [], 
  onClose, 
  documentToEdit = null,
  initialCategoryId = null,
  defaultCategory = null,
  lockCategory: _lockCategory = false
}) {
  const { t } = useTranslation();
  const isEditMode = Boolean(documentToEdit);

  // 1. États généraux du document
  const [title, setTitle] = useState(documentToEdit ? documentToEdit.titre : '');
  const targetCategory = initialCategoryId || defaultCategory;
  const [category] = useState(() => {
    if (targetCategory) {
      const matchById = varalCategories.find(c => c.id === targetCategory);
      if (matchById) return matchById.id;
      const matchByName = varalCategories.find(c => c.nom === targetCategory);
      if (matchByName) return matchByName.id;
      return targetCategory;
    }
    if (!documentToEdit) {
      return varalCategories && varalCategories.length > 0 ? varalCategories[0].id : 'Toadas';
    }
    const match = (documentToEdit.categoryId && varalCategories.find(c => c.id === documentToEdit.categoryId))
      || (documentToEdit.categorie && varalCategories.find(c => c.nom === documentToEdit.categorie))
      || (documentToEdit.categorie && varalCategories.find(c => c.id === documentToEdit.categorie));
    return match ? match.id : (documentToEdit.categoryId || documentToEdit.categorie || 'Toadas');
  });

  const [annee] = useState(documentToEdit ? documentToEdit.annee : new Date().getFullYear());
  const [isArchived, setIsArchived] = useState(documentToEdit ? Boolean(documentToEdit.isArchived) : false);
  const [isHidden, setIsHidden] = useState(documentToEdit ? Boolean(documentToEdit.isHidden) : false);
  const [excludeFromPedagogy, setExcludeFromPedagogy] = useState(documentToEdit ? Boolean(documentToEdit.excludeFromPedagogy) : false);

  // 2. Types conditionnels par catégorie
  const [pvType, setPvType] = useState(documentToEdit && documentToEdit.type === 'web' ? 'web' : 'pdf');
  const [tutoFabType, setTutoFabType] = useState(documentToEdit && documentToEdit.type === 'web' ? 'web' : 'fabrication');
  const [cultureType, setCultureType] = useState(documentToEdit && documentToEdit.type === 'web' ? 'web' : 'culture_fiche');

  // Type final déduit
  const computedType = (() => {
    const catLower = (category || '').toLowerCase();
    if (category === 'Toadas' || catLower.includes('toada') || catLower.includes('chant') || catLower.includes('parole')) {
      return 'song';
    }
    if (category === 'Culture' || catLower.includes('culture')) {
      return cultureType;
    }
    if (category === 'TutorielsVideo' || catLower.includes('video')) {
      return 'video';
    }
    if (category === 'TutosFabrication' || catLower.includes('fabrication') || catLower.includes('lutherie') || catLower.includes('plan')) {
      return tutoFabType;
    }
    if (category === 'PhotosPrestations' || catLower.includes('photo') || catLower.includes('media') || catLower.includes('presse')) {
      return 'dossier_externe';
    }
    if (category === 'ComptesRendus' || catLower.includes('compte-rendu') || catLower.includes('reunion') || catLower.includes('pv')) {
      return pvType;
    }
    if (category === 'Administratif' || catLower.includes('administratif')) {
      return 'pdf';
    }
    return 'pdf';
  })();

  const [file, setFile] = useState(null);
  const [externalUrl, setExternalUrl] = useState(documentToEdit ? documentToEdit.fileUrl || '' : '');
  const [lienSequenceurId, setLienSequenceurId] = useState(documentToEdit ? documentToEdit.lienSequenceurId || '' : '');

  // 3. Mode Saisie manuelle vs Import par lot
  const [importMode, setImportMode] = useState('manual');
  const [batchFile, setBatchFile] = useState(null);

  // 4. Sous-états Chants / Toadas
  const [nacao, setNacao] = useState(documentToEdit ? documentToEdit.nacao || '' : '');
  const [rythme, setRythme] = useState(documentToEdit ? documentToEdit.rythme || '' : '');
  const [parolesOriginales, setParolesOriginales] = useState(documentToEdit ? documentToEdit.parolesOriginales || '' : '');
  const [parolesPhonetiques, setParolesPhonetiques] = useState(documentToEdit ? documentToEdit.parolesPhonetiques || '' : '');
  const [traduction, setTraduction] = useState(documentToEdit ? documentToEdit.traduction || '' : '');
  const [anecdoteSong, setAnecdoteSong] = useState(documentToEdit ? documentToEdit.anecdote || '' : '');
  const [audioUploadType, setAudioUploadType] = useState('file');
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(() => {
    if (documentToEdit) {
      if (documentToEdit.audioUrl) return documentToEdit.audioUrl;
      if (documentToEdit.fileUrl && /\.(mp3|wav|ogg|m4a|aac)$/i.test(documentToEdit.fileUrl)) {
        return documentToEdit.fileUrl;
      }
    }
    return '';
  });

  // 5. Sous-états Culture
  const [categorieFiche, setCategorieFiche] = useState(documentToEdit ? documentToEdit.categorieFiche || 'Orixás' : 'Orixás');
  const [themeCulture, setThemeCulture] = useState(documentToEdit ? documentToEdit.themeCulture || 'orixas' : 'orixas');
  const [iconeStamp, setIconeStamp] = useState(documentToEdit ? documentToEdit.iconeStamp || documentToEdit.stampKey || 'axe-default' : 'axe-default');
  const [villeRegion, setVilleRegion] = useState(documentToEdit ? documentToEdit.villeRegion || '' : '');
  const [climatGeographie, setClimatGeographie] = useState(documentToEdit ? documentToEdit.climatGeographie || '' : '');
  const [personnageOrisha, setPersonnageOrisha] = useState(documentToEdit ? documentToEdit.personnageOrisha || '' : '');
  const [elementNaturel, setElementNaturel] = useState(documentToEdit ? documentToEdit.elementNaturel || '' : '');
  const [hexPrimary, setHexPrimary] = useState(documentToEdit ? documentToEdit.hexPrimary || (documentToEdit.couleursTheme ? documentToEdit.couleursTheme[0] : '#EAB308') : '#EAB308');
  const [hexSecondary, setHexSecondary] = useState(documentToEdit ? documentToEdit.hexSecondary || (documentToEdit.couleursTheme ? documentToEdit.couleursTheme[1] : '#FFFFFF') : '#FFFFFF');
  const [outilAccessoire, setOutilAccessoire] = useState(documentToEdit ? documentToEdit.outilAccessoire || '' : '');
  const [symbolesSacres, setSymbolesSacres] = useState(documentToEdit ? documentToEdit.symbolesSacres || '' : '');
  const [roleCortejo, setRoleCortejo] = useState(documentToEdit ? documentToEdit.roleCortejo || '' : '');
  const [epoque, setEpoque] = useState(documentToEdit ? documentToEdit.epoque || '' : '');
  const [postureDanse, setPostureDanse] = useState(documentToEdit ? documentToEdit.postureDanse || '' : '');
  const [ingredientPrincipal, setIngredientPrincipal] = useState(documentToEdit ? documentToEdit.ingredientPrincipal || '' : '');
  const [danseData, setDanseData] = useState(documentToEdit ? documentToEdit.danseData || { nomDuGeste: '', descriptionGeste: '', motsClesCorps: '', mediaGesteUrl: '' } : { nomDuGeste: '', descriptionGeste: '', motsClesCorps: '', mediaGesteUrl: '' });
  const [chapitresCulture, setChapitresCulture] = useState(documentToEdit ? documentToEdit.chapitres || [] : []);
  const [legendeImage, setLegendeImage] = useState(documentToEdit ? documentToEdit.legendeImage || '' : '');
  const [anecdoteCulture, setAnecdoteCulture] = useState(documentToEdit ? documentToEdit.anecdote || '' : '');
  const [lexiqueMotsCles, setLexiqueMotsCles] = useState(documentToEdit ? documentToEdit.lexiqueMotsCles || '' : '');
  const [lexique, setLexique] = useState(documentToEdit ? documentToEdit.lexique || [] : []);
  const [videoUrlCulture, setVideoUrlCulture] = useState(documentToEdit ? documentToEdit.videoUrl || '' : '');

  // 6. Sous-états Fabrication
  const [visuelAnimeType, setVisuelAnimeType] = useState(documentToEdit && documentToEdit.visuelAnimeUrl ? 'url' : 'file');
  const [visuelAnimeUrl, setVisuelAnimeUrl] = useState(documentToEdit ? documentToEdit.visuelAnimeUrl || '' : '');
  const [visuelAnimeFile, setVisuelAnimeFile] = useState(null);
  const [instrumentConcerne, setInstrumentConcerne] = useState(documentToEdit ? documentToEdit.instrumentConcerne || '' : '');
  const [materielRequisList, setMaterielRequisList] = useState(() => parseTagsList(documentToEdit?.materielRequis));
  const [outilsNecessairesList, setOutilsNecessairesList] = useState(() => parseTagsList(documentToEdit?.outilsNecessaires));
  const [etapesFabrication, setEtapesFabrication] = useState(documentToEdit ? documentToEdit.etapesFabrication || [] : []);
  const [contenuFabrication, setContenuFabrication] = useState(documentToEdit ? documentToEdit.contenuFabrication || '' : '');
  const [anecdoteFabrication, setAnecdoteFabrication] = useState(documentToEdit ? documentToEdit.anecdote || '' : '');

  // 7. Sous-états Lexique & QCM
  const [notesLexique, setNotesLexique] = useState(() => {
    if (documentToEdit && documentToEdit.notesLexique && Array.isArray(documentToEdit.notesLexique)) {
      return documentToEdit.notesLexique;
    }
    return [];
  });
  const [questionsQcm, setQuestionsQcm] = useState(documentToEdit ? documentToEdit.questionsQcm || [] : []);

  // 8. Pipeline d'upload et mutations asynchrones
  const { isSubmitting, submitDocument, executeBatchImport, downloadTemplate } = useDocumentUploadPipeline({
    groupId,
    varalCategories,
    documentToEdit,
    onClose
  });

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        const nameWithoutExt = e.target.files[0].name.substring(0, e.target.files[0].name.lastIndexOf('.')) || e.target.files[0].name;
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (importMode === 'import' && !isEditMode) {
      executeBatchImport(batchFile, category, computedType);
      return;
    }

    const currentAnecdote = computedType === 'song' ? anecdoteSong : computedType === 'culture_fiche' ? anecdoteCulture : anecdoteFabrication;

    submitDocument({
      title,
      category,
      computedType,
      annee,
      isArchived,
      isHidden,
      excludeFromPedagogy,
      lienSequenceurId,
      file,
      externalUrl,
      songData: {
        nacao,
        rythme,
        parolesOriginales,
        parolesPhonetiques,
        traduction,
        anecdote: currentAnecdote,
        audioUploadType,
        audioFile,
        audioUrl
      },
      cultureData: {
        categorieFiche,
        themeCulture,
        iconeStamp,
        villeRegion,
        climatGeographie,
        personnageOrisha,
        elementNaturel,
        hexPrimary,
        hexSecondary,
        outilAccessoire,
        symbolesSacres,
        roleCortejo,
        epoque,
        rythme,
        postureDanse,
        ingredientPrincipal,
        danseData,
        chapitresCulture,
        legendeImage,
        anecdote: currentAnecdote,
        lexiqueMotsCles,
        lexique,
        videoUrlCulture
      },
      fabricationData: {
        visuelAnimeType,
        visuelAnimeUrl,
        visuelAnimeFile,
        instrumentConcerne,
        materielRequisList,
        outilsNecessairesList,
        etapesFabrication,
        contenuFabrication,
        anecdote: currentAnecdote
      },
      quizData: {
        notesLexique,
        questionsQcm
      }
    });
  };

  const currentCategoryObj = varalCategories.find(c => c.id === category);
  const currentCategoryName = currentCategoryObj ? currentCategoryObj.nom : category;
  const showModeSelector = !isEditMode && (category === 'Toadas' || category === 'Culture' || category === 'TutosFabrication');

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      {/* En-tête avec bouton retour direct */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-dashed border-cordel-master-dark/20 select-none">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex items-center gap-1 text-xs font-bold text-cordel-master-dark hover:text-cordel-wood hover:underline cursor-pointer disabled:opacity-50"
        >
          <span>←</span> Retour au Varal
        </button>
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-cordel-wood bg-cordel-wood/10 px-2 py-0.5 rounded">
          {isEditMode ? "Mode Édition" : "Nouveau Document"}
        </span>
      </div>

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        {/* Corde Native (Fixe / Non modifiable) */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Corde associée (Catégorie native)
          </label>
          <div className="theme-input w-full bg-cordel-wood/10 text-cordel-wood font-extrabold text-xs py-2 px-3 border-2 border-cordel-wood/40 select-none flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>🪢</span> Corde : {currentCategoryName}
            </span>
            <span className="text-[9px] uppercase font-bold text-cordel-master-dark/60 tracking-wider">
              (Fixé)
            </span>
          </div>
        </div>

        {/* Sélecteur de mode (Manuel / Import par lot JSON) */}
        {showModeSelector && (
          <div className="flex gap-2 p-1 bg-cordel-master-dark/5 rounded border border-cordel-master-dark/10">
            <button
              type="button"
              onClick={() => setImportMode('manual')}
              className={`flex-1 text-xs py-1.5 font-bold rounded transition-all cursor-pointer ${
                importMode === 'manual' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-cordel-master-dark hover:bg-black/5'
              }`}
            >
              ✍️ Saisie Manuelle
            </button>
            <button
              type="button"
              onClick={() => setImportMode('import')}
              className={`flex-1 text-xs py-1.5 font-bold rounded transition-all cursor-pointer ${
                importMode === 'import' ? 'bg-cordel-wood text-[#fdfaf2] shadow-sm' : 'text-cordel-master-dark hover:bg-black/5'
              }`}
            >
              📥 Import par lot (.json)
            </button>
          </div>
        )}

        {/* MODE IMPORTATION PAR LOT */}
        {importMode === 'import' && !isEditMode && showModeSelector ? (
          <DocumentFormBatchSection
            category={category}
            batchFile={batchFile}
            onBatchFileChange={setBatchFile}
            isSubmitting={isSubmitting}
            onDownloadTemplate={downloadTemplate}
          />
        ) : (
          /* MODE SAISIE MANUELLE */
          <>
            {/* Titre */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {category === 'TutosFabrication' ? "Nom de l'atelier / tutoriel" : t('documents.docTitleLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder={t('documents.docTitlePlaceholder')}
                className="theme-input w-full disabled:opacity-50"
              />
            </div>

            {/* Champ Séquenceur (Optionnel) pour Signes */}
            {(category.toLowerCase().includes('signe') || category === 'SignesMestre') && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Lien Séquenceur (Optionnel)
                </label>
                <input
                  type="text"
                  value={lienSequenceurId}
                  onChange={(e) => setLienSequenceurId(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="ID ou URL du pattern dans le Séquenceur..."
                  className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
                />
              </div>
            )}

            {/* Sélecteur de format pour ComptesRendus */}
            {category === 'ComptesRendus' && !isEditMode && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Format du Compte-Rendu
                </label>
                <select
                  value={pvType}
                  onChange={(e) => setPvType(e.target.value)}
                  disabled={isSubmitting}
                  className="theme-input w-full disabled:opacity-50 cursor-pointer"
                >
                  <option value="pdf">Uploader un fichier (PDF)</option>
                  <option value="web">Lien URL (vers PV Studio Réunion)</option>
                </select>
              </div>
            )}

            {/* Sélecteur de format pour TutosFabrication */}
            {category === 'TutosFabrication' && !isEditMode && importMode === 'manual' && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Format du Tutoriel
                </label>
                <select
                  value={tutoFabType}
                  onChange={(e) => setTutoFabType(e.target.value)}
                  disabled={isSubmitting}
                  className="theme-input w-full disabled:opacity-50 cursor-pointer"
                >
                  <option value="fabrication">Créer une fiche de fabrication (Saisie manuelle)</option>
                  <option value="web">Lien URL externe (Vidéo YouTube, etc.)</option>
                </select>
              </div>
            )}

            {/* Sélecteur de format pour Culture */}
            {category === 'Culture' && !isEditMode && importMode === 'manual' && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Format de la Fiche Culture
                </label>
                <select
                  value={cultureType}
                  onChange={(e) => setCultureType(e.target.value)}
                  disabled={isSubmitting}
                  className="theme-input w-full disabled:opacity-50 cursor-pointer"
                >
                  <option value="culture_fiche">Créer une fiche (Saisie manuelle)</option>
                  <option value="web">Lien URL externe (Vidéo YouTube, Article, etc.)</option>
                </select>
              </div>
            )}

            {/* URL Externe (pour types web, vidéo ou dossiers de stockage partagés) */}
            {(computedType === 'video' || computedType === 'web' || computedType === 'dossier_externe') && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  {computedType === 'dossier_externe' 
                    ? "Lien du dossier public (Google Drive, Framaspace, Dropbox...)" 
                    : computedType === 'video'
                    ? "URL de la vidéo externe (YouTube, Vimeo...)"
                    : "URL Externe (Lien web, etc.)"}
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder={
                    computedType === 'dossier_externe' 
                      ? "https://drive.google.com/drive/folders/... ou Dropbox, OneDrive" 
                      : computedType === 'video'
                      ? "https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                      : "https://..."
                  }
                  className="theme-input w-full disabled:opacity-50 text-xs font-semibold"
                />
              </div>
            )}

            {/* Upload Document PDF */}
            {computedType === 'pdf' && !isEditMode && (
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Document PDF
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  disabled={isSubmitting}
                  accept="application/pdf"
                  className="theme-input w-full disabled:opacity-50 text-xs py-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cordel-master-light file:text-encre-noire file:cursor-pointer"
                />
              </div>
            )}

            {/* SECTION 1 : Chants & Toadas */}
            {computedType === 'song' && (
              <DocumentFormToadaFields
                category={category}
                nacao={nacao}
                setNacao={setNacao}
                rythme={rythme}
                setRythme={setRythme}
                audioUploadType={audioUploadType}
                setAudioUploadType={setAudioUploadType}
                audioFile={audioFile}
                setAudioFile={setAudioFile}
                audioUrl={audioUrl}
                setAudioUrl={setAudioUrl}
                parolesOriginales={parolesOriginales}
                setParolesOriginales={setParolesOriginales}
                parolesPhonetiques={parolesPhonetiques}
                setParolesPhonetiques={setParolesPhonetiques}
                traduction={traduction}
                setTraduction={setTraduction}
                anecdote={anecdoteSong}
                setAnecdote={setAnecdoteSong}
                isSubmitting={isSubmitting}
              />
            )}

            {/* SECTION 2 : Fiches Culturelles */}
            {computedType === 'culture_fiche' && (
              <DocumentFormCultureFields
                categorieFiche={categorieFiche}
                setCategorieFiche={setCategorieFiche}
                setThemeCulture={setThemeCulture}
                iconeStamp={iconeStamp}
                setIconeStamp={setIconeStamp}
                villeRegion={villeRegion}
                setVilleRegion={setVilleRegion}
                climatGeographie={climatGeographie}
                setClimatGeographie={setClimatGeographie}
                personnageOrisha={personnageOrisha}
                setPersonnageOrisha={setPersonnageOrisha}
                elementNaturel={elementNaturel}
                setElementNaturel={setElementNaturel}
                hexPrimary={hexPrimary}
                setHexPrimary={setHexPrimary}
                hexSecondary={hexSecondary}
                setHexSecondary={setHexSecondary}
                outilAccessoire={outilAccessoire}
                setOutilAccessoire={setOutilAccessoire}
                symbolesSacres={symbolesSacres}
                setSymbolesSacres={setSymbolesSacres}
                roleCortejo={roleCortejo}
                setRoleCortejo={setRoleCortejo}
                epoque={epoque}
                setEpoque={setEpoque}
                rythme={rythme}
                setRythme={setRythme}
                postureDanse={postureDanse}
                setPostureDanse={setPostureDanse}
                ingredientPrincipal={ingredientPrincipal}
                setIngredientPrincipal={setIngredientPrincipal}
                danseData={danseData}
                setDanseData={setDanseData}
                chapitresCulture={chapitresCulture}
                setChapitresCulture={setChapitresCulture}
                legendeImage={legendeImage}
                setLegendeImage={setLegendeImage}
                anecdote={anecdoteCulture}
                setAnecdote={setAnecdoteCulture}
                lexiqueMotsCles={lexiqueMotsCles}
                setLexiqueMotsCles={setLexiqueMotsCles}
                lexique={lexique}
                setLexique={setLexique}
                videoUrlCulture={videoUrlCulture}
                setVideoUrlCulture={setVideoUrlCulture}
                isEditMode={isEditMode}
                file={file}
                onFileChange={setFile}
                externalUrl={externalUrl}
                isSubmitting={isSubmitting}
              />
            )}

            {/* SECTION 3 : Tutoriels de Fabrication */}
            {computedType === 'fabrication' && (
              <DocumentFormFabricationFields
                visuelAnimeType={visuelAnimeType}
                setVisuelAnimeType={setVisuelAnimeType}
                visuelAnimeUrl={visuelAnimeUrl}
                setVisuelAnimeUrl={setVisuelAnimeUrl}
                visuelAnimeFile={visuelAnimeFile}
                setVisuelAnimeFile={setVisuelAnimeFile}
                instrumentConcerne={instrumentConcerne}
                setInstrumentConcerne={setInstrumentConcerne}
                materielRequisList={materielRequisList}
                setMaterielRequisList={setMaterielRequisList}
                outilsNecessairesList={outilsNecessairesList}
                setOutilsNecessairesList={setOutilsNecessairesList}
                etapesFabrication={etapesFabrication}
                setEtapesFabrication={setEtapesFabrication}
                contenuFabrication={contenuFabrication}
                setContenuFabrication={setContenuFabrication}
                anecdote={anecdoteFabrication}
                setAnecdote={setAnecdoteFabrication}
                isSubmitting={isSubmitting}
              />
            )}

            {/* SECTION 4 : Lexique & Constructeur de QCM */}
            {(computedType === 'song' || computedType === 'fabrication' || computedType === 'culture_fiche') && (
              <DocumentFormQuizBuilder
                notesLexique={notesLexique}
                setNotesLexique={setNotesLexique}
                questionsQcm={questionsQcm}
                setQuestionsQcm={setQuestionsQcm}
                isSubmitting={isSubmitting}
                showLexiqueNotes={computedType === 'song' || computedType === 'fabrication'}
              />
            )}

            {/* Options globales : Pédagogie, Archivage, Masquage */}
            {(category === 'Toadas' || category === 'Culture') && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-2 bg-cordel-bg border border-cordel-ocre/50 p-3 rounded shadow-xs">
                  <input
                    type="checkbox"
                    id="excludeFromPedagogyCheck"
                    checked={excludeFromPedagogy}
                    onChange={(e) => setExcludeFromPedagogy(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-4 h-4 text-cordel-ocre rounded focus:ring-cordel-ocre cursor-pointer"
                  />
                  <label htmlFor="excludeFromPedagogyCheck" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
                    📙 Exclure du parcours (Ne pas utiliser pour les QCM ni le Carnet d'Aisance)
                  </label>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 bg-cordel-bg border border-cordel-wood/30 p-3 rounded shadow-xs">
                <input
                  type="checkbox"
                  id="isArchivedCheck"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-cordel-wood rounded focus:ring-cordel-wood cursor-pointer"
                />
                <label htmlFor="isArchivedCheck" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
                  📦 Archiver (Griser sur la page principale et marquer comme ancienne année)
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2 bg-cordel-bg border border-cordel-rouge/30 p-3 rounded shadow-xs">
              <input
                type="checkbox"
                id="isHiddenCheck"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                disabled={isSubmitting}
                className="w-4 h-4 text-cordel-rouge rounded focus:ring-cordel-rouge cursor-pointer"
              />
              <label htmlFor="isHiddenCheck" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
                👁️ Masquer sur le Varal (Brouillon / En préparation)
              </label>
            </div>
          </>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-encre-noire/10">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-xs px-4 py-2 cursor-pointer"
          >
            {t('common.cancel')}
          </CordelButton>
          <CordelButton 
            type="submit" 
            variant="ocre" 
            useExtremeBorder={true}
            disabled={isSubmitting}
            className="text-xs px-4 py-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {t('documents.uploadingMsg') || "Enregistrement..."}
              </span>
            ) : (
              isEditMode ? t('common.save') : (importMode === 'import' ? "Importer le lot JSON" : t('common.confirm') || "Valider")
            )}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
