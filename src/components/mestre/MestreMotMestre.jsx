import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloMegaphone } from '../XiloIcons';

export default function MestreMotMestre({ groupId, profileData }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [text, setText] = useState('');
  const [auteur, setAuteur] = useState('');
  const [publie, setPublie] = useState(true);
  const [actionText, setActionText] = useState('');
  const [actionLink, setActionLink] = useState('');

  // Charger from associations/{groupId} in real-time
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const docRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setText(data.motDuMestre || '');
        setAuteur(data.motDuMestreAuteur || '');
        setPublie(data.motDuMestrePublie !== false);
        setActionText(data.motDuMestreActionText || '');
        setActionLink(data.motDuMestreActionLink || '');
      }
      setLoading(false);
    }, (error) => {
      console.error("MestreMotMestre - Error onSnapshot:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!groupId) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'associations', groupId);
      await updateDoc(docRef, {
        motDuMestre: text.trim(),
        motDuMestreAuteur: auteur.trim() || profileData?.prenom || "L'équipe",
        motDuMestrePublie: publie,
        motDuMestreActionText: actionText.trim(),
        motDuMestreActionLink: actionLink.trim()
      });
      alert(t('mestre.editorial.motMestreUpdateSuccess'));
    } catch (error) {
      console.error("MestreMotMestre - Erreur de sauvegarde :", error);
      alert("Erreur lors de l'enregistrement : " + (error.message || error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 text-left max-w-2xl mx-auto">
      <h3 className="text-base font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-2">
        <XiloMegaphone size={16} className="text-cordel-wood" /> {t('mestre.editorial.manageHeading')}
      </h3>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
          
          {/* Basculer Publier / Masquer */}
          <div className="flex items-center gap-2 pb-3.5 border-b border-dashed border-cordel-master-dark/15 select-none">
            <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={publie}
                onChange={(e) => setPublie(e.target.checked)}
                className="accent-cordel-wood scale-110"
              />
              <span>{t('mestre.editorial.publishOnMemberDashboardLabel')}</span>
            </label>
          </div>

          {/* Éditeur de texte */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('mestre.editorial.editorLabel')}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={saving}
              rows={6}
              placeholder={t('mestre.editorial.editorPlaceholder')}
              className="theme-input w-full p-3 font-medium text-sm leading-relaxed border border-encre-noire bg-cordel-bg-light rounded"
              required
            />
          </div>

          {/* Signature / Auteur */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('mestre.editorial.signatureLabel')}
            </label>
            <input
              type="text"
              value={auteur}
              onChange={(e) => setAuteur(e.target.value)}
              placeholder={t('mestre.editorial.signaturePlaceholder')}
              disabled={saving}
              className="theme-input w-full py-1.5 px-3 font-bold text-sm bg-cordel-bg-light"
            />
          </div>

          {/* Bouton d'action / CTA Optionnel */}
          <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/15 pt-3">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-wood flex items-center gap-1">
              {t('mestre.editorial.ctaSectionHeading')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('mestre.editorial.ctaTextLabel')}
                </label>
                <input
                  type="text"
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  disabled={saving}
                  placeholder={t('mestre.editorial.ctaTextPlaceholder')}
                  className="theme-input w-full py-1.5 px-3 text-xs bg-cordel-bg-light"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('mestre.editorial.ctaRouteLabel')}
                </label>
                <input
                  type="text"
                  value={actionLink}
                  onChange={(e) => setActionLink(e.target.value)}
                  disabled={saving}
                  placeholder={t('mestre.editorial.ctaRoutePlaceholder')}
                  className="theme-input w-full py-1.5 px-3 text-xs bg-cordel-bg-light"
                />
              </div>
            </div>
          </div>

        </CordelCard>

        <CordelButton
          type="submit"
          variant="ocre"
          useExtremeBorder={true}
          disabled={saving}
          className="w-full py-3 text-xs font-bold uppercase tracking-widest"
        >
          {saving ? (t('common.saving') || "Enregistrement...") : t('mestre.btnSaveAndPublish')}
        </CordelButton>
      </form>
    </div>
  );
}
