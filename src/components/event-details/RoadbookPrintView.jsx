import React from 'react';
import RoadbookCommissionsPrintSection from './RoadbookCommissionsPrintSection';
import { useTranslation } from '../LanguageContext';

/**
 * Vue imprimable A4 de la feuille de route du concert / événement (Bloc 1 & 2).
 * Optimisée pour une page papier A4 avec contrastes élevés et zéro fond d'encre lourd.
 */
export default function RoadbookPrintView({
  event = {},
  allUsers = [],
  presentsByInstrument = {},
  commissions = []
}) {
  const { t } = useTranslation();
  const parcours = event.parcours || {};
  const hebergement = event.hebergement || {};
  const logistique = event.logistiqueDepart || {};
  const contacts = event.contactsJourJ || {};
  const referentGroupe = (allUsers || []).find((u) => u.id === contacts.referentGroupeId);
  const voitures = event.covoiturage?.voitures || [];
  const hasParcours = Boolean(parcours.pointDepart || parcours.itineraire || parcours.pointArrivee);
  const hasHebergement = Boolean(hebergement.type || hebergement.adresse);

  // Malles régie sélectionnées pour la sortie
  const selectedMalles = Array.isArray(event.logistiqueMalles) && event.logistiqueMalles.length > 0
    ? event.logistiqueMalles
    : [
        logistique.maquillageRequis && 'Mallette Maquillage',
        logistique.trousseSecoursBouchons && 'Trousse secours & bouchons',
        logistique.reserveBaguettes && 'Réserve baguettes / mailloches',
        ...(Array.isArray(event.mallesSpecifiques) ? event.mallesSpecifiques : [])
      ].filter(Boolean);

  return (
    <div className="roadbook-print-root bg-white text-black p-4 font-sans text-[10.5px] leading-tight">
      <style>{`@media print { @page { size: A4 portrait; margin: 8mm; } body { background: white !important; color: black !important; } .roadbook-no-print { display: none !important; } .roadbook-print-root { padding: 0 !important; width: 100% !important; } a { text-decoration: none !important; color: black !important; } }`}</style>
      {/* En-tête principal */}
      <div className="border-b-2 border-black pb-2 mb-2 flex justify-between items-start">
        <div>
          <span className="text-[9px] uppercase tracking-wider font-bold block text-neutral-600">
            {t('agenda.roadbookTitle') || 'Feuille de Route'} • {event.type || 'Concert / Prestation'}
          </span>
          <h1 className="text-lg font-black tracking-tight text-black m-0 uppercase">{event.titre || 'Événement'}</h1>
          <div className="text-[11px] font-bold mt-0.5">
            📅 {event.date ? new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            {event.lieu ? ` • 📍 ${event.lieu}` : ''}
          </div>
        </div>
        <div className="text-right border border-black p-1.5 rounded text-[9px] font-bold">
          <div>{t('agenda.meetingPoint') || 'RDV Local'} : <strong>{event.horaireCovoiturage || 'Non spécifié'}</strong></div>
          <div>{t('agenda.schedule') || 'Jeu / Balances'} : <strong>{event.horairesPassages || 'Selon orga'}</strong></div>
        </div>
      </div>

      {/* Grille 2 Colonnes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Colonne Gauche : Contacts, Convois & Hébergement */}
        <div className="flex flex-col gap-2.5">
          <div className="border border-black p-2 rounded">
            <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">📞 {t('agenda.keyContacts') || 'Contacts Clés Jour J'}</h2>
            <div className="space-y-1">
              {contacts.referentOrgaNom && <div>{t('agenda.orgContact') || 'Orga'} : <strong>{contacts.referentOrgaNom}</strong> {contacts.referentOrgaTel && `(${contacts.referentOrgaTel})`}</div>}
              {referentGroupe && <div>{t('agenda.refContact') || 'Référent Groupe'} : <strong>{referentGroupe.prenom} {referentGroupe.nom}</strong> {referentGroupe.telephone && `(${referentGroupe.telephone})`}</div>}
              {(contacts.referentsPupitres || []).length > 0 && (
                <div className="pt-1 border-t border-dotted border-neutral-400 mt-1">
                  <span className="font-bold text-[9px] block">Chefs de pupitre :</span>
                  <div className="grid grid-cols-2 gap-x-1 text-[9px]">
                    {contacts.referentsPupitres.map((rp, i) => {
                      const u = allUsers.find(user => user.id === rp.memberId);
                      return <div key={i} className="truncate">• {rp.pupitre} : {u ? `${u.prenom} ${u.nom}` : '-'} {u?.telephone ? `(${u.telephone})` : ''}</div>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bloc Convois & Véhicules */}
          <div className="border border-black p-2 rounded">
            <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">
              🚗 Convois ({voitures.length} véhicule{voitures.length > 1 ? 's' : ''})
            </h2>
            {voitures.length === 0 ? (
              <div className="italic text-neutral-500 text-[9px]">Aucun véhicule configuré dans le covoiturage.</div>
            ) : (
              <div className="space-y-1.5">
                {voitures.map((v, i) => (
                  <div key={i} className="text-[9px] border-b border-dotted border-neutral-300 pb-1 last:border-none">
                    <span className="font-black">Auto #{i + 1} - {v.chauffeurNom}</span>
                    <span className="text-neutral-600 ml-1">({(v.passengers || []).filter(p => p.isPassenger).length + 1} pers.)</span>
                    <div className="text-neutral-700 truncate">
                      Passagers : {(v.passengers || []).filter(p => p.isPassenger).map(p => p.name).join(', ') || 'aucun'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bloc Hébergement (si renseigné) */}
          {hasHebergement && (
            <div className="border border-black p-2 rounded">
              <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">🏨 {t('agenda.accommodation') || 'Hébergement'}</h2>
              {hebergement.type && <div>Type : <strong>{hebergement.type}</strong></div>}
              {hebergement.adresse && <div>Adresse : <strong>{hebergement.adresse}</strong></div>}
              {hebergement.codeAcces && <div>Codes / Clés : <strong>{hebergement.codeAcces}</strong></div>}
              {hebergement.repartitionChambres && (
                <div className="text-[9px] text-neutral-700 mt-1 whitespace-pre-wrap">{hebergement.repartitionChambres}</div>
              )}
            </div>
          )}
        </div>

        {/* Colonne Droite : Parcours/Scène, Matériel & Dress code */}
        <div className="flex flex-col gap-2.5">
          {/* Bloc Parcours / Scène */}
          <div className="border border-black p-2 rounded">
            <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">
              {event.formatJeu === 'deambulation' ? '🗺️ Parcours Déambulation' : event.formatJeu === 'mixte' ? '🗺️ / 📐 Déambulation & Scène' : '📐 Scène & Plateforme'}
            </h2>
            {hasParcours ? (
              <div className="space-y-1 text-[9.5px]">
                {parcours.pointDepart && <div>{t('agenda.departure') || 'Départ'} : <strong>{parcours.pointDepart}</strong></div>}
                {parcours.itineraire && <div>Itinéraire : <strong>{parcours.itineraire}</strong></div>}
                {parcours.pointArrivee && <div>Arrivée : <strong>{parcours.pointArrivee}</strong></div>}
                {parcours.ravitaillementEau && <div>Eau / Ravitaillement : <strong>{parcours.ravitaillementEau}</strong></div>}
                {parcours.urlFichierParcours && (
                  <div className="text-[8.5px] font-mono break-all text-neutral-600 mt-1">Plan : {parcours.urlFichierParcours}</div>
                )}
              </div>
            ) : (
              <div className="text-[9.5px]">
                <div>{t('agenda.location') || 'Lieu'} : <strong>{event.lieu || 'Non spécifié'}</strong></div>
                <div>{t('agenda.schedule') || 'Passages / Balances'} : <strong>{event.horairesPassages || 'Selon régie'}</strong></div>
              </div>
            )}
          </div>

          {/* Bloc Matériel & Checklist */}
          <div className="border border-black p-2 rounded">
            <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">
              🎒 {t('agenda.logisticsChecklist') || 'Matériel & Checklist Logistique'}
            </h2>
            {/* Décompte des fûts */}
            <div className="mb-1.5">
              <span className="font-bold text-[9px] block">Effectifs / Instruments présents :</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {Object.entries(presentsByInstrument).map(([inst, members]) => (
                  <span key={inst} className="border border-black px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                    {inst} : {members.length}
                  </span>
                ))}
              </div>
            </div>

            {/* Checklist des malles régie sélectionnées avec icône 🧰 */}
            <div className="border-t border-dotted border-neutral-400 pt-1 text-[9px] space-y-0.5">
              {selectedMalles.length > 0 ? (
                selectedMalles.map((malle, idx) => (
                  <div key={idx}>[ X ] 🧰 {malle}</div>
                ))
              ) : (
                <div className="italic text-neutral-500">[ ] Aucune malle spécifique requise</div>
              )}
            </div>
          </div>

          {/* Bloc Tenue & Dress code */}
          {event.tenueRequise && (
            <div className="border border-black p-2 rounded">
              <h2 className="text-[10px] font-black uppercase border-b border-black pb-1 mb-1">👕 Tenue &amp; Dress Code</h2>
              <div className="text-[9.5px] font-bold text-neutral-800">{event.tenueRequise}</div>
            </div>
          )}
        </div>
      </div>

      {/* Section Postes Bénévoles & Régie issus des Commissions */}
      {commissions.length > 0 && (
        <RoadbookCommissionsPrintSection
          commissions={commissions}
          allUsers={allUsers}
        />
      )}

      {/* Pied de page A4 */}
      <div className="border-t border-neutral-400 mt-3 pt-1 text-center text-[8px] text-neutral-500 flex justify-between">
        <span>O Girador • {t('agenda.roadbookTitle') || 'Feuille de route officielle'} générée le {new Date().toLocaleDateString('fr-FR')}</span>
        <span>Document interne de concert</span>
      </div>
    </div>
  );
}
