import React from 'react';
import PublicRichText from './PublicRichText';

/**
 * Composant de la Section Publique "Vie Associative & Organisation" (Notre Quotidien).
 * Affiche une mise en page chaleureuse expliquant le fonctionnement hebdomadaire du groupe 
 * (ateliers, répétitions, fabrication d'instruments, chant, etc.).
 *
 * @param {Object} props
 * @param {Object} props.publicTheme - Configuration dynamique du thème vitrine
 */
export default function PublicVieAssociativeSection({ publicTheme }) {
  const content = publicTheme?.texteVieAssociative || '';
  const vitrineTexts = publicTheme?.vitrineTexts || {};
  const badgeVieAssociative = vitrineTexts.badgeVieAssociative || "Notre Quotidien";
  const titreVieAssociative = vitrineTexts.titreVieAssociative || "Vie Associative & Organisation";

  // Si aucun contenu n'a été renseigné par l'administrateur, masquage élégant de la section
  if (!content || !content.trim()) {
    return null;
  }

  return (
    <section 
      id="vie-associative" 
      className="py-16 sm:py-20 border-b border-stone-200/60 relative overflow-hidden transition-all duration-300 bg-[#FAF6EE]/90"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col gap-8">
        
        {/* En-tête de section */}
        <div className="text-center flex flex-col items-center gap-3">
          <span 
            className="text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full text-white shadow-xs flex items-center gap-2"
            style={{ 
              backgroundColor: 'var(--public-secondary, #1976D2)',
              fontFamily: 'var(--public-font-heading, sans-serif)' 
            }}
          >
            <span className="text-sm">🌿</span>
            <span>{badgeVieAssociative}</span>
          </span>

          <h2 
            className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: 'var(--public-primary, #D32F2F)' 
            }}
          >
            {titreVieAssociative}
          </h2>

          <div 
            className="w-20 h-1 rounded-full"
            style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
          ></div>
        </div>

        {/* Card Conteneur avec mise en page aérée et chaleureuse */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-stone-300/70 p-6 sm:p-10 shadow-md relative overflow-hidden">
          <PublicRichText 
            content={content}
            className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-4xl mx-auto font-medium"
            style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
          />
        </div>
      </div>
    </section>
  );
}
