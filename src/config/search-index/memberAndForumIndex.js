import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) de l'Espace Membre & Communication (`mon-espace`) (< 140 lignes).
 */
export const memberAndForumIndex = [
  makeSearchItem({
    id: 'espace-parcours', poleId: 'mon-espace', tabId: 'mon-parcours',
    fr: { title: 'Mon Parcours & Carnet d’Aisance', description: 'Progression personnelle, paliers de tempo dans Sequenciador, Défi Réflexe et quiz', keywords: ['parcours', 'aisance', 'progression', 'speed trainer', 'sequenciador', 'reflexe', 'conducteur', 'roda quiz'] },
    pt: { title: 'Meu Percurso & Caderno de Conforto', description: 'Evolução pessoal, níveis de andamento no Sequenciador, Desafio Reflexo e quizzes', keywords: ['percurso', 'trajetoria', 'conforto', 'speed trainer', 'sequenciador', 'reflexo', 'condutor', 'roda quiz'] }
  }),
  makeSearchItem({
    id: 'espace-agenda', poleId: 'mon-espace', tabId: 'agenda',
    fr: { title: 'Agenda, Sondages d’Ateliers & Covoiturage', description: 'Calendrier des répétitions et sorties, présences RSVP, sondages par pupitre et feuille de route', keywords: ['agenda', 'calendrier', 'dates', 'sondage', 'atelier', 'rsvp', 'presence', 'covoiturage', 'feuille de route'] },
    pt: { title: 'Programação, Enquetes de Oficinas & Carona', description: 'Calendário de ensaios e apresentações, presença RSVP, enquetes por naipe e roteiro', keywords: ['programacao', 'agenda', 'calendario', 'enquete', 'oficina', 'presenca', 'carona', 'roteiro'] }
  }),
  makeSearchItem({
    id: 'espace-repertoire', poleId: 'mon-espace', tabId: 'repertoire',
    fr: { title: 'Répertoire de la Troupe', description: 'Morceaux de saison, paroles, partitions et passerelles vers Sequenciador, Cantador et Dançador', keywords: ['repertoire', 'morceaux', 'toadas', 'paroles', 'sequenciador', 'cantador', 'dancador', 'partition'] },
    pt: { title: 'Repertório da Trupe', description: 'Músicas da temporada, letras, partituras e conexões com Sequenciador, Cantador e Dançador', keywords: ['repertorio', 'musicas', 'toadas', 'letras', 'sequenciador', 'cantador', 'dancador', 'partitura'] }
  }),
  makeSearchItem({
    id: 'espace-atelier', poleId: 'mon-espace', tabId: 'atelier',
    fr: { title: 'Mon Atelier (Instruments, Couture & Artisanat)', description: 'Suivi de fabrication d’instruments, confection des tenues de scène et tutoriels d’artisanat', keywords: ['mon atelier', 'fabrication', 'couture', 'artisanat', 'alfaia', 'agbe', 'costume', 'reliure'] },
    pt: { title: 'Minha Oficina (Instrumentos, Costura & Artesanato)', description: 'Acompanhamento de montagem de instrumentos, confecção de figurinos e tutoriais', keywords: ['minha oficina', 'montagem', 'costura', 'artesanato', 'alfaia', 'agbe', 'figurino', 'encadernacao'] }
  }),
  makeSearchItem({
    id: 'espace-materiel', poleId: 'mon-espace', tabId: 'materiel',
    fr: { title: 'Mes Instruments & Prêts Associatifs', description: 'Instruments attribués en prêt, état d’entretien, caution et demandes de matériel', keywords: ['mes instruments', 'pret', 'materiel', 'caution', 'tambour', 'inventaire personnel'] },
    pt: { title: 'Meus Instrumentos & Empréstimos', description: 'Instrumentos emprestados pela associação, conservação, caução e pedidos de material', keywords: ['meus instrumentos', 'emprestimo', 'material', 'caucao', 'tambor', 'acervo'] }
  }),
  makeSearchItem({
    id: 'espace-vestiaire', poleId: 'mon-espace', tabId: 'vestiaire',
    fr: { title: 'Mon Vestiaire & Tenues de Scène', description: 'Pièces de costume attribuées, tailles enregistrées et consignes d’entretien', keywords: ['vestiaire', 'tenues', 'costumes', 'tailles', 'mensurations', 'scene'] },
    pt: { title: 'Meu Acervo de Figurinos & Trajes', description: 'Peças de figurino atribuídas, medidas registradas e cuidados de lavagem', keywords: ['figurino', 'trajes', 'vestuario', 'tamanhos', 'medidas', 'palco'] }
  }),
  makeSearchItem({
    id: 'espace-forum-zap', poleId: 'mon-espace', tabId: 'forum',
    fr: { title: 'Le Zap, Porte-Voix & Recherche de Messages', description: 'Tchat général Le Zap, salons thématiques, groupes fermés, messages privés et recherche unifiée 🔍', keywords: ['zap', 'porte voix', 'forum', 'salons', 'messages prives', 'groupes', 'recherche messages', 'tchat'] },
    pt: { title: 'O Zap, Porta-Voz & Busca de Mensagens', description: 'Bate-papo O Zap, salas temáticas, grupos fechados, mensagens privadas e busca unificada 🔍', keywords: ['zap', 'porta voz', 'forum', 'salas', 'mensagens privadas', 'grupos', 'buscar mensagens', 'chat'] }
  }),
  makeSearchItem({
    id: 'espace-varal', poleId: 'mon-espace', tabId: 'varal',
    fr: { title: 'Le Varal — Ressources, Audio & Documents', description: 'Fiches de paroles, enregistrements audio, vidéos pédagogiques et documents partagés', keywords: ['varal', 'ressources', 'documents', 'paroles', 'audio', 'videos', 'fiches'] },
    pt: { title: 'O Varal — Recursos, Áudios & Documentos', description: 'Folhetos de letras, gravações de áudio, vídeos pedagógicos e arquivos compartilhados', keywords: ['varal', 'recursos', 'documentos', 'letras', 'audio', 'videos', 'apostilas'] }
  }),
  makeSearchItem({
    id: 'espace-profil', poleId: 'mon-espace', tabId: 'profil',
    fr: { title: 'Mon Profil, Véhicule & Coordonnées', description: 'Informations personnelles, pupitres joués, capacité véhicule et préférences de notifications', keywords: ['profil', 'compte', 'vehicule', 'voiture', 'telephone', 'notifications', 'latéralité'] },
    pt: { title: 'Meu Perfil, Veículo & Contatos', description: 'Dados pessoais, naipes tocados, capacidade do veículo e preferências de alertas', keywords: ['perfil', 'conta', 'veiculo', 'carro', 'telefone', 'notificacoes', 'lateralidade'] }
  }),
  makeSearchItem({
    id: 'espace-trombinoscope', poleId: 'mon-espace', tabId: 'trombinoscope',
    fr: { title: 'Trombinoscope des Membres', description: 'Visages et pupitres de la troupe classés par section instrumentale et chorégraphique', keywords: ['trombinoscope', 'membres', 'visages', 'photos', 'equipe', 'pupitres', 'batuque'] },
    pt: { title: 'Elenco & Fotos da Trupe', description: 'Rostos e naipes dos integrantes organizados por seção instrumental e de dança', keywords: ['elenco', 'integrantes', 'fotos', 'membros', 'naipes', 'trupe', 'batuque'] }
  })
];
