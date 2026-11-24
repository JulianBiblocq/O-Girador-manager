import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) du Pôle Vitrine Publique (Mostrador) — Partie 2 :
 * `vitrine-galerie`, `vitrine-recrutement`, `vitrine-reseaux`, `vitrine-apparence`.
 */
export const vitrineGuidesPart2 = {
  'vitrine-galerie': makeGuide({
    fr: {
      title: '📸 Galerie Photo & Vidéos Publiques',
      description: 'Sélection éditoriale des plus belles photographies et captations vidéo exposées aux visiteurs sur Mostrador.',
      steps: [
        'Téléversez ou sélectionnez des clichés haute définition en mentionnant les crédits photo.',
        'Ajoutez les liens de vos captations vidéo phares (YouTube ou Vimeo).',
        'Ordonnez les médias pour valoriser l’énergie des cortèges et des spectacles.'
      ]
    },
    pt: {
      title: '📸 Galeria Pública de Fotos & Vídeos',
      description: 'Curadoria das melhores fotografias e vídeos de apresentações exibidos aos visitantes no Mostrador.',
      steps: [
        'Envie ou selecione fotos em alta definição informando os créditos fotográficos.',
        'Adicione links dos vídeos de destaque do grupo (YouTube ou Vimeo).',
        'Ordene a galeria para valorizar a energia dos cortejos e palcos.'
      ]
    }
  }),

  'vitrine-recrutement': makeGuide({
    fr: {
      title: '🤝 Recrutement, Ateliers Découverte & Vie Associative',
      description: 'Informations d’accueil des futurs membres : créneaux débutants, conditions d’inscription et formules annuelles.',
      steps: [
        'Rédigez le message de bienvenue et précisez les pupitres ouverts au recrutement.',
        'Indiquez les jours, horaires et salles des répétitions ou séances d’essai.',
        'Activez ou fermez la prise de contact d’inscription selon la période de la saison.'
      ]
    },
    pt: {
      title: '🤝 Recrutamento, Oficinas Abertas & Adesão',
      description: 'Informações para novos interessados: horários de iniciantes, condições de entrada e modalidades anuais.',
      steps: [
        'Escreva a mensagem de boas-vindas e informe quais naipes ou alas estão com vagas.',
        'Detalhe dias, horários e locais de ensaio ou aulas experimentais.',
        'Ative ou encerre o formulário de interesse conforme o calendário da temporada.'
      ]
    }
  }),

  'vitrine-reseaux': makeGuide({
    fr: {
      title: '📲 Réseaux Sociaux & Infolettre Publique',
      description: 'Passerelles vers les pages officielles de la troupe et abonnement des spectateurs à l’infolettre sur Mostrador.',
      steps: [
        'Renseignez les adresses officielles Instagram, Facebook, YouTube ou SoundCloud du groupe.',
        'Configurez le formulaire d’inscription à l’infolettre pour recueillir les abonnés publics.',
        'Testez chaque lien externe afin de garantir une redirection fluide depuis Mostrador.'
      ]
    },
    pt: {
      title: '📲 Redes Sociais & Informativo Público',
      description: 'Links para os perfis oficiais do grupo e cadastro de espectadores no informativo pelo Mostrador.',
      steps: [
        'Insira os endereços oficiais de Instagram, Facebook, YouTube ou SoundCloud da trupe.',
        'Configure o formulário de inscrição no informativo para cadastrar o público interessado.',
        'Teste cada link externo para garantir o redirecionamento correto no Mostrador.'
      ]
    }
  }),

  'vitrine-apparence': makeGuide({
    fr: {
      title: '🎨 Apparence & Thème Visuel de Mostrador',
      description: 'Personnalisation des couleurs identitaires, typographies et contrastes du site vitrine public.',
      steps: [
        'Sélectionnez la palette chromatique reflétant les couleurs officielles de votre troupe.',
        'Contrôlez la lisibilité des titres, boutons et cartes sur ordinateur comme sur mobile.',
        'Enregistrez le thème pour l’appliquer instantanément sur Mostrador.'
      ]
    },
    pt: {
      title: '🎨 Aparência & Tema Visual do Mostrador',
      description: 'Personalização das cores oficiais, tipografia e contrastes visuais do portal público.',
      steps: [
        'Escolha a paleta de cores que representa a identidade visual do seu grupo.',
        'Verifique o contraste e a leitura de títulos, botões e cartões no celular e no computador.',
        'Salve o tema para atualizar imediatamente o visual do Mostrador.'
      ]
    }
  })
};
