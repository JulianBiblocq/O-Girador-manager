/**
 * Modale universelle d'attribution et d'affectation de pupitre pour le Mestre (Mestria > Orientation & Casting).
 * Permet d'affecter librement n'importe quel pupitre de l'association, qu'un adhérent ait formulé des vœux ou non.
 * Présente les vœux comme de simples suggestions d'aide à la décision et propose un bouton rapide de reconduction.
 */

import React, { useState, useEffect, useMemo } from 'react';
import CordelModalWrapper from '../common/CordelModalWrapper';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { XiloClose, XiloSparkles, XiloShield } from '../XiloIcons';
import { useTranslation } from '../LanguageContext';
import { resolveCategory, getCategoryName } from '../../utils/categoryUtils';

/**
 * CastingAssignmentModal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen Indique si la modale est visible
 * @param {Function} props.onClose Callback de fermeture
 * @param {Object} props.member Objet adhérent à affecter
 * @param {Array<string>} props.pupitresList Liste complète des pupitres de l'association
 * @param {Array<Object>} props.customCategories Niveaux de pratique configurés
 * @param {Function} props.onSave Callback de validation (memberId, payload)
 * @param {boolean} props.saving État de sauvegarde en cours
 * @param {Function} props.resolvePupitreForInstrument Utilitaire de résolution de pupitre
 */
