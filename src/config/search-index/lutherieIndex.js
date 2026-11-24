import { makeSearchItem } from './searchIndexHelpers.js';

/**
 * Entrées bilingues (FR / PT-BR) du pôle Lutherie (< 140 lignes).
 */
export const lutherieIndex = [
  makeSearchItem({
    id: 'luth-projects', poleId: 'lutherie', tabId: 'inventory-projects',
    fr: { title: 'Établi de Lutherie, Chantiers & Réparations', description: 'Suivi des fabrications d’instruments, changements de peaux, cordages et maintenances en cours', keywords: ['etabli lutherie', 'chantiers', 'reparations', 'accordage', 'cordage', 'peaux', 'fabrication'] },
    pt: { title: 'Bancada de Luthieria, Montagens & Reparos', description: 'Acompanhamento de construção de tambores, troca de peles, encouramento e manutenções', keywords: ['bancada luthieria', 'montagens', 'reparos', 'afinacao', 'encouramento', 'peles', 'construcao'] }
  }),
  makeSearchItem({
    id: 'luth-models', poleId: 'lutherie', tabId: 'instrument-models',
    fr: { title: 'Modèles d’Instruments & Gabarits de Fabrication', description: 'Fiches techniques par famille d’instruments (dimensions, fûts, cercles, cordes et étapes d’assemblage)', keywords: ['modeles instruments', 'gabarits', 'plans', 'alfaia', 'gongue', 'agbe', 'abê', 'caixa', 'dimensions'] },
    pt: { title: 'Modelos de Instrumentos & Gabaritos Técnicos', description: 'Fichas técnicas por instrumento (medidas de casco, aros, cordas, miçangas e etapas de montagem)', keywords: ['modelos instrumentos', 'gabaritos', 'plantas', 'alfaia', 'gongue', 'agbe', 'caixa', 'medidas'] }
  }),
  makeSearchItem({
    id: 'luth-parts', poleId: 'lutherie', tabId: 'inventory-parts',
    fr: { title: 'Stock de Pièces Détachées (Peaux, Cercles, Tirants)', description: 'Gestion des pièces de rechange disponibles à l’atelier et seuils d’alerte de réapprovisionnement', keywords: ['pieces detachees', 'peaux chevre', 'cercles', 'futs', 'tirants', 'timbres', 'cales'] },
    pt: { title: 'Estoque de Peças de Reposição (Peles, Aros, Canoas)', description: 'Controle de peças sobressalentes disponíveis na oficina e alertas de reposição mínima', keywords: ['pecas reposicao', 'peles cabra', 'aros', 'cascos', 'canoas', 'tirantes', 'esteiras', 'tarraxas'] }
  }),
  makeSearchItem({
    id: 'luth-supplies', poleId: 'lutherie', tabId: 'inventory-supplies',
    fr: { title: 'Matières Premières (Cordes, Perles, Bois, Vernis)', description: 'Suivi des bobines de drisse, perles d’agbê, filets, colles, peintures et consommables d’atelier', keywords: ['matieres premieres', 'cordes', 'drisse', 'perles', 'calebasses', 'bois', 'vernis', 'peinture'] },
    pt: { title: 'Matérias-Primas (Cordas, Miçangas, Madeira, Verniz)', description: 'Controle de rolos de corda, contas de agbê, cabaças, redes, colas, tintas e insumos', keywords: ['materias primas', 'cordas', 'micangas', 'contas', 'cabacas', 'madeira', 'verniz', 'tinta'] }
  }),
  makeSearchItem({
    id: 'luth-tools', poleId: 'lutherie', tabId: 'workshop-tools',
    fr: { title: 'Outillage d’Atelier Lutherie', description: 'Inventaire des outils collectifs, localisation, état d’usure et prêts d’outillage aux membres', keywords: ['outillage lutherie', 'outils', 'perceuse', 'ponceuse', 'cles', 'gants', 'atelier'] },
    pt: { title: 'Ferramentas da Oficina de Luthieria', description: 'Inventário de ferramentas coletivas, localização, estado de conservação e empréstimos', keywords: ['ferramentas luthieria', 'furadeira', 'lixadeira', 'chaves', 'luvas', 'oficina'] }
  }),
  makeSearchItem({
    id: 'luth-varal', poleId: 'lutherie', tabId: 'varal-lutherie',
    fr: { title: 'Varal Lutherie — Guides d’Entretien & Tutoriels', description: 'Fiches illustrées de montage d’alfaia, tressage d’agbê et conseils d’entretien des instruments', keywords: ['varal lutherie', 'tutoriels', 'guides entretien', 'tressage agbe', 'montage alfaia'] },
    pt: { title: 'Varal da Luthieria — Manuais & Tutoriais', description: 'Guias ilustrados de encouramento de alfaia, trama de agbê e conservação dos instrumentos', keywords: ['varal luthieria', 'tutoriais', 'manuais', 'trama agbe', 'encouramento alfaia'] }
  })
];
