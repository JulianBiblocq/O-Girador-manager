import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import XiloAvatar from '../XiloAvatar';

export default function CostumeSizesTable({ allUsers = [], profileData = {} }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  // Access check: only admins, mestres, super-admins, or logistics/wardrobe managers can view sizes
  const isAuthorized = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.isSystemAdmin === true || 
    profileData?.hasAccessLogistique === true || 
    profileData?.hasAccessVestiaire === true;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col gap-4 text-left select-none w-full max-w-3xl mx-auto mt-4">
        <CordelCard variant="default" useExtremeBorder={true} className="p-8">
          <h2 className="text-sm font-black text-red-700 uppercase tracking-widest">
            🚨 ACCÈS REFUSÉ
          </h2>
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            Vous n'avez pas l'autorisation d'accéder au tableau des tailles et mensurations du Vestiaire.
          </p>
        </CordelCard>
      </div>
    );
  }

  // Filter users belonging to this association
  const associationUsers = allUsers.filter(u => u.groupId === profileData.groupId);

  // Compute summary stats
  const tshirtsCounts = { S: 0, M: 0, L: 0, XL: 0, XXL: 0, "Non renseigné": 0 };
  const pantsCounts = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, "Non renseigné": 0 };

  associationUsers.forEach(u => {
    const tshirt = u.tailleTshirt;
    if (tshirt && tshirtsCounts[tshirt] !== undefined) {
      tshirtsCounts[tshirt]++;
    } else {
      tshirtsCounts["Non renseigné"]++;
    }

    const pant = u.taillePantalon;
    if (pant && pantsCounts[pant] !== undefined) {
      pantsCounts[pant]++;
    } else {
      pantsCounts["Non renseigné"]++;
    }
  });

  // Filter list by search term
  const filteredUsers = associationUsers.filter(u => {
    const term = searchTerm.toLowerCase();
    const fullName = `${u.prenom || ''} ${u.nom || ''}`.toLowerCase();
    const inst = (u.instrument || '').toLowerCase();
    return fullName.includes(term) || inst.includes(term);
  });

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-5xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 gap-2">
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
          👔 Tableau des Tailles / Vestiaire
        </h2>
        <span className="text-[10px] uppercase font-black text-cordel-master-dark bg-cordel-bg border border-encre-noire px-2 py-0.5 rounded">
          {associationUsers.length} Membre{associationUsers.length > 1 ? 's' : ''} au total
        </span>
      </div>

      {/* Summary statistics panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* T-Shirt Stats */}
        <CordelCard variant="default" useExtremeBorder={true} className="py-3 px-4">
          <span className="text-[10px] uppercase font-black text-cordel-wood block mb-2">
            👕 Synthèse des Tailles Hauts / T-Shirts
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(tshirtsCounts).map(([size, count]) => (
              count > 0 && (
                <div key={size} className="bg-amber-50/50 border border-encre-noire/10 px-2 py-1 rounded flex gap-1.5 items-center">
                  <span className="font-extrabold text-cordel-wood">{size} :</span>
                  <span className="font-black bg-white/70 px-1.5 py-0.5 rounded border border-encre-noire/5">{count}</span>
                </div>
              )
            ))}
          </div>
        </CordelCard>

        {/* Pants Stats */}
        <CordelCard variant="default" useExtremeBorder={true} className="py-3 px-4">
          <span className="text-[10px] uppercase font-black text-cordel-wood block mb-2">
            👖 Synthèse des Tailles Bas / Pantalons
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(pantsCounts).map(([size, count]) => (
              count > 0 && (
                <div key={size} className="bg-amber-50/50 border border-encre-noire/10 px-2 py-1 rounded flex gap-1.5 items-center">
                  <span className="font-extrabold text-cordel-wood">{size} :</span>
                  <span className="font-black bg-white/70 px-1.5 py-0.5 rounded border border-encre-noire/5">{count}</span>
                </div>
              )
            ))}
          </div>
        </CordelCard>
      </div>

      {/* Search Bar */}
      <div className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-2.5 rounded border border-dashed border-encre-noire/15 gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom, prénom ou instrument..."
          className="theme-input text-xs font-bold py-1.5 px-3 bg-cordel-bg-light flex-1"
        />
      </div>

      {/* Table view */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold leading-normal border-collapse">
            <thead>
              <tr className="bg-cordel-bg border-b border-encre-noire text-[9px] uppercase font-black text-cordel-master-dark tracking-wider select-none">
                <th className="py-2.5 px-4">Membre</th>
                <th className="py-2.5 px-4">Pupitre</th>
                <th className="py-2.5 px-4 text-center">Taille T-Shirt</th>
                <th className="py-2.5 px-4 text-center">Taille Pantalon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-encre-noire/10">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center italic opacity-60">
                    Aucun membre trouvé correspondant à la recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/20 transition-colors">
                    <td className="py-2.5 px-4 flex items-center gap-2.5 font-bold">
                      <XiloAvatar src={u.photoURL} name={`${u.prenom} ${u.nom}`} size={24} className="border border-encre-noire/10" />
                      <span>{u.prenom} {u.nom}</span>
                    </td>
                    <td className="py-2.5 px-4 italic text-cordel-wood/80">{u.instrument || "Autre"}</td>
                    <td className="py-2.5 px-4 text-center font-black">
                      {u.tailleTshirt ? (
                        <span className="bg-amber-100/50 border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-[10px]">
                          {u.tailleTshirt}
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-40 font-normal italic">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-center font-black">
                      {u.taillePantalon ? (
                        <span className="bg-orange-100/50 border border-orange-300 text-orange-900 px-2 py-0.5 rounded text-[10px]">
                          {u.taillePantalon}
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-40 font-normal italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CordelCard>
    </div>
  );
}
