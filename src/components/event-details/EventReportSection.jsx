import React, { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';

export default function EventReportSection({ event, user, profileData }) {
  const { t } = useTranslation();
  const [localPoints, setLocalPoints] = useState([]);
  const [newPointTitle, setNewPointTitle] = useState('');
  const [activeMicPointId, setActiveMicPointId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [editingPointId, setEditingPointId] = useState(null);
  const [editingPointTitle, setEditingPointTitle] = useState('');
  
  // Collaborative suggestions states
  const [newSuggestionTitle, setNewSuggestionTitle] = useState('');
  const [secretaryResponses, setSecretaryResponses] = useState({});
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  
  const recognitionRef = useRef(null);

  // Check roles: Admins or Secrétaires
  const isAdmin = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'secretaire' || 
    profileData?.isSystemAdmin === true;

  // Current report status: empty, 'brouillon', 'attente_relecture', 'publie'
  const reportStatus = event.compteRenduStatus || '';

  // Synchronize local points with Firestore pointsOrdreDuJour
  useEffect(() => {
    if (event.pointsOrdreDuJour) {
      setLocalPoints(event.pointsOrdreDuJour);
    } else {
      setLocalPoints([]);
    }
  }, [event.pointsOrdreDuJour]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Format date helper: DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Add a new point to the order of the day
  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPointTitle.trim()) return;

    const newPoint = {
      id: Date.now().toString(),
      titre: newPointTitle.trim(),
      notesCR: ''
    };

    const updatedPoints = [...localPoints, newPoint];
    setLocalPoints(updatedPoints);
    setNewPointTitle('');

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        pointsOrdreDuJour: updatedPoints,
        // Auto set to brouillon if first point is added and status is empty
        ...(reportStatus === '' ? { compteRenduStatus: 'brouillon' } : {})
      });
    } catch (err) {
      console.error("Error adding point:", err);
      alert("Erreur lors de l'ajout du point à l'ordre du jour.");
    }
  };

  // Edit point title
  const handleStartEditPoint = (point) => {
    setEditingPointId(point.id);
    setEditingPointTitle(point.titre);
  };

  const handleSavePointTitle = async (pointId) => {
    if (!editingPointTitle.trim()) return;
    const updated = localPoints.map(p => p.id === pointId ? { ...p, titre: editingPointTitle.trim() } : p);
    setLocalPoints(updated);
    setEditingPointId(null);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { pointsOrdreDuJour: updated });
    } catch (err) {
      console.error("Error updating point title:", err);
    }
  };

  // Delete a point
  const handleDeletePoint = async (pointId) => {
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer ce point de l'ordre du jour ?");
    if (!confirmDelete) return;

    const updated = localPoints.filter(p => p.id !== pointId);
    setLocalPoints(updated);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { pointsOrdreDuJour: updated });
    } catch (err) {
      console.error("Error deleting point:", err);
    }
  };

  // Move points up/down for reordering
  const handleMovePoint = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localPoints.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...localPoints];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setLocalPoints(updated);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { pointsOrdreDuJour: updated });
    } catch (err) {
      console.error("Error reordering points:", err);
    }
  };

  // Toggle Speech Recognition for a specific point
  const handleToggleSpeech = (pointId) => {
    if (activeMicPointId === pointId) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setActiveMicPointId(null);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("La dictée vocale n'est pas prise en charge par votre navigateur. Essayez avec Google Chrome ou Microsoft Edge.");
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'fr-FR';

      rec.onstart = () => {
        setActiveMicPointId(pointId);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        alert("Une erreur est survenue avec le microphone.");
        setActiveMicPointId(null);
      };

      rec.onend = () => {
        setActiveMicPointId(null);
      };

      rec.onresult = (e) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setLocalPoints(prev => {
            const updated = prev.map(p => {
              if (p.id === pointId) {
                const currentNotes = p.notesCR || '';
                const separator = currentNotes ? ' ' : '';
                return { ...p, notesCR: currentNotes + separator + finalTranscript.trim() };
              }
              return p;
            });
            // Auto-save update to firestore when speech adds text
            const eventRef = doc(db, 'events', event.id);
            updateDoc(eventRef, { pointsOrdreDuJour: updated }).catch(err => {
              console.error("Speech autosave error:", err);
            });
            return updated;
          });
        }
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Handle local text change in textarea
  const handleNotesChange = (pointId, value) => {
    setLocalPoints(prev => prev.map(p => p.id === pointId ? { ...p, notesCR: value } : p));
  };

  // Explicit draft save
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        pointsOrdreDuJour: localPoints,
        compteRenduStatus: 'brouillon'
      });
      alert("Brouillon enregistré avec succès !");
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Erreur lors de l'enregistrement du brouillon.");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit report for review (attente_relecture)
  const handleSubmitForReview = async () => {
    const confirmSubmit = window.confirm("Voulez-vous soumettre ce compte-rendu à la relecture par les membres présents ?");
    if (!confirmSubmit) return;

    setIsSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        pointsOrdreDuJour: localPoints,
        compteRenduStatus: 'attente_relecture',
        compteRenduApprovals: {} // Reset approvals for new review cycle
      });
      alert("Le compte-rendu est maintenant en attente de relecture.");
    } catch (err) {
      console.error("Error submitting for review:", err);
      alert("Erreur lors de la soumission pour relecture.");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish report definitively
  const handlePublishDefinitive = async (pointsToPublish = localPoints, approvals = event.compteRenduApprovals || {}) => {
    setIsSaving(true);
    try {
      // 1. Compile Markdown Content
      const compiledMarkdown = pointsToPublish.map(p => {
        return `### 📌 ${p.titre}\n\n${p.notesCR ? p.notesCR.trim() : "*Aucune note rédigée.*"}`;
      }).join('\n\n---\n\n');

      // 2. Fetch Present users names
      const presents = event.inscriptions?.filter(ins => ins.status === 'present') || [];
      const presentsNames = presents.map(ins => ins.userName || 'Membre anonyme');

      // 3. Standard Title: "CR du JJ/MM/AAAA"
      const docTitle = `CR du ${formatDate(event.date)}`;
      const eventYear = event.date ? new Date(event.date).getFullYear() : new Date().getFullYear();

      // 4. Create document in Varal
      const docRef = await addDoc(collection(db, 'documents'), {
        titre: docTitle,
        categoryId: 'Administratif',
        categorie: 'Administratif',
        sousCategorie: 'Comptes Rendus',
        annee: eventYear,
        type: 'report',
        texte: compiledMarkdown,
        points: pointsToPublish,
        dateAjout: new Date().toISOString(),
        groupId: event.groupId,
        eventId: event.id,
        presents: presentsNames,
        order: 9999,
        fileUrl: '' // Dynamic document
      });

      // 5. Update event status to locked/published
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        compteRenduStatus: 'publie',
        compteRenduVaralId: docRef.id
      });

      alert("Le compte-rendu a été définitivement validé et publié au Varal !");
    } catch (err) {
      console.error("Error publishing report:", err);
      alert("Erreur lors de la publication : " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Vote handler for present members
  const handleVote = async (approved, commentText = '') => {
    const approvals = event.compteRenduApprovals || {};
    const currentVote = {
      approved,
      date: new Date().toISOString(),
      commentaire: commentText,
      userName: `${profileData.prenom || ''} ${profileData.nom || ''}`.trim()
    };

    const updatedApprovals = {
      ...approvals,
      [user.uid]: currentVote
    };

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        compteRenduApprovals: updatedApprovals
      });
      setComment('');
      alert(approved ? "Vous avez approuvé ce compte-rendu !" : "Vos demandes de modifications ont été transmises.");

      // Check if 100% of present users approved
      const presents = event.inscriptions?.filter(ins => ins.status === 'present') || [];
      const totalPresents = presents.length;

      if (totalPresents > 0) {
        const approvedCount = presents.filter(ins => {
          const vote = updatedApprovals[ins.userId];
          return vote?.approved === true;
        }).length;

        if (approvedCount === totalPresents) {
          // Auto publish if all present users approved
          await handlePublishDefinitive(localPoints, updatedApprovals);
        }
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      alert("Erreur lors du vote.");
    }
  };

  // Add suggestion from member
  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!newSuggestionTitle.trim()) return;

    setIsSubmittingSuggestion(true);
    try {
      const newSuggestion = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 'Membre',
        titre: newSuggestionTitle.trim(),
        status: 'en_attente',
        reponseSecretaire: ''
      };

      const updatedSuggestions = [...(event.suggestionsOrdreDuJour || []), newSuggestion];
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { suggestionsOrdreDuJour: updatedSuggestions });
      setNewSuggestionTitle('');
      alert("Votre suggestion de point a été soumise au secrétaire !");
    } catch (err) {
      console.error("Error adding suggestion:", err);
      alert("Erreur lors de la soumission de la suggestion.");
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  // Moderate suggestion from member (Secretary/Admin action)
  const handleModerateSuggestion = async (suggestionId, action, reponseText) => {
    const suggestions = event.suggestionsOrdreDuJour || [];
    let points = event.pointsOrdreDuJour || [];

    const updatedSuggestions = suggestions.map(s => {
      if (s.id === suggestionId) {
        return {
          ...s,
          status: action === 'valide' ? 'valide' : 'invalide',
          reponseSecretaire: reponseText.trim()
        };
      }
      return s;
    });

    if (action === 'valide') {
      const target = suggestions.find(s => s.id === suggestionId);
      if (target) {
        const newPoint = {
          id: Date.now().toString(),
          titre: target.titre,
          notesCR: ''
        };
        points = [...points, newPoint];
      }
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        suggestionsOrdreDuJour: updatedSuggestions,
        pointsOrdreDuJour: points,
        ...(reportStatus === '' && action === 'valide' ? { compteRenduStatus: 'brouillon' } : {})
      });
      alert(action === 'valide' ? "Suggestion validée et ajoutée à l'ordre du jour !" : "Suggestion refusée.");
    } catch (err) {
      console.error("Error moderating suggestion:", err);
      alert("Erreur lors du traitement de la suggestion.");
    }
  };

  // Calculate vote statistics
  const presents = event.inscriptions?.filter(ins => ins.status === 'present') || [];
  const totalPresents = presents.length;
  const approvals = event.compteRenduApprovals || {};
  
  const approvedCount = presents.filter(ins => approvals[ins.userId]?.approved === true).length;
  const rejectedCount = presents.filter(ins => approvals[ins.userId]?.approved === false).length;
  const pendingCount = totalPresents - approvedCount - rejectedCount;

  const isUserPresent = presents.some(ins => ins.userId === user.uid);
  const userVote = approvals[user.uid];

  return (
    <div className="flex flex-col gap-5 text-left">
      
      {/* 📌 Header de Section */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/20 pb-2">
        <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          📋 Ordre du jour & Comptes-rendus
        </h3>
        
        {/* Status Badge */}
        {reportStatus === 'publie' && (
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] tracking-wider">
            📜 ARCHIVÉ AU VARAL
          </span>
        )}
        {reportStatus === 'attente_relecture' && (
          <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] tracking-wider animate-pulse">
            ⏳ EN ATTENTE DE RELECTURE ({approvedCount}/{totalPresents} Approbations)
          </span>
        )}
        {(reportStatus === '' || reportStatus === 'brouillon') && localPoints.length > 0 && (
          <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] opacity-75 tracking-wider">
            ✏️ BROUILLON
          </span>
        )}
      </div>

      {/* 1. Mettre en place l'ordre du jour (Mode brouillon - ADMIN ONLY) */}
      {(reportStatus === '' || reportStatus === 'brouillon') && isAdmin && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light/45 border-dashed">
          <h4 className="font-bold text-xs text-cordel-wood mb-2">➕ Ajouter un point à l'Ordre du Jour</h4>
          <form onSubmit={handleAddPoint} className="flex gap-2">
            <input 
              type="text" 
              value={newPointTitle}
              onChange={(e) => setNewPointTitle(e.target.value)}
              placeholder="Ex: Point 1 : Trésorerie..."
              className="theme-input text-xs flex-1 bg-white/70 py-1.5"
            />
            <CordelButton variant="ocre" type="submit" className="text-xs px-3 py-1 font-bold whitespace-nowrap">
              Ajouter
            </CordelButton>
          </form>
        </CordelCard>
      )}

      {/* 2. Affichage des points (DRAFT/EDIT MODE - ADMIN ONLY) */}
      {(reportStatus === '' || reportStatus === 'brouillon') ? (
        isAdmin ? (
          <div className="flex flex-col gap-4">
            {localPoints.length === 0 ? (
              <p className="text-xs italic opacity-60 text-center py-4">L'ordre du jour est vide. Ajoutez des points ci-dessus pour commencer.</p>
            ) : (
              localPoints.map((point, index) => (
                <div key={point.id} className="theme-inner-panel p-4 rounded-[4px_6px_3px_5px] flex flex-col gap-2 relative">
                  {/* Point Title Bar */}
                  <div className="flex justify-between items-center border-b border-dashed border-encre-noire/10 pb-1.5">
                    {editingPointId === point.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input 
                          type="text"
                          value={editingPointTitle}
                          onChange={(e) => setEditingPointTitle(e.target.value)}
                          className="theme-input text-xs font-bold py-0.5 flex-1 bg-white"
                        />
                        <button onClick={() => handleSavePointTitle(point.id)} className="text-[10px] text-green-700 font-extrabold hover:underline">💾</button>
                        <button onClick={() => setEditingPointId(null)} className="text-[10px] text-red-700 font-extrabold hover:underline">❌</button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-encre-noire flex-1">
                        📌 {point.titre}
                      </span>
                    )}

                    {/* Point Control Buttons */}
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => handleMovePoint(index, 'up')}
                        disabled={index === 0}
                        className="text-[9px] font-bold p-1 bg-neutral-200/60 rounded hover:bg-neutral-300/60 disabled:opacity-30 cursor-pointer"
                        title="Monter"
                      >
                        ▲
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMovePoint(index, 'down')}
                        disabled={index === localPoints.length - 1}
                        className="text-[9px] font-bold p-1 bg-neutral-200/60 rounded hover:bg-neutral-300/60 disabled:opacity-30 cursor-pointer"
                        title="Descendre"
                      >
                        ▼
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleStartEditPoint(point)}
                        className="text-[10px] p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-300"
                        title="Modifier le titre"
                      >
                        ✏️
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeletePoint(point.id)}
                        className="text-[10px] p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Notes Draft Area with Mic */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] uppercase font-extrabold tracking-wider text-cordel-master-dark/65">
                        Notes et compte-rendu
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleSpeech(point.id)}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border rounded transition-all cursor-pointer flex items-center gap-1 ${
                          activeMicPointId === point.id
                            ? 'bg-red-600 text-white border-red-700 animate-pulse font-black'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-encre-noire border-encre-noire/30'
                        }`}
                      >
                        {activeMicPointId === point.id ? (
                          <>🔴 Dictée active... Clic pour couper</>
                        ) : (
                          <>🎤 Démarrer la dictée</>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={point.notesCR || ''}
                      onChange={(e) => handleNotesChange(point.id, e.target.value)}
                      placeholder="Saisissez des notes ou parlez après avoir démarré la dictée vocale..."
                      className="theme-input text-xs w-full min-h-[70px] font-medium leading-relaxed resize-y bg-white/70"
                    />
                  </div>
                </div>
              ))
            )}

            {/* Action Bar (Draft Mode) */}
            {localPoints.length > 0 && (
              <div className="flex justify-end gap-2.5 mt-2">
                <CordelButton 
                  variant="default" 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="text-xs py-2 px-4 font-bold"
                >
                  {isSaving ? "⏳ Enregistrement..." : "💾 Enregistrer le brouillon"}
                </CordelButton>
                <CordelButton 
                  variant="ocre" 
                  onClick={handleSubmitForReview}
                  disabled={isSaving}
                  className="text-xs py-2 px-4 font-extrabold"
                >
                  {isSaving ? "⏳ Soumission..." : "📤 Soumettre pour validation"}
                </CordelButton>
              </div>
            )}

            {/* Secrétaire Moderation Panel */}
            <div className="mt-6 border-t-2 border-dashed border-cordel-master-dark/15 pt-4 flex flex-col gap-3">
              <h4 className="font-bold text-xs text-cordel-wood flex items-center gap-1">
                💡 Suggestions d'ordre du jour des membres ({(event.suggestionsOrdreDuJour || []).length})
              </h4>
              
              {(event.suggestionsOrdreDuJour || []).length === 0 ? (
                <p className="text-xs italic opacity-60">Aucune suggestion soumise par les membres pour le moment.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {(event.suggestionsOrdreDuJour || []).map((s) => {
                    const isPending = s.status === 'en_attente';
                    
                    return (
                      <div key={s.id} className="theme-inner-panel p-3 rounded bg-white/30 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2 text-xs">
                          <div>
                            <span className="font-extrabold text-encre-noire block">
                              📝 {s.titre}
                            </span>
                            <span className="text-[9px] opacity-65 font-bold">
                              Proposé par {s.userName}
                            </span>
                          </div>
                          
                          <div>
                            {s.status === 'valide' && (
                              <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] tracking-wider text-green-700 border-green-700 bg-green-50">
                                VALIDÉ
                              </span>
                            )}
                            {s.status === 'invalide' && (
                              <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] tracking-wider text-red-700 border-red-700 bg-red-50">
                                REFUSÉ
                              </span>
                            )}
                            {s.status === 'en_attente' && (
                              <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] tracking-wider text-amber-700 border-amber-700 bg-amber-50 animate-pulse">
                                EN ATTENTE
                              </span>
                            )}
                          </div>
                        </div>

                        {s.reponseSecretaire && (
                          <p className="text-[10px] bg-white/50 p-1.5 rounded italic opacity-75 border-l-2 border-encre-noire/15">
                            <strong>Réponse secrétaire :</strong> "{s.reponseSecretaire}"
                          </p>
                        )}

                        {isPending && (
                          <div className="flex flex-col gap-2 mt-1 border-t border-dashed border-encre-noire/10 pt-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] uppercase font-bold tracking-wider opacity-65">
                                Réponse courte facultative
                              </label>
                              <input 
                                type="text"
                                value={secretaryResponses[s.id] || ''}
                                onChange={(e) => setSecretaryResponses(prev => ({ ...prev, [s.id]: e.target.value }))}
                                placeholder="Justifiez l'acceptation ou le refus..."
                                className="theme-input text-xs w-full py-1 bg-white"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <CordelButton
                                variant="vert"
                                onClick={() => handleModerateSuggestion(s.id, 'valide', secretaryResponses[s.id] || '')}
                                className="text-[10px] py-1 px-2.5 font-bold"
                              >
                                ✅ Valider
                              </CordelButton>
                              <CordelButton
                                variant="rouge"
                                onClick={() => handleModerateSuggestion(s.id, 'invalide', secretaryResponses[s.id] || '')}
                                className="text-[10px] py-1 px-2.5 font-bold"
                              >
                                ❌ Refuser
                              </CordelButton>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Draft mode, but NOT Admin */
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-3">
              <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-wood">📌 Ordre du jour actuel :</span>
              {localPoints.length === 0 ? (
                <p className="text-xs italic opacity-60">L'ordre du jour n'a pas encore été rédigé.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {localPoints.map((p, idx) => (
                    <div key={p.id} className="text-xs pl-3 border-l-2 border-cordel-wood font-semibold">
                      {idx + 1}. {p.titre}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-cordel-bg-light/45 border-dashed mt-2">
              <h4 className="font-bold text-xs text-cordel-wood mb-2 flex items-center gap-1.5">
                💡 Ordre du jour participatif
              </h4>
              <p className="text-[10px] opacity-75 mb-3 leading-relaxed">
                Proposez un point que vous aimeriez aborder lors de cette réunion. Le secrétaire décidera de son intégration.
              </p>
              
              <form onSubmit={handleAddSuggestion} className="flex gap-2">
                <input 
                  type="text" 
                  value={newSuggestionTitle}
                  onChange={(e) => setNewSuggestionTitle(e.target.value)}
                  placeholder="Sujet du point..."
                  required
                  disabled={isSubmittingSuggestion}
                  className="theme-input text-xs flex-1 bg-white/70 py-1.5"
                />
                <CordelButton variant="ocre" type="submit" disabled={isSubmittingSuggestion} className="text-xs px-3 py-1 font-bold whitespace-nowrap">
                  {isSubmittingSuggestion ? "Envoi..." : "Proposer"}
                </CordelButton>
              </form>

              {(() => {
                const mySuggestions = (event.suggestionsOrdreDuJour || []).filter(s => s.userId === user.uid);
                if (mySuggestions.length === 0) return null;
                
                return (
                  <div className="mt-4 border-t border-dashed border-encre-noire/10 pt-3 flex flex-col gap-2">
                    <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">
                      Vos propositions :
                    </span>
                    <div className="flex flex-col gap-2">
                      {mySuggestions.map(s => (
                        <div key={s.id} className="bg-white/40 p-2.5 rounded border border-encre-noire/5 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center gap-2 text-xs">
                            <span className="font-bold text-encre-noire">📝 {s.titre}</span>
                            <div>
                              {s.status === 'valide' && (
                                <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] text-green-700 border-green-700 bg-green-50">
                                  ACCEPTÉ
                                </span>
                              )}
                              {s.status === 'invalide' && (
                                <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] text-red-700 border-red-700 bg-red-50">
                                  REFUSÉ
                                </span>
                              )}
                              {s.status === 'en_attente' && (
                                <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] text-amber-700 border-amber-700 bg-amber-50 animate-pulse">
                                  EN ATTENTE
                                </span>
                              )}
                            </div>
                          </div>
                          {s.reponseSecretaire && (
                            <p className="text-[9px] bg-white/40 p-1.5 rounded italic opacity-75 border-l-2 border-encre-noire/15 mt-0.5">
                              <strong>Réponse secrétaire :</strong> "{s.reponseSecretaire}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CordelCard>
          </div>
        )
      ) : null}

      {/* 3. Mode validation/attente relecture OU publié */}
      {reportStatus !== '' && reportStatus !== 'brouillon' && (
        <div className="flex flex-col gap-4">
          
          {/* Read-Only Report Content Display */}
          <div className="theme-inner-panel p-5 rounded-[6px_10px_5px_8px] bg-white/50 flex flex-col gap-4 shadow-sm">
            <div className="border-b border-dashed border-encre-noire/15 pb-2">
              <h4 className="text-sm font-black text-encre-noire tracking-wide">
                COMPTE-RENDU DE RÉUNION - {formatDate(event.date)}
              </h4>
              <p className="text-[8px] uppercase tracking-wider font-extrabold text-cordel-wood mt-0.5">
                Statut : {reportStatus === 'publie' ? '✅ VALIDÉ ET PUBLIÉ' : '⏳ EN RELECTURE DÉMOCRATIQUE'}
              </p>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {localPoints.map((point, index) => (
                <div key={point.id} className="flex flex-col gap-1 pl-3 border-l-2 border-cordel-wood/30">
                  <h5 className="font-bold text-encre-noire">📌 {point.titre}</h5>
                  <p className="opacity-90 leading-relaxed font-medium whitespace-pre-wrap pl-2 italic">
                    {point.notesCR ? point.notesCR.trim() : "Aucune note."}
                  </p>
                </div>
              ))}
            </div>

            {/* List of present members */}
            {presents.length > 0 && (
              <div className="border-t border-dashed border-encre-noire/10 pt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">Présents :</span>
                {presents.map(ins => (
                  <span key={ins.userId} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/60 rounded text-encre-noire">
                    👤 {ins.userName}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Sondage / Vote pour les Présents */}
          {reportStatus === 'attente_relecture' && (
            <div className="flex flex-col gap-3">
              
              {/* Vote Encart (Visible exclusively to present users) */}
              {isUserPresent ? (
                <CordelCard variant="default" useExtremeBorder={true} className="p-5 border-2 border-cordel-wood bg-cordel-bg-light shadow-md">
                  <h4 className="text-xs font-extrabold uppercase text-cordel-wood tracking-wider mb-2.5 flex items-center gap-1.5">
                    🗳️ Approbation du Compte-Rendu
                  </h4>
                  
                  {userVote ? (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-xs font-semibold leading-relaxed text-encre-noire">
                        Vous avez voté : {userVote.approved ? (
                          <span className="text-green-700 font-extrabold">✅ APPROUVÉ</span>
                        ) : (
                          <span className="text-red-700 font-extrabold">❌ MODIFICATION DEMANDÉE</span>
                        )}
                        {userVote.commentaire && (
                          <span className="block mt-1 pl-3 border-l-2 border-dashed border-red-500 italic text-[11px] opacity-75">
                            "{userVote.commentaire}"
                          </span>
                        )}
                      </p>
                      
                      <div className="flex">
                        <button 
                          onClick={() => {
                            // Reset vote so they can edit it
                            const updated = { ...approvals };
                            delete updated[user.uid];
                            const eventRef = doc(db, 'events', event.id);
                            updateDoc(eventRef, { compteRenduApprovals: updated });
                          }}
                          className="text-[9px] font-black uppercase tracking-wider text-blue-700 hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          ✏️ Modifier mon vote
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-[11px] leading-relaxed opacity-85">
                        En tant que membre présent, veuillez valider si ce compte-rendu reflète fidèlement la réunion ou demander des modifications.
                      </p>
                      
                      {/* Optional comments for modification */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold tracking-wider opacity-65">
                          Commentaire facultatif (requis si demande de modif)
                        </label>
                        <input 
                          type="text"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Ajoutez des précisions..."
                          className="theme-input text-xs w-full py-1.5 bg-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <CordelButton
                          variant="vert"
                          onClick={() => handleVote(true)}
                          className="text-xs py-2 px-3 flex-1 font-bold"
                        >
                          ✅ Approuver
                        </CordelButton>
                        <CordelButton
                          variant="rouge"
                          onClick={() => {
                            if (!comment.trim()) {
                              alert("Veuillez saisir un commentaire expliquant la modification demandée.");
                              return;
                            }
                            handleVote(false, comment);
                          }}
                          className="text-xs py-2 px-3 flex-1 font-bold"
                        >
                          ❌ Demander une modification
                        </CordelButton>
                      </div>
                    </div>
                  )}
                </CordelCard>
              ) : (
                <div className="p-3 bg-neutral-100 text-neutral-600 rounded text-center text-[10px] italic">
                  🔒 Le vote d'approbation est réservé aux membres marqués comme présents à cette réunion.
                </div>
              )}

              {/* Vote Statistics (For all, especially Admin) */}
              <div className="theme-inner-panel p-3.5 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
                <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">
                  État des votes ({approvedCount + rejectedCount} / {totalPresents} votants)
                </span>
                
                <div className="flex gap-4 text-xs font-semibold">
                  <div className="text-green-700">✅ {approvedCount} Approbations</div>
                  <div className="text-red-700">❌ {rejectedCount} Demandes de modifications</div>
                  <div className="text-neutral-500">⏳ {pendingCount} En attente</div>
                </div>

                {/* List of comments/modifs */}
                {Object.keys(approvals).some(uid => approvals[uid].commentaire) && (
                  <div className="mt-2 border-t border-dashed border-encre-noire/10 pt-2 flex flex-col gap-1.5">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-cordel-wood">Modifications demandées :</span>
                    {Object.keys(approvals).map(uid => {
                      const vote = approvals[uid];
                      if (!vote.commentaire) return null;
                      return (
                        <div key={uid} className="text-[10px] leading-relaxed bg-red-50 text-red-800 p-2 rounded border border-red-200">
                          <span className="font-bold">👤 {vote.userName} :</span> "{vote.commentaire}"
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Publish Button (ADMIN ONLY - when status is review) */}
                {isAdmin && (
                  <div className="flex justify-end border-t border-dashed border-encre-noire/10 pt-3 mt-1">
                    <CordelButton 
                      variant="ocre" 
                      onClick={() => handlePublishDefinitive(localPoints, approvals)}
                      disabled={isSaving}
                      className="text-xs py-1.5 px-3 font-extrabold"
                    >
                      {isSaving ? "⏳ Publication..." : "⚡ Publier définitivement"}
                    </CordelButton>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 5. Message Published */}
          {reportStatus === 'publie' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-center text-xs font-bold text-green-800">
              🎉 Ce compte-rendu a été définitivement approuvé et archivé sous la corde "Comptes-rendus" du Varal.
            </div>
          )}

        </div>
      )}
      
    </div>
  );
}
