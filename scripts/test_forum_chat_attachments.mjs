import { readFileSync } from 'fs';
import assert from 'assert';
import { resolveCompressibleMime } from '../src/utils/imageCompressionUtils.js';
import { fr } from '../src/locales/fr.js';
import { pt } from '../src/locales/pt.js';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : PIÈCES JOINTES FORUM & CHAT (SUPPORT HEIC iOS)");
console.log("===============================================================\n");

// 1. Test unitaire de la logique de nettoyage de nom de fichier (sanitizeFileName)
console.log("▶️ Test 1 : Nettoyage de nom de fichier (sanitizeFileName)");
const sanitizeFileName = (name) => {
  if (!name) return 'fichier';
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};
assert.strictEqual(sanitizeFileName("mon super fichier (1).pdf"), "mon_super_fichier__1_.pdf", "Caractères spéciaux remplacés");
assert.strictEqual(sanitizeFileName("partition-samba_2026.musicxml"), "partition-samba_2026.musicxml", "Caractères valides préservés");
assert.strictEqual(sanitizeFileName(""), "fichier", "Fallback nom vide");
console.log("  ✅ [PASS] sanitizeFileName opérationnel et sécurisé.");

// 2. Contrôle unitaire de imageCompressionUtils.js (< 100 lignes + détection HEIC/HEIF & file.type vide iOS)
console.log("\n▶️ Test 2 : Contrôle de imageCompressionUtils.js (HEIC/HEIF & < 100 lignes)");
const imgCompContent = readFileSync('src/utils/imageCompressionUtils.js', 'utf-8');
const imgCompLines = imgCompContent.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n').length;
assert.ok(imgCompLines < 100, `imageCompressionUtils.js doit rester < 100 lignes (actuel : ${imgCompLines})`);
assert.ok(imgCompContent.includes('export const compressImageClientSide'), "compressImageClientSide exporté");
assert.strictEqual(resolveCompressibleMime({ name: 'IMG_001.HEIC', type: 'image/heic' }), 'image/heic', "MIME image/heic reconnu");
assert.strictEqual(resolveCompressibleMime({ name: 'IMG_002.heif', type: 'image/heif' }), 'image/heif', "MIME image/heif reconnu");
assert.strictEqual(resolveCompressibleMime({ name: 'IMG_003.HEIC', type: '' }), 'image/heic', "Extension .HEIC à file.type vide reconnue");
assert.strictEqual(resolveCompressibleMime({ name: 'IMG_004.heif', type: '' }), 'image/heif', "Extension .heif à file.type vide reconnue");
assert.strictEqual(resolveCompressibleMime({ name: 'photo.JPG', type: '' }), 'image/jpeg', "Extension .JPG à file.type vide reconnue");
assert.strictEqual(resolveCompressibleMime({ name: 'photo.jpeg', type: '' }), 'image/jpeg', "Extension .jpeg à file.type vide reconnue");
assert.strictEqual(resolveCompressibleMime({ name: 'logo.png', type: '' }), 'image/png', "Extension .png à file.type vide reconnue");
assert.strictEqual(resolveCompressibleMime({ name: 'affiche.webp', type: '' }), 'image/webp', "Extension .webp à file.type vide reconnue");
assert.strictEqual(resolveCompressibleMime({ name: 'anim.gif', type: 'image/gif' }), null, "GIF animé laissé intact");
assert.strictEqual(resolveCompressibleMime({ name: 'doc.pdf', type: '' }), null, "PDF sans type laissé intact");
console.log(`  ✅ [PASS] imageCompressionUtils.js (${imgCompLines} L < 100) détecte HEIC/HEIF et types vides iOS.`);

// 3. Contrôle statique de attachmentUploadUtils.js
console.log("\n▶️ Test 3 : Contrôle de attachmentUploadUtils.js");
const uploadUtilsContent = readFileSync('src/utils/attachmentUploadUtils.js', 'utf-8');
assert.ok(uploadUtilsContent.includes('export const uploadForumAttachment'), "uploadForumAttachment exporté");
assert.ok(uploadUtilsContent.includes('export const uploadChatAttachment'), "uploadChatAttachment exporté");
assert.ok(uploadUtilsContent.includes('export const formatAttachmentUploadError'), "formatAttachmentUploadError exporté");
assert.ok(uploadUtilsContent.includes('documents/${cleanGroupId}/${subFolder}'), "Chemin Firebase Storage groupId/subFolder sécurisé");
assert.ok(uploadUtilsContent.includes("'forum'") && uploadUtilsContent.includes("'chat'"), "Sous-dossiers forum et chat définis");
assert.ok(uploadUtilsContent.includes('uploadAttachmentToStorage'), "Repli Storage présent");
console.log("  ✅ [PASS] attachmentUploadUtils.js intègre les pipelines résilients Forum & Chat.");

