import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Costumerie — Partie 1 (< 105 lignes).
 */
export const costumerieGuidesPart1 = {
  costumerie: makeGuide({
    fr: {
      title: '🥻 Pôle Costumerie & Artisanat Textile',
      description: 'Atelier de création vestimentaire, gestion des patrons, chantiers de couture, stock de tissus, mensurations et vestiaire de scène.',
      steps: [
        'Concevez les modèles de tenues officielles par section (cortège, danse, Batuque).',
        'Pilotez les chantiers de coupe et de confection avec les couturiers bénévoles.',
        'Suivez l’attribution des pièces du vestiaire physique selon les mensurations des membres.'
      ]
    },
    pt: {
      title: '🥻 Polo Figurino & Artesanato Têxtil',
      description: 'Oficina de criação têxtil, gestão de moldes, mutirões de costura, estoque de tecidos, medidas corporais e acervo de trajes.',
      steps: [
        'Defina os modelos de figurinos oficiais por ala (cortejo, dança, Batuque).',
        'Coordene os projetos de corte e costura com a equipe voluntária.',
        'Acompanhe a entrega das peças físicas conforme a tabela de medidas dos integrantes.'
      ]
    }
  }),

  'wardrobe-projects': makeGuide({
    fr: {
      title: '🪡 Établi de Confection & Chantiers Couture',
      description: 'Organisation des séries et pièces sur mesure en cours de découpe, d’assemblage et de finition.',
      steps: [
        'Lancez un nouveau chantier de confection à partir d’un modèle de tenue et d’une taille cible.',
        'Répartissez les chantiers actifs sur la grille de l’atelier entre les couturiers volontaires.',
        'Cochez les étapes de coupe, couture et essayage jusqu’à l’entrée au vestiaire physique.'
      ]
    },
    pt: {
      title: '🪡 Bancada de Confecção & Projetos de Costura',
      description: 'Organização das séries e peças sob medida em fase de corte, montagem e acabamento.',
      steps: [
        'Abra um novo projeto de confecção a partir de um modelo de traje e tamanho desejado.',
        'Distribua os projetos ativos na grade da oficina entre os costureiros voluntários.',
        'Marque as etapas de corte, costura e prova até a entrada da peça no acervo físico.'
      ]
    },
    targets: ['costumerie-new-project-btn', 'costumerie-projects-grid', 'costumerie-project-steps']
  }),

  'wardrobe-models': makeGuide({
    fr: {
      title: '🎨 Modèles de Costumes & Patrons',
      description: 'Catalogue des silhouettes officielles de la troupe détaillant les pièces obligatoires, ornements, métrages et patrons PDF.',
      steps: [
        'Créez ou éditez les cartes de modèles par pupitre ou personnage du cortège.',
        'Détaillez sur chaque carte les pièces obligatoires, métrages de tissu et fournitures.',
        'Attachez les patrons PDF gradués directement sur la carte du modèle.'
      ]
    },
    pt: {
      title: '🎨 Modelos de Figurinos & Moldes',
      description: 'Catálogo dos trajes oficiais da trupe detalhando peças obrigatórias, adereços, metragens de tecido e moldes em PDF.',
      steps: [
        'Crie ou edite os cartões de modelos por naipe ou personagem do cortejo.',
        'Detalhe em cada cartão as peças obrigatórias, metragem de tecido e aviamentos.',
        'Anexe os moldes em PDF graduados diretamente no cartão do modelo.'
      ]
    },
    targets: ['costumerie-models-cards', 'costumerie-models-cards', 'costumerie-models-cards']
  }),

  'wardrobe-pieces': makeGuide({
    fr: {
      title: '👗 Vestiaire Physique & Attributions',
      description: 'Inventaire unitaire des vêtements et accessoires confectionnés avec suivi des prêts, retours et besoins de retouche.',
      steps: [
        'Vérifiez dans le tableau la disponibilité des tenues par modèle, taille et état d’entretien.',
        'Attribuez ou récupérez les pièces de costume auprès des danseurs et musiciens.',
        'Suivez dans le tableau les retours après prestation et les besoins de retouche.'
      ]
    },
    pt: {
      title: '👗 Acervo Físico de Figurinos & Empréstimos',
      description: 'Inventário individual das roupas e adereços prontos com controle de entregas, devoluções e ajustes.',
      steps: [
        'Confira na tabela a disponibilidade dos trajes por modelo, tamanho e conservação.',
        'Atribua ou registre a devolução das peças junto aos dançarinos e músicos.',
        'Acompanhe na tabela as devoluções pós-evento e eventuais necessidades de ajuste.'
      ]
    },
    targets: ['costumerie-pieces-table', 'costumerie-pieces-assign', 'costumerie-pieces-table']
  })
};
