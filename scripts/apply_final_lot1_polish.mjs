// Script de polissage final i18n pour les 13 fichiers restants du Lot 1
import fs from 'fs';
import path from 'path';

function updateFile(relPath, fn) {
  const fullPath = path.resolve(process.cwd(), relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  const updated = fn(content);
  if (content !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✅ Mis à jour : ${relPath}`);
  } else {
    console.log(`⚠️ Pas de changement : ${relPath}`);
  }
}

// 1. AutoEvalQuizContainer.jsx
updateFile('src/components/student/AutoEvalQuizContainer.jsx', (code) => {
  return code
    .replace(`🔙 {t('common.back') || "Retour"}`, `🔙 {t('common.back') || t('pedagogy.student.retour')}`)
    .replace(
      `<strong>Où réviser avant de se tester ?</strong><br/>\n                Tout le matériel pédagogique (chants, fiches, rythmes) se trouve dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !`,
      `<strong>{t('pedagogy.student.ouReviserAvantDe')}</strong><br/>\n                {t('pedagogy.student.toutLeMaterielPedagogique')} <strong>{t('pedagogy.student.varalsCordesALinge')}</strong> {t('pedagogy.student.situesToutEnBas')}`
    )
    .replace(
      `<strong>Où réviser avant de se tester ?</strong><br/>\r\n                Tout le matériel pédagogique (chants, fiches, rythmes) se trouve dans les <strong>Varals (cordes à linge)</strong> situés tout en bas de la page d'accueil !`,
      `<strong>{t('pedagogy.student.ouReviserAvantDe')}</strong><br/>\r\n                {t('pedagogy.student.toutLeMaterielPedagogique')} <strong>{t('pedagogy.student.varalsCordesALinge')}</strong> {t('pedagogy.student.situesToutEnBas')}`
    )
    .replace(
      `{selectedChoice?.isCorrect ? "✅ Bien joué !" : "🌱 Presque !"}`,
      `{selectedChoice?.isCorrect ? t('pedagogy.student.bienJoue') : t('pedagogy.student.presque')}`
    )
    .replace(
      `{onExit ? "Terminer" : "Retour à l'Accueil"}`,
      `{onExit ? t('pedagogy.student.terminer') : t('pedagogy.student.retourALAccueil')}`
    );
});

// 2. PieceTutorialModal.jsx
updateFile('src/components/profile/PieceTutorialModal.jsx', (code) => {
  return code.replace(
    `<span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] px-2 py-0.5 opacity-80">\n                  Optionnel\n                </span>`,
    `<span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] px-2 py-0.5 opacity-80">\n                  {t('pedagogy.student.optionnel')}\n                </span>`
  ).replace(
    `<span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] px-2 py-0.5 opacity-80">\r\n                  Optionnel\r\n                </span>`,
    `<span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] px-2 py-0.5 opacity-80">\r\n                  {t('pedagogy.student.optionnel')}\r\n                </span>`
  );
});

// 3. PieceLyricsModal.jsx
updateFile('src/components/member/PieceLyricsModal.jsx', (code) => {
  return code.replace(
    `{t('repertoire.closeModal') || "Fermer"}`,
    `{t('repertoire.closeModal') || t('pedagogy.modals.fermer')}`
  );
});

// 4. PieceCultureModal.jsx
updateFile('src/components/member/PieceCultureModal.jsx', (code) => {
  return code
    .replace(
      `{t('repertoire.closeModal') || "Fermer"}`,
      `{t('repertoire.closeModal') || t('pedagogy.modals.fermer')}`
    )
    .replace(
      `Fiches ({docsList.length}) :`,
      `{t('pedagogy.modals.fiches')}{docsList.length}) :`
    );
});

// 5. PieceSignalsModal.jsx
updateFile('src/components/member/PieceSignalsModal.jsx', (code) => {
  return code
    .replace(
      `{resolvedSignals.length} convention{resolvedSignals.length > 1 ? 's' : ''} et geste{resolvedSignals.length > 1 ? 's' : ''} du Mestre`,
      `{resolvedSignals.length} {t('pedagogy.modals.convention')}{resolvedSignals.length > 1 ? 's' : ''} {t('pedagogy.modals.etGeste')}{resolvedSignals.length > 1 ? 's' : ''} {t('pedagogy.modals.duMestre')}`
    )
    .replace(
      `<span className="text-[8px] font-bold uppercase text-stone-500 mt-0.5">Geste</span>`,
      `<span className="text-[8px] font-bold uppercase text-stone-500 mt-0.5">{t('pedagogy.modals.geste')}</span>`
    )
    .replace(
      `Mesure {sig.mesure}`,
      `{t('pedagogy.modals.mesure')} {sig.mesure}`
    );
});

// 6. PieceAisanceSection.jsx
updateFile('src/components/member/PieceAisanceSection.jsx', (code) => {
  return code.replace(
    `({stage.targetBpm} BPM)`,
    `({stage.targetBpm} {t('pedagogy.modals.bpm')}`
  );
});

