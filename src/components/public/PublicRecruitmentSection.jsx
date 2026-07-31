import React from 'react';
import PublicRichText from './PublicRichText';

// Formules d'adhésion par défaut si l'administrateur n'a pas configuré de cartes personnalisées
const DEFAULT_FORMULES = [
  {
    id: 'percussion',
    titre: 'Formule Percussion',
    icone: '🥁',
    description: 'Ateliers hebdomadaires de percussion maracatu (Alfaia, Caixa, Gonguê, Agbê, Mineiro).',
    tarif: 'Adhésion annuelle',
    avantages: ['Prêt des instruments inclus', 'Accès aux répétitions & prestations', 'Apprentissage des rythmes et de la technique']
  },
  {
    id: 'danse',
    titre: 'Formule Danse & Chant',
    icone: '💃',
    description: 'Ateliers de danse traditionnelle brésilienne, expression scénique et chant polyphonique.',
    tarif: 'Adhésion annuelle',
    avantages: ['Développement corporel & chorégraphies', 'Accès aux costumes et sorties scéniques', 'Ouvert à tous niveaux']
  },
  {
    id: 'complete',
    titre: 'Formule Complète',
    icone: '✨',
    description: 'Accès illimité à l\'ensemble des ateliers de percussion, de danse, de chant et aux stages.',
    tarif: 'Tarif préférentiel',
    avantages: ['Accès à tous les ateliers de la semaine', 'Participation prioritaire aux stages', 'Immersion totale dans la culture Maracatu']
  }
];

/**
 * Composant de la Section Publique de Recrutement & Formules d'Adhésion.
 * Affiche un encart attrayant avec les cartes de formules (Danse, Percussion, etc.) 
 * et un appel à l'action principal d'inscription / d'essai.
 *
 * @param {Object} props
 * @param {Object} props.publicTheme - Objet de configuration dynamique du thème vitrine.
 */
export default function PublicRecruitmentSection({ publicTheme }) {
  // Masquage si la section a été désactivée par l'administrateur
  if (publicTheme?.afficherRecrutement === false) {
    return null;
  }

  const vitrineTexts = publicTheme?.vitrineTexts || {};
  const badgeRecrutement = vitrineTexts.badgeRecrutement || "Nous Rejoindre";
  const title = vitrineTexts.titreRecrutement || publicTheme.titreRecrutement || "Rejoignez la troupe !";
  const text = vitrineTexts.accrocheRecrutement || publicTheme.texteRecrutement || "Rejoignez nos ateliers hebdomadaires et participez à une aventure musicale et humaine unique !";
  const linkUrl = publicTheme.lienRecrutement || "#";
  const buttonText = publicTheme.texteBoutonRecrutement || "S'inscrire sur HelloAsso";

  // Récupération des formules configurées ou des formules par défaut
  const hasConfiguredFormules = Array.isArray(publicTheme.formulesRecrutement) && publicTheme.formulesRecrutement.length > 0;
  const formules = hasConfiguredFormules ? publicTheme.formulesRecrutement : DEFAULT_FORMULES;

  return (
    <section 
      id="recrutement" 
      className="py-16 sm:py-20 border-b border-stone-200/60 relative overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--public-primary, #D32F2F) 5%, var(--public-bg, #FAF8F5) 95%)'
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col gap-12">
        
        {/* En-tête de la section Recrutement */}
        <div className="flex flex-col items-center text-center gap-4">
          <span 
            className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white shadow-xs flex items-center gap-2"
            style={{ 
              backgroundColor: 'var(--public-primary, #D32F2F)',
              fontFamily: 'var(--public-font-heading, sans-serif)' 
            }}
          >
            <span className="text-sm">📣</span>
            <span>{badgeRecrutement}</span>
          </span>

          <h2 
            className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight uppercase"
            style={{ 
              fontFamily: 'var(--public-font-heading, sans-serif)',
              color: 'var(--public-primary, #D32F2F)'
            }}
          >
            {title}
          </h2>

          <div 
            className="w-20 h-1 rounded-full opacity-80"
            style={{ backgroundColor: 'var(--public-secondary, #1976D2)' }}
          ></div>

          {/* Message d'invitation au recrutement (PublicRichText) */}
          {text && (
            <PublicRichText 
              content={text}
              className="text-base sm:text-lg text-stone-700 max-w-3xl leading-relaxed font-medium mt-2"
              style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
            />
          )}
        </div>

        {/* Grille des Cartes des Formules d'Adhésion */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {formules.map((formule, idx) => (
            <div 
              key={formule.id || idx}
              className="bg-white rounded-2xl border-2 border-stone-200 p-6 sm:p-7 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden"
            >
              <div className="flex flex-col gap-4">
                {/* Icône & Titre de la formule */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs shrink-0"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--public-primary, #D32F2F) 12%, #FFFFFF 88%)' }}
                  >
                    {formule.icone || '🥁'}
                  </div>
                  <div className="flex flex-col text-left">
                    <h3 
                      className="text-lg font-bold leading-snug"
                      style={{ 
                        fontFamily: 'var(--public-font-heading, sans-serif)',
                        color: 'var(--public-primary, #D32F2F)' 
                      }}
                    >
                      {formule.titre}
                    </h3>
                    {formule.tarif && (
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                        {formule.tarif}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description de la formule */}
                {formule.description && (
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium text-left border-t border-dashed border-stone-200 pt-3">
                    {formule.description}
                  </p>
                )}

                {/* Liste des Avantages / Inclus */}
                {Array.isArray(formule.avantages) && formule.avantages.length > 0 && (
                  <ul className="flex flex-col gap-2 text-left pt-2">
                    {formule.avantages.map((avantage, aIdx) => (
                      <li key={aIdx} className="text-xs text-stone-700 font-medium flex items-start gap-2">
                        <span className="text-emerald-700 font-bold text-sm shrink-0">✓</span>
                        <span>{avantage}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Bouton d'action individuel pour la formule si présent */}
              <div className="pt-4 border-t border-stone-100">
                <a
                  href={linkUrl && linkUrl !== '#' ? linkUrl : '#newsletter-inscription'}
                  target={linkUrl && linkUrl !== '#' ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-800 bg-stone-100 rounded-lg hover:bg-[var(--public-primary,#D32F2F)] hover:text-white transition-colors duration-200 flex items-center justify-center gap-1.5"
                  style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
                >
                  <span>Choisir cette formule</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Gros Bouton d'Action (Call to Action Principal) sous les cartes */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {linkUrl && linkUrl !== '#' ? (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold uppercase tracking-wider text-white rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-white/20"
              style={{
                backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                color: 'var(--public-btn-text, #FFFFFF)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              <span>{buttonText}</span>
              <span className="text-xl leading-none">↗</span>
            </a>
          ) : (
            <a
              href="#newsletter-inscription"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold uppercase tracking-wider text-white rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-white/20"
              style={{
                backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                color: 'var(--public-btn-text, #FFFFFF)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              <span>💬 Nous contacter pour un essai gratuit</span>
              <span className="text-xl leading-none">✉️</span>
            </a>
          )}
        </div>

      </div>
    </section>
  );
}
