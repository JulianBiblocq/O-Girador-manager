import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) des 4 sous-onglets du Pôle Logistique :
 * `inventory`, `logistics-kits`, `logistics-carpool`, `orders`.
 */
export const logisticsTabsGuides = {
  inventory: makeGuide({
    fr: {
      title: '🛠️ Parc Instruments & Suivi des Cautions',
      description: 'Registre complet des instruments, housses, sangles et accessoires de l’association avec suivi des prêts et de l’état sanitaire.',
      steps: [
        'Filtrez le parc par famille d’instrument, statut de disponibilité ou état d’entretien.',
        'Consultez le tableau détaillé pour assigner un instrument à un membre et vérifier sa caution.',
        'Ajoutez un nouvel équipement au parc avec son code d’inventaire et ses caractéristiques.'
      ]
    },
    pt: {
      title: '🛠️ Acervo de Instrumentos & Controle de Cauções',
      description: 'Registro completo de instrumentos, capas, talabartes e acessórios da associação com controle de empréstimos e conservação.',
      steps: [
        'Filtre o acervo por família de instrumento, disponibilidade ou estado de manutenção.',
        'Consulte a tabela detalhada para vincular um instrumento a um membro e conferir sua caução.',
        'Cadastre um novo equipamento no acervo com código de tombamento e especificações.'
      ]
    },
    targets: ['inventory-filter-bar', 'inventory-table-view', 'inventory-add-btn']
  }),

  'logistics-kits': makeGuide({
    fr: {
      title: '🧰 Malles Régie & Trousses de Secours',
      description: 'Préparation et pointage des malles collectives (outillage scène, pharmacie, bouchons d’oreilles, maquillage) embarquées en concert.',
      steps: [
        'Parcourez vos malles collectives et ouvrez une malle pour pointer ses articles.',
        'Surveillez le badge d’état pour repérer immédiatement les consommables manquants ou périmés.',
        'Créez une nouvelle malle sur mesure ou initialisez les modèles standards de régie.'
      ]
    },
    pt: {
      title: '🧰 Malas Técnicas & Kits de Primeiros Socorros',
      description: 'Preparação e conferência das malas coletivas (ferramentas de palco, farmácia, protetores auriculares, maquiagem) levadas aos shows.',
      steps: [
        'Visualize suas malas coletivas e abra qualquer caixa para conferir os itens internos.',
        'Observe o selo de status para identificar imediatamente itens em falta ou vencidos.',
        'Crie uma nova mala personalizada ou inicialize os modelos padrão de produção.'
      ]
    },
    targets: ['kits-grid', 'kits-status-badge', 'kits-add-btn']
  }),

  'logistics-carpool': makeGuide({
    fr: {
      title: '🚗 Convois & Flotte de Véhicules',
      description: 'Vue consolidée des véhicules conducteurs de la troupe, des capacités d’emport d’instruments et de l’organisation des convois.',
      steps: [
        'Consultez la flotte de véhicules renseignée par les adhérents et leur volume de coffre.',
        'Coordonnez la répartition des passagers et des instruments encombrants sur les prochaines dates.',
        'Vérifiez la cohérence des trajets avec les demandes d’indemnités kilométriques.'
      ]
    },
    pt: {
      title: '🚗 Comboios & Frota de Veículos',
      description: 'Visão consolidada dos veículos disponíveis na trupe, capacidade de transporte de instrumentos e organização de comboios.',
      steps: [
        'Consulte a frota de veículos informada pelos integrantes e o espaço de porta-malas.',
        'Coordene a divisão de passageiros e tambores grandes nas próximas apresentações.',
        'Confira a coerência dos trajetos com os pedidos de reembolso de quilometragem.'
      ]
    }
  }),

  orders: makeGuide({
    fr: {
      title: '🛒 Commandes Groupées & Approvisionnements',
      description: 'Centralisation des achats collectifs (baguettes, peaux, cordages, t-shirts, protections) et rapprochement des réceptions.',
      steps: [
        'Ouvrez une campagne de commande groupée ou une demande d’approvisionnement fournisseur.',
        'Recensez les quantités souhaitées par les membres et suivez la validation du devis.',
        'Pointez la réception de la marchandise pour mettre à jour les stocks et les distributions.'
      ]
    },
    pt: {
      title: '🛒 Compras Coletivas & Suprimentos',
      description: 'Centralização de compras em grupo (baquetas, peles, cordas, camisetas, protetores) e conferência de entregas.',
      steps: [
        'Abra uma campanha de compra coletiva ou pedido de reposição junto aos fornecedores.',
        'Reúna as quantidades solicitadas pelos membros e acompanhe a aprovação do orçamento.',
        'Confirme o recebimento dos materiais para atualizar o estoque e organizar a entrega.'
      ]
    }
  })
};
