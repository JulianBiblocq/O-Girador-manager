import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Le Zap, Porte-Voix, Groupes & Messages Privés.
 */
export const forumGuide = makeDoubleViewGuide({
  id: 'forum',
  poleName: { fr: 'Porte-Voix & Vie du groupe', pt: 'Porta-Voz & Vida da Trupe' },
  title: { fr: '📢 Le Zap, Porte-Voix & Messagerie', pt: '📢 O Zap, Porta-Voz & Mensagens' },
  description: {
    fr: 'Échange en direct sur Le Zap, participe aux salons thématiques du Porte-Voix, discute en groupe ou en privé et retrouve tout message via la recherche unifiée.',
    pt: 'Converse ao vivo no O Zap, participe das salas temáticas do Porta-Voz, troque mensagens privadas ou em grupo e localize qualquer conversa pela busca unificada.'
  },
  memberGuide: {
    title: { fr: 'Comment échanger dans Le Zap et le Porte-Voix ?', pt: 'Como conversar no O Zap e no Porta-Voz?' },
    summary: {
      fr: 'Un espace complet réunissant tchat instantané associatif, salons classés par thématique, groupes fermés, messages privés et recherche globale.',
      pt: 'Um espaço completo reunindo bate-papo instantâneo da associação, salas por tema, grupos fechados, mensagens diretas e busca global.'
    },
    sections: [
      {
        heading: { fr: '1. Le duo 💬 Le Zap & 📢 Le Porte-Voix', pt: '1. A dupla 💬 O Zap & 📢 Porta-Voz' },
        text: {
          fr: 'Utilise « 💬 Le Zap » (accessible dès l’Accueil et épinglé en haut) pour le tchat instantané commun à toute l’association, et « 📢 Le Porte-Voix » pour les sujets durables rangés dans les salons et sous-dossiers accessibles selon tes rôles et badges.',
          pt: 'Use « 💬 O Zap » (acessível no Início e fixado no topo) para o bate-papo rápido de toda a associação, e o « 📢 Porta-Voz » para discussões estruturadas em salas e pastas conforme seus cargos e crachás.'
        }
      },
      {
        heading: { fr: '2. 👥 Groupes fermés & ✉️ Messages privés', pt: '2. 👥 Grupos fechados & ✉️ Mensagens privadas' },
        text: {
          fr: 'Discute en tête-à-tête dans « Messages privés » avec suivi de lecture, ou crée un groupe fermé dédié à une commission, un atelier ou un covoiturage sans alourdir Le Zap.',
          pt: 'Converse individualmente em « Mensagens privadas » com confirmação de leitura, ou crie um grupo fechado para comissões, oficinas ou caronas sem sobrecarregar O Zap.'
        }
      },
      {
        heading: { fr: '3. Bouton « + » : photos, documents, dictée vocale & sondages', pt: '3. Botão « + »: fotos, documentos, ditado por voz & enquetes' },
        text: {
          fr: 'Depuis le bouton « + » de la barre d’écriture, envoie une photo automatiquement compressée, joins un document PDF, utilise la dictée vocale ou réponds aux sondages collectifs.',
          pt: 'Pelo botão « + » da barra de mensagem, envie fotos com compressão automática, anexe documentos PDF, utilize o ditado por voz ou vote nas enquetes da trupe.'
        }
      },
      {
        heading: { fr: '4. Recherche unifiée 🔍 par mot-clé ou par auteur', pt: '4. Busca unificada 🔍 por palavra-chave ou autor' },
        text: {
          fr: 'Saisis un mot-clé ou le nom d’un membre dans la barre « 🔍 » (ou clique sur la loupe d’un tchat) pour fouiller simultanément Le Zap, tes Salons autorisés, tes Groupes et tes MP, filtrer par catégorie et sauter directement au message surligné.',
          pt: 'Digite uma palavra-chave ou o nome de um integrante na barra « 🔍 » (ou toque na lupa dentro de um chat) para pesquisar simultaneamente no O Zap, nas Salas autorizadas, nos Grupos e nas MPs, filtrando por categoria e indo direto à mensagem destacada.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Structurer et modérer les canaux de communication', pt: 'Estruturar e moderar os canais de comunicação' },
    roleBadge: { fr: 'Modération • Bureau • Conseil d’Administration', pt: 'Moderação • Diretoria • Conselho' },
    summary: {
      fr: 'Architecture des salons et sous-dossiers, droits de lecture/écriture par badge, épinglage et animation collective.',
      pt: 'Arquitetura de salas e subpastas, permissões de leitura/escrita por crachá, fixação de avisos e mediação coletiva.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Hiérarchie des salons et sous-dossiers', pt: 'Hierarquia de salas e subpastas' },
        desc: {
          fr: 'Ouvre « ⚙️ Gérer » dans le Porte-Voix pour organiser les salons thématiques et sous-dossiers par pupitre, commission ou projet.',
          pt: 'Abra « ⚙️ Gerenciar » no Porta-Voz para organizar salas temáticas e subpastas por naipe, comissão ou projeto.'
        }
      },
      {
        step: 2,
        title: { fr: 'Matrice de droits Lecture & Écriture par badge', pt: 'Matriz de permissões de Leitura & Escrita' },
        desc: {
          fr: 'Définis finement quels badges peuvent lire ou publier dans chaque salon (annonces officielles en lecture seule, salon privé du Bureau).',
          pt: 'Defina quais crachás podem ler ou publicar em cada sala (avisos oficiais em somente leitura, canal restrito da Diretoria).'
        }
      },
      {
        step: 3,
        title: { fr: 'Articulation entre Le Zap et les Salons', pt: 'Equilíbrio entre O Zap e as Salas' },
        desc: {
          fr: 'Encourage la spontanéité quotidienne sur Le Zap et déplace ou épingle les décisions durables dans les salons dédiés du Porte-Voix.',
          pt: 'Incentive a troca rápida no O Zap e mova ou fixe decisões permanentes nas salas temáticas do Porta-Voz.'
        }
      },
      {
        step: 4,
        title: { fr: 'Consultations et sondages thématiques', pt: 'Consultas e enquetes temáticas' },
        desc: {
          fr: 'Associe un sondage à vote unique lors de l’ouverture d’un sujet pour trancher démocratiquement un choix artistique ou associatif.',
          pt: 'Adicione uma enquete de voto único ao criar um tópico para deliberar escolhas artísticas ou associativas.'
        }
      },
      {
        step: 5,
        title: { fr: 'Modération et archivage serein', pt: 'Moderação e organização contínua' },
        desc: {
          fr: 'Épingle les annonces prioritaires, reclasse les sujets égarés et veille au respect de la charte relationnelle de l’association.',
          pt: 'Fixe comunicados prioritários, reorganize tópicos fora de lugar e zele pela convivência respeitosa do grupo.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_gestion_salons_droits', label: { fr: 'Créer un salon et régler les accès', pt: 'Criar sala e configurar permissões' } },
      { id: 'tuto_sondages_et_epingles', label: { fr: 'Rechercher, épingler et lancer un sondage', pt: 'Pesquisar, fixar tópicos e criar enquetes' } }
    ]
  }
});
