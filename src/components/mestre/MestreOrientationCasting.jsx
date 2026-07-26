import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import OrientationAssignmentModal from './OrientationAssignmentModal';

const DEFAULT_INSTRUMENTS = [
  "Alfaia Marcante",
  "Alfaia Meião",
  "Alfaia Repique",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Timbal",
  "Chant",
  "Danse"
];

const getInstrumentIconPath = (instName) => {
  if (!instName) return '/favicon.svg';
  const name = instName.toLowerCase().trim();
  if (name.includes('alfaia')) return '/icones/alfaia.svg';
  if (name.includes('agbê') || name.includes('agbe') || name.includes('sementes')) return '/icones/agbe.svg';
  if (name.includes('gonguê') || name.includes('gongue')) return '/icones/gongue.svg';
  if (name.includes('caixa') || name.includes('tarol') || name.includes('caisse')) return '/icones/caixa.svg';
  if (name.includes('chant') || name.includes('voix') || name.includes('singer') || name.includes('danse') || name.includes('dance') || name.includes('micro')) return '/icones/micro.svg';
  if (name.includes('timbal')) return '/icones/timbal.svg';
  if (name.includes('mineiro')) return '/icones/mineiro.svg';
  if (name.includes('apito') || name.includes('mestre') || name.includes('chef')) return '/icones/apito.svg';
  return '/favicon.svg';
};

/**
 * MestreOrientationCasting component renders the "Orientation & Casting" dashboard for the Mestre.
 * Features:
 * - Real-time quota calculation by primary and secondary instruments.
 * - Prioritized data table of members (unassigned & wish-expressing members first).
 * - Assignment modal for main and secondary instruments with automatic private messaging.
 */
