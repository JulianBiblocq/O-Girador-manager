import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Trésorerie & Finances.
 */
export const treasuryGuide = makeDoubleViewGuide({
  id: 'treasury',
  poleName: { fr: 'Trésorerie & Finances', pt: 'Tesouraria & Finanças' },
  title: { fr: '💰 Pôle Trésorerie & Finances', pt: '💰 Polo Tesouraria & Finanças' },
  description: {
    fr: 'Pilotez la santé financière de l’association, suivez les cotisations et cautions, remboursez les frais et éditez les bilans comptables.',
    pt: 'Gerencie a saúde financeira da associação, acompanhe anuidades e cauções, reembolse despesas e gere balanços contábeis.'
  },
  memberGuide: {
    title: { fr: 'Suivre mes cotisations, cautions et remboursements', pt: 'Acompanhar anuidades, cauções e reembolsos' },
    summary: {
      fr: 'Vérifie le statut de ton adhésion, le suivi de ta caution d’instrument et dépose tes justificatifs de frais.',
      pt: 'Confira a situação da sua anuidade, o status da caução de instrumento e envie seus comprovantes de despesas.'
    },
    sections: [
      {
        heading: { fr: '1. Mon adhésion & mes formules', pt: '1. Minha anuidade & modalidades' },
        text: {
          fr: 'Consulte tes formules choisies pour la saison et régularise ton adhésion en ligne ou auprès du trésorier si un solde reste en attente.',
          pt: 'Confira as opções escolhidas na temporada e regularize sua inscrição online ou junto à tesouraria caso haja pendência.'
        }
      },
      {
        heading: { fr: '2. Caution d’instrument prêté', pt: '2. Caução de instrumento emprestado' },
        text: {
          fr: 'Si un instrument du parc associatif t’est confié, vérifie que ta caution est bien pointée comme « Reçue » sur ta fiche.',
          pt: 'Caso utilize um instrumento do acervo do grupo, verifique se sua caução já consta como « Recebida » em seu perfil.'
        }
      },
      {
        heading: { fr: '3. Notes de frais & achats avancés', pt: '3. Solicitação de reembolso de compras' },
        text: {
          fr: 'Déclare un achat avancé pour la troupe avec photo ou PDF du ticket, et choisis entre remboursement par virement ou avoir sur cotisation.',
          pt: 'Registre uma compra feita para a trupe anexando foto ou PDF do recibo e escolha entre reembolso bancário ou crédito na anuidade.'
        }
      },
      {
        heading: { fr: '4. Frais kilométriques & dons bénévoles', pt: '4. Quilometragem de carona & doação voluntária' },
        text: {
          fr: 'Suis le calcul kilométrique de tes trajets conducteurs lors des sorties et choisis le remboursement ou l’abandon de frais bénévole.',
          pt: 'Acompanhe o cálculo de quilometragem das viagens em que dirigiu e opte entre reembolso ou renúncia solidária.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Piloter la comptabilité et les flux financiers', pt: 'Coordenar a contabilidade e o fluxo financeiro' },
    roleBadge: { fr: 'Trésorerie • Comptabilité • Bureau', pt: 'Tesouraria • Contabilidade • Diretoria' },
    summary: {
      fr: 'Supervision des comptes bancaires, pointage des cotisations/cautions, analytique par événement, liquidation des frais et exports AG.',
      pt: 'Supervisão das contas bancárias, conciliação de anuidades/cauções, resultado por evento, reembolsos e relatórios para a AG.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Synthèse bancaire & équilibre d’exploitation', pt: 'Síntese bancária & resultado operacional' },
        desc: {
          fr: 'Mets à jour les soldes des comptes (courant, livret, caisse) et surveille l’évolution des recettes et charges de la saison.',
          pt: 'Atualize os saldos das contas (corrente, reserva, caixa físico) e monitore receitas e despesas da temporada.'
        }
      },
      {
        step: 2,
        title: { fr: 'Cotisations, passerelles en ligne & cautions', pt: 'Anuidades, pagamentos online & cauções' },
        desc: {
          fr: 'Pointe les règlements reçus (HelloAsso, virement, chèque), gère les exonérations et contrôle les cautions d’instruments.',
          pt: 'Concilie os pagamentos recebidos, gerencie isenções e controle as cauções vinculadas aos instrumentos emprestados.'
        }
      },
      {
        step: 3,
        title: { fr: 'Rentabilité analytique des événements', pt: 'Resultado financeiro por evento' },
        desc: {
          fr: 'Rattache cachets, frais de route et dépenses de régie à chaque concert ou stage pour connaître son bilan net réel.',
          pt: 'Vincule cachês, custos de transporte e alimentação a cada apresentação ou oficina para apurar seu saldo líquido.'
        }
      },
      {
        step: 4,
        title: { fr: 'Journal des opérations courantes', pt: 'Livro de operações diversas' },
        desc: {
          fr: 'Saisis les écritures de fonctionnement (loyer, assurance, achats d’atelier) avec leur catégorie comptable et pièce justificative.',
          pt: 'Lance receitas e despesas de manutenção (aluguel, seguro, insumos) com categoria contábil e comprovante anexado.'
        }
      },
      {
        step: 5,
        title: { fr: 'Validation des notes de frais & kilométrage', pt: 'Aprovação de despesas & quilometragem' },
        desc: {
          fr: 'Vérifie les justificatifs soumis par les membres, copie l’IBAN pour le virement et marque « Remboursé » pour générer l’écriture.',
          pt: 'Confira os recibos enviados pelos membros, realize a transferência bancária e marque « Reembolsado » para gerar o lançamento.'
        }
      },
      {
        step: 6,
        title: { fr: 'Clôture de saison & exports pour l’AG', pt: 'Fechamento de exercício & exportações da AG' },
        desc: {
          fr: 'Filtre par exercice comptable et exporte le Grand Livre et le compte de résultat en CSV/PDF pour l’Assemblée Générale.',
          pt: 'Filtre pelo exercício contábil e exporte o livro-caixa e o demonstrativo de resultados em CSV/PDF para a Assembleia Geral.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_pointage_cotisations_cautions', label: { fr: 'Pointer cotisations et cautions', pt: 'Controlar anuidades e cauções' } },
      { id: 'tuto_gestion_notes_de_frais', label: { fr: 'Valider et rembourser une note de frais', pt: 'Aprovar e reembolsar despesas' } },
      { id: 'tuto_cloture_export_comptable', label: { fr: 'Générer les exports comptables pour l’AG', pt: 'Gerar relatórios contábeis para a AG' } }
    ]
  }
});
