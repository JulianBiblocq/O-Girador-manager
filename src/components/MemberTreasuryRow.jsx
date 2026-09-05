import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import XiloAvatar from './XiloAvatar';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';

function MemberTreasuryRow({
  member,
  optionsCotisation,
  baseAdhesionAmount,
  cautionData,
  onUpdateCaution
}) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showCautionPopover, setShowCautionPopover] = useState(false);
  const [referenceInputs, setReferenceInputs] = useState({});
  const dropdownRef = useRef(null);
  const cautionPopoverRef = useRef(null);

  // Fermeture des popups en cas de clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptionsDropdown(false);
      }
      if (cautionPopoverRef.current && !cautionPopoverRef.current.contains(event.target)) {
        setShowCautionPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fullName = `${member.prenom || ''} ${member.nom || ''}`;
  const currentStatus = member.paymentStatus || 'unpaid';
  const hasBaseAdhesion = member.adhesionBase !== false; // Par défaut vrai
  const selectedOptionIds = member.selectedOptions || [];

  // Calcul du montant total des cotisations
  const baseAmount = hasBaseAdhesion ? baseAdhesionAmount : 0;
  const optionsAmount = selectedOptionIds.reduce((sum, optId) => {
    const opt = optionsCotisation.find(o => o.id === optId);
    return sum + (opt ? parseFloat(opt.montant) || 0 : 0);
  }, 0);
  const totalDue = baseAmount + optionsAmount;

  // Options choisies
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
      console.error("MemberTreasuryRow - Erreur modification adhésion de base :", err);
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
      console.error("MemberTreasuryRow - Erreur modification options :", err);
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
      console.error("MemberTreasuryRow - Erreur modification statut paiement :", err);
      alert((t('widgetTreasury.errorStatusUpdate') || "Impossible de modifier le statut de paiement : ") + (err.message || err));
    }
  };

  // Traitement d'action rapide sur une caution
  const handleToggleInstrumentCaution = async (inst, newStatut) => {
    if (!onUpdateCaution) return;
    try {
      const currentCaution = inst.statut === newStatut ? {} : inst;
      const refValue = referenceInputs[inst.id] !== undefined ? referenceInputs[inst.id] : (inst.reference || '');
      await onUpdateCaution(inst.id, {
        montant: inst.montant,
        statut: newStatut,
        typeGarantie: inst.typeGarantie || 'cheque',
        reference: refValue.trim(),
        dateReception: newStatut === 'recue' ? new Date().toISOString() : null,
        dateRestitution: newStatut === 'restituee' ? new Date().toISOString() : null
      });
    } catch (err) {
      alert("Erreur lors de la mise à jour de la caution : " + (err.message || err));
    }
  };

  const caution = cautionData || { statutGlobal: 'na', totalCaution: 0, countInstruments: 0, instruments: [] };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-3 bg-cordel-bg border border-encre-noire/15 p-3 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
      
      {/* 1. Informations Membre (Col span 3) */}
      <div className="md:col-span-3 flex items-center gap-2.5">
        <XiloAvatar src={member.photoURL} name={fullName} size={36} />
        <div className="flex flex-col text-left min-w-0">
          <span className="font-extrabold text-xs text-encre-noire truncate">
            {fullName}
          </span>
          <span className="text-[8px] font-semibold text-cordel-master-dark/65 truncate select-all">
            {member.email}
          </span>
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-dashed mt-0.5 self-start select-none">
            {tRole(member.role || 'membre', member.genre)}
          </span>
        </div>
      </div>

      {/* 2. Adhésion de Base (Col span 1) */}
      <div className="md:col-span-1 flex items-center md:justify-center gap-1.5 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.tableBaseAdhesion')} :</span>
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasBaseAdhesion}
            onChange={handleToggleBaseAdhesion}
            className="theme-checkbox h-3.5 w-3.5 text-cordel-wood focus:ring-cordel-wood border-encre-noire rounded cursor-pointer"
          />
          <span className={`text-[9px] font-bold ${hasBaseAdhesion ? 'text-[#2d6a4f] font-extrabold' : 'text-neutral-400'}`}>
            {hasBaseAdhesion ? `${baseAdhesionAmount}€` : (t('widgetTreasury.disabledStatus') || 'Non')}
          </span>
        </label>
      </div>

      {/* 3. Formules / Options choisies (Col span 2) */}
      <div className="md:col-span-2 flex flex-col items-start gap-1 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.options')} :</span>
          <button
            type="button"
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className="text-[8px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2 py-0.5 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center gap-1"
          >
            ⚙️ {t('widgetTreasury.options')} {activeOptions.length > 0 ? `(${activeOptions.length})` : ''} ▾
          </button>
        </div>

        {/* Tags des options actives */}
        <div className="flex flex-wrap gap-1 mt-0.5">
          {activeOptions.length === 0 ? (
            <span className="text-[7.5px] italic text-neutral-400">{t('widgetTreasury.noOption')}</span>
          ) : (
            activeOptions.map(opt => (
              <span 
                key={opt.id} 
                className="inline-block text-[7px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-1 py-0.5 rounded-[3px] border border-encre-noire/15 shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,0.1)] truncate max-w-[75px]"
                title={opt.nom}
              >
                {opt.nom}
              </span>
            ))
          )}
        </div>

        {/* Menu déroulant de sélection des options */}
        {showOptionsDropdown && (
          <div className="absolute top-7 left-0 z-20 w-52 bg-cordel-bg-light border-2 border-encre-noire p-2.5 rounded-[6px_4px_8px_5px] shadow-[3px_3px_0px_0px_#181716] flex flex-col gap-1.5 text-left max-h-48 overflow-y-auto">
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

      {/* 4. Total Dû (Col span 2) */}
      <div className="md:col-span-2 flex items-center md:justify-center gap-2 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.tableTotalDue')} :</span>
        <span className="text-xs font-black text-cordel-wood bg-[#fbf5e6] dark:bg-black/25 px-2 py-0.5 border border-dashed border-cordel-wood/30 rounded">
          {totalDue} €
        </span>
      </div>

      {/* 5. Caution Instrument (Col span 2) */}
      <div className="md:col-span-2 flex flex-col items-center justify-center gap-1 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 relative" ref={cautionPopoverRef}>
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">Caution :</span>
          {caution.statutGlobal === 'na' ? (
            <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 italic px-1.5 py-0.5">
              N/A
            </span>
          ) : caution.statutGlobal === 'recue' ? (
            <button
              type="button"
              onClick={() => setShowCautionPopover(!showCautionPopover)}
              className="text-[8px] font-black uppercase tracking-wider bg-[#2d6a4f]/15 text-[#2d6a4f] border border-[#2d6a4f]/40 hover:bg-[#2d6a4f]/25 px-2 py-0.5 rounded-[4px_5px_3px_4px] cursor-pointer transition-all flex items-center gap-1 select-none"
              title="Cliquer pour voir ou modifier la caution"
            >
              ✓ Reçue ({caution.totalCaution} €)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCautionPopover(!showCautionPopover)}
              className="text-[8px] font-black uppercase tracking-wider bg-[#c05621]/15 text-[#c05621] border border-[#c05621]/40 hover:bg-[#c05621]/25 px-2 py-0.5 rounded-[4px_5px_3px_4px] cursor-pointer transition-all flex items-center gap-1 select-none"
              title="Cliquer pour valider la réception du chèque de caution"
            >
              ⏳ En attente ({caution.totalCaution} €)
            </button>
          )}
        </div>

        {/* Popover de détail et d'action rapide sur la caution */}
        {showCautionPopover && caution.instruments.length > 0 && (
          <div className="absolute top-7 left-1/2 -translate-x-1/2 z-30 w-64 bg-cordel-bg-light border-2 border-encre-noire p-3 rounded-[6px_4px_8px_5px] shadow-[3px_3px_0px_0px_#181716] flex flex-col gap-2.5 text-left">
            <div className="flex justify-between items-center border-b border-dashed border-encre-noire/15 pb-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-cordel-wood">
                🛡️ Caution matériel ({caution.instruments.length})
              </span>
              <button
                type="button"
                onClick={() => setShowCautionPopover(false)}
                className="text-xs font-black text-encre-noire hover:text-cordel-wood"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {caution.instruments.map((inst) => {
                const isRecue = inst.statut === 'recue';
                return (
                  <div key={inst.id} className="p-2 bg-white/50 dark:bg-black/20 rounded border border-dashed border-encre-noire/15 flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-[9px] text-encre-noire truncate max-w-[140px]">
                        {inst.nom}
                      </span>
                      <span className="text-[9px] font-black text-cordel-wood">
                        {inst.montant} €
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-cordel-master-dark/70">
                      <span>Type : <strong>{inst.typeGarantie || 'Chèque'}</strong></span>
                      <span className={`font-black ${isRecue ? 'text-[#2d6a4f]' : 'text-[#c05621]'}`}>
                        {isRecue ? '✓ Reçue' : '⏳ En attente'}
                      </span>
                    </div>

                    {/* Champ de référence (N° de chèque) */}
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="text"
                        placeholder="N° de chèque ou réf..."
                        value={referenceInputs[inst.id] !== undefined ? referenceInputs[inst.id] : (inst.reference || '')}
                        onChange={(e) => setReferenceInputs({ ...referenceInputs, [inst.id]: e.target.value })}
                        className="theme-input text-[8px] py-0.5 px-1.5 bg-cordel-bg"
                      />
                    </div>

                    {/* Bouton d'action rapide */}
                    <div className="flex justify-end gap-1 mt-1">
                      {isRecue ? (
                        <button
                          type="button"
                          onClick={() => handleToggleInstrumentCaution(inst, 'non_recue')}
                          className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-[#8b2a1a] hover:bg-red-200 border border-[#8b2a1a]/30"
                        >
                          Annuler réception
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleInstrumentCaution(inst, 'recue')}
                          className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded bg-[#2d6a4f] text-white hover:bg-[#24543f] shadow-[1px_1px_0px_0px_#181716]"
                        >
                          ✓ Valider chèque reçu
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 6. Statut de Paiement de la Cotisation (Col span 2) */}
      <div className="md:col-span-2 flex items-center md:justify-end gap-2 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 justify-between w-full md:w-auto">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('widgetTreasury.statusLabel')} :</span>
        <select
          value={currentStatus}
          onChange={(e) => handleUpdateStatus(e.target.value)}
          className={`theme-input text-[8.5px] font-black py-1 px-2 bg-cordel-bg-light cursor-pointer rounded-[4px_6px_3px_5px] border-2 ${
            currentStatus === 'paid' 
              ? 'border-green-600/40 text-[#2d6a4f]' 
              : currentStatus === 'partial' 
                ? 'border-amber-600/40 text-[#c05621]' 
                : currentStatus === 'exempted'
                  ? 'border-blue-600/40 text-blue-700 dark:text-blue-400'
                  : 'border-red-600/40 text-[#8b2a1a]'
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

export default React.memo(MemberTreasuryRow);
