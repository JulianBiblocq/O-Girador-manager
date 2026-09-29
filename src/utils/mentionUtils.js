/**
 * Utilitaires pour le traitement des mentions dans le forum et la messagerie
 * Découpage modulaire respectant la règle anti-monolithe et utilisable en Node / ESM pur.
 */

/**
 * Extrait la requête de mention (@texte) située immédiatement avant le curseur.
 *
 * @param {string} text Texte complet de l'input ou du champ
 * @param {number} cursorIndex Position actuelle du curseur
 * @returns {{ query: string, start: number, end: number } | null}
 */
export function getMentionQueryAtCursor(text, cursorIndex) {
  if (typeof text !== 'string' || cursorIndex === undefined || cursorIndex === null) return null;
  const beforeCursor = text.slice(0, cursorIndex);
  const match = beforeCursor.match(/(?:^|\s)@([a-zA-ZÀ-ÿ0-9_-]*)$/);
  if (!match) return null;

  const query = match[1];
  // Calcul de la position du symbole '@'
  const atIndex = beforeCursor.length - query.length - 1;
  return {
    query,
    start: atIndex,
    end: cursorIndex
  };
}

/**
 * Filtre les membres selon la chaîne de recherche tapée après le '@'.
 *
 * @param {Array<object>} allUsers Liste des membres de l'association
 * @param {string} query Texte tapé (insensible à la casse et aux accents)
 * @param {number} maxResults Nombre maximum de suggestions à renvoyer
 * @returns {Array<object>} Liste filtrée des membres suggérés
 */
export function filterUsersByMentionQuery(allUsers = [], query = '', maxResults = 6) {
  if (!Array.isArray(allUsers) || allUsers.length === 0) return [];
  const cleanQuery = (query || '').toLowerCase().trim();

  return allUsers
    .filter((user) => {
      if (!user) return false;
      const prenom = (user.prenom || '').toLowerCase();
      const nom = (user.nom || '').toLowerCase();
      const apelido = (user.apelido || user.surnom || '').toLowerCase();
      const fullName = `${prenom} ${nom}`.trim();

      if (!cleanQuery) return true; // Si juste '@', proposer les premiers membres
      return (
        prenom.includes(cleanQuery) ||
        nom.includes(cleanQuery) ||
        fullName.includes(cleanQuery) ||
        apelido.includes(cleanQuery)
      );
    })
    .slice(0, maxResults);
}

/**
 * Extrait les identifiants d'utilisateurs mentionnés dans un texte contenant des mentions @Prénom Nom.
 *
 * @param {string} text Contenu du message
 * @param {Array<object>} allUsers Liste des membres
 * @returns {Array<string>} Liste unique des IDs de membres mentionnés
 */
export function extractMentionedUserIds(text = '', allUsers = []) {
  if (!text || !Array.isArray(allUsers)) return [];
  const cleanText = text.toLowerCase();
  const mentionedIds = new Set();

  allUsers.forEach((user) => {
    if (!user || !user.id) return;
    const prenom = (user.prenom || '').toLowerCase().trim();
    const nom = (user.nom || '').toLowerCase().trim();
    const apelido = (user.apelido || user.surnom || '').toLowerCase().trim();

    if (prenom && nom && cleanText.includes(`@${prenom} ${nom}`)) {
      mentionedIds.add(user.id);
    } else if (apelido && cleanText.includes(`@${apelido}`)) {
      mentionedIds.add(user.id);
    } else if (prenom && cleanText.includes(`@${prenom}`)) {
      mentionedIds.add(user.id);
    }
  });

  return Array.from(mentionedIds);
}
