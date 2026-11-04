import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import { getInstrumentIconPath } from '../../utils/instrumentUtils';

/**
 * Sous-composant des 3 cartes d'instruments de l'adhérent (Personnels, Empruntés, Assignés au local).
 * Chaque section est pliable/dépliable au clic sur son en-tête et se replie par défaut si son compteur est à 0.
 */
export default function UserMaterielAccordionCards({
  personal = [],
  borrowed = [],
  localAssigned = [],
  allInventoryParts = [],
  onOpenReportModal,
  onOpenMovementModal,
  t
}) {
  const [openCards, setOpenCards] = useState(() => ({
    personal: personal.length > 0,
    borrowed: borrowed.length > 0,
    local: localAssigned.length > 0
  }));

  useEffect(() => {
    setOpenCards({ personal: personal.length > 0, borrowed: borrowed.length > 0, local: localAssigned.length > 0 });
  }, [personal.length, borrowed.length, localAssigned.length]);

  const toggleCard = (key) => setOpenCards((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderNomenclature = (inst) => {
    if (!Array.isArray(inst.nomenclature) || inst.nomenclature.length === 0) return null;
    const parts = inst.nomenclature.map((pid) => allInventoryParts.find((p) => p.id === pid)).filter(Boolean);
    if (parts.length === 0) return null;
    return (
      <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood">{t('logistics.partsNomenclatureDetail')}</span>
        {parts.map((part) => (
          <div key={part.id} className="flex justify-between items-center bg-white/40 px-2 py-1 rounded text-[9px] border border-cordel-master-dark/10">
            <span className="font-bold text-encre-noire truncate pr-2">{part.nom}</span>
            <span className={part.status === 'À réparer' ? 'text-red-600 font-bold shrink-0' : 'text-green-700 font-bold shrink-0'}>
              {part.status === 'À réparer' ? t('logistics.inRepair') : t('logistics.statusOk')}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderSimpleItem = (inst, subtitle) => (
    <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex flex-col gap-2 text-left">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
            <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">{subtitle}</span>
          </div>
        </div>
        <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[7px] shrink-0`}>
          {inst.etat}
        </span>
      </div>
      {renderNomenclature(inst)}
    </CordelCard>
  );

  return (
    <div className="flex flex-col gap-3.5 mt-1">
      {/* 1. Mes instruments personnels */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col gap-2.5 bg-cordel-bg">
        <button type="button" onClick={() => toggleCard('personal')} className="w-full font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between cursor-pointer select-none">
          <span>🎸 {t('userProfile.personalInsts')}</span>
          <span className="flex items-center gap-2">
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px]">{personal.length}</span>
            <span>{openCards.personal ? '▴' : '▾'}</span>
          </span>
        </button>
        {openCards.personal && (
          <div className="pt-2 border-t border-dashed border-cordel-master-dark/15">
            {personal.length === 0 ? <p className="text-xs italic text-cordel-master-dark/60 py-1">{t('userProfile.noPersonal')}</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{personal.map((inst) => renderSimpleItem(inst, inst.type))}</div>
            )}
          </div>
        )}
      </CordelCard>

      {/* 2. Matériel emprunté */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col gap-2.5 bg-cordel-bg">
        <button type="button" onClick={() => toggleCard('borrowed')} className="w-full font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between cursor-pointer select-none">
          <span>🎒 {t('userProfile.borrowedInsts')}</span>
          <span className="flex items-center gap-2">
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px]">{borrowed.length}</span>
            <span>{openCards.borrowed ? '▴' : '▾'}</span>
          </span>
        </button>
        {openCards.borrowed && (
          <div className="pt-2 border-t border-dashed border-cordel-master-dark/15">
            {borrowed.length === 0 ? <p className="text-xs italic text-cordel-master-dark/60 py-1">{t('userProfile.noBorrowed')}</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {borrowed.map((inst) => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex flex-col gap-2.5 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                          <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">{t('logistics.stockAssociation')}</span>
                        </div>
                      </div>
                      <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-dark'} text-[7px] shrink-0`}>{inst.etat}</span>
                    </div>
                    {inst.kit && <div className="text-[9px] italic text-cordel-wood bg-cordel-wood/5 p-1.5 rounded border-l-2 border-cordel-wood"><strong>{t('logistics.kitColon')}</strong> {inst.kit}</div>}
                    {renderNomenclature(inst)}
                    <div className="flex justify-end pt-1 gap-2 flex-wrap">
                      <button type="button" onClick={() => onOpenReportModal(inst)} className="text-[9px] font-bold uppercase tracking-wider text-red-600 border border-red-600/30 hover:bg-red-600/10 px-2 py-1 rounded cursor-pointer">{t('logistics.btnReportBreakage')}</button>
                      {inst.pendingMovement ? (
                        <span className="text-[9px] font-bold text-cordel-ocre bg-cordel-ocre/10 px-2 py-1 rounded border border-cordel-ocre/30">{t('logistics.waitingLogisticsValidation')}</span>
                      ) : (
                        <button type="button" onClick={() => onOpenMovementModal(inst)} className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood border border-cordel-wood/30 hover:bg-cordel-wood/10 px-2 py-1 rounded cursor-pointer">{t('logistics.btnDeclareMovement')}</button>
                      )}
                    </div>
                  </CordelCard>
                ))}
              </div>
            )}
          </div>
        )}
      </CordelCard>

      {/* 3. Mes instruments assignés au local */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3.5 flex flex-col gap-2.5 bg-cordel-bg">
        <button type="button" onClick={() => toggleCard('local')} className="w-full font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between cursor-pointer select-none">
          <span>🏠 {t('userProfile.localAssignedInsts')}</span>
          <span className="flex items-center gap-2">
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px]">{localAssigned.length}</span>
            <span>{openCards.local ? '▴' : '▾'}</span>
          </span>
        </button>
        {openCards.local && (
          <div className="pt-2 border-t border-dashed border-cordel-master-dark/15">
            {localAssigned.length === 0 ? <p className="text-xs italic text-cordel-master-dark/60 py-1">{t('userProfile.noLocal')}</p> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{localAssigned.map((inst) => renderSimpleItem(inst, t('logistics.locationAtLocal')))}</div>
            )}
          </div>
        )}
      </CordelCard>
    </div>
  );
}
