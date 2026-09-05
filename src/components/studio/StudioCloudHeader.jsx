import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from '../LanguageContext';

/**
 * Composant : StudioCloudHeader
 * 
 * En-tête de paramétrage de l'espace Cloud racine de l'association (Framaspace, Drive, Dropbox).
 * Permet aux responsables du studio de configurer le point d'accès central aux archives médias
 * et d'ouvrir directement l'espace dans un nouvel onglet sécurisé.
 * 
 * @param {string} groupId Identifiant de l'association
 * @param {boolean} canWrite Droit d'édition sur les paramètres du Cloud
 */
export default function StudioCloudHeader({ groupId, canWrite = false }) {
  const { t } = useTranslation();
  const [cloudUrl, setCloudUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Écoute en temps réel du document de l'association pour récupérer le cloud racine
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const resolvedUrl = data.cloudRootUrl || data.cloudStorageUrl || '';
        setCloudUrl(resolvedUrl);
        setEditingUrl(resolvedUrl);
      }
    }, (err) => {
      console.error("StudioCloudHeader - Erreur écoute association :", err);
    });

    return () => unsubscribe();
  }, [groupId]);

  // Sauvegarde atomique du lien Cloud racine sur Firestore
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!groupId || !canWrite) return;

    setSaving(true);
    setError(null);
    try {
      const cleanUrl = editingUrl.trim();
      const assocRef = doc(db, 'associations', groupId);
      await updateDoc(assocRef, {
        cloudRootUrl: cleanUrl
      });
      setCloudUrl(cleanUrl);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1200);
    } catch (err) {
      console.error("StudioCloudHeader - Erreur mise à jour cloudRootUrl :", err);
      setError("Impossible d'enregistrer l'URL du Cloud.");
    } finally {
      setSaving(false);
    }
  };

  // Extraction d'un nom de domaine lisible pour l'affichage (ex: framaspace.org, drive.google.com)
  const displayHost = React.useMemo(() => {
    if (!cloudUrl) return '';
    try {
      const parsed = new URL(cloudUrl);
      return parsed.hostname;
    } catch {
      return cloudUrl;
    }
  }, [cloudUrl]);

  return (
    <div 
      data-tour="studio-cloud-root"
      className="w-full bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_12px_7px_10px] p-4 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#181716] flex flex-col gap-3.5 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-cordel-master-dark/20 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-200/80 border border-encre-noire/30 text-amber-950 text-base shrink-0">
            ☁️
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cordel-wood">
              {t('studioPhotos.cloudTitle') || "Passerelle Stockage Cloud de l'Association"}
            </h3>
            <p className="text-[11px] text-encre-noire/70 font-medium">
              {cloudUrl ? (
                <>
                  <span>Hébergement actif : </span>
                  <strong className="text-emerald-900 font-mono">{displayHost}</strong>
                </>
              ) : (
                <span className="italic text-[#c05621]">Aucun dossier Cloud racine configuré</span>
              )}
            </p>
          </div>
        </div>

        {/* Boutons d'action : Ouvrir le Cloud et Configurer */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {cloudUrl && (
            <button
              type="button"
              onClick={() => window.open(cloudUrl, '_blank', 'noopener,noreferrer')}
              className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-950 bg-[#2d6a4f] text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5"
              title="Ouvrir le dossier Cloud racine dans un nouvel onglet sécurisé"
            >
              <span>☁️</span>
              <span>{t('studioPhotos.openCloud') || "Ouvrir notre Cloud ↗"}</span>
            </button>
          )}

          {canWrite && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-encre-noire bg-cordel-bg text-encre-noire hover:bg-amber-100 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1.5"
            >
              <span>⚙️</span>
              <span>{isEditing ? (t('common.close') || "Fermer") : (t('studioPhotos.editCloud') || "Paramétrer l'URL")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulaire de configuration dépliable */}
      {isEditing && canWrite && (
        <form onSubmit={handleSave} className="flex flex-col gap-2 pt-1 animate-fade-in">
          <label className="text-[10px] font-black uppercase tracking-widest text-cordel-master-dark flex items-center gap-1">
            <span>🔗 URL d'accès racine au Cloud (Framaspace, Nextcloud, Google Drive, Dropbox)</span>
          </label>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={editingUrl}
              onChange={(e) => setEditingUrl(e.target.value)}
              placeholder="ex: https://mon-asso.framaspace.org/s/... ou https://drive.google.com/drive/folders/..."
              className="theme-input flex-1 px-3 py-1.5 text-xs font-bold rounded border border-encre-noire bg-white text-encre-noire"
              required
            />

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border-2 border-emerald-950 bg-[#2d6a4f] text-white hover:bg-emerald-800 transition-all cursor-pointer shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none flex items-center gap-1"
              >
                {saving ? (
                  <span>⏳ Enregistrement...</span>
                ) : saveSuccess ? (
                  <span>✓ Enregistré !</span>
                ) : (
                  <span>Enregistrer</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingUrl(cloudUrl);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border border-encre-noire/40 hover:bg-cordel-bg text-encre-noire/70 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[10px] font-bold text-red-700 mt-1">⚠️ {error}</p>
          )}

          <p className="text-[10px] text-encre-noire/60 font-medium italic">
            💡 Ce lien racine permet aux membres du pôle Studio d'accéder d'un clic à l'arborescence générale de stockage sans transiter par des serveurs tiers.
          </p>
        </form>
      )}
    </div>
  );
}
