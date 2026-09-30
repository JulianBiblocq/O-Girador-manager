/**
 * Utilitaires pour le Trombinoscope : Définition des 5 pupitres SaaS,
 * résolution du pupitre principal unique, extraction des badges et isolation des renforts.
 */

import { getTagId } from '../../utils/tagUtils.js';
import {
  formatMemberLevel,
  resolveMemberLevel,
  getEffectiveMemberTags,
  isInstitutionalTag,
  getCanonicalTagKey,
  resolvePedagogicalRoles
} from '../../utils/memberUtils.js';

export {
  formatMemberLevel,
  resolveMemberLevel,
  getEffectiveMemberTags,
  isInstitutionalTag,
  getCanonicalTagKey,
  resolvePedagogicalRoles
};

/**
 * Détecte si un tag ou libellé correspond à un titre ou rôle pédagogique (Mestre, Mestra, etc.)
 *
 * @param {string|object} tag Tag brut ou objet
 * @returns {boolean} true s'il s'agit d'un tag pédagogique
 */
export const isPedagogicalTag = (tag) => {
  if (!tag) return false;
  const clean = String(typeof tag === 'object' ? (tag.id || tag.nom || tag.label || '') : tag)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  return (
    clean === 'mestre' ||
    clean === 'mestra' ||
    clean === 'mestre batucada' ||
    clean === 'mestra de danse' ||
    clean === 'mestre de danse' ||
    clean.includes('mestre') ||
    clean.includes('mestra')
  );
};

/**
 * Détecte si un libellé ou un identifiant correspond à un statut générique par défaut
 * (ex: 'adhérent', 'adhérente', 'adherent', 'membre', 'member', 'associado', etc.)
 * qui ne doit pas polluer l'affichage sous forme de badge spécifique.
 *
 * @param {string} val Libellé ou identifiant du tag ou du rôle
 * @returns {boolean} true si c'est un libellé par défaut à exclure
 */
export const isDefaultMemberBadge = (val) => {
  if (!val) return true;
  const clean = String(val)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  return [
    'adherent',
    'adherente',
    'adherents',
    'adherentes',
    'membre',
    'membres',
    'member',
    'members',
    'associado',
    'associada',
    'associados',
    'associadas',
    'membro',
    'membros'
  ].includes(clean);
};

/**
 * Les 5 pupitres SaaS canoniques du Maracatu ordonnés selon la charte
 */
export const FIVE_PUPITRES = [
  {
    id: 'alfaias',
    name: 'Alfaias',
    label: 'Alfaias',
    icon: '/icones/alfaia.svg',
    colorKey: 'Alfaia'
  },
  {
    id: 'caixas',
    name: 'Caixas',
    label: 'Caixas',
    icon: '/icones/caixa.svg',
    colorKey: 'Caixa'
  },
  {
    id: 'gongue',
    name: 'Gonguê',
    label: 'Gonguê',
    icon: '/icones/gongue.svg',
    colorKey: 'Gonguê'
  },
  {
    id: 'sementes',
    name: 'Sementes',
    label: 'Sementes',
    icon: '/icones/agbe.svg',
    colorKey: 'Agbê'
  },
  {
    id: 'danse',
    name: 'Danse',
    label: 'Danse',
    icon: '/icones/danse.svg',
    colorKey: 'Danse'
  }
];

/**
 * Détection inclusive d'un membre pratiquant la danse
 */
export const isDanseMember = (m) => {
  if (!m) return false;
  if (m.pratiqueDanse === true) return true;
  if (m.niveauDanse && m.niveauDanse !== 'aucun') return true;
  const userInstruments = (Array.isArray(m.instrumentsJoues) && m.instrumentsJoues.length > 0)
    ? m.instrumentsJoues
    : [m.instrumentPrincipal || m.instrument || m.instrumentSecondaire].filter(Boolean);
  return userInstruments.some((inst) => String(inst).toLowerCase().includes('danse'));
};

/**
 * Détecte si un membre a le statut, tag ou rôle de renfort / invité extérieur
 */
