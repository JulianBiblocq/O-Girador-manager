import React, { useState } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import useConfirm from '../../../hooks/useConfirm';
import ThreadMediaGallery from './ThreadMediaGallery';
import { canonicalizeGroupId } from '../../../utils/tenantUtils';

/**
 * Carte interactive de revue et de validation collaborative pour les publications
 * préparées dans le Studio Social et soumises dans le Forum (Porte-Voix).
 *
 * @param {Object} props
 * @param {Object} props.thread Document de la discussion forum
 * @param {string} props.userId Identifiant de l'utilisateur connecté
 * @param {Object} props.profileData Profil de l'utilisateur connecté
 * @param {boolean} props.isModeratorOrAdmin Droits de modération ou d'administration
 * @param {Array} props.allUsers Liste des membres pour résolution des noms
 */
export default function ThreadValidationCard({
  thread,
  userId,
  profileData,
  isModeratorOrAdmin = false,
  allUsers = []
}) {
  const { confirm } = useConfirm();
  const [submittingAction, setSubmittingAction] = useState(false);
  const [isRetoucheModalOpen, setIsRetoucheModalOpen] = useState(false);
  const [retoucheNote, setRetoucheNote] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const validationData = thread?.validationData;
  if (!validationData) return null;

  const statut = validationData.statut || 'en_attente';
  const eventId = validationData.eventId;
  const redacteurId = validationData.redacteurId;
  const redacteurNom = validationData.redacteurNom || 'Membre';
  const visuelUrl = validationData.visuelUrl;
  const mediaUrls = Array.isArray(validationData.mediaUrls) && validationData.mediaUrls.length > 0
    ? validationData.mediaUrls
    : (visuelUrl ? [visuelUrl] : []);
  const publicationTexte = validationData.texte || '';

  // Vérification des privilèges de revue (Admin, Mestre, Bureau, CA ou Modérateur)
  const userRoles = [
    profileData?.role,
    ...(profileData?.tags || []),
    ...(profileData?.rolesAssocies || [])
  ].filter(Boolean).map(r => String(r).toLowerCase());

  const canReview = isModeratorOrAdmin || userRoles.some(r => 
    ['mestre', 'super-admin', 'admin', 'bureau', 'ca', 'direction', 'président', 'présidente', 'modérateur', 'moderateur', 'porte-voix'].includes(r)
  );

  const getUserDisplayName = () => {
    if (profileData?.prenom || profileData?.nom) {
      return `${profileData.prenom || ''} ${profileData.nom || ''}`.trim();
    }
    return 'Responsable';
  };

  /**
   * Copie le texte de la publication directement dans le presse-papier
   */
  const handleCopyText = async () => {
    if (!publicationTexte) return;
    try {
      await navigator.clipboard.writeText(publicationTexte);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error("ThreadValidationCard - Erreur copie texte :", err);
    }
  };

  /**
   * Approbation finale de la publication : met à jour le sujet forum, l'événement Firestore
   * et notifie le rédacteur en temps réel.
   */
  const handleApprove = async () => {
    if (!canReview || submittingAction) return;

    const ok = await confirm({
      title: "Valider la publication",
      message: "Confirmez-vous l'approbation de cette publication pour les réseaux sociaux ?",
      confirmText: "Oui, valider",
      cancelText: "Annuler",
      variant: "success"
    });

    if (!ok) return;

    setSubmittingAction(true);
    const nowIso = new Date().toISOString();
    const validatorName = getUserDisplayName();

    try {
      // 1. Mettre à jour les métadonnées de validation sur le sujet du Forum
      const threadRef = doc(db, 'forum', thread.id);
      const approvalReply = {
        auteurId: userId || 'system',
        auteurNom: validatorName,
        message: `<p>✅ <strong>Publication validée par ${validatorName} !</strong></p><p>Le visuel et le texte sont approuvés et prêts pour la diffusion sur les réseaux sociaux.</p>`,
        dateCreation: nowIso
      };

      await updateDoc(threadRef, {
        'validationData.statut': 'approuve',
        'validationData.validateurId': userId || 'system',
        'validationData.validateurNom': validatorName,
        'validationData.dateValidation': nowIso,
        reponses: [...(thread.reponses || []), approvalReply],
        derniereModification: nowIso
      });

      // 2. Mettre à jour l'événement lié dans la collection events si présent
      if (eventId) {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          statutPublication: 'approuve',
          publicationDateApprobation: nowIso,
          publicationApprouvePar: validatorName
        });
      }

      // 3. Notifier le rédacteur de l'approbation
      if (redacteurId && redacteurId !== userId) {
        const effectiveGroupId = canonicalizeGroupId(thread?.groupId || profileData?.groupId);
        const notifPayload = {
          groupId: effectiveGroupId,
          userId: redacteurId,
          recipientUserIds: [redacteurId],
          title: "✅ Publication approuvée !",
          body: `Votre proposition de publication pour "${thread.titre}" a été validée par ${validatorName}.`,
          type: 'studio_validation',
          link: `/forum?threadId=${thread.id}`,
          threadId: thread.id,
          read: false,
          createdAt: nowIso
        };

        // Notification interne in-app
        try {
          await addDoc(collection(db, 'notifications'), notifPayload);
        } catch (notifErr) {
          console.warn("ThreadValidationCard - Notification interne non transmise :", notifErr);
        }

        // Déclenchement dans la file de notifications Push FCM
        try {
          await addDoc(collection(db, 'notifications_queue'), notifPayload);
        } catch (pushErr) {
          console.warn("ThreadValidationCard - Notification push non transmise :", pushErr);
        }
      }
    } catch (err) {
      console.error("ThreadValidationCard - Erreur lors de la validation :", err);
      alert("Erreur lors de la validation : " + (err.message || err));
    } finally {
      setSubmittingAction(false);
    }
  };

  /**
   * Envoi d'une demande de retouche : met à jour le sujet forum, bascule l'événement
   * en statut 'brouillon' et avertit le rédacteur avec les consignes saisies.
   */
  const handleConfirmRetouche = async (e) => {
    e.preventDefault();
    if (!retoucheNote.trim() || submittingAction) return;

    setSubmittingAction(true);
    const nowIso = new Date().toISOString();
    const validatorName = getUserDisplayName();
    const cleanNote = retoucheNote.trim();

    try {
      // 1. Mettre à jour le statut du thread de validation
      const threadRef = doc(db, 'forum', thread.id);
      const retoucheReply = {
        auteurId: userId || 'system',
        auteurNom: validatorName,
        message: `<p>💬 <strong>Demande de retouche formulée par ${validatorName} :</strong></p><blockquote style="border-left: 3px solid #8b2a1a; padding-left: 8px; margin: 4px 0; color: #8b2a1a; font-style: italic;">${cleanNote}</blockquote>`,
        dateCreation: nowIso
      };

      await updateDoc(threadRef, {
        'validationData.statut': 'retouche_demandee',
        'validationData.demandeurRetoucheId': userId || 'system',
        'validationData.demandeurRetoucheNom': validatorName,
        'validationData.dateRetouche': nowIso,
        'validationData.retoucheMessage': cleanNote,
        reponses: [...(thread.reponses || []), retoucheReply],
        derniereModification: nowIso
      });

      // 2. Basculer l'événement en statut brouillon
      if (eventId) {
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          statutPublication: 'brouillon',
          publicationDerniereRetouche: cleanNote
        });
      }

      // 3. Notifier le rédacteur
      if (redacteurId && redacteurId !== userId) {
        const effectiveGroupId = canonicalizeGroupId(thread?.groupId || profileData?.groupId);
        const notifPayload = {
          groupId: effectiveGroupId,
          userId: redacteurId,
          recipientUserIds: [redacteurId],
          title: "💬 Retouche demandée pour votre publication",
          body: `${validatorName} a demandé des modifications : "${cleanNote.slice(0, 100)}"`,
          type: 'studio_retouche',
          link: `/forum?threadId=${thread.id}`,
          threadId: thread.id,
          read: false,
          createdAt: nowIso
        };

        // Notification interne in-app
        try {
          await addDoc(collection(db, 'notifications'), notifPayload);
        } catch (notifErr) {
          console.warn("ThreadValidationCard - Notification interne de retouche non transmise :", notifErr);
        }

        try {
          await addDoc(collection(db, 'notifications_queue'), notifPayload);
        } catch (pushErr) {
          console.warn("ThreadValidationCard - Notification push non transmise :", pushErr);
        }
      }

      setIsRetoucheModalOpen(false);
      setRetoucheNote('');
    } catch (err) {
      console.error("ThreadValidationCard - Erreur lors de la demande de retouche :", err);
      alert("Erreur lors de l'enregistrement de la retouche : " + (err.message || err));
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <CordelCard
      variant={statut === 'approuve' ? 'vert' : statut === 'retouche_demandee' ? 'default' : 'jaune'}
      useExtremeBorder={true}
      className="p-4 sm:p-5 flex flex-col gap-4 text-left relative overflow-hidden"
    >
      {/* En-tête de la carte d'approbation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-cordel-master-dark/20 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📢</span>
          <div>
            <h3 className="font-heading font-black text-xs sm:text-sm uppercase tracking-wider text-encre-noire">
              Revue de Publication Réseaux Sociaux
            </h3>
            <p className="text-[10px] text-cordel-master-dark/80 font-semibold">
              Proposée par <span className="font-bold text-encre-noire">{redacteurNom}</span>
              {validationData.dateSoumission && ` le ${new Date(validationData.dateSoumission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
        </div>

        {/* Badge d'état sémantique et indicateur multi-photos */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {mediaUrls.length > 1 && (
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] sm:text-[9px] uppercase tracking-wider flex items-center gap-1 font-black">
              📸 {mediaUrls.length} photos dans cette publication
            </span>
          )}
          {statut === 'approuve' ? (
            <span className="theme-stamp-badge theme-stamp-badge-vert text-[8px] sm:text-[9px] uppercase tracking-wider flex items-center gap-1 font-black">
              ✅ Validé pour diffusion
            </span>
          ) : statut === 'retouche_demandee' ? (
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] sm:text-[9px] uppercase tracking-wider flex items-center gap-1 font-black">
              💬 Retouche demandée
            </span>
          ) : (
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px] sm:text-[9px] uppercase tracking-wider flex items-center gap-1 font-black animate-pulse">
              ⏳ En attente d'approbation
            </span>
          )}
        </div>
      </div>

      {/* Contenu visuel et texte de la publication */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Aperçu des photos ou du visuel généré */}
        {mediaUrls.length > 0 && (
          <div className="md:col-span-5 flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              🖼️ {mediaUrls.length > 1 ? `Photos proposées (${mediaUrls.length})` : "Visuel de la publication"}
            </span>
            <ThreadMediaGallery mediaUrls={mediaUrls} />
          </div>
        )}

        {/* Texte préparé avec émoticônes et hashtags */}
        <div className={mediaUrls.length > 0 ? "md:col-span-7 flex flex-col gap-2" : "md:col-span-12 flex flex-col gap-2"}>
          <div className="flex justify-between items-center">
            <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              📝 Texte & Hashtags proposés
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-[10px] font-bold text-cordel-wood hover:text-encre-noire cursor-pointer flex items-center gap-1"
            >
              📋 {copySuccess ? "Copié !" : "Copier"}
            </button>
          </div>

          <pre className="text-xs font-mono p-3 bg-white border border-encre-noire/30 rounded leading-relaxed whitespace-pre-wrap select-text max-h-[260px] overflow-y-auto">
            {publicationTexte || "(Aucun texte renseigné)"}
          </pre>

          {validationData.retoucheMessage && (
            <div className="p-2.5 bg-red-50 border border-red-300 text-red-900 rounded text-xs">
              <strong className="block text-[10px] uppercase tracking-wider text-cordel-wood font-black mb-0.5">
                Dernière remarque de retouche :
              </strong>
              {validationData.retoucheMessage}
            </div>
          )}

          {validationData.validateurNom && statut === 'approuve' && (
            <div className="p-2.5 bg-green-50 border border-green-300 text-green-900 rounded text-xs flex items-center gap-1.5">
              <span>✓ Validé par <strong>{validationData.validateurNom}</strong></span>
              {validationData.dateValidation && (
                <span className="opacity-75 text-[10px]">
                  le {new Date(validationData.dateValidation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barre d'action décisionnelle (réservée aux examinateurs habilités) */}
      {canReview && (
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t-2 border-dashed border-cordel-master-dark/20">
          <CordelButton
            variant="default"
            disabled={submittingAction}
            onClick={() => setIsRetoucheModalOpen(true)}
            className="text-xs px-3.5 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 text-cordel-wood"
          >
            💬 Demander retouche
          </CordelButton>

          <CordelButton
            variant="vert"
            disabled={submittingAction || statut === 'approuve'}
            onClick={handleApprove}
            className="text-xs px-4 py-2 font-black uppercase tracking-wider flex items-center gap-1.5"
          >
            {statut === 'approuve' ? "✓ Déjà validé" : "✅ Valider la publication"}
          </CordelButton>
        </div>
      )}

      {/* Modale de saisie de la demande de retouche */}
      {isRetoucheModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-encre-noire/70 backdrop-blur-sm animate-fade-in select-none">
          <div className="relative w-full max-w-md">
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left bg-cordel-bg">
              <div className="flex justify-between items-start border-b-2 border-dashed border-cordel-master-dark/25 pb-2">
                <h3 className="font-heading font-black text-base text-encre-noire tracking-wider uppercase flex items-center gap-1.5">
                  💬 Demander des retouches
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRetoucheModalOpen(false)}
                  className="text-base font-extrabold text-cordel-wood hover:text-red-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmRetouche} className="flex flex-col gap-3">
                <p className="text-xs text-cordel-master-dark font-medium">
                  Indiquez au rédacteur les modifications à apporter (ex : corriger la date, modifier le texte, changer la photo de fond...) :
                </p>

                <textarea
                  value={retoucheNote}
                  onChange={(e) => setRetoucheNote(e.target.value)}
                  placeholder="Ex : Pourriez-vous ajouter l'heure de début exacte et changer le titre ?"
                  rows={4}
                  required
                  className="theme-input w-full text-xs p-2.5 font-medium border border-encre-noire bg-white rounded"
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
                  <CordelButton
                    type="button"
                    variant="default"
                    onClick={() => setIsRetoucheModalOpen(false)}
                    disabled={submittingAction}
                    className="py-1.5 px-3 text-xs font-bold uppercase"
                  >
                    Annuler
                  </CordelButton>
                  <CordelButton
                    type="submit"
                    variant="ocre"
                    useExtremeBorder={true}
                    disabled={submittingAction || !retoucheNote.trim()}
                    className="py-1.5 px-4 text-xs font-black uppercase tracking-wider"
                  >
                    {submittingAction ? "Envoi..." : "Envoyer la demande"}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
