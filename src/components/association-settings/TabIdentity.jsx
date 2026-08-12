import React from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import LegalInfoBlock from './blocks/LegalInfoBlock';
import SequenceurLinkBlock from './blocks/SequenceurLinkBlock';

export default function TabIdentity({
  formData,
  handleChange,
  signaturePresidentFile,
  setSignaturePresidentFile,
  signatureTresorierFile,
  setSignatureTresorierFile,
  groupId,
  saving,
  t,
  onReopenOnboarding
}) {
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
        <CordelCard variant="default" className="p-4 bg-emerald-50/70 border-2 border-[var(--color-cordel-vert,#2d6a4f)]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left mb-4">
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

      {/* Informations Légales */}
      <LegalInfoBlock 
        formData={formData} 
        handleChange={handleChange} 
        saving={saving} 
        signaturePresidentFile={signaturePresidentFile}
        setSignaturePresidentFile={setSignaturePresidentFile}
        signatureTresorierFile={signatureTresorierFile}
        setSignatureTresorierFile={setSignatureTresorierFile}
      />

      <div className="mt-4">
        {/* Lien Séquenceur */}
        <SequenceurLinkBlock formData={formData} handleChange={handleChange} saving={saving} />
      </div>

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🎛️ Autres Liens Externes Globaux
        </h3>
        <div className="flex flex-col gap-4 text-left">
          {/* Lien externe de récolte de photos (Dropbox, Google Form, etc.) */}
          <div className="flex flex-col gap-1">
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

      {/* 🏛️ Bureau Officiel Juridique */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            🏛️ Bureau Officiel Juridique
          </h3>
          <span className="text-[9px] text-cordel-master-dark/70 font-semibold italic">
            Optionnel
          </span>
        </div>

        <p className="text-[10px] text-cordel-master-dark/75 font-medium leading-relaxed mb-3 text-left">
          Ajoutez autant de fonctions du bureau que nécessaire (Président(e), Secrétaire, Trésorier(ère), etc.).
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
                    placeholder="Titre du rôle"
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
                
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveBureauMembre(idx, -1)}
                    disabled={saving || idx === 0}
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveBureauMembre(idx, 1)}
                    disabled={saving || idx === bureauMembres.length - 1}
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveBureauMembre(membre.id)}
                    disabled={saving}
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

      {/* 🥁 Direction Artistique / Mestria */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-1.5">
            🥁 Direction Artistique / Mestria
          </h3>
        </div>

        <p className="text-[10px] text-cordel-master-dark/75 font-medium leading-relaxed mb-3 text-left">
          Renseignez les Mestres, Directeurs Artistiques et Maîtres de section.
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
                    placeholder="Fonction"
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

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveMestre(idx, -1)}
                    disabled={saving || idx === 0}
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveMestre(idx, 1)}
                    disabled={saving || idx === directionArtistique.length - 1}
                    className="w-6 h-6 rounded bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center hover:bg-stone-300 disabled:opacity-30 cursor-pointer"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMestre(mestre.id)}
                    disabled={saving}
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
                  Afficher la Direction Artistique sur les Procès-Verbaux (PV)
                </span>
              </div>
            </label>
          </div>
        </div>
      </CordelCard>

      {/* Invitation Link Card */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
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
    </>
  );
}
