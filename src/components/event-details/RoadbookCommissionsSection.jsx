import React, { useMemo } from 'react';

/**
 * Section Roadbook Interactive : Postes Bénévoles & Logistique issus des Commissions (Bloc 2).
 * S'affiche à l'écran sur mobile/tablette/desktop avec le style Cordel.
 *
 * @param {Object} props
 * @param {Array} props.commissions Liste des commissions actives de l'événement
 * @param {Array} props.allUsers Liste de tous les membres pour la résolution des noms
 */
export default function RoadbookCommissionsSection({ commissions = [], allUsers = [] }) {
  const usersMap = useMemo(() => {
    const map = {};
    (allUsers || []).forEach((u) => {
      if (u?.id) map[u.id] = u;
    });
    return map;
  }, [allUsers]);

  // 1. Compilation et tri chronologique des créneaux bénévoles
  const allCreneaux = useMemo(() => {
    const list = [];
    commissions.forEach((comm) => {
      (comm.creneauxBenevoles || []).forEach((c) => {
        list.push({
          ...c,
          commissionTitre: comm.titre || 'Commission',
          commissionIcone: comm.icone || '📋'
        });
      });
    });

    return list.sort((a, b) => (a.horaireDebut || '').localeCompare(b.horaireDebut || ''));
  }, [commissions]);

  // 2. Compilation des besoins matériels actifs (À trouver ou Réservés)
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

  if (allCreneaux.length === 0 && allBesoins.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* 1. Section Bénévoles & Postes */}
      {allCreneaux.length > 0 && (
        <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
          <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center justify-between uppercase text-xs tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>🤝</span> Postes &amp; Créneaux Bénévoles
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-black border border-encre-noire/30 bg-white">
              {allCreneaux.length} créneau{allCreneaux.length > 1 ? 'x' : ''}
            </span>
          </h3>

          <div className="space-y-2 text-xs">
            {allCreneaux.map((creneau, idx) => {
              const horaires = creneau.horaireDebut && creneau.horaireFin
                ? `${creneau.horaireDebut} - ${creneau.horaireFin}`
                : creneau.horaireDebut || 'Horaire libre';
              const places = creneau.places || 1;
              const inscritsIds = creneau.inscritsIds || [];
              const placesRestantes = Math.max(0, places - inscritsIds.length);

              const inscritsNoms = inscritsIds.map((uid) => {
                const u = usersMap[uid];
                return u ? `${u.prenom || ''} ${u.nom || u.displayName || ''}`.trim() : 'Bénévole';
              });

              return (
                <div key={creneau.id || idx} className="p-2 bg-white/70 rounded border border-[var(--theme-border-color)] flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-black text-sm">{creneau.commissionIcone}</span>
                      <strong className="text-[var(--color-cordel-encre)] truncate">
                        {creneau.titre || creneau.poste || 'Poste bénévole'}
                      </strong>
                      <span className="text-[10px] text-stone-500 truncate">({creneau.commissionTitre})</span>
                    </div>
                    <span className="font-bold text-[11px] px-1.5 py-0.5 rounded bg-cordel-bg border border-encre-noire/20 shrink-0">
                      ⏰ {horaires}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] pt-1 border-t border-stone-200">
                    <div className="text-stone-700 truncate">
                      {inscritsNoms.length > 0 ? (
                        <span>Inscrits : <strong>{inscritsNoms.join(', ')}</strong></span>
                      ) : (
                        <span className="italic text-stone-400">Aucun bénévole inscrit</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-black shrink-0 ${placesRestantes === 0 ? 'text-[var(--color-cordel-vert)]' : 'text-[var(--color-cordel-ocre)]'}`}>
                      {placesRestantes === 0 ? 'Complet' : `${placesRestantes} place(s) dispo`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Section Logistique & Matériel */}
      {allBesoins.length > 0 && (
        <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
          <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center justify-between uppercase text-xs tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>🧰</span> Matériel &amp; Régie des Commissions
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded font-black border border-encre-noire/30 bg-white">
              {allBesoins.length} besoin{allBesoins.length > 1 ? 's' : ''}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {allBesoins.map((besoin, idx) => {
              const u = usersMap[besoin.responsableId];
              const respNom = u ? `${u.prenom || ''} ${u.nom || u.displayName || ''}`.trim() : 'Non assigné';
              const isReserve = besoin.statut === 'reserve';

              return (
                <div key={besoin.id || idx} className="p-2 bg-white/70 rounded border border-[var(--theme-border-color)] flex flex-col justify-between gap-1">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <strong className="text-[var(--color-cordel-encre)] leading-tight">
                        {besoin.quantite ? `${besoin.quantite}x ` : ''}{besoin.article}
                      </strong>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${
                        isReserve
                          ? 'bg-amber-50 text-[var(--color-cordel-ocre)] border-[var(--color-cordel-ocre)]/40'
                          : 'bg-rose-50 text-[var(--color-cordel-rouge)] border-[var(--color-cordel-rouge)]/40'
                      }`}>
                        {isReserve ? 'Réservé' : 'À trouver'}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      {besoin.commissionIcone} {besoin.commissionTitre}
                    </span>
                  </div>

                  <div className="text-[10px] text-stone-600 pt-1 border-t border-stone-200">
                    En charge : <strong className="text-stone-800">{respNom}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
