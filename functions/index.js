const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// 1. Le Webhook HelloAsso
exports.helloAssoWebhook = onRequest(async (req, res) => {
  // Accepte uniquement les requêtes POST
  if (req.method !== "POST") {
    console.error(`Méthode ${req.method} non autorisée.`);
    return res.status(405).send("Méthode non autorisée. Utilisez POST.");
  }

  // Extraction du groupId depuis les paramètres de requête
  const groupId = req.query.groupId;
  if (!groupId) {
    console.error("Aucun groupId fourni dans la requête.");
    return res.status(400).send("Association non configurée (groupId manquant).");
  }

  // Récupération de la clé de signature depuis Firestore pour cette association
  let secretKey = "";
  try {
    const credDoc = await db
      .collection("associations")
      .doc(groupId)
      .collection("private_settings")
      .doc("credentials")
      .get();

    if (credDoc.exists()) {
      secretKey = credDoc.data().helloAssoSignatureKey;
    }
  } catch (err) {
    console.error(`Erreur lors de la lecture des credentials pour le groupe ${groupId} :`, err);
    return res.status(500).send("Erreur interne lors de la récupération de la configuration.");
  }

  // Sécurité : Vérification de la signature HelloAsso si la clé est configurée
  // Sécurité : Vérification de la signature HelloAsso si la clé est configurée
  const signature = req.headers['x-ha-signature'];
  if (secretKey && secretKey.trim() && signature) {
    const cleanKey = secretKey.trim();
    const expectedSignature = crypto.createHmac('sha256', cleanKey).update(req.rawBody).digest('hex');
    let isVerified = false;
    try {
      isVerified = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (e) {
      isVerified = (signature === expectedSignature);
    }

    if (!isVerified) {
      console.error("Signature invalide ! Tentative d'usurpation.");
      return res.status(403).send("Signature invalide.");
    }
  }

  try {
    const payload = req.body || {};
    const data = payload.data || payload;
    const eventType = payload.eventType || "";

    // 1. Vérification du statut de paiement
    const paymentState = data.state || data.payment?.state || data.order?.state || data.status || "";
    if (paymentState && !['Authorized', 'Paid', 'Processed'].includes(paymentState)) {
      console.log(`Paiement ignoré : statut = ${paymentState}`);
      return res.status(200).send("Ignored");
    }

    // 2. Recherche robuste de l'utilisateur (UID puis Email)
    let uid = req.query.uid || data.metadata?.uid || data.metadata?.userId || data.metadata?.user_id;

    if (!uid && Array.isArray(data.customFields)) {
      const field = data.customFields.find(f => f.name && f.name.toLowerCase().includes('uid'));
      if (field) uid = field.answer || field.value;
    }

    const items = data.items || data.payments?.[0]?.items || data.order?.items || [];

    if (!uid && Array.isArray(items)) {
      for (const item of items) {
        if (Array.isArray(item.customFields)) {
          const field = item.customFields.find(f => f.name && f.name.toLowerCase().includes('uid'));
          if (field) {
            uid = field.answer || field.value;
            break;
          }
        }
      }
    }

    if (uid) uid = String(uid).trim();

    const payer = data.payer || data.order?.payer || data.user || {};
    const email = (payer.email || data.email || req.query.email || "").toLowerCase().trim();
    let userName = `${payer.firstName || ''} ${payer.lastName || ''}`.trim();

    let userRef = null;
    let userData = null;

    if (uid) {
      const docSnap = await db.collection("users").doc(uid).get();
      if (docSnap.exists) {
        userRef = docSnap.ref;
        userData = docSnap.data();
      }
    }

    // Fallback : recherche par e-mail si l'UID n'a rien donné
    if (!userRef && email) {
      let snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (snapshot.empty) {
        // Recherche insensible à la casse dans le groupe
        const groupUsersSnap = await db.collection("users").where("groupId", "==", groupId).get();
        groupUsersSnap.forEach(d => {
          const uData = d.data();
          if (uData.email && uData.email.toLowerCase().trim() === email) {
            userRef = d.ref;
            userData = uData;
          }
        });
      } else {
        userRef = snapshot.docs[0].ref;
        userData = snapshot.docs[0].data();
      }
    }

    const optionsPayees = items.map(item => item.name || item.customLabel).filter(Boolean);

    // Calcul exact du montant en Euros (HelloAsso API v5 envoie les montants en centimes)
    let amountCents = 0;
    if (typeof data.amount === 'number') {
      amountCents = data.amount;
    } else if (data.amount && typeof data.amount.total === 'number') {
      amountCents = data.amount.total;
    } else if (typeof data.totalAmount === 'number') {
      amountCents = data.totalAmount;
    }

    const amountEuros = amountCents > 0 ? Number((amountCents / 100).toFixed(2)) : 0;

    // Récupération des options de cotisation configurées pour l'association
    let optionsCotisation = [];
    let hasBaseAdhesion = true; // Tout paiement validé confirme l'adhésion de base
    const matchedOptionIds = [];

    const assocDoc = await db.collection("associations").doc(groupId).get();
    if (assocDoc.exists()) {
      optionsCotisation = assocDoc.data().optionsCotisation || [];
    }

    // Algorithme d'appariement des articles avec les options de l'association
    for (const item of items) {
      const itemNameNormalized = (item.name || item.customLabel || "").toLowerCase().trim();

      for (const opt of optionsCotisation) {
        const optNameNormalized = (opt.nom || "").toLowerCase().trim();
        if (optNameNormalized && (itemNameNormalized.includes(optNameNormalized) || optNameNormalized.includes(itemNameNormalized))) {
          if (!matchedOptionIds.includes(opt.id)) {
            matchedOptionIds.push(opt.id);
          }
        }
      }
    }

    if (!userRef) {
      console.warn(`Utilisateur introuvable pour l'UID: ${uid} ou l'e-mail: ${email}. Mise en attente (pending_payments).`);
      // Stockage dans pending_payments pour le trigger onUserCreate
      await db.collection("pending_payments").doc(email || `pending_${Date.now()}`).set({
        groupId: groupId,
        email: email,
        userName: userName,
        paymentStatus: "paid",
        cotisationAjour: true,
        adhesionBase: hasBaseAdhesion,
        options: matchedOptionIds,
        amountEuros: amountEuros,
        optionsPayees: optionsPayees,
        helloAssoOrderId: String(data.id || data.orderId || 'N/A'),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return res.status(200).send("Paiement mis en attente d'inscription utilisateur.");
    }

    // 3. Mise à jour du profil membre (3 éléments cruciaux)
    const userUpdates = {
      paymentStatus: "paid",
      cotisationAjour: true,
      adhesionBase: true,
      dateAdhesion: admin.firestore.Timestamp.now(),
      derniereCotisationDate: new Date().toISOString()
    };

    if (optionsPayees.length > 0) {
      userUpdates.optionsPayees = admin.firestore.FieldValue.arrayUnion(...optionsPayees);
    }

    if (matchedOptionIds.length > 0) {
      userUpdates.selectedOptions = admin.firestore.FieldValue.arrayUnion(...matchedOptionIds);
    }

    await userRef.update(userUpdates);

    // 4. Création de l'historique dans la sous-collection membre
    const helloAssoIdStr = String(data.id || data.orderId || 'N/A');
    const transactionData = {
      date: admin.firestore.Timestamp.now(),
      amount: amountEuros,
      options: optionsPayees,
      source: "HelloAsso",
      helloAssoOrderId: helloAssoIdStr
    };
    await userRef.collection("transactions").add(transactionData);

    // 5. Création de la transaction de Trésorerie globale (avec déduplication)
    const userNomComplet = userData ? `${userData.prenom || ''} ${userData.nom || ''}`.trim() : userName;
    const nomAffiche = userNomComplet || email || "Membre";
    const libelleOptions = optionsPayees.length > 0 ? ` (${optionsPayees.join(', ')})` : '';

    if (helloAssoIdStr !== 'N/A') {
      const existingTxSnap = await db.collection("transactions")
        .where("groupId", "==", groupId)
        .where("helloAssoOrderId", "==", helloAssoIdStr)
        .limit(1)
        .get();

      if (!existingTxSnap.empty) {
        console.log(`Transaction HelloAsso ${helloAssoIdStr} déjà enregistrée en trésorerie.`);
        return res.status(200).send("Success (already recorded)");
      }
    }

    await db.collection("transactions").add({
      groupId: groupId,
      date: admin.firestore.Timestamp.now(),
      type: "recette",
      montant: amountEuros,
      categorie: "Cotisations",
      libelle: `Adhésion + Options HelloAsso - ${nomAffiche}${libelleOptions}`,
      source: "HelloAsso",
      helloAssoOrderId: helloAssoIdStr,
      userId: userRef.id,
      payerEmail: email
    });

    console.log(`Paiement traité avec succès pour ${email || userRef.id} (${amountEuros} €).`);
    return res.status(200).send("Success");

  } catch (error) {
    console.error("Erreur Webhook HelloAsso :", error);
    return res.status(500).send("Internal Server Error");
  }
});

// 2. Le Trigger à la création d'un utilisateur
exports.onUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const userSnapshot = event.data;
  if (!userSnapshot) return;

  const userData = userSnapshot.data();
  if (!userData.email) return;

  const userEmail = userData.email.toLowerCase().trim();

  // On vérifie s'il y a un paiement en attente pour cet email
  const pendingRef = db.collection("pending_payments").doc(userEmail);
  const pendingDoc = await pendingRef.get();

  if (pendingDoc.exists()) {
    const pendingData = pendingDoc.data();

    const updates = {
      paymentStatus: pendingData.paymentStatus || "paid",
      cotisationAjour: pendingData.cotisationAjour !== undefined ? pendingData.cotisationAjour : true,
      adhesionBase: true,
      dateAdhesion: admin.firestore.Timestamp.now(),
      derniereCotisationDate: new Date().toISOString()
    };

    if (pendingData.options && pendingData.options.length > 0) {
      updates.selectedOptions = admin.firestore.FieldValue.arrayUnion(...pendingData.options);
    }

    // Mise à jour de la fiche utilisateur
    await userSnapshot.ref.update(updates);

    // Transfert de l'historique de transaction personnel
    await userSnapshot.ref.collection("transactions").add({
      date: admin.firestore.Timestamp.now(),
      amount: pendingData.amountEuros || 0,
      options: pendingData.optionsPayees || [],
      source: "HelloAsso",
      helloAssoOrderId: pendingData.helloAssoOrderId || "N/A"
    });

    // Création de la transaction de trésorerie globale si absente
    if (pendingData.groupId) {
      const userNomComplet = `${userData.prenom || ''} ${userData.nom || ''}`.trim() || pendingData.userName || userEmail;
      const libelleOptions = (pendingData.optionsPayees || []).length > 0 ? ` (${pendingData.optionsPayees.join(', ')})` : '';

      await db.collection("transactions").add({
        groupId: pendingData.groupId,
        date: admin.firestore.Timestamp.now(),
        type: "recette",
        montant: pendingData.amountEuros || 0,
        categorie: "Cotisations",
        libelle: `Adhésion + Options HelloAsso - ${userNomComplet}${libelleOptions}`,
        source: "HelloAsso",
        helloAssoOrderId: pendingData.helloAssoOrderId || "N/A",
        userId: userSnapshot.ref.id,
        payerEmail: userEmail
      });
    }

    // Nettoyage de la file d'attente
    await pendingRef.delete();
  }
});

/**
 * Helper générique pour l'envoi de notifications Push FCM à un groupe d'utilisateurs.
 *
 * @param {string} groupId Identifiant du groupe d'association
 * @param {string} title Titre de la notification
 * @param {string} body Corps de la notification
 * @param {Object} dataPayload Données additionnelles pour le clic
 */
async function sendGroupFcmNotification(groupId, title, body, dataPayload = {}) {
  if (!groupId) {
    console.error("Aucun groupId fourni, envoi de la notification Push annulé.");
    return;
  }

  try {
    const usersSnap = await db.collection("users")
      .where("groupId", "==", groupId)
      .get();

    const tokens = [];
    usersSnap.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.fcmTokens)) {
        data.fcmTokens.forEach((tok) => {
          if (tok && typeof tok === "string") {
            tokens.push(tok);
          }
        });
      }
    });

    if (tokens.length === 0) {
      return;
    }

    const uniqueTokens = [...new Set(tokens)];
    const targetUrl = dataPayload.url || dataPayload.link || dataPayload.click_action || "/";

    const payload = {
      tokens: uniqueTokens,
      notification: {
        title: title,
        body: body.length > 100 ? `${body.substring(0, 97)}...` : body
      },
      data: {
        ...dataPayload,
        url: targetUrl,
        link: targetUrl,
        click_action: targetUrl
      },
      webpush: {
        fcmOptions: {
          link: targetUrl
        }
      }
    };

    const response = await admin.messaging().sendEachForMulticast(payload);

    if (response.failureCount > 0) {
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === "messaging/invalid-registration-token" ||
            errorCode === "messaging/registration-token-not-registered"
          ) {
            tokensToRemove.push(uniqueTokens[idx]);
          }
        }
      });

      if (tokensToRemove.length > 0) {
        const batch = db.batch();
        usersSnap.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.fcmTokens)) {
            const intersection = data.fcmTokens.filter(t => tokensToRemove.includes(t));
            if (intersection.length > 0) {
              batch.update(doc.ref, {
                fcmTokens: admin.firestore.FieldValue.arrayRemove(...intersection)
              });
            }
          }
        });
        await batch.commit();
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification Push FCM :", error);
  }
}

