import React, { useState } from 'react';
import CordelCard from '../../CordelCard';

export default function BrevoIntegrationBlock({ formData, handleChange, saving }) {
  const publicTheme = formData.publicTheme || {};
  const [showBrevoKey, setShowBrevoKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
        <span>⚡ Routage d'E-mails Sécurisé</span>
        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-300">
          ✓ Actif (Mode SaaS)
        </span>
      </h4>

      <p className="text-xs text-stone-800 font-medium leading-relaxed bg-[#2d6a4f]/10 p-4 rounded-md border border-[#2d6a4f]/30">
        🛡️ <strong>Sérénité garantie :</strong> Le routage de vos e-mails est automatiquement géré et sécurisé par les serveurs O Girador. Les réponses à vos devis arriveront directement sur votre boîte mail officielle.
      </p>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 flex items-center gap-1.5 transition-colors"
        >
          {showAdvanced ? '🔽 Masquer les options avancées' : '▶️ Options Avancées (Marque Blanche Totale)'}
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 border-2 border-dashed border-stone-200 bg-stone-50 rounded flex flex-col gap-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              Connectez votre propre compte Brevo (ex-Sendinblue) uniquement si vous souhaitez forcer un routage entièrement personnalisé de la newsletter via une liste externe.
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
          </div>
        )}
      </div>
    </CordelCard>
  );
}
