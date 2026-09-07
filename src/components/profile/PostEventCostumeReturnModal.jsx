import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

/**
 * Composant Modulaire : PostEventCostumeReturnModal
 * Modale Cordel permettant aux participants d'un événement de déclarer
 * le statut de retour de leur costume (Rendu au bac, Lavage à domicile ou Retouche nécessaire).
 *
 * @param {Object} props.event - Document de l'événement Firestore
 * @param {string} props.userId - Identifiant unique de l'utilisateur connecté
 * @param {string} props.userEmail - Adresse e-mail de l'utilisateur (repli si nécessaire)
 * @param {Function} props.onClose - Callback de fermeture de la modale
 * @param {Function} props.onSuccess - Callback optionnel appelé après validation
 */
export default function PostEventCostumeReturnModal({
  event,
  userId,
  userEmail,
  onClose,
  onSuccess
}) {
  // Recherche de l'inscription correspondante pour le membre connecté
  const inscriptions = Array.isArray(event?.inscriptions) ? event.inscriptions : [];
  const currentInscription = inscriptions.find((ins) => {
    if (ins.userId && userId && ins.userId === userId) return true;
    if (ins.email && userEmail && ins.email.toLowerCase() === userEmail.toLowerCase()) return true;
    if (ins.userEmail && userEmail && ins.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
    return false;
  });

  const existingStatus = currentInscription?.costumeStatus || null;
  const existingNote = currentInscription?.costumeRetoucheNote || '';

  // États locaux du formulaire
  const [selectedStatus, setSelectedStatus] = useState(existingStatus || 'rendu');
  const [retoucheNote, setRetoucheNote] = useState(existingNote);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Nettoyage sécurisé du paramètre d'URL eventId pour éviter la réouverture intempestive
  const cleanUrlParam = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('eventId')) {
        searchParams.delete('eventId');
        const cleanQuery = searchParams.toString() ? '?' + searchParams.toString() : '';
        const cleanPath = window.location.pathname + cleanQuery;
        window.history.replaceState({ ...window.history.state, eventId: null }, '', cleanPath);
      }
    } catch (err) {
      console.warn("PostEventCostumeReturnModal - Impossible de nettoyer l'URL :", err);
    }
  };

  // Enregistrement atomique de la déclaration dans le tableau des inscriptions
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (selectedStatus === 'retouche' && !retoucheNote.trim()) {
      setErrorMessage("Merci d'indiquer la retouche nécessaire pour l'atelier couture.");
      return;
    }

    if (!event?.id) {
      setErrorMessage("Identifiant d'événement manquant.");
      return;
    }

    setSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);

      // Clonage et mise à jour atomique du tableau inscriptions
      let matched = false;
      const updatedInscriptions = inscriptions.map((ins) => {
        const isTarget = (ins.userId && userId && ins.userId === userId) ||
                         (ins.email && userEmail && ins.email.toLowerCase() === userEmail.toLowerCase()) ||
                         (ins.userEmail && userEmail && ins.userEmail.toLowerCase() === userEmail.toLowerCase());

        if (isTarget) {
          matched = true;
          return {
            ...ins,
            costumeStatus: selectedStatus, // 'rendu' | 'lavage' | 'retouche'
            costumeDeclarationDate: new Date().toISOString(),
            costumeRetoucheNote: selectedStatus === 'retouche' ? retoucheNote.trim() : (ins.costumeRetoucheNote || '')
          };
        }
        return ins;
      });

      // Si le membre n'était pas trouvé dans inscriptions mais qu'il est présent
      if (!matched && userId) {
        updatedInscriptions.push({
          userId: userId,
          status: 'present',
          costumeStatus: selectedStatus,
          costumeDeclarationDate: new Date().toISOString(),
          costumeRetoucheNote: selectedStatus === 'retouche' ? retoucheNote.trim() : ''
        });
      }

      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      setSuccessMessage("Déclaration enregistrée avec succès ! Merci pour ton retour.");
      cleanUrlParam();

      if (onSuccess) {
        onSuccess(selectedStatus);
      }

      // Fermeture temporisée pour laisser le temps de voir la confirmation
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error("PostEventCostumeReturnModal - Erreur enregistrement :", err);
      setErrorMessage("Erreur lors de l'enregistrement de ta déclaration. Merci de réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const handleModalClose = () => {
    cleanUrlParam();
    onClose();
  };

  const eventName = event?.titre || event?.nom || "Prestation";
  const eventDate = event?.dateFin || event?.date || "";

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={handleModalClose}
    >
      <div 
        className="w-full max-w-lg select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <CordelCard variant="default" useExtremeBorder={true} className="flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
          {/* En-tête Cordel */}
          <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <h3 className="text-base font-heading font-black tracking-wider text-cordel-wood uppercase">
                  Retour des Costumes
                </h3>
              </div>
              <p className="text-[11px] font-bold text-cordel-master-dark mt-0.5">
                {eventName} {eventDate && `— ${eventDate.split('T')[0]}`}
              </p>
            </div>
            <button
              type="button"
              onClick={handleModalClose}
              disabled={saving}
              className="text-lg font-black text-cordel-master-dark hover:text-cordel-wood cursor-pointer p-1"
              title="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Rappel d'instruction amicale */}
          <div className="bg-cordel-bg-light/70 border border-dashed border-cordel-master-dark/20 rounded-[6px_10px_8px_12px] p-2.5 text-[11px] font-medium text-encre-noire leading-relaxed">
            Merci pour ta participation à cette prestation ! Afin d'assurer le suivi de la garde-robe collective, indique ce que tu as fait de ta tenue de scène.
          </div>

          {/* Statut déjà renseigné si existant */}
          {existingStatus && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded text-[11px] font-bold">
              <span>ℹ️</span>
              <span>
                Statut actuel enregistré : <strong className="uppercase">{existingStatus}</strong>. Tu peux le modifier ci-dessous si la situation a évolué.
              </span>
            </div>
          )}

          {/* Formulaire de choix */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-cordel-master-dark">
                Choisis une option :
              </label>

              {/* Option 1 : Rendu au bac */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-[6px_10px_8px_12px] border-2 cursor-pointer transition-all ${
                  selectedStatus === 'rendu'
                    ? 'border-[#2d6a4f] bg-emerald-50/90 shadow-[2px_2px_0px_0px_#2d6a4f]'
                    : 'border-cordel-master-dark/25 bg-white/60 hover:bg-white/90'
                }`}
              >
                <input
                  type="radio"
                  name="costumeStatus"
                  value="rendu"
                  checked={selectedStatus === 'rendu'}
                  onChange={() => setSelectedStatus('rendu')}
                  disabled={saving}
                  className="mt-0.5 accent-[#2d6a4f] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-encre-noire flex items-center gap-1.5">
                    <span>📦</span> Rendu au bac / malle collective
                  </span>
                  <span className="text-[10px] text-cordel-master-dark/80 font-medium mt-0.5 leading-snug">
                    J'ai replié et rangé mon costume propre dans le bac ou la cantine collective après la sortie.
                  </span>
                </div>
              </label>

              {/* Option 2 : En lavage à domicile */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-[6px_10px_8px_12px] border-2 cursor-pointer transition-all ${
                  selectedStatus === 'lavage'
                    ? 'border-[#c05621] bg-amber-50/90 shadow-[2px_2px_0px_0px_#c05621]'
                    : 'border-cordel-master-dark/25 bg-white/60 hover:bg-white/90'
                }`}
              >
                <input
                  type="radio"
                  name="costumeStatus"
                  value="lavage"
                  checked={selectedStatus === 'lavage'}
                  onChange={() => setSelectedStatus('lavage')}
                  disabled={saving}
                  className="mt-0.5 accent-[#c05621] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-encre-noire flex items-center gap-1.5">
                    <span>🧺</span> En lavage à domicile
                  </span>
                  <span className="text-[10px] text-cordel-master-dark/80 font-medium mt-0.5 leading-snug">
                    J'ai emporté mon costume à la maison pour le laver. Je m'engage à le rapporter propre à la prochaine répétition.
                  </span>
                </div>
              </label>

              {/* Option 3 : Retouche nécessaire */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-[6px_10px_8px_12px] border-2 cursor-pointer transition-all ${
                  selectedStatus === 'retouche'
                    ? 'border-[var(--theme-primary)] bg-red-50/90 shadow-[2px_2px_0px_0px_#8b2a1a]'
                    : 'border-cordel-master-dark/25 bg-white/60 hover:bg-white/90'
                }`}
              >
                <input
                  type="radio"
                  name="costumeStatus"
                  value="retouche"
                  checked={selectedStatus === 'retouche'}
                  onChange={() => setSelectedStatus('retouche')}
                  disabled={saving}
                  className="mt-0.5 accent-[#8b2a1a] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-encre-noire flex items-center gap-1.5">
                    <span>🧵</span> Retouche / réparation nécessaire
                  </span>
                  <span className="text-[10px] text-cordel-master-dark/80 font-medium mt-0.5 leading-snug">
                    Un élément a été abîmé (bouton décousu, déchirure, ornement détaché, tâche tenace...).
                  </span>
                </div>
              </label>
            </div>

            {/* Champ de note spécifique pour la retouche */}
            {selectedStatus === 'retouche' && (
              <div className="flex flex-col gap-1 mt-1 animate-fadeIn">
                <label className="text-[10px] uppercase font-bold text-cordel-wood">
                  Description du problème pour l'Atelier Couture * :
                </label>
                <textarea
                  rows={3}
                  value={retoucheNote}
                  onChange={(e) => setRetoucheNote(e.target.value)}
                  placeholder="Ex : Bouton manquant sur la chemise côté gauche, couture défaite au bas de la jupe..."
                  required
                  disabled={saving}
                  className="theme-input text-xs font-medium py-2 px-2.5 bg-white border-red-400 focus:border-red-600 rounded"
                />
              </div>
            )}

            {/* Messages d'erreur ou de succès */}
            {errorMessage && (
              <div className="text-[11px] font-bold text-red-700 bg-red-100/90 border border-red-400 p-2 rounded">
                ⚠️ {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-400 p-2 rounded">
                ✅ {successMessage}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-dashed border-cordel-master-dark/20 mt-2">
              <CordelButton
                type="button"
                variant="default"
                onClick={handleModalClose}
                disabled={saving}
                className="px-3 py-2 text-xs font-bold uppercase"
              >
                Fermer
              </CordelButton>

              <CordelButton
                type="submit"
                variant={selectedStatus === 'retouche' ? 'danger' : 'vert'}
                disabled={saving}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
              >
                {saving ? "Enregistrement..." : "💾 Valider ma déclaration"}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      </div>
    </div>
  );
}
