import React, { useMemo } from 'react';

/**
 * Section Imprimable A4 : Bénévoles & Matériel des Commissions (Bloc 2).
 * Conçue pour s'intégrer harmonieusement dans RoadbookPrintView sans déborder.
 *
 * @param {Object} props
 * @param {Array} props.commissions Commissions actives
 * @param {Array} props.allUsers Liste des membres
 */
export default function RoadbookCommissionsPrintSection({ commissions = [], allUsers = [] }) {
  const usersMap = useMemo(() => {
    const map = {};
    (allUsers || []).forEach((u) => {
      if (u?.id) map[u.id] = u;
    });
    return map;
  }, [allUsers]);

  const allCreneaux = useMemo(() => {
    const list = [];
    commissions.forEach((comm) => {
      (comm.creneauxBenevoles || []).forEach((c) => {
        list.push({ ...c, commTitre: comm.titre });
      });
    });
    return list.sort((a, b) => (a.horaireDebut || '').localeCompare(b.horaireDebut || ''));
  }, [commissions]);

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

      {/* Créneaux Bénévoles */}
      {allCreneaux.length > 0 && (
        <div className="mb-2">
          <span className="font-bold block mb-0.5">🤝 Bénévoles mobilisés :</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {allCreneaux.map((c, i) => {
              const horaires = c.horaireDebut ? `${c.horaireDebut}-${c.horaireFin || 'fin'}` : 'Jour J';
              const inscritsNoms = (c.inscritsIds || []).map((uid) => {
                const u = usersMap[uid];
                return u ? `${u.prenom || ''} ${u.nom ? u.nom[0] + '.' : ''}` : 'Bénévole';
              });
              return (
                <div key={i} className="truncate">
                  • <strong>{c.titre || c.poste}</strong> ({horaires}) : {inscritsNoms.length > 0 ? inscritsNoms.join(', ') : 'À pourvoir'}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matériel & Besoins */}
      {allBesoins.length > 0 && (
        <div className="pt-1 border-t border-dotted border-neutral-400">
          <span className="font-bold block mb-0.5">🧰 Besoins logistiques en attente :</span>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {allBesoins.map((b, i) => {
              const u = usersMap[b.responsableId];
              const resp = u ? `${u.prenom || ''} ${u.nom ? u.nom[0] + '.' : ''}` : 'Non assigné';
              return (
                <div key={i} className="truncate">
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
