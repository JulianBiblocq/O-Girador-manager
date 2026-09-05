import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import CordelCard from '../../CordelCard';

/**
 * Composant : VehicleFleetSection
 * 
 * Affiche la vue « Parc de Véhicules de la Troupe » dans le pôle Logistique.
 * Permet aux responsables logistiques et organisateurs de visualiser
 * la capacité totale de transport de l'association (places assises et volume d'instruments).
 * 
 * @param {Object} props Propriétés du composant
 * @param {string} props.groupId Identifiant de l'association
 */
export default function VehicleFleetSection({ groupId }) {
  const [vehiclesList, setVehiclesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  // Écoute en temps réel des utilisateurs motorisés du groupe
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const members = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtrer les adhérents ayant déclaré un véhicule
        const motorises = members.filter((m) => m.hasVehicle === true);
        setVehiclesList(motorises);
        setLoading(false);
      },
      (error) => {
        console.error("VehicleFleetSection - Erreur lors de l'écoute des adhérents :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Calcul des métriques globales de la flotte
  const totalVehicules = vehiclesList.length;
  const totalPlacesAssises = vehiclesList.reduce(
    (sum, v) => sum + (Number(v.defaultPassengerSeats) || 0),
    0
  );
  const totalCapaciteAlfaias = vehiclesList.reduce(
    (sum, v) => sum + (Number(v.defaultTrunkCapacity) || 0),
    0
  );
  const totalAttelages = vehiclesList.filter((v) => v.hasTowHitch === true).length;
  const totalBarresToit = vehiclesList.filter((v) => v.hasRoofBars === true).length;

  // Filtrage selon la saisie
  const filteredVehicles = vehiclesList.filter((v) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const fullName = `${v.prenom || ''} ${v.nom || ''}`.toLowerCase();
    const surnom = (v.surnom || '').toLowerCase();
    const type = (v.vehicleType || '').toLowerCase();
    return fullName.includes(q) || surnom.includes(q) || type.includes(q);
  });

  return (
    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🚐</span>
            <span>Parc de Véhicules de la Troupe</span>
          </h4>
          <p className="text-[10px] text-cordel-master-dark/75 mt-0.5">
            Capacités de transport déclarées par les adhérents sur leur profil membre.
          </p>
        </div>

        {/* Barre de recherche rapide */}
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Rechercher un membre ou un véhicule..."
          className="theme-input text-xs font-medium py-1 px-2.5 w-full sm:w-64 bg-cordel-bg-light"
        />
      </div>

      {/* Cartes d'indicateurs clés (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-cordel-bg-light p-2.5 rounded border border-encre-noire/15 flex flex-col items-center text-center shadow-xs">
          <span className="text-base">🚗</span>
          <span className="text-xs sm:text-sm font-black text-encre-noire mt-0.5">
            {loading ? "..." : totalVehicules}
          </span>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
            Véhicules
          </span>
        </div>

        <div className="bg-cordel-bg-light p-2.5 rounded border border-encre-noire/15 flex flex-col items-center text-center shadow-xs">
          <span className="text-base">👥</span>
          <span className="text-xs sm:text-sm font-black text-emerald-800 mt-0.5">
            {loading ? "..." : totalPlacesAssises}
          </span>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
            Places Passagers
          </span>
        </div>

        <div className="bg-cordel-bg-light p-2.5 rounded border border-encre-noire/15 flex flex-col items-center text-center shadow-xs">
          <span className="text-base">🥁</span>
          <span className="text-xs sm:text-sm font-black text-cordel-wood mt-0.5">
            {loading ? "..." : totalCapaciteAlfaias}
          </span>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
            Volume Alfaias
          </span>
        </div>

        <div className="bg-cordel-bg-light p-2.5 rounded border border-encre-noire/15 flex flex-col items-center text-center shadow-xs">
          <span className="text-base">🔗</span>
          <span className="text-xs sm:text-sm font-black text-amber-900 mt-0.5">
            {loading ? "..." : `${totalAttelages} att. / ${totalBarresToit} gal.`}
          </span>
          <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 tracking-wider">
            Équipements
          </span>
        </div>
      </div>

      {/* Liste détaillée des véhicules de la flotte */}
      {loading ? (
        <div className="p-4 text-center text-xs text-cordel-wood font-bold italic animate-pulse">
          ⏳ Chargement de la flotte de véhicules...
        </div>
      ) : vehiclesList.length === 0 ? (
        <div className="p-4 bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 rounded text-center text-xs text-cordel-master-dark/75 italic">
          Aucun adhérent n'a encore déclaré de véhicule utilisable pour l'association. Les membres peuvent renseigner leur véhicule dans leur espace « Profil ».
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-4 bg-cordel-bg-light/60 border border-dashed border-cordel-master-dark/20 rounded text-center text-xs text-cordel-master-dark/75 italic">
          Aucun véhicule ne correspond à votre recherche "{filterQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredVehicles.map((member) => {
            const fullName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Adhérent';
            return (
              <div
                key={member.id}
                className="bg-cordel-bg-light p-3 rounded border border-encre-noire/20 shadow-xs flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-1.5 mb-1.5">
                    <span className="font-extrabold text-xs text-encre-noire truncate pr-2">
                      👤 {fullName} {member.surnom ? <span className="opacity-75 font-normal">("{member.surnom}")</span> : null}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg px-2 py-0.5 rounded border border-encre-noire/15 shrink-0">
                      {member.vehicleType || 'Berline'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-encre-noire/90">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cordel-wood">👥 Places :</span>
                      <span>{member.defaultPassengerSeats !== undefined ? member.defaultPassengerSeats : 3}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-cordel-wood">🥁 Coffre :</span>
                      <span>~{member.defaultTrunkCapacity !== undefined ? member.defaultTrunkCapacity : 1} fûts</span>
                    </div>
                  </div>

                  {/* Badges d'équipements */}
                  {(member.hasRoofBars || member.hasTowHitch) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {member.hasRoofBars && (
                        <span className="text-[8.5px] font-bold bg-white/80 border border-encre-noire/20 px-1.5 py-0.5 rounded text-encre-noire">
                          📦 Galerie / Toit
                        </span>
                      )}
                      {member.hasTowHitch && (
                        <span className="text-[8.5px] font-bold bg-white/80 border border-encre-noire/20 px-1.5 py-0.5 rounded text-encre-noire">
                          🔗 Attelage remorque
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Coordonnées de contact si disponibles */}
                {member.telephone && (
                  <div className="text-[10px] text-cordel-master-dark/80 pt-1.5 border-t border-dashed border-cordel-master-dark/10 flex items-center justify-between">
                    <span className="font-semibold">📞 {member.telephone}</span>
                    <span className="text-[9px] italic opacity-60">Prêt pour convoi</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
