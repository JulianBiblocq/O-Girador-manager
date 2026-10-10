import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useTranslation } from '../../LanguageContext';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';
import { XiloCaixa } from '../../XiloIcons';
import useConfirm from '../../../hooks/useConfirm';
import { getUniverseDefaultInstruments } from '../../../constants/universeDefaults';

export default function AccessoriesKitsBlock({ formData = {}, handleChange, saving, t: propT, groupId, supplies = [] }) {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const confirm = useConfirm();
  const [newKitPupitre, setNewKitPupitre] = useState('');
  const [selectedSupplyIds, setSelectedSupplyIds] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSavingLocal, setIsSavingLocal] = useState(false);
  
  // Nouveaux filtres pour la liste des fournitures
  const [searchSupply, setSearchSupply] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');

  const safeFormData = formData || {};
  const kits = safeFormData.logisticsKits || [];

  // Calcul des pupitres / instruments disponibles
  const { instrumentsDisponibles = [], linkedInstruments = [], universeId } = safeFormData;
  const effectiveInstrumentsDisponibles = Array.isArray(instrumentsDisponibles) && instrumentsDisponibles.length > 0
    ? instrumentsDisponibles
    : getUniverseDefaultInstruments(universeId || safeFormData.universe || 'maracatu');

  const rawPupitres = [
    'Mestre',
    ...linkedInstruments.map(g => {
      const instrumentsArray = g.instruments || (Array.isArray(g) ? g : [g.inst1, g.inst2]);
      return g.name ? g.name.trim() : instrumentsArray.join(' + ');
    }).filter(Boolean),
    ...effectiveInstrumentsDisponibles.filter(inst => {
      const isInLinked = linkedInstruments.some(g => {
        const instrumentsArray = g.instruments || (Array.isArray(g) ? g : [g.inst1, g.inst2]);
        return instrumentsArray.includes(inst);
      });
      return !isInLinked;
    })
  ];

  const seen = new Set();
  const allPupitres = rawPupitres.filter(p => {
    const lower = p.toLowerCase().trim();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  // Catégories dynamiques issues des supplies
  const allCategories = useMemo(() => {
    const cats = new Set(supplies.map(s => s.categorie).filter(Boolean));
    return ['Toutes', ...Array.from(cats).sort()];
  }, [supplies]);

  // Filtrage des supplies
  const filteredSupplies = useMemo(() => {
    return supplies.filter(s => {
      if (categoryFilter !== 'Toutes' && s.categorie !== categoryFilter) return false;
      if (searchSupply && !s.nom.toLowerCase().includes(searchSupply.toLowerCase())) return false;
      return true;
    });
  }, [supplies, categoryFilter, searchSupply]);

  const saveToDb = async (newKits) => {
    handleChange('logisticsKits', newKits);
    if (!groupId) return;
    setIsSavingLocal(true);
    try {
      await updateDoc(doc(db, 'associations', groupId), { logisticsKits: newKits });
    } catch (err) {
      console.error("Error auto-saving logisticsKits:", err);
      alert(t('logistics.errorSaveKitAuto'));
    } finally {
      setIsSavingLocal(false);
    }
  };

  const handleAddOrEditKit = () => {
    if (!newKitPupitre.trim() || selectedSupplyIds.length === 0) return;
    
    // Convertir les identifiants en objets { supplyId, name } pour la sauvegarde
    const accessoriesArray = selectedSupplyIds.map(id => {
      const sup = supplies.find(s => s.id === id);
      return { supplyId: id, name: sup ? sup.nom : 'Inconnu' };
    });

    const newKit = {
      pupitre: newKitPupitre.trim(),
      accessories: accessoriesArray
    };

    let newKits;
    if (editingIndex !== null) {
      newKits = [...kits];
      newKits[editingIndex] = newKit;
    } else {
      newKits = [...kits, newKit];
    }
    
    saveToDb(newKits);
    
    setNewKitPupitre('');
    setSelectedSupplyIds([]);
    setEditingIndex(null);
  };

  const handleRemoveKit = async (indexToRemove) => {
    const ok = await confirm({
      title: "Supprimer le kit ?",
      message: "Voulez-vous vraiment supprimer ce kit logistique ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      variant: "danger"
    });
    if (ok) {
      const newKits = kits.filter((_, idx) => idx !== indexToRemove);
      saveToDb(newKits);
      if (editingIndex === indexToRemove) {
        setEditingIndex(null);
        setNewKitPupitre('');
        setSelectedSupplyIds([]);
      }
    }
  };

  const handleEditKit = (index) => {
    setEditingIndex(index);
    setNewKitPupitre(kits[index].pupitre);
    
    // Gérer à la fois l'ancien format (texte) et le nouveau (objets {supplyId, name})
    const currentAcc = kits[index].accessories || [];
    const ids = currentAcc.map(acc => {
      if (typeof acc === 'object' && acc.supplyId) return acc.supplyId;
      // Pour les anciens kits (texte libre), on essaie de retrouver l'ID correspondant
      const found = supplies.find(s => s.nom === acc);
      return found ? found.id : null;
    }).filter(Boolean);
    
    setSelectedSupplyIds(ids);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setNewKitPupitre('');
    setSelectedSupplyIds([]);
  };

  const toggleSupplySelection = (id) => {
    if (selectedSupplyIds.includes(id)) {
      setSelectedSupplyIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedSupplyIds(prev => [...prev, id]);
    }
  };

  const isUIBusy = saving || isSavingLocal;

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-cordel-bg text-left select-none">
      <h3 className="text-sm font-extrabold tracking-wider text-cordel-wood uppercase flex items-center mb-1">
        <XiloCaixa size={16} className="inline mr-2" /> {t('logistics.accessoriesKitsTitle')}
        {isSavingLocal && <span className="ml-2 text-[9px] font-bold text-amber-600 animate-pulse bg-amber-100 px-2 py-0.5 rounded">{t('logistics.autoSavingBadge')}</span>}
      </h3>
      <p className="text-[10px] text-cordel-master-dark opacity-80 mb-4 leading-relaxed font-semibold">
        {t('logistics.accessoriesKitsExplanation')}
      </p>

      <div className="flex flex-col gap-3">
        {kits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {kits.map((kit, index) => (
              <div key={index} className={`flex flex-col gap-2 p-3 border border-dashed rounded transition-colors ${editingIndex === index ? 'bg-cordel-wood/10 border-cordel-wood/50 shadow-xs' : 'bg-white/50 border-cordel-master-dark/30'}`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black text-cordel-wood">{kit.pupitre}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEditKit(index)}
                      disabled={isUIBusy}
                      className="text-[10px] text-blue-700 hover:text-blue-900 font-bold cursor-pointer disabled:opacity-50 px-1"
                      title={t('logistics.editThisKitTitle')}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveKit(index)}
                      disabled={isUIBusy}
                      className="text-[10px] text-red-600 hover:text-red-800 font-bold ml-1 cursor-pointer disabled:opacity-50 px-1"
                      title={t('logistics.removeThisKitTitle')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {kit.accessories.map((acc, accIdx) => {
                    const nomAcc = typeof acc === 'object' ? acc.name : acc;
                    return (
                      <span key={accIdx} className="bg-cordel-bg-light px-2 py-0.5 rounded text-[9px] font-bold text-encre-noire border border-encre-noire/20 shadow-sm">
                        {nomAcc}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-cordel-bg-light/50 rounded border border-dashed border-cordel-master-dark/20 text-xs text-cordel-master-dark opacity-70 italic font-bold">
            {t('logistics.noAccessoriesKitConfigured')}
          </div>
        )}

        <div className={`mt-2 pt-3 border-t border-dashed flex flex-col items-start gap-3 transition-colors ${editingIndex !== null ? 'border-cordel-wood/30 bg-cordel-wood/5 p-2 rounded' : 'border-cordel-master-dark/20'}`}>
          <div className="w-full sm:w-1/2 flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('logistics.pupitreMainInstrumentField')}
            </label>
            <select
              value={newKitPupitre}
              onChange={(e) => setNewKitPupitre(e.target.value)}
              className="theme-input text-xs py-1.5 px-2 bg-white/80 cursor-pointer"
              disabled={isUIBusy}
            >
              <option value="">{t('logistics.chooseAnInstrumentPrompt')}</option>
              {allPupitres.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="w-full flex flex-col gap-2 mt-2">
            <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('logistics.selectKitSuppliesField')}
            </label>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="theme-input text-xs py-1.5 px-2 bg-white/80 cursor-pointer flex-1"
                disabled={isUIBusy}
              >
                {allCategories.map(c => (
                  <option key={c} value={c}>{c === 'Toutes' ? t('logistics.filterAllCategories') : c}</option>
                ))}
              </select>
              
              <input
                type="text"
                value={searchSupply}
                onChange={(e) => setSearchSupply(e.target.value)}
                placeholder={t('logistics.searchSuppliesPlaceholder')}
                className="theme-input text-xs py-1.5 px-2 bg-white/80 flex-[2]"
                disabled={isUIBusy}
              />
            </div>

            <div className="flex flex-wrap gap-2 p-3 mt-1 border-2 border-dashed border-[var(--cordel-border)] rounded-[4px_8px_3px_6px] bg-[var(--cordel-master-bg)] max-h-48 overflow-y-auto">
              {filteredSupplies.length === 0 ? (
                <span className="text-[10px] italic text-cordel-master-dark">{t('logistics.noSupplyFound')}</span>
              ) : (
                filteredSupplies.map(sup => {
                  const isSelected = selectedSupplyIds.includes(sup.id);
                  return (
                    <label 
                      key={sup.id} 
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px_8px_3px_6px] border border-[var(--cordel-border)] cursor-pointer select-none text-[10px] font-bold transition-all ${
                        isSelected 
                          ? 'bg-[var(--cordel-wood)] text-white shadow-sm' 
                          : 'bg-[var(--cordel-bg)] text-[var(--cordel-text)] opacity-80 hover:opacity-100'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSupplySelection(sup.id)}
                        disabled={isUIBusy}
                        className="hidden"
                      />
                      <span>{sup.nom}</span>
                      <span className="opacity-70 text-[8px]">({sup.quantiteStock} {t('logistics.inStockSuffix')}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full justify-end mt-2">
            {editingIndex !== null && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={isUIBusy}
                className="text-[10px] font-black uppercase py-1.5 px-3 h-[30px] text-cordel-master-dark hover:text-encre-noire transition-colors cursor-pointer"
              >
                {t('logistics.btnCancel')}
              </button>
            )}
            <CordelButton
              type="button"
              variant={editingIndex !== null ? "ocre" : "default"}
              disabled={isUIBusy || !newKitPupitre.trim() || selectedSupplyIds.length === 0}
              onClick={handleAddOrEditKit}
              className="text-[10px] font-black uppercase py-1.5 px-4 h-[30px]"
            >
              {editingIndex !== null ? "✓ Enregistrer modification" : t('logistics.btnAddKit')}
            </CordelButton>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}
