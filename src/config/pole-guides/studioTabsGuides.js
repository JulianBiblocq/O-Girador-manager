import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) des 5 sous-onglets du Pôle Studio :
 * `studio-social`, `newsletter`, `varal-photos`, `studio-communication`, `studio-lexique`.
 */
export const studioTabsGuides = {
  'studio-social': makeGuide({
    fr: {
      title: '📱 Réseaux & Médias : Atelier de Publications',
      description: 'Rédaction assistée des annonces Instagram et Facebook avec insertion en un clic des dates, mentions (@), lexique culturel et hashtags.',
      steps: [
        'Sélectionnez un événement à promouvoir ou partez d’une publication libre.',
        'Insérez les mentions partenaires, les termes culturels vérifiés et les hashtags habituels.',
        'Copiez le texte formaté et préparez le visuel associé pour vos réseaux sociaux.'
      ]
    },
    pt: {
      title: '📱 Redes & Mídias: Oficina de Publicações',
      description: 'Redação prática de postagens para Instagram e Facebook com inserção rápida de datas, menções (@), glossário cultural e hashtags.',
      steps: [
        'Selecione um evento para divulgar ou inicie uma publicação livre.',
        'Insira menções de parceiros, termos culturais recomendados e hashtags oficiais.',
        'Copie o texto formatado e prepare a arte correspondente para as redes sociais.'
      ]
    }
  }),

  newsletter: makeGuide({
    fr: {
      title: '📰 Compositeur de Lettres d’Information',
      description: 'Assemblage éditorial des infolettres publiques mêlant mot d’accueil, agenda des concerts à venir et souvenirs illustrés.',
      steps: [
        'Rédigez le texte d’ouverture et le fil conducteur de votre lettre d’information.',
        'Cochez les prochaines dates publiques et les retours en images à mettre en avant.',
        'Prévisualisez le rendu complet puis exportez ou transmettez la campagne vers Brevo.'
      ]
    },
    pt: {
      title: '📰 Compositor de Boletins Informativos',
      description: 'Montagem editorial dos informativos públicos reunindo mensagem de abertura, agenda de shows e memórias fotográficas.',
      steps: [
        'Escreva o texto de boas-vindas e o destaque principal da edição.',
        'Selecione as próximas apresentações públicas e os registros de eventos passados.',
        'Pré-visualize o boletim completo e exporte a campanha para disparo no Brevo.'
      ]
    }
  }),

  'varal-photos': makeGuide({
    fr: {
      title: '📸 Médiathèque Photos & Passerelle Cloud',
      description: 'Centralisation du stockage Cloud externe (Framaspace, Drive, Dropbox), collecte par QR code et publication sur le Varal Photos.',
      steps: [
        'Configurez le dossier Cloud racine de l’association pour un accès direct de l’équipe.',
        'Rattachez aux événements leurs liens de collecte publique et éditez les QR codes d’affiche.',
        'Publiez les albums triés pour alimenter le Varal Photos des membres et Mostrador.'
      ]
    },
    pt: {
      title: '📸 Acervo de Fotos & Conexão Cloud',
      description: 'Centralização do armazenamento externo (Framaspace, Drive, Dropbox), coleta por QR code e publicação no Varal de Fotos.',
      steps: [
        'Configure a pasta Cloud principal da associação para acesso rápido da equipe.',
        'Vincule aos eventos os links de envio público e gere os QR codes de divulgação.',
        'Publique os álbuns selecionados no Varal de Fotos dos membros e no Mostrador.'
      ]
    },
    targets: ['studio-cloud-root', 'studio-events-media-table', 'studio-varal-photos-rope']
  }),

  'studio-communication': makeGuide({
    fr: {
      title: '📣 Communication, Presse & Synchronisation Brevo',
      description: 'Pilotage des campagnes promotionnelles, suivi des listes d’abonnés à l’infolettre et coordination des supports presse.',
      steps: [
        'Vérifiez la synchronisation de votre liste d’abonnés publics avec votre compte Brevo.',
        'Planifiez vos jalons d’annonces avant chaque concert majeur ou rentrée associative.',
        'Maintenez en cohérence vos éléments presse avec l’espace organisateur de Mostrador.'
      ]
    },
    pt: {
      title: '📣 Comunicação, Imprensa & Integração Brevo',
      description: 'Coordenação de campanhas de divulgação, gestão da lista de inscritos no informativo e alinhamento de materiais de imprensa.',
      steps: [
        'Confira a sincronização da lista de inscritos públicos com sua conta Brevo.',
        'Planeje o cronograma de divulgação antes de grandes shows ou oficinas abertas.',
        'Mantenha os materiais de imprensa alinhados ao espaço do contratante no Mostrador.'
      ]
    }
  }),

  'studio-lexique': makeGuide({
    fr: {
      title: '📖 Lexique Culturel, Mentions (@) & Hashtags',
      description: 'Référentiel éditorial partagé garantissant un vocabulaire culturel juste (Batuque, Baque, Toada), des comptes @ vérifiés et des hashtags homogènes.',
      steps: [
        'Enregistrez dans le carnet de mentions les identifiants @ des partenaires, photographes et nations amies.',
        'Définissez les équivalences culturelles recommandées afin d’éviter toute approximation lexicale dans vos publications.',
        'Configurez vos grappes de hashtags récurrents injectables en un clic dans l’atelier Réseaux & Médias.'
      ]
    },
    pt: {
      title: '📖 Glossário Cultural, Menções (@) & Hashtags',
      description: 'Referência editorial compartilhada garantindo vocabulário cultural fiel (Batuque, Baque, Toada), perfis @ corretos e hashtags padronizadas.',
      steps: [
        'Cadastre no catálogo de menções os perfis @ de parceiros, fotógrafos e grupos amigos.',
        'Defina os termos culturais recomendados para preservar o rigor tradicional nas publicações.',
        'Configure seus conjuntos de hashtags recorrentes prontos para inserir em um clique nas postagens.'
      ]
    },
    targets: ['studio-lexique-mentions', 'studio-lexique-vocab', 'studio-lexique-hashtags']
  })
};
