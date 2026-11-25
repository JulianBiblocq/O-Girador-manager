import React, { useMemo } from 'react';
import { consolidateVolunteerShifts } from '../../utils/volunteerShiftUtils';

/**
 * Section Imprimable A4 : Bénévoles & Matériel consolidés (événement + commissions).
 * Conçue pour s'intégrer harmonieusement dans RoadbookPrintView sans déborder.
 */
export default function RoadbookCommissionsPrintSection({ event = {}, commissions = [], allUsers = [] }) {
  const usersMap = useMemo(() => {
    const map = {};
    (allUsers || []).forEach((u) => {
      if (u?.id) map[u.id] = u;
      if (u?.uid) map[u.uid] = u;
    });
    return map;
  }, [allUsers]);

  const allCreneaux = useMemo(
    () => consolidateVolunteerShifts(event, commissions, usersMap),
    [event, commissions, usersMap]
  );

  const allBesoins = useMemo(() => {
    const list = [];
    commissions.forEach((comm) => {
      (comm.besoinsMateriel || [])
        .filter((b) => b.statut === 'a_trouver' || b.statut === 'reserve')
        .forEach((b) => {
          list.push({ ...b, commTitre: comm.titre });
        });
    });
    return list;
  }, [commissions]);

  if (allCreneaux.length === 0 && allBesoins.length === 0) return null;

  return (
    <div className="border border-black p-2 rounded mt-2 text-[9px] leading-tight">
      <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">
        🎪 Postes Bénévoles &amp; Régie Commissions
      </h2>

      {allCreneaux.length > 0 && (
        <div className="mb-2">
          <span className="font-bold block mb-0.5">🤝 Bénévoles mobilisés :</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {allCreneaux.map((c, i) => {
              const horaires = c.horaires || 'Jour J';
              const inscritsNoms = (c.inscrits || []).map((ins) => (
                ins.type === 'guest'
                  ? `${ins.prenom} ${ins.nom ? `${ins.nom[0]}.` : ''} (+${ins.parrainNom || 'membre'})`
                  : ins.type === 'external'
                    ? `${ins.prenom || ''} ${ins.nom ? `${ins.nom[0]}.` : ''} (Ext.)`.trim()
                    : `${ins.prenom || ''} ${ins.nom ? `${ins.nom[0]}.` : ''}`.trim() || 'Bénévole'
              ));
              return (
                <div key={c.id || i} className="truncate">
                  • <strong>{c.nomTache}</strong> ({horaires}) : {inscritsNoms.length > 0 ? inscritsNoms.join(', ') : 'À pourvoir'}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allBesoins.length > 0 && (
        <div className="pt-1 border-t border-dotted border-neutral-400">
          <span className="font-bold block mb-0.5">🧰 Besoins logistiques en attente :</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {allBesoins.map((b, i) => {
              const u = usersMap[b.responsableId];
              const resp = u ? `${u.prenom || ''} ${u.nom ? `${u.nom[0]}.` : ''}`.trim() : 'Non assigné';
              return (
                <div key={b.id || i} className="truncate">
                  [ ] {b.quantite ? `${b.quantite}x ` : ''}<strong>{b.article}</strong> ({b.statut === 'reserve' ? 'Réservé' : 'À trouver'} - {resp})
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
