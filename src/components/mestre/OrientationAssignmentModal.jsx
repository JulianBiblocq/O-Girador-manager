import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

const DEFAULT_INSTRUMENTS = [
  "Alfaia Marcante",
  "Alfaia Meião",
  "Alfaia Repique",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Timbal",
  "Chant",
  "Danse"
];

/**
 * OrientationAssignmentModal component renders the modal for the Mestre to validate
 * primary & secondary instruments for a member, and optionally send a private message.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen Modal visibility state
 * @param {Function} props.onClose Modal close callback
 * @param {Object} props.member Targeted member object
 * @param {Array<string>} [props.instrumentsDisponibles] List of available instruments
 * @param {Function} props.onSave Callback function (mainInstrument, secondaryInstrument, messageToMember)
 * @param {boolean} props.saving Loading indicator state
 */
export default function OrientationAssignmentModal({
  isOpen,
  onClose,
  member,
  instrumentsDisponibles = DEFAULT_INSTRUMENTS,
  onSave,
  saving
}) {
  const [mainInst, setMainInst] = useState('');
  const [secInst, setSecInst] = useState('');
  const [messageToMember, setMessageToMember] = useState('');

  useEffect(() => {
    if (member) {
      setMainInst(member.instrument || member.voeuPrincipal || '');
      setSecInst(member.instrumentSecondaire || member.voeuSecondaire || '');
      setMessageToMember('');
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const instrumentsList = Array.isArray(instrumentsDisponibles) && instrumentsDisponibles.length > 0
    ? instrumentsDisponibles
    : DEFAULT_INSTRUMENTS;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(mainInst, secInst, messageToMember);
  };

  const memberName = `${member.prenom || ''} ${member.nom || ''}`.trim() || 'Membre';

  // Group instrument options: Student wishes first, then remaining catalog instruments
  const studentWishes = [];
  if (member.voeuPrincipal) {
    studentWishes.push({ key: 'v1', name: member.voeuPrincipal, label: `Choix 1 (Vœu principal) : ${member.voeuPrincipal}` });
  }
  if (member.voeuSecondaire && !studentWishes.some(w => w.name === member.voeuSecondaire)) {
    studentWishes.push({ key: 'v2', name: member.voeuSecondaire, label: `Choix 2 (Vœu secondaire) : ${member.voeuSecondaire}` });
  }
  if (member.voeuTertiaire && !studentWishes.some(w => w.name === member.voeuTertiaire)) {
    studentWishes.push({ key: 'v3', name: member.voeuTertiaire, label: `Choix 3 (Vœu tertiaire) : ${member.voeuTertiaire}` });
  }

  const wishNames = studentWishes.map(w => w.name);
  const otherInstruments = instrumentsList.filter(inst => !wishNames.includes(inst));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-lg flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-dashed border-cordel-master-dark/20 pb-2">
          <h3 className="font-cactus font-black text-lg text-cordel-wood uppercase tracking-wider">
            🎯 Affectation d'Instrument
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-cordel-master-dark hover:text-red-600 font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Member Info Card */}
        <div className="bg-cordel-bg-light/90 border border-dashed border-cordel-master-dark/20 p-3 rounded flex flex-col gap-1.5 text-xs text-left">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-sm text-cordel-master-dark">{memberName}</span>
            {member.surnom && (
              <span className="text-[10px] font-bold text-cordel-wood italic">
                "{member.surnom}"
              </span>
            )}
          </div>
          <div className="text-[11px] text-cordel-master-dark/80">
            <strong>Instrument actuel :</strong> {member.instrument || 'Non attribué'}
            {member.instrumentSecondaire ? ` (Secondaire : ${member.instrumentSecondaire})` : ''}
          </div>

          {/* Expressed Wishes Badge */}
          {(member.voeuPrincipal || member.voeuSecondaire || member.voeuTertiaire || member.accordRenfortAncienInstrument) && (
            <div className="mt-1 pt-1.5 border-t border-dashed border-cordel-master-dark/15 flex flex-col gap-1">
              <span className="text-[9px] uppercase font-black tracking-wider text-cordel-wood">
                Vœux exprimés par l'adhérent :
              </span>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                {member.voeuPrincipal && (
                  <span className="bg-white/70 dark:bg-black/20 px-2 py-0.5 rounded border border-cordel-master-dark/20 font-bold">
                    1️⃣ {member.voeuPrincipal}
                  </span>
                )}
                {member.voeuSecondaire && (
                  <span className="bg-white/70 dark:bg-black/20 px-2 py-0.5 rounded border border-cordel-master-dark/20">
                    2️⃣ {member.voeuSecondaire}
                  </span>
                )}
                {member.voeuTertiaire && (
                  <span className="bg-white/70 dark:bg-black/20 px-2 py-0.5 rounded border border-cordel-master-dark/20">
                    3️⃣ {member.voeuTertiaire}
                  </span>
                )}
                {member.accordRenfortAncienInstrument && member.instrument && (
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-extrabold flex items-center gap-1">
                    🤝 Renfort ok : {member.instrument}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assignment Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
          {/* Main Instrument Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
              Valider l'Instrument Principal <span className="text-red-500 font-bold">*</span>
            </label>
            <select
              value={mainInst}
              onChange={(e) => setMainInst(e.target.value)}
              disabled={saving}
              required
              className="theme-input w-full text-xs font-bold bg-cordel-bg-light"
            >
              <option value="">-- Sélectionner un instrument principal --</option>
              {studentWishes.length > 0 && (
                <optgroup label="⭐ Vœux de l'élève">
                  {studentWishes.map((w) => (
                    <option key={`m-wish-${w.key}`} value={w.name}>
                      {w.label}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={studentWishes.length > 0 ? "🎵 Autres instruments du catalogue" : "🎵 Instruments disponibles"}>
                {otherInstruments.map((inst) => (
                  <option key={`m-other-${inst}`} value={inst}>{inst}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Secondary Instrument Dropdown */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood">
                Valider l'Instrument Secondaire (Optionnel)
              </label>
              {member.accordRenfortAncienInstrument && member.instrument && secInst !== member.instrument && (
                <button
                  type="button"
                  onClick={() => setSecInst(member.instrument)}
                  className="text-[9px] font-black uppercase text-amber-800 dark:text-amber-300 underline cursor-pointer hover:opacity-80"
                >
                  + Utiliser {member.instrument} (Renfort)
                </button>
              )}
            </div>
            <select
              value={secInst}
              onChange={(e) => setSecInst(e.target.value)}
              disabled={saving}
              className="theme-input w-full text-xs bg-cordel-bg-light"
            >
              <option value="">-- Aucun instrument secondaire --</option>
              {studentWishes.length > 0 && (
                <optgroup label="⭐ Vœux de l'élève">
                  {studentWishes.map((w) => (
                    <option key={`s-wish-${w.key}`} value={w.name}>
                      {w.label}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={studentWishes.length > 0 ? "🎵 Autres instruments du catalogue" : "🎵 Instruments disponibles"}>
                {otherInstruments.map((inst) => (
                  <option key={`s-other-${inst}`} value={inst}>{inst}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Private Message Textarea */}
          <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
            <label className="text-[10px] uppercase font-extrabold tracking-wider text-cordel-wood flex items-center justify-between">
              <span>💬 Message pour l'élève (Optionnel)</span>
              <span className="text-[9px] font-normal normal-case opacity-75">Envoi automatique en MP</span>
            </label>
            <textarea
              rows={3}
              value={messageToMember}
              onChange={(e) => setMessageToMember(e.target.value)}
              disabled={saving}
              placeholder="Ex: Bravo ! Tu es validé(e) à l'Alfaia Marcante cette année. Pense à vérifier tes morceaux sur l'application !"
              className="theme-input w-full text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 mt-2">
            <CordelButton
              type="button"
              variant="default"
              useExtremeBorder={true}
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2 text-xs uppercase font-extrabold"
            >
              Annuler
            </CordelButton>
            <CordelButton
              type="submit"
              variant="ocre"
              useExtremeBorder={true}
              disabled={saving || !mainInst}
              className="flex-1 py-2 text-xs uppercase font-extrabold"
            >
              {saving ? "Validation..." : "Enregistrer et Valider"}
            </CordelButton>
          </div>
        </form>
      </CordelCard>
    </div>
  );
}
