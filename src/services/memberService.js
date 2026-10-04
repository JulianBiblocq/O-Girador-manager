import { collection, doc, getDoc, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { canonicalizeGroupId } from '../utils/tenantUtils';

/**
 * Service de gestion et réconciliation des membres créés manuellement par le Bureau
 */

/**
 * Crée manuellement un document adhérent dans Firestore par le Bureau (Secrétariat / Mestre / Admin)
 * Le membre est créé avec le statut actif direct (isNew: false, statutActuel: 'active').
 *
 * @param {Object} memberData Données saisies dans la modale
 * @param {string} memberData.prenom Prénom de l'adhérent (obligatoire)
 * @param {string} memberData.nom Nom de l'adhérent (obligatoire)
 * @param {string} [memberData.email] Email (optionnel)
 * @param {string} [memberData.telephone] Téléphone (optionnel)
 * @param {boolean} [memberData.pratiquePercussion] Pratique la percussion
 * @param {boolean} [memberData.pratiqueDanse] Pratique la danse
 * @param {string} [memberData.instrument] Pupitre principal
 * @param {boolean} [memberData.cotisationAjour] Cotisation à jour
 * @param {string} groupId Identifiant de l'association
 * @param {Object} authorProfile Profil de l'utilisateur ayant saisi le membre
 * @returns {Promise<{ id: string, success: boolean }>}
 */
export async function createManualMember(memberData, groupId, authorProfile) {
  if (!memberData?.prenom?.trim() || !memberData?.nom?.trim()) {
    throw new Error("Le prénom et le nom sont obligatoires pour inscrire un membre.");
  }

  const canonicalGroup = canonicalizeGroupId(groupId) || 'Samambaia';
  const cleanEmail = (memberData.email || '').trim().toLowerCase();
  const cleanPhone = (memberData.telephone || '').trim();
  const mainInst = (memberData.instrument || '').trim();
  const isPaid = Boolean(memberData.cotisationAjour);

  // Génération d'une référence Firestore avec identifiant unique
  const usersCollection = collection(db, 'users');
  const newMemberRef = doc(usersCollection);

  const payload = {
    prenom: memberData.prenom.trim(),
    nom: memberData.nom.trim(),
    email: cleanEmail,
    telephone: cleanPhone,
    pratiquePercussion: memberData.pratiquePercussion !== undefined ? Boolean(memberData.pratiquePercussion) : true,
    pratiqueDanse: Boolean(memberData.pratiqueDanse),
    instrument: mainInst,
    instrumentPrincipal: mainInst,
    instrumentsJoues: mainInst ? [mainInst] : [],
    cotisationAjour: isPaid,
    paymentStatus: isPaid ? 'paid' : 'unpaid',
    cotisationStatus: isPaid ? 'payee' : 'non_payee',
    isCotisationExoneree: false,
    statutActuel: 'active',
    status: 'active',
    isNew: false, // Actif direct : pas de sas d'attente
    onboardingCompleted: true,
    role: 'membre',
    tags: ['Inscrit manuellement'],
    groupId: canonicalGroup,
    isManualEntry: true,
    createdAt: new Date().toISOString(),
    createdBy: authorProfile?.uid || authorProfile?.id || 'bureau',
    dateCreationManuelle: new Date().toISOString()
  };

  // Sécurité anti-undefined pour Firestore
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  await setDoc(newMemberRef, payload);
  return { id: newMemberRef.id, success: true, member: { id: newMemberRef.id, ...payload } };
}

/**
 * Réconcilie automatiquement un compte Auth utilisateur avec une fiche membre pré-existante
 * créée manuellement par le Bureau avec la même adresse email.
 *
 * Si un document existe sous un identifiant distinct de authUser.uid :
 * 1. Transfère l'ensemble des données du membre vers users/${authUser.uid}
 * 2. Marque la fiche réconciliée avec authUser.uid
 * 3. Supprime l'ancien document temporaire pour ne laisser aucun doublon dans l'annuaire
 *
 * @param {Object} authUser Utilisateur Firebase Auth connecté (currentUser)
 * @param {string} [groupId] Identifiant de groupe (optionnel pour filtrage)
 * @returns {Promise<Object|null>} Le profil réconcilié, ou null si aucune réconciliation nécessaire
 */
export async function reconcilePreExistingMember(authUser, groupId = null) {
  if (!authUser?.uid || !authUser?.email) return null;
  const cleanEmail = authUser.email.trim().toLowerCase();

  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('email', '==', cleanEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Rechercher s'il existe une fiche dont l'ID Firestore diffère de l'UID Auth actuel
    const preExistingDoc = snapshot.docs.find(d => d.id !== authUser.uid);
    if (!preExistingDoc) return null;

    const preExistingData = preExistingDoc.data();
    console.info(`memberService - Réconciliation trouvée pour ${cleanEmail} (ID temporaire: ${preExistingDoc.id} -> UID: ${authUser.uid})`);

    const canonicalGroup = canonicalizeGroupId(preExistingData.groupId || groupId) || 'Samambaia';

    // Préparation de la fiche unifiée sur l'UID Auth officiel
    const unifiedPayload = {
      ...preExistingData,
      uid: authUser.uid,
      id: authUser.uid,
      email: cleanEmail,
      groupId: canonicalGroup,
      isNew: false, // Maintien du statut validé actif accordé par le Bureau
      statutActuel: 'active',
      status: 'active',
      reconciledAt: new Date().toISOString(),
      reconciledFromDocId: preExistingDoc.id
    };

    // Enregistrement sur users/${authUser.uid}
    const targetRef = doc(db, 'users', authUser.uid);
    await setDoc(targetRef, unifiedPayload, { merge: true });

    // Suppression de l'ancienne fiche temporaire pour éradiquer tout doublon dans l'annuaire
    await deleteDoc(preExistingDoc.ref);

    console.info(`memberService - Réconciliation réussie avec succès pour ${cleanEmail}`);
    return unifiedPayload;
  } catch (err) {
    console.error("memberService - Erreur lors de la réconciliation de l'adhérent :", err);
    return null;
  }
}
