import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function TabIdentity({
  formData,
  handleChange,
  logoFile,
  setLogoFile,
  uploadingLogo,
  groupId,
  saving,
  t
}) {
  const { branding = {}, sequenceurUrl = '', majoriteFeminine = false } = formData;
  const colors = branding.colors || {
    primary: '#d99f4d',
    secondary: '#84967a',
    background: '#f4ecd8',
    text: '#1a1a1a'
  };

  const setColors = (updater) => {
    const updated = typeof updater === 'function' ? updater(colors) : updater;
    handleChange('branding.colors', updated);
  };

  return (
    <>
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🎨 Identité Visuelle & Thème
        </h3>

        {/* Logo Section */}
        <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Logo de l'Association</span>
          <div className="flex items-center gap-4">
            {branding.logoUrl ? (
              <img 
                src={branding.logoUrl} 
                alt="Logo" 
                className="w-12 h-12 object-contain border border-encre-noire/30 rounded bg-white p-1" 
              />
            ) : (
              <div className="w-12 h-12 border border-dashed border-encre-noire/30 rounded flex items-center justify-center text-[10px] text-cordel-master-dark opacity-50 bg-white font-semibold">
                Aucun
              </div>
            )}
            <div className="flex-1 flex flex-col gap-1 text-left">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                disabled={saving}
                className="text-[9px] font-bold"
              />
              {logoFile && (
                <span className="text-[9px] text-green-600 font-bold">
                  ✓ Sélectionné : {logoFile.name}
                </span>
              )}
              {uploadingLogo && (
                <span className="text-[9px] text-cordel-wood animate-pulse font-bold">
                  Envoi du logo...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Colors Pickers Grid */}
        <div className="flex flex-col gap-2 mt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">Thème de Couleurs</span>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Primary Color */}
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={colors.primary}
                onChange={(e) => setColors(prev => ({ ...prev, primary: e.target.value }))}
                disabled={saving}
                className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-cordel-wood">Primaire</span>
                <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.primary}</span>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={colors.secondary}
                onChange={(e) => setColors(prev => ({ ...prev, secondary: e.target.value }))}
                disabled={saving}
                className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-cordel-wood">Secondaire</span>
                <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.secondary}</span>
              </div>
            </div>

            {/* Background Color */}
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={colors.background}
                onChange={(e) => setColors(prev => ({ ...prev, background: e.target.value }))}
                disabled={saving}
                className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-cordel-wood">Fond d'écran</span>
                <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.background}</span>
              </div>
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-2">
              <input 
                type="color" 
                value={colors.text}
                onChange={(e) => setColors(prev => ({ ...prev, text: e.target.value }))}
                disabled={saving}
                className="w-8 h-8 cursor-pointer rounded border border-encre-noire/40"
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-extrabold text-cordel-wood">Texte</span>
                <span className="text-[8px] font-semibold text-cordel-master-dark/65">{colors.text}</span>
              </div>
            </div>
          </div>
        </div>
      </CordelCard>

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🎛️ Lien du Séquenceur
        </h3>
        <div className="flex flex-col gap-1 text-left">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
            URL Racine du Séquenceur de l'association
          </label>
          <input 
            type="url"
            value={sequenceurUrl}
            onChange={(e) => handleChange('sequenceurUrl', e.target.value)}
            placeholder="ex: https://mon-sequenceur.app"
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>
      </CordelCard>

      {/* Invitation Link Card */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          📨 Invitation au groupe
        </h3>
        <div className="flex flex-col gap-2.5 text-left">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            Permettez aux nouveaux membres de s'inscrire et de rejoindre directement votre association en partageant ce lien d'invitation unique.
          </p>
          <CordelButton
            variant="ocre"
            useExtremeBorder={true}
            onClick={async () => {
              const invitationUrl = `${window.location.origin}/?groupe=${groupId}`;
              const shareText = `Rejoins notre groupe sur ${formData.nom || 'notre association'} : ${invitationUrl}`;
              try {
                await navigator.clipboard.writeText(shareText);
                alert("Lien d'invitation copié dans le presse-papiers !");
              } catch (err) {
                console.error("Erreur lors de la copie :", err);
                alert("Impossible de copier le lien automatiquement. Voici le lien d'invitation : " + invitationUrl);
              }
            }}
            className="w-full py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer select-none"
          >
            📋 Copier le lien d'invitation
          </CordelButton>
        </div>
      </CordelCard>

      {/* Options d'affichage & terminologie */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🗣️ Terminologie & Rendu
        </h3>
        <div className="flex flex-col gap-1 text-left">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input 
              type="checkbox"
              checked={majoriteFeminine}
              onChange={(e) => handleChange('majoriteFeminine', e.target.checked)}
              disabled={saving}
              className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-encre-noire">
                Groupe à majorité féminine (Appliquer le féminin sur les textes au pluriel)
              </span>
              <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
                Active le pluriel féminin pour les termes généraux (ex: "Toutes les inscrites", "Les batuqueiras"). Les rôles individuels restent fidèles au genre de chaque membre.
              </span>
            </div>
          </label>
        </div>
      </CordelCard>
    </>
  );
}
