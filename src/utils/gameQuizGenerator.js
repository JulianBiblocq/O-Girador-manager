// Générateur de questions de manche pour les Défis multijoueurs (Roda Quiz)
// Produit 5 questions aléatoires au format uniforme selon le thème choisi ('culture' ou 'rythme')

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CULTURE_BASE_QUESTIONS = [
  {
    questionText: "Quelle est la plus ancienne Nação de Maracatu de Baque Virado encore en activité ?",
    correctChoice: "Maracatu Nação Leão Coroado (fondée en 1863)",
    distractors: ["Maracatu Nação Porto Rico", "Maracatu Estrela Brilhante", "Maracatu Encanto da Alegria"],
    explanation: "Leão Coroado a été fondé en 1863 à Recife et perpétue la tradition du Maracatu séculaire."
  },
  {
    questionText: "Quel personnage du cortège royal porte la 'Calunga' (poupée sacrée) ?",
    correctChoice: "La Dama do Paço (Dame du Palais)",
    distractors: ["La Reine (Rainha)", "Le Porte-Étendard", "La Princesse"],
    explanation: "La Dama do Paço porte la Calunga, réceptacle de la force spirituelle (Axé) de la nation."
  },
  {
    questionText: "Quel Orixá, maître du fer et de la forge, est traditionnellement salué par les percussions ?",
    correctChoice: "Ogum",
    distractors: ["Iemanjá", "Oxóssi", "Oxum"],
    explanation: "Ogum, divinité des métaux et guerrier, protège les tambours et forge le son des gonguês."
  },
  {
    questionText: "Que signifie le mot 'Toada' dans la culture du Maracatu ?",
    correctChoice: "Le chant poétique entonné par le Mestre et repris par la troupe",
    distractors: ["La baguette courbe de l'alfaia", "Le pas de danse du roi", "La couronne dorée de la reine"],
    explanation: "La Toada est la poésie chantée qui guide le rythme et raconte les louanges de la nation."
  },
  {
    questionText: "Dans quelle région historique du Brésil est né le Maracatu de Baque Virado ?",
    correctChoice: "Le Pernambouc (Recife et Olinda)",
    distractors: ["Salvador de Bahia", "Rio de Janeiro", "Le Minas Gerais"],
    explanation: "Le Maracatu de Baque Virado est indissociable du Pernambouc et du carnaval de Recife."
  },
  {
    questionText: "Quelle Orixá des eaux douces et de la beauté est associée à la couleur dorée ?",
    correctChoice: "Oxum",
    distractors: ["Iansã", "Nanã", "Iemanjá"],
    explanation: "Oxum règne sur les rivières, les cascades, la fertilité et l'or."
  },
  {
    questionText: "Comment appelle-t-on le tambour grave en bois et peaux de chèvre ou de bœuf ?",
    correctChoice: "L'Alfaia",
    distractors: ["Le Timbal", "L'Atabaque", "Le Surdo"],
    explanation: "L'Alfaia est le cœur battant du Maracatu, accordée par cordage et coins de serrage."
  },
  {
    questionText: "Quel instrument métallique lourd donne la pulsation de tête ?",
    correctChoice: "Le Gonguê",
    distractors: ["L'Agogô", "La Cuíca", "Le Pandeiro"],
    explanation: "Le Gonguê est une cloche de fer forgé qui pose la clé rythmique maîtresse."
  }
];

const RYTHME_BASE_QUESTIONS = [
  {
    questionText: "Quelle baguette souple est tenue dans la main faible pour frapper l'alfaia ?",
    correctChoice: "Le Bacalhau (baguette fine et souple)",
    distractors: ["La Mailloche (baguette lourde)", "Le Balai métallique", "Le Fuste en bois dur"],
    explanation: "Le bacalhau est une tige fine tenue d'une main pour les frappes sèches et syncopées."
  },
  {
    questionText: "Lorsque le Mestre lève les deux bras en croix vers le ciel, quelle est l'action demandée ?",
    correctChoice: "Arrêt immédiat ou coupure nette (Parada)",
    distractors: ["Accélération du tempo de 20 BPM", "Départ du solo de caixas", "Passage au tempo lent"],
    explanation: "Le croisement des bras signale traditionnellement la coupure ou la fin de section."
  },
  {
    questionText: "Sur quel instrument de Maracatu joue-t-on le tapis rapide 'Arrasto' ?",
    correctChoice: "La Caixa et le Tarol",
    distractors: ["L'Alfaia Marcante", "Le Gonguê", "L'Agbê uniquement"],
    explanation: "Les caixas et tarols assurent le tapis continu et la dynamique d'entraînement (Arrasto)."
  },
  {
    questionText: "Comment s'appelle l'alfaia la plus grave qui pose les temps forts du tempo ?",
    correctChoice: "L'Alfaia Marcante (ou Marcação)",
    distractors: ["L'Alfaia Meião", "L'Alfaia Repinique", "L'Alfaia Tarol"],
    explanation: "La Marcante est le tambour le plus profond, marquant les battements fondamentaux."
  },
  {
    questionText: "Quel geste permet de faire sonner les perles de la calebasse 'Agbê' (Xequerê) ?",
    correctChoice: "Une rotation de la main avec projection sèche contre la paume",
    distractors: ["Frapper avec une mailloche en caoutchouc", "Frotter avec une baguette", "Souffler dans l'ouverture"],
    explanation: "L'Agbê se joue par balancement et torsion rythmée des perles tressées contre la calebasse."
  },
  {
    questionText: "Dans le Baque Virado, sur quel temps la pulsation du Gonguê est-elle ancrée ?",
    correctChoice: "Sur le Temps 1 fort du cycle à 4 temps",
    distractors: ["Uniquement sur les contre-temps faibles", "Sur le temps 3 uniquement", "Aléatoirement"],
    explanation: "Le gonguê pose le temps 1 fondateur, permettant à toutes les alfaias de se caler."
  },
  {
    questionText: "À quoi servent les coins en bois taillés insérés sous les cordages de l'alfaia ?",
    correctChoice: "À tendre les peaux pour ajuster la note (accordage)",
    distractors: ["À poser l'instrument sans le salir", "À ranger les baguettes de secours", "À amplifier le son"],
    explanation: "L'enfoncement des coins augmente la tension des cordes et monte la note de la peau."
  },
  {
    questionText: "Quel signal du Mestre indique généralement la reprise du motif de base (Baque) ?",
    correctChoice: "Un coup de sifflet d'appel (Apito) suivi d'une toada",
    distractors: ["Poser le gonguê au sol", "Tourner le dos à la troupe", "Lâcher ses deux baguettes"],
    explanation: "L'apito du Mestre prévient la troupe d'un changement de dynamique ou du retour au baque."
  }
];

/**
 * Génère 5 questions prêtes pour la manche multijoueur selon le thème.
 */
export function generateGameQuestions(theme = 'rythme', contextData = {}) {
  const pool = theme === 'culture' ? CULTURE_BASE_QUESTIONS : RYTHME_BASE_QUESTIONS;
  const shuffledPool = shuffle(pool);
  const selectedRaw = shuffledPool.slice(0, 5);

  return selectedRaw.map((raw, idx) => {
    const allChoices = [raw.correctChoice, ...raw.distractors];
    const shuffledChoices = shuffle(allChoices);
    const correctIndex = shuffledChoices.indexOf(raw.correctChoice);

    return {
      id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
      questionText: raw.questionText,
      choices: shuffledChoices,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: raw.explanation || 'Bonne réponse !',
      mediaUrl: raw.mediaUrl || null,
      mediaType: raw.mediaType || null
    };
  });
}
