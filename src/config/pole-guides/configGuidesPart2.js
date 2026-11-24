import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Configuration — Partie 2 :
 * `config-security`, `config-comms`, `config-modules`.
 */
export const configGuidesPart2 = {
  'config-security': makeGuide({
    fr: {
      title: '🛡️ Badges, Rôles & Matrice de Permissions',
      description: 'Gestion des étiquettes de fonctions, des droits d’accès par pôle et sous-onglet, et du code PIN de secours administratif.',
      steps: [
        'Consultez les principes de gouvernance et créez vos badges métiers (Trésorier, Secrétaire, Régie, Couture).',
        'Configurez ou renouvelez le code PIN de secours réservé aux cas d’urgence administrative.',
        'Cochez dans la matrice RBAC quels badges accèdent à chaque pôle et sous-onglet.'
      ]
    },
    pt: {
      title: '🛡️ Crachás, Funções & Matriz de Permissões',
      description: 'Gestão dos crachás de função, permissões de acesso por polo e aba, e código PIN de acesso administrativo de emergência.',
      steps: [
        'Consulte o guia de governança e crie os crachás da equipe (Tesouraria, Secretaria, Logística, Figurino).',
        'Configure ou renove o código PIN reservado para situações emergenciais da diretoria.',
        'Defina na matriz de acesso quais crachás podem abrir cada polo e sub-aba.'
      ]
    },
    targets: ['config-security-guide', 'config-security-pin', 'config-security-matrix']
  }),

  'config-comms': makeGuide({
    fr: {
      title: '📬 E-mails Transactionnels, Domaine & Relances',
      description: 'Branchement du service d’expédition Brevo, vérification DNS du domaine expéditeur et réglage des rappels automatiques.',
      steps: [
        'Renseignez la clé Brevo et l’adresse d’expéditeur officielle de l’association.',
        'Vérifiez l’authentification DNS du domaine pour garantir la délivrabilité des messages.',
        'Réglez les délais de rappels automatiques avant événement et de retour des tenues.'
      ]
    },
    pt: {
      title: '📬 E-mails Transacionais, Domínio & Lembretes',
      description: 'Conexão do serviço de envio Brevo, verificação DNS do domínio remetente e ajuste dos lembretes automáticos.',
      steps: [
        'Informe a chave Brevo e o endereço de e-mail remetente oficial da associação.',
        'Verifique a autenticação DNS do domínio para assegurar a entrega das mensagens.',
        'Defina os prazos dos lembretes automáticos antes de eventos e de devolução de figurinos.'
      ]
    },
    targets: ['config-comms-email', 'config-comms-dns', 'config-comms-automations']
  }),

  'config-modules': makeGuide({
    fr: {
      title: '🧩 Modules SaaS, Applications O Girador & Apparence',
      description: 'Activation modulaire des pôles d’administration, des onglets membres, du mode vestiaire, des passerelles O Girador et du thème visuel.',
      steps: [
        'Activez ou masquez les pôles métiers du menu d’administration selon l’organisation de votre bureau.',
        'Choisissez quels onglets apparaissent dans l’espace quotidien des adhérents.',
        'Sélectionnez le mode de fonctionnement du Vestiaire Adhérent adapté à votre gestion des costumes.',
        'Configurez les passerelles vers Sequenciador, Cantador et Dançador au sein de la suite O Girador.',
        'Téléversez le blason officiel et choisissez la palette visuelle dans Organizador.'
      ]
    },
    pt: {
      title: '🧩 Módulos SaaS, Aplicativos O Girador & Aparência',
      description: 'Ativação modular dos polos administrativos, abas de membros, modo de figurino, conexões O Girador e identidade visual.',
      steps: [
        'Ative ou oculte os polos de gestão conforme a estrutura da sua diretoria.',
        'Escolha quais abas ficam visíveis no espaço cotidiano dos integrantes.',
        'Defina o modo de funcionamento do Figurino do Membro adequado à sua rotina.',
        'Configure as conexões com Sequenciador, Cantador e Dançador na suíte O Girador.',
        'Envie o brasão oficial e personalize a paleta visual no Organizador.'
      ]
    },
    targets: [
      'config-modules-admin-poles',
      'config-modules-member-tabs',
      'config-modules-wardrobe-mode',
      'config-modules-satellite-apps',
      'config-modules-appearance'
    ]
  })
};
