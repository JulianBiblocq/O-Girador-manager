import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import RichTextEditor from './RichTextEditor';

import { getTagId } from '../utils/tagUtils';

export default function CreateThreadForm({ groupId, channelId, user, profileData, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Général');
  const [message, setMessage] = useState('');
  const [availableTargets, setAvailableTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [saving, setSaving] = useState(false);

  // Poll state
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false);

  const handleAddPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const handleRemovePollOption = (idx) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handlePollOptionChange = (idx, val) => {
    setPollOptions(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // Load available tags and instruments from association document in real-time
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const tags = data.tagsDisponibles || [];
        const tagLabels = tags.map(t => getTagId(t)).filter(Boolean);
        const instruments = data.instrumentsDisponibles || [];
        const combined = [...new Set([...tagLabels, ...instruments])].filter(Boolean).sort();
        setAvailableTargets(combined);
      }
    }, (error) => {
      console.error("CreateThreadForm - Error fetching association targets:", error);
    });
    return () => unsubscribe();
  }, [groupId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!groupId || !cleanTitle || !cleanMessage) return;

    setSaving(true);
    const nowIso = new Date().toISOString();
    const targetChannelId = channelId || `${groupId}_general`;
    
    try {
      const authorName = `${profileData.prenom} ${profileData.nom}`;

      let pollPayload = null;
      if (showPollForm && pollQuestion.trim()) {
        const validOpts = pollOptions.filter(o => o.trim() !== '');
        if (validOpts.length >= 2) {
          pollPayload = {
            question: pollQuestion.trim(),
            allowMultiple: pollAllowMultiple,
            isClosed: false,
            options: validOpts.map((label, idx) => ({
              id: `opt_${Date.now()}_${idx}`,
              label: label.trim(),
              votes: []
            }))
          };
        }
      }

      const docRef = await addDoc(collection(db, 'forum'), {
        titre: cleanTitle,
        categorie: category,
        groupId: groupId,
        channelId: targetChannelId,
        auteurId: user.uid,
        auteurNom: authorName,
        dateCreation: nowIso,
        derniereModification: nowIso,
        targetTag: selectedTarget || null,
        isPinned: false,
        ...(pollPayload ? { poll: pollPayload } : {}),
        reponses: [
          {
            auteurId: user.uid,
            auteurNom: authorName,
            message: cleanMessage,
            dateCreation: nowIso,
            targetTag: selectedTarget || null
          }
        ]
      });

      // Détecter les mentions @Badge
      const mentions = availableTargets.filter(tag => {
        const regex = new RegExp(`@${tag}\\b`, 'gi');
        return regex.test(cleanMessage);
      });

      if (mentions.length > 0) {
        for (const tag of mentions) {
          try {
            await addDoc(collection(db, 'notifications_queue'), {
              groupId: groupId,
              title: `Mention dans le forum (${cleanTitle})`,
              body: `${authorName} vous a mentionné : "${cleanMessage.slice(0, 100)}${cleanMessage.length > 100 ? '...' : ''}"`,
              targetTag: tag,
              senderId: user.uid,
              threadId: docRef.id,
              channelId: targetChannelId,
              createdAt: nowIso
            });
          } catch (err) {
            console.error("Error writing notification queue doc from thread creator:", err);
          }
        }
      }

      onClose();
    } catch (error) {
      console.error("CreateThreadForm - Erreur addDoc :", error);
      alert(t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="text-left py-6">
      <h4 className="panel-title text-base font-bold mb-4 text-cordel-wood">
        {t('forum.newThreadTitle')}
      </h4>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('forum.subjectLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={saving}
            placeholder={t('forum.subjectPlaceholder')}
            className="theme-input w-full disabled:opacity-50"
          />
        </div>

        {/* Category Select */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('forum.categoryLabel')}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={saving}
            className="theme-input w-full disabled:opacity-50"
          >
            <option value="Général">{t('forum.Général')} (Apéros, actus, etc.)</option>
            <option value="Costumes">{t('forum.Costumes')} (Ateliers, couture)</option>
            <option value="Covoiturage">{t('forum.Covoiturage')} (Trajets)</option>
            <option value="Autre">{t('forum.Autre')}</option>
          </select>
        </div>

        {/* Target Group Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            🗣️ {t('forum.targetGroup') || "Cibler un groupe (Optionnel)"}
          </label>
          <select
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
            disabled={saving}
            className="theme-input w-full disabled:opacity-50 text-xs py-1.5 font-bold"
          >
            <option value="">{t('forum.targetAll') || "-- Tout le monde --"}</option>
            {availableTargets.map((target) => (
              <option key={target} value={target}>
                {target}
              </option>
            ))}
          </select>
        </div>

        {/* First Message */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('forum.firstMessageLabel')}
          </label>
          {availableTargets.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 my-1.5 select-none">
              <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">Mentionner :</span>
              {availableTargets.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMessage(prev => prev + `@${tag} `)}
                  className="px-2 py-0.5 text-[9px] font-bold bg-cordel-bg border border-cordel-master-dark/20 rounded hover:border-encre-noire transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(24,23,22,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  @{tag}
                </button>
              ))}
            </div>
          )}

          <RichTextEditor
            value={message}
            onChange={setMessage}
            disabled={saving}
            placeholder={t('forum.messagePlaceholder')}
            groupId={groupId}
            minHeight="140px"
          />
        </div>

        {/* Toggle Poll Form Section */}
        <div className="flex flex-col gap-2 pt-1 border-t border-dashed border-cordel-master-dark/15 select-none">
          <button
            type="button"
            onClick={() => setShowPollForm(!showPollForm)}
            className="text-[10px] font-black uppercase tracking-wider text-cordel-wood hover:underline flex items-center gap-1.5 w-fit cursor-pointer"
          >
            📊 {showPollForm ? "Retirer le sondage" : "Créer un sondage"}
          </button>

          {showPollForm && (
            <div className="p-3.5 bg-cordel-bg-light border-2 border-cordel-master-dark/25 rounded-[6px] flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1">
                📊 Paramètres du Sondage
              </span>

              {/* Poll Question */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Question du sondage
                </label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ex : Quelle date préférez-vous pour le stage ?"
                  disabled={saving}
                  className="theme-input w-full text-xs font-bold"
                />
              </div>

              {/* Options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Choix de réponses (Minimum 2)
                </label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                      placeholder={`Choix ${idx + 1}...`}
                      disabled={saving}
                      className="theme-input text-xs flex-1 font-semibold py-1.5"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePollOption(idx)}
                        disabled={saving}
                        className="text-red-700 hover:text-red-900 text-xs font-black px-2 py-1 rounded bg-red-50 border border-red-200 cursor-pointer"
                        title="Supprimer ce choix"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {pollOptions.length < 10 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    disabled={saving}
                    className="text-[9px] font-black uppercase text-cordel-wood hover:underline mt-1 self-start cursor-pointer"
                  >
                    ➕ Ajouter un choix
                  </button>
                )}
              </div>

              {/* Allow Multiple Choices option */}
              <label className="flex items-center gap-2 cursor-pointer select-none border-t border-dashed border-cordel-master-dark/15 pt-2 mt-1">
                <input
                  type="checkbox"
                  checked={pollAllowMultiple}
                  onChange={(e) => setPollAllowMultiple(e.target.checked)}
                  disabled={saving}
                  className="w-3.5 h-3.5 border border-encre-noire rounded accent-cordel-wood cursor-pointer"
                />
                <span className="text-[10px] font-bold text-encre-noire">
                  Autoriser les choix multiples (les membres peuvent voter pour plusieurs réponses)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-2">
          <CordelButton 
            type="button"
            variant="default" 
            onClick={onClose} 
            disabled={saving}
            className="text-xs px-4 py-2"
          >
            {t('common.cancel')}
          </CordelButton>
          <CordelButton 
            type="submit"
            variant="ocre" 
            useExtremeBorder={true}
            disabled={saving}
            className="text-xs px-4 py-2"
          >
            {saving ? t('forum.creatingMsg') : (t('common.confirm') || "Valider")}
          </CordelButton>
        </div>
      </form>
    </CordelCard>
  );
}
