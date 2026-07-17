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
    console.warn(`Méthode ${req.method} non autorisée.`);
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

  if (!secretKey) {
    console.error(`Clé de signature non configurée pour l'association ${groupId}.`);
    return res.status(400).send("Association non configurée ou clé de signature manquante.");
  }

  // Sécurité : Vérification de la signature HelloAsso
  const signature = req.headers['x-ha-signature'];
  if (!signature) {
    console.error("Signature manquante.");
    return res.status(401).send("Signature manquante.");
  }

  // Calcul du HMAC SHA256 pour vérifier l'authenticité de la requête
  const expectedSignature = crypto.createHmac('sha256', secretKey).update(req.rawBody).digest('hex');
  
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

  try {
    const payload = req.body;
    console.log("Payload reçu de HelloAsso :", JSON.stringify(payload));

    // On vérifie que c'est bien un événement de type "Order" ou "Payment"
    if (payload.eventType !== 'Order' && payload.eventType !== 'Payment') {
      console.log(`Événement de type ${payload.eventType} ignoré.`);
      return res.status(200).send("Événement ignoré.");
    }

    const payer = payload.data.payer;
    const payerEmail = (payer?.email || payload.data.email || "").toLowerCase().trim();
    if (!payerEmail) {
      console.error("Aucune adresse e-mail trouvée dans le payload.");
      return res.status(400).send("Adresse e-mail manquante.");
    }

    const amountCents = payload.data.amount?.total || payload.data.amount || 0;
    const amountEuros = amountCents / 100;
    const items = payload.data.items || [];
    const optionsPayees = items.map(item => item.name);

    console.log(`Paiement reçu de HelloAsso pour ${payerEmail}. Montant: ${amountEuros}€. Articles:`, optionsPayees);

    // Récupération des options de cotisation définies pour l'association
    let optionsCotisation = [];
    let hasBaseAdhesionInOrder = false;
    const matchedOptionIds = [];

    console.log(`Récupération des paramètres pour l'association : ${groupId}`);
    const assocDoc = await db.collection("associations").doc(groupId).get();
    if (assocDoc.exists()) {
      const assocData = assocDoc.data();
      optionsCotisation = assocData.optionsCotisation || [];
    } else {
      console.warn(`L'association avec l'ID ${groupId} n'existe pas.`);
    }

    // Algorithme de correspondance des articles avec les options configurées
    for (const item of items) {
      const itemNameNormalized = item.name.toLowerCase().trim();
      let matched = false;

      for (const opt of optionsCotisation) {
        const optNameNormalized = opt.nom.toLowerCase().trim();
        if (itemNameNormalized.includes(optNameNormalized) || optNameNormalized.includes(itemNameNormalized)) {
          matchedOptionIds.push(opt.id);
          matched = true;
          console.log(`Option correspondante trouvée : "${opt.nom}" -> ID: ${opt.id}`);
          break;
        }
      }

      if (!matched) {
        // Si l'article ressemble à l'adhésion de base
        if (itemNameNormalized.includes("adhesion") || 
            itemNameNormalized.includes("adhésion") || 
            itemNameNormalized.includes("cotisation") || 
            itemNameNormalized.includes("base") || 
            itemNameNormalized.includes("membership")) {
          hasBaseAdhesionInOrder = true;
          console.log(`Adhésion de base identifiée pour l'article : "${item.name}"`);
        } else {
          console.log(`Article non identifié (ignoré ou hors cotisation) : "${item.name}"`);
        }
      }
    }

    const transactionData = {
      date: admin.firestore.Timestamp.now(),
      amount: amountEuros,
      options: optionsPayees, // Libellés originaux pour lisibilité dans l'historique
      source: "HelloAsso",
      helloAssoOrderId: payload.data.id || ""
    };

    // Recherche de l'utilisateur dans Firestore
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", payerEmail).limit(1).get();

    if (!snapshot.empty) {
      // CAS 1 : L'UTILISATEUR EXISTE DÉJÀ
      const userDoc = snapshot.docs[0];
      const userRef = userDoc.ref;
      const userData = userDoc.data();

      const updates = {
        paymentStatus: "paid",
        cotisationAjour: true
      };

      if (hasBaseAdhesionInOrder) {
        updates.adhesionBase = true;
      }

      if (matchedOptionIds.length > 0) {
        updates.selectedOptions = admin.firestore.FieldValue.arrayUnion(...matchedOptionIds);
      }

      await userRef.update(updates);
      await userRef.collection("transactions").add(transactionData);
      
      console.log(`✅ Trésorerie mise à jour pour l'utilisateur existant : ${payerEmail}`);
    } else {
      // CAS 2 : L'UTILISATEUR N'EXISTE PAS ENCORE -> Mise en attente
      await db.collection("pending_payments").doc(payerEmail).set({
        email: payerEmail,
        paymentStatus: "paid",
        cotisationAjour: true,
        adhesionBase: hasBaseAdhesionInOrder,
        options: matchedOptionIds, // Contient les IDs d'options mappés
        transaction: transactionData,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`⏳ Utilisateur inconnu. Paiement mis en attente pour : ${payerEmail}`);
    }

    res.status(200).send("Webhook traité avec succès.");
  } catch (error) {
    console.error("Erreur lors du traitement du webhook:", error);
    res.status(500).send("Erreur interne lors du traitement du webhook.");
  }
});