export const isRenfortMember = (member) => {
  if (!member) return false;
  if (member.statutActuel === 'renfort' || member.statutActuel === 'invite' || member.statutActuel === 'externe') return true;
  if (member.role === 'renfort' || member.role === 'invite') return true;
  if (member.isRenfort === true || member.isGuest === true) return true;
  if (Array.isArray(member.tags)) {
    return member.tags.some((tag) => {
      const tagId = String(getTagId(tag) || tag).toLowerCase().trim();
      return (
        tagId === 'renfort' ||
        tagId.includes('renfort') ||
        tagId === 'invite' ||
        tagId.includes('invité') ||
        tagId.includes('externe')
      );
    });
  }
  return false;
};

/**
 * Détecte si un membre est soliste ou chanteur référent (Puxador)
 */
export const isChantReferent = (member) => {
  if (!member) return false;
  if (member.isLeadChant || member.chanteurReferent || member.isChantLead || member.soliste || member.puxador) {
    return true;
  }
  if (Array.isArray(member.tags)) {
    const hasTag = member.tags.some((t) => {
      const tagStr = String(getTagId(t) || t).toLowerCase().trim();
      return tagStr.includes('chant') || tagStr.includes('soliste') || tagStr.includes('puxador') || tagStr.includes('voix');
    });
    if (hasTag) return true;
  }
  const allInsts = [
    member.instrumentPrincipal,
    member.instrumentSecondaire,
    ...(Array.isArray(member.instrumentsJoues) ? member.instrumentsJoues : [])
  ].filter(Boolean).map((i) => String(i).toLowerCase().trim());

  return allInsts.some(
    (i) =>
      i.includes('soliste') ||
      i.includes('puxador') ||
      (i.includes('chant') && (i.includes('lead') || i.includes('référent') || i.includes('referent')))
  );
};

/**
 * Résout le pupitre principal unique d'un membre parmi les 5 pupitres SaaS
 */
export const resolveMemberPrimaryPupitre = (member) => {
  if (!member) return 'alfaias';

  const primary = String(member.instrumentPrincipal || member.instrument || '').toLowerCase().trim();
  const rawInstruments = (Array.isArray(member.instrumentsJoues) && member.instrumentsJoues.length > 0)
    ? member.instrumentsJoues
    : [];

  const isDancer = isDanseMember(member);

  // 1. Priorité à l'instrument principal explicite
  if (primary) {
    if (
      primary.includes('alfaia') ||
      primary.includes('surdo') ||
      primary.includes('zabumba') ||
      primary.includes('marcante') ||
      primary.includes('meiao') ||
      primary.includes('meião') ||
      primary.includes('repique')
    ) {
      return 'alfaias';
    }
    if (
      primary.includes('caixa') ||
      primary.includes('tarol') ||
      primary.includes('snare') ||
      primary.includes('caisse')
    ) {
      return 'caixas';
    }
    if (
      primary.includes('gongue') ||
      primary.includes('gonguê') ||
      primary.includes('cloche') ||
      primary.includes('agogo') ||
      primary.includes('agogô')
    ) {
      return 'gongue';
    }
    if (
      primary.includes('semente') ||
      primary.includes('agbe') ||
      primary.includes('agbê') ||
      primary.includes('mineiro') ||
      primary.includes('shekere') ||
      primary.includes('xequere') ||
      primary.includes('ganza') ||
      primary.includes('shaker')
    ) {
      return 'sementes';
    }
    if (primary.includes('danse') || primary.includes('dance')) {
      return 'danse';
    }
  }

  // 2. Recherche dans les instruments joués
  for (const inst of rawInstruments) {
    const lower = String(inst).toLowerCase().trim();
    if (
      lower.includes('alfaia') ||
      lower.includes('surdo') ||
      lower.includes('zabumba') ||
      lower.includes('marcante') ||
      lower.includes('meiao') ||
      lower.includes('meião') ||
      lower.includes('repique')
    ) {
      return 'alfaias';
    }
    if (
      lower.includes('caixa') ||
      lower.includes('tarol') ||
      lower.includes('snare') ||
      lower.includes('caisse')
    ) {
      return 'caixas';
    }
    if (
      lower.includes('gongue') ||
      lower.includes('gonguê') ||
      lower.includes('cloche') ||
      lower.includes('agogo') ||
      lower.includes('agogô')
    ) {
      return 'gongue';
    }
    if (
      lower.includes('semente') ||
      lower.includes('agbe') ||
      lower.includes('agbê') ||
      lower.includes('mineiro') ||
      lower.includes('shekere') ||
      lower.includes('xequere')
    ) {
      return 'sementes';
    }
    if (lower.includes('danse') || lower.includes('dance')) {
      return 'danse';
    }
  }

  // 3. Pratique de la danse si aucun instrument de percussion
  if (isDancer) {
    return 'danse';
  }

  // 4. Par défaut : Alfaias (pupitre fondamental de la bateria)
  return 'alfaias';
};

