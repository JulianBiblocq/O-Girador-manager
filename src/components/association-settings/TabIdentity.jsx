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
              <p className="text-[9px] text-cordel-master-dark/65 font-medium mt-0.5">
                Format recommandé : SVG (pour une netteté parfaite) ou PNG transparent (minimum 512x512 pixels).
              </p>
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
          🎛️ Liens Externes Globaux
        </h3>
        <div className="flex flex-col gap-4 text-left">
          {/* Séquenceur */}
          <div className="flex flex-col gap-1">
            <label htmlFor="sequenceurUrl" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              URL Racine du Séquenceur de l'association
            </label>
            <input 
              id="sequenceurUrl"
              type="url"
              value={sequenceurUrl}
              onChange={(e) => handleChange('sequenceurUrl', e.target.value)}
              placeholder="ex: https://mon-sequenceur.app"
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          {/* Lien externe de récolte de photos (Dropbox, Google Form, etc.) */}
          <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
            <label htmlFor="lienRecoltePhotosExternes" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
              📷 Lien externe de récolte de photos (Dropbox, etc.)
            </label>
            <input 
              id="lienRecoltePhotosExternes"
              type="url"
              value={formData.lienRecoltePhotosExternes || formData.lienGoogleFormRecoltePhotos || ''}
              onChange={(e) => {
                handleChange('lienRecoltePhotosExternes', e.target.value);
                handleChange('lienGoogleFormRecoltePhotos', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: https://www.dropbox.com/request/... ou https://forms.google.com/..."
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
            <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
              Permet de générer un QR Code public affichable sur la fiche de chaque événement pour inviter le public à envoyer ses photos et vidéos.
            </p>
          </div>

          {/* Lien de Dépôt des Images du Forum (Framaspace / Drive) */}
          <div className="flex flex-col gap-1 text-left pt-2 border-t border-dashed border-cordel-master-dark/15">
            <label htmlFor="lienDepotForum" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
              🖼️ Lien de dépôt des images du Forum (Framaspace, Drive...)
            </label>
            <input 
              id="lienDepotForum"
              type="url"
              value={formData.lienDepotForum || ''}
              onChange={(e) => handleChange('lienDepotForum', e.target.value)}
              disabled={saving}
              placeholder="ex: https://mon-asso.framaspace.org/... ou https://drive.google.com/..."
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
            <p className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5">
              Redirige les membres vers votre espace de stockage partagé lors de l'insertion d'une photo dans le Forum.
            </p>
          </div>
        </div>
      </CordelCard>

      {/* Bloc Informations Légales & Facturation (Imprimées sur Devis/Factures PDF) */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          📜 Informations Légales & Facturation (Devis & PDF)
        </h3>
        <div className="flex flex-col gap-3 text-left">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            Ces coordonnées administratives s'imprimeront automatiquement sur les en-têtes et pieds de page de tous vos Devis, Factures et documents PDF officiels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Structure juridique */}
            <div className="flex flex-col gap-1">
              <label htmlFor="structureJuridique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Structure Juridique
              </label>
              <input 
                id="structureJuridique"
                type="text"
                value={formData.structureJuridique || ''}
                onChange={(e) => handleChange('structureJuridique', e.target.value)}
                disabled={saving}
                placeholder="ex: Association Loi 1901"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            {/* N° SIRET / RNA */}
            <div className="flex flex-col gap-1">
              <label htmlFor="siret" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Numéro SIRET / N° RNA
              </label>
              <input 
                id="siret"
                type="text"
                value={formData.siret || formData.rna || ''}
                onChange={(e) => {
                  handleChange('siret', e.target.value);
                  handleChange('rna', e.target.value);
                }}
                disabled={saving}
                placeholder="ex: 849 123 456 00012 / W291001234"
                className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          </div>

          {/* Adresse du Siège Social */}
          <div className="flex flex-col gap-1">
            <label htmlFor="adresseSiegeSocial" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Adresse de Domiciliation / Siège Social
            </label>
            <input 
              id="adresseSiegeSocial"
              type="text"
              value={formData.adresseSiegeSocial || formData.adresse || ''}
              onChange={(e) => {
                handleChange('adresseSiegeSocial', e.target.value);
                handleChange('adresse', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: 12 Rue de la Paix, 29200 Brest"
              className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          {/* E-mail Officiel de l'Association (Expéditeur vérifié Brevo & Devis PDF) */}
          <div className="flex flex-col gap-1">
            <label htmlFor="emailOfficiel" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
              <span>E-mail Officiel de l'Association (Expéditeur vérifié Brevo & PDF)</span>
              <span className="text-[8px] font-normal italic text-cordel-wood">Renseigné sur les Devis PDF et utilisé par Brevo</span>
            </label>
            <input 
              id="emailOfficiel"
              type="email"
              value={formData.email || formData.emailOfficiel || formData.publicContactEmail || ''}
              onChange={(e) => {
                handleChange('email', e.target.value);
                handleChange('emailOfficiel', e.target.value);
                handleChange('publicContactEmail', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: contact@votre-association.fr"
              className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mention Exonération TVA */}
            <div className="flex flex-col gap-1">
              <label htmlFor="mentionTVA" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Mention d'Exonération TVA
              </label>
              <input 
                id="mentionTVA"
                type="text"
                value={formData.mentionTVA || ''}
                onChange={(e) => handleChange('mentionTVA', e.target.value)}
                disabled={saving}
                placeholder="ex: TVA non applicable, art. 293 B du CGI"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>

            {/* RIB / IBAN */}
            <div className="flex flex-col gap-1">
              <label htmlFor="ribIban" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
                Coordonnées Bancaires (IBAN / BIC)
              </label>
              <input 
                id="ribIban"
                type="text"
                value={formData.ribIban || formData.iban || ''}
                onChange={(e) => {
                  handleChange('ribIban', e.target.value);
                  handleChange('iban', e.target.value);
                }}
                disabled={saving}
                placeholder="ex: FR76 3000 4000 1234 5678 9012 345"
                className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          </div>
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
