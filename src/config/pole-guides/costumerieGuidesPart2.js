import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Costumerie — Partie 2 :
 * `wardrobe-supplies`, `wardrobe-tools`, `wardrobe-sizes`, `varal-costumerie`.
 */
export const costumerieGuidesPart2 = {
  'wardrobe-supplies': makeGuide({
    fr: {
      title: '🧵 Tissus, Rubans & Mercerie',
      description: 'Gestion des rouleaux de tissus (métrage et laize), fils, élastiques, galons, perles et fermetures de l’atelier couture.',
      steps: [
        'Enregistrez vos coupons et rouleaux avec leur coloris, laize et métrage restant.',
        'Contrôlez les stocks de mercerie avant de lancer une nouvelle série de costumes.',
        'Signalez les réassorts nécessaires pour préparer les achats groupés.'
      ]
    },
    pt: {
      title: '🧵 Tecidos, Fitas & Aviamentos',
      description: 'Gestão dos rolos de tecido (metragem e largura), linhas, elásticos, galões, pedrarias e fechos do ateliê.',
      steps: [
        'Cadastre tecidos e retalhos informando cor, largura e metragem disponível.',
        'Verifique o estoque de aviamentos antes de iniciar uma nova leva de figurinos.',
        'Sinalize necessidades de reposição para planejar as compras da oficina.'
      ]
    }
  }),

  'wardrobe-tools': makeGuide({
    fr: {
      title: '✂️ Machines à Coudre & Matériel Couture',
      description: 'Suivi des machines familiales ou industrielles, surjeteuses, fers vapeur, mannequins et ciseaux de coupe.',
      steps: [
        'Inventoriez les machines résidentes au local et celles prêtées ponctuellement en atelier.',
        'Notez les aiguilles, canettes compatibles et dates de révision mécanique.',
        'Préparez la trousse couture d’urgence à glisser dans les malles régie des concerts.'
      ]
    },
    pt: {
      title: '✂️ Máquinas de Costura & Equipamentos',
      description: 'Controle de máquinas domésticas ou industriais, overloques, ferros a vapor, manequins e tesouras de corte.',
      steps: [
        'Inventarie as máquinas fixas do ateliê e aquelas emprestadas para os mutirões.',
        'Anote agulhas, bobinas compatíveis e histórico de manutenção mecânica.',
        'Prepare o kit de costura de emergência integrado às malas técnicas de show.'
      ]
    }
  }),

  'wardrobe-sizes': makeGuide({
    fr: {
      title: '📏 Registre des Tailles & Mensurations',
      description: 'Tableau récapitulatif des gabarits et mensurations des membres pour tailler et répartir les tenues avec justesse.',
      steps: [
        'Consultez les mensurations saisies par les adhérents sur leur profil vestiaire.',
        'Repérez les profils incomplets afin d’organiser une prise de mesures en répétition.',
        'Croisez la répartition des tailles avec votre stock physique pour anticiper les confections.'
      ]
    },
    pt: {
      title: '📏 Tabela de Tamanhos & Medidas Corporais',
      description: 'Painel consolidado das medidas dos integrantes para cortar, ajustar e distribuir os figurinos com precisão.',
      steps: [
        'Consulte as medidas preenchidas pelos membros em seu espaço de figurino.',
        'Identifique perfis incompletos para organizar a tomada de medidas no ensaio.',
        'Cruze a grade de tamanhos com o estoque físico para planejar novas confecções.'
      ]
    }
  }),

  'varal-costumerie': makeGuide({
    fr: {
      title: '🪡 Varal Costumerie, Patrons & Entretien',
      description: 'Espace documentaire regroupant les planches de coupe PDF, guides de broderie/ornementation et consignes de lavage.',
      steps: [
        'Déposez les patrons PDF gradués par taille et les schémas de montage illustrés.',
        'Détaillez les consignes de lavage, repassage et rangement des étoffes fragiles.',
        'Rendez les tutoriels accessibles aux membres autonomes dans « Mon Atelier ».'
      ]
    },
    pt: {
      title: '🪡 Varal de Figurino, Moldes & Conservação',
      description: 'Acervo documental reunindo moldes em PDF, guias de bordado/adereços e instruções de lavagem dos trajes.',
      steps: [
        'Publique os moldes em PDF graduados por tamanho e os esquemas ilustrados de costura.',
        'Detalhe as orientações de lavagem, passadoria e guarda de tecidos delicados.',
        'Disponibilize os tutoriais aos integrantes no espaço « Minha Oficina ».'
      ]
    }
  })
};
