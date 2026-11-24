import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Gouvernance & Conseil d'Administration :
 * `gouvernance`, `ca-reunions`, `ca-reports` (cibles `reports-*`), `ca-documents`, `ca-finances`, `ca-prestations`.
 */
export const gouvernanceGuides = {
  gouvernance: makeGuide({
    fr: {
      title: '🏛️ Pôle Gouvernance & Conseil d’Administration',
      description: 'Espace délibératif et stratégique réservé aux élus du Conseil d’Administration et du Bureau.',
      steps: [
        'Convoquez les séances de CA et d’AG, structurez l’ordre du jour et publiez les procès-verbaux.',
        'Consolidez les bilans annuels moraux, artistiques et territoriaux pour l’Assemblée Générale.',
        'Supervisez le registre statutaire, la santé financière globale et les engagements de concerts.'
      ]
    },
    pt: {
      title: '🏛️ Polo Governança & Conselho Diretor',
      description: 'Espaço deliberativo e estratégico dedicado aos membros eleitos do Conselho e da Diretoria.',
      steps: [
        'Convoque reuniões do Conselho e AG, estruture a pauta e publique as atas oficiais.',
        'Consolide os balanços anuais institucionais, artísticos e territoriais para a Assembleia Geral.',
        'Supervisione o registro estatutário, a saúde financeira global e os compromissos de apresentações.'
      ]
    }
  }),

  'ca-reunions': makeGuide({
    fr: {
      title: '📝 Réunions, Ordres du Jour & Procès-Verbaux',
      description: 'Planification des séances du CA et de l’AG, saisie des délibérations, collèges de validation et archivage officiel.',
      steps: [
        'Créez une nouvelle séance (Conseil d’Administration, Bureau, AG Ordinaire ou Extraordinaire).',
        'Renseignez l’ordre du jour, les présents et les décisions soumises au vote.',
        'Soumettez le compte-rendu à validation puis archivez le procès-verbal officiel.'
      ]
    },
    pt: {
      title: '📝 Reuniões, Pautas & Atas Oficiais',
      description: 'Planejamento das reuniões do Conselho e da AG, registro de deliberações, validação colegiada e arquivamento.',
      steps: [
        'Crie uma nova sessão (Conselho, Diretoria, Assembleia Ordinária ou Extraordinária).',
        'Registre os pontos de pauta, a lista de presença e as decisões votadas.',
        'Envie o relato para validação e arquive a ata oficial consolidada.'
      ]
    }
  }),

  'ca-reports': makeGuide({
    fr: {
      title: '📊 Bilans Consolidés & Rapports d’Assemblée Générale',
      description: 'Synthèse annuelle des indicateurs associatifs, artistiques, bénévoles (valorisation Cerfa) et financiers prête à projeter ou exporter pour l’AG.',
      steps: [
        'Sélectionnez la saison associative de référence ou la période d’analyse souhaitée.',
        'Examinez les blocs consolidés (adhérents, ancrage territorial, sorties, ateliers, bénévolat et finances).',
        'Lancez la présentation plein écran pour l’AG ou exportez le rapport complet en tableur et PDF.'
      ]
    },
    pt: {
      title: '📊 Balanços Consolidados & Relatórios da Assembleia Geral',
      description: 'Síntese anual dos indicadores associativos, artísticos, horas de voluntariado e finanças pronta para projetar ou exportar na AG.',
      steps: [
        'Selecione a temporada associativa de referência ou o período personalizado de análise.',
        'Analise os blocos consolidados (membros, alcance territorial, apresentações, oficinas, voluntariado e finanças).',
        'Inicie a apresentação em tela cheia para a AG ou exporte o relatório completo em planilha e PDF.'
      ]
    },
    targets: ['reports-period-selector', 'reports-blocks-grid', 'reports-export-actions']
  }),

  'ca-documents': makeGuide({
    fr: {
      title: '📂 Registre Statutaire, Statuts & Actes Officiels',
      description: 'Conservation sécurisée des statuts déposés, du règlement intérieur, des récépissés préfectoraux et des attestations d’assurance.',
      steps: [
        'Vérifiez la version en vigueur des statuts et du règlement intérieur de l’association.',
        'Contrôlez la validité annuelle de l’assurance Responsabilité Civile et des autorisations.',
        'Archivez les récépissés officiels et actes adoptés en Assemblée Générale.'
      ]
    },
    pt: {
      title: '📂 Registro Estatutário, Estatuto & Documentos Oficiais',
      description: 'Guarda segura do estatuto social, regimento interno, certidões públicas e apólices de seguro da associação.',
      steps: [
        'Confira a versão vigente do estatuto social e do regimento interno da associação.',
        'Verifique a validade anual do seguro de responsabilidade civil e das licenças.',
        'Arquive certidões oficiais e documentos aprovados em Assembleia Geral.'
      ]
    }
  }),

  'ca-finances': makeGuide({
    fr: {
      title: '🪙 Synthèse Financière & Santé Budgétaire',
      description: 'Lecture stratégique des soldes bancaires, de la répartition des charges et produits et de l’équilibre d’exploitation de la saison.',
      steps: [
        'Consultez la position consolidée des comptes bancaires et de la trésorerie disponible.',
        'Analysez les grands postes de recettes et de dépenses de l’exercice en cours.',
        'Veillez au respect des orientations budgétaires votées par le Conseil.'
      ]
    },
    pt: {
      title: '🪙 Síntese Financeira & Saúde Orçamentária',
      description: 'Visão estratégica dos saldos bancários, distribuição de receitas e despesas e equilíbrio financeiro da temporada.',
      steps: [
        'Consulte a posição consolidada das contas bancárias e do caixa disponível.',
        'Analise as principais categorias de receitas e despesas do exercício atual.',
        'Acompanhe o cumprimento das diretrizes orçamentárias aprovadas pelo Conselho.'
      ]
    }
  }),

  'ca-prestations': makeGuide({
    fr: {
      title: '🎷 Dates & Engagements Stratégiques de la Troupe',
      description: 'Supervision du carnet d’engagements extérieurs, des devis émis et des contrats signés au nom de l’association.',
      steps: [
        'Passez en revue le calendrier des concerts confirmés et des options en négociation.',
        'Consultez les conditions financières et logistiques engagées auprès des organisateurs.',
        'Veillez à l’adéquation entre les engagements pris et la mobilisation de la troupe.'
      ]
    },
    pt: {
      title: '🎷 Datas & Compromissos Estratégicos da Trupe',
      description: 'Supervisão da agenda de apresentações externas, propostas enviadas e contratos assinados pela associação.',
      steps: [
        'Acompanhe o calendário de shows confirmados e opções em negociação.',
        'Verifique as condições financeiras e logísticas acordadas com os contratantes.',
        'Garanta o equilíbrio entre os compromissos assumidos e a disponibilidade da trupe.'
      ]
    }
  })
};
