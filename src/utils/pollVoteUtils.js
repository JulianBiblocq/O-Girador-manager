import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import { cleanFirestorePayload } from './firestoreUtils';

/**
 * Utilitaires de gestion des votes sur les sondages d'événements et d'ateliers.
 * Garantit zéro valeur `undefined` dans Firestore, utilise la notation pointée
 * `votes.${uid}` et assure un repli transparent sur `inscriptions` si les règles
 * de sécurité restreignent les membres standards au champ `inscriptions`.
 */

/**
 * Extrait le choix ('dispo' | 'indispo' | null) depuis une entrée de vote
 * (compatible format chaîne historique ou objet structuré).
 */
export function resolveVoteChoice(voteEntry) {
  if (!voteEntry) return null;
  if (typeof voteEntry === 'string') {
    return voteEntry === 'dispo' || voteEntry === 'indispo' ? voteEntry : null;
  }
  if (typeof voteEntry === 'object') {
    const raw = voteEntry.choice || voteEntry.status || voteEntry.vote || null;
    return raw === 'dispo' || raw === 'indispo' ? raw : null;
  }
  return null;
}

/**
 * Construit une carte unifiée `{ [uid]: 'dispo' | 'indispo' }` pour un créneau de sondage
 * en fusionnant `eventDoc.votes` et le repli `eventDoc.inscriptions`.
 */
export function getEffectiveEventVotes(eventDoc) {
  const result = {};
  if (!eventDoc || typeof eventDoc !== 'object') return result;

  const rawVotes = eventDoc.votes && typeof eventDoc.votes === 'object' ? eventDoc.votes : {};
  const voteTimestamps = {};

  Object.entries(rawVotes).forEach(([uid, entry]) => {
    const choice = resolveVoteChoice(entry);
    if (choice) {
      result[uid] = choice;
      if (entry && typeof entry === 'object' && entry.updatedAt) {
        voteTimestamps[uid] = entry.updatedAt;
      }
    }
  });

  // Fusionner les réponses issues du repli `inscriptions` sur les événements en mode sondage
  const isPollEvent = Boolean(
    eventDoc.isPoll || eventDoc.status === 'sondage' || eventDoc.pollGroupId
  );
  if (isPollEvent && Array.isArray(eventDoc.inscriptions)) {
    eventDoc.inscriptions.forEach((ins) => {
      const uid = ins?.userId;
      if (!uid) return;
      const insChoice =
        ins.pollVote === 'dispo' || ins.pollVote === 'indispo'
          ? ins.pollVote
          : ins.status === 'present'
            ? 'dispo'
            : ins.status === 'absent'
              ? 'indispo'
              : null;
      if (!insChoice) return;

      const existingTs = voteTimestamps[uid];
      const insTs = ins.updatedAt || ins.timestamp || '';
      if (!result[uid] || (insTs && existingTs && insTs > existingTs)) {
        result[uid] = insChoice;
      }
    });
  }

  return result;
}

/**
 * Construit un payload de vote strictement nettoyé (aucune clé `undefined`).
 */
export function buildSanitizedVotePayload(choice, user, profileData) {
  const rawPrimaryInst =
    profileData?.instrumentPrincipal ||
    profileData?.instrument ||
    (Array.isArray(profileData?.instrumentsJoues) ? profileData.instrumentsJoues[0] : '') ||
    '';
  const rawSecondaryInst =
    profileData?.instrumentSecondaire ||
    (Array.isArray(profileData?.instrumentsJoues) ? profileData.instrumentsJoues[1] : '') ||
    '';

  return cleanFirestorePayload({
    choice: choice || '',
    status: choice || '',
    uid: user?.uid || '',
    prenom: profileData?.prenom || user?.displayName || '',
    nom: profileData?.nom || '',
    instrument: rawPrimaryInst || '',
    instrumentSecondaire: rawSecondaryInst || '',
    updatedAt: new Date().toISOString()
  });
}

/**
 * Enregistre le vote d'un adhérent sur un créneau de sondage avec notation pointée
 * `votes.${user.uid}` et repli automatique sur `inscriptions` si nécessaire.
 */
export async function submitPollVote({ optionEvent, user, profileData, choice }) {
  if (!optionEvent?.id || !user?.uid) return;

  const effectiveVotes = getEffectiveEventVotes(optionEvent);
  const currentChoice = effectiveVotes[user.uid] || null;
  const nextChoice = currentChoice === choice ? null : choice;
  const eventRef = doc(db, 'events', optionEvent.id);
  const nowIso = new Date().toISOString();
  const cleanVote = nextChoice ? buildSanitizedVotePayload(nextChoice, user, profileData) : null;

  try {
    await updateDoc(eventRef, {
      [`votes.${user.uid}`]: nextChoice ? cleanVote : deleteField(),
      updatedAt: nowIso
    });
  } catch {
    // Repli compatible avec la règle Firestore autorisant `inscriptions` à tous les membres du groupe
    const currentInscriptions = Array.isArray(optionEvent.inscriptions) ? [...optionEvent.inscriptions] : [];
    const filtered = currentInscriptions.filter((ins) => ins && ins.userId !== user.uid);
    if (nextChoice && cleanVote) {
      filtered.push(
        cleanFirestorePayload({
          userId: user.uid,
          userName: `${cleanVote.prenom} ${cleanVote.nom}`.trim() || 'Membre',
          prenom: cleanVote.prenom || '',
          nom: cleanVote.nom || '',
          status: nextChoice === 'dispo' ? 'present' : 'absent',
          pollVote: nextChoice,
          instrument: cleanVote.instrument || '',
          instrumentSecondaire: cleanVote.instrumentSecondaire || '',
          instrumentChoisi: cleanVote.instrument || 'Autre',
          transport: null,
          places: 0,
          instruments: '',
          instrumentImposeParMestre: false,
          demandeRemboursementKm: false,
          besoinTransportInstrument: false,
          updatedAt: nowIso
        })
      );
    }
    await updateDoc(eventRef, { inscriptions: cleanFirestorePayload(filtered) });
  }
}

