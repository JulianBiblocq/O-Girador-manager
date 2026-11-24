import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) des pôles Diffusion & Logistique (< 140 lignes).
 */
export const diffusionAndLogisticsIndex = [
  makeSearchItem({
    id: 'diff-pipeline', poleId: 'diffusion', tabId: 'gigs-pipeline',
    fr: { title: 'Suivi des Prestations, Devis & Contacts Programmation', description: 'Prospection commerciale, demandes reçues depuis Mostrador, devis, contrats et carnet d’organisateurs', keywords: ['diffusion', 'prestations', 'concerts', 'devis', 'contrats', 'contacts', 'organisateurs', 'programmation', 'booking'] },
    pt: { title: 'Gestão de Apresentações, Orçamentos & Contratantes', description: 'Prospecção artística, pedidos vindos do Mostrador, propostas, contratos e carteira de produtores', keywords: ['difusao', 'shows', 'apresentacoes', 'orcamentos', 'contratos', 'contratantes', 'produtores', 'agenda comercial'] }
  }),
  makeSearchItem({
    id: 'log-inventory', poleId: 'logistique', tabId: 'inventory',
    fr: { title: 'Parc Instruments, Prêts & Cautions', description: 'Inventaire complet du Batuque, attribution des instruments aux membres et suivi des chèques de caution', keywords: ['parc instruments', 'inventaire', 'prets', 'cautions', 'tambours', 'alfaia', 'gongue', 'agbe', 'caixa'] },
    pt: { title: 'Acervo de Instrumentos, Empréstimos & Cauções', description: 'Inventário completo do Batuque, empréstimo de instrumentos aos membros e controle de cauções', keywords: ['acervo instrumentos', 'inventario', 'emprestimos', 'caucoes', 'tambores', 'alfaia', 'gongue', 'agbe', 'caixa'] }
  }),
  makeSearchItem({
    id: 'log-orders', poleId: 'logistique', tabId: 'orders',
    fr: { title: 'Commandes Groupées & Achats Matériel', description: 'Organisation des achats collectifs (baguettes, bouchons d’oreilles, peaux, t-shirts) et réservations membres', keywords: ['commandes groupees', 'achats', 'baguettes', 'protections auditives', 'fournisseurs', 'boutique interne'] },
    pt: { title: 'Compras Coletivas & Encomendas de Material', description: 'Organização de pedidos em grupo (baquetas, protetores auriculares, peles, camisetas) e reservas', keywords: ['compras coletivas', 'encomendas', 'baquetas', 'protetores auriculares', 'fornecedores', 'pedidos'] }
  }),
  makeSearchItem({
    id: 'log-carpool', poleId: 'logistique', tabId: 'logistics-carpool',
    fr: { title: 'Convois, Covoiturage & Flotte Véhicules', description: 'Répartition des passagers et du volume matériel dans les véhicules pour les déplacements de la troupe', keywords: ['convois', 'covoiturage', 'flotte', 'vehicules', 'camion', 'transport', 'volume', 'deplacement'] },
    pt: { title: 'Comboios, Caronas & Frota de Veículos', description: 'Distribuição de passageiros e volume de carga nos veículos para viagens e cortejos da trupe', keywords: ['comboio', 'caronas', 'frota', 'veiculos', 'van', 'transporte', 'carga', 'viagem'] }
  }),
  makeSearchItem({
    id: 'log-kits', poleId: 'logistique', tabId: 'logistics-kits',
    fr: { title: 'Malles Régie, Listes de Départ & Trousses de Secours', description: 'Préparation des malles de scène, outillage d’urgence, pharmacie et vérification avant départ', keywords: ['malles', 'regie', 'trousse de secours', 'pharmacie', 'liste depart', 'securite', 'materiel scene'] },
    pt: { title: 'Baús de Produção, Checklists & Primeiros Socorros', description: 'Preparação dos baús de palco, ferramentas de emergência, kit médico e conferência de saída', keywords: ['baus', 'producao', 'primeiros socorros', 'farmacia', 'checklist', 'seguranca', 'apoio'] }
  })
];
