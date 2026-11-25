/**
 * Génération des mémos Jour J (membres & bénévoles externes), résolution automatique
 * du contact référent Jour J (commission -> repli organisateur) et mot de remerciement (FR / PT-BR).
 */

export function resolveShiftDayOfContacts(shift = {}, { event = {}, commissions = [], allUsers = [] } = {}) {
  const usersById = {};
  (allUsers || []).forEach((u) => { if (u?.id) usersById[u.id] = u; if (u?.uid) usersById[u.uid] = u; });

  const contacts = [];
  if (shift?.commissionId) {
    const comm = (commissions || []).find((c) => c?.id === shift.commissionId);
    const refIds = comm?.referentsIds || comm?.referentIds || [];
    refIds.forEach((uid) => {
      const u = usersById[uid];
      const tel = String(u?.telephone || u?.phone || '').trim();
      const prenom = String(u?.prenom || u?.displayName || '').trim();
      if (prenom || tel) contacts.push({ prenom: prenom || 'Référent', nom: String(u?.nom || '').trim(), telephone: tel, role: comm?.titre || 'Commission' });
    });
  }

  if (contacts.length === 0) {
    const cj = event?.contactsJourJ || {};
    const refGrp = cj.referentGroupeId ? usersById[cj.referentGroupeId] : null;
    if (refGrp && (refGrp.prenom || refGrp.telephone || refGrp.phone)) {
      contacts.push({ prenom: String(refGrp.prenom || 'Référent').trim(), nom: String(refGrp.nom || '').trim(), telephone: String(refGrp.telephone || refGrp.phone || '').trim(), role: 'Accueil' });
    } else if (cj.referentOrgaNom || cj.referentOrgaTel) {
      contacts.push({ prenom: String(cj.referentOrgaNom || 'Organisation').trim(), nom: '', telephone: String(cj.referentOrgaTel || '').trim(), role: 'Organisation' });
    }
  }
  return contacts;
}

export function extractUserPersonalMemoEntries(consolidatedShifts = [], currentUserUid = '') {
  const uid = String(currentUserUid || '').trim();
  if (!uid) return [];
  const entries = [];
  (consolidatedShifts || []).forEach((shift) => {
    (shift?.inscrits || []).forEach((ins) => {
      if (ins?.type === 'member' && ins.uid === uid) {
        entries.push({ key: `${shift.id}_self`, kind: 'self', guestName: '', shift });
      } else if (ins?.type === 'guest' && ins.parrainUid === uid) {
        entries.push({ key: `${shift.id}_${ins.id}`, kind: 'guest', guestName: `${ins.prenom || ''} ${ins.nom || ''}`.trim() || 'Proche', shift });
      }
    });
  });
  return entries;
}

function toWhatsappDigits(rawPhone = '') {
  const cleaned = String(rawPhone || '').replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return cleaned.slice(1);
  if (cleaned.startsWith('00')) return cleaned.slice(2);
  if (/^0[1-9]\d{8}$/.test(cleaned)) return `33${cleaned.slice(1)}`;
  return cleaned;
}

export function generateExternalVolunteerMessage({
  mode = 'memo_jour_j',
  locale = 'fr',
  application = {},
  event = {},
  associationName = '',
  shiftsById = {},
  commissions = [],
  allUsers = []
} = {}) {
  const isPt = String(locale || 'fr').toLowerCase().startsWith('pt');
  const prenom = String(application?.prenom || '').trim() || (isPt ? 'Voluntário(a)' : 'Bénévole');
  const asso = String(associationName || '').trim() || (isPt ? 'nossa associação' : 'notre association');
  const eventTitle = String(event?.titre || event?.title || (isPt ? 'Evento' : 'Événement')).trim();
  const rawDate = String(event?.date || event?.dateDebut || '').slice(0, 10);
  const lieu = String(event?.lieu || '').trim();

  const assignedShifts = (application?.assignedShiftIds || [])
    .map((id) => shiftsById[id])
    .filter(Boolean)
    .sort((a, b) => (a.dateJour || rawDate).localeCompare(b.dateJour || rawDate) || (a.heureDebut || '99:99').localeCompare(b.heureDebut || '99:99'));

  let subject = '';
  let body = '';

  if (mode === 'thank_you') {
    subject = isPt ? `[${asso}] Muito obrigado pelo seu apoio — ${eventTitle}!` : `[${asso}] Merci pour ton coup de main — ${eventTitle} !`;
    body = isPt
      ? `Olá ${prenom},\n\nEm nome de toda a equipe de ${asso}, queremos agradecer de coração pela sua ajuda preciosa como voluntário(a) em "${eventTitle}".\nSua energia e disponibilidade fizeram toda a diferença para o sucesso deste momento!\n\nAté breve,\nEquipe ${asso}`
      : `Bonjour ${prenom},\n\nAu nom de toute l'équipe de ${asso}, un immense merci pour ton précieux coup de main bénévole lors de « ${eventTitle} » !\nTa disponibilité et ta bonne humeur ont grandement contribué à la réussite de cet événement.\n\nÀ très bientôt,\nL'équipe ${asso}`;
  } else {
    subject = isPt ? `[${asso}] Seu Lembrete de Voluntariado — ${eventTitle}` : `[${asso}] Ton Mémo Bénévole Jour J — ${eventTitle}`;
    const shiftLines = assignedShifts.length > 0
      ? assignedShifts.map((s) => {
        const dayPrefix = s.dateJour && s.dateJour !== rawDate ? `${s.dateJour} • ` : '';
        const commTxt = s.commissionTitre ? ` (${s.commissionTitre})` : '';
        const consigneTxt = s.consigne ? `\n  ↳ ${isPt ? 'Orientação' : 'Consigne'} : ${s.consigne}` : '';
        return `• ${dayPrefix}${s.horaires || (isPt ? 'Horário livre' : 'Horaire libre')} — ${s.nomTache}${commTxt}${consigneTxt}`;
      }).join('\n')
      : (isPt ? '• Posto flexível conforme necessidade da equipe no local' : '• Poste flexible selon les besoins sur place');

    const firstContacts = resolveShiftDayOfContacts(assignedShifts[0] || {}, { event, commissions, allUsers });
    const contactLine = firstContacts.length > 0
      ? firstContacts.map((c) => `${c.prenom}${c.telephone ? ` (${c.telephone})` : ''}`).join(' / ')
      : '';

    body = isPt
      ? `Olá ${prenom},\n\nSua participação voluntária em "${eventTitle}" com ${asso} está confirmada!\n📅 Data : ${rawDate || '-'}${lieu ? `\n📍 Local : ${lieu}` : ''}\n\n🤝 Seus turnos :\n${shiftLines}${contactLine ? `\n\n📞 Contato no dia em caso de imprevisto : ${contactLine}` : ''}\n\nMuito obrigado pelo apoio e até lá!\nEquipe ${asso}`
      : `Bonjour ${prenom},\n\nTon coup de main bénévole pour « ${eventTitle} » aux côtés de ${asso} est bien validé !\n📅 Date : ${rawDate || '-'}${lieu ? `\n📍 Lieu : ${lieu}` : ''}\n\n🤝 Tes créneaux retenus :\n${shiftLines}${contactLine ? `\n\n📞 Contact Jour J en cas d'imprévu : ${contactLine}` : ''}\n\nEncore merci pour ton aide et à très vite !\nL'équipe ${asso}`;
  }

  const digits = toWhatsappDigits(application?.telephone);
  const whatsappUrl = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(body)}` : '';
  const mailtoUrl = `mailto:${encodeURIComponent(String(application?.email || '').trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, whatsappUrl, mailtoUrl };
}
