import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) du pôle Vitrine Publique Mostrador (< 140 lignes).
 */
export const vitrineIndex = [
  makeSearchItem({
    id: 'vit-general', poleId: 'vitrine', tabId: 'vitrine-general',
    fr: { title: 'Mostrador — Identité Publique, Sous-Domaine & Référencement', description: 'Titre du site public Mostrador, accroche d’accueil, adresse web personnalisée et référencement Google', keywords: ['mostrador', 'vitrine', 'site web', 'seo', 'referencement', 'sous domaine', 'accueil public'] },
    pt: { title: 'Mostrador — Identidade Pública, Endereço Web & SEO', description: 'Título do portal público Mostrador, chamada principal, subdomínio personalizado e busca Google', keywords: ['mostrador', 'vitrine', 'site publico', 'seo', 'subdominio', 'portal web'] }
  }),
  makeSearchItem({
    id: 'vit-presentation', poleId: 'vitrine', tabId: 'vitrine-presentation',
    fr: { title: 'Mostrador — Histoire de la Troupe & Univers Culturel', description: 'Textes de présentation bilingues, origines culturelles, chiffres clés et sections instrumentales', keywords: ['presentation vitrine', 'histoire troupe', 'biographie', 'univers culturel', 'mostrador'] },
    pt: { title: 'Mostrador — História do Grupo & Universo Cultural', description: 'Textos de apresentação bilíngues, raízes culturais, números do grupo e naipes apresentados', keywords: ['apresentacao vitrine', 'historia grupo', 'biografia', 'universo cultural', 'mostrador'] }
  }),
  makeSearchItem({
    id: 'vit-organisateur', poleId: 'vitrine', tabId: 'vitrine-organisateur',
    fr: { title: 'Mostrador — Espace Programmateur, Fiche Technique & Devis', description: 'Formulaire public de demande de prestation, dossier artistique PDF, fiche technique et jauges', keywords: ['espace organisateur', 'programmateur', 'fiche technique', 'dossier artistique', 'demande devis'] },
    pt: { title: 'Mostrador — Área do Contratante, Rider Técnico & Propostas', description: 'Formulário público de contratação, portfólio artístico em PDF, mapa técnico e formatos de show', keywords: ['area contratante', 'produtor', 'rider tecnico', 'portfolio artistico', 'pedir orcamento'] }
  }),
  makeSearchItem({
    id: 'vit-galerie', poleId: 'vitrine', tabId: 'vitrine-galerie',
    fr: { title: 'Mostrador — Galerie Photos & Vidéos Publiques', description: 'Sélection des photos de scène et vidéos de concerts affichées aux visiteurs sur Mostrador', keywords: ['galerie publique', 'photos vitrine', 'videos concerts', 'teasers', 'mostrador'] },
    pt: { title: 'Mostrador — Galeria Pública de Fotos & Vídeos', description: 'Seleção de fotos de palco e vídeos de apresentações exibidos aos visitantes no Mostrador', keywords: ['galeria publica', 'fotos vitrine', 'videos shows', 'teasers', 'mostrador'] }
  }),
  makeSearchItem({
    id: 'vit-recrutement', poleId: 'vitrine', tabId: 'vitrine-recrutement',
    fr: { title: 'Mostrador — Recrutement, Rentrée & Pré-inscriptions', description: 'Ouverture des inscriptions de rentrée, conditions d’adhésion, horaires publics et formulaire candidat', keywords: ['recrutement', 'adhesion publique', 'rejoindre la troupe', 'rentree', 'preinscription', 'debutants'] },
    pt: { title: 'Mostrador — Novos Integrantes, Oficinas & Pré-inscrição', description: 'Abertura de vagas da temporada, como participar, horários públicos e formulário de inscrição', keywords: ['novos integrantes', 'recrutamento', 'participar', 'vagas', 'pre inscricao', 'iniciantes'] }
  }),
  makeSearchItem({
    id: 'vit-reseaux', poleId: 'vitrine', tabId: 'vitrine-reseaux',
    fr: { title: 'Mostrador — Liens Réseaux Sociaux & Inscription Infolettre', description: 'Boutons vers Instagram, Facebook, YouTube, SoundCloud et encart d’abonnement à la lettre d’info', keywords: ['liens reseaux', 'instagram vitrine', 'soundcloud', 'bandcamp', 'inscription newsletter'] },
    pt: { title: 'Mostrador — Links das Redes Sociais & Assinatura de Boletim', description: 'Botões para Instagram, Facebook, YouTube, SoundCloud e formulário de inscrição na newsletter', keywords: ['links redes', 'instagram vitrine', 'soundcloud', 'bandcamp', 'assinar newsletter'] }
  }),
  makeSearchItem({
    id: 'vit-apparence', poleId: 'vitrine', tabId: 'vitrine-apparence',
    fr: { title: 'Mostrador — Thème Visuel, Couleurs & Typographies', description: 'Personnalisation esthétique du portail public Mostrador : palettes, bannières et style graphique', keywords: ['apparence vitrine', 'theme mostrador', 'couleurs site', 'banniere', 'design public'] },
    pt: { title: 'Mostrador — Tema Visual, Cores & Tipografia', description: 'Personalização estética do portal público Mostrador: paletas de cores, capas e estilo visual', keywords: ['aparencia vitrine', 'tema mostrador', 'cores site', 'capa', 'design publico'] }
  })
];