export default function MestreOrientationCasting({ user, profileData, onNavigateToMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const groupId = profileData?.groupId || null;

  // Real-time synchronization of members list
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));

    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      setMembers(fetched);
      setLoading(false);
    }, (error) => {
      console.error("MestreOrientationCasting - Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribeUsers();
  }, [groupId]);

  // Real-time synchronization of available instruments configuration
  useEffect(() => {
    if (!groupId) return;

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribeAssoc = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.instrumentsDisponibles) && data.instrumentsDisponibles.length > 0) {
          setInstrumentsDisponibles(data.instrumentsDisponibles);
        } else {
          setInstrumentsDisponibles(DEFAULT_INSTRUMENTS);
        }
      }
    }, (error) => {
      console.error("MestreOrientationCasting - Error fetching instruments configuration:", error);
    });

    return () => unsubscribeAssoc();
  }, [groupId]);

  // Filter active members (exclude inactive)
  const activeMembers = useMemo(() => {
    return members.filter(m => m.statutActuel !== 'inactive');
  }, [members]);

  // Real-time calculation of instrument quotas (Primary & Secondary)
  const quotasByInstrument = useMemo(() => {
    const counts = {};
    instrumentsDisponibles.forEach(inst => {
      counts[inst] = { primary: 0, secondary: 0 };
    });

    activeMembers.forEach(member => {
      if (member.instrument) {
        if (!counts[member.instrument]) {
          counts[member.instrument] = { primary: 0, secondary: 0 };
        }
        counts[member.instrument].primary += 1;
      }
      if (member.instrumentSecondaire) {
        if (!counts[member.instrumentSecondaire]) {
          counts[member.instrumentSecondaire] = { primary: 0, secondary: 0 };
        }
        counts[member.instrumentSecondaire].secondary += 1;
      }
    });

    return counts;
  }, [activeMembers, instrumentsDisponibles]);

  // Sorting logic for members table:
  // Priority 1: Unassigned members OR members who expressed wishes
  // Priority 2: Alphabetical by name
  const sortedMembers = useMemo(() => {
    const list = [...activeMembers];

    const needsAttention = (m) => {
      const hasNoDefinitive = !m.instrument || m.instrument.trim() === '';
      const hasWishes = Boolean(m.voeuPrincipal || m.voeuSecondaire || m.voeuTertiaire);
      return hasNoDefinitive || hasWishes;
    };

    return list.sort((a, b) => {
      const aPriority = needsAttention(a) ? 0 : 1;
      const bPriority = needsAttention(b) ? 0 : 1;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const nameA = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase();
      const nameB = `${b.prenom || ''} ${b.nom || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [activeMembers]);

  // Filtered members according to search query
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return sortedMembers;
    const term = searchTerm.toLowerCase().trim();
    return sortedMembers.filter(m => {
      const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
      const surnom = (m.surnom || '').toLowerCase();
      const inst = (m.instrument || '').toLowerCase();
      const secInst = (m.instrumentSecondaire || '').toLowerCase();
      const v1 = (m.voeuPrincipal || '').toLowerCase();
      const v2 = (m.voeuSecondaire || '').toLowerCase();
      const v3 = (m.voeuTertiaire || '').toLowerCase();
      return fullName.includes(term) || surnom.includes(term) || inst.includes(term) || secInst.includes(term) || v1.includes(term) || v2.includes(term) || v3.includes(term);
    });
  }, [sortedMembers, searchTerm]);

  // Open assignment modal for a selected member
  const handleOpenAssignModal = (member) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  // Save assignment and optionally send private message
  const handleSaveAssignment = async (mainInst, secInst, messageToMember) => {
    if (!selectedMember || !user?.uid) return;

    setSaving(true);
    try {
      // 1. Update user document in Firestore
      const userRef = doc(db, 'users', selectedMember.id);
      const updatePayload = {
        instrument: mainInst,
        instrumentSecondaire: secInst || '',
        instrumentsJoues: Array.from(new Set([mainInst, secInst].filter(Boolean)))
      };

      await updateDoc(userRef, updatePayload);

      // 2. If a message was composed by Mestre, send as a Private Message
      if (messageToMember && messageToMember.trim()) {
        await addDoc(collection(db, 'private_messages'), {
          senderId: user.uid,
          recipientId: selectedMember.id,
          content: messageToMember.trim(),
          timestamp: new Date().toISOString(),
          read: false,
          groupId: groupId || selectedMember.groupId || ''
        });
      }

      alert(`✅ Instrumentation de ${selectedMember.prenom || 'l\'adhérent'} validée avec succès !${messageToMember.trim() ? ' Message privé envoyé.' : ''}`);
      setModalOpen(false);
      setSelectedMember(null);
    } catch (err) {
      console.error("MestreOrientationCasting - Error updating assignment:", err);
      alert("Erreur lors de la sauvegarde : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <div className="animate-spin text-2xl">⏳</div>
        <p className="text-xs font-bold text-cordel-wood uppercase tracking-wider">
          Chargement du Tableau d'Orientation & Casting...
        </p>
      </div>
    );
  }

  const unassignedCount = activeMembers.filter(m => !m.instrument || m.instrument.trim() === '').length;
  const wishCount = activeMembers.filter(m => m.voeuPrincipal || m.voeuSecondaire || m.voeuTertiaire).length;

  return (
    <div className="flex flex-col gap-5 text-left max-w-5xl mx-auto w-full select-none">
      {/* Page Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-dashed border-cordel-master-dark/30 pb-3 gap-2">
        <div>
          <h2 className="panel-title text-xl font-extrabold tracking-wider text-cordel-wood uppercase">
            🎯 Orientation & Casting
          </h2>
          <p className="text-xs font-semibold text-cordel-master-dark/80 mt-0.5">
            Gestion des pupitres, validation des souhaits d'évolution et affectation des rôles.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px]">
            👥 {activeMembers.length} Actifs
          </span>
          {unassignedCount > 0 && (
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] animate-pulse">
              ⚠️ {unassignedCount} À attribuer
            </span>
          )}
          {wishCount > 0 && (
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[9px]">
              ✨ {wishCount} Vœux formulés
            </span>
          )}
        </div>
      </div>

      {/* 1. Jauges des Quotas (Bandeau visuel des pupitres) */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center justify-between">
          <span>📊 Quotas & Effectifs par Pupitre (Instruments Principaux)</span>
          <span className="text-[9px] text-cordel-master-dark/70 font-semibold normal-case">
            Calculé en temps réel sur les membres actifs
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {instrumentsDisponibles.map(inst => {
            const quota = quotasByInstrument[inst] || { primary: 0, secondary: 0 };
            const isLow = quota.primary === 0;

            return (
              <div
                key={`quota-${inst}`}
                className={`p-2.5 rounded border flex flex-col justify-between transition-all ${
                  isLow
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-dashed border-amber-400/80 text-amber-950 dark:text-amber-200'
                    : 'bg-white/50 dark:bg-black/20 border-dashed border-cordel-master-dark/20 text-cordel-master-dark'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <img
                    src={getInstrumentIconPath(inst)}
                    alt={inst}
                    className="w-4 h-4 object-contain dark:invert"
                  />
                  <span className="text-[10px] font-extrabold truncate" title={inst}>
                    {inst}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-lg text-cordel-wood">{quota.primary}</span>
                    <span className="text-[8px] font-extrabold uppercase opacity-70">
                      princ.
                    </span>
                  </div>
                  {quota.secondary > 0 && (
                    <span className="text-[9px] font-bold text-cordel-master-dark/80 bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded border border-cordel-master-dark/15">
                      +{quota.secondary} sec.
                    </span>
                  )}
                </div>

                {isLow && (
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1 block">
                    ⚠️ Effectif vide
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CordelCard>

      {/* 2. Tableau d'Affectation */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
            📋 Tableau d'Affectation des Membres
          </h3>

          {/* Search bar */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="🔍 Rechercher un membre ou vœu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input w-full text-xs py-1 px-2.5"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-dashed border-cordel-master-dark/20 text-[9.5px] uppercase tracking-wider font-extrabold text-cordel-wood">
                <th className="py-2 px-2">Membre</th>
                <th className="py-2 px-2">Instrument Actuel</th>
                <th className="py-2 px-2">Vœux Formulés</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-cordel-master-dark/15">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs font-bold text-cordel-master-dark/60 italic">
                    Aucun membre ne correspond à la recherche.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const name = `${m.prenom || ''} ${m.nom || ''}`.trim() || 'Sans Nom';
                  const isUnassigned = !m.instrument || m.instrument.trim() === '';
                  const hasWishes = Boolean(m.voeuPrincipal || m.voeuSecondaire || m.voeuTertiaire);

                  return (
                    <tr
                      key={`member-row-${m.id}`}
                      className={`hover:bg-cordel-bg-light/80 transition-colors ${
                        isUnassigned
                          ? 'bg-amber-100/40 dark:bg-amber-950/20'
                          : hasWishes
                          ? 'bg-white/40 dark:bg-black/10'
                          : ''
                      }`}
                    >
                      {/* 1. Nom / Avatar */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5">
                          <XiloAvatar src={m.photoURL} name={name} size={36} />
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-cordel-master-dark flex items-center gap-1">
                              {name}
                              {isUnassigned && (
                                <span className="text-[8px] font-black text-amber-700 bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 px-1 py-0.2 rounded uppercase">
                                  Nouveau
                                </span>
                              )}
                            </span>
                            {m.surnom && (
                              <span className="text-[10px] font-semibold text-cordel-wood italic">
                                "{m.surnom}"
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Instrument Actuel */}
                      <td className="py-2.5 px-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold flex items-center gap-1.5 text-cordel-master-dark">
                            <img
                              src={getInstrumentIconPath(m.instrument)}
                              alt={m.instrument || 'Aucun'}
                              className="w-3.5 h-3.5 object-contain dark:invert"
                            />
                            <span>{m.instrument || <span className="italic text-amber-600 dark:text-amber-400 font-semibold">Non défini</span>}</span>
                          </span>
                          {m.instrumentSecondaire && (
                            <span className="text-[10px] text-cordel-wood font-semibold flex items-center gap-1">
                              <span>Sec. :</span>
                              <img
                                src={getInstrumentIconPath(m.instrumentSecondaire)}
                                alt={m.instrumentSecondaire}
                                className="w-3 h-3 object-contain dark:invert"
                              />
                              <span>{m.instrumentSecondaire}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Vœux Formulés */}
                      <td className="py-2.5 px-2">
                        {hasWishes ? (
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {m.voeuPrincipal && (
                              <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-cordel-master-dark/20 font-semibold">
                                <strong className="text-cordel-wood">1 :</strong> {m.voeuPrincipal}
                              </span>
                            )}
                            {m.voeuSecondaire && (
                              <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-cordel-master-dark/20">
                                <strong className="text-cordel-wood">2 :</strong> {m.voeuSecondaire}
                              </span>
                            )}
                            {m.voeuTertiaire && (
                              <span className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded border border-cordel-master-dark/20">
                                <strong className="text-cordel-wood">3 :</strong> {m.voeuTertiaire}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] italic text-cordel-master-dark/50">
                            Aucun vœu formulé
                          </span>
                        )}
                      </td>

                      {/* 4. Action */}
                      <td className="py-2.5 px-2 text-right">
                        <CordelButton
                          variant={isUnassigned ? 'ocre' : 'default'}
                          useExtremeBorder={true}
                          onClick={() => handleOpenAssignModal(m)}
                          className="text-[10px] py-1 px-2.5 font-extrabold uppercase shrink-0"
                        >
                          🎯 Affecter / Valider
                        </CordelButton>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CordelCard>

      {/* Modale d'Affectation & Messagerie */}
      <OrientationAssignmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        instrumentsDisponibles={instrumentsDisponibles}
        onSave={handleSaveAssignment}
        saving={saving}
      />
    </div>
  );
}
