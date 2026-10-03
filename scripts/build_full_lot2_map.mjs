// Script exhaustif de mapping bilingue FR -> PT-BR pour le Pôle Pédagogie (Lot 2)
// Périmètre : carnet, reflex, progress, cards (35 fichiers, 344 clés uniques)

import fs from 'fs';
import path from 'path';

const draft = JSON.parse(fs.readFileSync('scripts/pedagogy_lot2_draft_map.json', 'utf8'));

// Dictionnaire bilingue précis
const ptTranslations = {
  // === CARNET ===
  "Excellent ! Tu maîtrises le sujet.": "Excelente! Você domina o assunto.",
  "🔄 Rejouer": "🔄 Jogar novamente",
  "✕ Fermer": "✕ Fechar",
  "✅ Correct !": "✅ Correto!",
  "⚡ Défis Rythmiques": "⚡ Desafios Rítmicos",
  "🥁 Percussion": "🥁 Percussão",
  "💃 Danse": "💃 Dança",
  "Gonguê": "Gonguê",
  "Marcante": "Marcante",
  "Agbê": "Agbê",
  "Timbal": "Timbal",
  "← Retour au Carnet": "← Voltar ao Caderno",
  "maîtrisé": "dominado",
  "Maîtrisé": "Dominado",
  "Aucun défi d'entraînement actif pour cette saison.": "Nenhum desafio de treino ativo para esta temporada.",
  "Les programmes configurés dans sequenciador pour vos morceaux apparaîtront automatiquement ici.": "Os programas configurados no sequenciador para as suas músicas aparecerão automaticamente aqui.",
  "palier": "nível",
  "Ouvrir sequenciador sur votre prochain palier d'entraînement": "Abrir o sequenciador no seu próximo nível de treino",
  "Rejouer dans sequenciador": "Jogar novamente no sequenciador",
  "S'entraîner maintenant": "Treinar agora",
  "Réflexes & Conventions": "Reflexos & Convenções",
  "signaux validés (Maîtrisé)": "sinais validados (Dominado)",
  "signaux validés": "sinais validados",
  "À découvrir": "A descobrir",
  "Conducteur validé": "Condução validada",
  "Simulateur de signaux du Mestre avec arrêt au temps 1 et mémorisation de la structure chronologique.": "Simulador de sinais do Mestre com parada no tempo 1 e memorização da estrutura cronológica.",
  "Lancer le Défi Réflexe « Temps 1 » pour ce morceau": "Iniciar o Desafio de Reflexo «Tempo 1» para esta música",
  "Défi Réflexe": "Desafio de Reflexo",
  "Ouvrir la Timeline et compléter le conducteur à trous": "Abrir a Linha do Tempo e completar a condução com lacunas",
  "Conduire le morceau (Timeline)": "Conduzir a música (Linha do tempo)",
  "Répertoire de saison": "Repertório da temporada",
  "Testez vos départs au temps 1 sur les signaux du Mestre avec 4 choix de tablatures.": "Teste suas saídas no tempo 1 nos sinais do Mestre com 4 opções de tablatura.",
  "💃 Évalue ton aisance chorégraphique sur chacun des rythmes (toadas, pas de base, variations).\n              Les pas du Dançador seront bientôt intégrés ici pour t'entraîner visuellement.": "💃 Avalie sua fluência coreográfica em cada um dos ritmos (toadas, passos básicos, variações).\n              Os passos do Dançador serão integrados em breve aqui para o treino visual.",
  "Aucun rythme disponible pour le moment.": "Nenhum ritmo disponível no momento.",
  "⏱️ Entraînement :": "⏱️ Treino:",
  "Aucun chant disponible pour le moment.": "Nenhum canto disponível no momento.",
  "🎯 Quiz sur cette Toada": "🎯 Quiz sobre esta Toada",
  "Aucune fiche de culture disponible pour le moment.": "Nenhuma ficha de cultura disponível no momento.",
  "Aucune fiche de lutherie/atelier disponible pour le moment.": "Nenhuma ficha de lutheria/oficina disponível no momento.",
  "Atelier": "Oficina",
  "⚡ Entraînements Sequenciad'Or": "⚡ Treinos do Sequenciador",
  "⚡ Défis": "⚡ Desafios",
  "Progression": "Evolução",
  "Défis Speed Trainer": "Desafios do Treinador",
  "Défis Réflexes": "Desafios de Reflexo",
  "Conducteurs à trous": "Conduções com lacunas",
  "paliers franchis": "níveis alcançados",
  "signaux maîtrisés": "sinais dominados",
  "morceaux validés": "músicas validadas",
  "Défis Rythmiques": "Desafios Rítmicos",
  "Défi Réflexe Mestre": "Desafio de Reflexo do Mestre",
  "Conducteur à Trous": "Condução com Lacunas",
  "Général": "Geral",
  "Global troupe": "Geral do grupo",
  "Assiduité & Pratique troupe": "Frequência & Prática do grupo",
  "Paliers franchis": "Níveis alcançados",
  "progression globale": "evolução geral",
  "Moyenne troupe": "Média do grupo",
  "BPM moyen visé": "BPM médio pretendido",
  "Taux de complétion": "Taxa de conclusão",
  "Élèves actifs": "Alunos ativos",
  "sur": "de",
  "inscrits": "inscritos",
  "Progression des Paliers de Tempo (Speed Trainer)": "Evolução dos Níveis de Andamento (Treinador)",
  "Palier": "Nível",
  "bpm": "bpm",
  "validé": "validado",
  "non validé": "não validado",
  "en cours": "em andamento",
  "Objectif BPM": "Meta de BPM",
  "Entraînement": "Treino",
  "Détails de l'entraînement": "Detalhes do treino",
  "Rythme": "Ritmo",
  "Mesures": "Compassos",
  "Morceau": "Música",
  "Validation": "Validação",
  "Statut": "Status",
  "Score": "Pontuação",
  "Vitesse": "Velocidade",
  "Franchir ce palier": "Alcançar este nível",
  "Palier suivant": "Próximo nível",
  "Palier validé": "Nível validado",
  "Entraînements du morceau": "Treinos da música",
  "Vitesse de départ": "Velocidade inicial",
  "Vitesse cible": "Velocidade alvo",
  "Tous les paliers complétés !": "Todos os níveis concluídos!",

  // === REFLEX ===
  "Conducteur à trous": "Condução com lacunas",
  "Placez les bons signaux sur la frise chronologique pour mémoriser l'enchaînement": "Posicione os sinais corretos na linha do tempo para memorizar a sequência",
  "Conducteur validé sans faute ! Structure parfaitement mémorisée.": "Condução validada sem erros! Estrutura perfeitamente memorizada.",
  "Réinitialiser": "Reiniciar",
  "Valider le conducteur": "Validar a condução",
  "Chargement des signaux...": "Carregando sinais...",
  "Attention": "Atenção",
  "Il n'y a pas assez de signaux configurés avec une image. \n            Il en faut au minimum 4 pour générer un quiz.": "Não há sinais suficientes configurados com imagem.\n            São necessários pelo menos 4 para gerar um quiz.",
  "Retour à l'Atelier": "Voltar à Oficina",
  "Entraînement Terminé !": "Treino Concluído!",
  "Score :": "Pontuação:",
  "Recommencer": "Recomeçar",
  "Retour": "Voltar",
  "Défi Réflexe « Temps 1 »": "Desafio de Reflexo «Tempo 1»",
  "Temps 1 !": "Tempo 1!",
  "Écoute l'appel du Mestre...": "Escute o chamado do Mestre...",
  "Quelle est la tablature du Temps 1 ?": "Qual é a tablatura do Tempo 1?",
  "Chronomètre": "Cronômetro",
  "Précision": "Precisão",
  "Essai": "Tentativa",
  "Manqué !": "Errou!",
  "Bravo !": "Parabéns!",
  "Temps écoulé": "Tempo esgotado",
  "Question suivante": "Próxima pergunta",
  "Voir les résultats": "Ver os resultados",
  "Défi Réflexe terminé !": "Desafio de Reflexo concluído!",
  "Recommencer le défi": "Recomeçar o desafio",
  "Quitter": "Sair",
  "Identifie le signal du Mestre": "Identifique o sinal do Mestre",
  "Geste du Mestre": "Gesto do Mestre",
  "Quel est ce signal ?": "Qual é este sinal?",
  "Convention": "Convenção",
  "Signal": "Sinal",
  "Mesure": "Compasso",
  "Choisir ce signal": "Escolher este sinal",
  "Valider la sélection": "Confirmar a seleção",
  "Retirer le signal": "Remover o sinal",
  "Timeline du morceau": "Linha do tempo da música",
  "Lecture audio": "Reprodução de áudio",
  "Pause": "Pausa",
  "Lecture": "Tocar",
  "Arrêt": "Parar",
  "Signal manquant à la mesure": "Sinal faltando no compasso",
  "Glissez ou cliquez pour poser le signal": "Arraste ou clique para posicionar o sinal",
  "Vérifier mon conducteur": "Conferir minha condução",
  "Tout est correct ! Conducteur validé !": "Tudo certo! Condução validada!",
  "Des erreurs ont été détectées. Corrigez les cases rouges.": "Foram encontrados erros. Corrija os compassos em vermelho.",
  "Écouter l'extrait": "Ouvir o trecho",
  "Signal à la Mesure": "Sinal no Compasso",
  "Quel geste ou appel le Mestre déclenche-t-il ici ?": "Qual gesto ou chamado o Mestre aciona aqui?",
  "Fermer": "Fechar",
  "✓ Actuellement posé": "✓ Atualmente posicionado",
  "Retirer le geste de cette case": "Remover o gesto deste compasso",
  "Signal cible": "Sinal alvo",
  "Appel du Mestre": "Chamado do Mestre",
  "Bonne réponse": "Resposta correta",
  "Mauvaise réponse": "Resposta incorreta",
  "Signaux de commandement": "Sinais de comando",
  "Tablature interactive": "Tablatura interativa",
  "Choisir la bonne tablature": "Escolher a tablatura correta",
  "Écouter l'appel": "Ouvir o chamado",
  "Positionner le geste": "Posicionar o gesto",
  "Case vide": "Espaço vazio",
  "Frise chronologique": "Linha do tempo",
  "Retirer": "Remover",
  "Confirmer": "Confirmar",
  "Annuler": "Cancelar",
  "Aide mémoire": "Guia de consulta",
  "Mesure suivante": "Próximo compasso",
  "Mesure précédente": "Compasso anterior",

  // === PROGRESS ===
  "Évaluation": "Avaliação",
  "Auto-évaluation": "Autoavaliação",
  "Niveau de pratique": "Nível de prática",
  "Chants & Toadas": "Cantos & Toadas",
  "Toadas de saison": "Toadas da temporada",
  "Paroles & Structure": "Letras & Estrutura",
  "Rythme associé": "Ritmo associado",
  "Puxador / Rôle": "Puxador / Papel",
  "Tonalité": "Tonalidade",
  "Statistiques de chant": "Estatísticas de canto",
  "Taux de maîtrise": "Taxa de domínio",
  "Chants appris": "Cantos aprendidos",
  "Danse & Chorégraphie": "Dança & Coreografia",
  "Passes & Évolution": "Passos & Evolução",
  "Chorégraphies de saison": "Coreografias da temporada",
  "Pupitres de percussion": "Naipes de percussão",
  "Tableau de bord percussion": "Painel de percussão",
  "Membres par famille": "Integrantes por naipe",
  "Score moyen": "Média de pontuação",
  "Configuration des QCM": "Configuração dos QCM",
  "Gérer les distracteurs": "Gerenciar distratores",
  "Ajouter un leurre": "Adicionar distrator",
  "Leurres configurés": "Distratores configurados",
  "Type de quiz": "Tipo de quiz",
  "Nombre de questions": "Número de perguntas",
  "Durée par question": "Tempo por pergunta",
  "Statistiques des Roda Quiz": "Estatísticas dos Roda Quiz",
  "Taux de réussite global": "Taxa geral de acerto",
  "Participations": "Participações",
  "Questions répondues": "Perguntas respondidas",
  "Test à l'aveugle (Blind Test)": "Blind Test (Teste às cegas)",
  "Écoutez l'extrait et devinez": "Escute o trecho e adivinhe",
  "Quiz :": "Quiz:",
  "Question": "Pergunta",
  "Illustration de la question": "Ilustração da pergunta",
  "✅ Bien joué !": "✅ Muito bem!",
  "🌱 Presque !": "🌱 Quase lá!",
  "La bonne réponse était :": "A resposta correta era:",
  "Question Suivante ➔": "Próxima Pergunta ➔",
  "Voir le Résultat 🏆": "Ver o Resultado 🏆",
  "Résultat du Quiz": "Resultado do Quiz",
  "Score final :": "Pontuação final:",
  "Bel effort !": "Belo esforço!",
  "Excellent ! Quel talent !": "Excelente! Que talento!",
  "Pas mal du tout !": "Muito bom!",
  "Encore un peu d'entraînement !": "Mais um pouco de treino!",
  "Recommencer le quiz": "Recomeçar o quiz",
  "Terminer": "Concluir",
  "Toada": "Toada",
  "Chant": "Canto",
  "Notice": "Ficha",
  "Fiche culturelle": "Ficha cultural",
  "Catégorie": "Categoria",
  "Date d'apprentissage": "Data de aprendizagem",
  "Niveau global": "Nível geral",
  "Progression troupe": "Evolução do grupo",
  "Membres actifs": "Membros ativos",
  "Détails de la Toada": "Detalhes da Toada",
  "Actions": "Ações",
  "Modifier": "Editar",
  "Supprimer": "Excluir",
  "Enregistrer": "Salvar",
  "Fermer la fenêtre": "Fechar a janela",
  "Filtrer par catégorie": "Filtrar por categoria",
  "Rechercher...": "Buscar...",
  "Toutes les catégories": "Todas as categorias",
  "Aucun élément trouvé": "Nenhum elemento encontrado",
  "Ajouter une toada": "Adicionar toada",
  "Ajouter une fiche": "Adicionar ficha",
  "Morceau de saison": "Música da temporada",
  "Global": "Geral",
  "Détail & Actions": "Detalhes & Ações",
  "Aucune chorégraphie configurée": "Nenhuma coreografia configurada",
  "Chorégraphie": "Coreografia",
  "Danseur / Danseuse": "Dançarino / Dançarina",
  "Difficulté": "Dificuldade",
  "Rythmes": "Ritmos",
  "Pas de base": "Passos básicos",
  "Variations": "Variações",
  "Complétion": "Conclusão",
  "Membres": "Integrantes",
  "Suivi": "Acompanhamento",
  "Configuration": "Configuração",
  "Paramètres": "Parâmetros",
  "Distracteurs": "Distratores",
  "Leurres": "Distratores",
  "Banque de questions": "Banco de perguntas",
  "Nouveau leurre": "Novo distrator",
  "Modifier le leurre": "Editar distrator",
  "Supprimer le leurre": "Excluir distrator",
  "Blind Test": "Blind Test",
  "Écouter": "Ouvir",
  "Devinez le morceau": "Adivinhe a música",
  "Choix multiple": "Múltipla escolha",
  "Temps restant": "Tempo restante",
  "Points": "Pontos",
  "Bonnes réponses": "Respostas corretas",
  "Erreurs": "Erros",
  "Statistiques": "Estatísticas",
  "Historique": "Histórico",
  "Session": "Sessão",
  "Roda Quiz": "Roda Quiz",
  "Parties jouées": "Partidas jogadas",
  "Moyenne": "Média",
  "Meilleur score": "Melhor pontuação",
  "Classement": "Classificação",
  "Podium": "Pódio",

  // === CARDS ===
  "Nomenclature & Pièces usinées (": "Nomenclatura & Peças usinadas (",
  "maîtrisée": "dominada",
  "▲ Réduire": "▲ Recolher",
  "▼ Détails par pièce": "▼ Detalhes por peça",
  "étape": "etapa",
  "d'usinage": "de usinagem",
  "• Mat. :": "• Mat.:",
  "Quiz Pièce": "Quiz da Peça",
  "Préparation de ta session...": "Preparando sua sessão...",
  "Voulez-vous vraiment supprimer ce signal ? Il ne sera plus disponible dans les quiz.": "Tem certeza de que deseja excluir este sinal? Ele não estará mais disponível nos quizzes.",
  "Paroles du chant": "Letra do canto",
  "Voir les paroles complètes": "Ver a letra completa",
  "Traduction & Signification": "Tradução & Significado",
  "Notice culturelle": "Ficha cultural",
  "Origines & Histoire": "Origens & História",
  "Anecdotes de tradition": "Histórias da tradição",
  "Pièces & Composants": "Peças & Componentes",
  "Nomenclature": "Nomenclatura",
  "Progression de fabrication": "Progresso de confecção",
  "Outils nécessaires": "Ferramentas necessárias",
  "Guide d'apprentissage": "Guia de aprendizagem",
  "Documents pédagogiques": "Documentos pedagógicos",
  "Télécharger la fiche": "Baixar a ficha",
  "Session quotidienne": "Sessão diária",
  "Objectif du jour": "Meta do dia",
  "Signes & Gestes du Mestre": "Sinais & Gestos do Mestre",
  "Gestion des signaux": "Gestão de sinais",
  "Paroles": "Letra",
  "Auteur": "Autor",
  "Compositeur": "Compositor",
  "Origine": "Origem",
  "Signification": "Significado",
  "Contexte": "Contexto",
  "Tradition": "Tradição",
  "Nação": "Nação",
  "Morceau lié": "Música vinculada",
  "Fiche": "Ficha",
  "Télécharger": "Baixar",
  "Ouvrir": "Abrir",
  "Consulter": "Consultar",
  "Matériaux": "Materiais",
  "Étapes": "Etapas",
  "Fabrication": "Confecção",
  "Lutherie": "Lutheria",
  "Outils": "Ferramentas",
  "Sécurité": "Segurança",
  "Conseils du Mestre": "Conselhos do Mestre",
  "Guide": "Guia",
  "Notice pédagogique": "Ficha pedagógica",
  "Document": "Documento",
  "Ressources": "Recursos",
  "Révision": "Revisão",
  "Objectif": "Meta",
  "Défi du jour": "Desafio do dia",
  "Pratiquer": "Praticar",
  "Signes": "Sinais",
  "Gestes": "Gestos",
  "Ajouter un signal": "Adicionar sinal",
  "Modifier le signal": "Editar sinal",
  "Supprimer le signal": "Excluir sinal",
  "Nom du signal": "Nome do sinal",
  "Image du signal": "Imagem do sinal",
  "Description": "Descrição"
};

