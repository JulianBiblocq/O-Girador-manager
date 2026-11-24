import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Mestria (< 135 lignes).
 */
export const mestreGuides = {
  mestre: makeGuide({
    fr: {
      title: '🎭 Pôle Mestria & Direction Artistique',
      description: 'Pilotage artistique de la troupe : Classeur du Répertoire relié à Sequenciador, Cantador et Dançador, orientation des pupitres, plans de scène et directives.',
      steps: [
        'Structurez les pièces de la saison et leurs passerelles vers Sequenciador, Cantador et Dançador.',
        'Équilibrez les pupitres et validez les souhaits d’évolution instrumentale des membres.',
        'Concevez les plans de scène et diffusez les consignes artistiques prioritaires.'
      ]
    },
    pt: {
      title: '🎭 Polo Mestria & Direção Artística',
      description: 'Direção artística da trupe: Fichário do Repertório conectado a Sequenciador, Cantador e Dançador, equilíbrio de naipes, mapas de palco e comunicados.',
      steps: [
        'Estruture as peças da temporada e suas conexões com Sequenciador, Cantador e Dançador.',
        'Equilibre os naipes e valide os pedidos de evolução instrumental dos integrantes.',
        'Monte os mapas de palco e publique as orientações artísticas prioritárias.'
      ]
    }
  }),

  'mestre-repertoire': makeGuide({
    fr: {
      title: '📜 Classeur du Répertoire Unifié',
      description: 'Référentiel central des morceaux et rythmes reliant Sequenciador, les packs vocaux Cantador, les chorégraphies Dançador et les arbitrages de signaux du Mestre.',
      steps: [
        'Ajoutez ou mettez à jour les pièces de la saison active et des archives avec leur niveau de maturité.',
        'Reliez chaque morceau à son arrangement Sequenciador, sa toada Cantador, sa chorégraphie Dançador et vos ajustements de signaux de commandement.',
        'Rattachez les fiches culturelles du Varal et injectez les morceaux dans le programme des répétitions et prestations.'
      ]
    },
    pt: {
      title: '📜 Fichário Unificado do Repertório',
      description: 'Referência central das músicas e baques integrando Sequenciador, pacotes vocais do Cantador, coreografias do Dançador e ajustes de sinais do Mestre.',
      steps: [
        'Cadastre ou atualize as peças da temporada ativa e do acervo com seu nível de maturidade.',
        'Vincule cada música ao seu arranjo no Sequenciador, toada no Cantador, coreografia no Dançador e ajustes personalizados de sinais de regência.',
        'Conecte as fichas culturais do Varal e inclua as peças no programa de ensaios e apresentações.'
      ]
    }
  }),

  'mestre-sequenceur': makeGuide({
    fr: {
      title: '🥁 Arrangements & Presets Sequenciador',
      description: 'Liaison directe entre les arrangements rythmiques de Sequenciador et les fiches du Répertoire.',
      steps: [
        'Parcourez la liste des arrangements synchronisés depuis Sequenciador.',
        'Associez les métadonnées pédagogiques et les signaux du Mestre à chaque rythme.',
        'Vérifiez l’ouverture directe des exercices rythmiques pour les pupitres.'
      ]
    },
    pt: {
      title: '🥁 Arranjos & Presets do Sequenciador',
      description: 'Integração direta entre os arranjos rítmicos do Sequenciador e as fichas do Repertório.',
      steps: [
        'Consulte a lista de arranjos sincronizados a partir do Sequenciador.',
        'Vincule metadados pedagógicos e sinais do Mestre a cada ritmo.',
        'Confira a abertura direta dos treinos rítmicos para cada naipe.'
      ]
    },
    targets: ['mestre-sequenceur-list', 'mestre-sequenceur-metadata', 'mestre-sequenceur-list']
  }),

  'mestre-orientation': makeGuide({
    fr: {
      title: '🎯 Orientation & Casting des Pupitres',
      description: 'Suivi de l’équilibre instrumental du Batuque et de la danse, arbitrage des vœux d’évolution et affectation des instruments principal et secondaire.',
      steps: [
        'Contrôlez les jauges d’effectifs et les quotas par pupitre.',
        'Examinez la table des souhaits d’orientation et d’instruments secondaires des adhérents.',
        'Validez les affectations officielles de pupitres pour la saison.'
      ]
    },
    pt: {
      title: '🎯 Orientação & Escalada dos Naipes',
      description: 'Controle do equilíbrio instrumental do Batuque e da dança, análise dos pedidos de evolução e definição de instrumento principal e secundário.',
      steps: [
        'Verifique os indicadores de efetivo e as cotas por naipe.',
        'Analise a tabela de desejos de orientação e segundo instrumento dos integrantes.',
        'Confirme as alocações oficiais de naipes para a temporada.'
      ]
    },
    targets: ['mestre-orientation-gauges', 'mestre-orientation-table', 'mestre-orientation-assignment']
  }),

  'mestre-stage-layout': makeGuide({
    fr: {
      title: '📐 Plans de Scène & Disposition Cortejo',
      description: 'Conception visuelle de l’implantation scénique et de l’ordre de défilé à partir des musiciens et danseurs confirmés.',
      steps: [
        'Ouvrez la grille scénique d’une prestation pour dimensionner les rangs du Batuque et l’avant-scène danse.',
        'Placez les membres confirmés depuis la liste latérale en équilibrant les voix d’alfaia et les pupitres.',
        'Ajustez l’alignement ou le quinconce sur la grille puis exportez le plan final.'
      ]
    },
    pt: {
      title: '📐 Mapas de Palco & Formação de Cortejo',
      description: 'Criação visual do posicionamento de palco e da formação de cortejo a partir dos músicos e dançarinos confirmados.',
      steps: [
        'Abra a grade cênica de uma apresentação para ajustar as fileiras do Batuque e a frente de dança.',
        'Posicione os integrantes confirmados a partir da lista lateral equilibrando marcações de alfaia e naipes.',
        'Ajuste o alinhamento na grade cênica e exporte o mapa final da apresentação.'
      ]
    },
    targets: ['mestre-stage-grid', 'mestre-stage-roster', 'mestre-stage-grid']
  }),

  'mestre-mot-mestre': makeGuide({
    fr: {
      title: '📣 Annonces & Directives du Mestre',
      description: 'Canal éditorial direct de la direction artistique vers la troupe pour partager la vision musicale et les priorités de travail.',
      steps: [
        'Rédigez un message d’orientation artistique ou un rappel d’écoute collective.',
        'Mettez en avant les morceaux à consolider dans Sequenciador et Cantador avant la prochaine échéance.',
        'Archivez ou actualisez les consignes précédentes au fil de la saison.'
      ]
    },
    pt: {
      title: '📣 Comunicados & Diretrizes do Mestre',
      description: 'Canal direto da direção artística para compartilhar a visão musical e os focos de estudo com toda a trupe.',
      steps: [
        'Escreva uma mensagem de orientação artística ou lembrete de escuta coletiva.',
        'Destaque as peças prioritárias para praticar no Sequenciador e no Cantador antes do próximo compromisso.',
        'Arquive ou atualize as orientações anteriores ao longo da temporada.'
      ]
    }
  })
};
