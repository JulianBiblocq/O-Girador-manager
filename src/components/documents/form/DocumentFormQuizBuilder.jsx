import React from 'react';

/**
 * Constructeur de QCM et gestionnaire de lexique de vocabulaire
 * rattaché aux fiches de chants, de fabrication ou de culture.
 */
export default function DocumentFormQuizBuilder({
  notesLexique = [],
  setNotesLexique,
  questionsQcm = [],
  setQuestionsQcm,
  isSubmitting = false,
  showLexiqueNotes = true
}) {
  // Gestion du lexique
  const addNotesLexiqueItem = () => {
    setNotesLexique([...(Array.isArray(notesLexique) ? notesLexique : []), { mot: '', explication: '' }]);
  };

  const updateNotesLexiqueItem = (index, field, value) => {
    const updated = [...(Array.isArray(notesLexique) ? notesLexique : [])];
    updated[index][field] = value;
    setNotesLexique(updated);
  };

  const removeNotesLexiqueItem = (index) => {
    const updated = [...(Array.isArray(notesLexique) ? notesLexique : [])];
    updated.splice(index, 1);
    setNotesLexique(updated);
  };

  // Gestion des questions QCM
  const addQuestion = () => {
    setQuestionsQcm([...questionsQcm, { question: '', options: ['', ''], correctIndex: 0, extraitTexte: '' }]);
  };

  const updateQuestion = (qIndex, field, value) => {
    const updated = [...questionsQcm];
    updated[qIndex][field] = value;
    setQuestionsQcm(updated);
  };

  const removeQuestion = (qIndex) => {
    const updated = [...questionsQcm];
    updated.splice(qIndex, 1);
    setQuestionsQcm(updated);
  };

  const addOption = (qIndex) => {
    const updated = [...questionsQcm];
    updated[qIndex].options.push('');
    setQuestionsQcm(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questionsQcm];
    updated[qIndex].options[optIndex] = value;
    setQuestionsQcm(updated);
  };

  const removeOption = (qIndex, optIndex) => {
    const updated = [...questionsQcm];
    updated[qIndex].options.splice(optIndex, 1);
    if (updated[qIndex].correctIndex >= updated[qIndex].options.length) {
      updated[qIndex].correctIndex = Math.max(0, updated[qIndex].options.length - 1);
    }
    setQuestionsQcm(updated);
  };

  return (
    <>
      {/* 1. BLOC LEXIQUE / VOCABULAIRE */}
      {showLexiqueNotes && (
        <div className="flex flex-col gap-4 mt-4 border-t-2 border-dashed border-cordel-master-dark/20 pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
              📖 Lexique / Vocabulaire
            </label>
            <button
              type="button"
              onClick={addNotesLexiqueItem}
              disabled={isSubmitting}
              className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              + Ajouter un mot
            </button>
          </div>

          <p className="text-[10px] text-cordel-master-dark/80 italic mb-2 bg-[#fdfaf2] p-2 rounded border border-cordel-wood/20">
            💡 <strong>Notice :</strong> Ajoutez ici les mots importants tirés du chant ou du tutoriel et leur définition. 
            Ils seront automatiquement récupérés pour générer les questionnaires.
          </p>

          {(!Array.isArray(notesLexique) || notesLexique.length === 0) ? (
            <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
              Aucun mot de vocabulaire défini pour l'instant.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {notesLexique.map((item, index) => (
                <div key={index} className="bg-[#fdfaf2] border border-cordel-wood/30 p-4 rounded-md shadow-sm relative">
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => removeNotesLexiqueItem(index)}
                      className="text-xs text-cordel-rouge hover:opacity-80 p-1 cursor-pointer"
                      title="Supprimer ce mot"
                    >
                      ❌
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-3 pr-8">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                        Mot
                      </label>
                      <input
                        type="text"
                        value={item.mot || ''}
                        onChange={(e) => updateNotesLexiqueItem(index, 'mot', e.target.value)}
                        placeholder="Ex: Dendê"
                        className="theme-input w-full text-xs font-bold bg-white"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                        Définition / Explication
                      </label>
                      <textarea
                        value={item.explication || ''}
                        onChange={(e) => updateNotesLexiqueItem(index, 'explication', e.target.value)}
                        placeholder="Huile de palme utilisée dans la cuisine bahianaise et les rituels..."
                        className="theme-input w-full text-xs min-h-[60px] bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. BLOC QCM */}
      <div className="flex flex-col gap-4 mt-6 pt-4 border-t-2 border-dashed border-cordel-master-dark/20">
        <div className="flex items-center justify-between">
          <label className="text-[11px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
            ❓ Questions QCM
          </label>
          <button
            type="button"
            onClick={addQuestion}
            disabled={isSubmitting}
            className="text-[10px] uppercase font-bold px-2 py-1 bg-cordel-wood text-[#fdfaf2] rounded hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
          >
            + Ajouter une question
          </button>
        </div>
        
        {questionsQcm.length === 0 ? (
          <p className="text-xs text-cordel-master-dark/70 italic text-center py-2">
            Aucune question pour le moment.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {questionsQcm.map((q, qIndex) => (
              <div key={qIndex} className="bg-cordel-bg border border-cordel-wood/20 p-4 rounded-md shadow-sm relative">
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="absolute top-2 right-2 text-cordel-rouge hover:opacity-80 p-1 cursor-pointer"
                  title="Supprimer la question"
                >
                  ❌
                </button>
                
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1 pr-6">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Question {qIndex + 1}
                    </label>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                      placeholder="Posez votre question..."
                      className="theme-input w-full text-xs"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 pl-2 border-l-2 border-cordel-wood/20">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Options de réponse (Cochez la bonne réponse)
                    </label>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q_${qIndex}_correct`}
                          checked={q.correctIndex === optIndex}
                          onChange={() => updateQuestion(qIndex, 'correctIndex', optIndex)}
                          className="w-4 h-4 text-cordel-vert focus:ring-cordel-vert cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          className="theme-input flex-1 text-xs py-1"
                          required
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, optIndex)}
                            className="text-[10px] text-cordel-rouge px-1 cursor-pointer"
                          >
                            ✖
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-[10px] text-cordel-vert self-start hover:underline mt-1 font-bold cursor-pointer"
                    >
                      + Ajouter une option
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-2">
                    <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                      Extrait du texte (Explication affichée lors de la correction)
                    </label>
                    <textarea
                      value={q.extraitTexte}
                      onChange={(e) => updateQuestion(qIndex, 'extraitTexte', e.target.value)}
                      placeholder="Copiez-collez ici le bout du texte qui justifie la réponse..."
                      className="theme-input w-full text-xs min-h-[60px] resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
