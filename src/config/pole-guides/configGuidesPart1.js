import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Configuration — Partie 1 :
 * `config`, `config-identity`, `config-profile`, `config-agenda`.
 */
export const configGuidesPart1 = {
  config: makeGuide({
    fr: {
      title: '⚙️ Pôle Configuration de l’Association',
      description: 'Paramétrage général dans Organizador : identité juridique, formulaire d’inscription et pupitres, agenda et lieux, sécurité RBAC, e-mails et modules.',
      steps: [
        'Renseignez l’identité légale, le Bureau et la nomenclature des pupitres de la troupe.',
        'Paramétrez les salles habituelles, types d’événements, rôles de sécurité et notifications.',
        'Activez sur mesure les pôles métiers, les applications O Girador et l’identité visuelle.'
      ]
    },
    pt: {
      title: '⚙️ Polo Configuração da Associação',
      description: 'Configuração geral no Organizador: identidade jurídica, ficha de inscrição e naipes, agenda e locais, segurança RBAC, e-mails e módulos.',
      steps: [
        'Preencha os dados legais, a Diretoria e a nomenclatura dos naipes do grupo.',
        'Configure locais habituais, tipos de eventos, crachás de permissão e notificações.',
        'Ative sob medida os polos de gestão, os aplicativos O Girador e a identidade visual.'
      ]
    }
  }),

  'config-identity': makeGuide({
    fr: {
      title: '🏛️ Identité Légale, Signatures & Bureau',
      description: 'Informations statutaires officielles (raison sociale, siège, SIRET/RNA), signatures numérisées pour les reçus et composition du Bureau.',
      steps: [
        'Complétez la dénomination officielle, le numéro d’immatriculation et l’adresse du siège social.',
        'Importez les signatures officielles utilisées sur les attestations, devis et reçus.',
        'Renseignez la composition actuelle du Bureau et de la Direction artistique.'
      ]
    },
    pt: {
      title: '🏛️ Identidade Legal, Assinaturas & Diretoria',
      description: 'Dados estatutários oficiais (razão social, sede, registro), assinaturas digitalizadas para recibos e composição da Diretoria.',
      steps: [
        'Preencha a razão social oficial, o registro jurídico e o endereço da sede.',
        'Envie as assinaturas oficiais utilizadas em declarações, orçamentos e recibos.',
        'Atualize a composição vigente da Diretoria e da Direção artística.'
      ]
    },
    targets: ['config-identity-legal', 'config-identity-signatures', 'config-identity-bureau']
  }),

  'config-profile': makeGuide({
    fr: {
      title: '👥 Inscription, Champs Personnalisés & Pupitres',
      description: 'Configuration de l’accueil des nouveaux membres, des questions sur mesure, des cycles annuels et de la nomenclature des pupitres.',
      steps: [
        'Activez ou rendez obligatoires les champs standards du formulaire d’inscription.',
        'Créez vos questions personnalisées propres au fonctionnement de votre association.',
        'Choisissez votre univers musical et adaptez les noms et couleurs des pupitres du Batuque et de la danse.'
      ]
    },
    pt: {
      title: '👥 Inscrição, Campos Personalizados & Naipes',
      description: 'Configuração do formulário de entrada de membros, perguntas sob medida, ciclos anuais e nomenclatura dos naipes.',
      steps: [
        'Ative ou torne obrigatórios os campos padrão da ficha de inscrição.',
        'Crie perguntas personalizadas específicas para a realidade da sua associação.',
        'Escolha seu universo musical e personalize nomes e cores dos naipes do Batuque e da dança.'
      ]
    },
    targets: ['config-profile-form-accordion', 'config-profile-custom-fields', 'config-profile-pupitres']
  }),

  'config-agenda': makeGuide({
    fr: {
      title: '📅 Agenda, Lieux Habituels & Formats d’Événements',
      description: 'Répertoire des salles de répétition avec coordonnées GPS, préréglages par type d’événement et options transversales de l’Agenda.',
      steps: [
        'Enregistrez vos salles et lieux habituels avec adresse GPS pour accélérer la création des dates.',
        'Personnalisez les types d’événements (horaires par défaut, feuille de route, covoiturage, programme).',
        'Ajustez les options générales d’inscription RSVP et l’étiquette destinataire des questions logistiques.'
      ]
    },
    pt: {
      title: '📅 Agenda, Locais Habituais & Tipos de Eventos',
      description: 'Cadastro de salas de ensaio com localização GPS, predefinições por formato de evento e opções globais da Programação.',
      steps: [
        'Cadastre salas e locais habituais com endereço GPS para agilizar a criação de datas.',
        'Personalize os tipos de evento (horários padrão, roteiro, carona solidária, repertório).',
        'Ajuste as opções globais de confirmação RSVP e o crachá que recebe dúvidas logísticas.'
      ]
    },
    targets: ['config-agenda-lieux', 'config-agenda-types', 'config-agenda-options']
  })
};
