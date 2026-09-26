import React, { useState, useEffect, useMemo } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import { useYouTubePlaylists } from '../../hooks/useYouTubePlaylists';
import { fetchPlaylistVideos } from '../../utils/youtubeService';

/**
 * Modale Cordel réutilisable de sélection de vidéo YouTube
 * depuis les playlists configurées de l'association (< 180 lignes).
 */
export default function YouTubeVideoPickerModal({
  isOpen,
  onClose,
  onSelectVideo,
  defaultPlaylistIndex = 0,
  initialPupitre = '',
  playlists: propPlaylists = null,
  groupId = null
}) {
  const { playlists: fetchedPlaylists, apiKey, loading: loadingPlaylists } = useYouTubePlaylists(groupId);
  const playlists = propPlaylists || fetchedPlaylists || [];

  const [activeTab, setActiveTab] = useState(defaultPlaylistIndex);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Pré-positionnement intelligent selon le pupitre ciblé ou l'index par défaut
  useEffect(() => {
    if (!isOpen || playlists.length === 0) return;
    if (initialPupitre && typeof initialPupitre === 'string') {
      const pNorm = initialPupitre.toLowerCase().trim();
      const matchIdx = playlists.findIndex((pl) => (pl.label || '').toLowerCase().includes(pNorm));
      if (matchIdx !== -1) {
        setActiveTab(matchIdx);
        return;
      }
    }
    if (typeof defaultPlaylistIndex === 'number' && defaultPlaylistIndex >= 0 && defaultPlaylistIndex < playlists.length) {
      setActiveTab(defaultPlaylistIndex);
    }
  }, [isOpen, initialPupitre, defaultPlaylistIndex, playlists]);

  useEffect(() => {
    if (activeTab >= playlists.length && playlists.length > 0) setActiveTab(0);
  }, [playlists.length, activeTab]);

  const currentPlaylist = playlists[activeTab] || null;

  useEffect(() => {
    if (!isOpen || !currentPlaylist?.playlistId) {
      setVideos([]);
      setLoadingVideos(false);
      return;
    }
    let isMounted = true;
    setLoadingVideos(true);
    setError(null);
    fetchPlaylistVideos(currentPlaylist.playlistId, apiKey)
      .then((items) => { if (isMounted) { setVideos(items); setLoadingVideos(false); } })
      .catch((err) => { if (isMounted) { setError(err.message || 'Erreur de chargement'); setLoadingVideos(false); } });
    return () => { isMounted = false; };
  }, [isOpen, currentPlaylist?.playlistId, apiKey]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const q = searchQuery.toLowerCase();
    return videos.filter((v) => (v.title || '').toLowerCase().includes(q));
  }, [videos, searchQuery]);

  if (!isOpen) return null;

  const handlePick = (v) => {
    if (onSelectVideo) onSelectVideo({ videoId: v.videoId, title: v.title, url: v.url, playlistLabel: currentPlaylist?.label || '' });
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <CordelCard variant="default" useExtremeBorder={true} className="w-full max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col bg-cordel-bg p-0 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-3.5 border-b-2 border-dashed border-cordel-master-dark/20 bg-cordel-bg-light shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood">Vidéothèque YouTube</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-cordel-master-dark hover:text-cordel-wood rounded cursor-pointer" aria-label="Fermer">
            <XiloClose size={18} />
          </button>
        </div>

        {playlists.length === 0 && !loadingPlaylists ? (
          <div className="p-8 text-center flex flex-col items-center gap-3">
            <span className="text-3xl">📭</span>
            <p className="text-xs font-bold text-cordel-master-dark max-w-md leading-relaxed">
              Aucune playlist YouTube n'est configurée pour cette association. Rendez-vous dans <span className="text-cordel-wood font-black">Configuration › Studio › Communication</span> pour renseigner vos playlists de pupitres ou concerts.
            </p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Bandeau élargi des playlists avec boutons thématiques Cordel */}
            <div className="flex items-center gap-2 px-4 py-3 bg-cordel-bg-light/60 border-b-2 border-dashed border-cordel-master-dark/20 overflow-x-auto overflow-y-hidden shrink-0 select-none scrollbar-thin">
              {playlists.map((pl, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={pl.id || idx}
                    type="button"
                    onClick={() => { setActiveTab(idx); setSearchQuery(''); }}
                    className={`px-4 py-2 text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap rounded-[4px_6px_3px_5px] border-2 transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'theme-bg-ocre text-encre-noire border-encre-noire shadow-none translate-x-[0.5px] translate-y-[0.5px]'
                        : 'bg-cordel-bg text-encre-noire border-encre-noire/30 hover:border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716]'
                    }`}
                  >
                    <span>📺</span>
                    <span>{pl.label || `Playlist #${idx + 1}`}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-white border-b border-cordel-master-dark/10 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer les vidéos par titre..."
                className="w-full px-3.5 py-2 text-xs font-semibold bg-[#fdfaf2] border border-cordel-master-dark/30 rounded focus:border-cordel-wood focus:outline-hidden"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 bg-cordel-bg">
              {loadingVideos ? (
                <div className="py-12 text-center text-xs font-bold text-cordel-master-dark/70 animate-pulse">Chargement des vidéos de la playlist...</div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-800 text-center font-bold">⚠️ {error}</div>
              ) : filteredVideos.length === 0 ? (
                <div className="py-12 text-center text-xs italic text-cordel-master-dark/60">
                  {searchQuery ? "Aucune vidéo ne correspond à votre recherche." : "Cette playlist ne contient aucune vidéo publique."}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredVideos.map((vid) => (
                    <div
                      key={vid.videoId}
                      onClick={() => handlePick(vid)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handlePick(vid); }}
                      className="group p-2 bg-white border-2 border-encre-noire/15 hover:border-cordel-wood rounded-[4px_6px_3px_5px] shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col gap-1.5 text-left"
                    >
                      <div className="relative aspect-video w-full overflow-hidden rounded bg-black/10">
                        <img src={vid.thumbnail} alt={vid.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      </div>
                      <p className="text-[11px] font-extrabold text-encre-noire group-hover:text-cordel-wood line-clamp-2 leading-tight">{vid.title}</p>
                      {vid.publishedAt && (
                        <span className="text-[9px] text-cordel-master-dark/60 font-semibold mt-auto">
                          {new Date(vid.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-dashed border-cordel-master-dark/20 bg-cordel-bg-light flex justify-end">
          <CordelButton type="button" variant="default" onClick={onClose} className="text-xs font-bold">Fermer</CordelButton>
        </div>
      </CordelCard>
    </div>
  );
}
