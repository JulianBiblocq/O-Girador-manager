import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Studio & Communication
 * aligné sur ses 5 onglets actuels (`studio-social`, `newsletter`, `varal-photos`, `studio-communication`, `studio-lexique`).
 */
export const studioGuide = makeDoubleViewGuide({
  id: 'studio',
  poleName: { fr: 'Studio & Communication', pt: 'Studio & Comunicação' },
  title: { fr: '📱 Pôle Studio, Médias & Communication', pt: '📱 Polo Studio, Mídias & Comunicação' },
  description: {
    fr: 'Création de publications sociales, lettres d’info, médiathèque photo, campagnes Brevo et lexique culturel officiel.',
    pt: 'Criação de postagens sociais, boletins informativos, acervo de fotos, campanhas Brevo e glossário cultural oficial.'
  },
  memberGuide: {
    title: { fr: 'Retrouver les photos et suivre les actualités de la troupe', pt: 'Acessar fotos e acompanhar as novidades da trupe' },
    summary: {
      fr: 'Parcours les albums souvenirs des concerts, lis les infolettres et partage tes clichés après chaque sortie.',
      pt: 'Navegue pelos álbuns das apresentações, leia os boletins e envie seus registros após cada evento.'
    },
    sections: [
      {
        heading: { fr: '1. Albums souvenirs sur le Varal Photos', pt: '1. Álbuns de lembranças no Varal de Fotos' },
        text: {
          fr: 'Consulte et télécharge les photographies des répétitions, stages et cortèges classées par événement.',
          pt: 'Visualize e baixe as fotografias de ensaios, oficinas e cortejos organizadas por evento.'
        }
      },
      {
        heading: { fr: '2. Lettres d’information & annonces publiques', pt: '2. Boletins informativos & divulgações' },
        text: {
          fr: 'Suis les grands rendez-vous publics de la saison et partage facilement les visuels officiels autour de toi.',
          pt: 'Acompanhe a agenda pública da temporada e compartilhe facilmente as chamadas oficiais do grupo.'
        }
      },
      {
        heading: { fr: '3. Dépôt photo/vidéo par QR code d’événement', pt: '3. Envio de fotos e vídeos via QR code' },
        text: {
          fr: 'Utilise le lien ou le QR code de collecte présent sur la fiche d’une sortie pour transmettre tes images à l’équipe Studio.',
          pt: 'Use o link ou QR code de coleta na ficha do evento para enviar suas imagens direto para a equipe do Studio.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Piloter les 5 ateliers éditoriaux du Studio', pt: 'Coordenar as 5 frentes editoriais do Studio' },
    roleBadge: { fr: 'Communication • Médias • Relations Presse', pt: 'Comunicação • Mídias • Imprensa' },
    summary: {
      fr: 'Flux complet : Réseaux & Médias, Lettres d’info, Médiathèque Photos, Communication & Brevo, et Lexique & Mentions.',
      pt: 'Fluxo completo: Redes & Mídias, Boletins, Acervo de Fotos, Comunicação & Brevo, e Glossário & Menções.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Réseaux & Médias : publications prêtes à diffuser', pt: 'Redes & Mídias: postagens prontas para publicar' },
        desc: {
          fr: 'Dans « Réseaux & Médias », compose tes textes d’annonce enrichis des mentions, hashtags et termes culturels recommandés.',
          pt: 'Em « Redes & Mídias », redija chamadas de divulgação com menções, hashtags e vocabulário cultural adequado.'
        }
      },
      {
        step: 2,
        title: { fr: 'Lettres d’info : composition des campagnes', pt: 'Boletins: montagem de informativos' },
        desc: {
          fr: 'Dans « Lettres d’info », sélectionne l’édito, les prochaines dates publiques et les retours en images à envoyer aux abonnés.',
          pt: 'Em « Boletins », reúna o editorial, as próximas apresentações públicas e os registros fotográficos para os inscritos.'
        }
      },
      {
        step: 3,
        title: { fr: 'Médiathèque Photos & passerelle Cloud', pt: 'Acervo de Fotos & conexão Cloud' },
        desc: {
          fr: 'Dans « Médiathèque Photos », relie ton espace Cloud (Framaspace, Drive, Dropbox), génère les QR codes de collecte et publie les albums.',
          pt: 'Em « Acervo de Fotos », conecte sua nuvem, gere QR codes de coleta por evento e publique os álbuns selecionados.'
        }
      },
      {
        step: 4,
        title: { fr: 'Communication & synchronisation Brevo', pt: 'Comunicação & sincronização Brevo' },
        desc: {
          fr: 'Dans « Communication & Brevo », coordonne le calendrier promotionnel, les contacts presse et la synchronisation des listes d’abonnés.',
          pt: 'Em « Comunicação & Brevo », organize o calendário de divulgação, contatos de imprensa e listas de assinantes no Brevo.'
        }
      },
      {
        step: 5,
        title: { fr: 'Lexique culturel, mentions (@) & hashtags', pt: 'Glossário cultural, menções (@) & hashtags' },
        desc: {
          fr: 'Dans « Lexique & Mentions », maintiens les comptes partenaires (@), les équivalences culturelles justes (Batuque, Baque, Toada) et les hashtags.',
          pt: 'Em « Glossário & Menções », mantenha perfis parceiros (@), termos culturais corretos (Batuque, Baque, Toada) e hashtags padrão.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_gestion_galerie_vitrine', label: { fr: 'Gérer la médiathèque et Mostrador', pt: 'Gerenciar acervo de fotos e Mostrador' } },
      { id: 'tuto_campagne_newsletter_brevo', label: { fr: 'Préparer une infolettre et synchroniser Brevo', pt: 'Montar boletim e sincronizar com o Brevo' } }
    ]
  }
});
