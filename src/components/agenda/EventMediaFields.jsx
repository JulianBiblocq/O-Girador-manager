import React, { useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { parseYouTubeMedia, isValidHttpUrl } from '../../utils/mediaUrlUtils';
import YouTubeVideoPickerModal from '../common/YouTubeVideoPickerModal';

/**
 * EventMediaFields - Section « Médias & Captations » des formulaires d'événements :
 * 1. Autorisation de dépôt vidéo (enableVideoDrop)
 * 2. Lien de dépôt brut Framaspace (dropUrl) avec provisionnement 1-clic
 * 3. Restitution YouTube (videoUrl) avec détection dynamique
 */
export default function EventMediaFields({
  formData,
  setFormData,
  handleChange,
  saving = false,
  defaultDropUrl = '',
  groupId
}) {
  const [provisioning, setProvisioning] = useState(false);
  const [provisionMsg, setProvisionMsg] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Remplissage automatique lors du choix d'une vidéo via la modale
  const handleSelectVideo = ({ url }) => {
    if (setFormData) {
      setFormData(prev => ({ ...prev, videoUrl: url }));
    } else if (handleChange) {
      handleChange({ target: { name: 'videoUrl', value: url } });
    }
  };

  // Analyse en direct de l'URL vidéo / playlist YouTube
  const youtubeAnalysis = useMemo(() => {
    const rawUrl = (formData.videoUrl || '').trim();
    if (!rawUrl) return null;
    return parseYouTubeMedia(rawUrl);
  }, [formData.videoUrl]);

  // Gestion du changement de lien de dépôt
  const handleDropUrlChange = (e) => {
    const val = e.target.value;
    if (setFormData) setFormData(prev => ({ ...prev, dropUrl: val, lienDepotMedias: val }));
    else if (handleChange) handleChange({ target: { name: 'dropUrl', value: val } });
  };

  // Bascule de l'autorisation de dépôt de vidéos
  const handleToggleVideoDrop = (isChecked) => {
    if (setFormData) setFormData(prev => ({ ...prev, enableVideoDrop: isChecked }));
    else if (handleChange) handleChange({ target: { name: 'enableVideoDrop', value: isChecked } });
  };

  // Création automatique 1-clic du dossier Framaspace pour cet atelier
  const handleAutoProvisionFramaspace = async () => {
    setProvisioning(true);
    setProvisionMsg(null);
    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceEventFolders');
      const targetGroupId = groupId || formData.groupId;
      const res = await provisionFn({
        eventId: formData.id || null,
        groupId: targetGroupId,
        eventData: formData
      });

      const generatedUrl = res.data?.dropUrl || res.data?.lienDepotMedias;
      const generatedAlbumUrl = res.data?.albumPhotosUrl;
      const generatedFolder = res.data?.framaspaceFolder || res.data?.folderSlug;
      if (generatedUrl) {
        if (setFormData) {
          setFormData(prev => ({
            ...prev,
            dropUrl: generatedUrl,
            lienDepotMedias: generatedUrl,
            ...(generatedAlbumUrl ? { albumPhotosUrl: generatedAlbumUrl } : {}),
            ...(generatedFolder ? { framaspaceFolder: generatedFolder } : {})
          }));
        } else if (handleChange) {
          handleChange({ target: { name: 'dropUrl', value: generatedUrl } });
        }
        setProvisionMsg({ type: 'success', text: "Dossier Framaspace créé avec succès pour cet événement !" });
      } else {
        throw new Error("L'adresse de dépôt n'a pas pu être récupérée.");
      }
    } catch (err) {
      console.error("Erreur création automatique Framaspace :", err);
      setProvisionMsg({
        type: 'error',
        text: err.message || "Impossible de créer le dossier automatiquement. Vérifiez la configuration Framaspace."
      });
    } finally {
      setProvisioning(false);
    }
  };

  const isDropAllowed = Boolean(formData.enableVideoDrop);
  const rawVideoUrl = (formData.videoUrl || '').trim();
  const isVideoUrlInvalid = rawVideoUrl !== '' && (!isValidHttpUrl(rawVideoUrl) || !youtubeAnalysis);

  const isTypeTargetDefault = ['prestation', 'concert', 'spectacle', 'festival', 'parade'].includes((formData.type || '').toLowerCase());
  const isRecolteMediasActive = formData.activerRecolteMedias !== undefined
    ? Boolean(formData.activerRecolteMedias)
    : isTypeTargetDefault;

  const handleToggleRecolteMedias = (isChecked) => {
    if (setFormData) {
      setFormData(prev => ({ ...prev, activerRecolteMedias: isChecked }));
    } else if (handleChange) {
      handleChange({ target: { name: 'activerRecolteMedias', value: isChecked } });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg-light/60 border-2 border-dashed border-cordel-master-dark/25 rounded-[6px_8px_7px_9px] text-left select-none">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5">
        <h5 className="text-[11px] uppercase font-black tracking-wider text-cordel-wood flex items-center gap-1.5">
          <span>📸</span>
          <span>Boîte à Photos & Captations</span>
        </h5>
        <span className="text-[9px] font-semibold text-cordel-master-dark/60 italic">
          Framaspace & Varal
        </span>
      </div>

      {/* 1. Interrupteur principal : Boîte à photos / QR Code spectateurs */}
      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-encre-noire hover:text-cordel-wood transition-colors">
          <input
            type="checkbox"
            name="activerRecolteMedias"
            checked={isRecolteMediasActive}
            onChange={(e) => handleToggleRecolteMedias(e.target.checked)}
            disabled={saving}
            className="w-4 h-4 rounded accent-amber-600 cursor-pointer"
          />
          <span>📸 Activer la boîte à photos / QR Code spectateurs</span>
        </label>
        <span className="text-[9.5px] text-encre-noire/70 font-medium pl-6 leading-tight">
          Génère le QR Code de dépôt spectateurs et provisionne automatiquement l'album sur Framaspace et le Varal Photos.
        </span>

        {/* État du dossier Framaspace ou déclencheur rapide */}
        {isRecolteMediasActive && (
          <div className="pl-6 pt-1 flex items-center gap-2 flex-wrap">
            {formData.lienDepotMedias || formData.dropUrl ? (
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 flex items-center gap-1">
                <span>✓</span>
                <span>Dossier Framaspace prêt pour le QR-Code</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAutoProvisionFramaspace}
                disabled={provisioning || saving}
                className="px-2.5 py-1 bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-[9px] font-black uppercase rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                title="Créer immédiatement le dossier dédié sur Framaspace et insérer le lien de dépôt public"
              >
                {provisioning ? <><span className="animate-spin">⏳</span><span>Création en cours...</span></> : <><span>⚡</span><span>Créer le dossier Framaspace en 1 clic</span></>}
              </button>
            )}

            {formData.framaspaceFolder && (
              <span className="text-[9px] font-mono text-stone-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                📁 {formData.framaspaceFolder}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Interrupteur d'autorisation du dépôt vidéo brut */}
      <div className="pt-2 border-t border-dashed border-cordel-master-dark/15 flex flex-col gap-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-encre-noire hover:text-cordel-wood transition-colors">
          <input
            type="checkbox"
            name="enableVideoDrop"
            checked={isDropAllowed}
            onChange={(e) => handleToggleVideoDrop(e.target.checked)}
            disabled={saving}
            className="w-4 h-4 rounded accent-cordel-wood cursor-pointer"
          />
          <span>📹 Autoriser le dépôt de vidéos pour cette date</span>
        </label>
      </div>

      {/* 3. Champ dropUrl (affiché si le dépôt vidéo est autorisé ou si un lien existe) */}
      {(isDropAllowed || isRecolteMediasActive) && (
        <div className="flex flex-col gap-2 pl-6 pt-1 border-l-2 border-dashed border-cordel-wood/30">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              <span>🔗 Lien Framaspace File Drop (Dépôt public)</span>
            </label>
            {!formData.dropUrl && !formData.lienDepotMedias && (
              <button
                type="button"
                onClick={handleAutoProvisionFramaspace}
                disabled={provisioning || saving}
                className="px-2 py-0.5 bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-[8.5px] font-black uppercase rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                title="Créer automatiquement le dossier sur Framaspace et insérer le lien de dépôt public"
              >
                {provisioning ? <><span className="animate-spin">⏳</span><span>Création...</span></> : <><span>⚡</span><span>Créer sur Framaspace</span></>}
              </button>
            )}
          </div>

          {defaultDropUrl && !(formData.dropUrl || formData.lienDepotMedias) && (
            <div className="flex items-center gap-1.5 p-1.5 bg-emerald-50 border border-emerald-300 rounded text-[9.5px] text-emerald-900 font-semibold">
              <span>✅</span>
              <span>Dossier général actif : les fichiers iront par défaut dans le dossier de l'association.</span>
            </div>
          )}

          {provisionMsg && (
            <div className={`p-1.5 rounded text-[9px] font-bold ${
              provisionMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
            }`}>
              {provisionMsg.text}
            </div>
          )}

          <input
            type="url"
            name="dropUrl"
            value={formData.dropUrl !== undefined ? formData.dropUrl : (formData.lienDepotMedias || '')}
            onChange={handleDropUrlChange}
            disabled={saving || provisioning}
            placeholder={defaultDropUrl ? `Par défaut : ${defaultDropUrl}` : "https://o-girador.framaspace.org/s/..."}
            className="theme-input w-full text-xs bg-white"
          />
          <p className="text-[9px] text-cordel-master-dark/70 font-medium leading-tight">
            {defaultDropUrl 
              ? "Laissez vide pour utiliser le dossier général de l'association, ou cliquez sur « ⚡ Créer le dossier Framaspace » pour isoler cette date."
              : "Cliquez sur « ⚡ Créer le dossier Framaspace » pour générer le lien automatiquement, ou collez une adresse existante."}
          </p>
        </div>
      )}

      {/* 3. Champ videoUrl (Restitution YouTube vidéo ou playlist) */}
      <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/15">
        <div className="flex items-center justify-between">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark flex items-center gap-1.5">
            <span>🎬 Vidéo ou Playlist YouTube (Restitution pupitre)</span>
          </label>
          <div className="flex items-center gap-2">
            {youtubeAnalysis && (
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                {youtubeAnalysis.isPlaylistOnly ? '📑 Playlist YouTube' : '🎬 Vidéo YouTube'}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              disabled={saving}
              className="px-2 py-0.5 bg-[var(--color-cordel-ocre,#c05621)] text-white text-[8.5px] font-black uppercase rounded hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Choisir une vidéo parmi les playlists de l'association"
            >
              <span>🎬 Choisir une vidéo</span>
            </button>
          </div>
        </div>
        <input
          type="url"
          name="videoUrl"
          value={formData.videoUrl || ''}
          onChange={handleChange}
          disabled={saving}
          placeholder="https://www.youtube.com/watch?v=... ou https://www.youtube.com/playlist?list=..."
          className="theme-input w-full text-xs bg-white"
        />
        {isVideoUrlInvalid && (
          <p className="text-[9px] text-red-700 font-bold">
            ⚠️ Le format du lien YouTube semble incomplet ou invalide.
          </p>
        )}
        <p className="text-[9px] text-cordel-master-dark/70 font-medium leading-tight">
          Lien de la captation finale téléversée sur YouTube pour consultation directe par le groupe.
        </p>
      </div>

      {/* Modale de sélection vidéo contextuelle YouTube */}
      <YouTubeVideoPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectVideo={handleSelectVideo}
        groupId={groupId || formData?.groupId}
      />
    </div>
  );
}
