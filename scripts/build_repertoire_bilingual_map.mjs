/**
 * Générateur du dictionnaire bilingue pour le module Répertoire & Modales (Mestria)
 */

import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('scripts/repertoire_texts_to_translate.json', 'utf8'));

// Dictionnaire bilingue précis
const translations = {
  // Messages runtime & alertes
  "Erreur lors de la modification du statut du répertoire.": {
    key: "errStatusChange",
    fr: "Erreur lors de la modification du statut du répertoire.",
    pt: "Erro ao alterar o status do repertório."
  },
  "Erreur lors de la suppression.": {
    key: "errDelete",
    fr: "Erreur lors de la suppression.",
    pt: "Erro ao excluir."
  },
  "Erreur lors de l'importation du morceau dans le Répertoire.": {
    key: "errImportPiece",
    fr: "Erreur lors de l'importation du morceau dans le Répertoire.",
    pt: "Erro ao importar a música para o Repertório."
  },
  "Erreur lors de la synchronisation avec le Séquenceur.": {
    key: "errSyncSequencer",
    fr: "Erreur lors de la synchronisation avec le Séquenceur.",
    pt: "Erro ao sincronizar com o Sequenciador."
  },
  "La fiche de ce chant n'a pas pu être trouvée sur le Varal.": {
    key: "errSongNotFoundOnVaral",
    fr: "La fiche de ce chant n'a pas pu être trouvée sur le Varal.",
    pt: "A ficha desta toada não foi encontrada no Varal."
  },
  "Le fichier audio est trop volumineux (maximum 25 Mo).": {
    key: "errAudioTooLarge",
    fr: "Le fichier audio est trop volumineux (maximum 25 Mo).",
    pt: "O arquivo de áudio é muito grande (máximo 25 MB)."
  },
  "Erreur lors de l'envoi du fichier audio.": {
    key: "errUploadAudio",
    fr: "Erreur lors de l'envoi du fichier audio.",
    pt: "Erro ao enviar o arquivo de áudio."
  },
  "Veuillez sélectionner un fichier image (JPG, PNG, WebP).": {
    key: "alertSelectImageFile",
    fr: "Veuillez sélectionner un fichier image (JPG, PNG, WebP).",
    pt: "Selecione um arquivo de imagem (JPG, PNG, WebP)."
  },
  "Erreur lors du téléversement de l'image.": {
    key: "alertUploadImageError",
    fr: "Erreur lors du téléversement de l'image.",
    pt: "Erro ao fazer upload da imagem."
  },
  "Veuillez sélectionner un fichier au format PDF.": {
    key: "alertSelectPdfFile",
    fr: "Veuillez sélectionner un fichier au format PDF.",
    pt: "Selecione um arquivo no formato PDF."
  },
  "Erreur lors du téléversement du document PDF.": {
    key: "alertUploadPdfError",
    fr: "Erreur lors du téléversement du document PDF.",
    pt: "Erro ao fazer upload do documento PDF."
  },

  // MestreRepertoireView & Header
  "⏳ Chargement du répertoire vivant...": {
    key: "loadingRepertoire",
    fr: "⏳ Chargement du répertoire vivant...",
    pt: "⏳ Carregando o repertório vivo..."
  },
  "➕ Ajouter un premier morceau": {
    key: "addFirstPiece",
    fr: "➕ Ajouter un premier morceau",
    pt: "➕ Adicionar uma primeira música"
  },
  "➕ Ajouter un morceau": {
    key: "addPiece",
    fr: "➕ Ajouter un morceau",
    pt: "➕ Adicionar música"
  },
  "Cliquer pour ouvrir et modifier la fiche de ce morceau": {
    key: "clickToEditPiece",
    fr: "Cliquer pour ouvrir et modifier la fiche de ce morceau",
    pt: "Clique para abrir e editar a ficha desta música"
  },
  "Audio": {
    key: "badgeAudio",
    fr: "Audio",
    pt: "Áudio"
  },
  "Tablature vivante": {
    key: "tablatureVivante",
    fr: "Tablature vivante",
    pt: "Tablatura viva"
  },
  "Consulter l'aide-mémoire des signes du Mestre": {
    key: "consultSignalsTitle",
    fr: "Consulter l'aide-mémoire des signes du Mestre",
    pt: "Consultar os sinais do Mestre"
  },
  "Signe": {
    key: "signalBadge",
    fr: "Signe",
    pt: "Sinal"
  },
  "Afficher les entraînements associés": {
    key: "showTrainingsTitle",
    fr: "Afficher les entraînements associés",
    pt: "Exibir treinos associados"
  },
  "entraînement": {
    key: "trainingSingular",
    fr: "entraînement",
    pt: "treino"
  },
  "Autonome (joué de mémoire)": {
    key: "autonomousBadge",
    fr: "Autonome (joué de mémoire)",
    pt: "Autônomo (tocado de memória)"
  },
  "Audio de référence :": {
    key: "referenceAudioLabel",
    fr: "Audio de référence :",
    pt: "Áudio de referência:"
  },
  "✓ direct séquenceur": {
    key: "directSequencer",
    fr: "✓ direct séquenceur",
    pt: "✓ direto do sequenciador"
  },
  "✓ direct toada": {
    key: "directToada",
    fr: "✓ direct toada",
    pt: "✓ direto da toada"
  },
  "✋ Signes :": {
    key: "signalsLabel",
    fr: "✋ Signes :",
    pt: "✋ Sinais:"
  },
  "Entraînements (": {
    key: "trainingsPrefix",
    fr: "Entraînements (",
    pt: "Treinos ("
  },
  "sequenciador": {
    key: "sequencerBadge",
    fr: "sequenciador",
    pt: "sequenciador"
  },
  "Ouvrir et travailler ce morceau dans le Séquenceur avec SSO": {
    key: "openInSequencerTitle",
    fr: "Ouvrir et travailler ce morceau dans le Séquenceur avec SSO",
    pt: "Abrir e praticar esta música no Sequenciador com login único"
  },
  "Consulter et imprimer la tablature (calculée à la volée)": {
    key: "consultTablatureTitle",
    fr: "Consulter et imprimer la tablature (calculée à la volée)",
    pt: "Consultar e imprimir a tablatura (calculada em tempo real)"
  },
  "Tablature": {
    key: "tablatureBadge",
    fr: "Tablature",
    pt: "Tablatura"
  },
  "Toada": {
    key: "toadaBadge",
    fr: "Toada",
    pt: "Toada"
  },
  "Consulter les fiches culturelles associées": {
    key: "consultCultureSheetsTitle",
    fr: "Consulter les fiches culturelles associées",
    pt: "Consultar as fichas culturais associadas"
  },
  "fiches Culture": {
    key: "cultureSheetsBadge",
    fr: "fiches Culture",
    pt: "fichas de Cultura"
  },
  "Consulter la fiche culturelle du Varal associée": {
    key: "consultSingleCultureTitle",
    fr: "Consulter la fiche culturelle du Varal associée",
    pt: "Consultar a ficha cultural do Varal associada"
  },
  "Fiche Culture": {
    key: "singleCultureBadge",
    fr: "Fiche Culture",
    pt: "Ficha de Cultura"
  },
  "Créer une fiche du Varal Culture pré-remplie avec le Contexte & Histoire du morceau (contexteHistorique)": {
    key: "createCultureFromContextTitle",
    fr: "Créer une fiche du Varal Culture pré-remplie avec le Contexte & Histoire du morceau (contexteHistorique)",
    pt: "Criar ficha do Varal de Cultura pré-preenchida com o contexto e história da música"
  },
  "Ajouter au fil conducteur d'une répétition ou d'un concert": {
    key: "addToProgramTitle",
    fr: "Ajouter au fil conducteur d'une répétition ou d'un concert",
    pt: "Adicionar ao roteiro de um ensaio ou apresentação"
  },
  "➕ Programmer": {
    key: "btnProgram",
    fr: "➕ Programmer",
    pt: "➕ Programar"
  },
  "Modifier les informations": {
    key: "editPieceInfoTitle",
    fr: "Modifier les informations",
    pt: "Editar informações da música"
  },
  "Fiches Culturelles —": {
    key: "cultureSheetsModalHeading",
    fr: "Fiches Culturelles —",
    pt: "Fichas Culturais —"
  },
  "Sélectionnez la fiche culturelle à consulter :": {
    key: "selectCultureToConsult",
    fr: "Sélectionnez la fiche culturelle à consulter :",
    pt: "Selecione a ficha cultural para consultar:"
  },
  "Consulter ↗": {
    key: "btnConsultExternal",
    fr: "Consulter ↗",
    pt: "Consultar ↗"
  },
  "Direction Artistique —": {
    key: "headerArtisticDirection",
    fr: "Direction Artistique —",
    pt: "Direção Artística —"
  },
  "Architecture réactive vivante liée au Séquenceur, au Varal et à Dançad'Or": {
    key: "headerSubtitleArchitecture",
    fr: "Architecture réactive vivante liée au Séquenceur, au Varal et à Dançad'Or",
    pt: "Arquitetura viva integrada ao Sequenciador, ao Varal e ao Dançad'Or"
  },
  "Ouvert au groupe": {
    key: "statusOpenToGroup",
    fr: "Ouvert au groupe",
    pt: "Aberto ao grupo"
  },
  "Masquer le répertoire aux adhérents": {
    key: "hideRepertoireTitle",
    fr: "Masquer le répertoire aux adhérents",
    pt: "Ocultar o repertório dos integrantes"
  },
  "Masquer": {
    key: "btnHide",
    fr: "Masquer",
    pt: "Ocultar"
  },
  "Masqué": {
    key: "statusHidden",
    fr: "Masqué",
    pt: "Oculto"
  },
  "Ouvrir le répertoire aux adhérents": {
    key: "openRepertoireTitle",
    fr: "Ouvrir le répertoire aux adhérents",
    pt: "Abrir o repertório aos integrantes"
  },
  "Ouvrir": {
    key: "btnOpen",
    fr: "Ouvrir",
    pt: "Abrir"
  },
  "Affecter une vidéo à plusieurs morceaux du répertoire": {
    key: "batchAssignVideoTitle",
    fr: "Affecter une vidéo à plusieurs morceaux du répertoire",
    pt: "Vincular um vídeo a várias músicas do repertório"
  },
  "Affecter vidéo par lot": {
    key: "btnBatchAssignVideo",
    fr: "Affecter vidéo par lot",
    pt: "Vincular vídeo em lote"
  },

  // RepertoirePieceModal
  "Fermer": {
    key: "btnClose",
    fr: "Fermer",
    pt: "Fechar"
  },
  "Injecter le titre de la toada sélectionnée": {
    key: "injectToadaTitle",
    fr: "Injecter le titre de la toada sélectionnée",
    pt: "Usar o título da toada selecionada"
  },
  "💡 Suggérer «": {
    key: "suggestPrefix",
    fr: "💡 Suggérer «",
    pt: "💡 Sugerir «"
  },
  "Correspondances détectées :": {
    key: "matchesDetected",
    fr: "Correspondances détectées :",
    pt: "Correspondências detectadas:"
  },
  "Lier au Preset Séquenceur détecté": {
    key: "linkToPresetTitle",
    fr: "Lier au Preset Séquenceur détecté",
    pt: "Vincular ao Preset do Sequenciador detectado"
  },
  "🥁 Lier au Preset «": {
    key: "linkToPresetBtn",
    fr: "🥁 Lier au Preset «",
    pt: "🥁 Vincular ao Preset «"
  },
  "Lier à la Toada détectée": {
    key: "linkToToadaTitle",
    fr: "Lier à la Toada détectée",
    pt: "Vincular à Toada detectada"
  },
  "🗣️ Lier à la Toada «": {
    key: "linkToToadaBtn",
    fr: "🗣️ Lier à la Toada «",
    pt: "🗣️ Vincular à Toada «"
  },
  "Lier à la chorégraphie Dançad'Or détectée": {
    key: "linkToDanceTitle",
    fr: "Lier à la chorégraphie Dançad'Or détectée",
    pt: "Vincular à coreografia do Dançad'Or detectada"
  },
  "💃 Lier à la Danse «": {
    key: "linkToDanceBtn",
    fr: "💃 Lier à la Danse «",
    pt: "💃 Vincular à Dança «"
  },
  "Lier à la fiche Varal Culture détectée": {
    key: "linkToCultureTitle",
    fr: "Lier à la fiche Varal Culture détectée",
    pt: "Vincular à ficha do Varal de Cultura detectada"
  },
  "📖 Lier à la Culture «": {
    key: "linkToCultureBtn",
    fr: "📖 Lier à la Culture «",
    pt: "📖 Vincular à Cultura «"
  },
  "La validation est libre : un morceau peut être prêt même sans ressource externe attachée.": {
    key: "validationNoticeFree",
    fr: "La validation est libre : un morceau peut être prêt même sans ressource externe attachée.",
    pt: "A validação é flexível: uma música pode estar pronta mesmo sem recurso externo vinculado."
  },
  "🔗 Liaisons transversales vivantes (Varal, Séquenceur, Danse)": {
    key: "liveCrossLinksHeading",
    fr: "🔗 Liaisons transversales vivantes (Varal, Séquenceur, Danse)",
    pt: "🔗 Integrações ativas (Varal, Sequenciador, Dança)"
  },
  "Cliquer pour utiliser le nom de cette toada comme titre du morceau": {
    key: "useToadaNameAsTitle",
    fr: "Cliquer pour utiliser le nom de cette toada comme titre du morceau",
    pt: "Clique para usar o nome desta toada como título da música"
  },
  "Définir comme titre :": {
    key: "setAsTitleLabel",
    fr: "Définir comme titre :",
    pt: "Definir como título:"
  },
  "Consulter les paroles complètes de ce chant": {
    key: "consultLyricsTitle",
    fr: "Consulter les paroles complètes de ce chant",
    pt: "Consultar a letra completa desta toada"
  },
  "Lire les paroles de «": {
    key: "readLyricsOf",
    fr: "Lire les paroles de «",
    pt: "Ler a letra de «"
  },
  "⭐ 🎛️ Préréglages Complets (Presets - Audio & Tablature en direct)": {
    key: "optGroupPresets",
    fr: "⭐ 🎛️ Préréglages Complets (Presets - Audio & Tablature en direct)",
    pt: "⭐ 🎛️ Predefinições Completas (Presets - Áudio & Tablatura ao vivo)"
  },
  "📑 Séquences & Arrangements (Sections)": {
    key: "optGroupSections",
    fr: "📑 Séquences & Arrangements (Sections)",
    pt: "📑 Sequências & Arranjos (Seções)"
  },
  "🥁 Motifs individuels & Fichiers JSON": {
    key: "optGroupPatterns",
    fr: "🥁 Motifs individuels & Fichiers JSON",
    pt: "🥁 Levadas individuais & Arquivos JSON"
  },
  "Liaison vivante : audio, BPM, signes et tablature seront lus en direct depuis ce preset.": {
    key: "livePresetNotice",
    fr: "Liaison vivante : audio, BPM, signes et tablature seront lus en direct depuis ce preset.",
    pt: "Integração viva: áudio, BPM, sinais e tablatura serão carregados em tempo real deste preset."
  },
  "Audio de référence": {
    key: "referenceAudioHeading",
    fr: "Audio de référence",
    pt: "Áudio de referência"
  },
  "Dissocier cet enregistrement audio personnalisé": {
    key: "detachCustomAudioTitle",
    fr: "Dissocier cet enregistrement audio personnalisé",
    pt: "Desvincular esta gravação de áudio personalizada"
  },
  "Effacer": {
    key: "btnErase",
    fr: "Effacer",
    pt: "Limpar"
  },
  "🎧 Masters Audio & Enregistrements du Séquenceur": {
    key: "optGroupMastersAudio",
    fr: "🎧 Masters Audio & Enregistrements du Séquenceur",
    pt: "🎧 Masters de Áudio & Gravações do Sequenciador"
  },
  "🔗 Audio personnalisé": {
    key: "optGroupCustomAudio",
    fr: "🔗 Audio personnalisé",
    pt: "🔗 Áudio personalizado"
  },
  "🎵 Fichier lié (": {
    key: "linkedFilePrefix",
    fr: "🎵 Fichier lié (",
    pt: "🎵 Arquivo vinculado ("
  },
  "ou": {
    key: "orWord",
    fr: "ou",
    pt: "ou"
  },
  "🔗 Coller une URL": {
    key: "pasteUrlLabel",
    fr: "🔗 Coller une URL",
    pt: "🔗 Colar uma URL"
  },
  "▶ Pré-écoute de l'audio :": {
    key: "audioPreviewLabel",
    fr: "▶ Pré-écoute de l'audio :",
    pt: "▶ Pré-escuta do áudio:"
  },
  "💃 Chorégraphie liée": {
    key: "linkedChoreographyHeading",
    fr: "💃 Chorégraphie liée",
    pt: "💃 Coreografia vinculada"
  },
  "fiche(s) culture": {
    key: "cultureSheetsCountLabel",
    fr: "fiche(s) culture",
    pt: "ficha(s) de cultura"
  },
  "Aucune liaison transversale active": {
    key: "noActiveCrossLinks",
    fr: "Aucune liaison transversale active",
    pt: "Nenhuma integração ativa"
  },
  "Tablature résolue du Séquenceur": {
    key: "resolvedTablatureHeading",
    fr: "Tablature résolue du Séquenceur",
    pt: "Tablatura resolvida do Sequenciador"
  },
  "🎬 Vidéo de référence & Histoire culturelle": {
    key: "refVideoAndCultureHeading",
    fr: "🎬 Vidéo de référence & Histoire culturelle",
    pt: "🎬 Vídeo de referência & História cultural"
  },
  "Créer une fiche sur le Varal Culture pré-remplie avec ces informations": {
    key: "createCultureSheetVaralTitle",
    fr: "Créer une fiche sur le Varal Culture pré-remplie avec ces informations",
    pt: "Criar ficha no Varal de Cultura pré-preenchida com estas informações"
  },
  "Lien vidéo YouTube propre au morceau": {
    key: "youtubeVideoPieceLabel",
    fr: "Lien vidéo YouTube propre au morceau",
    pt: "Link do vídeo do YouTube próprio da música"
  },
  "Choisir parmi les playlists YouTube configurées de l'association": {
    key: "chooseFromPlaylistsTitle",
    fr: "Choisir parmi les playlists YouTube configurées de l'association",
    pt: "Escolher entre as playlists do YouTube da associação"
  },
  "🎬 Choisir parmi nos vidéos": {
    key: "btnChooseFromVideos",
    fr: "🎬 Choisir parmi nos vidéos",
    pt: "🎬 Escolher entre nossos vídeos"
  },
  "Vidéo YouTube reconnue (ID :": {
    key: "youtubeVideoRecognizedPrefix",
    fr: "Vidéo YouTube reconnue (ID :",
    pt: "Vídeo do YouTube identificado (ID:"
  },
  "Notes d'histoire & contexte artistique": {
    key: "historyNotesHeading",
    fr: "Notes d'histoire & contexte artistique",
    pt: "História & contexto artístico"
  },
  "Renseignez l'histoire spécifique, la nation d'origine ou l'inspiration du morceau...": {
    key: "historyNotesPlaceholder",
    fr: "Renseignez l'histoire spécifique, la nation d'origine ou l'inspiration du morceau...",
    pt: "Informe a história específica, a nação de origem ou a inspiração da música..."
  },
  "🎬 Vidéo principale configurée": {
    key: "mainVideoConfigured",
    fr: "🎬 Vidéo principale configurée",
    pt: "🎬 Vídeo principal configurado"
  },
  "Pas de vidéo principale": {
    key: "noMainVideo",
    fr: "Pas de vidéo principale",
    pt: "Sem vídeo principal"
  },
  "📜 Contexte historique renseigné": {
    key: "historyContextProvided",
    fr: "📜 Contexte historique renseigné",
    pt: "📜 Contexto histórico preenchido"
  },
  "✌️ Signes du Mestre associés": {
    key: "mestreSignalsHeading",
    fr: "✌️ Signes du Mestre associés",
    pt: "✌️ Sinais do Mestre vinculados"
  },
  "signe(s) configuré(s)": {
    key: "configuredSignalsCount",
    fr: "signe(s) configuré(s)",
    pt: "sinal(is) configurado(s)"
  },
  "Aucun signe du Mestre associé": {
    key: "noSignalsAssociated",
    fr: "Aucun signe du Mestre associé",
    pt: "Nenhum sinal do Mestre associado"
  },
  "Aucune note particulière": {
    key: "noSpecialNotes",
    fr: "Aucune note particulière",
    pt: "Nenhuma observação especial"
  },
  "Annuler": {
    key: "btnCancel",
    fr: "Annuler",
    pt: "Cancelar"
  },
  "Chant & Paroles": {
    key: "songAndLyricsHeading",
    fr: "Chant & Paroles",
    pt: "Canto & Letra"
  },

  // RepertoirePieceStatusSelector
  "Statut de la saison": {
    key: "seasonStatusHeading",
    fr: "Statut de la saison",
    pt: "Status da temporada"
  },
  "Modifier le statut de la saison : Au programme / En préparation / Au frigo": {
    key: "changeSeasonStatusTitle",
    fr: "Modifier le statut de la saison : Au programme / En préparation / Au frigo",
    pt: "Alterar o status da temporada: No repertório / Em preparação / Guardado"
  },
  "Au programme cette année": {
    key: "statusInProgramThisYear",
    fr: "Au programme cette année",
    pt: "No repertório deste ano"
  },
  "En préparation / Chantier": {
    key: "statusInPreparation",
    fr: "En préparation / Chantier",
    pt: "Em preparação / Ensaio"
  },
  "Au frigo / Archives": {
    key: "statusArchived",
    fr: "Au frigo / Archives",
    pt: "Guardado / Arquivo"
  },

  // ProgramPieceModal & ProgramRehearsalModal
  "🎵 Audio lié": {
    key: "audioLinkedBadge",
    fr: "🎵 Audio lié",
    pt: "🎵 Áudio vinculado"
  },
  "🗣️ Toada liée": {
    key: "toadaLinkedBadge",
    fr: "🗣️ Toada liée",
    pt: "🗣️ Toada vinculada"
  },
  "💃 Danse liée": {
    key: "danceLinkedBadge",
    fr: "💃 Danse liée",
    pt: "💃 Dança vinculada"
  },
  "📖 Culture liée": {
    key: "cultureLinkedBadge",
    fr: "📖 Culture liée",
    pt: "📖 Cultura vinculada"
  },
  "Morceau autonome (sans ressource externe)": {
    key: "autonomousResourceNotice",
    fr: "Morceau autonome (sans ressource externe)",
    pt: "Música autônoma (sem recurso externo)"
  },
  "Chargement de l'agenda...": {
    key: "loadingAgenda",
    fr: "Chargement de l'agenda...",
    pt: "Carregando a agenda..."
  },
  "Consignes & Notes d'intention pour la séance (optionnel)": {
    key: "rehearsalNotesLabel",
    fr: "Consignes & Notes d'intention pour la séance (optionnel)",
    pt: "Instruções & Notas de intenção para o ensaio (opcional)"
  },
  "Ex: Travailler l'appel du Mestre, caler le tempo à 120 BPM, vérifier la relance des caixas...": {
    key: "rehearsalNotesPlaceholder",
    fr: "Ex: Travailler l'appel du Mestre, caler le tempo à 120 BPM, vérifier la relance des caixas...",
    pt: "Ex: Praticar a chamada do Mestre, ajustar o andamento para 120 BPM, verificar a levada das caixas..."
  },
  "Programmer en répétition": {
    key: "programInRehearsalHeading",
    fr: "Programmer en répétition",
    pt: "Programar no ensaio"
  },
  "demande": {
    key: "requestsWord",
    fr: "demande",
    pt: "pedido"
  },
  "d'élèves": {
    key: "ofStudentsWord",
    fr: "d'élèves",
    pt: "de alunos"
  },
  "% maîtrise": {
    key: "percentMastery",
    fr: "% maîtrise",
    pt: "% domínio"
  },
  "1. Choisir la répétition cible *": {
    key: "stepChooseRehearsal",
    fr: "1. Choisir la répétition cible *",
    pt: "1. Escolher o ensaio de destino *"
  },
  "Recherche des répétitions à venir...": {
    key: "searchingUpcomingRehearsals",
    fr: "Recherche des répétitions à venir...",
    pt: "Buscando próximos ensaios..."
  },
  "⚠️ Aucune répétition planifiée dans l'Agenda à compter d'aujourd'hui. Veuillez d'abord créer une répétition dans l'Agenda.": {
    key: "noRehearsalsPlannedNotice",
    fr: "⚠️ Aucune répétition planifiée dans l'Agenda à compter d'aujourd'hui. Veuillez d'abord créer une répétition dans l'Agenda.",
    pt: "⚠️ Nenhum ensaio agendado a partir de hoje. Por favor, crie um ensaio na Agenda primeiro."
  },
  "2. Note d'intention pour le fil conducteur (modifiable)": {
    key: "stepRehearsalNote",
    fr: "2. Note d'intention pour le fil conducteur (modifiable)",
    pt: "2. Nota de intenção para o roteiro (editável)"
  },
  "Ex: Travailler le calage rythmique et le pont vers le chant...": {
    key: "stepRehearsalNotePlaceholder",
    fr: "Ex: Travailler le calage rythmique et le pont vers le chant...",
    pt: "Ex: Ajustar a precisão rítmica e a transição para o canto..."
  },
  "Cette note apparaîtra directement dans l'onglet « Fil conducteur » de l'événement.": {
    key: "noteAppearsInRunsheetNotice",
    fr: "Cette note apparaîtra directement dans l'onglet « Fil conducteur » de l'événement.",
    pt: "Esta nota aparecerá diretamente na aba « Roteiro » do evento."
  },

  // RepertoireCulturePicker & RepertoireModalNavArrows
  "liée": {
    key: "linkedFeminine",
    fr: "liée",
    pt: "vinculada"
  },
  "Créer une fiche sur le Varal Culture pré-remplie": {
    key: "createPrefilledCultureSheetTitle",
    fr: "Créer une fiche sur le Varal Culture pré-remplie",
    pt: "Criar ficha no Varal de Cultura pré-preenchida"
  },
  "Détacher cette fiche culturelle": {
    key: "detachCultureSheetTitle",
    fr: "Détacher cette fiche culturelle",
    pt: "Desvincular esta ficha cultural"
  },
  "Aucune fiche culturelle liée pour le moment. Cochez les fiches correspondantes ci-dessous.": {
    key: "noCultureSheetsLinkedNotice",
    fr: "Aucune fiche culturelle liée pour le moment. Cochez les fiches correspondantes ci-dessous.",
    pt: "Nenhuma ficha cultural vinculada até o momento. Selecione as fichas correspondentes abaixo."
  },
  "Effacer la recherche": {
    key: "clearSearchTitle",
    fr: "Effacer la recherche",
    pt: "Limpar busca"
  },
  "Morceau précédent": {
    key: "previousPieceAria",
    fr: "Morceau précédent",
    pt: "Música anterior"
  },
  "Précédent (": {
    key: "previousPiecePrefix",
    fr: "Précédent (",
    pt: "Anterior ("
  },
  "Raccourci : touche ←": {
    key: "shortcutLeftArrow",
    fr: "Raccourci : touche ←",
    pt: "Atalho: tecla ←"
  },
  "Morceau suivant": {
    key: "nextPieceAria",
    fr: "Morceau suivant",
    pt: "Próxima música"
  },
  "Suivant (": {
    key: "nextPiecePrefix",
    fr: "Suivant (",
    pt: "Próxima ("
  },
  "Raccourci : touche →": {
    key: "shortcutRightArrow",
    fr: "Raccourci : touche →",
    pt: "Atalho: tecla →"
  },

  // RepertoireVideoModal & RepertoireVideosPicker
  "Ouvrir dans un nouvel onglet": {
    key: "openInNewTabTitle",
    fr: "Ouvrir dans un nouvel onglet",
    pt: "Abrir em nova aba"
  },
  "Plein écran externe": {
    key: "fullscreenExternalBtn",
    fr: "Plein écran externe",
    pt: "Tela cheia externa"
  },
  "Votre navigateur ne supporte pas la lecture directe de vidéos.": {
    key: "browserNoVideoSupport",
    fr: "Votre navigateur ne supporte pas la lecture directe de vidéos.",
    pt: "Seu navegador não suporta a reprodução direta de vídeos."
  },
  "Impossible d'intégrer ce lien directement dans l'application.": {
    key: "cannotEmbedDirectlyNotice",
    fr: "Impossible d'intégrer ce lien directement dans l'application.",
    pt: "Não foi possível carregar este link diretamente no aplicativo."
  },
  "Ouvrir la vidéo dans un nouvel onglet ↗": {
    key: "openVideoInNewTabBtn",
    fr: "Ouvrir la vidéo dans un nouvel onglet ↗",
    pt: "Abrir vídeo em nova aba ↗"
  },
  "Choisir parmi les vidéos de l'asso": {
    key: "chooseFromAssoVideosTitle",
    fr: "Choisir parmi les vidéos de l'asso",
    pt: "Escolher entre os vídeos da associação"
  },
  "🎬 Vidéos asso": {
    key: "btnAssoVideos",
    fr: "🎬 Vidéos asso",
    pt: "🎬 Vídeos da associação"
  },
  "Aucune vidéo rattachée pour le moment.": {
    key: "noVideosAttachedNotice",
    fr: "Aucune vidéo rattachée pour le moment.",
    pt: "Nenhum vídeo vinculado até o momento."
  },
  "Vidéo #": {
    key: "videoNumberPrefix",
    fr: "Vidéo #",
    pt: "Vídeo nº "
  },
  "Live / Captation": {
    key: "liveCaptureBadge",
    fr: "Live / Captation",
    pt: "Ao vivo / Gravação"
  },
  "Supprimer cette vidéo": {
    key: "deleteThisVideoTitle",
    fr: "Supprimer cette vidéo",
    pt: "Excluir este vídeo"
  },
  "Libellé :": {
    key: "labelFieldPrefix",
    fr: "Libellé :",
    pt: "Título / Descrição:"
  },
  "Lien URL :": {
    key: "urlFieldPrefix",
    fr: "Lien URL :",
    pt: "Link URL:"
  },

  // SignalZoomModal & TablatureModal
  "Signal": {
    key: "signalModalHeading",
    fr: "Signal",
    pt: "Sinal"
  },
  "Partition textuelle monospace générée depuis le Séquenceur": {
    key: "monospaceTablatureSubtitle",
    fr: "Partition textuelle monospace générée depuis le Séquenceur",
    pt: "Partitura em texto monoespaçado gerada pelo Sequenciador"
  },
  "Lancer l'impression papier de cette tablature": {
    key: "printTablatureTitle",
    fr: "Lancer l'impression papier de cette tablature",
    pt: "Imprimir esta tablatura"
  },
  "Copier l'intégralité du texte dans le presse-papier": {
    key: "copyTextToClipboardTitle",
    fr: "Copier l'intégralité du texte dans le presse-papier",
    pt: "Copiar todo o texto para a área de transferência"
  },
  "Astuce : défilement horizontal disponible pour les longues mesures.": {
    key: "horizontalScrollTip",
    fr: "Astuce : défilement horizontal disponible pour les longues mesures.",
    pt: "Dica: rolagem horizontal disponível para compassos longos."
  },

  // VideoInstrumentCheckboxes
  "Classée dans le bloc « Live / Ensemble »": {
    key: "classifiedInLiveBlock",
    fr: "Classée dans le bloc « Live / Ensemble »",
    pt: "Classificado no bloco « Ao vivo / Geral »"
  },
  "(Tous pupitres / vue générale)": {
    key: "allInstrumentsGeneralView",
    fr: "(Tous pupitres / vue générale)",
    pt: "(Todos os naipes / visão geral)"
  },
  "sélectionné": {
    key: "selectedSingular",
    fr: "sélectionné",
    pt: "selecionado"
  },
  "Associer à tous les instruments": {
    key: "selectAllInstrumentsTitle",
    fr: "Associer à tous les instruments",
    pt: "Associar a todos os instrumentos"
  },
  "Décocher tous les instruments": {
    key: "uncheckAllInstrumentsTitle",
    fr: "Décocher tous les instruments",
    pt: "Desmarcar todos os instrumentos"
  },

  // WorkshopEditorModal
  "🧵 Éditeur de Tutoriel Atelier Couture": {
    key: "workshopEditorTitle",
    fr: "🧵 Éditeur de Tutoriel Atelier Couture",
    pt: "🧵 Editor de Tutorial do Ateliê de Costura"
  },
  "Fermer (Échap)": {
    key: "closeEscapeTitle",
    fr: "Fermer (Échap)",
    pt: "Fechar (Esc)"
  },
  "Titre du Tutoriel": {
    key: "workshopTitleLabel",
    fr: "Titre du Tutoriel",
    pt: "Título do Tutorial"
  },
  "ex: Tutoriel : Bracelets de Maracatu": {
    key: "workshopTitlePlaceholder",
    fr: "ex: Tutoriel : Bracelets de Maracatu",
    pt: "ex: Tutorial: Braçadeiras de Maracatu"
  },
  "Coût estimé (€)": {
    key: "estimatedCostLabel",
    fr: "Coût estimé (€)",
    pt: "Custo estimado (€)"
  },
  "ex: 15.00": {
    key: "costPlaceholder",
    fr: "ex: 15.00",
    pt: "ex: 15.00"
  },
  "Description courte / Résumé": {
    key: "shortDescLabel",
    fr: "Description courte / Résumé",
    pt: "Descrição curta / Resumo"
  },
  "ex: Fiche de confection complète des bracelets dorés et rubans": {
    key: "shortDescPlaceholder",
    fr: "ex: Fiche de confection complète des bracelets dorés et rubans",
    pt: "ex: Ficha de confecção completa das braçadeiras douradas com fitas"
  },
  "Statut de publication": {
    key: "publicationStatusLabel",
    fr: "Statut de publication",
    pt: "Status de publicação"
  },
  "Liste du matériel nécessaire & Fournitures": {
    key: "materialsAndSuppliesLabel",
    fr: "Liste du matériel nécessaire & Fournitures",
    pt: "Lista de materiais necessários & Aviamentos"
  },
  "ex: 2m de tissu satin rouge, Fil doré N°40, 10 boutons à pression...": {
    key: "materialsPlaceholder",
    fr: "ex: 2m de tissu satin rouge, Fil doré N°40, 10 boutons à pression...",
    pt: "ex: 2m de cetim vermelho, Linha dourada nº 40, 10 botões de pressão..."
  },
  "Instructions & Étapes de fabrication": {
    key: "instructionsAndStepsLabel",
    fr: "Instructions & Étapes de fabrication",
    pt: "Instruções & Etapas de confecção"
  },
  "Détaillez les étapes pas-à-pas pour coudre la pièce...": {
    key: "stepsInstructionsPlaceholder",
    fr: "Détaillez les étapes pas-à-pas pour coudre la pièce...",
    pt: "Descreva o passo a passo para costurar a peça..."
  },
  "Lien Vidéo Tutoriel (YouTube, Vimeo, Google Drive...)": {
    key: "tutorialVideoLinkLabel",
    fr: "Lien Vidéo Tutoriel (YouTube, Vimeo, Google Drive...)",
    pt: "Link do Vídeo Tutorial (YouTube, Vimeo, Google Drive...)"
  },
  "📸 Galerie de Photos & Schémas (": {
    key: "galleryPhotosPrefix",
    fr: "📸 Galerie de Photos & Schémas (",
    pt: "📸 Galeria de Fotos & Moldes ("
  },
  "Supprimer cette photo": {
    key: "deletePhotoTitle",
    fr: "Supprimer cette photo",
    pt: "Excluir esta foto"
  },
  "📄 Patrons Couture PDF & Fiches Techniques (": {
    key: "sewingPatternsPdfPrefix",
    fr: "📄 Patrons Couture PDF & Fiches Techniques (",
    pt: "📄 Moldes de Costura em PDF & Fichas Técnicas ("
  },
  "Supprimer ce document": {
    key: "deleteDocumentTitle",
    fr: "Supprimer ce document",
    pt: "Excluir este documento"
  },
  "✕ Supprimer": {
    key: "btnDeleteWithIcon",
    fr: "✕ Supprimer",
    pt: "✕ Excluir"
  },

  // CreateCultureFicheModal
  "Créer la fiche Varal Culture": {
    key: "createVaralCultureHeading",
    fr: "Créer la fiche Varal Culture",
    pt: "Criar ficha do Varal de Cultura"
  },
  "Passerelle automatique depuis «": {
    key: "autoGatewayFromPrefix",
    fr: "Passerelle automatique depuis «",
    pt: "Ponte automática a partir de «"
  },
  "Titre de la fiche Culture": {
    key: "cultureSheetTitleLabel",
    fr: "Titre de la fiche Culture",
    pt: "Título da ficha de Cultura"
  },
  "Ex: Baque de Luanda, Maracatu de Baque Virado...": {
    key: "cultureSheetTitlePlaceholder",
    fr: "Ex: Baque de Luanda, Maracatu de Baque Virado...",
    pt: "Ex: Baque de Luanda, Maracatu de Baque Virado..."
  },
  "Catégorie": {
    key: "categoryLabel",
    fr: "Catégorie",
    pt: "Categoria"
  },
  "📖 Histoire": {
    key: "catHistory",
    fr: "📖 Histoire",
    pt: "📖 História"
  },
  "🥁 Musique & Danse": {
    key: "catMusicAndDance",
    fr: "🥁 Musique & Danse",
    pt: "🥁 Música & Dança"
  },
  "👑 Tradition & Cour": {
    key: "catTraditionAndCourt",
    fr: "👑 Tradition & Cour",
    pt: "👑 Tradição & Corte"
  },
  "🌿 Orixás": {
    key: "catOrixas",
    fr: "🌿 Orixás",
    pt: "🌿 Orixás"
  },
  "📍 Territoire": {
    key: "catTerritory",
    fr: "📍 Territoire",
    pt: "📍 Território"
  },
  "Vidéo YouTube associée": {
    key: "associatedYoutubeVideoHeading",
    fr: "Vidéo YouTube associée",
    pt: "Vídeo do YouTube associado"
  },
  "Lien YouTube valide reconnu (ID :": {
    key: "validYoutubeLinkPrefix",
    fr: "Lien YouTube valide reconnu (ID :",
    pt: "Link do YouTube válido identificado (ID:"
  },
  "Chapitre introductif / Histoire": {
    key: "introChapterHeading",
    fr: "Chapitre introductif / Histoire",
    pt: "Capítulo introdutório / História"
  },
  "Titre du chapitre": {
    key: "chapterTitlePlaceholder",
    fr: "Titre du chapitre",
    pt: "Título do capítulo"
  },
  "Rédigez ou complétez le contexte historique, les origines, la nation ou l'anecdote de ce morceau...": {
    key: "chapterContentPlaceholder",
    fr: "Rédigez ou complétez le contexte historique, les origines, la nation ou l'anecdote de ce morceau...",
    pt: "Descreva as origens, a nação do Maracatu, a história ou relatos desta música..."
  },
  "Le saviez-vous ? (Anecdote facultative)": {
    key: "didYouKnowHeading",
    fr: "Le saviez-vous ? (Anecdote facultative)",
    pt: "Você sabia? (Curiosidade opcional)"
  },
  "Ex: Cette chanson était traditionnellement chantée au lever du soleil...": {
    key: "anecdotePlaceholder",
    fr: "Ex: Cette chanson était traditionnellement chantée au lever du soleil...",
    pt: "Ex: Esta toada era cantada tradicionalmente ao amanhecer..."
  },
  "🔗 La fiche sera automatiquement enregistrée sur le Varal et liée à ce morceau.": {
    key: "ficheSavedAndLinkedNotice",
    fr: "🔗 La fiche sera automatiquement enregistrée sur le Varal et liée à ce morceau.",
    pt: "🔗 A ficha será automaticamente salva no Varal e vinculada a esta música."
  },

  // BatchAssignVideoModal & Source
  "1. Pupitres cibles ou Répétition générale": {
    key: "stepTargetInstrumentsHeading",
    fr: "1. Pupitres cibles ou Répétition générale",
    pt: "1. Naipes de destino ou Ensaio geral"
  },
  "déjà présent": {
    key: "alreadyPresentBadge",
    fr: "déjà présent",
    pt: "já presente"
  },
  "Source de la vidéo": {
    key: "videoSourceHeading",
    fr: "Source de la vidéo",
    pt: "Origem do vídeo"
  },
  "Piocher une vidéo parmi les playlists de l'association": {
    key: "pickFromPlaylistsTitle",
    fr: "Piocher une vidéo parmi les playlists de l'association",
    pt: "Escolher um vídeo entre as playlists da associação"
  },
  "Piocher dans mes playlists": {
    key: "btnPickInPlaylists",
    fr: "Piocher dans mes playlists",
    pt: "Escolher nas minhas playlists"
  },
  "Afficher les vidéos de mes playlists": {
    key: "showMyPlaylistsVideos",
    fr: "Afficher les vidéos de mes playlists",
    pt: "Exibir os vídeos das minhas playlists"
  },
  "Cliquer pour changer de vidéo depuis vos playlists": {
    key: "clickToChangeVideoFromPlaylists",
    fr: "Cliquer pour changer de vidéo depuis vos playlists",
    pt: "Clique para trocar de vídeo a partir das suas playlists"
  },
  "Miniature": {
    key: "thumbnailAlt",
    fr: "Miniature",
    pt: "Miniatura"
  },
  "Changer": {
    key: "btnChange",
    fr: "Changer",
    pt: "Alterar"
  },
  "Cliquer pour choisir depuis vos playlists": {
    key: "clickToChooseFromPlaylists",
    fr: "Cliquer pour choisir depuis vos playlists",
    pt: "Clique para escolher a partir das suas playlists"
  },
  "Playlists": {
    key: "btnPlaylists",
    fr: "Playlists",
    pt: "Playlists"
  },
  "Parcourir les playlists YouTube": {
    key: "browsePlaylistsTitle",
    fr: "Parcourir les playlists YouTube",
    pt: "Navegar pelas playlists do YouTube"
  },

  // PieceVideoSection & RepertoirePasserelleButton
  "Ouvrir la vidéo dans un nouvel onglet": {
    key: "openVideoExternalTitle",
    fr: "Ouvrir la vidéo dans un nouvel onglet",
    pt: "Abrir o vídeo em nova aba"
  },
  "Fiche Répertoire :": {
    key: "repertoireSheetPrefix",
    fr: "Fiche Répertoire :",
    pt: "Ficha do Repertório:"
  }
};

fs.writeFileSync('scripts/repertoire_bilingual_map.json', JSON.stringify(translations, null, 2));
console.log('✅ Dictionnaire bilingue construit avec succès :', Object.keys(translations).length, 'entrées');
