/**
 * Analyseur syntaxique léger pour les livrets de commissions publiés au Varal.
 * Extrait la mission, les jalons (statuts, échéances, notes multilignes) et les sections complémentaires.
 * Conforme à la règle anti-monolithe et francisation de la base de code.
 */

/**
 * Découpe et extrait les sections d'un texte Markdown de commission.
 * @param {string} markdownText Contenu textuel Markdown brut
 * @returns {{ description: string, jalons: Array<Object>, sections: Array<Object> }}
 */
export function parseCommissionMarkdown(markdownText = '') {
  if (!markdownText || typeof markdownText !== 'string') {
    return { description: '', jalons: [], sections: [] };
  }

  const rawLines = markdownText.split('\n');
  let currentSection = 'header';
  const descriptionLines = [];
  const jalons = [];
  let currentJalon = null;
  const otherSections = [];
  let currentOtherSection = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Détection des séparateurs de sections Markdown de second niveau
    if (trimmed.startsWith('## ')) {
      if (currentJalon) {
        jalons.push(currentJalon);
        currentJalon = null;
      }
      if (currentOtherSection) {
        otherSections.push(currentOtherSection);
        currentOtherSection = null;
      }

      const headerTitle = trimmed.replace(/^##\s+/, '').trim();
      const lower = headerTitle.toLowerCase();
      if (lower.includes('mission') || lower.includes('description') || lower.includes('objectif')) {
        currentSection = 'description';
      } else if (lower.includes('jalon') || lower.includes('rétro') || lower.includes('dates')) {
        currentSection = 'jalons';
      } else {
        currentSection = 'other';
        currentOtherSection = { title: headerTitle, lines: [] };
      }
      continue;
    }

    if (currentSection === 'description') {
      if (trimmed.startsWith('---')) continue;
      descriptionLines.push(line);
    } else if (currentSection === 'jalons') {
      // Détection de ligne principale d'un jalon (ex: - [x] **Titre** [✅ Fait] (Butoir : 2026-10-15))
      const jalonMatch = trimmed.match(/^[-*]\s*\[([ xX~⏳])\]\s*(.*)$/);
      if (jalonMatch) {
        if (currentJalon) {
          jalons.push(currentJalon);
        }
        const checkChar = jalonMatch[1];
        const rest = jalonMatch[2];

        // Extraction du titre entre doubles astérisques ou texte brut
        let titre = rest;
        let restWithoutTitle = rest;
        const titleMatch = rest.match(/^\*\*(.*?)\*\*(.*)$/);
        if (titleMatch) {
          titre = titleMatch[1].trim();
          restWithoutTitle = titleMatch[2].trim();
        }

        // Résolution du statut Cordel sémantique
        let status = 'a_faire';
        let statusLabel = 'À faire';
        if (checkChar.toLowerCase() === 'x' || restWithoutTitle.includes('✅') || restWithoutTitle.includes('Fait')) {
          status = 'fait';
          statusLabel = 'Terminé';
        } else if (checkChar === '~' || checkChar === '⏳' || restWithoutTitle.includes('⏳') || restWithoutTitle.includes('En cours')) {
          status = 'en_cours';
          statusLabel = 'En cours';
        }

        // Date cible / Butoir éventuel
        let deadline = null;
        const deadlineMatch = restWithoutTitle.match(/\((?:Butoir|Date butoir|Échéance)\s*:\s*([^)]+)\)/i);
        if (deadlineMatch) {
          deadline = deadlineMatch[1].trim();
        }

        currentJalon = {
          titre,
          status,
          statusLabel,
          deadline,
          notesLines: []
        };
      } else if (currentJalon) {
        if (trimmed.startsWith('---')) {
          jalons.push(currentJalon);
          currentJalon = null;
          continue;
        }
        // Retrait de la citation blockquote ">" ou de l'indentation
        let cleanedNoteLine = line;
        if (/^\s*>\s?/.test(line)) {
          cleanedNoteLine = line.replace(/^\s*>\s?/, '');
        } else if (/^\s{2,4}/.test(line)) {
          cleanedNoteLine = line.replace(/^\s{2,4}/, '');
        }
        currentJalon.notesLines.push(cleanedNoteLine);
      }
    } else if (currentSection === 'other' && currentOtherSection) {
      if (trimmed.startsWith('---')) continue;
      currentOtherSection.lines.push(line);
    }
  }

  if (currentJalon) jalons.push(currentJalon);
  if (currentOtherSection) otherSections.push(currentOtherSection);

  const formattedJalons = jalons.map((j) => ({
    titre: j.titre,
    status: j.status,
    statusLabel: j.statusLabel,
    deadline: j.deadline,
    notes: j.notesLines.join('\n').trim()
  }));

  return {
    description: descriptionLines.join('\n').trim(),
    jalons: formattedJalons,
    sections: otherSections
  };
}

/**
 * Normalise les données d'un livret de commission à afficher dans le Varal.
 * @param {Object} docItem Document Varal issu de Firestore
 * @returns {{ description: string, jalons: Array<Object>, sections: Array<Object>, rawContent: string }}
 */
export function getCommissionBookletData(docItem = {}) {
  const rawContent = docItem.contenu || docItem.texte || '';
  const parsed = parseCommissionMarkdown(rawContent);

  // Fallback sur commissionData si les jalons n'étaient pas dans le markdown
  if ((!parsed.jalons || parsed.jalons.length === 0) && Array.isArray(docItem.commissionData?.jalons)) {
    parsed.jalons = docItem.commissionData.jalons.map((j) => ({
      titre: j.titre || 'Jalon',
      status: j.status === 'fait' ? 'fait' : j.status === 'en_cours' ? 'en_cours' : 'a_faire',
      statusLabel: j.status === 'fait' ? 'Terminé' : j.status === 'en_cours' ? 'En cours' : 'À faire',
      deadline: j.deadline || null,
      notes: (j.notes || j.description || j.details || '').trim()
    }));
  }

  if (!parsed.description && docItem.commissionData?.description) {
    parsed.description = docItem.commissionData.description.trim();
  }

  return { ...parsed, rawContent };
}
