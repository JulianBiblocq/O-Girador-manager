import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useCollectiveKits, calculateKitStatus } from '../../hooks/useCollectiveKits';
import KitDetailModal from './KitDetailModal';
import useConfirm from '../../hooks/useConfirm';
import { useTranslation } from '../LanguageContext';

const TYPE_ICONS = { maquillage: '💄', secours: '🩹', outils_live: '🔧', autre: '🧰' };
const SUGGESTED_KITS = [
  { label: '💄 Malle Maquillage', nom: 'Malle Maquillage', type: 'maquillage' },
  { label: '👗 Malle Robes & Costumes', nom: 'Malle Robes & Costumes', type: 'autre' },
  { label: '🎉 Malle Confettis', nom: 'Malle Confettis', type: 'autre' },
  { label: '🩹 Pharmacie & Bouchons', nom: 'Pharmacie & Bouchons', type: 'secours' },
  { label: '🔧 Caisse Outillage Live', nom: 'Caisse Outillage Live', type: 'outils_live' }
];

export default function CollectiveKitsManager({ groupId, user, profileData }) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { kits, loading, addKit, updateKit, deleteKit, initDefaultKits } = useCollectiveKits(groupId);
  const [selectedKit, setSelectedKit] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKitNom, setNewKitNom] = useState('');
  const [newKitType, setNewKitType] = useState('autre');
  const [newKitEmplacement, setNewKitEmplacement] = useState('');

  const handleCreateKit = async (e) => {
    if (e) e.preventDefault();
    if (!newKitNom.trim()) return;
    await addKit({ nom: newKitNom.trim(), type: newKitType, emplacement: newKitEmplacement.trim() || 'Régie', items: [], notes: '' });
    setNewKitNom('');
    setNewKitEmplacement('');
    setShowAddForm(false);
  };

  const handleDeleteKit = async (kitId, kitNom, e) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Supprimer la malle ?",
      message: `Supprimer définitivement la malle « ${kitNom} » ?`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger"
    });
    if (ok) await deleteKit(kitId);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-dashed border-cordel-master-dark/15 pb-3">
        <div>
          <h3 className="text-sm uppercase font-black tracking-wider text-cordel-wood flex items-center gap-2">
            <span>🧰</span>
            <span>{t('logistics.collectiveKitsTitle')}</span>
          </h3>
          <p className="text-[11px] text-cordel-master-dark/80 mt-0.5">
            {t('logistics.collectiveKitsDesc')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {kits.length === 0 && (
            <button type="button" onClick={initDefaultKits} className="text-[10px] font-black uppercase bg-neutral-200 hover:bg-neutral-300 text-encre-noire border border-encre-noire px-2.5 py-1.5 rounded shadow-xs cursor-pointer">
              ⚡ {t('logistics.btnInitDefaultKits')}
            </button>
          )}
          <div data-tour="kits-add-btn">
            <CordelButton variant="vert" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? (t('common.close') || 'Fermer') : t('logistics.btnNewKitCase')}
            </CordelButton>
          </div>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateKit} className="p-3 bg-[#e7d5c1] dark:bg-[#252525] rounded-lg border border-encre-noire/20 flex flex-col gap-2 text-xs">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">Modèles rapides :</span>
            {SUGGESTED_KITS.map((p) => (
              <button key={p.nom} type="button" onClick={() => { setNewKitNom(p.nom); setNewKitType(p.type); }} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/90 dark:bg-stone-700 text-encre-noire border border-encre-noire/20 hover:border-encre-noire cursor-pointer">
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input type="text" placeholder="Nom de la malle..." value={newKitNom} onChange={(e) => setNewKitNom(e.target.value)} required className="theme-input text-xs py-1 px-2 rounded flex-1 min-w-[180px]" />
            <select value={newKitType} onChange={(e) => setNewKitType(e.target.value)} className="theme-input text-xs py-1 px-2 rounded bg-white dark:bg-stone-800">
              <option value="maquillage">💄 Maquillage</option>
              <option value="secours">🩹 Secours &amp; Bouchons</option>
              <option value="outils_live">🔧 Outillage Live</option>
              <option value="autre">🧰 Autre Malle / Matériel</option>
            </select>
            <input type="text" placeholder="Emplacement..." value={newKitEmplacement} onChange={(e) => setNewKitEmplacement(e.target.value)} className="theme-input text-xs py-1 px-2 rounded flex-1 min-w-[110px]" />
            <CordelButton type="submit" variant="ocre">{t('documents.btnCreateInline', 'Créer')}</CordelButton>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs italic text-neutral-500 py-6 text-center">Chargement des mallettes régie...</p>
      ) : kits.length === 0 ? (
        <CordelCard variant="default" useExtremeBorder={false} className="py-6 px-4 text-center">
          <span className="text-3xl block mb-2">🧰</span>
          <p className="text-xs font-bold text-neutral-700">
            {t('logistics.emptyCollectiveKitsNotice')}
          </p>
        </CordelCard>
      ) : (
        <div data-tour="kits-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {kits.map((kit, kitIdx) => {
            const health = calculateKitStatus(kit);
            const icon = TYPE_ICONS[kit.type] || '🧰';
            const badgeClasses = { green: 'bg-emerald-100 text-emerald-900 border-emerald-400', orange: 'bg-amber-100 text-amber-900 border-amber-400', red: 'bg-red-100 text-red-900 border-red-400 animate-pulse' }[health.color] || 'bg-neutral-100 text-neutral-800 border-neutral-300';

            return (
              <div key={kit.id} onClick={() => setSelectedKit(kit)} className="border-2 border-encre-noire rounded-[6px_10px_8px_12px] bg-[#fdfbf7] dark:bg-[#252525] shadow-[2px_2px_0px_0px_#181716] p-3 text-left hover:brightness-98 cursor-pointer transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-1.5 border-b border-dashed border-encre-noire/15 pb-1.5 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-lg">{icon}</span>
                      <strong className="text-xs text-cordel-wood truncate">{kit.nom}</strong>
                    </div>
                    <span {...(kitIdx === 0 ? { 'data-tour': 'kits-status-badge' } : {})} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${badgeClasses}`}>
                      {health.color === 'green' ? '✅ ' : health.color === 'red' ? '🚨 ' : '⚠️ '}{health.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-encre-noire/85 mb-3">
                    <div><span className="font-semibold text-neutral-500">📍 Emplacement :</span> {kit.emplacement || 'Non renseigné'}</div>
                    <div><span className="font-semibold text-neutral-500">📦 Contenu :</span> {(kit.items || []).length} article{(kit.items || []).length > 1 ? 's' : ''}</div>
                    {kit.derniereVerification && (
                      <div className="text-[10px] text-neutral-500 pt-1 border-t border-neutral-200">
                        Contrôle : {new Date(kit.derniereVerification).toLocaleDateString([], { day: '2-digit', month: 'short' })}{kit.verifieParNom ? ` (${kit.verifieParNom})` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-dashed border-encre-noire/10">
                  <button type="button" onClick={(e) => handleDeleteKit(kit.id, kit.nom, e)} className="text-[10px] font-bold text-red-600 hover:text-red-800 cursor-pointer p-0.5" title="Supprimer la malle">
                    🗑️
                  </button>
                  <span className="text-[10px] font-bold text-cordel-wood hover:underline flex items-center gap-1">
                    <span>Vérifier / Modifier</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedKit && (
        <KitDetailModal isOpen={Boolean(selectedKit)} onClose={() => setSelectedKit(null)} kit={selectedKit} onUpdateKit={updateKit} currentUser={profileData || user} />
      )}
    </div>
  );
}
