import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

export default function BrevoIntegrationBlock({ formData, handleChange, saving }) {
  const publicTheme = formData.publicTheme || {};
  const [showBrevoKey, setShowBrevoKey] = useState(false);

  // Mise à jour de la configuration Brevo dans publicTheme
  const handleBrevoFieldChange = (field, value) => {
    const updatedTheme = {
      ...publicTheme,
      [field]: value
    };
    handleChange('publicTheme', updatedTheme);
  };

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-4 bg-white border-2 border-stone-200 shadow-xs">
      <h4 className="text-xs font-black uppercase tracking-widest text-stone-800 border-b border-dashed border-stone-200 pb-2 flex items-center justify-between">
        <span>⚡ Synchronisation Automatique Brevo (API)</span>
        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
          publicTheme.brevoApiKey ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'
        }`}>
          {publicTheme.brevoApiKey ? '✓ Clé API activée' : '⚠️ Non configuré'}
        </span>
      </h4>

      <p className="text-xs text-stone-600 leading-relaxed">
        Connectez votre compte Brevo (ex-Sendinblue) pour pousser automatiquement chaque nouvel e-mail inscrit depuis la vitrine vers votre liste de contacts.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Champ Clé API Brevo v3 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
            <span>🔑 Clé API Brevo v3</span>
            <button
              type="button"
              onClick={() => setShowBrevoKey(!showBrevoKey)}
              className="text-[10px] font-normal text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              {showBrevoKey ? '🙈 Masquer' : '👁️ Afficher'}
            </button>
          </label>
          <input
            type={showBrevoKey ? 'text' : 'password'}
            value={publicTheme.brevoApiKey || ''}
            onChange={(e) => handleBrevoFieldChange('brevoApiKey', e.target.value)}
            disabled={saving}
            placeholder="xkeysib-..."
            className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
          />
        </div>

        {/* Champ ID de Liste Brevo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
            <span>📋 ID de la Liste Brevo (Optionnel)</span>
          </label>
          <input
            type="text"
            value={publicTheme.brevoListId || ''}
            onChange={(e) => handleBrevoFieldChange('brevoListId', e.target.value)}
            disabled={saving}
            placeholder="Ex: 2 ou 5"
            className="text-xs px-3 py-2 border border-stone-300 rounded bg-white font-mono text-stone-800"
          />
        </div>
      </div>

      <span className="text-[10px] text-stone-500 font-medium italic">
        💡 La clé API se récupère sur votre espace d'administration Brevo sous <strong>Paramètres &gt; Clés API</strong>.
      </span>
    </CordelCard>
  );
}
