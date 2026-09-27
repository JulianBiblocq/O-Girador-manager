import React from 'react';

/**
 * Bloc d'édition des 8 liens vers les réseaux sociaux et plateformes musicales.
 */
export default function SocialLinksBlock({
  publicTheme = {},
  handleChange,
  saving
}) {
  const socialLinks = publicTheme.socialLinks || {};

  const handleSocialLinkChange = (network, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      socialLinks: {
        ...(publicTheme.socialLinks || {}),
        [network]: value
      }
    });
  };

  const NETWORKS = [
    { key: 'facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/votre-page' },
    { key: 'instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/votre-compte' },
    { key: 'youtube', label: '🎬 YouTube', placeholder: 'https://youtube.com/@votre-chaine' },
    { key: 'tiktok', label: '🎵 TikTok', placeholder: 'https://tiktok.com/@votre-compte' },
    { key: 'snapchat', label: '👻 Snapchat', placeholder: 'https://snapchat.com/ajouter/...' },
    { key: 'whatsapp', label: '💬 WhatsApp', placeholder: 'https://chat.whatsapp.com/...' },
    { key: 'linkedin', label: '💼 LinkedIn', placeholder: 'https://linkedin.com/company/...' },
    { key: 'spotify', label: '🎧 Spotify / Musique', placeholder: 'https://open.spotify.com/artist/...' }
  ];

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-encre-noire">
          🌐 Liens des Réseaux Sociaux
        </span>
        <span className="text-[10px] text-stone-500 font-normal">Affichage sur la vitrine</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {NETWORKS.map((net) => (
          <div key={net.key} className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-encre-noire/80">
              {net.label}
            </label>
            <input
              type="url"
              value={socialLinks[net.key] || ''}
              onChange={(e) => handleSocialLinkChange(net.key, e.target.value)}
              disabled={saving}
              placeholder={net.placeholder}
              className="text-xs px-2.5 py-1.5 border border-encre-noire/20 rounded bg-white font-mono"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
