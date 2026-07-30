import React from 'react';
import DOMPurify from 'dompurify';

/**
 * Composant de rendu de texte riche sécurisé pour la Vitrine publique.
 * Sanitise le contenu HTML avec DOMPurify pour se prémunir contre les failles XSS,
 * tout en conservant une rétro-compatibilité fluide pour le texte brut.
 *
 * @param {Object} props
 * @param {string} props.content - Le contenu HTML ou texte brut à afficher.
 * @param {string} [props.className] - Classes Tailwind additionnelles.
 * @param {Object} [props.style] - Styles en ligne sémantiques.
 */
export default function PublicRichText({ content, className = '', style = {} }) {
  if (!content || typeof content !== 'string') {
    return null;
  }

  // Détection des balises HTML dans le texte
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtmlTags) {
    // Sanitisation HTML sécurisée avec DOMPurify
    const cleanHtml = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'ul', 'ol', 'li', 'a', 'br', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style']
    });

    return (
      <div
        className={`public-rich-text ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  // Rendu de secours pour le texte brut classique avec sauts de ligne
  return (
    <div className={`whitespace-pre-line ${className}`} style={style}>
      {content}
    </div>
  );
}
