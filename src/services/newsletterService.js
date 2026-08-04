/**
 * Service d'exportation de newsletter vers l'endpoint API neutre.
 * Transmet le JSON structuré selon les spécifications standardisées.
 */

/**
 * Envoie le brouillon de la newsletter à l'endpoint /api/newsletter/export.
 * @param {Object} payload - Données de la newsletter (titre_campagne, message_accueil, prochaines_dates, evenements_passes)
 * @returns {Promise<Object>} Résultat de l'exportation
 */
export async function exportNewsletterDraft(payload) {
  try {
    const response = await fetch('/api/newsletter/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la génération du brouillon de newsletter');
    }

    return data;
  } catch (error) {
    console.error('NewsletterService - Erreur d\'exportation :', error);
    throw error;
  }
}
