import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useCollectiveKits, calculateKitStatus } from '../../hooks/useCollectiveKits';
import KitDetailModal from './KitDetailModal';

const TYPE_ICONS = {
  maquillage: '💄',
  secours: '🩹',
  outils_live: '🔧',
  autre: '🧰'
};

/**
 * Gestionnaire des mallettes et trousses collectives régie (Pôle Logistique).
 * Affiche les cartes d'équipement, leur état de santé et permet le pointage rapide.
 *
 * @param {Object} props
 * @param {string} props.groupId - Identifiant de l'association
 * @param {Object} props.user - Utilisateur connecté
 * @param {Object} props.profileData - Profil du membre
 */
export default function CollectiveKitsManager({ groupId, user, profileData }) {
  const { kits, loading, addKit, updateKit, initDefaultKits } = useCollectiveKits(groupId);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKitNom, setNewKitNom] = useState('');
  const [newKitType, setNewKitType] = useState('autre');
  const [newKitEmplacement, setNewKitEmplacement] = useState('');

  const handleCreateKit = async (e) => {
    e.preventDefault();
    if (!newKitNom.trim()) return;
    await addKit({
      nom: newKitNom.trim(),
      type: newKitType,
      emplacement: newKitEmplacement.trim() || 'Régie',
      items: [],
      notes: ''
    });
    setNewKitNom('');
    setNewKitEmplacement('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* En-tête du pôle kits régie */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-cordel-master-dark/15 pb-3">
        <div>
          <h3 className="text-sm uppercase font-black tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🧰</span>
            <span>Mallettes Collectives &amp; Trousses Régie</span>
          </h3>
          <p className="text-[11px] text-cordel-master-dark/80 mt-0.5">
            Suivi des consommables de scène (maquillage, secours/bouchons, outillage live) et vérification avant départ.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {kits.length === 0 && (
            <button
              type="button"
              onClick={initDefaultKits}
              className="text-[10px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2.5 py-1.5 rounded shadow-xs"
            >
              ⚡ Initialiser les 3 kits régie types
            </button>
          )}
          <CordelButton variant="vert" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Fermer' : '+ Nouveau Kit'}
          </CordelButton>
        </div>
      </div>

      {/* Formulaire de création rapide */}
      {showAddForm && (
        <form onSubmit={handleCreateKit} className="p-3 bg-[var(--color-cordel-papier-card,#f5efe6)] rounded-lg border border-[var(--theme-border-color,#181716)] flex flex-wrap gap-2 items-center text-xs">
          <input
            type="text"
            placeholder="Nom du kit (ex: Trousse Câbles & Piles)"
            value={newKitNom}
            onChange={(e) => setNewKitNom(e.target.value)}
            required
            className="theme-input text-xs py-1 px-2 rounded flex-1 min-w-[200px]"
          />
          <select
            value={newKitType}
            onChange={(e) => setNewKitType(e.target.value)}
            className="theme-input text-xs py-1 px-2 rounded"
          >
            <option value="maquillage">💄 Maquillage</option>
            <option value="secours">🩹 Secours &amp; Bouchons</option>
            <option value="outils_live">🔧 Outillage Live</option>
            <option value="autre">🧰 Autre Matériel</option>
          </select>
          <input
            type="text"
            placeholder="Emplacement (ex: Armoire Régie)"
            value={newKitEmplacement}
            onChange={(e) => setNewKitEmplacement(e.target.value)}
            className="theme-input text-xs py-1 px-2 rounded flex-1 min-w-[150px]"
          />
          <CordelButton type="submit" variant="ocre">Créer</CordelButton>
        </form>
      )}

      {/* Grille des cartes de kits */}
      {loading ? (
        <p className="text-xs italic text-neutral-500 py-6 text-center">Chargement des mallettes régie...</p>
      ) : kits.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={false} className="py-6 px-4 text-center">
          <span className="text-3xl block mb-2">🧰</span>
          <p className="text-xs font-bold text-neutral-700">Aucune mallette ou trousse collective enregistrée.</p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Cliquez sur « Initialiser les 3 kits régie types » pour créer instantanément les trousses de maquillage, secours et outillage.
          </p>
        </CordelCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {kits.map((kit) => {
            const health = calculateKitStatus(kit);
            const icon = TYPE_ICONS[kit.type] || '🧰';
            const badgeClasses = {
              green: 'bg-emerald-100 text-emerald-900 border-emerald-400',
              orange: 'bg-amber-100 text-amber-900 border-amber-400',
              red: 'bg-red-100 text-red-900 border-red-400 animate-pulse'
            }[health.color] || 'bg-neutral-100 text-neutral-800 border-neutral-300';

            return (
              <div
                key={kit.id}
                onClick={() => setSelectedKit(kit)}
                className="border-2 border-encre-noire rounded-[6px_10px_8px_12px] bg-[var(--color-cordel-papier,#fdfbf7)] shadow-[2px_2px_0px_0px_#181716] p-3 text-left hover:brightness-98 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 border-b border-dashed border-encre-noire/15 pb-1.5 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-lg">{icon}</span>
                      <strong className="text-xs text-cordel-wood truncate">{kit.nom}</strong>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${badgeClasses}`}>
                      {health.color === 'green' ? '✅ ' : health.color === 'red' ? '🚨 ' : '⚠️ '}
                      {health.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-encre-noire/85 mb-3">
                    <div>
                      <span className="font-semibold text-neutral-500">📍 Emplacement :</span> {kit.emplacement || 'Non renseigné'}
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-500">📦 Contenu :</span> {(kit.items || []).length} article{(kit.items || []).length > 1 ? 's' : ''}
                    </div>
                    {kit.derniereVerification && (
                      <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-200">
                        Dernier contrôle : {new Date(kit.derniereVerification).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                        {kit.verifieParNom ? ` (${kit.verifieParNom})` : ''}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <span className="text-[10px] font-bold text-[var(--color-cordel-ocre,#c05621)] hover:underline flex items-center gap-1">
                    <span>Vérifier / Modifier</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'inventaire détaillé du kit */}
      {selectedKit && (
        <KitDetailModal
          isOpen={Boolean(selectedKit)}
          onClose={() => setSelectedKit(null)}
          kit={selectedKit}
          onUpdateKit={updateKit}
          currentUser={profileData || user}
        />
      )}
    </div>
  );
}
