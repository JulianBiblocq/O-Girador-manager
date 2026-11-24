import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) du pôle Costumerie (< 140 lignes).
 */
export const costumerieIndex = [
  makeSearchItem({
    id: 'cost-projects', poleId: 'costumerie', tabId: 'wardrobe-projects',
    fr: { title: 'Établi de Confection, Couture & Retouches', description: 'Suivi des chantiers de coupe, couture, broderie et retouches des tenues de spectacle', keywords: ['etabli confection', 'couture', 'retouches', 'broderie', 'chantiers costumes', 'atelier couture'] },
    pt: { title: 'Bancada de Confecção, Costura & Ajustes', description: 'Acompanhamento de corte, costura, bordado e ajustes dos figurinos de apresentação', keywords: ['bancada confeccao', 'costura', 'ajustes', 'bordado', 'oficina figurino', 'aderecos'] }
  }),
  makeSearchItem({
    id: 'cost-models', poleId: 'costumerie', tabId: 'wardrobe-models',
    fr: { title: 'Modèles, Silhouettes & Patrons de Scène', description: 'Catalogue des tenues par personnage ou pupitre, patrons PDF et gammes de montage', keywords: ['modeles costumes', 'patrons', 'silhouettes', 'personnages', 'cour royale', 'baianas', 'coupe'] },
    pt: { title: 'Modelos, Figurinos & Moldes de Corte', description: 'Catálogo de trajes por personagem ou ala, moldes em PDF e instruções de confecção', keywords: ['modelos figurinos', 'moldes', 'personagens', 'corte real', 'baianas', 'alas', 'modelagem'] }
  }),
  makeSearchItem({
    id: 'cost-pieces', poleId: 'costumerie', tabId: 'wardrobe-pieces',
    fr: { title: 'Vestiaire Physique & Attribution des Pièces', description: 'Inventaire unitaire des vêtements, coiffes et accessoires, prêts aux membres et suivi pressing', keywords: ['vestiaire physique', 'pieces costume', 'robes', 'chemises', 'coiffes', 'attribution', 'lavage'] },
    pt: { title: 'Guarda-Roupa Físico & Empréstimo de Peças', description: 'Inventário individual de roupas, chapéus e adereços, entrega aos membros e higienização', keywords: ['guarda roupa', 'pecas figurino', 'saias', 'batas', 'chapeus', 'coroas', 'lavanderia'] }
  }),
  makeSearchItem({
    id: 'cost-supplies', poleId: 'costumerie', tabId: 'wardrobe-supplies',
    fr: { title: 'Stock de Tissus, Rubans & Mercerie', description: 'Métrages de tissus, dentelles, galons, sequins, fils et fournitures de mercerie disponibles', keywords: ['tissus', 'mercerie', 'rubans', 'dentelle', 'sequins', 'fils', 'boutons', 'metrage'] },
    pt: { title: 'Estoque de Tecidos, Fitas & Aviamentos', description: 'Metragem de tecidos, rendas, sianinhas, lantejoulas, linhas e aviamentos disponíveis', keywords: ['tecidos', 'aviamentos', 'fitas', 'renda', 'lantejoulas', 'paetes', 'linhas', 'metragem'] }
  }),
  makeSearchItem({
    id: 'cost-tools', poleId: 'costumerie', tabId: 'wardrobe-tools',
    fr: { title: 'Machines à Coudre, Surjeteuses & Matériel', description: 'Parc de machines, mannequins, fers à repasser, ciseaux de coupe et suivi de révision', keywords: ['machines a coudre', 'surjeteuse', 'mannequins', 'ciseaux', 'repassage', 'outils couture'] },
    pt: { title: 'Máquinas de Costura, Overloques & Equipamentos', description: 'Controle de máquinas, manequins, ferros de passar, tesouras de corte e manutenção', keywords: ['maquinas de costura', 'overloque', 'manequins', 'tesouras', 'ferro', 'equipamentos costura'] }
  }),
  makeSearchItem({
    id: 'cost-sizes', poleId: 'costumerie', tabId: 'wardrobe-sizes',
    fr: { title: 'Tableau des Tailles & Mensurations de la Troupe', description: 'Récapitulatif confidentiel des tailles et mesures des membres pour la coupe sur mesure', keywords: ['tailles', 'mensurations', 'mesures', 'tour de taille', 'pointure', 'essayages'] },
    pt: { title: 'Tabela de Tamanhos & Medidas da Trupe', description: 'Quadro confidencial de tamanhos e medidas corporais dos integrantes para confecção sob medida', keywords: ['tamanhos', 'medidas', 'manequim', 'cintura', 'calcado', 'provas de roupa'] }
  }),
  makeSearchItem({
    id: 'cost-varal', poleId: 'costumerie', tabId: 'varal-costumerie',
    fr: { title: 'Varal Costumerie — Planches d’Inspiration & Tutoriels', description: 'Guides d’habillage, planches couleurs de saison, tutoriels de coiffes et fiches d’entretien textile', keywords: ['varal costumerie', 'inspiration', 'habillage', 'maquillage', 'coiffes', 'entretien textile'] },
    pt: { title: 'Varal do Figurino — Referências & Tutoriais', description: 'Guias de vestimenta, paleta de cores da temporada, tutoriais de adereços e conservação', keywords: ['varal figurino', 'referencias', 'vestimenta', 'maquiagem', 'aderecos', 'cuidados tecido'] }
  })
];
