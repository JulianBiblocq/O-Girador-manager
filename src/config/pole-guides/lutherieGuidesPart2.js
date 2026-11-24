import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Lutherie — Partie 2 :
 * `inventory-supplies`, `workshop-tools`, `varal-lutherie`.
 */
export const lutherieGuidesPart2 = {
  'inventory-supplies': makeGuide({
    fr: {
      title: '🪵 Matières Premières & Consommables d’Atelier',
      description: 'Suivi en quantité, métrage ou poids des peaux brutes, bobines de corde, perles, bois, colles et vernis.',
      steps: [
        'Surveillez les jauges de stock et les alertes de seuil critique.',
        'Déduisez les matières consommées à l’issue de chaque atelier collectif.',
        'Préparez une demande de réassort vers le pôle Logistique avant rupture.'
      ]
    },
    pt: {
      title: '🪵 Matérias-Primas & Insumos de Oficina',
      description: 'Controle por unidade, metragem ou peso de peles cruas, rolos de corda, contas, madeira, colas e vernizes.',
      steps: [
        'Monitore os níveis de estoque e os alertas de quantidade mínima.',
        'Atualize os insumos consumidos ao final de cada mutirão de luthieria.',
        'Solicite reposição junto ao polo de Logística antes de faltar material.'
      ]
    }
  }),

  'workshop-tools': makeGuide({
    fr: {
      title: '🧰 Parc d’Outillage Lutherie',
      description: 'Inventaire des machines fixes, serre-joints, ponceuses et outils à main, distinguant l’outillage d’atelier et le matériel mobile.',
      steps: [
        'Répertoriez chaque machine ou outil avec son lieu de rangement et son référent.',
        'Indiquez si l’outil reste au local ou peut partir en mallette de réparation sur les concerts.',
        'Consignez l’état d’usure (lames, abrasifs, entretien) pour garantir la sécurité.'
      ]
    },
    pt: {
      title: '🧰 Ferramentas & Equipamentos de Luthieria',
      description: 'Inventário de máquinas fixas, sargentos, lixadeiras e ferramentas manuais, separando itens da sede e ferramentas móveis.',
      steps: [
        'Cadastre cada máquina ou ferramenta com seu local de guarda e responsável.',
        'Indique se a ferramenta permanece na oficina ou pode viajar na mala técnica.',
        'Registre desgastes (lâminas, lixas, revisão) para garantir a segurança nos mutirões.'
      ]
    }
  }),

  'varal-lutherie': makeGuide({
    fr: {
      title: '📜 Varal Lutherie & Tutoriels de Fabrication',
      description: 'Bibliothèque illustrée des fiches d’atelier : montage de peaux, cordage d’alfaia, tressage d’agbê et consignes de sécurité.',
      steps: [
        'Rédigez et classez les tutoriels pas à pas par famille d’instrument.',
        'Précisez les outils, fournitures et temps estimés nécessaires pour chaque étape.',
        'Mettez ces guides à disposition des membres dans leur espace « Mon Atelier ».'
      ]
    },
    pt: {
      title: '📜 Varal de Luthieria & Tutoriais Técnicos',
      description: 'Biblioteca ilustrada de guias práticos: encouramento, encordoamento de alfaia, trançado de xequerê e normas de segurança.',
      steps: [
        'Elabore e organize os tutoriais passo a passo por família de instrumento.',
        'Liste ferramentas, materiais e tempo estimado necessários em cada etapa.',
        'Disponibilize esses guias aos integrantes no espaço « Minha Oficina ».'
      ]
    }
  })
};
