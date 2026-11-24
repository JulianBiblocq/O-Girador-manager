import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) des pôles Pédagogie & Mestria (< 140 lignes).
 */
export const pedagogyAndMestreIndex = [
  makeSearchItem({
    id: 'peda-varal', poleId: 'pedagogie', tabId: 'varal-manager',
    fr: { title: 'Gestion du Varal Pédagogique & Supports de Cours', description: 'Publication des partitions, audios d’étude, vidéos par pupitre et ressources d’apprentissage', keywords: ['varal pedagogique', 'supports cours', 'partitions', 'audios', 'videos', 'apprentissage'] },
    pt: { title: 'Gestão do Varal Pedagógico & Materiais de Estudo', description: 'Publicação de partituras, áudios de estudo, vídeos por naipe e apostilas de ensino', keywords: ['varal pedagogico', 'materiais estudo', 'partituras', 'audios', 'videos', 'ensino'] }
  }),
  makeSearchItem({
    id: 'peda-qcm', poleId: 'pedagogie', tabId: 'mestre-pedagogy-qcm',
    fr: { title: 'Questionnaires QCM, Roda Quiz & Défis Pédagogiques', description: 'Création des quiz culturels, reconnaissance des signaux de direction et exercices d’écoute', keywords: ['qcm', 'quiz', 'roda quiz', 'questions', 'signaux', 'histoire', 'culture', 'exercices'] },
    pt: { title: 'Questionários, Roda Quiz & Desafios Pedagógicos', description: 'Criação de quizzes culturais, reconhecimento de sinais de regência e treinos auditivos', keywords: ['qcm', 'quiz', 'roda quiz', 'perguntas', 'sinais', 'historia', 'cultura', 'exercicios'] }
  }),
  makeSearchItem({
    id: 'peda-dashboard', poleId: 'pedagogie', tabId: 'mestre-pedagogy-dashboard',
    fr: { title: 'Suivi d’Aisance & Progression des Élèves', description: 'Vue d’ensemble des paliers de tempo validés dans Sequenciador, assiduité et accompagnement par pupitre', keywords: ['suivi pedagogique', 'aisance eleves', 'progression', 'speed trainer', 'sequenciador', 'bilan eleves'] },
    pt: { title: 'Acompanhamento de Conforto & Evolução da Turma', description: 'Visão geral dos níveis de andamento concluídos no Sequenciador, presença e evolução por naipe', keywords: ['acompanhamento pedagogico', 'conforto alunos', 'evolucao', 'speed trainer', 'sequenciador', 'turma'] }
  }),
  makeSearchItem({
    id: 'mestre-repertoire', poleId: 'mestre', tabId: 'mestre-repertoire',
    fr: { title: 'Direction du Répertoire, Toadas & Liens Sequenciador', description: 'Catalogue maître des morceaux, structures, paroles Cantador, chorégraphies Dançador et presets Sequenciador', keywords: ['repertoire mestre', 'morceaux', 'toadas', 'baques', 'sequenciador', 'cantador', 'dancador', 'setlist'] },
    pt: { title: 'Direção de Repertório, Toadas & Vínculos Sequenciador', description: 'Catálogo mestre das músicas, estruturas, letras Cantador, coreografias Dançador e presets Sequenciador', keywords: ['repertorio mestre', 'musicas', 'toadas', 'baques', 'sequenciador', 'cantador', 'dancador', 'setlist'] }
  }),
  makeSearchItem({
    id: 'mestre-orientation', poleId: 'mestre', tabId: 'mestre-orientation',
    fr: { title: 'Casting, Répartition des Pupitres & Équilibre Sonore', description: 'Vœux d’instruments, affectation des musiciens et danseurs par section et équilibre du Batuque', keywords: ['casting', 'orientation', 'repartition pupitres', 'equilibre sonore', 'batuque', 'voeux instruments'] },
    pt: { title: 'Escalação, Divisão de Naipes & Equilíbrio Sonoro', description: 'Desejos de instrumento, distribuição de músicos e dançarinos por seção e equilíbrio do Batuque', keywords: ['escalacao', 'orientacao', 'divisao naipes', 'equilibrio sonoro', 'batuque', 'escolha instrumento'] }
  }),
  makeSearchItem({
    id: 'mestre-stage', poleId: 'mestre', tabId: 'mestre-stage-layout',
    fr: { title: 'Plan de Scène & Disposition en Défilé (Cortejo)', description: 'Placement visuel des rangs d’instruments, du chant et de la danse sur scène ou en déambulation', keywords: ['plan de scene', 'cortejo', 'defile', 'placement', 'rangs', 'formation', 'implantation'] },
    pt: { title: 'Mapa de Palco & Formação de Cortejo', description: 'Posicionamento visual das fileiras de tambores, canto e dança no palco ou na rua', keywords: ['mapa de palco', 'cortejo', 'desfile', 'posicionamento', 'fileiras', 'formacao'] }
  }),
  makeSearchItem({
    id: 'mestre-annonces', poleId: 'mestre', tabId: 'mestre-mot-mestre',
    fr: { title: 'Mot de la Direction Artistique & Consignes de Saison', description: 'Publication des messages artistiques épinglés sur l’accueil des membres et objectifs musicaux', keywords: ['mot du mestre', 'annonces artistiques', 'consignes', 'direction musicale', 'message accueil'] },
    pt: { title: 'Palavra da Mestria & Diretrizes da Temporada', description: 'Publicação de comunicados artísticos fixados no painel inicial e metas musicais do grupo', keywords: ['palavra do mestre', 'avisos artisticos', 'diretrizes', 'direcao musical', 'mensagem inicial'] }
  })
];
