import React, { useMemo } from 'react';
import { consolidateVolunteerShifts } from '../../utils/volunteerShiftUtils';

/**
 * Section Roadbook Interactive : Postes Bénévoles & Logistique consolidés (événement + commissions).
 * S'affiche à l'écran sur mobile/tablette/desktop avec le style Cordel.
 */
export default function RoadbookCommissionsSection({ event = {}, commissions = [], allUsers = [] }) {
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
          list.push({
            ...b,
            commissionTitre: comm.titre || 'Commission',
            commissionIcone: comm.icone || '📋'
          });
        });
    });
    return list;
  }, [commissions]);

  if (allCreneaux.length === 0 && allBesoins.length === 0) return null;

  return (
    <div className="space-y-4">
      {allCreneaux.length > 0 && (
        <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
          <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center justify-between uppercase text-xs tracking-wider">
            <span className="flex items-center gap-1.5"><span>🤝</span> Postes &amp; Créneaux Bénévoles</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-black border border-encre-noire/30 bg-[var(--theme-input-bg)]">
              {allCreneaux.length} créneau{allCreneaux.length > 1 ? 'x' : ''}
            </span>
          </h3>

          <div className="space-y-2 text-xs">
            {allCreneaux.map((creneau, idx) => {
              const quota = Number(creneau.quotaRequis) || 0;
              const inscrits = creneau.inscrits || [];
              const placesRestantes = quota > 0 ? Math.max(0, quota - inscrits.length) : null;
              const inscritsNoms = inscrits.map((ins) => (
                ins.type === 'guest'
                  ? `${ins.prenom} ${ins.nom ? `${ins.nom[0]}.` : ''} (proche de ${ins.parrainNom || 'membre'})`.trim()
                  : ins.type === 'external'
                    ? `${ins.prenom || ''} ${ins.nom || ''} (Externe)`.trim()
                    : `${ins.prenom || ''} ${ins.nom || ''}`.trim() || 'Bénévole'
              ));

              return (
                <div key={creneau.id || idx} className="p-2 bg-[var(--theme-input-bg)]/80 rounded border border-[var(--theme-border-color)] flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <strong className="text-[var(--color-cordel-encre)] truncate">{creneau.nomTache || 'Poste bénévole'}</strong>
                      {creneau.commissionTitre && <span className="text-[10px] opacity-65 truncate">({creneau.commissionTitre})</span>}
                    </div>
                    <span className="font-bold text-[11px] px-1.5 py-0.5 rounded bg-cordel-bg border border-encre-noire/20 shrink-0">
                      ⏰ {creneau.horaires || 'Horaire libre'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-[var(--theme-border-color)]/20">
                    <div className="truncate">
                      {inscritsNoms.length > 0 ? <span>Inscrits : <strong>{inscritsNoms.join(', ')}</strong></span> : <span className="italic opacity-55">Aucun bénévole inscrit</span>}
                    </div>
                    {placesRestantes !== null && (
                      <span className={`text-[10px] font-black shrink-0 ${placesRestantes === 0 ? 'text-[var(--color-cordel-vert)]' : 'text-[var(--color-cordel-ocre)]'}`}>
                        {placesRestantes === 0 ? 'Complet' : `${placesRestantes} place(s) dispo`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {allBesoins.length > 0 && (
        <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
          <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center justify-between uppercase text-xs tracking-wider">
            <span className="flex items-center gap-1.5"><span>🧰</span> Matériel &amp; Régie des Commissions</span>
            <span className="text-[10px] px-2 py-0.5 rounded font-black border border-encre-noire/30 bg-[var(--theme-input-bg)]">
              {allBesoins.length} besoin{allBesoins.length > 1 ? 's' : ''}
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {allBesoins.map((besoin, idx) => {
              const u = usersMap[besoin.responsableId];
              const respNom = u ? `${u.prenom || ''} ${u.nom || u.displayName || ''}`.trim() : 'Non assigné';
              const isReserve = besoin.statut === 'reserve';
              return (
                <div key={besoin.id || idx} className="p-2 bg-[var(--theme-input-bg)]/80 rounded border border-[var(--theme-border-color)] flex flex-col justify-between gap-1">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <strong className="text-[var(--color-cordel-encre)] leading-tight">{besoin.quantite ? `${besoin.quantite}x ` : ''}{besoin.article}</strong>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${
                        isReserve ? 'text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40' : 'text-[var(--color-cordel-rouge)] border-[var(--color-cordel-rouge)]/40'
                      }`}>{isReserve ? 'Réservé' : 'À trouver'}</span>
                    </div>
                    <span className="text-[10px] opacity-65 block mt-0.5">{besoin.commissionIcone} {besoin.commissionTitre}</span>
                  </div>
                  <div className="text-[10px] opacity-80 pt-1 border-t border-[var(--theme-border-color)]/20">En charge : <strong>{respNom}</strong></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