// 2. Le Trigger à la création d'un utilisateur
exports.onUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const userSnapshot = event.data;
  if (!userSnapshot) return;

  const userData = userSnapshot.data();
  if (!userData.email) return;

  const userEmail = userData.email.toLowerCase().trim();
  console.log(`Nouvel utilisateur détecté en création : ${userEmail}`);

  // On vérifie s'il y a un paiement en attente pour cet email
  const pendingRef = db.collection("pending_payments").doc(userEmail);
  const pendingDoc = await pendingRef.get();

  if (pendingDoc.exists()) {
    const pendingData = pendingDoc.data();
    console.log(`Paiement en attente trouvé pour ${userEmail}. Application des droits...`);

    const updates = {
      paymentStatus: pendingData.paymentStatus || "paid",
      cotisationAjour: pendingData.cotisationAjour !== undefined ? pendingData.cotisationAjour : true
    };

    if (pendingData.adhesionBase) {
      updates.adhesionBase = true;
    }

    if (pendingData.options && pendingData.options.length > 0) {
      updates.selectedOptions = admin.firestore.FieldValue.arrayUnion(...pendingData.options);
    }

    // Mise à jour de la fiche utilisateur
    await userSnapshot.ref.update(updates);

    // Transfert de l'historique de transaction
    if (pendingData.transaction) {
      await userSnapshot.ref.collection("transactions").add({
        ...pendingData.transaction,
        date: admin.firestore.Timestamp.now() // Met à jour la date à la date d'association finale
      });
    }

    // Nettoyage de la file d'attente
    await pendingRef.delete();
    console.log(`🎉 Paiement en attente appliqué avec succès au nouvel utilisateur : ${userEmail}`);
  } else {
    console.log(`Aucun paiement en attente trouvé pour l'adresse e-mail : ${userEmail}`);
  }
});

// 3. Trigger pour l'envoi des notifications Push via FCM
exports.onAnnouncementCreated = onDocumentCreated("announcements/{announcementId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const announcement = snapshot.data();
  // Vérifie si la case à cocher pour l'envoi de la notification Push est active
  if (announcement.sendPushNotification !== true) {
    console.log("Envoi de notification Push non requis pour cette annonce.");
    return;
  }

  const title = announcement.titre || "Nouvelle annonce";
  const message = announcement.message || "";
  const groupId = announcement.groupId;

  if (!groupId) {
    console.warn("Aucun groupId trouvé sur l'annonce, envoi annulé.");
    return;
  }

  try {
    // 1. Récupérer tous les utilisateurs valides du groupe qui ont des fcmTokens enregistrés
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
      console.log("Aucun jeton FCM trouvé parmi les membres de ce groupe.");
      return;
    }

    // Retirer les doublons de jetons
    const uniqueTokens = [...new Set(tokens)];
    console.log(`Préparation de l'envoi à ${uniqueTokens.length} jetons FCM uniques.`);

    // 2. Structurer le payload de notification
    const payload = {
      notification: {
        title: title,
        body: message.length > 100 ? `${message.substring(0, 97)}...` : message
      },
      data: {
        announcementId: snapshot.id,
        click_action: "/forum" // navigation vers le porte-voix / forum
      }
    };

    // 3. Envoyer le message via FCM admin.messaging()
    const response = await admin.messaging().sendEachForMulticast({
      tokens: uniqueTokens,
      notification: payload.notification,
      data: payload.data
    });

    console.log(`Succès : ${response.successCount} messages envoyés. Échecs : ${response.failureCount}.`);

    // Optionnel : Nettoyage des jetons invalides (ex: tokens expirés ou non enregistrés)
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
        console.log(`Nettoyage de ${tokensToRemove.length} jetons FCM obsolètes...`);
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
        console.log("Nettoyage des jetons obsolètes terminé avec succès.");
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification Push FCM :", error);
  }
});

