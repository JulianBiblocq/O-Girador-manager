import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import TabPublicGallery from '../TabPublicGallery';
import { useTranslation } from '../../../hooks/useTranslation';

/**
 * Accordéon 5 : Galerie & Souvenirs
 * Gère la photothèque publique, l'optimisation des clichés et leur ordonnancement dans le carrousel.
 */
export default function GallerySouvenirsAccordion({
  formData = {},
  handleChange,
  groupId,
  saving,
  defaultOpen = false
}) {
  const { t } = useTranslation();
  const publicTheme = formData.publicTheme || {};
  const galleryPhotos = Array.isArray(publicTheme.galleryPhotos) ? publicTheme.galleryPhotos : [];

  return (
    <CordelAccordion
      title={t('vitrine.admin.gallery.gallerySouvenirsAccordion.galerieSouvenirs')}
      subtitle={t('vitrine.admin.gallery.gallerySouvenirsAccordion.selectionDesPhotosPubliquesParam', {
        param: galleryPhotos.length,
        count: galleryPhotos.length,
        s: galleryPhotos.length > 1 ? 's' : ''
      })}
      icon="📸"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="pt-1 text-left">
        <TabPublicGallery
          formData={formData}
          handleChange={handleChange}
          groupId={groupId}
          saving={saving}
        />
      </div>
    </CordelAccordion>
  );
}
