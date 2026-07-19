import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

export default function CreateThreadForm({ groupId, channelId, user, profileData, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Général');
  const [message, setMessage] = useState('');
  const [availableTargets, setAvailableTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [saving, setSaving] = useState(false);

  // Load available tags and instruments from association document in real-time
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const tags = data.tagsDisponibles || [];
        const instruments = data.instrumentsDisponibles || [];
        const combined = [...new Set([...tags, ...instruments])].filter(Boolean).sort();
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

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={saving}
            rows="4"
            placeholder={t('forum.messagePlaceholder')}
            className="theme-input w-full resize-none disabled:opacity-50 text-sm"
          />
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
