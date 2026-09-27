import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import TabPublicGallery from '../TabPublicGallery';

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
  const publicTheme = formData.publicTheme || {};
  const galleryPhotos = Array.isArray(publicTheme.galleryPhotos) ? publicTheme.galleryPhotos : [];

  return (
    <CordelAccordion
      title="Galerie & Souvenirs"
      subtitle={`Sélection des photos publiques (${galleryPhotos.length} photo${galleryPhotos.length > 1 ? 's' : ''} en ligne)`}
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
