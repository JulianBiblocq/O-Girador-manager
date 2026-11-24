import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Logistique, Matériel & Vestiaire.
 */
export const logisticsGuide = makeDoubleViewGuide({
  id: 'logistics',
  poleName: { fr: 'Logistique, Matériel & Vestiaire', pt: 'Logística, Instrumentos & Figurino' },
  title: { fr: '🚚 Pôle Logistique, Parc & Convois', pt: '🚚 Polo Logística, Acervo & Comboios' },
  description: {
    fr: 'Inventaire des instruments, suivi des prêts et cautions, commandes groupées, flotte de covoiturage et malles régie.',
    pt: 'Inventário de instrumentos, controle de empréstimos e cauções, compras coletivas, frota de caronas e malas técnicas.'
  },
  memberGuide: {
    title: { fr: 'Gérer son matériel prêté, sa tenue et ses trajets', pt: 'Gerenciar equipamento emprestado, figurino e viagens' },
    summary: {
      fr: 'Consulte les instruments qui te sont confiés, renseigne tes mensurations et signale tout besoin d’entretien.',
      pt: 'Consulte os instrumentos sob sua guarda, informe suas medidas de figurino e comunique necessidades de reparo.'
    },
    sections: [
      {
        heading: { fr: '1. Mon instrument confié pour la saison', pt: '1. Meu instrumento vinculado na temporada' },
        text: {
          fr: 'Retrouve la référence de ton instrument, son état et ses accessoires, et préviens l’équipe logistique ou lutherie dès qu’une peau ou une corde fatigue.',
          pt: 'Confira o código do seu instrumento, seu estado e acessórios, avisando a equipe de logística ou luthieria se uma pele ou corda precisar de troca.'
        }
      },
      {
        heading: { fr: '2. Mensurations & pièces de costume', pt: '2. Medidas corporais & peças de figurino' },
        text: {
          fr: 'Maintiens tes tailles à jour dans ton espace Vestiaire afin de faciliter l’attribution ou la confection de tes tenues de scène.',
          pt: 'Mantenha suas medidas atualizadas no espaço Figurino para agilizar a entrega ou confecção dos trajes oficiais.'
        }
      },
      {
        heading: { fr: '3. Véhicule & entraide lors des déplacements', pt: '3. Veículo & apoio nos deslocamentos' },
        text: {
          fr: 'Indique les capacités de ton véhicule dans ton profil pour aider la régie à répartir les gros fûts et les passagers lors des concerts.',
          pt: 'Informe a capacidade do seu veículo no perfil para ajudar a logística a distribuir tambores grandes e passageiros nos shows.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Coordonner le parc instrumental, les achats et les convois', pt: 'Coordenar acervo instrumental, compras e comboios' },
    roleBadge: { fr: 'Logistique • Régie • Matériel', pt: 'Logística • Produção Técnica • Acervo' },
    summary: {
      fr: 'Pilotage des 4 onglets Logistique : Parc & Cautions, Commandes groupées, Convois/Véhicules et Malles régie.',
      pt: 'Gestão das 4 abas de Logística: Acervo & Cauções, Compras coletivas, Comboios/Frota e Malas técnicas.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Inventaire du parc & attributions', pt: 'Inventário do acervo & empréstimos' },
        desc: {
          fr: 'Référence chaque instrument avec son numéro, son état d’usure et le membre dépositaire en lien avec le suivi des cautions.',
          pt: 'Cadastre cada instrumento com código, estado de conservação e integrante responsável integrado ao controle de cauções.'
        }
      },
      {
        step: 2,
        title: { fr: 'Commandes groupées & réassorts', pt: 'Compras coletivas & reposição' },
        desc: {
          fr: 'Centralise les besoins en baguettes, mailloches, peaux, protections auditives et accessoires avant validation budgétaire.',
          pt: 'Centralize pedidos de baquetas, maçanetas, peles, protetores auriculares e acessórios antes da aprovação financeira.'
        }
      },
      {
        step: 3,
        title: { fr: 'Flotte de véhicules & capacité de convoi', pt: 'Frota de veículos & capacidade de carga' },
        desc: {
          fr: 'Consulte les véhicules déclarés par les membres et organise la répartition des instruments volumineux pour chaque sortie.',
          pt: 'Consulte os veículos cadastrados pelos integrantes e planeje o transporte dos instrumentos volumosos em cada saída.'
        }
      },
      {
        step: 4,
        title: { fr: 'Malles régie & trousses de secours', pt: 'Malas de produção & kits de primeiros socorros' },
        desc: {
          fr: 'Vérifie le contenu des malles collectives (outillage scène, pharmacie, bouchons, maquillage) avant le départ en prestation.',
          pt: 'Confira os itens das malas coletivas (ferramentas de palco, farmácia, protetores, maquiagem) antes de cada apresentação.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_inventaire_instruments', label: { fr: 'Gérer l’inventaire, les prêts et les cautions', pt: 'Gerenciar inventário, empréstimos e cauções' } },
      { id: 'tuto_malles_et_convois', label: { fr: 'Préparer les malles régie et les convois', pt: 'Preparar malas técnicas e comboios' } }
    ]
  }
});