// 3. Trigger pour l'envoi des notifications Push des Annonces (Mégaphone)
exports.onAnnouncementCreated = onDocumentCreated("announcements/{announcementId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const announcement = snapshot.data();
  if (announcement.sendPushNotification !== true) {
    return;
  }

  const title = announcement.titre || "Nouvelle annonce";
  const message = announcement.message || "";
  // Redirection dynamique vers l'actionLink s'il est spécifié, sinon vers le forum
  const targetUrl = announcement.actionLink || "/forum";

  await sendGroupFcmNotification(announcement.groupId, title, message, {
    url: targetUrl,
    link: targetUrl,
    click_action: targetUrl,
    announcementId: snapshot.id
  });
});

// 4. Trigger pour l'envoi des notifications Push lors de la création d'un événement (Agenda)
exports.onEventCreated = onDocumentCreated("events/{eventId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const eventData = snapshot.data();
  if (eventData.sendPushNotification !== true) {
    return;
  }

  const eventTitle = eventData.titre || "Événement";
  let dateFormatted = "";
  if (eventData.date) {
    try {
      const d = new Date(eventData.date);
      if (!isNaN(d.getTime())) {
        dateFormatted = d.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      } else {
        dateFormatted = String(eventData.date);
      }
    } catch (e) {
      dateFormatted = String(eventData.date);
    }
  }

  const title = "📅 Nouvel événement ajouté !";
  const body = `${eventTitle}${dateFormatted ? ` - le ${dateFormatted}` : ""}`;
  const targetUrl = `/agenda?eventId=${snapshot.id}`;

  await sendGroupFcmNotification(eventData.groupId, title, body, {
    url: targetUrl,
    link: targetUrl,
    click_action: targetUrl,
    eventId: snapshot.id
  });
});

// 5. Trigger pour l'envoi des notifications Push lors de la création d'un sujet sur le Porte-Voix (Forum)
exports.onForumThreadCreated = onDocumentCreated("forum/{threadId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const thread = snapshot.data();
  if (thread.sendPushNotification !== true) {
    return;
  }

  const threadTitle = thread.titre || "Nouveau sujet";
  const channelName = thread.categorie || "Général";
  const title = "🗣️ Nouveau sujet sur le Porte-Voix !";
  const body = `${threadTitle} (dans le salon ${channelName})`;
  const targetUrl = `/forum?threadId=${snapshot.id}`;

  await sendGroupFcmNotification(thread.groupId, title, body, {
    url: targetUrl,
    link: targetUrl,
    click_action: targetUrl,
    threadId: snapshot.id
  });
});
