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
  // État local pour l'ouverture de la modale "En savoir plus"
  const [selectedFormuleModal, setSelectedFormuleModal] = React.useState(null);

  // Masquage si la section a été désactivée par l'administrateur
  if (publicTheme?.afficherRecrutement === false) {
    return null;
  }

  const vitrineTexts = publicTheme?.vitrineTexts || {};
  const badgeRecrutement = vitrineTexts.badgeRecrutement || "Nous Rejoindre";
  const title = vitrineTexts.titreRecrutement || publicTheme?.titreRecrutement || "Rejoignez la troupe !";
  const text = vitrineTexts.accrocheRecrutement || publicTheme?.texteRecrutement || "Rejoignez nos ateliers hebdomadaires et participez à une aventure musicale humaine unique.";
  const configuredLink = publicTheme?.lienRecrutement?.trim() || "";
  const contactEmail = publicTheme?.publicContactEmail?.trim() || publicTheme?.officialEmail?.trim() || "";
  const showRecrutementCtaIcon = publicTheme?.showRecrutementCtaIcon !== false;
  const activerHelloAssoRecrutement = publicTheme?.activerHelloAssoRecrutement !== false;

  // Calcul du lien dynamique général
  let effectiveLink = configuredLink 
    ? configuredLink 
    : (contactEmail ? `mailto:${contactEmail}?subject=Demande%20d'Adhesion` : "#recrutement");

  // Masquage strict si HelloAsso est désactivé et que le lien était un lien HelloAsso
  const isHelloAssoLink = effectiveLink.toLowerCase().includes('helloasso');
  if (!activerHelloAssoRecrutement && isHelloAssoLink) {
    effectiveLink = contactEmail ? `mailto:${contactEmail}?subject=Demande%20d'Adhesion` : "";
  }

  const rawButtonText = publicTheme?.texteBoutonRecrutement?.trim() || "";
  let buttonText = rawButtonText;
  if (!buttonText || (!activerHelloAssoRecrutement && buttonText.toLowerCase().includes('helloasso'))) {
    buttonText = contactEmail ? "Nous contacter pour s'inscrire" : "Rejoindre l'association";
  }

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col gap-12 text-left">
        
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
          {formules.map((formule, idx) => {
            const bgImg = formule.backgroundImageUrl || formule.imageUrl;
            const hasBgImage = Boolean(bgImg);
            const cardButtonText = formule.boutonText || "En savoir plus";

            return (
              <div 
                key={formule.id || idx}
                className={`rounded-2xl border-2 p-6 sm:p-7 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden ${
                  hasBgImage
                    ? 'border-stone-400/30 bg-stone-900 text-white'
                    : 'bg-white/95 border-stone-200 text-stone-900'
                }`}
              >
                {/* Image d'arrière-plan */}
                {hasBgImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{
                      backgroundImage: `url(${bgImg})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                )}

                {/* Couche d'assombrissement */}
                {hasBgImage && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] pointer-events-none z-0" />
                )}

                {/* Contenu de la Carte */}
                <div className="flex flex-col gap-4 relative z-10">
                  {/* Icône & Titre de la formule */}
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs shrink-0 ${
                        hasBgImage ? 'bg-white/20 backdrop-blur-md text-white border border-white/30' : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {formule.icone || '🥁'}
                    </div>
                    <div className="flex flex-col text-left">
                      <h3 
                        className={`text-lg font-bold leading-snug ${hasBgImage ? 'text-white drop-shadow-sm' : ''}`}
                        style={{ 
                          fontFamily: 'var(--public-font-heading, sans-serif)',
                          color: hasBgImage ? '#FFFFFF' : 'var(--public-primary, #D32F2F)' 
                        }}
                      >
                        {formule.titre}
                      </h3>
                      {formule.tarif && (
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          hasBgImage ? 'text-amber-300' : 'text-stone-500'
                        }`}>
                          {formule.tarif}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description courte avec rendu riche sécurisé */}
                  {formule.description && (
                    <div className={`text-xs sm:text-sm leading-relaxed font-medium text-left border-t border-dashed pt-3 ${
                      hasBgImage ? 'text-stone-200 border-white/20' : 'text-stone-600 border-stone-200'
                    }`}>
                      <PublicRichText 
                        content={formule.description} 
                        className={hasBgImage ? '[&_strong]:text-white [&_b]:text-white [&_a]:text-amber-300 [&_li::marker]:text-emerald-400' : ''}
                      />
                    </div>
                  )}

                  {/* Liste des Avantages */}
                  {Array.isArray(formule.avantages) && formule.avantages.length > 0 && (
                    <ul className="flex flex-col gap-2 text-left pt-2">
                      {formule.avantages.map((avantage, aIdx) => (
                        <li key={aIdx} className={`text-xs font-medium flex items-start gap-2 ${
                          hasBgImage ? 'text-stone-100' : 'text-stone-700'
                        }`}>
                          <span className={`font-bold text-sm shrink-0 ${
                            hasBgImage ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>✓</span>
                          <span>{avantage}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Bouton d'action "En savoir plus" ouvrant la modale */}
                <div className={`pt-4 border-t relative z-10 ${hasBgImage ? 'border-white/20' : 'border-stone-100'}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedFormuleModal(formule)}
                    className={`w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                      hasBgImage
                        ? 'bg-white text-stone-900 hover:bg-amber-400 hover:text-stone-950 font-extrabold'
                        : 'bg-stone-100 text-stone-800 hover:bg-[var(--public-primary,#D32F2F)] hover:text-white'
                    }`}
                    style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
                  >
                    <span>🔍 {cardButtonText}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gros Bouton d'Action (Call to Action Principal) sous les cartes */}
        {effectiveLink && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={effectiveLink}
              target={effectiveLink.startsWith('http') ? "_blank" : "_self"}
              rel={effectiveLink.startsWith('http') ? "noopener noreferrer" : undefined}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold uppercase tracking-wider text-white rounded-xl shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer border border-white/20"
              style={{
                backgroundColor: 'var(--public-btn-bg, var(--public-primary, #D32F2F))',
                color: 'var(--public-btn-text, #FFFFFF)',
                fontFamily: 'var(--public-font-heading, sans-serif)'
              }}
            >
              <span>{buttonText}</span>
              {showRecrutementCtaIcon && <span className="text-xl leading-none">↗</span>}
            </a>
          </div>
        )}

      </div>

      {/* ========================================== */}
      {/* MODALE DÉTAILLÉE "EN SAVOIR PLUS"          */}
      {/* ========================================== */}
      {selectedFormuleModal && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div 
            className="w-full max-w-2xl bg-[#FAF6EE] text-stone-900 border-2 border-stone-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
            style={{ fontFamily: 'var(--public-font-body, sans-serif)' }}
          >
            {/* En-tête de la modale */}
            <div className="p-5 sm:p-6 bg-white border-b-2 border-stone-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedFormuleModal.icone || '🥁'}</span>
                <div className="flex flex-col text-left">
                  <h3 
                    className="text-xl sm:text-2xl font-black uppercase tracking-tight text-stone-900"
                    style={{ fontFamily: 'var(--public-font-heading, sans-serif)' }}
                  >
                    {selectedFormuleModal.titre}
                  </h3>
                  {selectedFormuleModal.tarif && (
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shrink-0 w-fit">
                      {selectedFormuleModal.tarif}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFormuleModal(null)}
                className="w-9 h-9 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-800 font-black text-base flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Corps de la modale (Défilant) */}
            <div className="p-5 sm:p-7 flex flex-col gap-6 overflow-y-auto text-left">
              
              {/* Photo HD d'illustration ou photo de couverture */}
              {(selectedFormuleModal.modalImageUrl || selectedFormuleModal.backgroundImageUrl || selectedFormuleModal.imageUrl) && (
                <div className="relative w-full max-h-72 rounded-xl overflow-hidden border-2 border-stone-300 shadow-md bg-stone-900">
                  <img
                    src={selectedFormuleModal.modalImageUrl || selectedFormuleModal.backgroundImageUrl || selectedFormuleModal.imageUrl}
                    alt={selectedFormuleModal.titre}
                    className="w-full h-full object-cover max-h-72"
                  />
                </div>
              )}

              {/* Description courte */}
              {selectedFormuleModal.description && (
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Présentation générale</h4>
                  <PublicRichText 
                    content={selectedFormuleModal.description}
                    className="text-sm sm:text-base font-semibold leading-relaxed text-stone-800"
                  />
                </div>
              )}

              {/* Description détaillée longue */}
              {selectedFormuleModal.descriptionDetaillee && (
                <div className="flex flex-col gap-1.5 p-4 bg-white border border-stone-300 rounded-xl shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-dashed border-stone-200 pb-1 flex items-center gap-1.5">
                    <span>📑 Informations Détaillées & Déroulement</span>
                  </h4>
                  <PublicRichText 
                    content={selectedFormuleModal.descriptionDetaillee}
                    className="text-xs sm:text-sm text-stone-700 leading-relaxed pt-1"
                  />
                </div>
              )}

              {/* Avantages & Inclus */}
              {Array.isArray(selectedFormuleModal.avantages) && selectedFormuleModal.avantages.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Ce qui est inclus dans cette formule :</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedFormuleModal.avantages.map((av, aIdx) => (
                      <li key={aIdx} className="text-xs sm:text-sm font-medium text-stone-800 flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                        <span className="text-emerald-700 font-black text-sm">✓</span>
                        <span>{av}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Pied de modale / Bouton d'action final */}
            <div className="p-4 sm:p-5 bg-white border-t-2 border-stone-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedFormuleModal(null)}
                className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-all cursor-pointer"
              >
                Fermer
              </button>

              {/* Action d'inscription conditionnée par activerHelloAssoRecrutement */}
              {(() => {
                const formulaLink = selectedFormuleModal.lienHelloAsso?.trim() || selectedFormuleModal.lien?.trim() || configuredLink;
                const formulaIsHelloAsso = formulaLink.toLowerCase().includes('helloasso');
                const canShowLink = formulaLink && (!formulaIsHelloAsso || activerHelloAssoRecrutement);

                if (canShowLink) {
                  const modalBtnLabel = formulaIsHelloAsso ? "S'inscrire sur HelloAsso" : "S'inscrire en ligne";
                  return (
                    <a
                      href={formulaLink}
                      target={formulaLink.startsWith('http') ? "_blank" : "_self"}
                      rel={formulaLink.startsWith('http') ? "noopener noreferrer" : undefined}
                      className="px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{modalBtnLabel}</span>
                      <span>↗</span>
                    </a>
                  );
                }

                // Fallback de contact direct si HelloAsso est désactivé ou lien non configuré
                return (
                  <a
                    href={contactEmail ? `mailto:${contactEmail}?subject=Inscription%20-${encodeURIComponent(selectedFormuleModal.titre)}` : "#recrutement"}
                    onClick={() => {
                      if (!contactEmail) setSelectedFormuleModal(null);
                    }}
                    className="px-6 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-white bg-amber-800 hover:bg-amber-900 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{contactEmail ? "Nous contacter pour faire un essai" : "Fermer & Nous contacter"}</span>
                  </a>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

