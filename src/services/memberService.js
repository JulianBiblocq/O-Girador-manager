import { collection, doc, setDoc, deleteDoc, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { canonicalizeGroupId, isValidTenantIdentifier, resolveCanonicalGroupFromFirestore } from '../utils/tenantUtils';

/**
 * Service de gestion et réconciliation des membres créés manuellement par le Bureau.
 * Interdit formellement toute écriture d'un profil sans identifiant d'association canonique valide.
 */
export async function createManualMember(memberData, groupId, authorProfile) {
  if (!memberData?.prenom?.trim() || !memberData?.nom?.trim()) {
    throw new Error("Le prénom et le nom sont obligatoires pour inscrire un membre.");
  }

  const rawTargetGroup = groupId || authorProfile?.groupId || '';
  const resolved = await resolveCanonicalGroupFromFirestore(db, rawTargetGroup, { persistLastTenant: false });
  const canonicalGroup = resolved.canonicalId || (isValidTenantIdentifier(rawTargetGroup) ? canonicalizeGroupId(rawTargetGroup) : '');
  if (!canonicalGroup) {
    throw new Error("Association introuvable : un identifiant de groupe valide est obligatoire pour inscrire un membre.");
  }

  const cleanEmail = (memberData.email || '').trim().toLowerCase();
  const cleanPhone = (memberData.telephone || '').trim();
  const mainInst = (memberData.instrument || '').trim();
  const isPaid = Boolean(memberData.cotisationAjour);

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
    isNew: false,
    onboardingCompleted: true,
    role: 'membre',
    tags: ['Inscrit manuellement'],
    groupId: canonicalGroup,
    isManualEntry: true,
    createdAt: new Date().toISOString(),
    createdBy: authorProfile?.uid || authorProfile?.id || 'bureau',
    dateCreationManuelle: new Date().toISOString()
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  await setDoc(newMemberRef, payload);
  return { id: newMemberRef.id, success: true, member: { id: newMemberRef.id, ...payload } };
}

/**
 * Réconcilie automatiquement un compte Auth utilisateur avec une fiche membre pré-existante
 * créée manuellement par le Bureau avec la même adresse e-mail (uniquement si un groupId valide existe).
 */
export async function reconcilePreExistingMember(authUser, groupId = null) {
  if (!authUser?.uid || !authUser?.email) return null;
  const cleanEmail = authUser.email.trim().toLowerCase();

  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, where('email', '==', cleanEmail)));
    if (snapshot.empty) return null;

    const preExistingDoc = snapshot.docs.find((d) => d.id !== authUser.uid);
    if (!preExistingDoc) return null;

    const preExistingData = preExistingDoc.data();
    const rawCandidate = preExistingData.groupId || groupId || '';
    if (!isValidTenantIdentifier(rawCandidate)) return null;

    const resolved = await resolveCanonicalGroupFromFirestore(db, rawCandidate, { persistLastTenant: true });
    const canonicalGroup = resolved.canonicalId || canonicalizeGroupId(rawCandidate);
    if (!canonicalGroup) return null;

    const preTokens = Array.isArray(preExistingData.fcmTokens)
      ? preExistingData.fcmTokens.filter(Boolean)
      : [];
    const unifiedPayload = {
      ...preExistingData,
      uid: authUser.uid,
      id: authUser.uid,
      email: cleanEmail,
      groupId: canonicalGroup,
      isNew: false,
      statutActuel: 'active',
      status: 'active',
      reconciledAt: new Date().toISOString(),
      reconciledFromDocId: preExistingDoc.id
    };
    delete unifiedPayload.fcmTokens;
    if (preTokens.length > 0) {
      unifiedPayload.fcmTokens = arrayUnion(...preTokens);
      unifiedPayload.pushOptInContract = true;
    }

    await setDoc(doc(db, 'users', authUser.uid), unifiedPayload, { merge: true });

    try {
      await deleteDoc(preExistingDoc.ref);
    } catch (delErr) {
      console.warn('memberService - Nettoyage ancien doc différé (droits non-admin) :', delErr?.message || delErr);
    }

    return unifiedPayload;
  } catch (err) {
    console.error("memberService - Erreur lors de la réconciliation de l'adhérent :", err);
    return null;
  }
}