/**
 * Extrait les badges légers pour les sous-voix et instruments secondaires
 */
export const extractMemberBadges = (member, primaryPupitreId) => {
  const badges = [];
  const fullPrimary = String(member.instrumentPrincipal || member.instrument || '').toLowerCase();

  // 1. Sous-voix d'Alfaia (Marcante, Meião, Repique)
  if (primaryPupitreId === 'alfaias') {
    if (fullPrimary.includes('marcante') || String(member.sousVoix || '').toLowerCase().includes('marcante')) {
      badges.push('Marcante');
    } else if (
      fullPrimary.includes('meião') ||
      fullPrimary.includes('meiao') ||
      String(member.sousVoix || '').toLowerCase().includes('meiao') ||
      String(member.sousVoix || '').toLowerCase().includes('meião')
    ) {
      badges.push('Meião');
    } else if (fullPrimary.includes('repique') || String(member.sousVoix || '').toLowerCase().includes('repique')) {
      badges.push('Repique');
    }
  }

  // 2. Instruments secondaires déclarés (hors Sementes/Caixas unifiés et hors chant)
  const allOtherInsts = [
    member.instrumentSecondaire,
    ...(Array.isArray(member.instrumentsJoues) ? member.instrumentsJoues : [])
  ].filter(Boolean);

  allOtherInsts.forEach((rawInst) => {
    const clean = String(rawInst).trim();
    const lower = clean.toLowerCase();

    // Ignorer le chant (couvert par le micro-tampon micro dédié)
    if (lower.includes('chant') || lower.includes('voix') || lower.includes('vocal')) return;

    // Unification stricte : pour le pupitre Sementes, aucune distinction Agbê / Mineiro
    if (primaryPupitreId === 'sementes') {
      if (lower.includes('agbe') || lower.includes('agbê') || lower.includes('mineiro') || lower.includes('semente')) return;
    }

    // Unification stricte : pour le pupitre Caixas, aucune distinction Caixa / Tarol
    if (primaryPupitreId === 'caixas') {
      if (lower.includes('caixa') || lower.includes('tarol')) return;
    }

    let label = clean;
    if (lower.includes('tarol') || lower.includes('caixa')) label = 'Caixas';
    else if (lower.includes('mineiro') || lower.includes('agbe') || lower.includes('agbê') || lower.includes('semente')) label = 'Sementes';
    else if (lower.includes('alfaia')) {
      if (lower.includes('marcante')) label = 'Marcante';
      else if (lower.includes('meião') || lower.includes('meiao')) label = 'Meião';
      else if (lower.includes('repique')) label = 'Repique';
      else label = 'Alfaia';
    } else if (lower.includes('gongue') || lower.includes('gonguê')) label = 'Gonguê';
    else if (lower.includes('danse')) label = 'Danse';

    // Ne pas dupliquer le nom du pupitre principal
    const currentPupitreLabel = FIVE_PUPITRES.find((p) => p.id === primaryPupitreId)?.label;
    if (label.toLowerCase() === currentPupitreLabel?.toLowerCase()) return;
    if (primaryPupitreId === 'alfaias' && label === 'Alfaia') return;

    if (!badges.includes(label)) {
      badges.push(label);
    }
  });

  // 3. Danse en pratique secondaire
  if (isDanseMember(member) && primaryPupitreId !== 'danse' && !badges.includes('Danse')) {
    badges.push('Danse');
  }

  return badges;
};

