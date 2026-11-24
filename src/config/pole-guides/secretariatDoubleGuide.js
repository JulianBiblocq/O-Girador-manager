import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Secrétariat & Vie Administrative
 * aligné sur ses 4 onglets actuels (`export-annu`, `studio-events`, `varal-secretariat`, `secretariat-documents`).
 */
export const secretariatGuide = makeDoubleViewGuide({
  id: 'secretariat',
  poleName: { fr: 'Secrétariat & Vie Statutaire', pt: 'Secretaria & Vida Institucional' },
  title: { fr: '🏛️ Pôle Secrétariat & Administration', pt: '🏛️ Polo Secretaria & Administração' },
  description: {
    fr: 'Gestion de l’annuaire des adhérents, du registre des dates, des documents officiels et des chartes, consentements santé et liens partagés.',
    pt: 'Gestão do cadastro de integrantes, registro de datas, documentos oficiais e termos de compromisso, saúde e links compartilhados.'
  },
  memberGuide: {
    title: { fr: 'Consulter ses documents administratifs et ses consentements', pt: 'Consultar documentos administrativos e autorizações' },
    summary: {
      fr: 'Accède aux statuts et chartes du groupe, télécharge tes attestations et gère tes préférences de confidentialité.',
      pt: 'Acesse estatuto e termos da trupe, baixe declarações de filiação e configure suas preferências de privacidade.'
    },
    sections: [
      {
        heading: { fr: '1. Statuts, règlement & chartes associatives', pt: '1. Estatuto, regimento & termos da associação' },
        text: {
          fr: 'Consulte à tout moment les statuts à jour, le règlement intérieur et les chartes de vie associative mis à disposition par le secrétariat.',
          pt: 'Consulte a qualquer momento o estatuto atualizado, o regimento interno e os termos de convivência disponibilizados pela secretaria.'
        }
      },
      {
        heading: { fr: '2. Attestations d’adhésion & justificatifs', pt: '2. Declarações de filiação & comprovantes' },
        text: {
          fr: 'Récupère ton attestation annuelle d’adhésion pour ton employeur, ton comité d’entreprise ou tes aides aux pratiques culturelles.',
          pt: 'Baixe sua declaração anual de vínculo associativo para comprovação institucional ou benefícios culturais.'
        }
      },
      {
        heading: { fr: '3. Confidentialité, droit à l’image & aptitude santé', pt: '3. Privacidade, direito de imagem & aptidão física' },
        text: {
          fr: 'Contrôle la visibilité de tes coordonnées dans le trombinoscope et mets à jour tes consentements RGPD, droit à l’image et questionnaire de santé.',
          pt: 'Controle a visibilidade dos seus contatos na lista do grupo e atualize suas autorizações de direito de imagem e declaração de saúde.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Piloter l’annuaire, le registre des dates et les chartes', pt: 'Gerenciar cadastro, agenda geral e termos oficiais' },
    roleBadge: { fr: 'Secrétariat • Bureau • Conseil d’Administration', pt: 'Secretaria • Diretoria • Conselho' },
    summary: {
      fr: 'Organisation opérationnelle autour des 4 onglets du Secrétariat : Annuaire, Registre des dates, Documents officiels et Chartes/Liens.',
      pt: 'Rotina operacional estruturada nas 4 abas da Secretaria: Cadastro, Registro de datas, Documentos oficiais e Termos/Links.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Annuaire adhérents & exports administratifs', pt: 'Cadastro de membros & exportações administrativas' },
        desc: {
          fr: 'Dans « Annuaire & Exports », valide les fiches des membres, vérifie les pupitres et badges attribués, et exporte les listes CSV/Excel pour les assurances ou mairies.',
          pt: 'Em « Cadastro & Exportações », valide fichas de integrantes, confira naipes e crachás atribuídos e exporte planilhas CSV/Excel para seguros ou órgãos públicos.'
        }
      },
      {
        step: 2,
        title: { fr: 'Registre des dates & convocations', pt: 'Registro de datas & convocações' },
        desc: {
          fr: 'Dans « Registre des dates », planifie les répétitions, ateliers, concerts et réunions, puis suis l’état des présences et relances.',
          pt: 'Em « Registro de datas », agende ensaios, oficinas, apresentações e reuniões, acompanhando confirmações de presença e lembretes.'
        }
      },
      {
        step: 3,
        title: { fr: 'Documents officiels & procès-verbaux', pt: 'Documentos oficiais & atas' },
        desc: {
          fr: 'Dans « Documents officiels », classe les actes permanents (statuts, assurances, récépissés) et les procès-verbaux validés avec filtrage par badge.',
          pt: 'Em « Documentos oficiais », arquive documentos permanentes (estatuto, seguros, certidões) e atas aprovadas com controle de acesso por crachá.'
        }
      },
      {
        step: 4,
        title: { fr: 'Chartes, Santé & Liens Cloud partagés', pt: 'Termos, Saúde & Links Cloud compartilhados' },
        desc: {
          fr: 'Dans « Chartes, Santé & Liens », mets à jour les modèles de droit à l’image et d’aptitude médicale, et configure les espaces externes de dépôt photo.',
          pt: 'Em « Termos, Saúde & Links », atualize modelos de direito de imagem e aptidão médica, e configure os links externos de envio de fotos.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_gestion_annuaire_exports', label: { fr: 'Valider les membres et exporter l’annuaire', pt: 'Validar membros e exportar listagens' } },
      { id: 'tuto_chartes_et_documents_officiels', label: { fr: 'Classer les actes officiels et les chartes', pt: 'Organizar documentos oficiais e termos' } }
    ]
  }
});
