import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) du pôle Studio & Communication Externe (< 140 lignes).
 */
export const studioIndex = [
  makeSearchItem({
    id: 'studio-social', poleId: 'studio', tabId: 'studio-social',
    fr: { title: 'Publications Réseaux Sociaux & Visuels', description: 'Calendrier éditorial, préparation des affiches et publications Instagram, Facebook et YouTube', keywords: ['reseaux sociaux', 'instagram', 'facebook', 'youtube', 'visuels', 'affiches', 'publications'] },
    pt: { title: 'Publicações nas Redes Sociais & Artes Visuais', description: 'Calendário editorial, criação de cartazes e postagens para Instagram, Facebook e YouTube', keywords: ['redes sociais', 'instagram', 'facebook', 'youtube', 'artes', 'cartazes', 'postagens'] }
  }),
  makeSearchItem({
    id: 'studio-newsletter', poleId: 'studio', tabId: 'newsletter',
    fr: { title: 'Lettres d’Information & Campagnes Public', description: 'Rédaction des infolettres publiques, mise en avant des prochaines dates et gestion des abonnés', keywords: ['newsletter', 'lettre info', 'infolettre', 'abonnes', 'campagne email', 'public'] },
    pt: { title: 'Boletins Informativos & Newsletter do Público', description: 'Redação de boletins por e-mail, divulgação das próximas apresentações e lista de inscritos', keywords: ['newsletter', 'boletim', 'informativo', 'inscritos', 'campanha email', 'divulgacao'] }
  }),
  makeSearchItem({
    id: 'studio-photos', poleId: 'studio', tabId: 'varal-photos',
    fr: { title: 'Médiathèque Photos, Presse & Crédits Photographes', description: 'Sélection des clichés officiels, dossiers presse haute définition et respect des crédits photo', keywords: ['mediatheque', 'photos', 'galerie studio', 'presse', 'photographes', 'credits photo'] },
    pt: { title: 'Acervo de Fotos, Imprensa & Créditos Fotográficos', description: 'Curadoria de fotos oficiais, kit de imprensa em alta definição e créditos de fotógrafos', keywords: ['midiateca', 'fotos', 'acervo fotografico', 'imprensa', 'fotografos', 'creditos'] }
  }),
  makeSearchItem({
    id: 'studio-comm', poleId: 'studio', tabId: 'studio-communication',
    fr: { title: 'Envois d’E-mails & Passerelle Brevo', description: 'Suivi des campagnes d’envoi, listes de diffusion externes et statistiques de délivrabilité', keywords: ['communication externe', 'brevo', 'diffusion email', 'listes contacts', 'envois'] },
    pt: { title: 'Disparo de E-mails & Integração Brevo', description: 'Acompanhamento de campanhas enviadas, listas externas de contatos e taxa de entrega', keywords: ['comunicacao externa', 'brevo', 'disparo email', 'listas contatos', 'envios'] }
  }),
  makeSearchItem({
    id: 'studio-lexique', poleId: 'studio', tabId: 'studio-lexique',
    fr: { title: 'Charte Éditoriale, Lexique Culturel & Mentions', description: 'Glossaire officiel de la troupe, orthographe des termes brésiliens et signatures de communication', keywords: ['lexique', 'glossaire', 'charte editoriale', 'vocabulaire', 'mentions', 'tonalite'] },
    pt: { title: 'Guia Editorial, Glossário Cultural & Assinaturas', description: 'Vocabulário oficial do grupo, grafia correta dos termos tradicionais e textos padrão', keywords: ['glossario', 'lexico', 'guia editorial', 'vocabulario', 'creditos', 'identidade verbal'] }
  })
];
