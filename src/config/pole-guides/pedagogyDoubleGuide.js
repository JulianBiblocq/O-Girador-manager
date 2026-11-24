import { makeDoubleViewGuide } from './guideHelpers.js';

/**
 * Guide bilingue Double Vue (FR / PT-BR) : Pédagogie, Répertoire & Passerelles O Girador.
 */
export const pedagogyGuide = makeDoubleViewGuide({
  id: 'pedagogy',
  poleName: { fr: 'Pédagogie & Répertoire', pt: 'Pedagogia & Repertório' },
  title: { fr: '🎶 Pédagogie, Répertoire & Entraînement', pt: '🎶 Pedagogia, Repertório & Treinamento' },
  description: {
    fr: 'Explore les morceaux de la saison, travaille tes pupitres avec Sequenciador, Cantador et Dançador, et consolide ton aisance.',
    pt: 'Explore o repertório da temporada, pratique seus naipes com Sequenciador, Cantador e Dançador, e fortaleça seu conforto musical.'
  },
  memberGuide: {
    title: { fr: 'Comment travailler le répertoire et progresser ?', pt: 'Como estudar o repertório e evoluir?' },
    summary: {
      fr: 'Retrouve les morceaux, progresse par paliers dans Sequenciador, travaille le chant ou la danse et relève les défis rythmiques.',
      pt: 'Acesse as peças, evolua por níveis no Sequenciador, estude canto ou dança e encare os desafios rítmicos.'
    },
    sections: [
      {
        heading: { fr: '1. Explorer les fiches morceaux, Cantador & Dançador', pt: '1. Explorar as músicas, Cantador & Dançador' },
        text: {
          fr: 'Déplie chaque pièce du Répertoire pour consulter ses paroles, sa fiche culturelle, travailler la prononciation et la mélodie dans Cantador ou réviser les pas dans Dançador.',
          pt: 'Abra cada música do Repertório para ler a letra e o contexto cultural, praticar melodia e pronúncia no Cantador ou revisar a coreografia no Dançador.'
        }
      },
      {
        heading: { fr: '2. Sequenciador & Paliers de tempo progressifs', pt: '2. Sequenciador & Níveis progressivos de andamento' },
        text: {
          fr: 'Lance Sequenciador depuis la fiche d’un morceau pour isoler ton instrument dans le Batuque et valider un par un tes paliers de tempo progressifs jusqu’à la cadence cible.',
          pt: 'Inicie o Sequenciador direto da ficha da música para isolar seu instrumento no Batuque e validar etapa por etapa os níveis progressivos de andamento até a velocidade final.'
        }
      },
      {
        heading: { fr: '3. Défi Réflexe & Conducteur à trous', pt: '3. Desafio Reflexo & Condutor com lacunas' },
        text: {
          fr: 'Entraîne ta réactivité sur les appels et gestes du Mestre avec le Défi Réflexe, et vérifie ta maîtrise de la structure complète du morceau grâce au Conducteur à trous.',
          pt: 'Treine sua reação às chamadas e gestos do Mestre no Desafio Reflexo e teste seu domínio da estrutura completa da música no Condutor com lacunas.'
        }
      },
      {
        heading: { fr: '4. Carnet d’aisance & demandes de révision', pt: '4. Caderno de conforto & pedidos de revisão' },
        text: {
          fr: 'Indique ton ressenti sur chaque pièce et coche « Révision souhaitée » en un clic pour signaler au Mestre les passages à retravailler en répétition.',
          pt: 'Registre seu nível de conforto em cada peça e marque « Revisão desejada » em um clique para indicar ao Mestre os trechos a reforçar no ensaio.'
        }
      }
    ]
  },
  managerGuide: {
    title: { fr: 'Piloter la progression pédagogique et artistique', pt: 'Coordenar a evolução pedagógica e artística' },
    roleBadge: { fr: 'Mestre • Direction Artistique • Formateurs', pt: 'Mestre • Direção Artística • Instrutores' },
    summary: {
      fr: 'Structuration du Varal, calibrage des entraînements Sequenciador, suivi collectif d’aisance et QCM.',
      pt: 'Organização do Varal, calibração de treinos no Sequenciador, acompanhamento coletivo de conforto e quizzes.'
    },
    workflowSteps: [
      {
        step: 1,
        title: { fr: 'Structuration du Répertoire & passerelles O Girador', pt: 'Estruturação do Repertório & conexões O Girador' },
        desc: {
          fr: 'Relie chaque pièce de la saison à son arrangement Sequenciador, son pack vocal Cantador et sa chorégraphie Dançador.',
          pt: 'Vincule cada peça da temporada ao seu arranjo no Sequenciador, pacote vocal no Cantador e coreografia no Dançador.'
        }
      },
      {
        step: 2,
        title: { fr: 'Fiches culturelles & supports du Varal', pt: 'Fichas culturais & materiais do Varal' },
        desc: {
          fr: 'Publie sur le Varal les livrets de Cordel, relevés rythmiques, fiches historiques et supports audio classés par visibilité.',
          pt: 'Publique no Varal os livretos de Cordel, grades rítmicas, fichas históricas e áudios de estudo organizados por acesso.'
        }
      },
      {
        step: 3,
        title: { fr: 'Suivi des paliers d’entraînement & points chauds', pt: 'Monitoramento dos níveis de treino & pontos críticos' },
        desc: {
          fr: 'Observe dans le Tableau de bord Pédagogique l’aisance par pupitre, les paliers de tempo validés dans Sequenciador et les demandes de révision des élèves.',
          pt: 'Acompanhe no Painel Pedagógico o conforto por naipe, os níveis de andamento validados no Sequenciador e os pedidos de revisão dos alunos.'
        }
      },
      {
        step: 4,
        title: { fr: 'Préparation ciblée de la prochaine répétition', pt: 'Preparação direcionada do próximo ensaio' },
        desc: {
          fr: 'Épingle les morceaux et transitions fragiles dans le bloc-notes de répétition afin de concentrer le travail collectif sur l’essentiel.',
          pt: 'Fixe as músicas e viradas mais frágeis na pauta de ensaio para focar o treino coletivo no que mais precisa.'
        }
      },
      {
        step: 5,
        title: { fr: 'Calibrage des QCM, Défi Réflexe & Conducteur', pt: 'Calibração de Quizzes, Desafio Reflexo & Condutor' },
        desc: {
          fr: 'Ajuste les questionnaires culturels, les signaux de commandement et les paramètres des jeux rythmiques proposés aux membres.',
          pt: 'Ajuste os questionários culturais, os sinais de regência e os parâmetros dos desafios interativos disponíveis aos membros.'
        }
      }
    ],
    videoTutorials: [
      { id: 'tuto_creer_toada_repertoire', label: { fr: 'Relier Sequenciador, Cantador et Dançador', pt: 'Conectar Sequenciador, Cantador e Dançador' } },
      { id: 'tuto_dashboard_pedagogique_pauta', label: { fr: 'Analyser l’aisance et préparer la répétition', pt: 'Analisar o conforto e montar a pauta de ensaio' } }
    ]
  }
});
