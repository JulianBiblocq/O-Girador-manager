import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { useEventComments } from '../../hooks/useEventComments';
import useConfirm from '../../hooks/useConfirm';

/**
 * Composant EventCommentsSection
 * Intègre le fil de discussion et questions logistiques dédié à un événement.
 * Affiche les commentaires sous forme de bulles de chat et permet aux membres d'échanger.
 */
export default function EventCommentsSection({ event, user, profileData }) {
  const { confirm } = useConfirm();
  const eventId = event?.id || event?.uid;
  const { comments, loading, sending, addComment, deleteComment } = useEventComments(eventId, user, profileData, event);

  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isViewerAdmin = profileData?.role === 'mestre' || 
                        profileData?.role === 'super-admin' || 
                        profileData?.isSystemAdmin === true ||
                        profileData?.role === 'bureau' ||
                        profileData?.role === 'admin';

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setErrorMsg('');
    try {
      await addComment(inputText);
      setInputText('');
    } catch (err) {
      console.error("EventCommentsSection - Erreur envoi commentaire :", err);
      setErrorMsg("Impossible d'envoyer le commentaire : " + (err.message || err));
    }
  };

  const handleDelete = async (commentId, authorName) => {
    const isOk = await confirm({
      title: "Supprimer le commentaire",
      message: `Voulez-vous vraiment supprimer ce commentaire de ${authorName || 'ce membre'} ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });

    if (isOk) {
      try {
        await deleteComment(commentId);
      } catch (err) {
        console.error("EventCommentsSection - Erreur suppression commentaire :", err);
        alert("Erreur lors de la suppression : " + (err.message || err));
      }
    }
  };

  const formatCommentDate = (dateCreation, dateCreationIso) => {
    if (dateCreation && typeof dateCreation.toDate === 'function') {
      const d = dateCreation.toDate();
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    if (dateCreationIso) {
      try {
        const d = new Date(dateCreationIso);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }
    return '';
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 text-left select-none">
      
      {/* En-tête de la section */}
      <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-3">
        <h3 className="panel-title text-sm font-extrabold uppercase tracking-wider text-cordel-wood flex items-center gap-2">
          💬 Discussion & Questions Logistiques
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark opacity-60 bg-cordel-bg-light px-2 py-0.5 rounded border border-cordel-master-dark/15">
          {comments.length} {comments.length > 1 ? 'commentaires' : 'commentaire'}
        </span>
      </div>

      {/* Explication d'aide */}
      <p className="text-[10.5px] font-semibold text-cordel-master-dark opacity-75 leading-relaxed -mt-1">
        Posez vos questions logistiques (covoiturage, horaires, matériel) ici pour échanger avec les organisateurs et les autres participants de cet événement.
      </p>

      {/* Zone d'affichage des commentaires (Bulles de chat) */}
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <span className="text-xs uppercase font-black tracking-widest animate-pulse opacity-60">
            ⏳ Chargement de la discussion...
          </span>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 p-4 rounded text-center my-1">
          <p className="text-xs font-bold text-cordel-master-dark/60">
            Aucun commentaire pour le moment. Soyez le premier à poser une question !
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 my-1 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
          {comments.map((c) => {
            const isAuthor = c.auteurId === user?.uid;
            const canDelete = isAuthor || isViewerAdmin;

            return (
              <div 
                key={c.id} 
                className={`flex gap-3 items-start p-3 rounded-lg border transition-all ${
                  isAuthor 
                    ? 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/40 ml-2 sm:ml-6' 
                    : 'bg-white/60 dark:bg-black/20 border-cordel-master-dark/15 mr-2 sm:mr-6'
                }`}
              >
                {/* Avatar de l'auteur */}
                <div className="shrink-0">
                  <XiloAvatar src={c.auteurPhoto} name={c.auteurNom || 'Membre'} size={34} />
                </div>

                {/* Contenu du commentaire */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="text-[11px] font-extrabold uppercase text-cordel-wood truncate">
                      {c.auteurNom || 'Membre'} {isAuthor && <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 opacity-80">(Vous)</span>}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-cordel-master-dark opacity-50">
                        {formatCommentDate(c.dateCreation, c.dateCreationIso)}
                      </span>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.auteurNom)}
                          className="text-[9px] text-red-600 hover:text-red-800 font-bold opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
                          title="Supprimer le commentaire"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-encre-noire leading-relaxed whitespace-pre-line break-words">
                    {c.texte}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Message d'erreur s'il y a lieu */}
      {errorMsg && (
        <div className="p-2 bg-red-100 border border-red-400 text-red-700 text-xs font-bold rounded">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Formulaire de saisie d'un nouveau commentaire */}
      {user ? (
        <form onSubmit={handleSend} className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/20 pt-3 mt-1">
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Poser une question logistique ou laisser un commentaire..."
              className="theme-input text-xs font-semibold flex-1 py-2 px-3 resize-none"
              disabled={sending}
            />
            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={sending || !inputText.trim()}
              className="px-4 text-xs font-extrabold uppercase tracking-wider shrink-0 !bg-amber-600 !text-white shadow-[2px_2px_0px_0px_#181716] self-end py-2.5"
            >
              {sending ? "⏳ Envoi..." : "💬 Envoyer"}
            </CordelButton>
          </div>
        </form>
      ) : (
        <div className="p-2.5 bg-neutral-100 border border-neutral-300 rounded text-center text-xs font-bold opacity-75">
          Connectez-vous pour participer à la discussion.
        </div>
      )}

    </CordelCard>
  );
}