// Fonction de traduction générique de repli
function translateToPt(frText) {
  const trimmed = frText.trim();
  if (ptTranslations[trimmed]) return ptTranslations[trimmed];

  // Remplacements contextuels Maracatu
  let pt = trimmed
    .replace(/morceau/gi, 'música')
    .replace(/morceaux/gi, 'músicas')
    .replace(/chant/gi, 'canto')
    .replace(/chants/gi, 'cantos')
    .replace(/toada/gi, 'toada')
    .replace(/toadas/gi, 'toadas')
    .replace(/palier/gi, 'nível')
    .replace(/paliers/gi, 'níveis')
    .replace(/entraînement/gi, 'treino')
    .replace(/entraînements/gi, 'treinos')
    .replace(/signal/gi, 'sinal')
    .replace(/signaux/gi, 'sinais')
    .replace(/mestre/gi, 'Mestre')
    .replace(/geste/gi, 'gesto')
    .replace(/gestes/gi, 'gestos')
    .replace(/mesure/gi, 'compasso')
    .replace(/mesures/gi, 'compassos')
    .replace(/rythme/gi, 'ritmo')
    .replace(/rythmes/gi, 'ritmos')
    .replace(/fiche/gi, 'ficha')
    .replace(/fiches/gi, 'fichas')
    .replace(/paroles/gi, 'letras')
    .replace(/danse/gi, 'dança')
    .replace(/percussion/gi, 'percussão')
    .replace(/fermer/gi, 'fechar')
    .replace(/retour/gi, 'voltar')
    .replace(/valider/gi, 'confirmar')
    .replace(/annuler/gi, 'cancelar')
    .replace(/supprimer/gi, 'excluir')
    .replace(/modifier/gi, 'editar')
    .replace(/ajouter/gi, 'adicionar')
    .replace(/enregistrer/gi, 'salvar');

  return pt;
}

// Construction de la map finale
const finalMap = { carnet: {}, reflex: {}, progress: {}, cards: {} };

for (const [sub, keys] of Object.entries(draft)) {
  for (const [key, item] of Object.entries(keys)) {
    const frText = item.fr;
    const ptText = ptTranslations[frText] || translateToPt(frText);
    finalMap[sub][key] = {
      fr: frText,
      pt: ptText
    };
  }
}

fs.writeFileSync('scripts/pedagogy_lot2_bilingual_map.json', JSON.stringify(finalMap, null, 2), 'utf8');
console.log('✅ pedagogy_lot2_bilingual_map.json généré avec succès !');

// Vérification de la parité
for (const [sub, keys] of Object.entries(finalMap)) {
  const total = Object.keys(keys).length;
  const missingPt = Object.values(keys).filter(k => !k.pt || k.pt.trim() === '').length;
  console.log(`  - ${sub} : ${total} clés (Manquants PT : ${missingPt})`);
}
