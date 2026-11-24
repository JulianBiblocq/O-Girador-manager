import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) des pôles Gouvernance & Secrétariat (< 140 lignes).
 */
export const governanceAndSecretariatIndex = [
  makeSearchItem({
    id: 'gov-reunions', poleId: 'gouvernance', tabId: 'ca-reunions',
    fr: { title: 'Réunions du CA, AG & Procès-Verbaux', description: 'Ordres du jour, convocations, feuille d’émargement et rédaction des comptes-rendus officiels', keywords: ['reunions', 'ca', 'assemblee generale', 'pv', 'proces verbal', 'ordre du jour', 'convocation'] },
    pt: { title: 'Reuniões da Diretoria, Assembleia & Atas', description: 'Pautas, convocações, lista de presença e redação das atas oficiais da associação', keywords: ['reunioes', 'diretoria', 'assembleia geral', 'ata', 'atas', 'pauta', 'convocacao'] }
  }),
  makeSearchItem({
    id: 'gov-reports', poleId: 'gouvernance', tabId: 'ca-reports',
    fr: { title: 'Bilans Saisonniers & Rapports d’AG', description: 'Indicateurs de vie associative, fréquentation, rapport moral et bilan d’activité imprimable', keywords: ['bilans', 'rapports', 'rapport moral', 'activite', 'statistiques', 'saison', 'ag'] },
    pt: { title: 'Balanços da Temporada & Relatórios Anuais', description: 'Indicadores da vida associativa, frequência, relatório moral e balanço de atividades', keywords: ['balanco', 'relatorios', 'relatorio moral', 'atividades', 'estatisticas', 'temporada'] }
  }),
  makeSearchItem({
    id: 'gov-documents', poleId: 'gouvernance', tabId: 'ca-documents',
    fr: { title: 'Registre Légal, Statuts & Assurances', description: 'Statuts associatifs, récépissés préfectoraux, attestations d’assurance RC et archives légales', keywords: ['statuts', 'registre legal', 'assurance', 'prefecture', 'rna', 'siret', 'juridique'] },
    pt: { title: 'Registro Legal, Estatuto & Seguros', description: 'Estatuto social, certidões oficiais, apólices de seguro e arquivo jurídico da associação', keywords: ['estatuto', 'registro legal', 'seguro', 'cnpj', 'certidoes', 'juridico'] }
  }),
  makeSearchItem({
    id: 'gov-finances', poleId: 'gouvernance', tabId: 'ca-finances',
    fr: { title: 'Synthèse Financière du Bureau', description: 'Vue consolidée de la trésorerie, du budget prévisionnel et des équilibres pour le Conseil d’Administration', keywords: ['synthese financiere', 'budget', 'tresorerie ca', 'solde', 'bilan financier'] },
    pt: { title: 'Síntese Financeira da Diretoria', description: 'Visão consolidada do caixa, orçamento previsto e equilíbrio financeiro para o conselho', keywords: ['sintese financeira', 'orcamento', 'caixa diretoria', 'saldo', 'balanco financeiro'] }
  }),
  makeSearchItem({
    id: 'gov-prestations', poleId: 'gouvernance', tabId: 'ca-prestations',
    fr: { title: 'Validation des Dates & Engagements Scéniques', description: 'Suivi stratégique des contrats de cession, cachets et engagements de la troupe par le Bureau', keywords: ['dates', 'engagements', 'contrats', 'prestations ca', 'cachets', 'validation'] },
    pt: { title: 'Validação de Datas & Compromissos Artísticos', description: 'Acompanhamento estratégico de contratos, cachês e apresentações pela diretoria', keywords: ['datas', 'compromissos', 'contratos', 'apresentacoes', 'caches', 'validacao'] }
  }),
  makeSearchItem({
    id: 'sec-annuaire', poleId: 'secretariat', tabId: 'export-annu',
    fr: { title: 'Annuaire des Adhérents, Fiches & Exports', description: 'Liste complète des membres, édition des profils, statuts d’adhésion et exports CSV/PDF', keywords: ['annuaire', 'adherents', 'membres', 'export csv', 'liste membres', 'inscription', 'coordonnees'] },
    pt: { title: 'Cadastro de Associados, Fichas & Exportações', description: 'Lista completa de integrantes, edição de perfis, situação cadastral e exportação CSV/PDF', keywords: ['cadastro', 'associados', 'membros', 'exportar csv', 'lista de membros', 'contatos'] }
  }),
  makeSearchItem({
    id: 'sec-events', poleId: 'secretariat', tabId: 'studio-events',
    fr: { title: 'Gestion de l’Agenda, Répétitions & Sondages', description: 'Création des répétitions, stages, ateliers par pupitre, sorties publiques et convocations', keywords: ['agenda secretariat', 'creer evenement', 'repetitions', 'stages', 'sondages', 'calendrier'] },
    pt: { title: 'Gestão da Agenda, Ensaios & Enquetes', description: 'Criação de ensaios, oficinas por naipe, cortejos públicos e convocações da trupe', keywords: ['agenda secretaria', 'criar evento', 'ensaios', 'oficinas', 'enquetes', 'calendario'] }
  }),
  makeSearchItem({
    id: 'sec-varal', poleId: 'secretariat', tabId: 'varal-secretariat',
    fr: { title: 'Documents Officiels & Modèles Administratifs', description: 'Publication d’attestations, convocations et documents administratifs sur le Varal', keywords: ['documents officiels', 'attestations', 'courriers', 'administratif', 'varal secretariat'] },
    pt: { title: 'Documentos Oficiais & Modelos Administrativos', description: 'Publicação de declarações, convocações e documentos administrativos no Varal', keywords: ['documentos oficiais', 'declaracoes', 'oficios', 'administrativo', 'varal secretaria'] }
  }),
  makeSearchItem({
    id: 'sec-chartes', poleId: 'secretariat', tabId: 'secretariat-documents',
    fr: { title: 'Règlement Intérieur, Chartes, Droit à l’Image & Santé', description: 'Suivi des chartes signées, consentements droit à l’image, contacts d’urgence et fiches sanitaires', keywords: ['reglement interieur', 'charte', 'droit a l image', 'sante', 'urgence', 'allergies'] },
    pt: { title: 'Regimento Interno, Termos de Imagem & Saúde', description: 'Controle de termos assinados, autorização de uso de imagem, contatos de emergência e saúde', keywords: ['regimento interno', 'termo', 'direito de imagem', 'saude', 'emergencia', 'alergias'] }
  })
];
