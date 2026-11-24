import { makeGuide } from './guideHelpers.js';

/** Guides bilingues (FR / PT-BR) des onglets du Secrétariat et du Pôle Diffusion (< 120 lignes). */
export const secretariatAndDiffusionGuides = {
  'export-annu': makeGuide({
    fr: {
      title: '📄 Annuaire Adhérents & Exports Administratifs',
      description: 'Registre central des membres actifs et archivés avec filtres multicritères, édition rapide des fiches et exports tableur.',
      steps: ['Filtrez les membres par statut d’adhésion, pupitre, niveau ou badge de rôle.', 'Ouvrez une fiche pour compléter ses coordonnées, son pupitre ou ses justificatifs.', 'Exportez la sélection en CSV ou Excel pour vos démarches d’assurance et de préfecture.']
    },
    pt: {
      title: '📄 Cadastro de Integrantes & Exportações',
      description: 'Registro central de membros ativos e arquivados com filtros combinados, edição rápida de fichas e exportação em planilha.',
      steps: ['Filtre integrantes por status de adesão, naipe, nível ou crachá de função.', 'Abra uma ficha para atualizar contatos, naipe atribuído ou comprovantes.', 'Exporte a seleção em CSV ou Excel para seguros e formalidades administrativas.']
    }
  }),
  'studio-events': makeGuide({
    fr: {
      title: '📅 Registre des Dates & Convocations',
      description: 'Vue tabulaire et chronologique de toutes les dates de la saison pour piloter les convocations, sondages d’ateliers et feuilles de route.',
      steps: ['Programmez une répétition, une prestation, un sondage d’atelier ou une réunion.', 'Contrôlez d’un coup d’œil le taux de réponse et l’équilibre des pupitres inscrits.', 'Ouvrez une date pour relancer les retardataires ou ajuster sa feuille de route.']
    },
    pt: {
      title: '📅 Registro de Datas & Convocações',
      description: 'Visão cronológica de todos os eventos da temporada para coordenar convocações, enquetes de oficinas e roteiros.',
      steps: ['Agende um ensaio, apresentação, enquete de oficina ou reunião.', 'Acompanhe rapidamente a taxa de confirmação e o equilíbrio dos naipes inscritos.', 'Abra qualquer data para enviar lembretes ou ajustar o roteiro completo.']
    }
  }),
  'varal-secretariat': makeGuide({
    fr: {
      title: '🗂️ Documents Officiels & Procès-Verbaux',
      description: 'Classement structuré des actes administratifs permanents de l’association et des comptes-rendus officiels de réunions.',
      steps: ['Consultez et mettez à jour la table des actes permanents (statuts, assurances, récépissés).', 'Archivez et partagez les procès-verbaux de réunions et d’Assemblées Générales selon les badges.']
    },
    pt: {
      title: '🗂️ Documentos Oficiais & Atas',
      description: 'Arquivamento estruturado dos documentos institucionais permanentes da associação e das atas oficiais de reuniões.',
      steps: ['Consulte e atualize a tabela de documentos permanentes (estatuto, apólices, certidões).', 'Arquive e compartilhe atas de reuniões e Assembleias Gerais conforme os crachás de acesso.']
    },
    targets: ['sec-docs-permanent-table', 'sec-docs-reunions-table']
  }),
  'secretariat-documents': makeGuide({
    fr: {
      title: '📁 Chartes, Santé & Liens Cloud Partagés',
      description: 'Paramétrage des documents d’adhésion obligatoires (droit à l’image, aptitude médicale) et des espaces Cloud externes de collecte photo.',
      steps: ['Basculez entre l’onglet des Chartes & Santé et celui des Liens de stockage partagés.', 'Téléversez vos formulaires officiels RGPD/santé ou renseignez vos liens Dropbox, Framaspace ou Drive.', 'Enregistrez vos modifications pour mettre immédiatement à jour l’inscription et les QR codes d’événements.']
    },
    pt: {
      title: '📁 Termos, Saúde & Links Cloud Compartilhados',
      description: 'Configuração dos documentos de inscrição (direito de imagem, aptidão médica) e dos espaços externos de envio de fotos.',
      steps: ['Alterne entre a aba de Termos & Saúde e a aba de Links de armazenamento compartilhado.', 'Envie os modelos oficiais de imagem/saúde ou informe seus links Dropbox, Framaspace ou Drive.', 'Salve as alterações para atualizar imediatamente o formulário de adesão e os QR codes dos eventos.']
    },
    targets: ['sec-resources-tabs', 'sec-resources-content', 'sec-resources-save']
  }),
  diffusion: makeGuide({
    fr: {
      title: '🎷 Pôle Diffusion & Relations Organisateurs',
      description: 'Prospection commerciale, suivi des opportunités de spectacles, carnet CRM des programmateurs et édition des devis.',
      steps: ['Suivez chaque demande de prestation de la prise de contact jusqu’au concert réglé.', 'Centralisez votre carnet CRM d’organisateurs, festivals et collectivités.', 'Générez les devis officiels et convertissez les options confirmées vers l’Agenda.']
    },
    pt: {
      title: '🎷 Polo Difusão & Contratação de Shows',
      description: 'Prospecção cultural, acompanhamento de propostas de apresentações, carteira CRM de produtores e emissão de orçamentos.',
      steps: ['Acompanhe cada proposta de show desde o primeiro contato até o cachê quitado.', 'Centralize sua carteira CRM de produtores, festivais e secretarias de cultura.', 'Gere orçamentos oficiais e converta datas confirmadas diretamente para a Programação.']
    }
  }),
  'gigs-pipeline': makeGuide({
    fr: {
      title: '📊 Prestations (Kanban, Devis) & Contacts CRM',
      description: 'Espace unifié regroupant le pipeline Kanban des engagements, l’édition de devis/factures et le carnet relationnel des diffuseurs.',
      steps: ['Basculez entre le suivi des Prestations et le Carnet de Contacts CRM des programmateurs.', 'Créez un nouveau dossier d’engagement avec cachet visé, effectif requis et date de relance.', 'Faites progresser vos dossiers sur le tableau Kanban (contact, devis, option, contrat signé, facturé).']
    },
    pt: {
      title: '📊 Apresentações (Kanban, Orçamentos) & Contatos CRM',
      description: 'Espaço unificado reunindo o quadro Kanban de propostas, emissão de orçamentos/faturas e o cadastro CRM de contratantes.',
      steps: ['Alterne entre o acompanhamento de Apresentações e a Carteira de Contatos CRM.', 'Crie um novo processo de contratação com cachê estimado, efetivo necessário e data de retorno.', 'Avance cada proposta no quadro Kanban (contato inicial, orçamento, opção, contrato assinado, pago).']
    },
    targets: ['gigs-crm-tabs', 'gigs-add-button', 'gigs-kanban-board']
  }),
  'diffusion-contacts': makeGuide({
    fr: {
      title: '📇 Carnet CRM des Organisateurs & Diffuseurs',
      description: 'Répertoire qualifié des programmateurs, festivals, mairies et partenaires culturels.',
      steps: ['Ajoutez une nouvelle fiche contact d’organisateur ou de structure culturelle.', 'Filtrez votre carnet par type de structure, ville ou statut de prospection.', 'Consultez l’historique des échanges et prestations rattachées dans le tableau.']
    },
    pt: {
      title: '📇 Carteira CRM de Produtores & Contratantes',
      description: 'Cadastro qualificado de curadores, festivais, prefeituras e parceiros culturais.',
      steps: ['Adicione um novo contato de produtor ou instituição cultural.', 'Filtre sua carteira por categoria, cidade ou estágio de prospecção.', 'Consulte o histórico de contatos e apresentações vinculadas na tabela.']
    },
    targets: ['contacts-add-button', 'contacts-filter-bar', 'contacts-table']
  })
};
