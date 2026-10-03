import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Bloc d'édition des 8 liens vers les réseaux sociaux et plateformes musicales.
 */
export default function SocialLinksBlock({
  publicTheme = {},
  handleChange,
  saving
}) {
  const { t } = useTranslation();
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
    { key: 'facebook', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.facebook'), placeholder: 'https://facebook.com/votre-page' },
    { key: 'instagram', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.instagram'), placeholder: 'https://instagram.com/votre-compte' },
    { key: 'youtube', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.youtube'), placeholder: 'https://youtube.com/@votre-chaine' },
    { key: 'tiktok', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.tiktok'), placeholder: 'https://tiktok.com/@votre-compte' },
    { key: 'snapchat', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.snapchat'), placeholder: 'https://snapchat.com/ajouter/...' },
    { key: 'whatsapp', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.whatsapp'), placeholder: 'https://chat.whatsapp.com/...' },
    { key: 'linkedin', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.linkedin'), placeholder: 'https://linkedin.com/company/...' },
    { key: 'spotify', label: t('vitrine.admin.socialNewsletter.socialLinksBlock.spotifyMusique'), placeholder: 'https://open.spotify.com/artist/...' }
  ];

  return (
    <div className="flex flex-col gap-3 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-encre-noire">
          {t('vitrine.admin.socialNewsletter.socialLinksBlock.liensDesReseauxSociaux')}
        </span>
        <span className="text-[10px] text-stone-500 font-normal">
          {t('vitrine.admin.socialNewsletter.socialLinksBlock.affichageSurLaVitrine')}
        </span>
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

