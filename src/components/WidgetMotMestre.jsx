import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloChisel, XiloClose } from './XiloIcons';

export default function WidgetMotMestre({ role, isSystemAdmin, groupId }) {
  const [motDuMestre, setMotDuMestre] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [saving, setSaving] = useState(false);

  const isAuthorized = role === 'mestre' || role === 'super-admin' || isSystemAdmin === true;

  // Real-time synchronization with Firestore associations/{groupId}
  useEffect(() => {
    if (!groupId) {
      setMotDuMestre('');
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMotDuMestre(docSnap.data().motDuMestre || '');
      } else {
        setMotDuMestre('');
      }
      setLoading(false);
    }, (error) => {
      console.error("WidgetMotMestre - Erreur onSnapshot :", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleEditToggle = () => {
    setDraftText(motDuMestre || "Bienvenue dans notre espace !");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!groupId) {
      alert("Erreur : Aucun groupe (groupId) n'est associé à votre compte. Veuillez utiliser un lien d'invitation de groupe.");
      return;
    }
    setSaving(true);
    try {
      const docRef = doc(db, 'associations', groupId);
      // Merge updates only the motDuMestre field, preserving branding, subscription, etc.
      await setDoc(docRef, { motDuMestre: draftText }, { merge: true });
      setIsEditing(false);
    } catch (error) {
      console.error("WidgetMotMestre - Erreur setDoc :", error);
      alert("Erreur lors de la sauvegarde du message.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const displayedMessage = motDuMestre || "Bienvenue dans notre espace !";

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="relative overflow-hidden">
      {/* Decorative background stamp simulator */}
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.06] select-none pointer-events-none transform rotate-12">
        M
      </div>

      {/* Edit Trigger Buttons (visible only for authorized members when not loading) */}
      {!loading && isAuthorized && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleCancel}
                disabled={saving}
                className="theme-btn bg-neutral-200 text-encre-noire p-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer select-none disabled:opacity-50 flex items-center justify-center"
                title="Annuler"
              >
                <XiloClose size={12} />
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="theme-btn bg-cordel-vert text-encre-noire p-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer select-none disabled:opacity-50 flex items-center justify-center"
                title="Enregistrer"
              >
                {saving ? "..." : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="xilo-icon">
                    <path d="M20 6 L9 17 L4 12" />
                  </svg>
                )}
              </button>
            </>
          ) : (
            <button 
              onClick={handleEditToggle}
              className="theme-btn bg-cordel-bg-light hover:bg-[#ece4d0] p-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer select-none flex items-center justify-center"
              title="Modifier le mot du mestre"
            >
              <XiloChisel size={12} />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳</span>
        </div>
      ) : (
        <div className="flex gap-4 items-start text-left">
          {/* Mestre avatar/stamp simulator */}
          <div className="w-12 h-12 bg-cordel-master-dark text-cordel-bg-light border-2 border-encre-noire flex items-center justify-center font-bold text-lg shrink-0 rounded-[8px_14px_6px_10px] shadow-[2px_2px_0px_0px_#181716] select-none">
            M
          </div>
          
          <div className="flex-1 pr-12 min-h-[64px]">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-1">
              Le Mot du Mestre
            </h3>
            
            {isEditing ? (
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                disabled={saving}
                className="theme-input w-full min-h-[80px] text-sm resize-none disabled:opacity-50"
                rows="3"
                placeholder="Entrez votre message ici..."
              />
            ) : (
              <p className="text-sm italic leading-relaxed font-medium whitespace-pre-wrap">
                "{displayedMessage}"
              </p>
            )}

            {!isEditing && (
              <div className="text-right mt-2 text-[10px] font-bold uppercase tracking-widest opacity-65">
                — Mestre Nico
              </div>
            )}
          </div>
        </div>
      )}
    </CordelCard>
  );
}
