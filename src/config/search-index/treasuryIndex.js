import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) du pôle Trésorerie (< 140 lignes).
 */
export const treasuryIndex = [
  makeSearchItem({
    id: 'treso-dashboard', poleId: 'tresorerie', tabId: 'dashboard-finance',
    fr: { title: 'Tableau de Bord Financier & Trésorerie', description: 'Solde en temps réel, recettes/dépenses de l’exercice, graphiques d’évolution et alertes comptables', keywords: ['tresorerie', 'finances', 'solde', 'banque', 'recettes', 'depenses', 'comptabilite', 'budget'] },
    pt: { title: 'Painel Financeiro & Fluxo de Caixa', description: 'Saldo atualizado, receitas e despesas do exercício, gráficos de evolução e alertas contábeis', keywords: ['tesouraria', 'financas', 'saldo', 'banco', 'receitas', 'despesas', 'contabilidade', 'caixa'] }
  }),
  makeSearchItem({
    id: 'treso-cotisations', poleId: 'tresorerie', tabId: 'cotisations',
    fr: { title: 'Cotisations Adhérents, HelloAsso & Relances', description: 'Suivi des paiements d’adhésion, tarifs réduits, échéanciers, synchronisation HelloAsso et reçus', keywords: ['cotisations', 'adhesions', 'paiements', 'helloasso', 'stripe', 'tarifs', 'recu', 'impayes'] },
    pt: { title: 'Mensalidades, Anuidades & Cobranças', description: 'Acompanhamento de contribuições dos membros, parcelamentos, Pix/cartão, recibos e pendências', keywords: ['mensalidades', 'anuidades', 'pagamentos', 'contribuicoes', 'pix', 'recibo', 'inadimplencia'] }
  }),
  makeSearchItem({
    id: 'treso-events', poleId: 'tresorerie', tabId: 'events-finances',
    fr: { title: 'Comptabilité par Événement, Cachets & Billetterie', description: 'Rentabilité analytique des concerts, stages et festivals : cachets facturés, frais et billetterie', keywords: ['cachets', 'billetterie', 'factures', 'evenements finances', 'analytique', 'recettes concert'] },
    pt: { title: 'Contabilidade por Evento, Cachês & Bilheteria', description: 'Balanço analítico de shows, oficinas e festivais: cachês faturados, custos e bilheteria', keywords: ['caches', 'bilheteria', 'notas fiscais', 'financas eventos', 'analitico', 'receita show'] }
  }),
  makeSearchItem({
    id: 'treso-operations', poleId: 'tresorerie', tabId: 'operations-diverses',
    fr: { title: 'Livre de Comptes, Achats & Subventions', description: 'Saisie des écritures courantes, factures fournisseurs, subventions publiques et pièces justificatives', keywords: ['operations diverses', 'livre de comptes', 'ecritures', 'achats', 'subventions', 'justificatifs'] },
    pt: { title: 'Livro-Caixa, Despesas Gerais & Editais', description: 'Lançamento de movimentações avulsas, notas de fornecedores, fomentos públicos e comprovantes', keywords: ['lancamentos', 'livro caixa', 'despesas', 'compras', 'editais', 'subvencoes', 'comprovantes'] }
  }),
  makeSearchItem({
    id: 'treso-frais-km', poleId: 'tresorerie', tabId: 'frais-km',
    fr: { title: 'Notes de Frais, Indemnités Kilométriques & Dons', description: 'Validation des remboursements bénévoles, barème kilométrique et reçus fiscaux Cerfa d’abandon de frais', keywords: ['notes de frais', 'frais kilometriques', 'remboursements', 'cerfa', 'abandon de frais', 'benevoles'] },
    pt: { title: 'Reembolsos de Despesas & Quilometragem', description: 'Aprovação de reembolsos a voluntários, cálculo por quilômetro rodado e recibos de doação', keywords: ['reembolsos', 'quilometragem', 'despesas viagem', 'combustivel', 'pedagio', 'voluntarios'] }
  }),
  makeSearchItem({
    id: 'treso-exports', poleId: 'tresorerie', tabId: 'reports-exports',
    fr: { title: 'Clôture d’Exercice, Compte de Résultat & Exports CSV', description: 'Génération du grand livre, bilan comptable annuel pour l’AG et exports tableur normalisés', keywords: ['exports comptables', 'cloture', 'compte de resultat', 'grand livre', 'bilan annuel', 'csv'] },
    pt: { title: 'Fechamento Anual, Demonstrativo & Exportações CSV', description: 'Geração do livro-razão, demonstrativo de resultados para a assembleia e planilhas contábeis', keywords: ['exportacoes contabeis', 'fechamento', 'demonstrativo', 'livro razao', 'balanco anual', 'csv'] }
  })
];
