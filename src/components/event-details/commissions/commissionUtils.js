/**
 * Utilitaires pour la gestion des commissions d'événements (Bloc 1)
 * Calculs mémoïsés, statuts et valeurs par défaut.
 */

export const MODULES_COMMISSION_DISPONIBLES = [
  { id: 'jalons', label: 'Jalons & Rétro-planning', icone: '🎯' },
  { id: 'budget', label: 'Budget & Dépenses', icone: '💰' },
  { id: 'benevoles', label: 'Bénévoles Jour J', icone: '🤝' },
  { id: 'materiel', label: 'Matériel & Outillage', icone: '📦' },
  { id: 'fiches', label: 'Fiches pratiques', icone: '📄' }
];

export const NEXT_JALON_STATUS = {
  a_faire: 'en_cours',
  en_cours: 'fait',
  fait: 'a_faire'
};

export const STATUS_ARBITRAGE_LABELS = {
  en_etude: 'En étude',
  en_attente: 'En attente d’arbitrage',
  valide: 'Validé',
  rejete: 'Refusé'
};

/**
 * Calcule le taux d'avancement d'une commission (jalons validés)
 */
export function calculateCommissionProgress(commission) {
  const jalons = commission?.jalons || [];
  if (!jalons.length) return 0;
  const completed = jalons.filter((j) => j.status === 'fait').length;
  return Math.round((completed / jalons.length) * 100);
}

/**
 * Calcule les indicateurs globaux sur un ensemble de commissions
 */
export function calculateGlobalCommissionStats(commissions = []) {
  const today = new Date().toISOString().slice(0, 10);
  let totalJalons = 0;
  let completedJalons = 0;
  let pendingArbitrationsCount = 0;
  let overdueAlertsCount = 0;
  const overdueJalons = [];
  const pendingBudgetCommissions = [];

  commissions.forEach((comm) => {
    // Jalons
    const jalons = comm.jalons || [];
    jalons.forEach((j) => {
      totalJalons += 1;
      if (j.status === 'fait') {
        completedJalons += 1;
      } else if (j.deadline && j.deadline < today) {
        overdueAlertsCount += 1;
        overdueJalons.push({
          commissionId: comm.id,
          commissionTitre: comm.titre,
          jalon: j
        });
      }
    });

    // Budget
    if (comm.budget?.statusArbitrage === 'en_attente') {
      pendingArbitrationsCount += 1;
      pendingBudgetCommissions.push(comm);
    }
  });

  const globalProgress = totalJalons > 0
    ? Math.round((completedJalons / totalJalons) * 100)
    : 0;

  return {
    globalProgress,
    totalJalons,
    completedJalons,
    pendingArbitrationsCount,
    overdueAlertsCount,
    overdueJalons,
    pendingBudgetCommissions
  };
}

/**
 * Prépare les données d'une commission avec les valeurs par défaut
 */
export function prepareCommissionData(commissionData = {}) {
  const now = new Date().toISOString();
  return {
    titre: commissionData.titre || 'Nouvelle commission',
    icone: commissionData.icone || '📋',
    description: commissionData.description || '',
    referentsIds: commissionData.referentsIds || [],
    membresIds: commissionData.membresIds || [],
    modulesActifs: commissionData.modulesActifs || ['jalons'],
    jalons: commissionData.jalons || [],
    budget: commissionData.budget || {
      demande: 0,
      alloue: 0,
      statusArbitrage: 'en_etude',
      motifRefus: '',
      depensesReelles: 0,
      devis: []
    },
    creneauxBenevoles: commissionData.creneauxBenevoles || [],
    besoinsMateriel: commissionData.besoinsMateriel || [],
    dateCreation: commissionData.dateCreation || now,
    derniereModif: now
  };
}

/**
 * Génère le contenu Markdown structuré d'un livret Cordel de commission (Bloc 2).
 */
export function generateCommissionMarkdown(commission = {}, { usersMap = {}, event = {} } = {}) {
  const titre = commission.titre || 'Commission';
  const icone = commission.icone || '📋';
  const description = commission.description || 'Aucune description renseignée.';
  const referents = (commission.referentsIds || []).map((id) => {
    const u = usersMap[id] || {};
    return u.displayName || u.nom || u.prenom || 'Référent';
  });
  const referentsText = referents.length > 0 ? referents.join(' & ') : 'Non assigné';

  const jalons = commission.jalons || [];
  const creneaux = commission.creneauxBenevoles || [];
  const besoins = commission.besoinsMateriel || [];
  const budget = commission.budget || {};

  const lines = [
    `# ${icone} Commission : ${titre}`, '',
    `**🎪 Événement :** ${event.titre || event.title || 'Événement associatif'}`,
    `**👤 Référents :** ${referentsText}`,
    budget.alloue ? `**💰 Enveloppe allouée :** ${budget.alloue} €` : '',
    '', '## 🎯 Description & Objectifs', description, ''
  ].filter(Boolean);

  if (jalons.length > 0) {
    lines.push('## 🗓️ Jalons & Dates Clés');
    jalons.forEach((j) => {
      const deadline = j.deadline ? ` (Date butoir : ${j.deadline})` : '';
      lines.push(`- [${j.status === 'fait' ? 'x' : ' '}] **${j.titre}**${deadline}`);
    });
    lines.push('');
  }

  if (creneaux.length > 0) {
    lines.push('## 🤝 Postes & Créneaux Bénévoles');
    creneaux.forEach((c) => {
      const horaires = c.horaireDebut && c.horaireFin ? ` (${c.horaireDebut} - ${c.horaireFin})` : '';
      const inscritsNoms = (c.inscritsIds || []).map((uid) => {
        const u = usersMap[uid] || {};
        return u.prenom || u.displayName || u.nom || 'Bénévole';
      });
      const placesRestantes = Math.max(0, (c.places || 1) - (c.inscritsIds || []).length);
      const inscritsTxt = inscritsNoms.length > 0 ? ` (Inscrits : ${inscritsNoms.join(', ')})` : '';
      lines.push(`- **${c.titre || c.poste || 'Créneau'}**${horaires} : ${c.places || 1} place(s) (${placesRestantes} restante(s))${inscritsTxt}`);
    });
    lines.push('');
  }

  if (besoins.length > 0) {
    lines.push('## 🧰 Matériel & Besoins Logistiques');
    besoins.forEach((b) => {
      const resp = b.responsableId ? (usersMap[b.responsableId]?.prenom || 'En charge') : 'À assigner';
      const statutTxt = b.statut === 'ok' ? '✅ Prêt' : b.statut === 'reserve' ? '⏳ Réservé' : '⚠️ À trouver';
      lines.push(`- **${b.quantite ? `${b.quantite}x ` : ''}${b.article}** [${statutTxt}] — Resp : ${resp}`);
    });
    lines.push('');
  }

  lines.push('---', `*Livret officiel de commission édité le ${new Date().toLocaleDateString('fr-FR')} • O Girador*`);
  return lines.join('\n');
}
