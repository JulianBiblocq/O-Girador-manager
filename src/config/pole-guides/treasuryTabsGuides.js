import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) des 6 sous-onglets du Pôle Trésorerie :
 * `dashboard-finance`, `cotisations`, `events-finances`, `operations-diverses`, `frais-km`, `reports-exports`.
 */
export const treasuryTabsGuides = {
  'dashboard-finance': makeGuide({
    fr: {
      title: '📊 Synthèse & Bilan Financier',
      description: 'Vue d’ensemble de la trésorerie disponible, des coordonnées bancaires officielles et de l’équilibre budgétaire de l’exercice.',
      steps: [
        'Vérifiez les soldes bancaires consolidés et l’IBAN officiel de l’association.',
        'Observez la répartition des principaux postes de produits et de charges.',
        'Comparez l’exécution réelle de la saison avec votre budget prévisionnel.'
      ]
    },
    pt: {
      title: '📊 Síntese & Balanço Financeiro',
      description: 'Visão geral do caixa disponível, dados bancários oficiais e equilíbrio orçamentário do exercício.',
      steps: [
        'Confira os saldos bancários consolidados e os dados oficiais da conta da associação.',
        'Analise a distribuição das principais categorias de receitas e despesas.',
        'Compare o realizado na temporada com o orçamento previsto.'
      ]
    }
  }),

  cotisations: makeGuide({
    fr: {
      title: '💳 Cotisations Adhérents & Cautions',
      description: 'Paramétrage des formules tarifaires annuelles, rapprochement des paiements et suivi des cautions d’instruments.',
      steps: [
        'Configurez les formules d’adhésion et synchronisez les encaissements en ligne.',
        'Filtrez les dossiers en attente ou partiels pour effectuer des relances ciblées.',
        'Pointez les règlements perçus ainsi que la réception des cautions matérielles.'
      ]
    },
    pt: {
      title: '💳 Anuidades de Membros & Cauções',
      description: 'Configuração das faixas de anuidade, conciliação de pagamentos e controle das cauções de instrumentos.',
      steps: [
        'Configure as fórmulas de adesão e sincronize os recebimentos online.',
        'Filtre cadastros pendentes ou parciais para enviar lembretes direcionados.',
        'Registre os pagamentos recebidos e confirme as cauções de instrumentos.'
      ]
    }
  }),

  'events-finances': makeGuide({
    fr: {
      title: '🎟️ Comptabilité Analytique des Événements',
      description: 'Bilan recettes/dépenses par concert, stage ou soirée afin de mesurer la marge nette de chaque projet.',
      steps: [
        'Sélectionnez la date concernée dans la liste des événements de la saison.',
        'Rattachez le cachet facturé, la billetterie et les dépenses de transport ou restauration.',
        'Contrôlez le résultat net dégagé une fois l’événement clôturé.'
      ]
    },
    pt: {
      title: '🎟️ Contabilidade Analítica por Evento',
      description: 'Balanço de receitas e custos por apresentação, oficina ou festa para medir o saldo líquido de cada projeto.',
      steps: [
        'Selecione a data desejada na lista de eventos da temporada.',
        'Vincule cachê faturado, bilheteria e gastos de transporte ou alimentação.',
        'Verifique o resultado líquido obtido após o encerramento do evento.'
      ]
    }
  }),

  'operations-diverses': makeGuide({
    fr: {
      title: '📝 Journal des Opérations Courantes',
      description: 'Enregistrement chronologique des recettes et dépenses générales hors événements (loyer, assurance, atelier, frais bancaires).',
      steps: [
        'Ajoutez une écriture en précisant la date, le montant, le sens (recette ou dépense) et le compte débité.',
        'Affectez la catégorie comptable adéquate et le mode de règlement.',
        'Joignez la facture ou le reçu numérisé pour garantir une piste d’audit complète.'
      ]
    },
    pt: {
      title: '📝 Livro de Operações Correntes',
      description: 'Registro cronológico de receitas e despesas gerais fora de eventos (aluguel, seguro, oficina, tarifas bancárias).',
      steps: [
        'Adicione um lançamento informando data, valor, tipo (entrada ou saída) e conta utilizada.',
        'Classifique na categoria contábil correspondente e informe o meio de pagamento.',
        'Anexe a nota fiscal ou recibo digitalizado para manter a auditoria em dia.'
      ]
    }
  }),

  'frais-km': makeGuide({
    fr: {
      title: '🚗 Notes de Frais & Indemnités Kilométriques',
      description: 'Instruction et liquidation des demandes de remboursement d’achats et des frais de route soumis par les membres.',
      steps: [
        'Ouvrez les demandes en attente pour contrôler les justificatifs et le barème kilométrique.',
        'Approuvez la dépense pour remboursement bancaire ou enregistrez l’abandon de frais bénévole.',
        'Marquez le dossier comme remboursé afin d’inscrire automatiquement l’écriture au journal.'
      ]
    },
    pt: {
      title: '🚗 Notas de Despesas & Quilometragem',
      description: 'Análise e liquidação dos pedidos de reembolso de compras e deslocamentos enviados pelos integrantes.',
      steps: [
        'Abra as solicitações pendentes para conferir comprovantes e cálculo de quilometragem.',
        'Aprove a despesa para transferência bancária ou registre a renúncia voluntária.',
        'Marque o pedido como reembolsado para lançar automaticamente o débito no caixa.'
      ]
    }
  }),

  'reports-exports': makeGuide({
    fr: {
      title: '📈 Rapports Comptables & Exports AG',
      description: 'Édition du Grand Livre, de la balance par catégorie et des états financiers annuels pour l’Assemblée Générale.',
      steps: [
        'Choisissez la saison comptable ou la plage de dates à exporter.',
        'Vérifiez le compte de résultat synthétique et le solde final par compte.',
        'Téléchargez les exports CSV ou PDF prêts pour les vérificateurs aux comptes et l’AG.'
      ]
    },
    pt: {
      title: '📈 Relatórios Contábeis & Exportações da AG',
      description: 'Emissão do livro-caixa, balancete por categoria e demonstrativos financeiros anuais para a Assembleia Geral.',
      steps: [
        'Selecione o exercício contábil ou o intervalo de datas desejado.',
        'Confira o demonstrativo sintético de resultados e o saldo final de cada conta.',
        'Baixe os arquivos CSV ou PDF prontos para o conselho fiscal e para a AG.'
      ]
    }
  })
};
