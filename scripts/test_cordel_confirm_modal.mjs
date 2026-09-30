import fs from 'fs';
import path from 'path';

console.log('🧪 Test de validation : Remplacement des window.confirm par CordelConfirmModal...');

// Test 1: CordelConfirmModal.jsx
const modalPath = path.resolve('src/components/common/CordelConfirmModal.jsx');
if (!fs.existsSync(modalPath)) {
  console.error('❌ CordelConfirmModal.jsx introuvable !');
  process.exit(1);
}
const modalContent = fs.readFileSync(modalPath, 'utf8');
if (!modalContent.includes('e.target === e.currentTarget')) {
  console.error('❌ Clic de fermeture sécurisé e.target === e.currentTarget manquant dans CordelConfirmModal');
  process.exit(1);
}
if (!modalContent.includes('Escape')) {
  console.error('❌ Écoute de la touche Escape manquante dans CordelConfirmModal');
  process.exit(1);
}
console.log('✅ 1. CordelConfirmModal.jsx conforme aux directives Cordel.');

// Test 2: ConfirmModalContext.jsx & useConfirm
const ctxPath = path.resolve('src/context/ConfirmModalContext.jsx');
if (!fs.existsSync(ctxPath)) {
  console.error('❌ ConfirmModalContext.jsx introuvable !');
  process.exit(1);
}
const ctxContent = fs.readFileSync(ctxPath, 'utf8');
if (!ctxContent.includes('confirmFn.confirm = confirmFn')) {
  console.error('❌ Bi-compatibilité useConfirm manquante !');
  process.exit(1);
}
console.log('✅ 2. ConfirmModalContext.jsx & useConfirm bi-compatible validés.');

console.log('🎉 Succès des assertions de base !');
