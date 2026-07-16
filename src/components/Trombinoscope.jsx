import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import LayoutShell from './LayoutShell';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import XiloAvatar from './XiloAvatar';

export default function Trombinoscope({ user, profileData, onBack }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!profileData?.groupId) {
      setMembers([{
        id: user.uid,
        prenom: profileData?.prenom || 'Vous',
        nom: profileData?.nom || '',
        email: user.email,
        photoURL: user.photoURL,
        role: profileData?.role || 'membre',
        tags: profileData?.tags || [],
        statutActuel: profileData?.statutActuel || 'active'
      }]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMembers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMembers.push({
          id: doc.id,
          ...data,
          photoURL: doc.id === user.uid ? user.photoURL : data.photoURL || null
        });
      });

      if (fetchedMembers.length === 0) {
        fetchedMembers.push({
          id: user.uid,
          prenom: profileData?.prenom || 'Vous',
          nom: profileData?.nom || '',
          email: user.email,
          photoURL: user.photoURL,
          role: profileData?.role || 'membre',
          tags: profileData?.tags || [],
          statutActuel: profileData?.statutActuel || 'active'
        });
      }

      setMembers(fetchedMembers);
      setLoading(false);
    }, (err) => {
      console.error("Trombinoscope - Erreur Firestore :", err);
      setError("Impossible de charger les membres du groupe.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData, user]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center py-2 border-b-2 border-dashed border-cordel-master-dark/30 flex justify-between items-center">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs">
          ← Retour
        </CordelButton>
        <span className="panel-title text-xl font-extrabold tracking-wider text-cordel-wood">
          TROMBINOSCOPE
        </span>
        <div className="w-16"></div> {/* Spacer for symmetry */}
      </div>

      {/* Info / Group badge */}
      <div className="text-center -mt-2">
        <span className="text-[10px] uppercase font-bold tracking-widest text-cordel-master-dark opacity-65">
          Groupe : {profileData?.groupId || 'Aucun groupe assigné'}
        </span>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <div className="animate-spin text-3xl mb-4 select-none">⏳</div>
          <span className="font-bold text-xs uppercase tracking-widest text-cordel-master-dark opacity-75">
            Impression en cours...
          </span>
        </div>
      ) : error ? (
        <CordelCard variant="default" useExtremeBorder={true} className="text-center py-8">
          <p className="text-sm font-bold text-cordel-wood mb-4">{error}</p>
          <CordelButton variant="ocre" onClick={onBack}>Retour</CordelButton>
        </CordelCard>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Group Warning if no groupId */}
          {!profileData?.groupId && (
            <CordelCard variant="ocre" useExtremeBorder={false} className="p-3 text-left">
              <p className="text-xs leading-relaxed font-semibold">
                ⚠️ Vous n'avez pas de groupe associé. Vous ne voyez que votre profil. Rapprochez-vous du Mestre pour obtenir votre lien d'invitation.
              </p>
            </CordelCard>
          )}

          {/* Grille responsive de portraits */}
          <div className="grid grid-cols-2 gap-4">
            {members.map((member) => {
              const fullName = `${member.prenom} ${member.nom}`;
              const hasRoleBadge = member.role && member.role !== 'membre';
              const hasTags = member.tags && member.tags.length > 0;

              return (
                <div key={member.id} className="relative flex flex-col items-center">
                  <CordelCard 
                    variant="default" 
                    useExtremeBorder={true} 
                    className="w-full flex flex-col items-center p-4 min-h-[190px] relative overflow-hidden"
                  >
                    {/* Avatar with Xylogravure Filter */}
                    <div className="mb-3">
                      <XiloAvatar src={member.photoURL} name={fullName} size={72} />
                    </div>

                    {/* Member Name */}
                    <div className="text-center mt-1 w-full">
                      <div className="font-bold text-xs truncate leading-snug">
                        {member.prenom}
                      </div>
                      <div className="font-bold text-xs truncate leading-none uppercase text-[10px] opacity-75 mt-0.5">
                        {member.nom}
                      </div>
                    </div>

                    {/* Role Stamp overlay (rotated and overlapping) */}
                    {hasRoleBadge && (
                      <div className="absolute top-2 -right-1 z-25">
                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] rotate-[-6deg] select-none">
                          {member.role}
                        </span>
                      </div>
                    )}

                    {/* Tags / Instrument Stamp overlay */}
                    {hasTags && (
                      <div className="absolute bottom-2 -left-1 z-25">
                        <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] rotate-[5deg] select-none">
                          🎺 {member.tags[0]}
                        </span>
                      </div>
                    )}
                  </CordelCard>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