// 7. MemberPieceCard.jsx
updateFile('src/components/member/MemberPieceCard.jsx', (code) => {
  let updated = code.replace(
    `export const COMFORT_LEVELS = [\n  { level: 1, label: t('pedagogy.modals.decouverte'), icon: '🌱', tip: 'En phase de découverte' },\n  { level: 2, label: t('pedagogy.modals.enPratique'), icon: '🌿', tip: "En cours d'apprentissage" },\n  { level: 3, label: 'À l\\'aise', icon: '🌳', tip: 'Autonome sur le morceau' },\n  { level: 4, label: t('pedagogy.modals.referent'), icon: '👑', tip: 'Parfaitement maîtrisé, prêt à guider' }\n];`,
    `export const COMFORT_LEVELS = [\n  { level: 1, labelKey: 'pedagogy.modals.decouverte', icon: '🌱', tipKey: 'pedagogy.modals.enPhaseDeDecouverte' },\n  { level: 2, labelKey: 'pedagogy.modals.enPratique', icon: '🌿', tipKey: 'pedagogy.modals.enCoursDApprentissage' },\n  { level: 3, labelKey: 'pedagogy.modals.aLAise', icon: '🌳', tipKey: 'pedagogy.modals.autonomeSurLeMorceau' },\n  { level: 4, labelKey: 'pedagogy.modals.referent', icon: '👑', tipKey: 'pedagogy.modals.parfaitementMaitrise' }\n];`
  ).replace(
    `export const COMFORT_LEVELS = [\r\n  { level: 1, label: t('pedagogy.modals.decouverte'), icon: '🌱', tip: 'En phase de découverte' },\r\n  { level: 2, label: t('pedagogy.modals.enPratique'), icon: '🌿', tip: "En cours d'apprentissage" },\r\n  { level: 3, label: 'À l\\'aise', icon: '🌳', tip: 'Autonome sur le morceau' },\r\n  { level: 4, label: t('pedagogy.modals.referent'), icon: '👑', tip: 'Parfaitement maîtrisé, prêt à guider' }\r\n];`,
    `export const COMFORT_LEVELS = [\r\n  { level: 1, labelKey: 'pedagogy.modals.decouverte', icon: '🌱', tipKey: 'pedagogy.modals.enPhaseDeDecouverte' },\r\n  { level: 2, labelKey: 'pedagogy.modals.enPratique', icon: '🌿', tipKey: 'pedagogy.modals.enCoursDApprentissage' },\r\n  { level: 3, labelKey: 'pedagogy.modals.aLAise', icon: '🌳', tipKey: 'pedagogy.modals.autonomeSurLeMorceau' },\r\n  { level: 4, labelKey: 'pedagogy.modals.referent', icon: '👑', tipKey: 'pedagogy.modals.parfaitementMaitrise' }\r\n];`
  );

  // Mettre à jour l'affichage de COMFORT_LEVELS dans le JSX
  updated = updated.replace(
    `title={c.tip}`,
    `title={t(c.tipKey) || c.tip}`
  ).replace(
    `{c.label}`,
    `{t(c.labelKey) || c.label}`
  );

  return updated;
});

// 8. MemberPieceUnfoldedContent.jsx
updateFile('src/components/member/MemberPieceUnfoldedContent.jsx', (code) => {
  return code
    .replace(`{t('repertoire.lyricsTab') || 'Paroles'}`, `{t('repertoire.lyricsTab') || t('pedagogy.modals.paroles')}`)
    .replace(`{t('repertoire.cultureTab') || 'Culture & Histoire'}`, `{t('repertoire.cultureTab') || t('pedagogy.modals.cultureHistoire')}`)
    .replace(`{t('repertoire.signalsTab') || 'Signes du Mestre'}`, `{t('repertoire.signalsTab') || t('pedagogy.modals.signesDuMestre')}`)
    .replace(
      `<span>Danse : {piece.activeChoreography.nom || piece.activeChoreography.titre || 'Chorégraphie'}</span>`,
      `<span>{t('pedagogy.modals.danse')} {piece.activeChoreography.nom || piece.activeChoreography.titre || t('pedagogy.modals.choregraphie')}</span>`
    )
    .replace(`{t('repertoire.sequencerTab') || 'Séquenceur'}`, `{t('repertoire.sequencerTab') || t('pedagogy.modals.sequenceur')}`)
    .replace(`{t('repertoire.revisePiece') || 'Réviser ce morceau'}`, `{t('repertoire.revisePiece') || t('pedagogy.modals.reviserCeMorceau')}`);
});

