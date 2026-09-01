import React, { useState, useEffect } from 'react';
import CordelButton from './CordelButton';
import { XiloClose, XiloMegaphone } from './XiloIcons';
import { db } from '../firebase';

export default function FeedbackModal({
  isOpen,
  onClose,
  profileData,
  associationName
}) {
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setType('bug');
      setSubject('');
      setDescription('');
      setSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      type,
      subject: subject.trim(),
      description: description.trim(),
      userId: profileData?.uid || 'N/A',
      context: {
        groupId: profileData?.groupId || 'N/A',
        associationName: associationName || 'N/A',
        userRole: profileData?.role || 'N/A',
        userEmail: profileData?.email || 'N/A',
        userId: profileData?.uid || 'N/A',
        pageUrl: window.location.href,
        appVersion: import.meta.env.VITE_APP_VERSION || 'N/A',
        userAgent: navigator.userAgent
      },
      timestamp: new Date().toISOString()
    };

    try {
      const hubUrl = import.meta.env.VITE_OGIRADOR_HUB_URL;
      const apiKey = import.meta.env.VITE_OGIRADOR_HUB_API_KEY || '';
      
      if (!hubUrl) {
        throw new Error("L'URL du Hub n'est pas configurée.");
      }

      const response = await fetch(hubUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({
          collectionType: 'ticket',
          data: {
            ...payload,
            appSource: 'organizador'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Hub API request failed');
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Erreur Feedback :", err);
      setErrorMsg("L'envoi a échoué. Veuillez réessayer plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in select-none">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={!isSubmitting ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="relative z-10 bg-[#fcf8f2] dark:bg-[#1a1918] border-2 border-dashed border-cordel-master-dark/40 shadow-2xl rounded-lg p-5 max-w-md w-full text-left overflow-hidden flex flex-col gap-4">
        
        <div className="flex items-start justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded border shadow-xs shrink-0 bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800">
              <XiloMegaphone size={22} />
            </span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-cordel-wood opacity-80">
                Support / Feedback
              </span>
              <h3 className="font-cactus font-bold text-base uppercase tracking-wider text-encre-noire dark:text-cordel-bg">
                Un problème ? Une idée ?
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-cordel-master-dark/60 hover:text-cordel-master-dark transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            title="Fermer"
          >
            <XiloClose size={18} />
          </button>
        </div>

        {success ? (
          <div className="bg-[#2d6a4f]/10 p-4 rounded border border-[#2d6a4f]/30 text-center flex flex-col items-center gap-2">
            <span className="text-3xl">✅</span>
            <h4 className="font-black text-[#2d6a4f] dark:text-emerald-400 uppercase tracking-wider text-sm">Message Envoyé</h4>
            <p className="text-xs font-semibold text-encre-noire dark:text-cordel-bg opacity-80">
              Merci pour votre retour ! L'équipe technique va l'étudier.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="bg-[#8b2a1a]/10 p-2 rounded border border-[#8b2a1a]/30 text-xs font-bold text-[#8b2a1a] dark:text-red-400">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider opacity-70">Type de retour</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType('bug')}
                  className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded border-2 transition-all ${
                    type === 'bug' 
                      ? 'bg-[#8b2a1a] text-white border-[#8b2a1a]' 
                      : 'bg-transparent border-cordel-master-dark/20 text-encre-noire dark:text-cordel-bg hover:border-cordel-master-dark/50'
                  }`}
                >
                  🐛 Bug
                </button>
                <button
                  type="button"
                  onClick={() => setType('idea')}
                  className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded border-2 transition-all ${
                    type === 'idea' 
                      ? 'bg-[#2d6a4f] text-white border-[#2d6a4f]' 
                      : 'bg-transparent border-cordel-master-dark/20 text-encre-noire dark:text-cordel-bg hover:border-cordel-master-dark/50'
                  }`}
                >
                  💡 Idée
                </button>
                <button
                  type="button"
                  onClick={() => setType('help')}
                  className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider rounded border-2 transition-all ${
                    type === 'help' 
                      ? 'bg-[#c05621] text-white border-[#c05621]' 
                      : 'bg-transparent border-cordel-master-dark/20 text-encre-noire dark:text-cordel-bg hover:border-cordel-master-dark/50'
                  }`}
                >
                  ❓ Aide
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-[10px] font-black uppercase tracking-wider opacity-70">Sujet court</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Le bouton X ne fonctionne pas"
                className="w-full bg-white dark:bg-black/30 border-2 border-cordel-master-dark/20 rounded p-2 text-xs font-semibold focus:border-cordel-master-dark focus:outline-none transition-colors"
                maxLength={100}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-[10px] font-black uppercase tracking-wider opacity-70">Description détaillée</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre problème ou votre idée avec un maximum de détails..."
                className="w-full bg-white dark:bg-black/30 border-2 border-cordel-master-dark/20 rounded p-2 text-xs font-semibold min-h-[100px] resize-y focus:border-cordel-master-dark focus:outline-none transition-colors"
                required
              />
            </div>
            
            <p className="text-[9px] font-bold text-encre-noire dark:text-cordel-bg opacity-50 italic">
              Vos informations (rôle, page actuelle, version) seront envoyées automatiquement pour nous aider à diagnostiquer le problème.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 mt-2 border-t border-dashed border-cordel-master-dark/20">
              <CordelButton
                variant="default"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-xs px-4 py-2 opacity-90 hover:opacity-100"
              >
                Annuler
              </CordelButton>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`text-xs font-black uppercase tracking-wider px-5 py-2 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all border border-encre-noire cursor-pointer bg-[#c05621] hover:brightness-110 text-white disabled:opacity-70 disabled:cursor-wait`}
              >
                {isSubmitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
