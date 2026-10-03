// Script de nettoyage des expressions de traduction imbriquées entre quotes
import fs from 'fs';
import path from 'path';

const filesToFix = [
  'src/components/member/MemberRepertoireHeader.jsx',
  'src/components/member/PieceSignalsModal.jsx',
  'src/components/member/PieceLyricsModal.jsx',
  'src/components/member/PieceCultureModal.jsx',
  'src/components/mestre/RepertoireTrainingsManager.jsx',
  'src/components/mestre/SignalZoomModal.jsx',
  'src/components/member/MemberRepertoireView.jsx',
  'src/components/member/MemberPieceUnfoldedContent.jsx',
];

for (const relPath of filesToFix) {
  const fullPath = path.resolve(process.cwd(), relPath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remplace '\{t\((.*?)\)\}' par t($1)
  content = content.replace(/'\{t\((.*?)\)\}'/g, 't($1)');
  // Remplace "\{t\((.*?)\)\}" par t($1)
  content = content.replace(/"\{t\((.*?)\)\}"/g, 't($1)');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Corrigé : ${relPath}`);
}
