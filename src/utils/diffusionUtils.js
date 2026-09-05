/**
 * Utilitaires et fonctions pures pour le Pôle Diffusion (Produção & Prestations).
 */

/**
 * Helper de tolérance et réconciliation des statuts pour le Pôle Diffusion.
 * Permet de faire cohabiter les statuts pivots et leurs déclinaisons d'action.
 *
 * @param {string} gigStatus Statut actuel du dossier de prestation
 * @param {string} targetStatus Étape pivot ciblée (ex: '4_contrat')
 * @returns {boolean} Vrai si le statut correspond à l'étape
 */
export const matchesGigStatus = (gigStatus, targetStatus) => {
  if (gigStatus === targetStatus) return true;
  if (targetStatus === '3_devis' && gigStatus === '3_devis_envoye') return true;
  if (targetStatus === '2_option' && gigStatus === '2_option_posee') return true;
  if (targetStatus === '4_contrat' && gigStatus === '4_contrat_envoye') return true;
  if (targetStatus === '5_facture' && gigStatus === '5_facture_emise') return true;
  if (targetStatus === '6_paye' && gigStatus === '6_valide') return true;
  return false;
};

/**
 * Calculateur du badge d'alerte "À relancer" (relance dépassée ou prévue dans les 7 jours)
 *
 * @param {string} dateRelanceStr Date de relance au format YYYY-MM-DD
 * @returns {boolean} Vrai si la relance est échue ou imminente
 */
export const isToRelance = (dateRelanceStr) => {
  if (!dateRelanceStr) return false;
  const relanceDate = new Date(dateRelanceStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  return relanceDate <= in7Days;
};
