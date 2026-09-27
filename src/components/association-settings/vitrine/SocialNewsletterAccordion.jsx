import React from 'react';
import CordelAccordion from '../../CordelAccordion';
import SocialLinksBlock from './SocialLinksBlock';
import NewsletterBrevoBlock from './NewsletterBrevoBlock';

/**
 * Accordéon 6 : Réseaux Sociaux & Newsletter
 * Gère les coordonnées de contact, les liens sociaux et la capture d'e-mails pour l'infolettre.
 */
export default function SocialNewsletterAccordion({
  formData = {},
  handleChange,
  groupId,
  saving,
  defaultOpen = false
}) {
  const publicTheme = formData.publicTheme || {};
  const vitrineTexts = publicTheme.vitrineTexts || {};

  const handleTextChange = (fieldKey, value) => {
    const updatedTexts = {
      ...(publicTheme.vitrineTexts || {}),
      [fieldKey]: value
    };
    handleChange('publicTheme', {
      ...publicTheme,
      vitrineTexts: updatedTexts
    });
  };

  return (
    <CordelAccordion
      title="Réseaux Sociaux & Newsletter"
      subtitle="Liens réseaux (Facebook, Instagram, etc.), formulaire d'infolettre et export d'abonnés"
      icon="✉️"
      defaultOpen={defaultOpen}
      className="mb-3"
    >
      <div className="flex flex-col gap-4 text-left pt-1">
        {/* Textes de la section Contact & Réseaux */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-cordel-bg-light border border-encre-noire/20 rounded-[4px_6px_3px_5px]">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Titre Contact & Réseaux</label>
            <input
              type="text"
              value={vitrineTexts.titreContactReseaux || ''}
              onChange={(e) => handleTextChange('titreContactReseaux', e.target.value)}
              disabled={saving}
              placeholder="Contact & Réseaux Sociaux"
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Bouton de Contact E-mail</label>
            <input
              type="text"
              value={vitrineTexts.boutonContactEmail || ''}
              onChange={(e) => handleTextChange('boutonContactEmail', e.target.value)}
              disabled={saving}
              placeholder="Contactez-nous pour programmer"
              className="text-xs font-bold px-2.5 py-1.5 border border-stone-300 rounded bg-white"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-stone-700">Phrase d'accroche Contact</label>
            <textarea
              rows={2}
              value={vitrineTexts.accrocheContactReseaux || ''}
              onChange={(e) => handleTextChange('accrocheContactReseaux', e.target.value)}
              disabled={saving}
              placeholder="Une question, un événement ou une prestation ? Contactez-nous ou suivez nos réseaux !"
              className="text-xs font-medium px-2.5 py-1.5 border border-stone-300 rounded bg-white resize-none"
            />
          </div>
        </div>

        {/* 1. Bloc Liens Réseaux Sociaux */}
        <SocialLinksBlock
          publicTheme={publicTheme}
          handleChange={handleChange}
          saving={saving}
        />

        {/* 2. Bloc Newsletter & API Brevo */}
        <NewsletterBrevoBlock
          publicTheme={publicTheme}
          handleChange={handleChange}
          groupId={groupId}
          saving={saving}
        />
      </div>
    </CordelAccordion>
  );
}
