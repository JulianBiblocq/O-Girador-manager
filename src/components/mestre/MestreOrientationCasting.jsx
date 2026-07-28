import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import OrientationAssignmentModal from './OrientationAssignmentModal';
import { filterPublicPercussionInstruments } from '../../utils/tagUtils';

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
  "Chant"
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
 * Composant MestreOrientationCasting
 * Tableau de bord "Orientation & Casting" pour le Mestre.
 * Permet la validation à 1-clic des vœux d'instruments et la gestion des pupitres.
 */
export default function MestreOrientationCasting({ user, profileData, _onNavigateToMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
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

  // Real-time synchronization of available instruments configuration and linked instruments
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

        if (Array.isArray(data.linkedInstruments)) {
          const normalized = data.linkedInstruments.map(link => {
            if (Array.isArray(link)) {
              return { name: '', instruments: link };
            } else if (link && typeof link === 'object') {
              if (Array.isArray(link.instruments)) {
                return { name: link.name || '', instruments: link.instruments };
              } else if (link.inst1 && link.inst2) {
                return { name: link.name || '', instruments: [link.inst1, link.inst2] };
              }
            }
            return null;
          }).filter(Boolean);
          setLinkedInstruments(normalized);
        } else {
          setLinkedInstruments([]);
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

  // Grouped/Linked pupitres combined with standalone instruments
  const displayPupitres = useMemo(() => {
    const result = [];
    const usedInstruments = new Set();

    // 1. Process configured linked instrument groups
    (linkedInstruments || []).forEach((group, idx) => {
      const groupInsts = Array.isArray(group.instruments) ? group.instruments : [];
      if (groupInsts.length > 0) {
        const name = group.name && group.name.trim() ? group.name.trim() : groupInsts.join(' / ');
        result.push({
          id: `linked-${idx}-${name}`,
          name: name,
          subTitle: group.name ? groupInsts.join(' + ') : '',
          isGroup: true,
          instruments: groupInsts
        });
        groupInsts.forEach(i => usedInstruments.add(i.toLowerCase().trim()));
      }
    });

    // 2. Add remaining standalone instruments
    (instrumentsDisponibles || []).forEach(inst => {
      if (!usedInstruments.has(inst.toLowerCase().trim())) {
        result.push({
          id: `single-${inst}`,
          name: inst,
          subTitle: '',
          isGroup: false,
          instruments: [inst]
        });
      }
    });

    return result;
  }, [linkedInstruments, instrumentsDisponibles]);

  // Real-time calculation of instrument quotas (Primary & Secondary) by Pupitre
  const quotasByPupitre = useMemo(() => {
    const counts = {};
    displayPupitres.forEach(pupitre => {
      counts[pupitre.id] = { primary: 0, secondary: 0 };
    });

    activeMembers.forEach(member => {
      const mainInst = (member.instrument || '').toLowerCase().trim();
      const secInst = (member.instrumentSecondaire || '').toLowerCase().trim();

      displayPupitres.forEach(pupitre => {
        const matchMain = pupitre.instruments.some(i => i.toLowerCase().trim() === mainInst);
        const matchSec = pupitre.instruments.some(i => i.toLowerCase().trim() === secInst);

        if (matchMain) {
          counts[pupitre.id].primary += 1;
        }
        if (matchSec) {
          counts[pupitre.id].secondary += 1;
        }
      });
    });

    return counts;
  }, [activeMembers, displayPupitres]);

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

  // Membres filtrés selon la recherche et le filtre de vœux en attente
  const filteredMembers = useMemo(() => {
    let list = sortedMembers;

    if (showPendingOnly) {
      list = list.filter(m => {
        const isUnassigned = !m.instrument || m.instrument.trim() === '' || m.instrument === 'En attente';
        const hasPendingWishes = Boolean(m.souhaiteChangerInstrument || (Array.isArray(m.voeuxInstruments) && m.voeuxInstruments.length > 0) || m.voeuPrincipal);
        return isUnassigned || hasPendingWishes;
      });
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter(m => {
      const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
      const surnom = (m.surnom || '').toLowerCase();
      const inst = (m.instrument || '').toLowerCase();
      const secInst = (m.instrumentSecondaire || '').toLowerCase();
      const v1 = (m.voeuPrincipal || '').toLowerCase();
      const v2 = (m.voeuSecondaire || '').toLowerCase();
      const v3 = (m.voeuTertiaire || '').toLowerCase();
      return fullName.includes(term) || surnom.includes(term) || inst.includes(term) || secInst.includes(term) || v1.includes(term) || v2.includes(term) || v3.includes(term);
    });
  }, [sortedMembers, searchTerm, showPendingOnly]);

  // Ouverture de la modale d'affectation complète
  const handleOpenAssignModal = (member) => {
    setSelectedMember(member);
    setModalOpen(true);
  };

  // Validation directe à 1-clic d'un vœu d'instrument par le Mestre
  const handleQuickValidate = async (memberTarget, validatedInstrument) => {
    if (!memberTarget || !validatedInstrument) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', memberTarget.id);
      const updatePayload = {
        instrument: validatedInstrument,
        instrumentPrincipal: validatedInstrument,
        souhaiteChangerInstrument: false
      };

      await updateDoc(userRef, updatePayload);
      alert(`✅ Vœu validé ! ${memberTarget.prenom || 'Le membre'} est à présent affecté(e) à ${validatedInstrument}.`);
    } catch (err) {
      console.error("MestreOrientationCasting - Erreur validation 1-clic :", err);
      alert("Erreur lors de la validation rapide : " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Sauvegarde depuis la modale
  const handleSaveAssignment = async (mainInst, secInst, messageToMember) => {
    if (!selectedMember || !user?.uid) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', selectedMember.id);
      const updatePayload = {
        instrument: mainInst,
        instrumentPrincipal: mainInst,
        instrumentSecondaire: secInst || '',
        souhaiteChangerInstrument: false,
        instrumentsJoues: Array.from(new Set([mainInst, secInst].filter(Boolean)))
      };

      await updateDoc(userRef, updatePayload);

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
      console.error("MestreOrientationCasting - Erreur mise à jour affectation :", err);
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
          {displayPupitres.map(pupitre => {
            const quota = quotasByPupitre[pupitre.id] || { primary: 0, secondary: 0 };
            const isLow = quota.primary === 0;
            const iconInst = pupitre.instruments[0] || pupitre.name;

            return (
              <div
                key={`quota-${pupitre.id}`}
                className={`p-2.5 rounded border flex flex-col justify-between transition-all ${
                  isLow
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-dashed border-amber-400/80 text-amber-950 dark:text-amber-200'
                    : 'bg-white/50 dark:bg-black/20 border-dashed border-cordel-master-dark/20 text-cordel-master-dark'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={getInstrumentIconPath(iconInst)}
                        alt={pupitre.name}
                        className="w-4 h-4 object-contain shrink-0 dark:invert"
                      />
                      <span className="text-[10px] font-extrabold truncate" title={pupitre.name}>
                        {pupitre.name}
                      </span>
                    </div>
                    {pupitre.isGroup && (
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] px-1 py-0.2 shrink-0">
                        🔗 Lié
                      </span>
                    )}
                  </div>
                  {pupitre.subTitle && (
                    <span className="text-[8.5px] font-semibold text-cordel-wood block truncate mb-1" title={pupitre.subTitle}>
                      {pupitre.subTitle}
                    </span>
                  )}
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
              📋 Tableau d'Affectation
            </h3>
            {/* Filtre Tous / Vœux en attente */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setShowPendingOnly(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${!showPendingOnly ? 'bg-cordel-wood text-white shadow-xs' : 'bg-white/60 dark:bg-black/20 text-cordel-master-dark border border-cordel-master-dark/20'}`}
              >
                Tous ({activeMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setShowPendingOnly(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${showPendingOnly ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}
              >
                <span>⏳ Vœux en attente</span>
                {(unassignedCount > 0 || wishCount > 0) && (
                  <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.2 rounded-full font-black">
                    {unassignedCount + wishCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full sm:w-56">
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
                <th className="py-2 px-2">Vœux Formulés (Validation 1-Clic)</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-cordel-master-dark/15">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs font-bold text-cordel-master-dark/60 italic">
                    Aucun membre ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const name = `${m.prenom || ''} ${m.nom || ''}`.trim() || 'Sans Nom';
                  const isUnassigned = !m.instrument || m.instrument.trim() === '' || m.instrument === 'En attente';
                  const isAssigned = !isUnassigned;
                  const wishesList = Array.isArray(m.voeuxInstruments) && m.voeuxInstruments.length > 0
                    ? m.voeuxInstruments
                    : [m.voeuPrincipal, m.voeuSecondaire, m.voeuTertiaire].filter(Boolean);
                  const hasWishes = wishesList.length > 0;

                  return (
                    <tr
                      key={`member-row-${m.id}`}
                      className={`hover:bg-cordel-bg-light/80 transition-colors border-b border-dashed border-cordel-master-dark/10 ${
                        isAssigned
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500'
                          : isUnassigned
                          ? 'bg-amber-100/40 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                          : 'bg-white/40 dark:bg-black/10 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* 1. Nom / Avatar */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5">
                          <XiloAvatar src={m.photoURL} name={name} size={36} />
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-cordel-master-dark flex items-center gap-1">
                              {name}
                              {m.pratiqueDanse && (
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded" title="Pratique la Danse">
                                  💃 Danse
                                </span>
                              )}
                              {isAssigned && (
                                <span className="text-[8px] font-black text-emerald-800 bg-emerald-200 dark:bg-emerald-900/70 dark:text-emerald-200 px-1 py-0.2 rounded uppercase flex items-center gap-0.5">
                                  ✅ Traité
                                </span>
                              )}
                              {isUnassigned && (
                                <span className="text-[8px] font-black text-amber-700 bg-amber-200 dark:bg-amber-900/60 dark:text-amber-200 px-1 py-0.2 rounded uppercase">
                                  À attribuer
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

                      {/* 2. Instrument Actuel / Validé */}
                      <td className="py-2.5 px-2">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold flex items-center gap-1.5 text-cordel-master-dark">
                            <img
                              src={getInstrumentIconPath(m.instrumentPrincipal || m.instrument)}
                              alt={m.instrumentPrincipal || m.instrument || 'Aucun'}
                              className="w-3.5 h-3.5 object-contain dark:invert"
                            />
                            <span>{m.instrumentPrincipal || m.instrument || <span className="italic text-amber-600 dark:text-amber-400 font-semibold">En attente</span>}</span>
                            {isAssigned && (
                              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400" title="Instrument attribué et validé par le Mestre">
                                ✅
                              </span>
                            )}
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

                      {/* 3. Vœux Formulés (Boutons 1-Clic) */}
                      <td className="py-2.5 px-2">
                        {hasWishes ? (
                          <div className="flex flex-col gap-1 text-[10px]">
                            <div className="flex flex-wrap gap-1 items-center">
                              {wishesList.map((wish, idx) => {
                                const isCurrentMain = (m.instrumentPrincipal || m.instrument) === wish;
                                return (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span className={`px-1.5 py-0.5 rounded border font-semibold ${isCurrentMain ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-black' : 'bg-white/80 dark:bg-black/30 border-cordel-master-dark/20'}`}>
                                      <strong className="text-cordel-wood">{idx + 1} :</strong> {wish} {isCurrentMain ? '✅' : ''}
                                    </span>
                                    {!isCurrentMain && (
                                      <button
                                        type="button"
                                        onClick={() => handleQuickValidate(m, wish)}
                                        disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs cursor-pointer transition-all shrink-0"
                                        title={`Valider ${wish} en 1 seul clic`}
                                      >
                                        ✓ Valider
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {(m.volontaireAncienInstrument || m.accordRenfortAncienInstrument) && (m.instrumentPrincipal || m.instrument) && (
                              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-extrabold flex items-center gap-1 w-max">
                                🤝 Renfort ancien instrument ok
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 text-[10px]">
                            <span className="italic text-cordel-master-dark/50">
                              Aucun vœu formulé
                            </span>
                          </div>
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
                          {isUnassigned ? '🎯 Affecter' : '✏️ Modifier'}
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
