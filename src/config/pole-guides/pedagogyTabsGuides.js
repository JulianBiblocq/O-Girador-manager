import { makeGuide } from './guideHelpers.js';

/**
 * Guides bilingues (FR / PT-BR) des 3 sous-onglets du Pôle Pédagogie :
 * - `varal-manager`
 * - `mestre-pedagogy-qcm`
 * - `mestre-pedagogy-dashboard`
 */
export const pedagogyTabsGuides = {
  'varal-manager': makeGuide({
    fr: {
      title: '📌 Varal Pédagogique, Chants & Supports',
      description: 'Bibliothèque centrale des livrets de Cordel, fiches de chants, relevés de Baque, fiches culturelles et supports audio d’apprentissage.',
      steps: [
        'Ajoutez ou éditez les fiches de chants, livrets de Cordel et notices historiques du Varal.',
        'Associez les enregistrements audio témoins et reliez les morceaux aux ressources de Sequenciador et Cantador.',
        'Réglez la visibilité pédagogique afin d’alimenter proprement le Répertoire et le Parcours des élèves.'
      ]
    },
    pt: {
      title: '📌 Varal Pedagógico, Toadas & Materiais',
      description: 'Biblioteca central de livretos de Cordel, letras de toadas, grades de Baque, fichas culturais e áudios de estudo.',
      steps: [
        'Adicione ou edite fichas de toadas, livretos de Cordel e notas históricas no Varal.',
        'Vincule áudios de referência e conecte as músicas aos recursos do Sequenciador e do Cantador.',
        'Defina a visibilidade pedagógica para abastecer de forma organizada o Repertório e o Percurso dos alunos.'
      ]
    }
  }),

  'mestre-pedagogy-qcm': makeGuide({
    fr: {
      title: '📝 Configuration des QCM, Signaux & Défis',
      description: 'Paramétrage des questionnaires culturels, de la reconnaissance des signaux du Mestre, du Défi Réflexe et du Conducteur à trous.',
      steps: [
        'Créez ou ajustez les questions culturelles et rythmiques par niveau et par pupitre.',
        'Vérifiez les signaux de commandement reliés aux arrangements de Sequenciador et les distracteurs proposés.',
        'Activez ou excluez finement les pièces visibles dans les sessions d’entraînement de l’espace membre.'
      ]
    },
    pt: {
      title: '📝 Configuração de Quizzes, Sinais & Desafios',
      description: 'Parametrização dos questionários culturais, reconhecimento de sinais do Mestre, Desafio Reflexo e Condutor com lacunas.',
      steps: [
        'Crie ou ajuste perguntas culturais e rítmicas por nível de prática e por naipe.',
        'Confira os sinais de condução conectados aos arranjos do Sequenciador e as alternativas geradas.',
        'Ative ou oculte com precisão as peças incluídas nas sessões de treino do espaço do integrante.'
      ]
    }
  }),

  'mestre-pedagogy-dashboard': makeGuide({
    fr: {
      title: '📊 Suivi & Analyse Pédagogique de la Troupe',
      description: 'Vue consolidée de l’aisance déclarée, des paliers de tempo franchis dans Sequenciador, des scores aux défis et des demandes de révision.',
      steps: [
        'Examinez les jauges d’aisance par morceau et par pupitre ainsi que les paliers progressifs validés.',
        'Repérez les demandes de révision cochées par les musiciens et les notions les plus souvent manquées en quiz.',
        'Épinglez les priorités identifiées dans votre programme de répétition pour cibler le prochain atelier.'
      ]
    },
    pt: {
      title: '📊 Acompanhamento & Análise Pedagógica da Trupe',
      description: 'Visão consolidada do conforto declarado, níveis de andamento concluídos no Sequenciador, pontuações nos desafios e pedidos de revisão.',
      steps: [
        'Analise os indicadores de conforto por música e por naipe, além dos níveis progressivos validados.',
        'Identifique os pedidos de revisão marcados pelos integrantes e os pontos com mais erros nos quizzes.',
        'Fixe as prioridades encontradas na pauta de ensaio para direcionar a próxima oficina.'
      ]
    }
  })
};
