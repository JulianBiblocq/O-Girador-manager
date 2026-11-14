import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  getGeneralConversationId,
  ensureGeneralGroupConversation,
  resolveZapDisplayName
} from './generalGroupChatUtils';
import { uploadChatAttachment } from './attachmentUploadUtils';
import { dispatchBulkInAppAndPushNotification, NOTIFICATION_TYPES } from './inAppNotificationService';

/**
 * Expédie un contenu partagé (photo, PDF, texte ou lien YouTube/web) directement
 * dans la discussion « 💬 Le Zap » de l'association.
 */
export async function shareToGeneralGroupChat({
  sharedPayload,
  caption = '',
  user,
  profileData,
  groupId
}) {
  const effectiveGroupId = groupId || profileData?.groupId || 'Samambaia';
  if (!user?.uid || !effectiveGroupId) {
    throw new Error('Utilisateur ou association non identifié.');
  }

  // 1. Garantir l'existence du canal Le Zap et récupérer la liste des participants
  const conversationId =
    (await ensureGeneralGroupConversation({ userId: user.uid, groupId: effectiveGroupId })) ||
    getGeneralConversationId(effectiveGroupId);

  const convRef = doc(db, 'conversations', conversationId);
  let participantIds = [user.uid];
  let convName = '💬 Le Zap';

  try {
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      const cData = convSnap.data();
      if (Array.isArray(cData.participantIds) && cData.participantIds.length > 0) {
        participantIds = cData.participantIds;
      }
      if (cData.name) convName = resolveZapDisplayName(cData.name, '💬 Le Zap');
    }
  } catch (err) {
    console.warn('shareToGeneralGroupChat - Lecture participants :', err?.message || err);
  }

  // 2. Compression et téléversement du fichier éventuel (image ou PDF)
  let imageUrl = null;
  let thumbnailUrl = null;
  let mediaName = null;
  let fileUrl = null;
  let fileName = null;

  if (sharedPayload?.file) {
    const uploadRes = await uploadChatAttachment({ file: sharedPayload.file, groupId: effectiveGroupId });
    if (uploadRes?.success && uploadRes?.url) {
      if (uploadRes.isImage) {
        imageUrl = uploadRes.url;
        thumbnailUrl = uploadRes.url;
        mediaName = uploadRes.fileName;
      } else {
        fileUrl = uploadRes.url;
        fileName = uploadRes.fileName;
      }
    }
  }

  // 3. Construction du message texte (avec URL incluse pour déclencher ChatYouTubePreview)
  const trimmedCaption = String(caption || '').trim();
  const sharedUrl = String(sharedPayload?.url || '').trim();
  let combinedText = trimmedCaption;
  if (sharedUrl && !combinedText.includes(sharedUrl)) {
    combinedText = combinedText ? `${combinedText}\n${sharedUrl}` : sharedUrl;
  }

  const effectiveContent =
    combinedText || (imageUrl ? '📷 Photo' : fileUrl ? `📎 ${fileName || 'Fichier joint'}` : '');
  if (!effectiveContent && !imageUrl && !fileUrl) {
    throw new Error('Aucun contenu à partager.');
  }

  const nowIso = new Date().toISOString();
  const senderFullName = profileData?.prenom
    ? `${profileData.prenom} ${profileData.nom || ''}`.trim()
    : user.displayName || 'Membre';

  // 4. Écriture dans conversation_messages et mise à jour de la conversation
  const msgRef = await addDoc(collection(db, 'conversation_messages'), {
    conversationId,
    groupId: effectiveGroupId,
    participantIds,
    senderId: user.uid,
    senderName: senderFullName,
    senderAvatar: profileData?.photoURL || user?.photoURL || '',
    content: effectiveContent,
    imageUrl,
    thumbnailUrl,
    mediaName,
    fileUrl,
    fileName,
    timestamp: nowIso,
    replyTo: null,
    reactions: {}
  });

  await updateDoc(convRef, {
    updatedAt: nowIso,
    lastMessage: { content: effectiveContent, imageUrl, fileUrl, fileName, senderId: user.uid, senderName: senderFullName, timestamp: nowIso },
    [`readStatus.${user.uid}`]: nowIso
  });

  // 5. Diffusion des notifications aux autres membres du groupe
  const otherParticipants = participantIds.filter((uid) => uid !== user.uid);
  if (otherParticipants.length > 0) {
    const cleanSnippet = effectiveContent.length > 80 ? `${effectiveContent.slice(0, 80)}...` : effectiveContent;
    dispatchBulkInAppAndPushNotification({
      recipientIds: otherParticipants,
      groupId: effectiveGroupId,
      type: NOTIFICATION_TYPES.CHAT_GROUP,
      titre: `👥 ${convName} : ${senderFullName}`,
      message: `"${cleanSnippet}"`,
      targetUrl: `/forum?tab=groups&conversationId=${conversationId}`,
      sendPush: true
    }).catch(() => {});
  }

  return { conversationId, messageId: msgRef.id };
}
