import React, { useState } from 'react';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function CustomQuizConfigPanel({
  groupId,
  selectedItem,          // Object: { id, titre, ... }
  itemType,              // String: 'rhythm', 'song', 'fiche'
  isQuizPublished,       // Boolean
  customQuestions = [],  // Array of questions
  availableMedia = [],   // Array of { url, fileName, isAudio } for this item
  onUpdateMetadata,      // Function to trigger a local state refresh in parent
  allItems = []          // Array of all items of this type
}) {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCorrect, setNewQuestionCorrect] = useState('');
  const [newQuestionBad1, setNewQuestionBad1] = useState('');
  const [newQuestionBad2, setNewQuestionBad2] = useState('');
  const [newQuestionBad3, setNewQuestionBad3] = useState('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const handleGenerateAutoQuestion = () => {
    let questionText = "Quel est le nom de cet élément ?";
    if (itemType === 'rhythm') questionText = "Quel est le nom de ce rythme ?";
    else if (itemType === 'song') questionText = "Quel est le titre de ce chant ?";
    else if (itemType === 'fiche') questionText = "Quel est le sujet de cette fiche ?";

    const correctAnswer = selectedItem.titre || selectedItem.name || selectedItem.id;

    const otherItems = allItems.filter(item => item.id !== selectedItem.id);
    const shuffled = [...otherItems].sort(() => 0.5 - Math.random());
    const bad1 = shuffled[0] ? (shuffled[0].titre || shuffled[0].name || shuffled[0].id) : "Fausse réponse 1";
    const bad2 = shuffled[1] ? (shuffled[1].titre || shuffled[1].name || shuffled[1].id) : "Fausse réponse 2";
    const bad3 = shuffled[2] ? (shuffled[2].titre || shuffled[2].name || shuffled[2].id) : "Fausse réponse 3";

    setNewQuestionText(questionText);
    setNewQuestionCorrect(correctAnswer);
    setNewQuestionBad1(bad1);
    setNewQuestionBad2(bad2);
    setNewQuestionBad3(bad3);
    if (availableMedia && availableMedia.length > 0) {
      setSelectedMediaUrl(availableMedia[0].url);
    }
  };

  const handleTogglePublishQuiz = async () => {
    try {
      if (itemType === 'rhythm') {
        const metaRef = doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id);
        await setDoc(metaRef, { isQuizPublished: !isQuizPublished }, { merge: true });
      } else {
        const docRef = doc(db, 'documents', selectedItem.id);
        await updateDoc(docRef, { isQuizPublished: !isQuizPublished });
      }
      onUpdateMetadata(selectedItem.id, 'isQuizPublished', !isQuizPublished);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestionText.trim() || !newQuestionCorrect.trim() || !newQuestionBad1.trim()) return;

    const newQ = {
      id: Date.now().toString(),
      texte: newQuestionText.trim(),
      bonneReponse: newQuestionCorrect.trim(),
      mauvaisesReponses: [newQuestionBad1.trim(), newQuestionBad2.trim(), newQuestionBad3.trim()].filter(Boolean),
      audioUrl: selectedMediaUrl || null
    };

    try {
      if (itemType === 'rhythm') {
        const metaRef = doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id);
        await setDoc(metaRef, { customQuestions: arrayUnion(newQ) }, { merge: true });
      } else {
        const docRef = doc(db, 'documents', selectedItem.id);
        await updateDoc(docRef, { customQuestions: arrayUnion(newQ) });
      }

      onUpdateMetadata(selectedItem.id, 'addQuestion', newQ);
      
      setNewQuestionText('');
      setNewQuestionCorrect('');
      setNewQuestionBad1('');
      setNewQuestionBad2('');
      setNewQuestionBad3('');
      setSelectedMediaUrl('');
      
      setShowValidation(true);
      setTimeout(() => setShowValidation(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveQuestion = async (question) => {
    try {
      if (itemType === 'rhythm') {
        const metaRef = doc(db, 'associations', groupId, 'rhythmMetadata', selectedItem.id);
        await updateDoc(metaRef, { customQuestions: arrayRemove(question) });
      } else {
        const docRef = doc(db, 'documents', selectedItem.id);
        await updateDoc(docRef, { customQuestions: arrayRemove(question) });
      }
      onUpdateMetadata(selectedItem.id, 'removeQuestion', question);
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedItem) {
    return (
      <div className="text-center p-8 bg-[#fdfaf2] border-2 border-dashed border-encre-noire/20 rounded opacity-60">
        <p className="text-sm font-bold">Sélectionnez un élément à gauche pour configurer son QCM.</p>
      </div>
    );
  }

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center bg-[#fdfaf2] p-3 border-2 border-dashed border-cordel-wood/30 rounded">
          <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/80">
            Visibilité Élèves (Mon Parcours)
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              checked={isQuizPublished || false}
              onChange={handleTogglePublishQuiz}
              className="accent-cordel-wood w-4 h-4"
            />
            <span className={`text-xs font-bold ${isQuizPublished ? 'text-[#2d6a4f]' : 'text-encre-noire'}`}>
              {isQuizPublished ? '✅ Publié' : 'Brouillon'}
            </span>
          </label>
        </div>
        
        <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark/60 mt-2">
          Questions actives pour : {selectedItem.titre || selectedItem.name || selectedItem.id}
        </span>
        
        {!(customQuestions?.length > 0) ? (
          <div className="text-center p-6 bg-[#fdfaf2] border border-dashed border-encre-noire/20 rounded">
            <p className="text-xs font-medium opacity-60">Aucune question personnalisée pour cet élément.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customQuestions.map(q => (
              <div key={q.id} className="flex flex-col p-3 bg-white border-2 border-encre-noire/15 rounded shadow-sm relative">
                <span className="text-xs font-bold text-encre-noire mb-1">{q.texte}</span>
                {q.audioUrl && (
                  <div className="flex items-center gap-2 mb-2 text-[10px] text-cordel-wood bg-cordel-wood/10 p-1.5 rounded w-fit">
                    <span>🎵</span> Audio attaché
                  </div>
                )}
                <span className="text-[10px] text-[#2d6a4f] font-bold">✓ {q.bonneReponse}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {q.mauvaisesReponses?.map((mr, i) => (
                    <span key={i} className="text-[9px] bg-neutral-100 text-encre-noire/60 px-1.5 py-0.5 rounded line-through">
                      {mr}
                    </span>
                  ))}
                </div>
                <button 
                  onClick={() => handleRemoveQuestion(q)}
                  className="absolute top-2 right-2 text-cordel-master-dark/40 hover:text-cordel-rouge font-black px-2"
                  title="Supprimer la question"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleAddQuestion} className="flex flex-col gap-3 bg-[#fdfaf2] p-4 rounded border-2 border-encre-noire/10 relative">
        {showValidation && (
          <div className="absolute -top-3 right-4 bg-[#2d6a4f] text-white text-[10px] font-bold px-3 py-1 rounded shadow-md animate-fadeIn z-10">
            ✓ Question ajoutée !
          </div>
        )}
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-cordel-wood">
            + Nouvelle Question
          </span>
          {allItems.length > 1 && (
            <button 
              type="button" 
              onClick={handleGenerateAutoQuestion}
              className="text-[9px] font-bold text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-1 rounded hover:bg-[#2d6a4f]/20 transition-colors"
            >
              ⚡ Générer auto.
            </button>
          )}
        </div>
        <input
          type="text"
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          placeholder="La question (ex: Quel est ce pattern ?)"
          className="p-2 border-2 border-encre-noire/30 rounded text-xs font-bold"
          required
        />
        
        {availableMedia && availableMedia.length > 0 && (
          <div className="flex flex-col gap-1 mt-2">
            <label className="text-[9px] font-black uppercase text-encre-noire/60">Audio / Média lié (Optionnel)</label>
            <select
              value={selectedMediaUrl}
              onChange={(e) => setSelectedMediaUrl(e.target.value)}
              className="p-2 border-2 border-encre-noire/30 rounded text-xs font-medium bg-white"
            >
              <option value="">-- Aucun média (Texte uniquement) --</option>
              {availableMedia.map(m => (
                <option key={m.url} value={m.url}>
                  {m.isAudio ? '🎧' : '📄'} {m.fileName}
                </option>
              ))}
            </select>
          </div>
        )}

        <input
          type="text"
          value={newQuestionCorrect}
          onChange={(e) => setNewQuestionCorrect(e.target.value)}
          placeholder="La BONNE réponse"
          className="p-2 border-2 border-[#2d6a4f]/50 bg-[#2d6a4f]/5 rounded text-xs font-bold text-[#2d6a4f] mt-2"
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={newQuestionBad1}
            onChange={(e) => setNewQuestionBad1(e.target.value)}
            placeholder="Fausse réponse 1"
            className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium"
            required
          />
          <input
            type="text"
            value={newQuestionBad2}
            onChange={(e) => setNewQuestionBad2(e.target.value)}
            placeholder="Fausse réponse 2 (opt)"
            className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium"
          />
          <input
            type="text"
            value={newQuestionBad3}
            onChange={(e) => setNewQuestionBad3(e.target.value)}
            placeholder="Fausse réponse 3 (opt)"
            className="p-2 border-2 border-encre-noire/20 rounded text-xs font-medium"
          />
        </div>
        <CordelButton variant="primary" type="submit" disabled={!newQuestionText.trim() || !newQuestionCorrect.trim() || !newQuestionBad1.trim()} className="text-[10px] self-end mt-2">
          Ajouter au Quiz
        </CordelButton>
      </form>
    </CordelCard>
  );
}