export default function CastingAssignmentModal({
  isOpen,
  onClose,
  member,
  pupitresList = [],
  customCategories = [],
  onSave,
  saving = false,
  resolvePupitreForInstrument = (i) => i
}) {
  const { t } = useTranslation();

  // Extraction de l'historique et des vœux de l'adhérent
  const rawMain = member?.instrumentPrincipal || member?.instrument || '';
  const currentPupitre = resolvePupitreForInstrument(rawMain) || rawMain;

  const previousInst = useMemo(() => {
    if (!member) return null;
    const inst = member.instrumentPrincipal || member.instrument;
    if (inst && inst !== 'En attente' && inst.trim() !== '') return inst;
    if (member.instrumentSecondaire && member.instrumentSecondaire !== 'En attente') return member.instrumentSecondaire;
    if (member.instrumentSaison && member.instrumentSaison !== 'En attente') return member.instrumentSaison;
    return null;
  }, [member]);

  const rawWishes = useMemo(() => {
    if (!member) return [];
    if (Array.isArray(member.voeuxInstruments) && member.voeuxInstruments.length > 0) {
      return member.voeuxInstruments.map(w => typeof w === 'string' ? w : w?.instrument);
    }
    return [member.voeuPrincipal, member.voeuSecondaire, member.voeuTertiaire];
  }, [member]);

  const wishesList = useMemo(() => {
    return rawWishes.filter(w => w && typeof w === 'string' && !w.toLowerCase().includes('danse'));
  }, [rawWishes]);

  const hasWishes = wishesList.length > 0;

  // États locaux de sélection pour la modale
  const [selectedPupitre, setSelectedPupitre] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('aucun');
  const [isDispoSecours, setIsDispoSecours] = useState(false);
  const [selectedAlfaiaVoices, setSelectedAlfaiaVoices] = useState(['marcante']);
  const [selectedCaixasAttribution, setSelectedCaixasAttribution] = useState('caixa');
  const [selectedSecInst, setSelectedSecInst] = useState('');
  const [selectedSecLevel, setSelectedSecLevel] = useState('aucun');
  const [isDispoSecoursSec, setIsDispoSecoursSec] = useState(false);

  // Synchronisation des valeurs initiales au montage / ouverture
  useEffect(() => {
    if (member && isOpen) {
      const initMain = resolvePupitreForInstrument(member.instrumentPrincipal || member.instrument) || '';
      setSelectedPupitre(initMain === 'En attente' ? '' : initMain);
      setSelectedLevel(member.niveauMusique || member.niveau || 'aucun');

      const secoursList = member.dispoSecoursInstruments || [];
      const legacySecours = member.disponibleSecours && !member.dispoSecoursInstruments;
      setIsDispoSecours(secoursList.includes(initMain) || legacySecours);

      // Compétences Alfaia
      let voices = member.competencesAlfaia;
      if (!Array.isArray(voices) || voices.length === 0) {
        voices = ['marcante'];
      }
      setSelectedAlfaiaVoices(voices);

      // Attribution Caixas
      setSelectedCaixasAttribution(member.attributionCaixas || 'caixa');

      // Second instrument
      const initSec = resolvePupitreForInstrument(member.instrumentSecondaire) || '';
      setSelectedSecInst(initSec === 'En attente' ? '' : initSec);
      setSelectedSecLevel(member.niveauxParInstrument?.[initSec] || 'aucun');
      setIsDispoSecoursSec(secoursList.includes(initSec));
    }
  }, [member, isOpen, resolvePupitreForInstrument]);

  if (!isOpen || !member) return null;

  const memberName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Sans Nom';

  // Application en 1 clic d'une suggestion de vœu ou de reconduction
  const handleSelectQuickSuggestion = (targetInst) => {
    if (!targetInst) return;
    const resolved = resolvePupitreForInstrument(targetInst) || targetInst;
    setSelectedPupitre(resolved);
  };

  const handleToggleVoice = (voice) => {
    const lower = voice.toLowerCase();
    setSelectedAlfaiaVoices(prev => {
      if (prev.includes(lower)) {
        const next = prev.filter(v => v !== lower);
        return next.length > 0 ? next : ['marcante'];
      }
      return [...prev, lower];
    });
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    onSave?.(member.id, {
      instrumentPrincipal: selectedPupitre,
      niveauMusique: selectedLevel,
      dispoSecours: isDispoSecours,
      competencesAlfaia: selectedAlfaiaVoices,
      attributionCaixas: selectedCaixasAttribution,
      instrumentSecondaire: selectedSecInst,
      niveauSecondaire: selectedSecLevel,
      dispoSecoursSec: isDispoSecoursSec
    });
  };

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <XiloAvatar src={member.photoURL} name={memberName} size={42} />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-heading font-black text-base uppercase tracking-wider text-encre-noire dark:text-cordel-bg">
              {memberName}
            </h3>
            {member.surnom && (
              <span className="text-xs font-bold text-cordel-wood italic">
                "{member.surnom}"
              </span>
            )}
            {member.isNew ? (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white border border-encre-noire">
                🆕 Post-essai
              </span>
            ) : member.estAncienMembre ? (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Ancien membre
              </span>
            ) : null}
          </div>
          <span className="text-[10px] text-cordel-master-dark/70 font-semibold">
            Affectation universelle & orientation pour la saison
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1 text-cordel-master-dark/60 hover:text-cordel-master-dark transition-colors rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
        title="Fermer (Échap)"
      >
        <XiloClose size={20} />
      </button>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-end gap-2.5 w-full">
      <CordelButton
        variant="default"
        type="button"
        onClick={onClose}
        disabled={saving}
        className="text-xs px-4 py-2"
      >
        Annuler
      </CordelButton>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="text-xs font-black uppercase tracking-wider px-5 py-2 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all border border-encre-noire cursor-pointer bg-[var(--color-cordel-vert)] hover:brightness-110 text-white flex items-center gap-1.5 disabled:opacity-50"
      >
        <span>✓</span>
        <span>{saving ? 'Enregistrement...' : 'Valider l\'affectation'}</span>
      </button>
    </div>
  );

  return (
    <CordelModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      header={headerContent}
      footer={footerContent}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4 text-left">

        {/* 1. Bloc Vœux & Suggestions d'aide à la décision */}
        <div className="p-3 rounded-[6px] bg-white/70 dark:bg-black/25 border border-cordel-master-dark/15 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
              <span>🎯</span>
              <span>Souhaits de l'adhérent (suggestions d'aide à la décision)</span>
            </span>
            {!hasWishes && (
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
                Sans vœux
              </span>
            )}
          </div>

          {hasWishes ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] text-cordel-master-dark/75">
                Cliquez sur un vœu pour le reporter instantanément dans le sélecteur ci-dessous :
              </p>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {wishesList.map((wish, idx) => {
                  const resolvedWish = resolvePupitreForInstrument(wish) || wish;
                  const isCurrentlyPicked = selectedPupitre.toLowerCase() === resolvedWish.toLowerCase();
                  return (
                    <button
                      key={`${wish}-${idx}`}
                      type="button"
                      onClick={() => handleSelectQuickSuggestion(resolvedWish)}
                      className={`px-3 py-1 text-xs font-bold rounded border cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs ${
                        isCurrentlyPicked
                          ? 'bg-[var(--color-cordel-vert)] text-white border-encre-noire'
                          : 'bg-white dark:bg-black/40 text-encre-noire dark:text-cordel-bg border-encre-noire/30 hover:border-encre-noire hover:bg-amber-50'
                      }`}
                      title={`Pré-sélectionner le vœu : ${wish}`}
                    >
                      <span className="text-[9px] font-black opacity-70">{idx + 1}.</span>
                      <span>{wish}</span>
                      {isCurrentlyPicked && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-950 dark:text-amber-200 leading-relaxed">
              Cet adhérent n'a exprimé aucun vœu pour la saison. En tant que Mestre, vous pouvez lui affecter librement n'importe quel pupitre parmi l'intégralité de l'association.
            </div>
          )}
        </div>

        {/* 2. Raccourci rapide « Reconduire l'instrument » (Anciens membres ou historique existant) */}
        {previousInst && (
          <div className="p-3 rounded-[6px] bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                🔄 Saison précédente
              </span>
              <span className="text-xs font-bold text-encre-noire dark:text-cordel-bg">
                Instrument historique : <strong className="text-emerald-900 dark:text-emerald-100">{previousInst}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectQuickSuggestion(previousInst)}
              className="px-3 py-1 text-xs font-black uppercase text-emerald-900 dark:text-emerald-100 bg-white dark:bg-emerald-900/60 hover:bg-emerald-100 border border-emerald-600/40 rounded shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              title={`Reconduire ${previousInst}`}
            >
              <span>🔄</span>
              <span>Reconduire cet instrument</span>
            </button>
          </div>
        )}

        {/* 3. Sélecteur Universel : Instrument Principal & Niveau */}
        <div className="p-3.5 rounded-[6px] bg-white dark:bg-black/30 border-2 border-encre-noire shadow-xs flex flex-col gap-3">
          <span className="text-[11px] font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1">
            <span>🥁</span>
            <span>Affectation officielle (Instrument Principal)</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Menu déroulant contenant tous les pupitres de l'association */}
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[9.5px] font-extrabold uppercase text-cordel-master-dark opacity-80">
                Pupitre attribué pour la saison :
              </label>
              <select
                value={selectedPupitre}
                onChange={(e) => setSelectedPupitre(e.target.value)}
                className="theme-input text-xs py-1.5 bg-white dark:bg-black/50 font-bold border-encre-noire/40 w-full"
              >
                <option value="">-- Aucun / En attente d'orientation --</option>
                {selectedPupitre && !pupitresList.includes(selectedPupitre) && (
                  <option value={selectedPupitre}>{selectedPupitre}</option>
                )}
                {pupitresList.map(pup => (
                  <option key={`modal-pup-${pup}`} value={pup}>
                    {pup}
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau de pratique */}
            <div className="flex flex-col gap-1">
              <label className="text-[9.5px] font-extrabold uppercase text-cordel-master-dark opacity-80">
                Niveau :
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                disabled={!selectedPupitre}
                className="theme-input text-xs py-1.5 bg-white dark:bg-black/50 border-encre-noire/40 w-full disabled:opacity-40"
              >
                <option value="aucun">- Niveau -</option>
                {customCategories.map(cat => {
                  const catName = getCategoryName(cat);
                  return (
                    <option key={`modal-cat-${catName}`} value={catName}>
                      {resolveCategory(catName, customCategories)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Option renfort / secours sur l'instrument principal */}
          {selectedPupitre && (
            <label className="flex items-center gap-2 cursor-pointer pt-1 opacity-90 hover:opacity-100 select-none">
              <input
                type="checkbox"
                checked={isDispoSecours}
                onChange={(e) => setIsDispoSecours(e.target.checked)}
                className="w-3.5 h-3.5 accent-cordel-wood cursor-pointer"
              />
              <span className="text-[11px] font-bold text-cordel-master-dark">
                Adhérent disponible en renfort / secours sur ce pupitre
              </span>
            </label>
          )}

          {/* Déclinaison sous-voix Alfaia */}
          {selectedPupitre.toLowerCase().includes('alfaia') && (
            <div className="p-2.5 rounded bg-cordel-bg-light/60 dark:bg-white/5 border border-dashed border-cordel-master-dark/20 flex flex-col gap-1.5">
              <span className="text-[9.5px] font-black uppercase text-cordel-master-dark opacity-80">
                Voix d'Alfaia maîtrisées :
              </span>
              <div className="flex flex-wrap gap-3">
                {['marcante', 'meião', 'repique'].map(voice => (
                  <label key={`modal-voice-${voice}`} className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-cordel-wood">
                    <input
                      type="checkbox"
                      checked={selectedAlfaiaVoices.includes(voice)}
                      onChange={() => handleToggleVoice(voice)}
                      className="accent-cordel-wood cursor-pointer"
                    />
                    <span className="capitalize">{voice}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Déclinaison Attribution Caixas / Tarol */}
          {(selectedPupitre.toLowerCase().includes('caixa') || selectedPupitre.toLowerCase().includes('tarol')) && (
            <div className="p-2.5 rounded bg-cordel-bg-light/60 dark:bg-white/5 border border-dashed border-cordel-master-dark/20 flex flex-col gap-1.5">
              <span className="text-[9.5px] font-black uppercase text-cordel-master-dark opacity-80">
                Attribution Caixas :
              </span>
              <div className="flex items-center gap-4 text-xs font-bold text-cordel-wood">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalCaixaAttribution"
                    value="caixa"
                    checked={selectedCaixasAttribution === 'caixa'}
                    onChange={() => setSelectedCaixasAttribution('caixa')}
                    className="accent-cordel-wood cursor-pointer"
                  />
                  <span>Caixa</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="modalCaixaAttribution"
                    value="tarol"
                    checked={selectedCaixasAttribution === 'tarol'}
                    onChange={() => setSelectedCaixasAttribution('tarol')}
                    className="accent-cordel-wood cursor-pointer"
                  />
                  <span>Tarol</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 4. Second instrument historique ou d'appoint */}
        <div className="p-3 rounded-[6px] bg-white/70 dark:bg-black/20 border border-cordel-master-dark/15 flex flex-col gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark/80 flex items-center gap-1">
            <span>🛡️</span>
            <span>Deuxième instrument historique / d'appoint (optionnel)</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <select
                value={selectedSecInst}
                onChange={(e) => setSelectedSecInst(e.target.value)}
                className="theme-input text-xs py-1 bg-white dark:bg-black/50 border-encre-noire/30 w-full"
              >
                <option value="">-- Aucun second instrument --</option>
                {selectedSecInst && !pupitresList.includes(selectedSecInst) && (
                  <option value={selectedSecInst}>{selectedSecInst}</option>
                )}
                {pupitresList.map(pup => (
                  <option key={`modal-sec-${pup}`} value={pup}>
                    {pup}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedSecLevel}
                onChange={(e) => setSelectedSecLevel(e.target.value)}
                disabled={!selectedSecInst}
                className="theme-input text-xs py-1 bg-white dark:bg-black/50 border-encre-noire/30 w-full disabled:opacity-40"
              >
                <option value="aucun">- Niveau -</option>
                {customCategories.map(cat => {
                  const catName = getCategoryName(cat);
                  return (
                    <option key={`modal-cat-sec-${catName}`} value={catName}>
                      {resolveCategory(catName, customCategories)}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

      </div>
    </CordelModalWrapper>
  );
}
