import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';

export default function CreateThreadForm({ groupId, user, profileData, onClose }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Général');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupId || !title || !message) return;

    setSaving(true);
    const nowIso = new Date().toISOString();
    
    try {
      const authorName = `${profileData.prenom} ${profileData.nom}`;

      await addDoc(collection(db, 'forum'), {
        titre: title,
        categorie: category,
        groupId: groupId,
        auteurId: user.uid,
        auteurNom: authorName,
        dateCreation: nowIso,
        derniereModification: nowIso,
        reponses: [
          {
            auteurId: user.uid,
            auteurNom: authorName,
            message: message,
            dateCreation: nowIso
          }
        ]
      });

      console.log("CreateThreadForm - Discussion créée avec succès !");
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

        {/* First Message */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {t('forum.firstMessageLabel')}
          </label>
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
