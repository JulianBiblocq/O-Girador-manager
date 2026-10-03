import fs from 'fs';

const map = JSON.parse(fs.readFileSync('scripts/pedagogy_lot2_bilingual_map.json', 'utf8'));

// Compléments carnet
map.carnet.tousLesPupitres = { fr: 'Tous les pupitres (', pt: 'Todos os naipes (' };
map.carnet.membresEngages = { fr: 'membres engagés', pt: 'integrantes participando' };
map.carnet.sur = { fr: 'Sur', pt: 'Em' };
map.carnet.morceau = { fr: 'morceau', pt: 'música' };
map.carnet.actif = { fr: 'actif', pt: 'ativa' };
map.carnet.paliersFermante = { fr: 'paliers)', pt: 'níveis)' };
map.carnet.adherents = { fr: 'adhérents', pt: 'integrantes' };
map.carnet.membre = { fr: 'membre', pt: 'integrante' };
map.carnet.cible = { fr: 'Cible :', pt: 'Alvo:' };
map.carnet.bpmSeparateur = { fr: 'BPM •', pt: 'BPM •' };
map.carnet.evalueTonAisanceChoregraphique = {
  fr: "Évalue ton aisance chorégraphique sur chacun des rythmes (toadas, pas de base, variations). Les pas du Dançador seront bientôt intégrés ici pour t'entraîner visuellement.",
  pt: "Avalie sua fluência coreográfica em cada um dos ritmos (toadas, passos básicos, variações). Os passos do Dançador serão integrados em breve aqui para o treino visual."
};

// Compléments reflex
map.reflex.friseChronologique = { fr: 'Frise Chronologique (', pt: 'Linha do Tempo (' };
map.reflex.mesuresFermante = { fr: 'mesures)', pt: 'compassos)' };
map.reflex.pretALEcoute = { fr: "Prêt à l'écoute", pt: 'Pronto para ouvir' };
map.reflex.lancerLEcoute = { fr: "▶ Lancer l'écoute", pt: '▶ Iniciar áudio' };
map.reflex.defi = { fr: 'défi', pt: 'desafio' };
map.reflex.temps1 = { fr: '« Temps 1 »', pt: '«Tempo 1»' };
map.reflex.leMestrePeutConfigurer = {
  fr: 'Le Mestre peut configurer les signaux et conventions depuis le panneau « Mestria > Répertoire ».',
  pt: 'O Mestre pode configurar os sinais e convenções pelo painel «Mestria > Repertório».'
};
map.reflex.option = { fr: 'Option', pt: 'Opção' };
map.reflex.signalDuMestre = { fr: 'Signal du Mestre', pt: 'Sinal do Mestre' };
map.reflex.question = { fr: 'Question', pt: 'Pergunta' };

// Compléments progress
map.progress.tuAsObtenu = { fr: 'Tu as obtenu', pt: 'Você obteve' };
map.progress.bonnesReponsesSur = { fr: 'bonne(s) réponse(s) sur', pt: 'resposta(s) correta(s) de' };
map.progress.priorite = { fr: 'Priorité #', pt: 'Prioridade #' };
map.progress.scoreGlobal = { fr: 'Score global :', pt: 'Pontuação geral:' };
map.progress.demande = { fr: 'demande', pt: 'pedido' };
map.progress.dEleves = { fr: "d'élèves", pt: 'de alunos' };
map.progress.tous = { fr: 'Tous (', pt: 'Todos (' };
map.progress.aucuneFicheCulturelleTrouvee = {
  fr: 'Aucune fiche culturelle trouvée pour cette thématique (',
  pt: 'Nenhuma ficha cultural encontrada para este tema ('
};
map.progress.choregraphiesElementsDeDanse = {
  fr: 'Chorégraphies & Éléments de Danse (',
  pt: 'Coreografias & Elementos de Dança ('
};
map.progress.adherent = { fr: 'adhérent', pt: 'integrante' };
map.progress.figures = { fr: 'figures', pt: 'figuras' };
map.progress.varAbrev = { fr: 'var.', pt: 'var.' };
map.progress.detailDesVariations = {
  fr: 'Détail des Variations & Conventions (',
  pt: 'Detalhes das Variações & Convenções ('
};
map.progress.matricePercussionDeSaison = {
  fr: 'Matrice Percussion de Saison (',
  pt: 'Matriz de Percussão da Temporada ('
};
map.progress.morceauxFermante = { fr: 'morceaux)', pt: 'músicas)' };
map.progress.detailEtActions = { fr: 'Détail & Actions', pt: 'Detalhes & Ações' };
map.progress.vueConsolideeDesScores = {
  fr: "Vue consolidée des scores d'auto-évaluation et des demandes de révision de vos élèves, triée par pupitre. Les scores sont pondérés par la difficulté (Facile = max 33%, Moyen = max 66%, Expert = max 100%).",
  pt: "Visão consolidada das pontuações de autoavaliação e dos pedidos de revisão dos seus alunos, ordenada por naipe. As pontuações são ponderadas pela dificuldade (Fácil = máx 33%, Médio = máx 66%, Especialista = máx 100%)."
};
map.progress.gerezLesFaussesReponses = {
  fr: "Gérez les fausses réponses (distracteurs) injectées dans vos quiz pédagogiques. Une liste riche garantit des QCM variés !",
  pt: "Gerencie as respostas incorretas (distratores) inseridas nos seus quizzes pedagógicos. Uma lista rica garante opções variadas!"
};

// Compléments cards
map.cards.element = { fr: '🌿 Élément :', pt: '🌿 Elemento:' };
map.cards.symboles = { fr: '⚔️ Symboles :', pt: '⚔️ Símbolos:' };
map.cards.toadasParenthese = { fr: '🎵 Toadas (', pt: '🎵 Toadas (' };
map.cards.cultureHistoireParenthese = { fr: '📖 Culture & Histoire (', pt: '📖 Cultura & História (' };

fs.writeFileSync('scripts/pedagogy_lot2_bilingual_map.json', JSON.stringify(map, null, 2), 'utf8');
console.log('✅ Clés complémentaires enregistrées dans pedagogy_lot2_bilingual_map.json');
