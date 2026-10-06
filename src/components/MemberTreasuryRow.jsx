import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import XiloAvatar from './XiloAvatar';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';
import { notifyMembersByTag } from '../utils/inAppNotificationService';

function MemberTreasuryRow({
  member,
  optionsCotisation,
  baseAdhesionAmount,
  cautionData,
  onUpdateCaution
}) {
  const { t, locale } = useTranslation();
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
  const hasBaseAdhesion = member.adhesionBase !== false; // Cochée si true ou non défini
  const numericBaseAdhesion = (typeof baseAdhesionAmount === 'number' && !isNaN(baseAdhesionAmount) && baseAdhesionAmount > 0)
    ? baseAdhesionAmount
    : (parseFloat(baseAdhesionAmount) || 10);
  const selectedOptionIds = Array.isArray(member.selectedOptions) ? member.selectedOptions : [];

  // Vérification si le règlement est échelonné (3x)
  const isEchelonne = Boolean(
    member.echelonne === true ||
    member.cotisation?.echelonne === true ||
    member.helloAssoLastPayment?.isInstallment === true
  );

  // Vérification de la source HelloAsso
  const isHelloAssoPaid = Boolean(
    member.modePaiement === 'helloasso' ||
    member.modeReglement === 'helloasso' ||
    member.cotisation?.modeReglement === 'helloasso' ||
    member.helloAssoLastPayment
  );

  // Résolution tolérante et chirurgicale des options HelloAsso (Percussions 135 €, Danse 90 €)
  const resolveOption = (optKey) => {
    if (!optKey) return null;
    const strKey = String(optKey).trim().toLowerCase();

    // 1. Recherche exacte dans optionsCotisation
    let found = optionsCotisation?.find(o => 
      o.id === optKey || 
      (o.nom && String(o.nom).trim().toLowerCase() === strKey) ||
      (o.label && String(o.label).trim().toLowerCase() === strKey)
    );
    if (found) {
      return {
        ...found,
        id: found.id || found.nom || found.label,
        nom: found.nom || found.label,
        montant: found.montant !== undefined ? found.montant : (found.amount ?? 0)
      };
    }

    // 2. Règle chirurgicale Percussions (135 € comptant / 45 € 3x)
    if (strKey.includes('percussion') || strKey.includes('alfaia') || strKey.includes('caixa')) {
      found = optionsCotisation?.find(o => 
        (o.id && String(o.id).toLowerCase().includes('percussion')) ||
        (o.nom && String(o.nom).toLowerCase().includes('percussion')) ||
        (o.label && String(o.label).toLowerCase().includes('percussion'))
      );
      if (found) {
        return {
          ...found,
          id: found.id || 'percussions',
          nom: found.nom || found.label || 'Percussions',
          montant: found.montant !== undefined ? found.montant : (found.amount ?? 135)
        };
      }
      return { id: 'percussions', nom: 'Percussions', montant: 135 };
    }

    // 3. Règle chirurgicale Danse (90 € comptant / 30 € 3x)
    if (strKey.includes('danse')) {
      found = optionsCotisation?.find(o => 
        (o.id && String(o.id).toLowerCase().includes('danse')) ||
        (o.nom && String(o.nom).toLowerCase().includes('danse')) ||
        (o.label && String(o.label).toLowerCase().includes('danse'))
      );
      if (found) {
        return {
          ...found,
          id: found.id || 'danse',
          nom: found.nom || found.label || 'Danse',
          montant: found.montant !== undefined ? found.montant : (found.amount ?? 90)
        };
      }
      return { id: 'danse', nom: 'Danse', montant: 90 };
    }

    return null;
  };

  const rawCotisationOptions = Array.isArray(member.cotisation?.options) 
    ? member.cotisation.options 
    : (typeof member.cotisation?.options === 'string' ? member.cotisation.options.split(',').map(s => s.trim()) : []);

  const effectiveOptionKeys = selectedOptionIds.length > 0 ? selectedOptionIds : rawCotisationOptions;

  // Déduplication canonique stricte : maximum 1 option Percussions et 1 option Danse
  const seenCategories = new Set();
  const activeOptions = [];
  for (const optKey of effectiveOptionKeys) {
    const resolved = resolveOption(optKey) || (typeof optKey === 'string' && optKey ? { id: optKey, nom: optKey, montant: 0 } : null);
    if (!resolved) continue;

    const lowerId = String(resolved.id || '').toLowerCase();
    const lowerNom = String(resolved.nom || '').toLowerCase();

    let category = lowerId;
    if (lowerId.includes('percussion') || lowerNom.includes('percussion') || lowerId.includes('alfaia') || lowerId.includes('caixa')) {
      category = 'percussions';
    } else if (lowerId.includes('danse') || lowerNom.includes('danse')) {
      category = 'danse';
    }

    if (!seenCategories.has(category)) {
      seenCategories.add(category);
      activeOptions.push(resolved);
    }
  }

  // Calcul dynamique de la somme due (Adhésion 10 € + Percussions 135 € = 145 € ; + Danse 90 € = 235 €)
  const baseAmount = hasBaseAdhesion ? numericBaseAdhesion : 0;
  const optionsAmount = activeOptions.reduce((sum, opt) => {
    return sum + (parseFloat(opt.montant) || 0);
  }, 0);
  const totalDue = baseAmount + optionsAmount;

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
      const targetOpt = optionsCotisation.find(o => o.id === optionId);
      const targetNom = targetOpt?.nom ? String(targetOpt.nom).trim().toLowerCase() : null;
      const isPercuTarget = optionId.toLowerCase().includes('percussion') || (targetNom && targetNom.includes('percussion'));
      const isDanseTarget = optionId.toLowerCase().includes('danse') || (targetNom && targetNom.includes('danse'));

      if (isChecked) {
        updatedOptions = Array.from(new Set([
          ...selectedOptionIds.filter(id => {
            if (id === optionId) return false;
            if (targetNom && String(id).trim().toLowerCase() === targetNom) return false;
            const strId = String(id).toLowerCase();
            if (isPercuTarget && (strId.includes('percussion') || strId.includes('alfaia') || strId.includes('caixa'))) return false;
            if (isDanseTarget && strId.includes('danse')) return false;
            return true;
          }),
          optionId
        ]));
      } else {
        updatedOptions = selectedOptionIds.filter(id => {
          if (id === optionId) return false;
          if (targetNom && String(id).trim().toLowerCase() === targetNom) return false;
          const strId = String(id).toLowerCase();
          if (isPercuTarget && (strId.includes('percussion') || strId.includes('alfaia') || strId.includes('caixa'))) return false;
          if (isDanseTarget && strId.includes('danse')) return false;
          return true;
        });
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

      // Notification interne pour les trésoriers si passage à 'paid'
      if (newStatus === 'paid' && currentStatus !== 'paid') {
        const userName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Un adhérent';
        notifyMembersByTag({
          groupId: member.groupId,
          tags: ['Trésorier', 'tresorier'],
          title: "💳 Cotisation réglée",
          message: `${userName} a réglé son adhésion`,
          targetUrl: "/app/treasury?tab=cotisations",
          icon: "💳"
        }).catch((notifErr) => console.warn("MemberTreasuryRow - Notification trésorier ignorée :", notifErr));
      }
    } catch (err) {
      console.error("MemberTreasuryRow - Erreur modification statut paiement :", err);
      alert((t('widgetTreasury.errorStatusUpdate') || "Impossible de modifier le statut de paiement : ") + (err.message || err));
    }
  };

  // Traitement d'action rapide sur une caution
  const handleToggleInstrumentCaution = async (inst, newStatut) => {
    if (!onUpdateCaution) return;
    try {
      const refValue = referenceInputs[inst.id] !== undefined 
        ? referenceInputs[inst.id] 
        : (inst.referencePiece || inst.reference || '');
      const typeGarantie = inst.type || inst.typeGarantie || 'cheque';

      await onUpdateCaution(inst.id, {
        montant: inst.montant,
        statut: newStatut,
        type: typeGarantie,
        typeGarantie: typeGarantie,
        referencePiece: refValue.trim(),
        reference: refValue.trim(),
        dateReception: newStatut === 'recue' ? new Date().toISOString() : null,
        dateRestitution: newStatut === 'restituee' ? new Date().toISOString() : null,
        encaisse: false
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
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('treasury.membershipFormula')} :</span>
        <label className="flex items-center gap-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasBaseAdhesion}
            onChange={handleToggleBaseAdhesion}
            className="theme-checkbox h-3.5 w-3.5 text-cordel-wood focus:ring-cordel-wood border-encre-noire rounded cursor-pointer"
          />
          <span className={`text-[9px] font-bold ${hasBaseAdhesion ? 'text-[var(--color-cordel-vert)] font-extrabold' : 'text-neutral-400'}`}>
            {hasBaseAdhesion ? `${numericBaseAdhesion}€` : (t('widgetTreasury.disabledStatus') || 'Non')}
          </span>
        </label>
      </div>

      {/* 3. Formules / Options choisies (Col span 2) */}
      <div className="md:col-span-2 flex flex-col items-start gap-1 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('treasury.membershipFormula')} :</span>
          <button
            type="button"
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className="text-[8px] font-black uppercase tracking-wider bg-cordel-bg-light border border-encre-noire px-2 py-0.5 rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center gap-1"
          >
            ⚙️ {t('widgetTreasury.options')} {activeOptions.length > 0 ? `(${activeOptions.length})` : ''} ▾
          </button>
        </div>

        {/* Badges des options actives avec code couleur sémantique Cordel */}
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          {activeOptions.length === 0 ? (
            <span className="text-[7.5px] italic text-neutral-400">{t('widgetTreasury.noOption')}</span>
          ) : (
            activeOptions.map(opt => {
              const optLower = (opt.nom || opt.id || '').toLowerCase();
              const isPercu = opt.id === 'percussions' || optLower.includes('percussion') || optLower.includes('alfaia') || optLower.includes('caixa');
              const isDanse = opt.id === 'danse' || optLower.includes('danse');

              let badgeClasses = "bg-cordel-wood text-cordel-bg-light border-encre-noire/15";
              if (isPercu) {
                // Badge ambré Percussions (Code Couleur Sémantique Cordel)
                badgeClasses = "bg-[var(--color-cordel-ocre,#c05621)] text-white border-amber-900/30";
              } else if (isDanse) {
                // Badge vert Danse (Code Couleur Sémantique Cordel)
                badgeClasses = "bg-[var(--color-cordel-vert,#2d6a4f)] text-white border-emerald-900/30";
              }

              return (
                <span 
                  key={opt.id} 
                  className={`inline-block text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[3px] border shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,0.1)] truncate max-w-[85px] ${badgeClasses}`}
                  title={`${opt.nom} (${opt.montant} €)`}
                >
                  {isPercu ? 'Percussions' : (isDanse ? 'Danse' : opt.nom)}
                </span>
              );
            })
          )}

          {/* Mention 3x si paiement échelonné */}
          {isEchelonne && (
            <span 
              className="inline-block text-[7px] font-black uppercase tracking-wider bg-[#8b2a1a] text-white px-1.5 py-0.5 rounded-[3px] border border-encre-noire/20 shadow-[0.5px_0.5px_0px_0px_rgba(0,0,0,0.1)]"
              title="Cotisation avec paiement échelonné en 3 fois"
            >
              3x
            </span>
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
              optionsCotisation.map((opt, optIdx) => {
                const optId = opt.id || opt.label || opt.nom || `opt_${optIdx}`;
                const optNom = opt.nom || opt.label || optId;
                const optMontant = opt.montant !== undefined ? opt.montant : (opt.amount ?? 0);
                const isSelected = selectedOptionIds.includes(optId) ||
                  selectedOptionIds.some(id => resolveOption(id)?.id === optId) ||
                  activeOptions.some(ao => ao.id === optId || ao.nom === optNom);
                return (
                  <label 
                    key={optId} 
                    className="flex items-center gap-2 cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 p-1 rounded select-none text-[9px] font-bold text-encre-noire"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleOption(optId, e.target.checked)}
                      className="rounded border-encre-noire text-cordel-wood focus:ring-cordel-wood w-3 h-3 cursor-pointer"
                    />
                    <span className="truncate">{optNom} ({optMontant} €)</span>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Total Dû (Col span 2) */}
      <div className="md:col-span-2 flex items-center md:justify-center gap-2 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0">
        <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('treasury.amountDue')} :</span>
        <span className="text-xs font-black text-cordel-wood bg-[#fbf5e6] dark:bg-black/25 px-2 py-0.5 border border-dashed border-cordel-wood/30 rounded">
          {totalDue} €
        </span>
      </div>

      {/* 5. Caution Instrument (Col span 2) */}
      <div className="md:col-span-2 flex flex-col items-center justify-center gap-1 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 relative" ref={cautionPopoverRef}>
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">
            {t('treasury.cautionInstrumentLabel') || "Caution"} :
          </span>
          {caution.statutGlobal === 'na' ? (
            <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 italic px-1.5 py-0.5">
              N/A
            </span>
          ) : caution.statutGlobal === 'recue' ? (
            <button
              type="button"
              onClick={() => setShowCautionPopover(!showCautionPopover)}
              className="text-[8px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)]/15 text-[var(--color-cordel-vert)] border border-[#2d6a4f]/40 hover:bg-[var(--color-cordel-vert)]/25 px-2 py-0.5 rounded-[4px_5px_3px_4px] cursor-pointer transition-all flex items-center gap-1 select-none"
              title="Cliquer pour voir ou modifier la caution"
            >
              ✓ Reçue ({caution.totalCaution} €)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCautionPopover(!showCautionPopover)}
              className="text-[8px] font-black uppercase tracking-wider bg-[var(--color-cordel-ocre)]/15 text-[var(--color-cordel-ocre)] border border-[#c05621]/40 hover:bg-[var(--color-cordel-ocre)]/25 px-2 py-0.5 rounded-[4px_5px_3px_4px] cursor-pointer transition-all flex items-center gap-1 select-none"
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
                      <span className={`font-black ${isRecue ? 'text-[var(--color-cordel-vert)]' : 'text-[var(--color-cordel-ocre)]'}`}>
                        {isRecue ? '✓ Reçue' : '⏳ En attente'}
                      </span>
                    </div>

                    {/* Champ de référence (N° de chèque) */}
                    <div className="flex flex-col gap-0.5">
                      <input
                        type="text"
                        placeholder="N° de chèque ou réf..."
                        value={referenceInputs[inst.id] !== undefined ? referenceInputs[inst.id] : (inst.referencePiece || inst.reference || '')}
                        onChange={(e) => setReferenceInputs({ ...referenceInputs, [inst.id]: e.target.value })}
                        className="theme-input text-[8px] py-0.5 px-1.5 bg-cordel-bg"
                      />
                    </div>

                    {/* Bouton d'action rapide */}
                    <div className="flex justify-end gap-1 mt-1">
                      {isRecue ? (
                        <button
                          type="button"
                          onClick={() => handleToggleInstrumentCaution(inst, 'en_attente')}
                          className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-[var(--theme-primary)] hover:bg-red-200 border border-[var(--theme-primary)]/30"
                        >
                          Annuler réception
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleInstrumentCaution(inst, 'recue')}
                          className="text-[7.5px] font-black uppercase px-2 py-0.5 rounded bg-[var(--color-cordel-vert)] text-white hover:bg-[#24543f] shadow-[1px_1px_0px_0px_#181716]"
                        >
                          ✓ {t('treasury.btnMarkAsPaid')}
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
      <div className="md:col-span-2 flex flex-col items-end justify-center gap-1 border-t md:border-t-0 border-dashed border-cordel-master-dark/10 pt-2 md:pt-0 justify-between w-full md:w-auto">
        <div className="flex items-center justify-between md:justify-end gap-2 w-full">
          <span className="md:hidden text-[9px] font-extrabold uppercase tracking-wide text-cordel-master-dark">{t('treasury.paymentStatus')} :</span>
          <select
            value={currentStatus}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className={`theme-input text-[8.5px] font-black py-1 px-2 bg-cordel-bg-light cursor-pointer rounded-[4px_6px_3px_5px] border-2 ${
              currentStatus === 'paid' 
                ? 'border-[var(--color-cordel-vert)] text-[var(--color-cordel-vert)]' 
                : (currentStatus === 'partial' || currentStatus === 'en_cours') 
                  ? 'border-amber-600/40 text-[var(--color-cordel-ocre)]' 
                  : currentStatus === 'exempted'
                    ? 'border-blue-600/40 text-blue-700 dark:text-blue-400'
                    : 'border-red-600/40 text-[var(--theme-primary)]'
            }`}
          >
            <option value="unpaid">{t('treasury.statusPending')}</option>
            <option value="partial">{t('treasury.remainderToPay')}</option>
            <option value="en_cours">⏳ {t('treasury.statusPending')} (3x)</option>
            <option value="paid">
              {isHelloAssoPaid ? `✓ ${t('treasury.statusPaidOnline') || 'Réglé (HelloAsso)'}` : t('treasury.statusPaidCashCheck')}
            </option>
            <option value="exempted">{t('treasury.statusExempted')}</option>
          </select>
        </div>

        {/* Badge informatif HelloAsso avec montant direct, détail option et date */}
        {(isHelloAssoPaid || member.helloAssoLastPayment) && (
          <div 
            className="flex items-center gap-1 text-[7.5px] font-bold text-[var(--color-cordel-vert)] dark:text-emerald-400 bg-[var(--color-cordel-vert)]/10 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-[#2d6a4f]/30 dark:border-emerald-800/50 select-none"
            title={`Paiement HelloAsso ${member.helloAssoLastPayment?.orderId ? `(Réf: ${member.helloAssoLastPayment.orderId})` : ''} ${member.helloAssoLastPayment?.formule ? `[${member.helloAssoLastPayment.formule}]` : ''} ${member.helloAssoLastPayment?.date ? `enregistré le ${new Date(member.helloAssoLastPayment.date).toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'fr-FR')}` : ''}`}
          >
            <span>💳</span>
            <span>
              {(() => {
                const paidAmount = Number(member.derniereCotisationMontant || member.helloAssoLastPayment?.amount);
                const displayAmount = !isNaN(paidAmount) && paidAmount > 0 ? `${paidAmount} €` : `${totalDue} €`;
                const labelOnline = t('treasury.statusPaidOnline') || 'Réglé (HelloAsso)';
                return `${displayAmount} (${labelOnline}${isEchelonne ? ' - 3x' : ''})`;
              })()}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

export default React.memo(MemberTreasuryRow);
