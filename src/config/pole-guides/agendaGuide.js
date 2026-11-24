import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Agenda, Sondages d'Ateliers & Événements.
 */
export const agendaGuide = makeDoubleViewGuide({
  id: 'agenda',
  poleName: { fr: 'Agenda & Événements', pt: 'Programação & Eventos' },
  title: { fr: '📅 Agenda, Sondages & Événements', pt: '📅 Programação, Enquetes & Eventos' },
  description: {
    fr: 'Consulte le calendrier de la troupe, vote aux sondages d’ateliers, déclare tes présences et organise tes trajets.',
    pt: 'Consulte o calendário da trupe, vote nas enquetes de oficinas, confirme sua presença e organize suas caronas.'
  },
  memberGuide: {
    title: { fr: 'Comment utiliser l’Agenda et les sondages ?', pt: 'Como utilizar a Programação e as enquetes?' },
    summary: {
      fr: 'Déclare tes présences, réponds aux sondages de dates par pupitre, prépare tes trajets et révise les morceaux.',
      pt: 'Confirme suas presenças, responda às enquetes de datas por naipe, organize suas caronas e pratique o repertório.'
    },
    sections: [
      {
        heading: { fr: '1. Répondre aux convocations & consulter la feuille de route', pt: '1. Confirmar presença (RSVP) & consultar o roteiro' },
        text: {
          fr: 'Indique « Présent », « Absent » ou « À confirmer » sur chaque événement pour équilibrer les pupitres, et retrouve l’horaire précis, le lien GPS et la tenue demandée.',
          pt: 'Indique « Presente », « Ausente » ou « A confirmar » em cada data para equilibrar os naipes, conferindo horário exato, localização GPS e figurino.'
        }
      },
      {
        heading: { fr: '2. Sondages d’ateliers & Musiciens avec second instrument', pt: '2. Enquetes de oficinas & Músicos com segundo instrumento' },
        text: {
          fr: 'Vote « Dispo » ou « Indispo » sur chaque créneau proposé. Si tu joues d’un instrument secondaire : pendant le sondage, ta réponse compte dans le quota de ton pupitre principal (pour éviter tout double comptage d’effectif) tout en t’affichant en renfort disponible sur ton second instrument pour éclairer le choix du Mestre. Rassure-toi : une fois la date de l’atelier officiellement confirmée, tu pourras tout à fait t’y inscrire en choisissant ton second instrument !',
          pt: 'Vote « Disponível » ou « Indisponível » em cada data sugerida. Se você toca um instrumento secundário: durante a enquete, sua resposta entra na cota do seu naipe principal (evitando contagem dupla de efetivo) e também exibe você como reforço disponível no segundo instrumento para orientar a escolha do Mestre. Fique tranquilo: assim que a data da oficina for oficialmente confirmada, você poderá se inscrever escolhendo normalmente o seu segundo instrumento!'
        }
      },
      {
        heading: { fr: '3. Covoiturage solidaire & transport d’instruments', pt: '3. Carona solidária & transporte de instrumentos' },
        text: {
          fr: 'Propose des places ou rejoins un véhicule. Renseigne ta voiture dans ton profil pour pré-remplir automatiquement tes places passagers et ta capacité de coffre.',
          pt: 'Ofereça vagas ou entre em um veículo. Cadastre seu carro no perfil para preencher automaticamente lugares de passageiros e espaço para instrumentos.'
        }
      },
      {
        heading: { fr: '4. Réviser le programme musical', pt: '4. Revisar o programa musical' },
        text: {
          fr: 'Ouvre les morceaux rattachés à la sortie pour réviser les paroles avec Cantador, les chorégraphies avec Dançador ou t’entraîner au tempo dans Sequenciador.',
          pt: 'Abra as músicas vinculadas ao evento para revisar letras com Cantador, coreografias com Dançador ou treinar o andamento no Sequenciador.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Piloter les sondages matriciels et les événements', pt: 'Coordenar enquetes matriciais e eventos' },
    roleBadge: { fr: 'Secrétariat • Mestre • Logistique', pt: 'Secretaria • Mestre • Logística' },
    summary: {
      fr: 'Planification des sorties, arbitrage matriciel Dates × Pupitres des ateliers, logistique de convoi et feuille de route.',
      pt: 'Planejamento de eventos, arbitragem matricial Datas × Naipes das oficinas, logística de comboio e roteiro final.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Création, format et statut de la date', pt: 'Criação, formato e status da data' },
        desc: {
          fr: 'Crée une Répétition, Prestation, Réunion ou un Atelier (date fixe ou sondage multi-créneaux) et garde le statut « Option » tant que l’engagement n’est pas validé.',
          pt: 'Crie um Ensaio, Apresentação, Reunião ou Oficina (data fixa ou enquete com várias datas) e mantenha em « Opção » até a confirmação final.'
        }
      },
      {
        step: 2,
        title: { fr: 'Sondage matriciel Dates × Pupitres & validation en entonnoir', pt: 'Matriz Datas × Naipes & confirmação por naipe' },
        desc: {
          fr: 'Analyse la matrice Dates × Pupitres et la proposition automatique de répartition optimale, clique sur une cellule pour surcharger un créneau, déplie les tiroirs Indispo / Sans réponse, lance une relance ciblée en 1 clic puis valide les ateliers retenus par pupitre.',
          pt: 'Analise a matriz Datas × Naipes e a sugestão automática de alocação ideal, clique em qualquer célula para ajustar um horário, abra as gavetas Indisponíveis / Sem resposta, dispare um lembrete direcionado em 1 clique e confirme as oficinas por naipe.'
        }
      },
      {
        step: 3,
        title: { fr: 'Lieu GPS, horaires et programme artistique', pt: 'Local GPS, horários e repertório artístico' },
        desc: {
          fr: 'Associe une salle habituelle ou une adresse GPS, fixe les horaires de rassemblement et rattache les pièces du Répertoire reliées à Sequenciador, Cantador et Dançador.',
          pt: 'Vincule um local habitual ou endereço GPS, defina horários de concentração e anexe as peças do Repertório conectadas a Sequenciador, Cantador e Dançador.'
        }
      },
      {
        step: 4,
        title: { fr: 'Logistique, malles régie et commissions', pt: 'Logística, malas técnicas e comissões' },
        desc: {
          fr: 'Active le covoiturage passagers/matériel, sélectionne les malles collectives à embarquer et désigne les référents de commissions.',
          pt: 'Ative a carona de integrantes e instrumentos, selecione as malas coletivas e defina os responsáveis pelas comissões.'
        }
      },
      {
        step: 5,
        title: { fr: 'Publication, pointage et feuille de route PDF', pt: 'Publicação, chamada e roteiro em PDF' },
        desc: {
          fr: 'Publie l’événement, contrôle l’équilibre des pupitres en direct et exporte la feuille de route PDF complète pour le jour J.',
          pt: 'Publique o evento, acompanhe o equilíbrio dos naipes em tempo real e exporte o roteiro completo em PDF para o dia da saída.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_creer_evenement', label: { fr: 'Créer une date, un sondage et son programme', pt: 'Criar evento, enquete matricial e repertório' } },
      { id: 'tuto_regie_covoiturage', label: { fr: 'Régie de convoi et feuille de route', pt: 'Gestão de comboio e roteiro PDF' } }
    ]
  }
});
