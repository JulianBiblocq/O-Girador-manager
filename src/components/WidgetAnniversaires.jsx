import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import XiloAvatar from './XiloAvatar';
import { useTranslation } from './LanguageContext';

/**
 * Fonction utilitaire pour déterminer le titre genré et son article en portugais
 */
const getGenderTitlePT = (genreStr) => {
  if (!genreStr) return { title: 'estrela do mês', article: 'a' };
  const g = genreStr.toString().toLowerCase().trim();
  if (g === 'femme' || g === 'feminin' || g === 'female' || g === 'f') {
    return { title: 'rainha do mês', article: 'a' };
  }
  if (g === 'homme' || g === 'masculin' || g === 'male' || g === 'm') {
    return { title: 'rei do mês', article: 'o' };
  }
  return { title: 'estrela do mês', article: 'a' };
};

export default function WidgetAnniversaires({ groupId, currentUser, profileData, onContactUser }) {
  const { t } = useTranslation();
  const [birthdayMembers, setBirthdayMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const currentUserId = currentUser?.uid || profileData?.uid;

  useEffect(() => {
    if (!groupId) {
      setBirthdayMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));

    const unsubscribe = onSnapshot(q, (snap) => {
      const currentMonth = new Date().getMonth() + 1; // 1-12
      const activeMembers = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        // Vérification de la permission de confidentialité pour l'affichage de l'anniversaire
        const isBirthdateAllowed = data.afficherDateNaissance !== undefined 
          ? (data.afficherDateNaissance === true) 
          : (data.publierDateNaissance !== undefined ? (data.publierDateNaissance === true) : false);

        if (data.statutActuel !== 'inactive' && data.statutActuel !== 'archived' && data.dateNaissance && isBirthdateAllowed) {
          const parts = data.dateNaissance.split('-');
          if (parts.length === 3) {
            const birthMonth = parseInt(parts[1], 10);
            const birthDay = parseInt(parts[2], 10);
            if (birthMonth === currentMonth) {
              activeMembers.push({
                id: docSnap.id,
                prenom: data.prenom || '',
                nom: data.nom || '',
                photoURL: data.photoURL || '',
                genre: data.genre || '',
                day: birthDay
              });
            }
          } else {
            const d = new Date(data.dateNaissance);
            if (!isNaN(d.getTime())) {
              const birthMonth = d.getMonth() + 1;
              const birthDay = d.getDate();
              if (birthMonth === currentMonth) {
                activeMembers.push({
                  id: docSnap.id,
                  prenom: data.prenom || '',
                  nom: data.nom || '',
                  photoURL: data.photoURL || '',
                  genre: data.genre || '',
                  day: birthDay
                });
              }
            }
          }
        }
      });

      const sorted = activeMembers.sort((a, b) => a.day - b.day);
      setBirthdayMembers(sorted);
      setLoading(false);
    }, (error) => {
      console.error("WidgetAnniversaires - Error fetching members:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  if (loading) return null;
  if (birthdayMembers.length === 0) return null;

  // Déterminer si l'utilisateur connecté fâte son anniversaire ce mois-ci
  const currentUserBirthday = birthdayMembers.find(m => m.id === currentUserId);
  const selfTitleInfo = currentUserBirthday ? getGenderTitlePT(profileData?.genre || currentUserBirthday.genre) : null;

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="relative overflow-hidden transition-all duration-300">
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.05] select-none pointer-events-none transform -rotate-12">
        🎂
      </div>

      <div className="flex flex-col gap-3 text-left">
        {/* En-tête cliquable avec flèche de repliage (accordéon) */}
        <div 
          onClick={() => setIsCollapsed(prev => !prev)}
          className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5 cursor-pointer select-none group"
          title={isCollapsed ? "Déplier les anniversaires" : "Replier les anniversaires"}
        >
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-cordel-wood flex items-center gap-2">
            <span>🎂 {t('dashboard.birthdaysMonth') || "Anniversaires du mois"}</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 bg-cordel-wood text-white rounded-full">
              {birthdayMembers.length}
            </span>
          </h3>
          <button 
            type="button" 
            className="text-xs font-black text-encre-noire/70 group-hover:text-encre-noire transition-transform p-1"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>

        {/* Contenu dépliable */}
        {!isCollapsed && (
          <>
            {/* Célébration dynamique genrée pour l'utilisateur connecté s'il fait son anniversaire ce mois-ci */}
            {currentUserBirthday && selfTitleInfo && (
              <div className="p-2.5 bg-amber-400/25 border-2 border-dashed border-cordel-wood rounded-[6px_8px_5px_7px] text-center select-none shadow-xs">
                <p className="text-xs font-black text-cordel-wood uppercase tracking-wider">
                  🎉 {currentUserBirthday.prenom || "Você"}, você é {selfTitleInfo.article} {selfTitleInfo.title} ! 👑
                </p>
              </div>
            )}

            {/* Grille responsive : 1 col sur mobile, 2 cols sur tablette, 3 cols sur PC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {birthdayMembers.map((member) => {
                const fullName = `${member.prenom} ${member.nom}`.trim() || "Membre";
                const { title, article } = getGenderTitlePT(member.genre);
                const isSelf = member.id === currentUserId;

                return (
                  <div key={member.id} className="p-2.5 bg-white/60 dark:bg-black/10 border-2 border-dashed border-cordel-master-dark/20 rounded-[6px_8px_5px_7px] shadow-xs flex items-center justify-between gap-2.5 hover:border-cordel-wood transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <XiloAvatar src={member.photoURL} name={fullName} size={34} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-black text-encre-noire truncate">
                            {member.prenom} {isSelf && <span className="text-[9px] text-cordel-wood font-extrabold">(Você)</span>}
                          </p>
                        </div>
                        <p className="text-[10px] font-semibold text-cordel-master-dark/75">
                          {t('dashboard.birthdayOn', { day: member.day })}
                        </p>
                        <p className="text-[9.5px] font-extrabold text-cordel-wood/90 italic truncate mt-0.5">
                          ✨ {member.prenom} é {article} {title} !
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onContactUser) onContactUser(member.id, `Parabéns ! 🎉 Joyeux anniversaire ! `);
                          }}
                          className="p-1.5 px-2 bg-amber-400 text-encre-noire border border-encre-noire rounded-[4px] shadow-[1px_1px_0px_0px_#181716] hover:scale-105 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center text-xs font-bold gap-1"
                          title={`Envoyer "Parabéns !" en message privé à ${member.prenom}`}
                        >
                          <span>🎁</span>
                          <span className="text-[9px] uppercase font-black">Parabéns</span>
                        </button>
                      )}
                      <div className="text-xs animate-bounce select-none">🎈</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </CordelCard>
  );
}
