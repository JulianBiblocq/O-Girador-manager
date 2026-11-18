import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloCaixa } from '../XiloIcons';

/**
 * Étape bienveillante de sélection ou saisie du groupe associatif.
 * Affichée lorsqu'aucun identifiant d'association valide n'est résolu (URL, stockage local ou profil).
 *
 * @param {Object} props
 * @param {Function} props.onSelectGroup Callback appelé avec le code groupe saisi
 * @param {string} [props.externalError=''] Message d'erreur retourné si l'association est introuvable
 * @param {boolean} [props.loading=false] Vérification Firestore en cours
 */
export default function GroupSelectorStep({ onSelectGroup, externalError = '', loading = false }) {
  const [groupInput, setGroupInput] = useState('');
  const [localError, setLocalError] = useState('');

  const effectiveError = localError || externalError;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = groupInput.trim();
    if (!clean) {
      setLocalError('Veuillez saisir le code ou identifiant de votre association.');
      return;
    }
    setLocalError('');
    onSelectGroup(clean);
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in text-left select-none">
      <CordelCard
        variant="default"
        useExtremeBorder={true}
        className="w-full max-w-md p-6 flex flex-col gap-4 border-2 border-dashed border-cordel-wood/50 bg-cordel-bg-light shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cordel-wood text-white flex items-center justify-center shrink-0 border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716]">
            <XiloCaixa size={24} />
          </div>
          <div>
            <h3 className="font-extrabold text-base uppercase tracking-wider text-cordel-wood">
              Rejoindre une association
            </h3>
            <p className="text-xs text-cordel-master-dark opacity-80 font-medium">
              🥁 Quel groupe ou association rejoins-tu ?
            </p>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-encre-noire">
          Renseigne le code d'invitation communiqué par ton groupe (ou ouvre directement le lien d'invitation reçu) pour accéder à ton espace membre.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
              Code ou identifiant de l'association <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={groupInput}
              onChange={(e) => {
                setGroupInput(e.target.value);
                if (localError) setLocalError('');
              }}
              placeholder="Ex : baque-do-sol"
              className="theme-input text-xs font-bold py-2 px-3 bg-white"
              autoFocus
            />
          </div>

          {effectiveError && (
            <div className="text-[11px] font-bold text-red-700 bg-red-50 p-2 rounded border border-red-300">
              ⚠️ {effectiveError}
            </div>
          )}

          <CordelButton
            type="submit"
            variant="ocre"
            useExtremeBorder={true}
            disabled={loading}
            className="w-full py-2.5 font-black uppercase text-xs tracking-wider shadow-sm mt-1"
          >
            {loading ? 'Vérification en cours...' : 'Valider cette association →'}
          </CordelButton>
        </form>
      </CordelCard>
    </div>
  );
}
