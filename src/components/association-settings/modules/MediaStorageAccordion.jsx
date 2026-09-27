import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import YouTubePlaylistsBlock from '../blocks/YouTubePlaylistsBlock';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';

/**
 * Accordéon compact pour les médias vidéo et le stockage cloud des captations.
 * Rapatrie les playlists YouTube (fermées par défaut) et le dépôt cloud vidéo Framaspace/Drive.
 */
export default function MediaStorageAccordion({ formData = {}, handleChange, groupId, saving }) {
  const [isOpenPlaylists, setIsOpenPlaylists] = useState(false);
  const [isOpenCloud, setIsOpenCloud] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudMsg, setCloudMsg] = useState(null);

  const playlists = Array.isArray(formData.youtubePlaylists) ? formData.youtubePlaylists : [];

  const handleProvisionGeneralDrop = async () => {
    setCloudLoading(true);
    setCloudMsg(null);
    try {
      const provisionFn = httpsCallable(functions, 'provisionFramaspaceGeneralDropFolder');
      const res = await provisionFn({ groupId });
      if (res.data?.defaultDropUrl) {
        handleChange('defaultDropUrl', res.data.defaultDropUrl);
        setCloudMsg({ type: 'success', text: "Dossier Framaspace configuré avec succès !" });
      } else {
        throw new Error("Lien non généré.");
      }
    } catch (err) {
      console.error("Erreur provision Framaspace :", err);
      setCloudMsg({ type: 'error', text: err.message || "Erreur de création automatique." });
    } finally {
      setCloudLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* 1. Playlists YouTube - Accordéon fermé par défaut avec comptage */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
        <div 
          onClick={() => setIsOpenPlaylists(prev => !prev)}
          className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
        >
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm">🎬</span>
            <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              Playlists YouTube ({playlists.length} configurées) {isOpenPlaylists ? '▲' : '▾'}
            </span>
            <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
              (Sélection de vidéos pour les ateliers et l'accueil)
            </span>
          </div>

          <button
            type="button"
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
          >
            {isOpenPlaylists ? 'Fermer' : 'Gérer'}
          </button>
        </div>

        {isOpenPlaylists && (
          <div className="p-4 border-t border-dashed border-cordel-master-dark/20 animate-fade-in bg-white/40">
            <YouTubePlaylistsBlock
              formData={formData}
              handleChange={handleChange}
              disabled={saving}
            />
          </div>
        )}
      </CordelCard>

      {/* 2. Stockage Cloud des Captations Vidéo (Framaspace / Drive) - Replié par défaut */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
        <div 
          onClick={() => setIsOpenCloud(prev => !prev)}
          className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
        >
          <div className="flex items-center gap-2 text-left">
            <span className="text-sm">📹</span>
            <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              Stockage Cloud des Captations (Framaspace / Drive) {isOpenCloud ? '▲' : '▾'}
            </span>
            <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
              {formData.defaultDropUrl ? '(Dossier configuré ✓)' : '(Non renseigné)'}
            </span>
          </div>

          <button
            type="button"
            className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
          >
            {isOpenCloud ? 'Fermer' : 'Configurer'}
          </button>
        </div>

        {isOpenCloud && (
          <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
            <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
              Lien du dossier de dépôt par défaut où les adhérents déposent leurs captations brutes lors des répétitions et ateliers.
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-[9px] uppercase font-black text-cordel-master-dark">
                  🔗 Lien du dossier de dépôt (Framaspace File Drop / Nextcloud / Drive)
                </label>
                <button
                  type="button"
                  onClick={handleProvisionGeneralDrop}
                  disabled={cloudLoading || saving}
                  className="px-2.5 py-1 bg-[var(--color-cordel-vert,#2d6a4f)] text-white text-[9px] font-black uppercase rounded hover:brightness-110 cursor-pointer shadow-2xs self-start sm:self-auto disabled:opacity-50"
                >
                  {cloudLoading ? "⏳ Création..." : "⚡ Créer automatiquement sur Framaspace"}
                </button>
              </div>

              {cloudMsg && (
                <div className={`p-2 rounded text-[10px] font-bold ${
                  cloudMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
                }`}>
                  {cloudMsg.text}
                </div>
              )}

              <input
                type="url"
                value={formData.defaultDropUrl || ''}
                onChange={(e) => handleChange('defaultDropUrl', e.target.value)}
                disabled={saving || cloudLoading}
                placeholder="https://mon-instance.framaspace.org/s/..."
                className="theme-input text-xs font-mono font-bold py-1.5 bg-white w-full"
              />
            </div>
          </div>
        )}
      </CordelCard>
    </div>
  );
}
