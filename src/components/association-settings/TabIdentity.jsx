import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function TabIdentity({
  formData,
  handleChange,
  logoFile,
  setLogoFile,
  signaturePresidentFile,
  setSignaturePresidentFile,
  signatureTresorierFile,
  setSignatureTresorierFile,
  uploadingLogo,
  groupId,
  saving,
  t,
  onReopenOnboarding
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

  // Gestion de la liste dynamique du Bureau Officiel
  const bureauMembres = Array.isArray(formData.bureauMembres) ? formData.bureauMembres : [];

  const handleAddBureauMembre = () => {
    const newMember = { id: `bureau_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, role: '', nom: '' };
    handleChange('bureauMembres', [...bureauMembres, newMember]);
  };

  const handleUpdateBureauMembre = (id, field, value) => {
    const updated = bureauMembres.map(item => item.id === id ? { ...item, [field]: value } : item);
    handleChange('bureauMembres', updated);
  };

  const handleRemoveBureauMembre = (id) => {
    const updated = bureauMembres.filter(item => item.id !== id);
    handleChange('bureauMembres', updated);
  };

  const handleMoveBureauMembre = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= bureauMembres.length) return;
    const updated = [...bureauMembres];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleChange('bureauMembres', updated);
  };

  // Gestion de la liste dynamique de la Direction Artistique / Mestria
  const directionArtistique = Array.isArray(formData.directionArtistique) ? formData.directionArtistique : [];

  const handleAddMestre = () => {
    const newMestre = { id: `mestre_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, role: '', nom: '' };
    handleChange('directionArtistique', [...directionArtistique, newMestre]);
  };

  const handleUpdateMestre = (id, field, value) => {
    const updated = directionArtistique.map(item => item.id === id ? { ...item, [field]: value } : item);
    handleChange('directionArtistique', updated);
  };

  const handleRemoveMestre = (id) => {
    const updated = directionArtistique.filter(item => item.id !== id);
    handleChange('directionArtistique', updated);
  };

  const handleMoveMestre = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= directionArtistique.length) return;
    const updated = [...directionArtistique];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    handleChange('directionArtistique', updated);
  };

  return (
    <>
      {/* Carte d'action : Relancer l'assistant de premier démarrage */}
      {onReopenOnboarding && (
        <CordelCard variant="default" className="p-4 bg-emerald-50/70 border-2 border-[var(--color-cordel-vert,#2d6a4f)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚀</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-cordel-vert,#2d6a4f)]">
                Assistant de Premier Démarrage (Wizard)
              </h4>
              <p className="text-[11px] text-stone-600 font-medium">
                Souhaitez-vous refaire la visite guidée et réinitialiser les réglages de base en 4 étapes ?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onReopenOnboarding}
            className="px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white bg-[var(--color-cordel-vert,#2d6a4f)] rounded-lg hover:brightness-110 cursor-pointer shadow-xs whitespace-nowrap flex items-center gap-1.5"
          >
            <span>🚀 Relancer l'assistant de configuration</span>
          </button>
        </CordelCard>
      )}

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
              value={formData.emailOfficiel || formData.email || ''}
              onChange={(e) => {
                handleChange('emailOfficiel', e.target.value);
                handleChange('email', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: contact@votre-association.fr"
              className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
            />
            <p className="text-[8px] text-stone-500 font-semibold mt-0.5">
              💡 Fallback intelligent : Si l'e-mail public de la vitrine est laissé vide, cet e-mail officiel sera automatiquement utilisé sur le site public.
            </p>
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

          {/* Téléphone de Contact Officiel */}
          <div className="flex flex-col gap-1">
            <label htmlFor="telephone" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark">
              Téléphone Officiel de l'Association
            </label>
            <input 
              id="telephone"
              type="tel"
              value={formData.telephone || formData.phone || ''}
              onChange={(e) => {
                handleChange('telephone', e.target.value);
                handleChange('phone', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: 06 12 34 56 78"
              className="theme-input text-xs font-mono font-bold py-1.5 bg-cordel-bg-light w-full"
            />
            <p className="text-[8px] text-stone-500 font-semibold mt-0.5">
              💡 Fallback intelligent : Si le téléphone public de la vitrine est laissé vide, ce numéro officiel sera automatiquement utilisé sur le site public.
            </p>
          </div>

          {/* Clause Spécifique / Avertissement Contrat (Textarea Optionnel) */}
          <div className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
            <label htmlFor="clauseSpecifique" className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-master-dark flex items-center justify-between">
              <span>📋 Clause Spécifique / Avertissement Contrat (Optionnel)</span>
              <span className="text-[8px] font-normal italic text-cordel-wood">S'imprime en bas des contrats PDF</span>
            </label>
            <textarea
              id="clauseSpecifique"
              rows={3}
              value={formData.clauseSpecifique || formData.legalClause || ''}
              onChange={(e) => {
                handleChange('clauseSpecifique', e.target.value);
                handleChange('legalClause', e.target.value);
              }}
              disabled={saving}
              placeholder="ex: Avertissement sonore : Les prestations comportent un volume sonore élevé. L'organisateur s'engage à fournir l'accès à une prise électrique et un point d'eau."
              className="theme-input text-xs font-bold p-2 bg-cordel-bg-light w-full resize-none"
            />
          </div>

          {/* Signatures Numérisées du Président et du Trésorier */}
          <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/15 pt-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-wood">
              ✍️ Signatures Numérisées des Représentants (Imprimées sur Devis & Contrats PDF)
            </span>
            <p className="text-[9px] text-cordel-master-dark/70 font-medium">
              Conseil : Utilisez une image au format PNG avec un fond transparent pour un rendu parfait sur les documents PDF.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              {/* Signature du Président / Mestre */}
              <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                  Signature du Président / Mestre
                </span>
                <div className="flex items-center gap-2">
                  {formData.signaturePresidentUrl ? (
                    <img
                      src={formData.signaturePresidentUrl}
                      alt="Signature Président"
                      className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                    />
                  ) : (
                    <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                      Aucune
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setSignaturePresidentFile && setSignaturePresidentFile(e.target.files?.[0] || null)}
                    disabled={saving}
                    className="text-[9px] font-bold text-stone-700 w-full cursor-pointer"
                  />
                </div>
                {signaturePresidentFile && (
                  <span className="text-[9px] text-green-700 font-bold">✓ Sélectionné : {signaturePresidentFile.name}</span>
                )}
              </div>

              {/* Signature du Trésorier */}
              <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 border border-stone-200 rounded">
                <span className="text-[9px] font-extrabold uppercase text-cordel-master-dark">
                  Signature du Trésorier
                </span>
                <div className="flex items-center gap-2">
                  {formData.signatureTresorierUrl ? (
                    <img
                      src={formData.signatureTresorierUrl}
                      alt="Signature Trésorier"
                      className="w-16 h-10 object-contain border border-stone-300 rounded bg-white p-1"
                    />
                  ) : (
                    <div className="w-16 h-10 border border-dashed border-stone-300 rounded flex items-center justify-center text-[9px] text-stone-400 font-bold bg-white">
                      Aucune
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => setSignatureTresorierFile && setSignatureTresorierFile(e.target.files?.[0] || null)}
                    disabled={saving}
                    className="text-[9px] font-bold text-stone-700 w-full cursor-pointer"
                  />
                </div>
                {signatureTresorierFile && (
                  <span className="text-[9px] text-green-700 font-bold">✓ Sélectionné : {signatureTresorierFile.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CordelCard>

      {/* 🏛️ Bureau Officiel Juridique (Liste Dynamique & Extensible) */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            🏛️ Bureau Officiel Juridique (Liste Modulable)
          </h3>
          <span className="text-[9px] text-cordel-master-dark/70 font-semibold italic">
            Champs 100% optionnels
          </span>
        </div>

        <p className="text-[10px] text-cordel-master-dark/75 font-medium leading-relaxed mb-3 text-left">
          Ajoutez autant de fonctions du bureau que nécessaire (Président(e), Secrétaire, Trésorier(ère), Vice-Président(e), etc.). Ces membres figureront sur les Procès-Verbaux officiels et documents juridiques.
        </p>

        <div className="flex flex-col gap-2.5 text-left">
          {bureauMembres.length === 0 ? (
            <div className="p-3 border border-dashed border-cordel-master-dark/20 rounded bg-white/50 text-[10px] text-cordel-master-dark/60 font-semibold italic text-center">
              Aucun membre du bureau renseigné pour le moment.
            </div>
          ) : (
            bureauMembres.map((membre, idx) => (
              <div key={membre.id || idx} className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded">
                <div className="flex flex-col sm:flex-row flex-1 gap-2">
                  <input
                    type="text"
                    value={membre.role || ''}
                    onChange={(e) => handleUpdateBureauMembre(membre.id, 'role', e.target.value)}
                    placeholder="Titre du rôle (ex: Trésorière, Secrétaire adjoint)"
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 px-2 bg-white flex-1"
                  />
                  <input
                    type="text"
                    value={membre.nom || ''}
                    onChange={(e) => handleUpdateBureauMembre(membre.id, 'nom', e.target.value)}
                    placeholder="Prénom & Nom du membre"
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 px-2 bg-white flex-1"
                  />
                </div>
                
                {/* Actions réordonnancement & suppression */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveBureauMembre(idx, -1)}
                    disabled={saving || idx === 0}
                    title="Monter"
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBureauMembre(idx, 1)}
                    disabled={saving || idx === bureauMembres.length - 1}
                    title="Descendre"
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBureauMembre(membre.id)}
                    disabled={saving}
                    title="Supprimer"
                    className="w-6 h-6 rounded bg-[#8b2a1a] text-white text-xs font-bold flex items-center justify-center hover:bg-[#8b2a1a]/80 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="pt-2">
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleAddBureauMembre}
              disabled={saving}
              className="py-1.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              ➕ Ajouter une fonction du bureau
            </CordelButton>
          </div>
        </div>
      </CordelCard>

      {/* 🥁 Direction Artistique / Mestria (Module Distinct) */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            🥁 Direction Artistique / Mestria (Séparée du Bureau)
          </h3>
          <span className="text-[9px] text-cordel-master-dark/70 font-semibold italic">
            Module Indépendant
          </span>
        </div>

        <p className="text-[10px] text-cordel-master-dark/75 font-medium leading-relaxed mb-3 text-left">
          Renseignez les Mestres, Directeurs Artistiques et Maîtres de section. Cette section est isolée du Bureau Juridique officiel.
        </p>

        <div className="flex flex-col gap-2.5 text-left">
          {directionArtistique.length === 0 ? (
            <div className="p-3 border border-dashed border-cordel-master-dark/20 rounded bg-white/50 text-[10px] text-cordel-master-dark/60 font-semibold italic text-center">
              Aucun Mestre ou Directeur Artistique renseigné.
            </div>
          ) : (
            directionArtistique.map((mestre, idx) => (
              <div key={mestre.id || idx} className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded">
                <div className="flex flex-col sm:flex-row flex-1 gap-2">
                  <input
                    type="text"
                    value={mestre.role || ''}
                    onChange={(e) => handleUpdateMestre(mestre.id, 'role', e.target.value)}
                    placeholder="Fonction (ex: Mestre de Bateria, Directrice Artistique)"
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 px-2 bg-white flex-1"
                  />
                  <input
                    type="text"
                    value={mestre.nom || ''}
                    onChange={(e) => handleUpdateMestre(mestre.id, 'nom', e.target.value)}
                    placeholder="Prénom & Nom du Mestre"
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1 px-2 bg-white flex-1"
                  />
                </div>

                {/* Actions réordonnancement & suppression */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveMestre(idx, -1)}
                    disabled={saving || idx === 0}
                    title="Monter"
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveMestre(idx, 1)}
                    disabled={saving || idx === directionArtistique.length - 1}
                    title="Descendre"
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMestre(mestre.id)}
                    disabled={saving}
                    title="Supprimer"
                    className="w-6 h-6 rounded bg-[#8b2a1a] text-white text-xs font-bold flex items-center justify-center hover:bg-[#8b2a1a]/80 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="pt-2">
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={handleAddMestre}
              disabled={saving}
              className="py-1.5 px-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              ➕ Ajouter un membre de la Direction Artistique
            </CordelButton>
          </div>

          {/* Case à cocher : Afficher la Mestria sur les PV officiels */}
          <div className="mt-3 pt-3 border-t border-dashed border-stone-300">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.afficherMestriaPV || false}
                onChange={(e) => handleChange('afficherMestriaPV', e.target.checked)}
                disabled={saving}
                className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-encre-noire">
                  Afficher la Direction Artistique sur les Procès-Verbaux (PV) et documents officiels
                </span>
                <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
                  Décoché par défaut (recommandé si les Mestres sont salariés ou défrayés, pour préserver leur indépendance juridique vis-à-vis du bureau de l'association).
                </span>
              </div>
            </label>
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
