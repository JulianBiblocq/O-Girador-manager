import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloCaixa } from '../XiloIcons';

/**
 * Étape bienveillante de sélection ou saisie du groupe
 * Affichée lorsqu'aucun paramètre ?groupe n'est présent dans l'URL ni dans le stockage local.
 *
 * @param {Object} props
 * @param {Function} props.onSelectGroup Callback appelé avec le code groupe choisi
 */
export default function GroupSelectorStep({ onSelectGroup }) {
  const [groupInput, setGroupInput] = useState('');
  const [error, setError] = useState('');

  // Suggestions rapides d'associations partenaires
  const popularGroups = ['Samambaia'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = groupInput.trim();
    if (!clean) {
      setError("Veuillez saisir le nom ou code de votre association.");
      return;
    }
    setError('');
    onSelectGroup(clean);
  };

  const handlePickPopular = (name) => {
    setError('');
    onSelectGroup(name);
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
          Renseigne le nom ou le code d'invitation de ta troupe (ex. <strong>Samambaia</strong>) pour accéder au formulaire d'inscription adapté à ton groupe.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-cordel-master-dark">
              Code ou Nom de l'association <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={groupInput}
              onChange={(e) => {
                setGroupInput(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ex : Samambaia"
              className="theme-input text-xs font-bold py-2 px-3 bg-white"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-[11px] font-bold text-red-700 bg-red-50 p-2 rounded border border-red-300">
              ⚠️ {error}
            </div>
          )}

          <CordelButton
            type="submit"
            variant="ocre"
            useExtremeBorder={true}
            className="w-full py-2.5 font-black uppercase text-xs tracking-wider shadow-sm mt-1"
          >
            Continuer vers l'inscription →
          </CordelButton>
        </form>

        {popularGroups.length > 0 && (
          <div className="pt-3 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-1.5">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-cordel-master-dark opacity-60">
              Ou clique sur ton groupe :
            </span>
            <div className="flex flex-wrap gap-2">
              {popularGroups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handlePickPopular(g)}
                  className="text-xs font-black uppercase px-3 py-1 rounded bg-amber-100 hover:bg-amber-200 text-cordel-wood border border-cordel-wood/40 transition-colors cursor-pointer shadow-xs active:translate-y-[1px]"
                >
                  🌿 {g}
                </button>
              ))}
            </div>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
