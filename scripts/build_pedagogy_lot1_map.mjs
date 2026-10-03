/**
 * Construction du mapping bilingue FR / PT-BR pour le Pôle Pédagogie (Lot 1)
 * Couvre les 4 sous-namespaces :
 * - pedagogy.student (5 fichiers, 68 chaînes)
 * - pedagogy.modals (8 fichiers, 41 chaînes)
 * - pedagogy.admin (12 fichiers, 39 chaînes)
 * - pedagogy.engine (2 fichiers, 12 chaînes)
 * Total : 27 fichiers, 160 chaînes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const bilingualMap = {
  student: {
    // AutoEvalQuizContainer.jsx
    notEnoughData: { fr: "Pas assez de données pour générer ce type de quiz.", pt: "Dados insuficientes para gerar este tipo de quiz." },
    back: { fr: "Retour", pt: "Voltar" },
    autoEvaluation: { fr: "Auto-évaluation", pt: "Autoavaliação" },
    testezVosConnaissancesSur: { fr: "Testez vos connaissances sur le répertoire, le vocabulaire et la culture de notre Nação.", pt: "Teste seus conhecimentos sobre o repertório, vocabulário e cultura da nossa Nação." },
    ouReviserAvantDe: { fr: "Où réviser avant de se tester ?", pt: "Onde revisar antes de praticar?" },
    toutLeMaterielPedagogique: { fr: "Tout le matériel pédagogique (chants, fiches, rythmes) se trouve dans les", pt: "Todo o material pedagógico (toadas, fichas, ritmos) está disponível nos" },
    varalsCordesALinge: { fr: "Varals (cordes à linge)", pt: "Varals (cordas)" },
    situesToutEnBas: { fr: "situés tout en bas de la page d'accueil !", pt: "localizados no rodapé da página inicial!" },
    defiDuJour: { fr: "Défi du jour", pt: "Desafio do dia" },
    unMelangeDeToutes: { fr: "Un mélange de toutes les thématiques pour réviser efficacement !", pt: "Uma mistura de todas as temáticas para revisar com eficiência!" },
    lancerLeDefiMix: { fr: "🚀 Lancer le Défi Mix (", pt: "🚀 Iniciar Desafio Mix (" },
    entrainementParTheme: { fr: "Entraînement par Thème", pt: "Treino por Tema" },
    debutant: { fr: "🌱 Débutant", pt: "🌱 Iniciante" },
    confirme: { fr: "🥁 Confirmé", pt: "🥁 Intermediário" },
    expert: { fr: "🏆 Expert", pt: "🏆 Avançado" },
    toadasProgression: { fr: "🎤 Toadas (Progression)", pt: "🎤 Toadas (Evolução)" },
    reviserLeRepertoireEt: { fr: "Réviser le répertoire et suivre votre jauge de Nação.", pt: "Revisar o repertório e acompanhar o nível da sua Nação." },
    traduction: { fr: "🇧🇷 Traduction", pt: "🇧🇷 Tradução" },
    testerVotreVocabulaireFrancais: { fr: "Tester votre vocabulaire (Français / Portugais).", pt: "Testar seu vocabulário (Francês / Português)." },
    culture: { fr: "📚 Culture", pt: "📚 Cultura" },
    questionsSurLHistoire: { fr: "Questions sur l'histoire et les fondamentaux.", pt: "Perguntas sobre história e fundamentos da tradição." },
    atelier: { fr: "🛠️ Atelier", pt: "🛠️ Ateliê" },
    revisionsTechniquesSurLa: { fr: "Révisions techniques sur la couture et fabrication.", pt: "Revisões técnicas sobre costura e confecção." },
    danseDancador: { fr: "💃 Danse (Dançador)", pt: "💃 Dança (Dançador)" },
    reconnaissanceVisuelleDesPas: { fr: "Reconnaissance visuelle des pas et familles.", pt: "Reconhecimento visual dos passos e famílias da dança." },
    generationDuQcmEn: { fr: "Génération du QCM en cours...", pt: "Gerando o questionário..." },
    illustrationDeLaQuestion: { fr: "Illustration de la question", pt: "Ilustração da pergunta" },
    bienJoue: { fr: "✅ Bien joué !", pt: "✅ Muito bem!" },
    presque: { fr: "🌱 Presque !", pt: "🌱 Quase lá!" },
    laBonneReponseEtait: { fr: "La bonne réponse était :", pt: "A resposta correta era:" },
    bilanDuQuiz: { fr: "Bilan du Quiz", pt: "Resumo do Quiz" },
    enregistrementDuScore: { fr: "Enregistrement du score...", pt: "Salvando pontuação..." },
    aReviser: { fr: "À réviser :", pt: "Para revisar:" },
    terminer: { fr: "Terminer", pt: "Concluir" },
    retourALAccueil: { fr: "Retour à l'Accueil", pt: "Voltar ao Início" },

    // FirestoreMediaRenderer.jsx
    chargementDuMedia: { fr: "Chargement du média...", pt: "Carregando mídia..." },
    erreur: { fr: "Erreur :", pt: "Erro:" },
    visuel: { fr: "Visuel :", pt: "Visual:" },
    aucunApercuDisponiblePour: { fr: "Aucun aperçu disponible pour ce média.", pt: "Nenhuma prévia disponível para esta mídia." },

    // StudentToadasProgress.jsx
    maitriseDeLaNacao: { fr: "Maîtrise de la Nação", pt: "Domínio da Nação" },
    progressionGlobaleBaseeSur: { fr: "Progression globale basée sur vos auto-évaluations ciblées par Toada.", pt: "Evolução geral baseada nas suas autoavaliações por toada." },
    ouEcouterEtLire: { fr: "Où écouter et lire les toadas ?", pt: "Onde ouvir e ler as toadas?" },
    avantDeTesterTes: { fr: "Avant de tester tes connaissances, retrouve tous les chants (audios, paroles, traductions) dans le", pt: "Antes de testar seus conhecimentos, encontre todas as toadas (áudios, letras, traduções) no" },
    varalDesToadas: { fr: "Varal des Toadas", pt: "Varal de Toadas" },
    situeToutEnBas: { fr: ", situé tout en bas de la page d'accueil !", pt: ", localizado no rodapé da página inicial!" },
    novice: { fr: "Novice", pt: "Iniciante" },
    detailDuRepertoire: { fr: "Détail du Répertoire (", pt: "Detalhes do Repertório (" },
    chants: { fr: "Chants)", pt: "Toadas)" },
    reviserCeChant: { fr: "🎯 Réviser ce chant", pt: "🎯 Revisar esta toada" },
    aucuneToadaTrouveeDans: { fr: "Aucune Toada trouvée dans le répertoire actif.", pt: "Nenhuma toada encontrada no repertório ativo." },

    // StudentInstrumentsWorkshop.jsx
    inconnu: { fr: "Inconnu", pt: "Desconhecido" },
    instrument: { fr: "Instrument", pt: "Instrumento" },

    // PieceTutorialModal.jsx
    ficheLivretAtelierCouture: { fr: "🧵 Fiche Livret Atelier Couture", pt: "🧵 Ficha Manual Ateliê de Costura" },
    cout: { fr: "Coût :", pt: "Custo:" },
    fermerEchap: { fr: "Fermer (Échap)", pt: "Fechar (Esc)" },
    elementDeCostume: { fr: "Élément de costume :", pt: "Item do figurino:" },
    obligatoire: { fr: "★ Obligatoire", pt: "★ Obrigatório" },
    optionnel: { fr: "Optionnel", pt: "Opcional" },
    remarqueMateriauxSpecifiques: { fr: "Remarque / Matériaux spécifiques :", pt: "Observações / Materiais específicos:" },
    materielNecessaire: { fr: "🧵 Matériel Nécessaire", pt: "🧵 Material Necessário" },
    etapesDeFabricationPas: { fr: "📜 Étapes de Fabrication pas à pas", pt: "📜 Passo a passo de Confecção" },
    videoDeDemonstrationPas: { fr: "🎬 Vidéo de démonstration pas à pas", pt: "🎬 Vídeo de demonstração passo a passo" },
    videoTutoriel: { fr: "Vidéo tutoriel", pt: "Vídeo tutorial" },
    photosSchemasDeMontage: { fr: "🖼️ Photos & Schémas de Montage (", pt: "🖼️ Fotos & Esquemas de Montagem (" },
    voirLImage: { fr: "🔍 Voir l'image", pt: "🔍 Ver imagem" },
    documentsJointsPdf: { fr: "📄 Documents Joints (PDF)", pt: "📄 Documentos Anexos (PDF)" },
    ouvrir: { fr: "Ouvrir ↗", pt: "Abrir ↗" },
    fermerLaFiche: { fr: "Fermer la fiche", pt: "Fechar ficha" }
  },

  modals: {
    // PieceLyricsModal.jsx
    aucuneParoleRenseigneePour: { fr: "Aucune parole renseignée pour ce morceau.", pt: "Nenhuma letra cadastrada para esta música." },
    fermer: { fr: "Fermer", pt: "Fechar" },
    parolesDuMorceau: { fr: "Paroles du morceau", pt: "Letra da música" },

    // PieceCultureModal.jsx
    aucuneNoticeCulturelleRedigee: { fr: "Aucune notice culturelle rédigée pour l'instant.", pt: "Nenhum texto cultural redigido no momento." },
    origineContexteCulturel: { fr: "Origine & Contexte culturel", pt: "Origem & Contexto cultural" },
    fiches: { fr: "Fiches (", pt: "Fichas (" },

    // PieceSignalsModal.jsx
    signesConventionsDuMestre: { fr: "Signes & Conventions du Mestre", pt: "Sinais & Convenções do Mestre" },
    aucunAppelOuSignal: { fr: "Aucun appel ou signal particulier configuré pour ce morceau.", pt: "Nenhum sinal ou chamada específica configurada para esta música." },
    convention: { fr: "convention", pt: "convenção" },
    etGeste: { fr: "et geste", pt: "e gesto" },
    duMestre: { fr: "du Mestre", pt: "do Mestre" },
    aideMemoireDeJeu: { fr: "Aide-mémoire de jeu", pt: "Guia de consulta rápida" },
    geste: { fr: "Geste", pt: "Gesto" },
    mesure: { fr: "Mesure", pt: "Compasso" },

    // PieceAisanceSection.jsx
    entrainement: { fr: "entraînement", pt: "treino" },
    bpm: { fr: "BPM)", pt: "BPM)" },

    // MemberPieceCard.jsx
    decouverte: { fr: "Découverte", pt: "Descobrindo" },
    enPratique: { fr: "En pratique", pt: "Praticando" },
    aLAise: { fr: "À l'aise", pt: "Fluente" },
    referent: { fr: "Référent", pt: "Referência" },
    monNiveauDAisance: { fr: "Mon niveau d'aisance personnel", pt: "Meu nível de domínio pessoal" },

    // MemberPieceUnfoldedContent.jsx
    notesDuMestre: { fr: "Notes du Mestre", pt: "Anotações do Mestre" },
    ecouterLAudio: { fr: "Écouter l'audio", pt: "Ouvir o áudio" },
    consulterLesParolesCompletes: { fr: "Consulter les paroles complètes du chant", pt: "Ver a letra completa da toada" },
    paroles: { fr: "Paroles", pt: "Letra" },
    consulterLaFicheCulturelle: { fr: "Consulter la fiche culturelle", pt: "Consultar a ficha cultural" },
    cultureHistoire: { fr: "Culture & Histoire", pt: "Cultura & História" },
    consulterLaTablatureComplete: { fr: "Consulter la tablature complète", pt: "Consultar a tablatura completa" },
    tablature: { fr: "Tablature", pt: "Tablatura" },
    consulterLAideMemoire: { fr: "Consulter l'aide-mémoire des signes du Mestre", pt: "Consultar o guia de sinais do Mestre" },
    signesDuMestre: { fr: "Signes du Mestre", pt: "Sinais do Mestre" },
    danse: { fr: "Danse :", pt: "Dança:" },
    choregraphie: { fr: "Chorégraphie", pt: "Coreografia" },
    ouvrirLeMorceauDans: { fr: "Ouvrir le morceau dans le Séquenceur", pt: "Abrir a música no Sequenciador" },
    sequenceur: { fr: "Séquenceur", pt: "Sequenciador" },
    lancerLeQcmFocus: { fr: "Lancer le QCM Focus Répertoire pour réviser ce morceau", pt: "Iniciar o Quiz do Repertório para revisar esta música" },
    reviserCeMorceau: { fr: "Réviser ce morceau", pt: "Revisar esta música" },

    // MemberRepertoireHeader.jsx
    repertoireDeLaSaison: { fr: "Répertoire de la Saison", pt: "Repertório da Temporada" },

    // MemberRepertoireView.jsx
    chargementDuRepertoire: { fr: "Chargement du répertoire...", pt: "Carregando repertório..." },
    aucunMorceauNEst: { fr: "Aucun morceau n'est actuellement au programme de la saison.", pt: "Nenhuma música está no programa da temporada no momento." }
  },

  admin: {
    // MestrePedagogyDashboard.jsx
    purgeEnCours: { fr: "⏳ Purge en cours...", pt: "⏳ Limpeza em andamento..." },
    purgerDeLaBase: { fr: "🗑️ Purger de la base", pt: "🗑️ Limpar do banco" },
    purgerLesArtefactsE2e: { fr: "🗑️ Purger les artefacts E2E de Firestore", pt: "🗑️ Limpar artefatos E2E do Firestore" },

    // MestrePedagogyNotepad.jsx
    ont: { fr: "ont", pt: "têm" },
    repetition: { fr: "Répétition", pt: "Ensaio" },
    ajout: { fr: "Ajout...", pt: "Adicionando..." },
    valider: { fr: "Valider", pt: "Salvar" },

    // MestreAutoEvalConfig.jsx
    culture: { fr: "Culture", pt: "Cultura" },

    // CustomQuizConfigPanel.jsx
    publie: { fr: "✅ Publié", pt: "✅ Publicado" },
    brouillon: { fr: "Brouillon", pt: "Rascunho" },

    // CreateCultureFicheModal.jsx
    leMorceau: { fr: "le morceau", pt: "a música" },
    creation: { fr: "Création...", pt: "Criando..." },
    creerLierLaFiche: { fr: "✨ Créer & Lier la Fiche", pt: "✨ Criar & Vincular Ficha" },

    // RepertoireSinaisDoMestreEditor.jsx
    fermerSelecteur: { fr: "▲ Fermer sélecteur", pt: "▲ Fechar seletor" },
    ajouterUnSigne: { fr: "➕ Ajouter un signe", pt: "➕ Adicionar sinal" },
    signauxDeCommandementEt: { fr: "Signaux de commandement et conventions par mesure (départ, virada, break, coupure). Suggérés depuis le Séquenceur ou positionnés à la main.", pt: "Sinais de comando e convenções por compasso (saída, virada, parada, corte). Sugeridos pelo Sequenciador ou definidos manualmente." },
    signauxDeCommandementDu: { fr: "Signaux de commandement du Mestre associés à ce rythme (départ, virada, coupure...).", pt: "Sinais de comando do Mestre associados a este ritmo (saída, virada, corte...)." },
    aucunSigneRattachePour: { fr: "Aucun signe rattaché pour l'instant. Liez un Preset pour les suggérer automatiquement ou cliquez sur [ ➕ Ajouter un signe ].", pt: "Nenhum sinal vinculado no momento. Vincule um Preset para sugerir automaticamente ou clique em [ ➕ Adicionar sinal ]." },
    associe: { fr: "✓ Associé", pt: "✓ Vinculado" },
    associer: { fr: "+ Associer", pt: "+ Vincular" },
    masquerConventionLibre: { fr: "Masquer convention libre", pt: "Ocultar convenção livre" },
    ajouterUnAppelTexte: { fr: "✏️ Ajouter un appel texte sur mesure (sans geste catalogué)", pt: "✏️ Adicionar chamada personalizada (sem gesto cadastrado)" },

    // SignalReflexCard.jsx
    timbal: { fr: "Timbal", pt: "Timbal" },
    fige: { fr: "🔒 Figé", pt: "🔒 Fixo" },
    dynamique: { fr: "🔓 Dynamique", pt: "🔓 Dinâmico" },
    inattention: { fr: "(Inattention)", pt: "(Distração)" },

    // RepertoireTrainingsManager.jsx
    auto: { fr: "auto", pt: "auto" },
    associerUnAutreEntrainement: { fr: "➕ Associer un autre entraînement existant...", pt: "➕ Vincular outro treino existente..." },
    tousLesEntrainementsDu: { fr: "Tous les entraînements du groupe sont déjà rattachés", pt: "Todos os treinos do grupo já estão vinculados" },
    entrainement: { fr: "Entraînement", pt: "Treino" },

    // RepertoireCulturePicker.jsx
    aucuneFicheCulturelleNe: { fr: "Aucune fiche culturelle ne correspond à votre filtre.", pt: "Nenhuma ficha cultural corresponde ao filtro." },
    aucuneFicheCulturelleDisponible: { fr: "Aucune fiche culturelle disponible dans le Varal Culture.", pt: "Nenhuma ficha cultural disponível no Varal de Cultura." },

    // RepertoireVideosPicker.jsx
    toutReplier: { fr: "Tout replier", pt: "Recolher tudo" },
    toutDeplier: { fr: "Tout déplier", pt: "Expandir tudo" },

    // SignalZoomModal.jsx
    signeDuMestre: { fr: "Signe du Mestre", pt: "Sinal do Mestre" },

    // VideoInstrumentCheckboxes.jsx
    actif: { fr: "✓ Actif", pt: "✓ Ativo" },
    non: { fr: "○ Non", pt: "○ Não" }
  },

  engine: {
    // conductorGameUtils.js
    appelDeDepart: { fr: "Appel de départ", pt: "Chamada de saída" },
    appelVirada1: { fr: "Appel Virada 1", pt: "Chamada Virada 1" },
    appelVirada2: { fr: "Appel Virada 2", pt: "Chamada Virada 2" },
    paradaBreak: { fr: "Parada / Break", pt: "Parada / Break" },
    repriseDeBaque: { fr: "Reprise de Baque", pt: "Retorno do Baque" },
    coupureFinale: { fr: "Coupure finale", pt: "Corte final" },
    acceleration: { fr: "Accélération", pt: "Aceleração" },
    appelVoixToada: { fr: "Appel Voix / Toada", pt: "Chamada de Toada" },

    // pedagogyDashboardCalculations.js
    alfaias: { fr: "Alfaias", pt: "Alfaias" },
    caixas: { fr: "Caixas", pt: "Caixas" },
    metauxGongue: { fr: "Métaux / Gonguê", pt: "Metais / Gonguê" },
    agbes: { fr: "Agbês", pt: "Agbês" }
  }
};

const outputPath = path.join(rootDir, 'scripts/pedagogy_lot1_bilingual_map.json');
fs.writeFileSync(outputPath, JSON.stringify(bilingualMap, null, 2), 'utf8');

console.log('✅ Mapping bilingue Pédagogie Lot 1 généré avec succès dans scripts/pedagogy_lot1_bilingual_map.json');
let count = 0;
for (const sub of Object.values(bilingualMap)) {
  count += Object.keys(sub).length;
}
console.log(`📊 Total clés sous pedagogy.* : ${count}`);
