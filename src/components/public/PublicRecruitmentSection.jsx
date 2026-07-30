import React from 'react';
import PublicRichText from './PublicRichText';

/**
 * Composant de la Section Publique de Recrutement.
 * Affiche un encart stylisé et mis en valeur lorsque la campagne de recrutement est activée par l'administrateur.
 *
 * @param {Object} props
 * @param {Object} props.publicTheme - Objet contenant la configuration dynamique de la vitrine.
 */
export default function PublicRecruitmentSection({ publicTheme }) {
  // Masquage conditionnel si l'option de recrutement n'est pas activée par l'administrateur
  if (!publicTheme?.afficherRecrutement) {
    return null;
  }

  const title = publicTheme.titreRecrutement || "Rejoignez la troupe !";
  const text = publicTheme.texteRecrutement || "";
  const linkUrl = publicTheme.lienRecrutement || "#";
  const buttonText = publicTheme.texteBoutonRecrutement || "S'inscrire sur HelloAsso";

  return (
    <section 
      id="recrutement" 
      className="py-14 border-b border-stone-200/60 relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--public-primary, #D32F2F) 7%, var(--public-bg, #FAF8F5) 93%)'
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-[var(--public-primary,#D32F2F)]/30 p-6 sm:p-10 shadow-lg flex flex-col items-center text-center gap-6 relative overflow-hidden transition-transform duration-200 hover:shadow-xl">
          
          {/* Badge d'en-tête de section */}
          <span 
            className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white shadow-xs flex items-center gap-2"
            style={{ 
              backgroundColor: 'var(--public-primary, #D32F2F)',
              fontFamily: 'var(--public-font-heading, sans-serif)' 
            }}
          >
            <span className="text-sm">🥁</span>
            <span>Appel à Recrutement</span>
          </span>

          {/* Titre de recrutement */}
          <h2 
            className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-3xl leading-tight"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: 'var(--public-primary, #D32F2F)'
            }}
          >
            {title}
          </h2>

          {/* Ligne de séparation stylisée */}
          <div 
            className="w-16 h-1 rounded-full opacity-80"
            style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
          ></div>

          {/* Message d'invitation au recrutement (PublicRichText) */}
          {text && (
            <PublicRichText 
              content={text}
              className="text-base sm:text-lg text-stone-700 max-w-3xl leading-relaxed font-medium"
              style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
            />
          )}

          {/* Gros Bouton d'Action (CTA) ouvrant le lien d'inscription dans un nouvel onglet */}
          {linkUrl && linkUrl !== '#' && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold uppercase tracking-wider text-white rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-white/20"
              style={{
                backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                color: 'var(--public-btn-text, #FFFFFF)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              <span>{buttonText}</span>
              <span className="text-xl leading-none">↗</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
