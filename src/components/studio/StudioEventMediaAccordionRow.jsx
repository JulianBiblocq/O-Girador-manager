import React from 'react';

/**
 * Composant accordéon d'une date / événement dans la médiathèque du Pôle Studio.
 * - Plié par défaut avec une ligne d'en-tête compacte : Titre, date, lieu, pastilles d'état.
 * - Déplié au clic pour configurer les dossiers Cloud (Framaspace, Drive), les dépôts et le Varal.
 */
export default function StudioEventMediaAccordionRow({
  ev,
  rowState = {},
  canWrite = false,
  isExpanded = false,
  onToggleExpand,
  provisioningStatus = {},
  handleInputChange,
  handleToggleEventField,
  handleResetCloudMedia,
  handleSaveDepot,
  handleSaveAlbum,
  handleAlignDepotToAlbum,
  handleProvisionFramaspace,
  setActiveQrModal,
  onSwitchToVaral
}) {
  const evDate = ev.dateDebut || ev.date || '';
  const isPresta = ev.type === 'prestation' || ev.isPrestation;
  const hasDepot = Boolean((ev.lienDepotMedias || '').trim());
  const hasAlbum = Boolean((ev.albumPhotosUrl || '').trim());
  const isRecolteActive = ev.activerRecolteMedias !== undefined ? Boolean(ev.activerRecolteMedias) : isPresta;

  return (
    <div className="bg-cordel-card-bg text-encre-noire border-2 border-encre-noire rounded-[6px_10px_7px_9px] shadow-[2px_2px_0px_0px_#181716] overflow-hidden transition-all">
      {/* 1. En-tête compact et cliquable de l'accordéon */}
      <div
        onClick={onToggleExpand}
        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-amber-100/40 transition-colors select-none"
      >
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border border-encre-noire/30 bg-cordel-bg shrink-0">
            {isPresta ? '🎭 Prestation' : ev.type === 'repetition' ? '🥁 Répétition' : '📅 Sortie'}
          </span>
          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide text-cordel-wood truncate">
            {ev.titre || "Événement sans titre"}
          </h4>
          {evDate && (
            <span className="text-[11px] font-bold text-encre-noire/75 shrink-0">
              • 📅 {new Date(evDate).toLocaleDateString('fr-FR')}
            </span>
          )}
          {ev.lieu && (
            <span className="text-[10px] font-medium text-encre-noire/60 truncate max-w-[180px] hidden md:inline">
              • 📍 {ev.lieu}
            </span>
          )}
        </div>

        {/* Pastilles d'état et indicateur d'accordéon */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {ev.framaspaceFolder && (
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono bg-amber-50 text-amber-950 border border-amber-300 truncate max-w-[120px]"
              title={`Dossier Cloud : ${ev.framaspaceFolder}`}
            >
              📁 {ev.framaspaceFolder}
            </span>
          )}

          {/* Pastille Dépôt ouvert / fermé */}
          <span
            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
              hasDepot && isRecolteActive
                ? 'bg-emerald-100 text-emerald-900 border-emerald-800/40'
                : 'bg-stone-100 text-stone-600 border-stone-300'
            }`}
          >
            {hasDepot && isRecolteActive ? '📷 Dépôt ouvert' : '📷 Dépôt inactif'}
          </span>

          {/* Pastille Drive / Cloud synchronisé */}
          {(hasDepot || ev.framaspaceFolder) && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-400">
              📁 Drive synchronisé
            </span>
          )}

          {/* Pastille Varal relié */}
          {hasAlbum && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-800/40">
              🪢 Varal relié
            </span>
          )}

          {/* Bouton flèche accordéon */}
          <span className="ml-1 text-xs font-black text-cordel-wood border border-encre-noire/20 px-1.5 py-0.5 rounded bg-cordel-bg">
            {isExpanded ? '▴' : '▾'}
          </span>
        </div>
      </div>

      {/* 2. Contenu déplié de l'accordéon */}
      {isExpanded && (
        <div className="p-3.5 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col gap-3 bg-cordel-bg-light/40 animate-fade-in">
          {/* Actions rapides Framaspace et Varal */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-2">
              {hasAlbum && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSwitchToVaral) onSwitchToVaral();
                    else window.open(ev.albumPhotosUrl || ev.lienDepotMedias, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border border-encre-noire bg-amber-200 hover:bg-amber-300 text-encre-noire cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>👁️</span>
                  <span>Voir sur le Varal</span>
                </button>
              )}

              {canWrite && (
                <button
                  type="button"
                  onClick={() => handleProvisionFramaspace(ev)}
                  disabled={provisioningStatus?.loading}
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border border-encre-noire bg-cordel-bg hover:bg-amber-100 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  {provisioningStatus?.loading ? '⏳ Synchronisation...' : '⚡ Re-sync Framaspace'}
                </button>
              )}
            </div>

            {canWrite && (hasDepot || hasAlbum || ev.framaspaceFolder) && (
              <button
                type="button"
                onClick={() => handleResetCloudMedia(ev)}
                className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded border border-[var(--color-cordel-rouge)] text-[var(--color-cordel-rouge)] bg-white hover:bg-red-50 cursor-pointer"
              >
                🗑️ Délier / Réinitialiser Cloud
              </button>
            )}
          </div>

          {/* Toggles d'activation */}
          <div className="flex flex-wrap items-center gap-4 p-2 rounded bg-amber-50/70 border border-encre-noire/20 text-[10px]">
            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={isRecolteActive}
                onChange={() => handleToggleEventField(ev, 'activerRecolteMedias', isRecolteActive)}
                disabled={!canWrite}
                className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
              />
              <span>📸 Boîte à photos / QR Code activé</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={Boolean(ev.publierSurVaral)}
                onChange={() => handleToggleEventField(ev, 'publierSurVaral', Boolean(ev.publierSurVaral))}
                disabled={!canWrite}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>🪢 Publié sur le Varal Photos</span>
            </label>
          </div>

          {/* Formulaires d'édition des liens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            {/* Volet Dépôt public */}
            <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase text-cordel-master-dark">
                  📸 Dossier de dépôt public (Framaspace, Drive...)
                </span>
                {hasDepot && (
                  <button
                    type="button"
                    onClick={() => setActiveQrModal({
                      qrUrl: ev.lienDepotMedias,
                      eventTitle: ev.titre,
                      eventDate: evDate,
                      eventLocation: ev.lieu,
                      mode: 'depot'
                    })}
                    className="px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-amber-300 border border-encre-noire cursor-pointer"
                  >
                    📱 QR-Code
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={rowState.lienDepotMedias || ''}
                  onChange={(e) => handleInputChange(ev.id, 'lienDepotMedias', e.target.value)}
                  disabled={!canWrite || rowState.savingDepot}
                  placeholder="https://mon-asso.framaspace.org/s/..."
                  className="theme-input flex-1 px-2 py-1 text-xs font-bold rounded border border-encre-noire bg-white"
                />
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => handleSaveDepot(ev.id)}
                    disabled={rowState.savingDepot}
                    className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {rowState.savingDepot ? '⏳' : rowState.savedDepot ? '✓' : 'Sauver'}
                  </button>
                )}
              </div>
            </div>

            {/* Volet Album finalisé */}
            <div className="p-2.5 bg-cordel-bg/80 border border-encre-noire/20 rounded flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] font-black uppercase text-cordel-master-dark">
                  🪢 Album photos finalisé (Sync Varal)
                </span>
                {hasAlbum && (
                  <button
                    type="button"
                    onClick={() => setActiveQrModal({
                      qrUrl: ev.albumPhotosUrl,
                      eventTitle: ev.titre,
                      eventDate: evDate,
                      eventLocation: ev.lieu,
                      mode: 'album'
                    })}
                    className="px-2 py-0.5 text-[8.5px] font-black uppercase rounded bg-amber-300 border border-encre-noire cursor-pointer"
                  >
                    📱 QR-Code
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={rowState.albumPhotosUrl || ''}
                  onChange={(e) => handleInputChange(ev.id, 'albumPhotosUrl', e.target.value)}
                  disabled={!canWrite || rowState.savingAlbum}
                  placeholder="https://mon-asso.framaspace.org/s/..."
                  className="theme-input flex-1 px-2 py-1 text-xs font-bold rounded border border-encre-noire bg-white"
                />
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => handleSaveAlbum(ev)}
                    disabled={rowState.savingAlbum}
                    className="px-2.5 py-1 text-[9px] font-black uppercase rounded bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    {rowState.savingAlbum ? '⏳' : rowState.savedAlbum ? '✓ Sync' : 'Sync Varal'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
