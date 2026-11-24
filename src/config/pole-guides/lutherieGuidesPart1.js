import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Lutherie — Partie 1 (< 105 lignes).
 */
export const lutherieGuidesPart1 = {
  lutherie: makeGuide({
    fr: {
      title: '🎻 Pôle Lutherie & Artisanat Instrumental',
      description: 'Atelier de fabrication, d’entretien et de traçabilité des instruments de la troupe (fûts, cerclages, peaux, cordages et calebasses).',
      steps: [
        'Définissez les modèles techniques et plans de fabrication de chaque famille d’instrument.',
        'Suivez l’usinage des pièces détachées et le niveau des matières premières en stock.',
        'Assemblez les instruments sur l’établi jusqu’au baptême et à l’entrée dans le parc actif.'
      ]
    },
    pt: {
      title: '🎻 Polo Luthieria & Artesanato Instrumental',
      description: 'Oficina de construção, manutenção e rastreabilidade dos instrumentos da trupe (corpos, aros, peles, cordas e cabaças).',
      steps: [
        'Defina os modelos técnicos e plantas de fabricação de cada família de instrumento.',
        'Acompanhe o preparo das peças avulsas e o estoque de matérias-primas da oficina.',
        'Monte os instrumentos na bancada até o batismo e a entrada no acervo ativo.'
      ]
    }
  }),

  'inventory-projects': makeGuide({
    fr: {
      title: '🔨 Établi d’Assemblage & Chantiers Lutherie',
      description: 'Suivi en direct des chantiers de montage d’instruments à partir des pièces détachées validées en atelier.',
      steps: [
        'Ouvrez un nouveau chantier d’assemblage à partir d’un modèle d’instrument officiel.',
        'Affectez sur chaque emplacement les pièces détachées requises disponibles en stock.',
        'Contrôlez le montage complet puis finalisez et baptisez l’instrument pour l’intégrer au parc.'
      ]
    },
    pt: {
      title: '🔨 Bancada de Montagem & Projetos de Luthieria',
      description: 'Acompanhamento em tempo real da montagem de instrumentos a partir das peças prontas na oficina.',
      steps: [
        'Inicie um novo projeto de montagem a partir de um modelo oficial de instrumento.',
        'Vincule em cada posição as peças avulsas necessárias disponíveis no estoque.',
        'Confira a montagem final e batize o instrumento para integrá-lo ao acervo da trupe.'
      ]
    },
    targets: ['lutherie-new-project-btn', 'lutherie-project-slots', 'lutherie-finalize-btn']
  }),

  'instrument-models': makeGuide({
    fr: {
      title: '📐 Modèles d’Instruments & Plans de Fabrication',
      description: 'Référentiel technique définissant pour chaque instrument la nomenclature des pièces, les étapes d’usinage et les fiches associées.',
      steps: [
        'Parcourez la grille des modèles d’instruments (alfaias, caixas, agbês, gonguês, atabaques) et créez de nouveaux gabarits.',
        'Dépliez le plan technique d’un modèle pour configurer ses composants requis et ses étapes.',
        'Importez ou exportez un pack modèle complet depuis la grille pour mutualiser vos plans.'
      ]
    },
    pt: {
      title: '📐 Modelos de Instrumentos & Plantas Técnicas',
      description: 'Catálogo técnico definindo para cada instrumento a lista de componentes, etapas de preparo e tutoriais vinculados.',
      steps: [
        'Navegue pela grade de modelos de instrumentos (alfaias, caixas, agbês, gonguês, atabaques) e crie novos padrões.',
        'Abra a planta técnica de um modelo para configurar suas peças obrigatórias e etapas.',
        'Importe ou exporte um pacote completo na grade para compartilhar seus modelos.'
      ]
    },
    targets: ['lutherie-models-grid', 'lutherie-model-blueprint', 'lutherie-models-grid']
  }),

  'inventory-parts': makeGuide({
    fr: {
      title: '⚙️ Stock des Pièces Détachées',
      description: 'Traçabilité unitaire des fûts, aros, peaux montées et filets en cours de façonnage ou prêts pour l’assemblage.',
      steps: [
        'Enregistrez une nouvelle pièce détachée issue d’une séance d’atelier.',
        'Suivez son avancement dans le tableau et validez sa conformité technique.',
        'Filtrez les pièces par type, diamètre ou disponibilité pour alimenter l’établi.'
      ]
    },
    pt: {
      title: '⚙️ Estoque de Peças Avulsas',
      description: 'Rastreamento individual de corpos, aros, peles preparadas e redes em fase de acabamento ou prontos para montagem.',
      steps: [
        'Cadastre uma nova peça avulsa produzida durante um mutirão de oficina.',
        'Acompanhe o progresso na tabela e valide sua qualidade técnica.',
        'Filtre as peças por categoria, polegada ou disponibilidade para abastecer a bancada.'
      ]
    },
    targets: ['lutherie-new-part-btn', 'lutherie-parts-table', 'lutherie-parts-filters']
  })
};
