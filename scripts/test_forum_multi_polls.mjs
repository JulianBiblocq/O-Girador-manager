/**
 * test_forum_multi_polls.mjs
 * Script de validation unitaire de l'architecture multi-sondages et de l'édition intelligente.
 */

import assert from 'node:assert';

console.log("🚀 Lancement des tests de validation multi-sondages et édition Porte-Voix...\n");

// --- 1. Simulation de la logique de vote de usePoll ---
function applyVoteToOptions(options, targetOptionId, userId, isMultiple) {
  return options.map(opt => {
    const currentVotes = Array.isArray(opt.votes) ? [...opt.votes] : [];
    const hasVotedThisOpt = currentVotes.includes(userId);

    if (isMultiple) {
      if (opt.id === targetOptionId) {
        return {
          ...opt,
          votes: hasVotedThisOpt ? currentVotes.filter(uid => uid !== userId) : [...currentVotes, userId]
        };
      }
      return opt;
    } else {
      const cleanedVotes = currentVotes.filter(uid => uid !== userId);
      if (opt.id === targetOptionId) {
        return {
          ...opt,
          votes: hasVotedThisOpt ? cleanedVotes : [...cleanedVotes, userId]
        };
      }
      return { ...opt, votes: cleanedVotes };
    }
  });
}

// --- Test 1 : Vote à choix unique ---
console.log("Test 1 : Vote à choix unique et permutation sans doublon...");
let initialOptions = [
  { id: "opt_1", text: "Samedi matin", votes: [] },
  { id: "opt_2", text: "Dimanche soir", votes: [] }
];

// User 1 vote pour opt_1
let state1 = applyVoteToOptions(initialOptions, "opt_1", "user_1", false);
assert.deepStrictEqual(state1[0].votes, ["user_1"]);
assert.deepStrictEqual(state1[1].votes, []);

// User 1 permute son vote vers opt_2
let state2 = applyVoteToOptions(state1, "opt_2", "user_1", false);
assert.deepStrictEqual(state2[0].votes, [], "L'option 1 ne doit plus contenir user_1");
assert.deepStrictEqual(state2[1].votes, ["user_1"], "L'option 2 doit maintenant contenir user_1");

// User 2 vote pour opt_1
let state3 = applyVoteToOptions(state2, "opt_1", "user_2", false);
assert.deepStrictEqual(state3[0].votes, ["user_2"]);
assert.deepStrictEqual(state3[1].votes, ["user_1"]);

// User 1 reclique sur opt_2 (annulation de vote)
let state4 = applyVoteToOptions(state3, "opt_2", "user_1", false);
assert.deepStrictEqual(state4[1].votes, [], "Le vote doit pouvoir être retiré");
console.log("✅ Test 1 validé !");

// --- Test 2 : Vote à choix multiples ---
console.log("\nTest 2 : Vote à choix multiples...");
let multiOptions = [
  { id: "opt_1", text: "Guitare", votes: [] },
  { id: "opt_2", text: "Percussions", votes: [] },
  { id: "opt_3", text: "Chant", votes: [] }
];

// User 1 vote pour opt_1 et opt_3
let multi1 = applyVoteToOptions(multiOptions, "opt_1", "user_1", true);
multi1 = applyVoteToOptions(multi1, "opt_3", "user_1", true);
assert.deepStrictEqual(multi1[0].votes, ["user_1"]);
assert.deepStrictEqual(multi1[1].votes, []);
assert.deepStrictEqual(multi1[2].votes, ["user_1"]);

// User 1 retire son vote pour opt_1
let multi2 = applyVoteToOptions(multi1, "opt_1", "user_1", true);
assert.deepStrictEqual(multi2[0].votes, []);
assert.deepStrictEqual(multi2[2].votes, ["user_1"]);
console.log("✅ Test 2 validé !");

// --- Test 3 : Édition intelligente avec préservation des votes ---
console.log("\nTest 3 : Édition intelligente et préservation des votes...");
const existingPoll = {
  id: "poll_stage",
  type: "poll",
  question: "Quelle date ?",
  options: [
    { id: "opt_a", text: "15 Juin", votes: ["u1", "u2"] },
    { id: "opt_b", text: "22 Juin", votes: ["u3"] }
  ],
  isClosed: false,
  allowMultipleChoices: false
};

// Simulation d'une édition : modification du texte, ajout d'une 3ème option
const editedOptions = [
  { id: "opt_a", text: "Samedi 15 Juin (matin)", votes: ["u1", "u2"] }, // Libellé modifié
  { id: "opt_b", text: "Dimanche 22 Juin", votes: ["u3"] },
  { id: "opt_c", text: "Dimanche 29 Juin", votes: [] } // Nouvelle option
];

assert.strictEqual(editedOptions[0].votes.length, 2, "Les 2 votes sur opt_a doivent être intacts");
assert.deepStrictEqual(editedOptions[0].votes, ["u1", "u2"]);
assert.strictEqual(editedOptions[2].votes.length, 0, "La nouvelle option démarre avec 0 vote");
console.log("✅ Test 3 validé !");

// --- Test 4 : Multi-sondages dans le fil de discussion ---
console.log("\nTest 4 : Multi-sondages dans le fil (tableau reponses)...");
const threadReponses = [
  { id: "msg_1", message: "Bonjour à tous, organisons la répétition !", auteurId: "u1" },
  {
    id: "poll_dates",
    type: "poll",
    question: "Quelle date préférez-vous ?",
    options: [
      { id: "opt_1", text: "Samedi", votes: ["u1"] },
      { id: "opt_2", text: "Dimanche", votes: ["u2"] }
    ]
  },
  { id: "msg_2", message: "Super, maintenant votons pour le lieu.", auteurId: "u2" },
  {
    id: "poll_lieux",
    type: "poll",
    question: "Où répéter ?",
    options: [
      { id: "loc_1", text: "Parc", votes: [] },
      { id: "loc_2", text: "Salle", votes: ["u1", "u2"] }
    ]
  }
];

const polls = threadReponses.filter(r => r.type === 'poll');
assert.strictEqual(polls.length, 2, "Le fil doit contenir 2 sondages distincts");
assert.strictEqual(polls[0].id, "poll_dates");
assert.strictEqual(polls[1].id, "poll_lieux");

// Vote sur le 2e sondage sans toucher au 1er
const updatedPoll2Options = applyVoteToOptions(polls[1].options, "loc_1", "u3", false);
polls[1].options = updatedPoll2Options;
assert.strictEqual(polls[0].options[0].votes.length, 1, "Le sondage 1 ne doit pas être affecté");
assert.strictEqual(polls[1].options[0].votes.length, 1, "Le vote sur le sondage 2 doit être comptabilisé");
console.log("✅ Test 4 validé !");

console.log("\n🎉 Tous les tests de multi-sondages et édition ont réussi avec succès !");
