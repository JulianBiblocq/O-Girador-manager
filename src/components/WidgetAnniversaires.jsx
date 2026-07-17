import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import XiloAvatar from './XiloAvatar';
import { useTranslation } from './LanguageContext';

export default function WidgetAnniversaires({ groupId }) {
  const { t } = useTranslation();
  const [birthdayMembers, setBirthdayMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Filter active members who have a birthday
        if (data.statutActuel !== 'inactive' && data.dateNaissance) {
          // Robust parsing of dateNaissance (YYYY-MM-DD)
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
                day: birthDay
              });
            }
          } else {
            // Fallback for standard date string parsing
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
                  day: birthDay
                });
              }
            }
          }
        }
      });

      // Sort by day of the month ascending
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
  if (birthdayMembers.length === 0) return null; // Hide the widget if no birthdays this month

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="relative overflow-hidden">
      {/* Decorative background stamp simulator */}
      <div className="absolute -right-4 -bottom-4 text-8xl opacity-[0.05] select-none pointer-events-none transform -rotate-12">
        🎂
      </div>

      <div className="flex flex-col gap-3 text-left">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-cordel-wood flex items-center gap-1.5 select-none border-b border-dashed border-cordel-master-dark/20 pb-1.5">
          🎂 {t('dashboard.birthdaysMonth') || "Anniversaires du mois"}
        </h3>

        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
          {birthdayMembers.map((member) => {
            const fullName = `${member.prenom} ${member.nom}`.trim() || "Membre";
            return (
              <div key={member.id} className="flex items-center gap-2.5 py-1 border-b border-dashed border-cordel-master-dark/10 last:border-none">
                <XiloAvatar src={member.photoURL} name={fullName} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-encre-noire truncate">
                    {member.prenom}
                  </p>
                  <p className="text-[10px] font-semibold text-cordel-master-dark/75">
                    {t('dashboard.birthdayOn') || "le"} {member.day}
                  </p>
                </div>
                <div className="text-xs animate-bounce select-none">🎈</div>
              </div>
            );
          })}
        </div>
      </div>
    </CordelCard>
  );
}
