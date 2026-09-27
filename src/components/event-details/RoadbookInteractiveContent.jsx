import React from 'react';
import RoadbookKitsChecklist from './RoadbookKitsChecklist';

/**
 * Contenu interactif de la feuille de route pour affichage écran et smartphone.
 * Navigation rapide, numéros de téléphone cliquables (tel:...) et lien vers l'annexe PDF.
 *
 * @param {Object} props
 * @param {Object} props.event - Données de l'événement
 * @param {Array} props.allUsers - Membres du groupe
 * @param {Object} props.presentsByInstrument - Décompte des présents par pupitre
 */
export default function RoadbookInteractiveContent({
  event = {},
  allUsers = [],
  presentsByInstrument = {}
}) {
  const parcours = event.parcours || {};
  const hebergement = event.hebergement || {};
  const logistique = event.logistiqueDepart || {};
  const contacts = event.contactsJourJ || {};
  const referentGroupe = (allUsers || []).find((u) => u.id === contacts.referentGroupeId);
  const voitures = event.covoiturage?.voitures || [];
  const hasParcours = Boolean(parcours.pointDepart || parcours.itineraire || parcours.pointArrivee || parcours.urlFichierParcours);
  const hasHebergement = Boolean(hebergement.type || hebergement.adresse);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Horaires et logistique générale */}
      <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
        <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center gap-1.5 uppercase text-xs tracking-wider">
          ⏰ Horaires &amp; Rendez-vous
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div><span className="font-medium text-[var(--color-cordel-marron)]">RDV Local :</span> <strong className="text-[var(--color-cordel-encre)]">{event.horaireCovoiturage || 'Non spécifié'}</strong></div>
          <div><span className="font-medium text-[var(--color-cordel-marron)]">Jeu / Balances :</span> <strong className="text-[var(--color-cordel-encre)]">{event.horairesPassages || 'Selon organisation'}</strong></div>
          {event.lieu && <div><span className="font-medium text-[var(--color-cordel-marron)]">Lieu :</span> <span className="font-semibold">{event.lieu}</span></div>}
          {event.tenueRequise && <div><span className="font-medium text-[var(--color-cordel-marron)]">Tenue :</span> <span className="font-semibold">{event.tenueRequise}</span></div>}
        </div>
      </div>

      {/* Bloc Contacts Clés Jour J */}
      <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
        <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center gap-1.5 uppercase text-xs tracking-wider">
          📞 Contacts Clés Jour J
        </h3>
        <div className="space-y-2 text-xs">
          {contacts.referentOrgaNom && (
            <div className="flex items-center justify-between bg-white/70 p-2 rounded border border-[var(--theme-border-color)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-cordel-marron)] block">Orga Concert</span>
                <span className="font-semibold text-[var(--color-cordel-encre)]">{contacts.referentOrgaNom}</span>
              </div>
              {contacts.referentOrgaTel ? (
                <a href={`tel:${contacts.referentOrgaTel.replace(/\s+/g, '')}`} className="px-2.5 py-1 bg-[var(--color-cordel-vert)] text-white rounded font-bold hover:opacity-90 flex items-center gap-1">
                  📞 {contacts.referentOrgaTel}
                </a>
              ) : <span className="italic text-neutral-400">Sans tél</span>}
            </div>
          )}

          {referentGroupe && (
            <div className="flex items-center justify-between bg-white/70 p-2 rounded border border-[var(--theme-border-color)]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--color-cordel-marron)] block">Référent Groupe</span>
                <span className="font-semibold text-[var(--color-cordel-encre)]">{referentGroupe.prenom} {referentGroupe.nom}</span>
              </div>
              {referentGroupe.telephone ? (
                <a href={`tel:${referentGroupe.telephone.replace(/\s+/g, '')}`} className="px-2.5 py-1 bg-[var(--color-cordel-vert)] text-white rounded font-bold hover:opacity-90 flex items-center gap-1">
                  📞 {referentGroupe.telephone}
                </a>
              ) : <span className="italic text-neutral-400">Sans tél</span>}
            </div>
          )}

          {(contacts.referentsPupitres || []).length > 0 && (
            <div className="pt-2 border-t border-[var(--theme-border-color)]">
              <span className="text-[10px] uppercase font-bold text-[var(--color-cordel-marron)] block mb-1">Chefs de pupitre :</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {contacts.referentsPupitres.map((rp, i) => {
                  const u = allUsers.find(user => user.id === rp.memberId);
                  const tel = u?.telephone || u?.phone;
                  return (
                    <div key={i} className="flex items-center justify-between bg-white/50 p-1.5 rounded border border-[var(--theme-border-color)]">
                      <span className="font-medium text-[11px] truncate mr-1">
                        <strong>{rp.pupitre}</strong> : {u ? `${u.prenom} ${u.nom[0]}.` : '-'}
                      </span>
                      {tel && (
                        <a href={`tel:${tel.replace(/\s+/g, '')}`} className="text-[11px] font-bold text-[var(--color-cordel-vert)] hover:underline whitespace-nowrap">
                          {tel}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bloc Parcours / Scène */}
      <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
        <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 flex items-center justify-between uppercase text-xs tracking-wider">
          <span>{event.formatJeu === 'deambulation' ? '🗺️ Parcours Déambulation' : event.formatJeu === 'mixte' ? '🗺️ / 📐 Déambulation & Scène' : '📐 Scène & Plateforme'}</span>
          {parcours.urlFichierParcours && (
            <a href={parcours.urlFichierParcours} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[var(--color-cordel-ocre)] hover:underline flex items-center gap-1">
              🗺️ Ouvrir le plan (PDF)
            </a>
          )}
        </h3>
        {hasParcours ? (
          <div className="space-y-1.5 text-xs">
            {parcours.pointDepart && <div><span className="font-medium text-[var(--color-cordel-marron)]">Départ :</span> <strong>{parcours.pointDepart}</strong></div>}
            {parcours.itineraire && (
              <div>
                <span className="font-medium text-[var(--color-cordel-marron)]">Itinéraire :</span>
                <p className="mt-0.5 p-2 bg-white/70 rounded border border-[var(--theme-border-color)] whitespace-pre-wrap">{parcours.itineraire}</p>
              </div>
            )}
            {parcours.pointArrivee && <div><span className="font-medium text-[var(--color-cordel-marron)]">Arrivée :</span> <strong>{parcours.pointArrivee}</strong></div>}
            {parcours.ravitaillementEau && <div><span className="font-medium text-[var(--color-cordel-marron)]">Ravitaillement eau :</span> <strong>{parcours.ravitaillementEau}</strong></div>}
          </div>
        ) : (
          <p className="text-xs italic text-neutral-500">Pas de parcours spécifique renseigné. Référé aux balances et régie sur site.</p>
        )}
      </div>

          {/* Bloc Hébergement (si renseigné) */}
      {hasHebergement && (
        <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
          <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 uppercase text-xs tracking-wider">🏨 Hébergement</h3>
          <div className="space-y-1 text-xs">
            {hebergement.type && <div><span className="font-medium text-[var(--color-cordel-marron)]">Type :</span> <strong>{hebergement.type}</strong></div>}
            {hebergement.adresse && <div><span className="font-medium text-[var(--color-cordel-marron)]">Adresse :</span> <strong>{hebergement.adresse}</strong></div>}
            {hebergement.codeAcces && <div><span className="font-medium text-[var(--color-cordel-marron)]">Codes / Clés :</span> <strong>{hebergement.codeAcces}</strong></div>}
            {hebergement.repartitionChambres && (
              <div className="mt-1">
                <span className="font-medium text-[var(--color-cordel-marron)]">Répartition des chambres :</span>
                <p className="mt-0.5 p-2 bg-white/70 rounded border border-[var(--theme-border-color)] whitespace-pre-wrap">{hebergement.repartitionChambres}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bloc Convois & Covoiturage */}
      <div className="bg-[var(--color-cordel-papier-card)] p-3 rounded-lg border border-[var(--theme-border-color)]">
        <h3 className="font-bold text-[var(--color-cordel-encre)] mb-2 uppercase text-xs tracking-wider">
          🚗 Convois ({voitures.length} véhicule{voitures.length > 1 ? 's' : ''})
        </h3>
        {voitures.length === 0 ? (
          <p className="text-xs italic text-neutral-500">Aucun convoi configuré dans le covoiturage.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {voitures.map((v, i) => (
              <div key={i} className="p-2 bg-white/70 rounded border border-[var(--theme-border-color)]">
                <div className="font-bold text-[var(--color-cordel-encre)]">
                  Auto #{i + 1} • {v.chauffeurNom}
                  <span className="text-[10px] font-normal text-neutral-500 ml-1">({(v.passengers || []).filter(p => p.isPassenger).length + 1} pers.)</span>
                </div>
                <div className="text-[11px] text-neutral-600 truncate mt-0.5">
                  Passagers : {(v.passengers || []).filter(p => p.isPassenger).map(p => p.name).join(', ') || 'aucun'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bloc Matériel & Checklist dynamique (avec statut des trousses régie) */}
      <RoadbookKitsChecklist
        event={event}
        logistique={logistique}
        presentsByInstrument={presentsByInstrument}
      />
    </div>
  );
}
