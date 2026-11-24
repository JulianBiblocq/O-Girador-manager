import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) du pôle Configuration de l'Association (< 140 lignes).
 */
export const configIndex = [
  makeSearchItem({
    id: 'cfg-identity', poleId: 'config', tabId: 'config-identity',
    fr: { title: 'Identité Légale, Siège Social & Mentions Officielles', description: 'Nom officiel de l’association, logo, univers musical, diapason de référence, SIRET/RNA et contacts légaux', keywords: ['identite legale', 'logo', 'siege social', 'siret', 'rna', 'univers musical', 'diapason', 'association'] },
    pt: { title: 'Identidade Legal, Sede & Dados Oficiais da Associação', description: 'Nome oficial do grupo, logotipo, universo musical, afinação de referência, CNPJ e contatos legais', keywords: ['identidade legal', 'logotipo', 'sede', 'cnpj', 'universo musical', 'diapasao', 'associacao'] }
  }),
  makeSearchItem({
    id: 'cfg-profile', poleId: 'config', tabId: 'config-profile',
    fr: { title: 'Inscriptions, Champs Profils & Catalogue des Pupitres', description: 'Validation des nouveaux comptes, champs personnalisés des fiches membres et sections instrumentales du Batuque', keywords: ['inscriptions', 'validation membres', 'pupitres', 'instruments config', 'sections', 'champs profil'] },
    pt: { title: 'Cadastros, Campos de Perfil & Catálogo de Naipes', description: 'Aprovação de novos membros, campos personalizados das fichas e seções instrumentais do Batuque', keywords: ['cadastros', 'aprovacao membros', 'naipes', 'instrumentos config', 'secoes', 'campos perfil'] }
  }),
  makeSearchItem({
    id: 'cfg-agenda', poleId: 'config', tabId: 'config-agenda',
    fr: { title: 'Catégories d’Événements & Carnet de Lieux / Salles', description: 'Types d’événements, couleurs du calendrier, salles de répétition habituelles et règles de présence RSVP', keywords: ['lieux', 'salles repetition', 'categories evenements', 'types dates', 'adresses', 'rsvp config'] },
    pt: { title: 'Categorias de Eventos & Cadastro de Locais de Ensaio', description: 'Tipos de eventos, cores da agenda, salas habituais de ensaio, endereços e regras de presença RSVP', keywords: ['locais', 'salas ensaio', 'categorias eventos', 'tipos datas', 'enderecos', 'rsvp config'] }
  }),
  makeSearchItem({
    id: 'cfg-security', poleId: 'config', tabId: 'config-security',
    fr: { title: 'Badges, Rôles & Matrice des Permissions par Pôle', description: 'Droits d’accès en lecture et gestion sur chaque pôle ou onglet, badges personnalisés et responsables', keywords: ['permissions', 'roles', 'badges', 'etiquettes', 'securite', 'droits acces', 'administrateurs'] },
    pt: { title: 'Insígnias, Papéis & Matriz de Permissões por Polo', description: 'Direitos de leitura e gestão em cada polo ou aba, etiquetas personalizadas e coordenadores', keywords: ['permissoes', 'papeis', 'insignias', 'etiquetas', 'seguranca', 'direitos acesso', 'administradores'] }
  }),
  makeSearchItem({
    id: 'cfg-comms', poleId: 'config', tabId: 'config-comms',
    fr: { title: 'Notifications, E-mails Automatiques & Rappels', description: 'Réglage des alertes push, expéditeur d’e-mails, rappels automatiques d’événements et canaux de discussion', keywords: ['notifications config', 'emails automatiques', 'rappels', 'alertes push', 'expediteur', 'messagerie'] },
    pt: { title: 'Notificações, E-mails Automáticos & Lembretes', description: 'Ajuste de alertas push, remetente de e-mails, lembretes automáticos de eventos e canais internos', keywords: ['notificacoes config', 'emails automaticos', 'lembretes', 'alertas push', 'remetente', 'mensagens'] }
  }),
  makeSearchItem({
    id: 'cfg-modules', poleId: 'config', tabId: 'config-modules',
    fr: { title: 'Modules Actifs, Thème d’Interface & Suite O Girador', description: 'Activation des pôles à la carte, thème visuel dans Organizador et passerelles Sequenciador, Cantador et Dançador', keywords: ['modules', 'theme interface', 'apparence organizador', 'o girador', 'sequenciador', 'cantador', 'dancador'] },
    pt: { title: 'Módulos Ativos, Tema Visual & Suíte O Girador', description: 'Ativação de polos sob medida, tema visual no Organizador e conexões com Sequenciador, Cantador e Dançador', keywords: ['modulos', 'tema visual', 'aparencia organizador', 'o girador', 'sequenciador', 'cantador', 'dancador'] }
  })
];