// 9. RepertoireSinaisDoMestreEditor.jsx
updateFile('src/components/mestre/RepertoireSinaisDoMestreEditor.jsx', (code) => {
  return code
    .replace(
      `"Signaux de commandement et conventions par mesure (départ, virada, break, coupure). Suggérés depuis le Séquenceur ou positionnés à la main."`,
      `t('pedagogy.admin.signauxDeCommandementEt')`
    )
    .replace(
      `"Signaux de commandement du Mestre associés à ce rythme (départ, virada, coupure...)."`,
      `t('pedagogy.admin.signauxDeCommandementDu')`
    )
    .replace(
      `"Aucun signe rattaché pour l'instant. Liez un Preset pour les suggérer automatiquement ou cliquez sur [ ➕ Ajouter un signe ]."`,
      `t('pedagogy.admin.aucunSigneRattachePour')`
    )
    .replace(
      `"Aucun signe rattaché pour l'instant. Cliquez sur [ ➕ Ajouter un signe ] pour associer des gestes du Mestre."`,
      `t('pedagogy.admin.aucunSigneRattacheManuel')`
    );
});

// 10. SignalReflexCard.jsx
updateFile('src/components/mestre/reflex/SignalReflexCard.jsx', (code) => {
  return code
    .replace(
      `<span>{isLocked ? '🔒 Figé' : '🔓 Dynamique'}</span>`,
      `<span>{isLocked ? t('pedagogy.admin.fige') : t('pedagogy.admin.dynamique')}</span>`
    )
    .replace(
      `{dIdx === 0 ? ' (Inattention)' : dIdx === 1 ? ' (Catalogue)' : ' (Variation)'}`,
      `{dIdx === 0 ? t('pedagogy.admin.inattention') : dIdx === 1 ? t('pedagogy.admin.catalogue') : t('pedagogy.admin.variation')}`
    );
});

// 11. RepertoireTrainingsManager.jsx
updateFile('src/components/mestre/RepertoireTrainingsManager.jsx', (code) => {
  return code
    .replace(
      `<span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">\n                    auto\n                  </span>`,
      `<span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">\n                    {t('pedagogy.admin.auto')}\n                  </span>`
    )
    .replace(
      `<span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">\r\n                    auto\r\n                  </span>`,
      `<span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">\r\n                    {t('pedagogy.admin.auto')}\r\n                  </span>`
    )
    .replace(
      `⚡ {tr.title || tr.titre || tr.name || 'Entraînement'}`,
      `⚡ {tr.title || tr.titre || tr.name || t('pedagogy.admin.entrainement')}`
    );
});

// 12. conductorGameUtils.js
updateFile('src/utils/conductorGameUtils.js', (code) => {
  return code.replace(
    /export const DEFAULT_MESTRE_SIGNALS = \[[\s\S]*?\];/,
    `export const DEFAULT_MESTRE_SIGNALS = [
  { id: 'sig_depart', labelKey: 'pedagogy.engine.appelDeDepart', gestureType: 'depart', imageUrl: null },
  { id: 'sig_virada_1', labelKey: 'pedagogy.engine.appelVirada1', gestureType: 'virada', imageUrl: null },
  { id: 'sig_virada_2', labelKey: 'pedagogy.engine.appelVirada2', gestureType: 'virada', imageUrl: null },
  { id: 'sig_parada', labelKey: 'pedagogy.engine.paradaBreak', gestureType: 'parada', imageUrl: null },
  { id: 'sig_reprise', labelKey: 'pedagogy.engine.repriseDeBaque', gestureType: 'reprise', imageUrl: null },
  { id: 'sig_arret', labelKey: 'pedagogy.engine.coupureFinale', gestureType: 'arret', imageUrl: null },
  { id: 'sig_accel', labelKey: 'pedagogy.engine.acceleration', gestureType: 'tempo', imageUrl: null },
  { id: 'sig_coro', labelKey: 'pedagogy.engine.appelVoixToada', gestureType: 'voix', imageUrl: null }
];`
  );
});

// 13. pedagogyDashboardCalculations.js
updateFile('src/utils/pedagogyDashboardCalculations.js', (code) => {
  return code.replace(
    /export const PERCUSSION_FAMILIES = \[[\s\S]*?\];/,
    `export const PERCUSSION_FAMILIES = [
  { id: 'alfaias', labelKey: 'pedagogy.engine.alfaias', icon: '🥁', keywords: ['alfaia', 'marcador', 'mele', 'tambor', 'surdo'] },
  { id: 'caixas', labelKey: 'pedagogy.engine.caixas', icon: '🥁', keywords: ['caixa', 'tarol', 'caixas'] },
  { id: 'metaux', labelKey: 'pedagogy.engine.metauxGongue', icon: '🔔', keywords: ['gongue', 'gonguê', 'mineiro', 'ferro', 'metal', 'métaux'] },
  { id: 'agbes', labelKey: 'pedagogy.engine.agbes', icon: '🪇', keywords: ['agbe', 'agbê', 'abe', 'abê', 'xequere', 'xequerê', 'shekere'] }
];`
  );
});
