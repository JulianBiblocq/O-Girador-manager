import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Composant de carte individuelle d'un membre affiché dans la modale de présence.
 * Propose une action de messagerie directe pour les camarades et un commutateur
 * de visibilité individuelle (Visible / Discret) sur la propre ligne de l'utilisateur.
 */
const OnlineMemberItem = React.memo(({ 
  member, 
  currentUserId, 
  onStartDirectChat,
  onToggleVisibility 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Batuqueiro';
  const userInstruments = Array.isArray(member.instrumentsJoues) && member.instrumentsJoues.length > 0
    ? member.instrumentsJoues
    : [member.instrument].filter(Boolean);

  const memberId = member.id || member.uid;
  const isSelf = Boolean(currentUserId && memberId === currentUserId);
  const isVisible = member.afficherEnLigne !== false;

  // Gestion de la bascule du mode de visibilité (persistance Firestore users/{uid})
  const handleToggleClick = async () => {
    if (isUpdating) return;

    if (onToggleVisibility) {
      onToggleVisibility();
      return;
    }

    if (!currentUserId) return;

    setIsUpdating(true);
    try {
      const userRef = doc(db, 'users', currentUserId);
      await updateDoc(userRef, {
        afficherEnLigne: !isVisible
      });
    } catch (err) {
      console.error("OnlineMemberItem - Erreur de mise à jour du statut de visibilité :", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`p-2.5 border-2 border-encre-noire rounded-[6px_9px_5px_7px] shadow-[2px_2px_0px_0px_#181716] flex items-center justify-between gap-2 sm:gap-3 transition-colors ${
      isSelf && !isVisible ? 'bg-stone-50/90' : 'bg-white'
    }`}>
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Avatar avec indicateur de présence adapté au statut */}
        <div className="relative shrink-0">
          {member.photoURL ? (
            <img
              src={member.photoURL}
              alt={fullName}
              loading="lazy"
              decoding="async"
              className={`w-10 h-10 rounded-[6px_4px_7px_5px] border border-encre-noire object-cover object-center block grayscale contrast-[120%] sepia-[30%] ${
                isSelf && !isVisible ? 'opacity-70' : 'opacity-100'
              }`}
            />
          ) : (
            <div className={`w-10 h-10 rounded-[6px_4px_7px_5px] border border-encre-noire bg-[var(--color-cordel-papier,#f4ecd8)] flex items-center justify-center font-black text-xs text-cordel-wood ${
              isSelf && !isVisible ? 'opacity-70' : 'opacity-100'
            }`}>
              {member.prenom ? member.prenom[0].toUpperCase() : '🥁'}
            </div>
          )}

          {/* Pastille de présence : Verte si visible, Grise neutre si discret */}
          {isSelf && !isVisible ? (
            <span 
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-stone-400 border-2 border-white rounded-full flex items-center justify-center"
              title="Statut discret"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          ) : (
            <span 
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center"
              title="En ligne et visible"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </span>
          )}
        </div>

        {/* Coordonnées et informations du membre */}
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-black text-encre-noire truncate flex items-center gap-1.5 flex-wrap">
            <span>{fullName}</span>
            {isSelf && (
              <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-cordel-wood border border-cordel-wood/30">
                Moi
              </span>
            )}
            {member.surnom && (
              <span className="text-[9px] font-bold text-cordel-wood italic truncate max-w-[90px]">
                "{member.surnom}"
              </span>
            )}
          </h4>

          {userInstruments.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {userInstruments.map(inst => (
                <span 
                  key={inst}
                  className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-cordel-bg-light border border-encre-noire/30 text-encre-noire"
                >
                  🎵 {inst}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bloc d'action droit : Commutateur de visibilité pour soi-même, Messagerie pour les autres */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isSelf ? (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleToggleClick}
              disabled={isUpdating}
              className={`px-2.5 py-1 text-xs font-black rounded border-2 border-encre-noire flex items-center gap-1.5 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] select-none min-h-[30px] touch-manipulation ${
                isVisible
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
              title={isVisible 
                ? "Vous êtes visible par les autres camarades. Cliquez pour passer en mode discret." 
                : "Vous êtes en mode discret. Cliquez pour réactiver votre statut visible."
              }
              aria-label={isVisible ? "Mode visible actif. Cliquer pour passer en mode discret." : "Mode discret actif. Cliquer pour devenir visible."}
            >
              <span className="text-xs leading-none">{isVisible ? '🟢' : '⚪'}</span>
              <span className="text-[9.5px] uppercase font-black tracking-wider">
                {isVisible ? 'Visible' : 'Discret'}
              </span>
            </button>
            {!isVisible && (
              <span className="text-[8.5px] font-bold text-cordel-master-dark/65 italic text-right max-w-[130px] leading-tight">
                Vous n'apparaissez pas dans la liste des membres connectés
              </span>
            )}
          </div>
        ) : (
          <>
            {onStartDirectChat && (
              <button
                type="button"
                onClick={() => onStartDirectChat(memberId)}
                className="px-2 sm:px-2.5 py-1 text-xs font-black rounded border-2 border-encre-noire bg-cordel-bg-light hover:bg-amber-100 active:translate-x-[0.5px] active:translate-y-[0.5px] text-encre-noire flex items-center gap-1 cursor-pointer transition-all shadow-[1.5px_1.5px_0px_0px_#181716] select-none min-h-[32px] sm:min-h-[34px] touch-manipulation"
                title={`Envoyer un message privé à ${fullName}`}
                aria-label={`Envoyer un message privé à ${fullName}`}
              >
                <span>💬</span>
                <span className="hidden xs:inline text-[9.5px] uppercase font-black tracking-wider">Écrire</span>
              </button>
            )}

            <span className="text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider text-emerald-700 bg-emerald-100 border border-emerald-600/30">
              Actif
            </span>
          </>
        )}
      </div>
    </div>
  );
});

OnlineMemberItem.displayName = 'OnlineMemberItem';

export default OnlineMemberItem;
