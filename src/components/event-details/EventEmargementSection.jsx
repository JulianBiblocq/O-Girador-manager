import React, { useState, useEffect, useMemo } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { isMemberCaOrBureau, getEffectiveMemberTags } from '../../utils/memberUtils';

/**
 * Sous-composant dédié à l'émargement manuel des participants lors des réunions.
 * Permet d'initialiser ou de corriger la liste des membres présents en un clic,
 * et de renseigner le décompte des participants externes / public non-adhérent.
 */
export default function EventEmargementSection({
  event,
  groupId,
  isAdmin = false,
  onInscriptionsChanged
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [caOnlyFilter, setCaOnlyFilter] = useState(event?.audience === 'ca');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [invitesCount, setInvitesCount] = useState(event?.invitesOuPublicCount || 0);

  // Synchronisation du décompte d'invités avec l'événement
  useEffect(() => {
    setInvitesCount(event?.invitesOuPublicCount || 0);
  }, [event?.invitesOuPublicCount]);

  // Si l'audience de la réunion change en CA, activer le filtre CA par défaut
  useEffect(() => {
    if (event?.audience === 'ca') {
      setCaOnlyFilter(true);
    }
  }, [event?.audience]);

  // Récupération de la liste des membres de l'association
  useEffect(() => {
    const targetGroupId = event?.groupId || groupId;
    if (!targetGroupId) return;

    let isMounted = true;
    setLoadingMembers(true);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', targetGroupId));

    getDocs(q)
      .then((snapshot) => {
        if (!isMounted) return;
        const fetched = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, uid: docSnap.id, ...docSnap.data() });
        });

        // Trier par nom de famille puis prénom
        fetched.sort((a, b) => {
          const nomA = `${a.nom || ''} ${a.prenom || ''}`.trim().toLowerCase();
          const nomB = `${b.nom || ''} ${b.prenom || ''}`.trim().toLowerCase();
          return nomA.localeCompare(nomB);
        });

        setMembers(fetched);
        setLoadingMembers(false);
      })
      .catch((err) => {
        console.error("EventEmargementSection - Erreur chargement membres :", err);
        if (isMounted) setLoadingMembers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [event?.groupId, groupId]);

  // Liste des inscriptions actuelles et membres marqués présents
  const currentInscriptions = useMemo(() => {
    return Array.isArray(event?.inscriptions) ? event.inscriptions : [];
  }, [event?.inscriptions]);

  const presentUserIds = useMemo(() => {
    const set = new Set();
    currentInscriptions.forEach((ins) => {
      if (ins.status === 'present') {
        set.add(ins.userId);
      }
    });
    return set;
  }, [currentInscriptions]);

  const presentsCount = presentUserIds.size;
  const totalParticipants = presentsCount + (invitesCount || 0);

  // Filtrage des membres selon recherche textuelle et restriction CA éventuelle
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Filtrage CA/Bureau si demandé
      if (caOnlyFilter && !isMemberCaOrBureau(m)) {
        return false;
      }

      // Recherche textuelle
      if (searchQuery.trim()) {
        const queryClean = searchQuery.toLowerCase().trim();
        const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
        const nickname = (m.surnom || m.apelido || '').toLowerCase();
        const inst = (m.instrument || m.instrumentPrincipal || '').toLowerCase();
        return fullName.includes(queryClean) || nickname.includes(queryClean) || inst.includes(queryClean);
      }

      return true;
    });
  }, [members, caOnlyFilter, searchQuery]);

  // Bascule du statut d'émargement d'un membre (présent <-> absent)
  const handleToggleMember = async (member) => {
    if (!isAdmin || !event?.id) return;

    const memberId = member.id || member.uid;
    const memberName = `${member.prenom || ''} ${member.nom || ''}`.trim() || member.displayName || 'Adhérent';
    const isCurrentlyPresent = presentUserIds.has(memberId);

    let updatedInscriptions;
    const existingIndex = currentInscriptions.findIndex((ins) => ins.userId === memberId);

    if (existingIndex >= 0) {
      if (isCurrentlyPresent) {
        // Décocher : marquer absent
        updatedInscriptions = currentInscriptions.map((ins, idx) =>
          idx === existingIndex ? { ...ins, status: 'absent' } : ins
        );
      } else {
        // Cocher : marquer présent
        updatedInscriptions = currentInscriptions.map((ins, idx) =>
          idx === existingIndex ? { ...ins, status: 'present', userName: memberName } : ins
        );
      }
    } else {
      // Nouvelle entrée
      updatedInscriptions = [
        ...currentInscriptions,
        {
          userId: memberId,
          userName: memberName,
          status: 'present',
          date: new Date().toISOString()
        }
      ];
    }

    // Mise à jour optimiste locale
    if (event) {
      event.inscriptions = updatedInscriptions;
    }
    if (onInscriptionsChanged) {
      onInscriptionsChanged(updatedInscriptions);
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { inscriptions: updatedInscriptions });
    } catch (err) {
      console.error("EventEmargementSection - Erreur mise à jour présence :", err);
    }
  };

  // Cocher tous les membres affichés par le filtre courant
  const handleCheckAllVisible = async () => {
    if (!isAdmin || !event?.id || filteredMembers.length === 0) return;

    const updatedInscriptions = [...currentInscriptions];
    filteredMembers.forEach((m) => {
      const memberId = m.id || m.uid;
      const memberName = `${m.prenom || ''} ${m.nom || ''}`.trim() || m.displayName || 'Adhérent';
      const idx = updatedInscriptions.findIndex((ins) => ins.userId === memberId);
      if (idx >= 0) {
        updatedInscriptions[idx] = { ...updatedInscriptions[idx], status: 'present', userName: memberName };
      } else {
        updatedInscriptions.push({
          userId: memberId,
          userName: memberName,
          status: 'present',
          date: new Date().toISOString()
        });
      }
    });

    if (event) event.inscriptions = updatedInscriptions;
    if (onInscriptionsChanged) onInscriptionsChanged(updatedInscriptions);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { inscriptions: updatedInscriptions });
    } catch (err) {
      console.error("EventEmargementSection - Erreur émargement collectif :", err);
    }
  };

  // Réinitialiser / Décocher les présences des membres affichés
  const handleUncheckAllVisible = async () => {
    if (!isAdmin || !event?.id) return;

    const visibleIds = new Set(filteredMembers.map((m) => m.id || m.uid));
    const updatedInscriptions = currentInscriptions.map((ins) => {
      if (visibleIds.has(ins.userId)) {
        return { ...ins, status: 'absent' };
      }
      return ins;
    });

    if (event) event.inscriptions = updatedInscriptions;
    if (onInscriptionsChanged) onInscriptionsChanged(updatedInscriptions);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { inscriptions: updatedInscriptions });
    } catch (err) {
      console.error("EventEmargementSection - Erreur réinitialisation émargement :", err);
    }
  };

  // Modification du nombre d'invités / public non-adhérent
  const handleInvitesChange = async (newVal) => {
    const count = Math.max(0, parseInt(newVal, 10) || 0);
    setInvitesCount(count);
    if (event) event.invitesOuPublicCount = count;

    if (!isAdmin || !event?.id) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { invitesOuPublicCount: count });
    } catch (err) {
      console.error("EventEmargementSection - Erreur sauvegarde invités :", err);
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={false} className="p-3 bg-cordel-bg-light/50 border-dashed">
      {/* En-tête pliable */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none gap-2 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{isOpen ? '▼' : '▶'}</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>👥</span>
            <span>Émargement des présents</span>
          </span>
          <span className="theme-stamp-badge text-[8.5px] font-black tracking-wider bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[var(--color-cordel-vert)]/40 rounded px-1.5 py-0.5">
            {presentsCount} adhérent(s)
            {invitesCount > 0 && ` + ${invitesCount} invité(s)`}
          </span>
        </div>

        <div className="text-[10px] text-stone-600 font-bold">
          Total : <strong className="text-encre-noire">{totalParticipants}</strong> participant(s)
          <span className="ml-1 text-[9px] text-[var(--color-cordel-ocre)] hover:underline">
            {isOpen ? "(replier)" : "(pointer les présents)"}
          </span>
        </div>
      </div>

      {/* Corps dépliable */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3.5">
          {/* Barre de contrôle : Recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un adhérent par nom, prénom..."
                className="theme-input text-xs w-full py-1 px-2.5 bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-stone-400 hover:text-stone-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtre CA/Bureau */}
              <button
                type="button"
                onClick={() => setCaOnlyFilter(!caOnlyFilter)}
                className={`text-[9.5px] font-extrabold uppercase px-2 py-1 rounded border transition-all cursor-pointer ${
                  caOnlyFilter
                    ? 'bg-cordel-wood text-white border-encre-noire shadow-2xs'
                    : 'bg-white text-stone-700 border-neutral-300 hover:bg-neutral-50'
                }`}
                title="Filtrer uniquement les membres du Conseil d'Administration et du Bureau"
              >
                🔒 Membres CA / Bureau
              </button>

              {isAdmin && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleCheckAllVisible}
                    className="text-[9px] font-bold px-2 py-1 bg-green-50 text-green-800 border border-green-300 rounded hover:bg-green-100 cursor-pointer"
                    title="Cocher tous les membres visibles"
                  >
                    ✓ Tous
                  </button>
                  <button
                    type="button"
                    onClick={handleUncheckAllVisible}
                    className="text-[9px] font-bold px-2 py-1 bg-neutral-100 text-stone-700 border border-neutral-300 rounded hover:bg-neutral-200 cursor-pointer"
                    title="Décocher les membres visibles"
                  >
                    ✕ Aucun
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grille des membres éligibles */}
          {loadingMembers ? (
            <div className="text-center py-4 text-xs italic text-stone-500">
              Chargement des adhérents...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-4 text-xs italic text-stone-500 bg-white/40 rounded border border-dashed border-neutral-300">
              {searchQuery
                ? "Aucun membre ne correspond à cette recherche."
                : caOnlyFilter
                ? "Aucun membre porteur du badge CA/Bureau trouvé."
                : "Aucun membre trouvé dans l'association."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 max-h-60 overflow-y-auto pr-1 p-1 bg-white/40 rounded border border-cordel-master-dark/15 varal-scrollbar">
              {filteredMembers.map((member) => {
                const memberId = member.id || member.uid;
                const isChecked = presentUserIds.has(memberId);
                const effectiveTags = getEffectiveMemberTags(member);
                const isCaMember = isMemberCaOrBureau(member);

                return (
                  <label
                    key={memberId}
                    className={`flex items-center gap-2 p-1.5 rounded border transition-all cursor-pointer select-none text-xs ${
                      isChecked
                        ? 'bg-[var(--color-cordel-vert)]/10 border-[var(--color-cordel-vert)]/50 text-green-950 font-bold'
                        : 'bg-white/80 hover:bg-white border-neutral-200 text-stone-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isAdmin}
                      onChange={() => handleToggleMember(member)}
                      className="rounded border-neutral-400 text-[var(--color-cordel-vert)] focus:ring-[var(--color-cordel-vert)] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                      <span className="truncate">
                        {member.prenom || ''} {member.nom || ''}
                      </span>
                      {isCaMember && (
                        <span className="text-[7.5px] uppercase font-black px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                          CA
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {/* Décompte optionnel des participants externes / public non adhérent */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-amber-50/70 rounded border border-dashed border-amber-300 text-xs">
            <div className="flex flex-col">
              <span className="font-extrabold text-cordel-wood uppercase text-[10px]">
                📢 Participants invités ou public non-adhérent
              </span>
              <span className="text-[10px] text-stone-600 italic">
                Utile pour les réunions publiques ou assemblées ouvertes aux sympathisants
              </span>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleInvitesChange(invitesCount - 1)}
                  disabled={invitesCount <= 0}
                  className="w-6 h-6 flex items-center justify-center font-black bg-white rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-30 cursor-pointer select-none"
                >
                  −
                </button>
              )}
              <input
                type="number"
                min="0"
                value={invitesCount}
                disabled={!isAdmin}
                onChange={(e) => handleInvitesChange(e.target.value)}
                className="theme-input text-xs w-16 text-center font-bold py-1 bg-white"
              />
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleInvitesChange(invitesCount + 1)}
                  className="w-6 h-6 flex items-center justify-center font-black bg-white rounded border border-neutral-300 hover:bg-neutral-100 cursor-pointer select-none"
                >
                  +
                </button>
              )}
              <span className="text-[10px] font-bold text-stone-700 ml-1">personne(s)</span>
            </div>
          </div>

          {/* Résumé d'émargement */}
          <div className="flex items-center justify-between text-[10px] text-stone-600 border-t border-dashed border-neutral-300 pt-2 px-1">
            <span>
              ✓ <strong>{presentsCount}</strong> adhérent(s) émargé(s)
            </span>
            {invitesCount > 0 && (
              <span>
                + <strong>{invitesCount}</strong> non-adhérent(s)
              </span>
            )}
            <span className="font-black text-cordel-wood uppercase tracking-wider">
              = {totalParticipants} au total
            </span>
          </div>
        </div>
      )}
    </CordelCard>
  );
}
