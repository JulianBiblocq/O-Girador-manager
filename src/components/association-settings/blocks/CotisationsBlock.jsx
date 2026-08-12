import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import CordelButton from '../../CordelButton';

export default function CotisationsBlock({ formData, handleChange, saving, groupId, handleSaveHelloAssoKey }) {
  const {
    montantAdhesion = 0,
    optionsCotisation = [],
    lienPaiementExterne = '',
    instructionsPaiement = '',
    helloAssoSignatureKey = ''
  } = formData;

  const [copySuccess, setCopySuccess] = useState(false);

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'o-girador-7828c';
  const webhookUrl = `https://us-central1-${projectId}.cloudfunctions.net/helloAssoWebhook?groupId=${groupId}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("Erreur de copie :", err);
    });
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        🪙 Trésorerie (Cotisations)
      </h3>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Montant de l'Adhésion de base (€) (Fixe)
          </label>
          <input 
            type="number"
            min="0"
            value={montantAdhesion}
            onChange={(e) => handleChange('montantAdhesion', parseFloat(e.target.value) || 0)}
            placeholder="ex: 30"
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>

        <div className="flex flex-col gap-2 mt-2 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
            Options de Cotisations supplémentaires
          </span>
          
          {optionsCotisation.map((opt, idx) => (
            <div key={opt.id || idx} className="flex gap-2 items-center bg-white/40 dark:bg-black/10 p-2 rounded border border-dashed border-cordel-master-dark/15">
              <input 
                type="text"
                value={opt.nom}
                onChange={(e) => {
                  const updated = [...optionsCotisation];
                  updated[idx].nom = e.target.value;
                  handleChange('optionsCotisation', updated);
                }}
                placeholder="Ex: Percussions"
                className="theme-input text-xs font-bold py-1 bg-cordel-bg-light flex-1"
              />
              <input 
                type="number"
                min="0"
                value={opt.montant}
                onChange={(e) => {
                  const updated = [...optionsCotisation];
                  updated[idx].montant = parseFloat(e.target.value) || 0;
                  handleChange('optionsCotisation', updated);
                }}
                placeholder="Montant"
                className="theme-input text-xs font-bold py-1 bg-cordel-bg-light w-20"
              />
              <button
                type="button"
                onClick={() => {
                  handleChange('optionsCotisation', optionsCotisation.filter((_, i) => i !== idx));
                }}
                className="text-red-500 hover:text-red-700 font-bold px-2 text-xs cursor-pointer select-none"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex justify-start mt-1">
            <CordelButton 
              type="button"
              variant="ocre"
              onClick={() => {
                handleChange('optionsCotisation', [...optionsCotisation, { id: `cot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, nom: '', montant: 0 }]);
              }}
              className="text-[9px] py-1 px-2.5 uppercase font-bold tracking-wider"
            >
              + Ajouter une cotisation
            </CordelButton>
          </div>
        </div>

        <div className="flex flex-col gap-1 text-left">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Lien de paiement externe (HelloAsso, PayPal...)
          </label>
          <input 
            type="url"
            value={lienPaiementExterne}
            onChange={(e) => handleChange('lienPaiementExterne', e.target.value || '')}
            placeholder="https://helloasso.com/associations/..."
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            Instructions de paiement
          </label>
          <textarea 
            rows={4}
            value={instructionsPaiement}
            onChange={(e) => handleChange('instructionsPaiement', e.target.value || '')}
            placeholder="Expliquez comment payer (chèque, virement, précisez la référence de paiement...)"
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full resize-y min-h-[80px]"
          />
        </div>

        <div className="flex flex-col gap-3 text-left border-t border-dashed border-cordel-master-dark/15 pt-3 mt-1">
          <label className="text-[10px] uppercase font-black tracking-widest text-cordel-wood">
            🔗 Automatisation HelloAsso
          </label>
          
          <div className="bg-[#fcfaf2] dark:bg-black/15 border border-cordel-wood/35 p-3.5 rounded-[4px] text-[10px] font-bold flex flex-col gap-2.5 leading-relaxed text-encre-noire shadow-[1px_1px_0px_0px_rgba(0,0,0,0.05)]">
            <p className="font-black text-cordel-wood border-b border-dashed border-cordel-wood/20 pb-1.5 mb-0.5 uppercase tracking-wide">
              Guide d'intégration pas à pas :
            </p>
            
            <div>
              <span className="text-[9px] font-black uppercase text-cordel-wood">Étape 1 :</span> Copiez cette URL personnalisée pour votre association :
              <div className="flex gap-2 items-center mt-1.5 bg-white/70 dark:bg-black/25 p-1.5 rounded border border-encre-noire/15">
                <code className="text-[8px] font-mono select-all truncate flex-1 leading-none text-encre-noire">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-[8px] font-black uppercase tracking-wider bg-cordel-wood text-cordel-bg-light px-2.5 py-1 rounded border border-encre-noire shadow-[0.5px_0.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-opacity-95 cursor-pointer select-none"
                >
                  {copySuccess ? "Copié !" : "Copier"}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-black uppercase text-cordel-wood">Étape 2 :</span> Connectez-vous à votre espace administrateur HelloAsso. Allez dans <strong>Mon Compte &gt; Intégrations et API</strong>.
            </div>

            <div>
              <span className="text-[9px] font-black uppercase text-cordel-wood">Étape 3 :</span> Dans la section <strong>Webhooks</strong>, collez l'URL ci-dessus et cochez l'événement <strong>Historique des commandes (Order)</strong>.
            </div>

            <div>
              <span className="text-[9px] font-black uppercase text-cordel-wood">Étape 4 :</span> HelloAsso va vous fournir une <strong>Clé secrète</strong>. Collez-la dans le champ sécurisé ci-dessous et sauvegardez.
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Clé secrète de notification HelloAsso
            </label>
            <div className="flex gap-2 items-center">
              <input 
                type="password"
                value={helloAssoSignatureKey}
                onChange={(e) => handleChange('helloAssoSignatureKey', e.target.value || '')}
                placeholder="Saisissez la clé de signature du Webhook"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light flex-1"
              />
              <button
                type="button"
                onClick={handleSaveHelloAssoKey}
                disabled={saving}
                className="text-[9px] font-black uppercase tracking-wider bg-cordel-bg text-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer select-none disabled:opacity-50 h-full flex items-center justify-center min-h-[32px]"
              >
                Sauvegarder la clé
              </button>
            </div>
          </div>
        </div>
      </div>
    </CordelCard>
  );
}
