import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import XiloAvatar from '../XiloAvatar';

export default function EventVolunteerSection({ event, user, allUsers = [], t }) {
  const [loading, setLoading] = useState(false);

  const volunteerShifts = event.volunteerShifts || [];
  if (volunteerShifts.length === 0) {
    return null;
  }

  const handleToggleJoin = async (shiftId) => {
    if (!event.id || !user?.uid || loading) return;
    setLoading(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      const updatedShifts = volunteerShifts.map((shift) => {
        if (shift.id === shiftId) {
          const inscrits = shift.inscrits || [];
          const isRegistered = inscrits.includes(user.uid);
          const newInscrits = isRegistered
            ? inscrits.filter((uid) => uid !== user.uid)
            : [...inscrits, user.uid];
          return { ...shift, inscrits: newInscrits };
        }
        return shift;
      });

      await updateDoc(eventRef, { volunteerShifts: updatedShifts });
    } catch (err) {
      console.error("Error updating volunteer shift registrations:", err);
      alert("Erreur lors de l'inscription / désinscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <div className="text-left w-full">
        {/* Title */}
        <h4 className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1.5 mb-4 flex items-center gap-1.5 select-none">
          🤝 Créneaux de Bénévolat / Logistique
        </h4>

        {/* Shifts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {volunteerShifts.map((shift) => {
            const inscrits = shift.inscrits || [];
            const isUserRegistered = user?.uid ? inscrits.includes(user.uid) : false;

            return (
              <div
                key={shift.id}
                className="flex flex-col justify-between bg-white/40 dark:bg-black/25 p-3 rounded-lg border border-dashed border-encre-noire/15 shadow-sm transition-all hover:scale-[1.01]"
              >
                <div>
                  {/* Task Header */}
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div>
                      <h5 className="font-black text-xs text-cordel-master-dark uppercase leading-tight">
                        {shift.nomTache}
                      </h5>
                      <span className="text-[10px] opacity-75 font-semibold block mt-0.5">
                        ⏱️ Horaires : {shift.horaires}
                      </span>
                    </div>

                    {/* Join/Leave Button */}
                    <button
                      type="button"
                      disabled={loading || !user?.uid}
                      onClick={() => handleToggleJoin(shift.id)}
                      className={`text-[9px] font-black uppercase border px-2.5 py-1 rounded transition-all shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer disabled:opacity-50 select-none ${
                        isUserRegistered
                          ? 'bg-cordel-ocre text-encre-noire border-encre-noire'
                          : 'bg-cordel-vert text-encre-noire border-encre-noire'
                      }`}
                    >
                      {isUserRegistered ? "✕ Se désinscrire" : "＋ S'inscrire"}
                    </button>
                  </div>

                  {/* Registered Volunteers list */}
                  <div className="border-t border-dashed border-encre-noire/10 pt-2 mt-2">
                    <span className="text-[9px] uppercase font-extrabold text-cordel-wood/80 block mb-1.5">
                      👥 Inscrits ({inscrits.length}) :
                    </span>

                    {inscrits.length === 0 ? (
                      <span className="text-[10px] italic opacity-60">Aucun bénévole inscrit.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {inscrits.map((uid) => {
                          const member = allUsers.find((u) => u.id === uid) || {
                            id: uid,
                            name: 'Membre inconnu',
                            photoURL: ''
                          };
                          // Handle initials for missing photos
                          const displayName = member.prenom
                            ? `${member.prenom} ${member.nom ? member.nom.charAt(0) + '.' : ''}`
                            : member.name || 'Membre';

                          return (
                            <div
                              key={uid}
                              className="inline-flex items-center gap-1.5 bg-cordel-bg-light/35 border border-encre-noire/10 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            >
                              <XiloAvatar
                                src={member.photoURL}
                                name={member.name || displayName}
                                size={18}
                              />
                              <span className="truncate max-w-[90px]">{displayName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CordelCard>
  );
}
