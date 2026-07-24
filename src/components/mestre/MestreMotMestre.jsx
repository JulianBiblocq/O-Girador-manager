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

  // Load from associations/{groupId} in real-time
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
        motDuMestrePublie: publie
      });
      alert("Le mot du Mestre a été mis à jour avec succès !");
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
        <XiloMegaphone size={16} className="text-cordel-wood" /> Gestion du Mot du Mestre
      </h3>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4">
          
          {/* Toggle Publier / Masquer */}
          <div className="flex items-center gap-2 pb-3.5 border-b border-dashed border-cordel-master-dark/15 select-none">
            <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={publie}
                onChange={(e) => setPublie(e.target.checked)}
                className="accent-cordel-wood scale-110"
              />
              <span>Publier et afficher sur le tableau de bord des membres</span>
            </label>
          </div>

          {/* Éditeur de texte */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Message du Mestre (Éditeur)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={saving}
              rows={6}
              placeholder="Rédigez votre message à l'attention des membres..."
              className="theme-input w-full p-3 font-medium text-sm leading-relaxed border border-encre-noire bg-cordel-bg-light rounded"
              required
            />
          </div>

          {/* Signature / Auteur */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-cordel-master-dark">
              Signature / Auteur du message
            </label>
            <input
              type="text"
              value={auteur}
              onChange={(e) => setAuteur(e.target.value)}
              placeholder="Ex : Mestre, L'équipe..."
              disabled={saving}
              className="theme-input w-full py-1.5 px-3 font-bold text-sm bg-cordel-bg-light"
            />
          </div>

        </CordelCard>

        <CordelButton
          type="submit"
          variant="ocre"
          useExtremeBorder={true}
          disabled={saving}
          className="w-full py-3 text-xs font-bold uppercase tracking-widest"
        >
          {saving ? "Enregistrement..." : "Enregistrer et publier"}
        </CordelButton>
      </form>
    </div>
  );
}
