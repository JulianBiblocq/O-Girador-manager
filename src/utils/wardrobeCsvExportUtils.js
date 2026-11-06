/**
 * Utilitaires d'export CSV pour le Vestiaire et le Tableau des Mensurations
 * au format strict Excel France (UTF-8 avec BOM \uFEFF et séparateur point-virgule ';').
 */

/**
 * Échappe proprement une valeur de cellule CSV pour le séparateur point-virgule.
 *
 * @param {string|number} val Valeur brute de la cellule
 * @returns {string} Cellule échappée
 */
function escapeCsvCell(val) {
  const str = String(val ?? '').replace(/\r?\n/g, ' ').trim();
  if (str.includes(';') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Déclenche le téléchargement d'un fichier CSV encodé en UTF-8 avec BOM.
 *
 * @param {string[]} headers En-têtes des colonnes
 * @param {Array<Array<string|number>>} rows Lignes de données
 * @param {string} filenamePrefix Préfixe du nom de fichier
 */
function triggerCsvDownload(headers, rows, filenamePrefix) {
  const csvLines = [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map((row) => row.map(escapeCsvCell).join(';'))
  ];
  const csvContent = '\uFEFF' + csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporte le tableau des tailles et mensurations des membres filtrés en CSV.
 * Colonnes : Nom ; Prénom ; Pupitre ; Taille T-shirt ; Taille Pantalon ; Pointure / Mensurations déclarées
 *
 * @param {Array<Object>} members Liste des membres filtrés
 */
export function exportCostumeSizesToCsv(members = []) {
  const headers = [
    'Nom',
    'Prénom',
    'Pupitre',
    'Taille T-shirt',
    'Taille Pantalon',
    'Pointure / Mensurations déclarées'
  ];

  const rows = (members || []).map((u) => {
    const extraMeasures = [
      u.pointure ? `Pointure: ${u.pointure}` : '',
      u.mensurations ? String(u.mensurations) : '',
      u.tourDeTaille ? `Tour de taille: ${u.tourDeTaille}` : '',
      u.stature ? `Stature: ${u.stature}` : ''
    ]
      .filter(Boolean)
      .join(' | ');

    return [
      u.nom || '',
      u.prenom || '',
      u.instrumentPrincipal || u.instrument || 'Autre',
      u.tailleTshirt || 'Non renseigné',
      u.taillePantalon || 'Non renseigné',
      extraMeasures || '-'
    ];
  });

  triggerCsvDownload(headers, rows, 'mensurations_vestiaire');
}

/**
 * Exporte l'inventaire des pièces physiques et prêts du vestiaire en CSV.
 * Colonnes : Nom/Type de pièce ; Emplacement ; Taille ; État ; Statut ; Nom de l'emprunteur
 *
 * @param {Array<Object>} costumes Liste des pièces du vestiaire
 */
export function exportWardrobeInventoryToCsv(costumes = []) {
  const headers = [
    'Nom/Type de pièce',
    'Emplacement',
    'Taille',
    'État',
    'Statut',
    "Nom de l'emprunteur"
  ];

  const rows = (costumes || []).map((piece) => {
    const statutLabel =
      piece.statut === 'local'
        ? 'Au local'
        : piece.statut === 'emprunte'
        ? 'Emprunté'
        : piece.statut === 'reparation'
        ? 'En réparation'
        : piece.statut || '-';

    return [
      piece.type || piece.name || '-',
      piece.emplacement || '-',
      piece.taille || '-',
      piece.etat || '-',
      statutLabel,
      piece.statut === 'emprunte' ? piece.emprunteurNom || '-' : '-'
    ];
  });

  triggerCsvDownload(headers, rows, 'inventaire_vestiaire');
}

