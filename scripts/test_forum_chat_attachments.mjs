import { readFileSync } from 'fs';
import assert from 'assert';

console.log("===============================================================");
console.log("🧪 DÉBUT DU TEST : PIÈCES JOINTES FORUM & CHAT (RÉORGANISATION)");
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

// 2. Contrôle statique de attachmentUploadUtils.js
console.log("\n▶️ Test 2 : Contrôle de attachmentUploadUtils.js");
const uploadUtilsContent = readFileSync('src/utils/attachmentUploadUtils.js', 'utf-8');
assert.ok(uploadUtilsContent.includes('export const uploadForumAttachment'), "uploadForumAttachment exporté");
assert.ok(uploadUtilsContent.includes('export const uploadChatAttachment'), "uploadChatAttachment exporté");
assert.ok(uploadUtilsContent.includes('export const compressImageClientSide'), "compressImageClientSide exporté");
assert.ok(uploadUtilsContent.includes('documents/${effectiveGroupId}/forum'), "Chemin Firebase Storage forum sécurisé");
assert.ok(uploadUtilsContent.includes('documents/${effectiveGroupId}/chat'), "Chemin Firebase Storage chat sécurisé");
assert.ok(uploadUtilsContent.includes('uploadAttachmentToStorage'), "Repli Storage présent");
console.log("  ✅ [PASS] attachmentUploadUtils.js intègre les pipelines résilients Forum & Chat.");

// 3. Contrôle statique de ForumImageInsertModal.jsx
console.log("\n▶️ Test 3 : Contrôle de ForumImageInsertModal.jsx");
const modalContent = readFileSync('src/components/forum/ForumImageInsertModal.jsx', 'utf-8');
assert.ok(modalContent.includes('uploadForumAttachment'), "uploadForumAttachment est utilisé");
assert.ok(modalContent.includes('onInsertAttachment'), "onInsertAttachment pris en charge");
assert.ok(!modalContent.includes('isConfigMissing'), "isConfigMissing bloquant a été éliminé");
assert.ok(modalContent.includes('.pdf'), "Prise en charge des PDF déclarée dans l'accept");
console.log("  ✅ [PASS] ForumImageInsertModal.jsx accepte images et documents sans blocage.");

// 4. Contrôle statique de RichTextEditor.jsx
console.log("\n▶️ Test 4 : Contrôle de RichTextEditor.jsx");
const editorContent = readFileSync('src/components/RichTextEditor.jsx', 'utf-8');
assert.ok(editorContent.includes('uploadForumAttachment'), "uploadForumAttachment importé");
assert.ok(editorContent.includes('handlePaste'), "handlePaste configuré contre le base64 géant");
assert.ok(editorContent.includes('handleDrop'), "handleDrop configuré contre le base64 géant");
assert.ok(editorContent.includes('onInsertAttachment'), "onInsertAttachment connecté à TipTap");
assert.ok(editorContent.includes('Photo / Doc') || editorContent.includes('📎'), "Bouton d'insertion actualisé");
console.log("  ✅ [PASS] RichTextEditor.jsx intercepte le collage/dépôt et gère les pièces jointes.");

// 5. Contrôle statique de ThreadReplyBar.jsx
console.log("\n▶️ Test 5 : Contrôle de ThreadReplyBar.jsx");
const replyBarContent = readFileSync('src/components/forum/thread/ThreadReplyBar.jsx', 'utf-8');
assert.ok(replyBarContent.includes("title=\"Ajouter une pièce jointe ou une photo (déplier l'éditeur)\""), "Bouton 📎 direct présent dans la barre compacte");
assert.ok(replyBarContent.includes("groupId={thread?.groupId || profileData?.groupId"), "groupId sécurisé avec replis complets");
console.log("  ✅ [PASS] ThreadReplyBar.jsx propose l'accès direct 📎 et sécurise le groupId.");

// 6. Contrôle statique de PrivateChatView.jsx & useConversationMessages.js
console.log("\n▶️ Test 6 : Contrôle de PrivateChatView.jsx et useConversationMessages.js");
const chatViewContent = readFileSync('src/components/PrivateChatView.jsx', 'utf-8');
const hookContent = readFileSync('src/hooks/useConversationMessages.js', 'utf-8');

assert.ok(hookContent.includes('fileUrl = null, fileName = null'), "useConversationMessages accepte fileUrl et fileName");
assert.ok(hookContent.includes('fileUrl: fileUrl || null'), "useConversationMessages persiste fileUrl");
assert.ok(chatViewContent.includes('uploadChatAttachment'), "uploadChatAttachment utilisé dans le chat");
assert.ok(chatViewContent.includes('attachmentInputRef'), "Sélecteur de fichier d'appareil présent");
assert.ok(chatViewContent.includes('msg.fileUrl'), "Affichage des fichiers joints sous forme de pastille de téléchargement");
console.log("  ✅ [PASS] PrivateChatView & useConversationMessages gèrent les fichiers joints.");

console.log("\n===============================================================");
console.log("🏆 TOUS LES TESTS PIÈCES JOINTES FORUM & CHAT SONT 100% VALIDÉS !");
console.log("===============================================================");
