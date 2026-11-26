import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { canonicalizeGroupId } from '../../utils/tenantUtils';
import { isMemberArchived } from '../../utils/memberUtils';

/**
 * Sélecteur compact des Référents Bénévoles Jour J (1 ou 2 membres maximum)
 * persisté dans `events/{eventId}.volunteerReferentIds`.
 */
export default function VolunteerReferentsSelector({
  value = [],
  onChange,
  allUsers = [],
  groupId = '',
  saving = false,
  tr
}) {
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [candidateId, setCandidateId] = useState('');
  const selectedIds = useMemo(() => (Array.isArray(value) ? value.filter(Boolean).slice(0, 2) : []), [value]);

  useEffect(() => {
    if (allUsers.length > 0 || !groupId) return undefined;
    let active = true;
    const cleanGroup = canonicalizeGroupId(groupId) || String(groupId).trim();
    if (!cleanGroup) return undefined;
    getDocs(query(collection(db, 'users'), where('groupId', '==', cleanGroup)))
      .then((snap) => {
        if (!active) return;
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setFetchedUsers(list);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [allUsers.length, groupId]);

  const members = useMemo(() => {
    const src = allUsers.length > 0 ? allUsers : fetchedUsers;
    return src
      .filter((u) => u && (u.id || u.uid) && !isMemberArchived(u) && (u.prenom || u.nom || u.displayName))
      .map((u) => ({
        id: String(u.id || u.uid),
        label: `${u.prenom || ''} ${u.nom || u.displayName || ''}`.trim(),
        phone: String(u.telephone || u.phone || '').trim()
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allUsers, fetchedUsers]);

  const membersById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;

  const handleAdd = (uid) => {
    if (!uid || selectedIds.includes(uid) || selectedIds.length >= 2) return;
    onChange([...selectedIds, uid]);
    setCandidateId('');
  };

  const handleRemove = (uid) => onChange(selectedIds.filter((id) => id !== uid));

  return (
    <div className="p-2.5 rounded-lg bg-[var(--cordel-bg)]/70 border border-[var(--theme-border)]/25 flex flex-col gap-1.5 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-[9.5px] uppercase font-extrabold tracking-wider text-[var(--cordel-wood)]">
          👤 {t('agenda.volunteerReferentsFieldLabel') || 'Référent(s) Bénévoles Jour J (1 ou 2 membres)'} ({selectedIds.length}/2)
        </label>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((uid) => {
            const m = membersById[uid];
            return (
              <span key={uid} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white text-[10.5px] font-bold border border-[var(--theme-border)]">
                <span>🤝 {m?.label || uid}{m?.phone ? ` (${m.phone})` : ''}</span>
                <button type="button" disabled={saving} onClick={() => handleRemove(uid)} className="font-black cursor-pointer ml-0.5" title="Retirer">×</button>
              </span>
            );
          })}
        </div>
      )}

      {selectedIds.length < 2 && members.length > 0 && (
        <div className="flex items-center gap-1.5">
          <select
            value={candidateId}
            disabled={saving}
            onChange={(e) => handleAdd(e.target.value)}
            className="theme-input py-1 px-2 text-xs flex-1"
          >
            <option value="">{t('agenda.volunteerReferentsSelectPlaceholder') || 'Désigner un référent bénévoles pour la date...'}</option>
            {members.filter((m) => !selectedIds.includes(m.id)).map((m) => (
              <option key={m.id} value={m.id}>{m.label}{m.phone ? ` — ${m.phone}` : ''}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
