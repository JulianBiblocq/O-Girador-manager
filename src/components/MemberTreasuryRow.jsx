import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import XiloAvatar from './XiloAvatar';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';

export default function MemberTreasuryRow({ member, optionsCotisation, baseAdhesionAmount }) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptionsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fullName = `${member.prenom || ''} ${member.nom || ''}`;
  const currentStatus = member.paymentStatus || 'unpaid';
  const hasBaseAdhesion = member.adhesionBase !== false; // defaults to true
  const selectedOptionIds = member.selectedOptions || [];

  // Calculate total due
  const baseAmount = hasBaseAdhesion ? baseAdhesionAmount : 0;
  const optionsAmount = selectedOptionIds.reduce((sum, optId) => {
    const opt = optionsCotisation.find(o => o.id === optId);
    return sum + (opt ? parseFloat(opt.montant) || 0 : 0);
  }, 0);
  const totalDue = baseAmount + optionsAmount;

  // Find active option data for tags
  const activeOptions = selectedOptionIds
    .map(optId => optionsCotisation.find(o => o.id === optId))
    .filter(Boolean);

  const handleToggleBaseAdhesion = async () => {
    try {
      const userRef = doc(db, 'users', member.id);
      await updateDoc(userRef, {
        adhesionBase: !hasBaseAdhesion
      });
    } catch (err) {
      console.error("MemberTreasuryRow - Error toggling base adhesion:", err);
      alert((t('widgetTreasury.errorBaseUpdate') || "Erreur lors de la modification de l'adhésion de base : ") + (err.message || err));
    }
  };

  const handleToggleOption = async (optionId, isChecked) => {
    try {
      let updatedOptions;
      if (isChecked) {
        updatedOptions = [...selectedOptionIds, optionId];
      } else {
        updatedOptions = selectedOptionIds.filter(id => id !== optionId);
      }
      const userRef = doc(db, 'users', member.id);
      await updateDoc(userRef, {
        selectedOptions: updatedOptions
      });
    } catch (err) {
      console.error("MemberTreasuryRow - Error updating options:", err);
      alert((t('widgetTreasury.errorOptionsUpdate') || "Erreur lors de la mise à jour des options : ") + (err.message || err));
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const userRef = doc(db, 'users', member.id);
      await updateDoc(userRef, {
        paymentStatus: newStatus
      });
    } catch (err) {
      console.error("MemberTreasuryRow - Error updating payment status:", err);
      alert((t('widgetTreasury.errorStatusUpdate') || "Impossible de modifier le statut de paiement : ") + (err.message || err));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-cordel-bg border border-encre-noire/15 p-4 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
      
      {/* 1. Member Info (Col span 3) */}
      <div className="md:col-span-3 flex items-center gap-3">
        <XiloAvatar src={member.photoURL} name={fullName} size={38} />
        <div className="flex flex-col text-left min-w-0">
          <span className="font-extrabold text-xs text-encre-noire truncate">
            {fullName}
          </span>
          <span className="text-[8px] font-semibold text-cordel-master-dark/65 truncate select-all">
            {member.email}
          </span>
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-dashed mt-1 self-start select-none">
            {tRole(member.role || 'membre', member.genre)}
          </span>
        </div>
      </div>

      {/* 2. Base Adhesion (Col span 2) */}
      <div className="md:col-span-2 flex items-center md:justify-center gap-2 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.tableBaseAdhesion')} :</span>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasBaseAdhesion}
            onChange={handleToggleBaseAdhesion}
            className="theme-checkbox h-4 w-4 text-cordel-wood focus:ring-cordel-wood border-encre-noire rounded cursor-pointer"
          />
          <span className={`text-[10px] font-bold ${hasBaseAdhesion ? 'text-green-700 dark:text-green-400 font-extrabold' : 'text-neutral-500'}`}>
            {hasBaseAdhesion ? `${baseAdhesionAmount} €` : (t('widgetTreasury.disabledStatus') || 'Désactivé')}
          </span>
        </label>
      </div>

      {/* 3. Chosen Options (Col span 3) */}
      <div className="md:col-span-3 flex flex-col items-start gap-1 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.options')} :</span>
          <button
            type="button"
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center gap-1"
          >
            ⚙️ {t('widgetTreasury.options')} {activeOptions.length > 0 ? `(${activeOptions.length})` : ''} ▾
          </button>
        </div>

        {/* Selected Options Tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {activeOptions.length === 0 ? (
            <span className="text-[8px] italic text-neutral-400">{t('widgetTreasury.noOption')}</span>
          ) : (
            activeOptions.map(opt => (
              <span 
                key={opt.id} 
                className="inline-block text-[8px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-1.5 py-0.5 rounded-[3px] border border-encre-noire/15 shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,0.1)] truncate max-w-[80px]"
                title={opt.nom}
              >
                {opt.nom}
              </span>
            ))
          )}
        </div>

        {/* Options Custom Dropdown Popup */}
        {showOptionsDropdown && (
          <div className="absolute top-8 left-0 z-20 w-52 bg-cordel-bg-light border-2 border-encre-noire p-2.5 rounded-[6px_4px_8px_5px] shadow-[3px_3px_0px_0px_#181716] flex flex-col gap-1.5 text-left max-h-48 overflow-y-auto">
            <span className="text-[8px] font-black uppercase tracking-wider text-cordel-wood border-b border-dashed border-encre-noire/10 pb-1 mb-1">
              {t('widgetTreasury.selectOptions')}
            </span>
            {optionsCotisation.length === 0 ? (
              <span className="text-[9px] italic text-neutral-400 p-1">{t('widgetTreasury.noOptionAvailable')}</span>
            ) : (
              optionsCotisation.map(opt => {
                const isSelected = selectedOptionIds.includes(opt.id);
                return (
                  <label 
                    key={opt.id} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 p-1 rounded select-none text-[9px] font-bold text-encre-noire"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleOption(opt.id, e.target.checked)}
                      className="rounded border-encre-noire text-cordel-wood focus:ring-cordel-wood w-3 h-3 cursor-pointer"
                    />
                    <span className="truncate">{opt.nom} ({opt.montant} €)</span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Total Due (Col span 2) */}
      <div className="md:col-span-2 flex items-center md:justify-center gap-2 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.tableTotalDue')} :</span>
        <span className="text-sm font-black text-cordel-wood bg-[#fbf5e6] dark:bg-black/25 px-2 py-0.5 border border-dashed border-cordel-wood/30 rounded">
          {totalDue} €
        </span>
      </div>

      {/* 5. Payment Status (Col span 2) */}
      <div className="md:col-span-2 flex items-center md:justify-end gap-2 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 justify-between w-full md:w-auto">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.statusLabel')} :</span>
        <select
          value={currentStatus}
          onChange={(e) => handleUpdateStatus(e.target.value)}
          className={`theme-input text-[9px] font-black py-1 px-2.5 bg-cordel-bg-light cursor-pointer rounded-[4px_6px_3px_5px] border-2 ${
            currentStatus === 'paid' 
              ? 'border-green-600/40 text-green-700 dark:text-green-400' 
              : currentStatus === 'partial' 
                ? 'border-amber-600/40 text-amber-700 dark:text-amber-400' 
                : currentStatus === 'exempted'
                  ? 'border-blue-600/40 text-blue-700 dark:text-blue-400'
                  : 'border-red-600/40 text-red-700 dark:text-red-400'
          }`}
        >
          <option value="unpaid">{t('widgetTreasury.statusUnpaid') || "Non payé"}</option>
          <option value="partial">{t('widgetTreasury.statusPartial') || "Partiel"}</option>
          <option value="paid">{t('widgetTreasury.statusPaid') || "À jour"}</option>
          <option value="exempted">{t('widgetTreasury.statusExempted') || "Exonéré"}</option>
        </select>
      </div>

    </div>
  );
}
