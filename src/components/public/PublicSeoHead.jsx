import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Composant de Référencement SEO Dynamique et d'Injection Forcée de la Marque "O Girador" (Stratégie Écosystème).
 * 
 * Injecte dynamiquement dans le <head> du document HTML les balises <title>, <meta> et Open Graph
 * à partir des données de l'association, tout en appliquant les contraintes non-éditables d'écosystème SaaS :
 * 1. Suffixe " | O Girador" forcé sur le titre.
 * 2. Concaténation obligatoire des mots-clés de la plateforme O Girador.
 * 3. Balises <meta name="generator" content="O Girador" /> et <meta name="author" content="O Girador" /> non-éditables.
 * 4. Open Graph avec og:site_name = "O Girador" et og:image liée à l'image de couverture Hero ou Logo.
 * 
 * @param {Object} props
 * @param {Object} props.publicTheme - Données de configuration dynamique du thème vitrine
 * @param {string} [props.associationName] - Nom de l'association
 * @param {Object} [props.branding] - Identité visuelle (logo)
 */
export default function PublicSeoHead({ publicTheme = {}, associationName = '', branding = {} }) {
  // 1. Titre Google avec suffixe forcé " | O Girador"
  const rawTitle = publicTheme?.seoTitle?.trim() || associationName || "Notre Association";
  const displayTitle = rawTitle.includes("O Girador") ? rawTitle : `${rawTitle} | O Girador`;

  // 2. Méta-description
  const displayDescription = publicTheme?.seoDescription?.trim() 
    || publicTheme?.publicCatchphrase?.trim() 
    || "Découvrez notre association sur O Girador, la plateforme dédiée aux groupes de Maracatu et percussions brésiliennes.";

  // 3. Concaténation forcée des mots-clés avec la marque O Girador & les piliers écosystème
  const userKeywords = publicTheme?.seoKeywords ? publicTheme.seoKeywords.trim() : "";
  const forcedSaasKeywords = "O Girador, application de gestion associative, séquenceur musical, site vitrine, percussions brésiliennes, maracatu";
  const finalKeywords = userKeywords ? `${userKeywords}, ${forcedSaasKeywords}` : forcedSaasKeywords;

  // 4. Image de couverture Open Graph (og:image)
  const ogImage = publicTheme?.publicHeroImage || branding?.logoUrl || '/Pictures/logo-samambaia.png';

  return (
    <Helmet>
      {/* Balise Title & Description Google */}
      <title>{displayTitle}</title>
      <meta name="description" content={displayDescription} />
      <meta name="keywords" content={finalKeywords} />

      {/* Balises Non-Éditables Forcées (Contrainte Écosystème O Girador) */}
      <meta name="generator" content="O Girador" />
      <meta name="author" content="O Girador" />

      {/* Balises Open Graph (Partage Réseaux Sociaux : Facebook, WhatsApp, LinkedIn, X...) */}
      <meta property="og:title" content={displayTitle} />
      <meta property="og:description" content={displayDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="O Girador" />
    </Helmet>
  );
}