/**
 * Détermine le sous-titre officiel et unifié du pupitre/instrument sous la photo.
 * Pour les Sementes, unifie strictement Agbê et Mineiro sous le nom « Sementes ».
 * Pour les Caixas, unifie sous « Caixas ».
 *
 * @param {Object} member Objet membre
 * @returns {string} Nom unifié (ex: "Sementes", "Caixas", "Alfaias", "Gonguê", "Danse")
 */
export const resolveMemberInstrumentSubtitle = (member) => {
  if (!member) return '';

  const { isMestreBatucada, isMestreDanse, pedagogicalTitle } = resolvePedagogicalRoles(member);

  // Mestra / Mestre de Danse : titre honorifique dédié sous la photo
  if (isMestreDanse && pedagogicalTitle) {
    return pedagogicalTitle;
  }

  const pupitreId = member.primaryPupitreId || resolveMemberPrimaryPupitre(member);
  let pupitreLabel = '';

  if (pupitreId === 'sementes') pupitreLabel = 'Sementes';
  else if (pupitreId === 'caixas') pupitreLabel = 'Caixas';
  else if (pupitreId === 'alfaias') pupitreLabel = 'Alfaias';
  else if (pupitreId === 'gongue') pupitreLabel = 'Gonguê';
  else if (pupitreId === 'danse') pupitreLabel = 'Danse';
  else {
    const raw = String(member.instrumentPrincipal || member.instrument || '').trim();
    const lower = raw.toLowerCase();
    if (lower.includes('agbe') || lower.includes('agbê') || lower.includes('mineiro') || lower.includes('semente')) {
      pupitreLabel = 'Sementes';
    } else if (lower.includes('caixa') || lower.includes('tarol')) {
      pupitreLabel = 'Caixas';
    } else if (lower.includes('alfaia')) {
      pupitreLabel = 'Alfaias';
    } else if (lower.includes('gongue') || lower.includes('gonguê')) {
      pupitreLabel = 'Gonguê';
    } else if (lower.includes('danse')) {
      pupitreLabel = 'Danse';
    } else if (!isDefaultMemberBadge(raw) && !isPedagogicalTag(raw)) {
      pupitreLabel = raw;
    }
  }

  // Mestre de Batucada : affichage du titre avec pupitre éventuel (ex: "Mestre • Caixas" ou "Mestre")
  if (isMestreBatucada && pedagogicalTitle) {
    return pupitreLabel && pupitreLabel.toLowerCase() !== 'mestre'
      ? `${pedagogicalTitle} • ${pupitreLabel}`
      : pedagogicalTitle;
  }

  return pupitreLabel || (!isDefaultMemberBadge(member.role) && member.role !== 'mestre' ? member.role : '');
};

/**
 * Formate l'anniversaire sous la forme stricte « 20 Mai » (sans jamais faire apparaître l'année).
 * Évite les décalages de fuseau horaire UTC en découpant directement la chaîne AAAA-MM-JJ.
 *
 * @param {string} dateStr Chaîne de date au format ISO (AAAA-MM-JJ)
 * @returns {string|null} ex: "20 Mai" ou null si date invalide
 */
export const formatBirthdayShort = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanDate = dateStr.trim().split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');
  if (parts.length < 3) return null;

  const [, month, day] = parts;
  const moisFr = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const dayNum = parseInt(day, 10);
  const monthIdx = parseInt(month, 10) - 1;
  if (isNaN(dayNum) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return null;

  const monthName = moisFr[monthIdx] || month;

  return `${dayNum} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
};