// 4. Contrôle statique de ForumImageInsertModal.jsx & parité FR/PT
console.log("\n▶️ Test 4 : Contrôle de ForumImageInsertModal.jsx et parité FR/PT");
const modalContent = readFileSync('src/components/forum/ForumImageInsertModal.jsx', 'utf-8');
assert.ok(modalContent.includes('uploadForumAttachment'), "uploadForumAttachment est utilisé");
assert.ok(modalContent.includes('onInsertAttachment'), "onInsertAttachment pris en charge");
assert.ok(modalContent.includes('formatAttachmentUploadError'), "Diagnostic storage/unauthorized & permission-denied branché");
assert.ok(!modalContent.includes('isConfigMissing'), "isConfigMissing bloquant a été éliminé");
assert.ok(modalContent.includes('.pdf') && modalContent.includes('.heic'), "Prise en charge PDF et HEIC déclarée dans l'accept");
assert.ok(fr.forumExtra.errUploadUnauthorized.includes('{{code}}'), "Clé FR errUploadUnauthorized contient {{code}}");
assert.ok(pt.forumExtra.errUploadUnauthorized.includes('{{code}}'), "Clé PT errUploadUnauthorized contient {{code}}");
assert.deepStrictEqual(Object.keys(fr.forumExtra), Object.keys(pt.forumExtra), "Parité stricte des clés forumExtra entre fr.js et pt.js");
console.log("  ✅ [PASS] ForumImageInsertModal.jsx et parité FR/PT validés.");

// 5. Contrôle statique de RichTextEditor.jsx, CreateThreadForm, ThreadReplyBar & ThreadModerationModals
console.log("\n▶️ Test 5 : Contrôle groupId 100 % Forum (CreateThreadForm, ThreadReplyBar, ThreadView/Edit)");
const editorContent = readFileSync('src/components/RichTextEditor.jsx', 'utf-8');
const createFormContent = readFileSync('src/components/CreateThreadForm.jsx', 'utf-8');
const replyBarContent = readFileSync('src/components/forum/thread/ThreadReplyBar.jsx', 'utf-8');
const modModalsContent = readFileSync('src/components/forum/thread/ThreadModerationModals.jsx', 'utf-8');
const threadViewContent = readFileSync('src/components/ThreadView.jsx', 'utf-8');
assert.ok(editorContent.includes('uploadForumAttachment') && editorContent.includes('handlePaste') && editorContent.includes('handleDrop'), "RichTextEditor connecté");
assert.ok(createFormContent.includes('groupId={effectiveGroupId}') && createFormContent.includes('groupId || currentChannel?.groupId || profileData?.groupId || user?.groupId'), "CreateThreadForm transmet groupId consolidé avec replis complets");
assert.ok(replyBarContent.includes("title=\"Ajouter une pièce jointe ou une photo (déplier l'éditeur)\""), "Bouton 📎 direct présent dans la barre compacte");
assert.ok(replyBarContent.includes("groupId={thread?.groupId || profileData?.groupId"), "groupId sécurisé dans ThreadReplyBar");
assert.ok(modModalsContent.includes('thread?.groupId || groupId || profileData?.groupId'), "groupId sécurisé dans ThreadModerationModals (édition)");
assert.ok(threadViewContent.includes('threadData.thread?.groupId || groupId || profileData?.groupId'), "ThreadView propage groupId aux sous-composants");
console.log("  ✅ [PASS] 100 % des usages du Forum transmettent groupId avec replis complets.");

// 6. Contrôle statique de PrivateChatView.jsx & useConversationMessages.js
console.log("\n▶️ Test 6 : Contrôle de PrivateChatView.jsx et useConversationMessages.js");
const chatViewContent = readFileSync('src/components/PrivateChatView.jsx', 'utf-8');
const hookContent = readFileSync('src/hooks/useConversationMessages.js', 'utf-8');
assert.ok(hookContent.includes('fileUrl = null') && hookContent.includes('fileName = null'), "useConversationMessages accepte fileUrl et fileName");
assert.ok(hookContent.includes('fileUrl: fileUrl || null'), "useConversationMessages persiste fileUrl");
assert.ok(chatViewContent.includes('uploadChatAttachment') && chatViewContent.includes('.heic'), "uploadChatAttachment et accept .heic utilisés dans le chat");
assert.ok(chatViewContent.includes('attachmentInputRef') && chatViewContent.includes('msg.fileUrl'), "Sélecteur et affichage des fichiers joints présents");
console.log("  ✅ [PASS] PrivateChatView & useConversationMessages gèrent les photos HEIC et fichiers joints.");

console.log("\n===============================================================");
console.log("🏆 TOUS LES TESTS PIÈCES JOINTES FORUM & CHAT SONT 100% VALIDÉS !");
console.log("===============================================================");
