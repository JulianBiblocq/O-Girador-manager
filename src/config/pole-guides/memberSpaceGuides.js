import { makeGuide } from './guideHelpers.js';

/**
 * Guides dédiés bilingues (FR / PT-BR) de l'Espace Membre :
 * - `mon-parcours` (Mon Parcours : Carnet d'aisance & Atelier d'entraînement)
 * - `atelier` (Mon Atelier : Instruments, Couture & Artisanat)
 */
export const memberSpaceGuides = {
  'mon-parcours': makeGuide({
    fr: {
      title: '🧭 Mon Parcours : Carnet d’Aisance & Entraînement',
      description: 'Suis ta progression sur le répertoire de la saison, travaille avec Sequenciador, Cantador et Dançador, et relève les défis interactifs.',
      steps: [
        'Consulte ton bandeau de synthèse Roda Quiz et tes statistiques personnelles de progression.',
        'Bascule entre ton Carnet d’aisance (auto-évaluation et demandes de révision en un clic) et l’Atelier d’entraînement.',
        'Pratique par paliers de tempo progressifs dans Sequenciador, travaille le chant sur Cantador ou la danse sur Dançador, puis teste-toi au Défi Réflexe et au Conducteur à trous.'
      ]
    },
    pt: {
      title: '🧭 Meu Percurso: Caderno de Conforto & Treino',
      description: 'Acompanhe sua evolução no repertório da temporada, pratique com Sequenciador, Cantador e Dançador, e encare os desafios interativos.',
      steps: [
        'Confira seu resumo de resultados no Roda Quiz e suas estatísticas pessoais de evolução.',
        'Alterne entre o Caderno de conforto (autoavaliação e pedidos de revisão em um clique) e a Oficina de treino.',
        'Treine por níveis progressivos de andamento no Sequenciador, estude as toadas no Cantador ou os passos no Dançador, e pratique no Desafio Reflexo e no Condutor com lacunas.'
      ]
    },
    targets: ['mon-parcours-stats', 'mon-parcours-switch', 'mon-parcours-content']
  }),

  atelier: makeGuide({
    fr: {
      title: '🛠️ Mon Atelier : Lutherie, Couture & Artisanat',
      description: 'Espace pratique pour suivre la fabrication de ton instrument, préparer ta tenue de cortège et consulter les tutoriels d’artisanat.',
      steps: [
        'Repère l’en-tête de ton atelier personnel et reviens facilement vers ton espace principal.',
        'Navigue entre les sous-onglets Instruments, Vestiaire & Costumes et Artisanat selon les pôles actifs de la troupe.',
        'Suis tes étapes d’assemblage ou de couture pas à pas et soumets tes réalisations à la validation des référents d’atelier.'
      ]
    },
    pt: {
      title: '🛠️ Minha Oficina: Luthieria, Costura & Artesanato',
      description: 'Espaço prático para acompanhar a montagem do seu instrumento, confeccionar seu figurino de cortejo e consultar os tutoriais.',
      steps: [
        'Identifique o cabeçalho da sua oficina pessoal e retorne facilmente ao seu espaço principal.',
        'Navegue entre as abas Instrumentos, Figurino & Costura e Artesanato conforme os módulos ativos do grupo.',
        'Acompanhe cada etapa de montagem ou costura passo a passo e envie suas peças para validação dos responsáveis da oficina.'
      ]
    },
    targets: ['atelier-header', 'atelier-subtabs', 'atelier-content']
  })
};
