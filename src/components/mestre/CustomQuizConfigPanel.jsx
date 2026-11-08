// Panneau Mestre de configuration des QCM et surcharges déterministes quizOverrides (<= 140 lignes)
import React from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CustomQuizQuestionForm from './CustomQuizQuestionForm';
import { useTranslation } from '../LanguageContext';
import { buildDeterministicQuizQuestionId } from '../../utils/quizOverrideKeyHelper';

export default function CustomQuizConfigPanel({
  groupId, selectedItem, itemType, isQuizPublished, customQuestions = [],
  availableMedia = [], onUpdateMetadata, allItems = [], associatedSignalId, mestreSignals = [],
}) {
  const { t } = useTranslation();

  if (!selectedItem) {
    return (
      <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
        <p className="text-sm font-bold">{t('mestre.pedagogy.selectItemToConfigureNotice')}</p>
      </div>
    );
  }

  const handleTogglePublishQuiz = async () => {
    try {
      if (itemType === 'rhythm') {
        await setDoc(doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id), { isQuizPublished: !isQuizPublished }, { merge: true });
      } else {
        await updateDoc(doc(db, 'documents', selectedItem.id), { isQuizPublished: !isQuizPublished });
      }
      onUpdateMetadata(selectedItem.id, 'isQuizPublished', !isQuizPublished);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSignal = async (e) => {
    const newSignalId = e.target.value;
    try {
      if (itemType === 'rhythm') {
        await setDoc(doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id), { associatedSignalId: newSignalId }, { merge: true });
        onUpdateMetadata(selectedItem.id, 'associatedSignalId', newSignalId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (newQ, detId) => {
    const resolvedId = detId || buildDeterministicQuizQuestionId({
      sourceId: selectedItem.id,
      category: itemType === 'song' ? 'toada' : (itemType === 'fiche' ? 'culture' : 'repertoire'),
      targetField: newQ.targetField || 'custom',
    });
    const isFieldOverride = newQ.targetField && newQ.targetField !== 'custom';
    try {
      if (itemType === 'rhythm') {
        const payload = { customQuestions: arrayUnion(newQ) };
        if (isFieldOverride) payload[`quizOverrides.${resolvedId}`] = newQ;
        await setDoc(doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id), payload, { merge: true });
      } else {
        const updates = { customQuestions: arrayUnion(newQ) };
        if (isFieldOverride) updates[`quizOverrides.${resolvedId}`] = newQ;
        await updateDoc(doc(db, 'documents', selectedItem.id), updates);
      }
      onUpdateMetadata(selectedItem.id, 'addQuestion', newQ);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveQuestion = async (question) => {
    try {
      if (itemType === 'rhythm') {
        await updateDoc(doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id), { customQuestions: arrayRemove(question) });
      } else {
        await updateDoc(doc(db, 'documents', selectedItem.id), { customQuestions: arrayRemove(question) });
      }
      onUpdateMetadata(selectedItem.id, 'removeQuestion', question);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center bg-[#fdfaf2] p-3 border-2 border-dashed border-cordel-wood/30 rounded">
          <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/80">{t('mestre.pedagogy.studentVisibilityLabel')}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isQuizPublished || false} onChange={handleTogglePublishQuiz} className="accent-cordel-wood w-4 h-4" />
            <span className={`text-xs font-bold ${isQuizPublished ? 'text-[var(--color-cordel-vert)]' : 'text-encre-noire'}`}>
              {isQuizPublished ? t('pedagogy.admin.publie') : t('pedagogy.admin.brouillon')}
            </span>
          </label>
        </div>

        {itemType === 'rhythm' && (
          <div className="flex justify-between items-center bg-[#fdfaf2] p-3 border-2 border-dashed border-[var(--theme-primary)]/30 rounded mt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-primary)]">{t('mestre.pedagogy.associatedMestreSignalLabel')}</span>
            <select value={associatedSignalId || ''} onChange={handleUpdateSignal} className="p-1 border-2 border-encre-noire/30 rounded text-xs font-bold bg-white text-encre-noire max-w-[200px]">
              <option value="">{t('mestre.pedagogy.noSignalOption')}</option>
              {mestreSignals.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/60 mt-2">
          {t('mestre.pedagogy.activeQuestionsForColon')} {selectedItem.titre || selectedItem.name || selectedItem.id}
        </span>

        {!(customQuestions?.length > 0) ? (
          <div className="text-center p-6 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded">
            <p className="text-xs font-medium opacity-60">{t('mestre.pedagogy.noCustomQuestionsNotice')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customQuestions.map((q) => (
              <div key={q.id} className="flex flex-col p-3 bg-white border-2 border-encre-noire/15 rounded shadow-sm relative">
                <span className="text-xs font-bold text-encre-noire mb-1">{q.texte}</span>
                {q.audioUrl && <div className="flex items-center gap-2 mb-2 text-[10px] text-cordel-wood bg-cordel-wood/10 p-1.5 rounded w-fit"><span>🎵</span> {t('mestre.pedagogy.audioAttachedBadge')}</div>}
                <span className="text-[10px] text-[var(--color-cordel-vert)] font-bold">✓ {q.bonneReponse}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {q.mauvaisesReponses?.map((mr, i) => <span key={i} className="text-[9px] bg-neutral-100 text-encre-noire/60 px-1.5 py-0.5 rounded line-through">{mr}</span>)}
                </div>
                <button onClick={() => handleRemoveQuestion(q)} className="absolute top-2 right-2 text-cordel-master-dark/40 hover:text-cordel-rouge font-black px-2" title={t('mestre.pedagogy.deleteQuestionTitle')} type="button">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CustomQuizQuestionForm selectedItem={selectedItem} itemType={itemType} allItems={allItems} availableMedia={availableMedia} onSubmitQuestion={handleAddQuestion} />
    </CordelCard>
  );
}
