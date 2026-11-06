import {
  extractDayPart,
  extractTimePart,
  resolveDefaultTimesForForm,
  resolveSlotRegistrationDeadline
} from './eventScheduleUtils';
import { resolveReunionPrivacyConfig } from './reunionPrivacyUtils';

/**
 * Construit le payload Firestore complet pour la création d'un événement ou d'une option de sondage
 * (incluant imageUrl, coverImage, stampIcon, confidentialité réunion et programme musical).
 * Extrait de WidgetAgenda.jsx conformément à la Règle du Boy Scout (< 140 lignes).
 */
export function buildEventCreationPayload({
  formData,
  activeConfig,
  rawConfig = {},
  eventTypeConfigs = {},
  groupId,
  dateVal,
  isPollMode = false,
  pollGroupId = null,
  optionIndex = 1,
  totalOptions = 1,
  isRecolteActiveForDoc = false
}) {
  const { endTime } = resolveDefaultTimesForForm(formData, eventTypeConfigs);
  const slotEndDate = isPollMode && dateVal
    ? `${extractDayPart(dateVal)}T${extractTimePart(formData.dateFin) || endTime}`
    : (formData.dateFin || '');
  const slotDeadline = activeConfig.agendaEnableInscriptions ? resolveSlotRegistrationDeadline(dateVal, formData) : '';
  const reunionPrivacy = formData.type === 'reunion' ? resolveReunionPrivacyConfig(formData) : null;
  const resolvedCoverUrl = activeConfig.agendaEnableImage ? (formData.imageUrl || formData.coverImage || '').trim() : '';

  return {
    titre: formData.titre,
    type: formData.type,
    date: dateVal,
    dateDebut: dateVal,
    dateFin: slotEndDate,
    groupId,
    inscriptions: [],
    lieu: activeConfig.agendaEnableAdresse ? formData.lieu || '' : '',
    ...(reunionPrivacy ? {
      targetGroup: reunionPrivacy.targetGroup,
      reunionPrivacyMode: reunionPrivacy.reunionPrivacyMode,
      hideAgendaFromNonTarget: reunionPrivacy.hideAgendaFromNonTarget,
      audience: reunionPrivacy.audience,
      portee: reunionPrivacy.portee
    } : {}),
    horairesPassages: formData.type === 'prestation' ? formData.horairesPassages || '' : '',
    horaireCovoiturage: activeConfig.agendaEnableCarpool ? formData.horaireCovoiturage || '' : '',
    niveauRequis: formData.type === 'prestation' ? formData.niveauRequis || 'tous' : 'tous',
    niveauDanseRequis: ['prestation', 'stage', 'repetition', 'atelier'].includes(formData.type) ? formData.niveauDanseRequis || 'aucun' : 'aucun',
    lienDocument: activeConfig.agendaEnableOrdreDuJour ? formData.lienDocument || '' : '',
    lienDepotMedias: (formData.dropUrl || formData.lienDepotMedias || '').trim(),
    dropUrl: (formData.dropUrl || formData.lienDepotMedias || '').trim(),
    videoUrl: (formData.videoUrl || '').trim(),
    enableVideoDrop: formData.enableVideoDrop !== undefined
      ? Boolean(formData.enableVideoDrop)
      : (activeConfig.enableVideoDrop !== undefined ? Boolean(activeConfig.enableVideoDrop) : ['atelier', 'repetition', 'stage'].includes(formData.type)),
    distanceAllerRetourKm: activeConfig.agendaEnableCarpool ? (parseFloat(formData.distanceAllerRetourKm) || 0) : 0,
    status: isPollMode ? 'sondage' : 'confirme',
    ...(isPollMode ? {
      isPoll: true,
      pollGroupId,
      optionIndex,
      totalOptions,
      pollMode: formData.pollMode || 'single_winner',
      pollTargetPupitres: Array.isArray(formData.pollTargetPupitres) ? formData.pollTargetPupitres : [],
      pollRestrictionType: formData.pollRestrictionType || 'aucun',
      pollTarget: formData.pollTarget || '',
      votes: {}
    } : {}),
    lienSocial: activeConfig.agendaEnableUrl ? formData.lienSocial || '' : '',
    imageUrl: resolvedCoverUrl,
    coverImage: resolvedCoverUrl,
    stampIcon: formData.stampIcon || 'auto',
    requiresValidation: activeConfig.agendaEnableInscriptions ? (formData.requiresValidation || false) : false,
    montantRecette: activeConfig.agendaEnableFinance ? (parseFloat(formData.montantRecette) || 0) : 0,
    montantDepense: activeConfig.agendaEnableFinance ? (formData.budgetDepenses || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0) : 0,
    budgetRecettes: [],
    budgetDepenses: activeConfig.agendaEnableFinance ? (formData.budgetDepenses || []) : [],
    dateLimiteInscription: slotDeadline,
    registrationDeadlineMode: formData.registrationDeadlineMode || (slotDeadline ? 'fixed' : 'none'),
    registrationDeadlineDaysBefore: Number(formData.registrationDeadlineDaysBefore) || 7,
    dressCodePercussion: formData.dressCodePercussion || '',
    dressCodeDanse: formData.dressCodeDanse || '',
    tenueRequise: formData.tenueRequise || (
      formData.dressCodePercussion && formData.dressCodeDanse
        ? `🥁 Percussion: ${formData.dressCodePercussion} | 💃 Danse: ${formData.dressCodeDanse}`
        : (formData.dressCodePercussion || formData.dressCodeDanse || '')
    ),
    volunteerShifts: formData.volunteerShifts || [],
    includesPercussion: formData.includesPercussion !== false,
    includesDance: formData.includesDance !== false,
    enableCarpool: formData.enableCarpool !== false,
    enableRoadbook: formData.enableRoadbook !== undefined
      ? Boolean(formData.enableRoadbook)
      : (rawConfig.enableRoadbook !== undefined ? Boolean(rawConfig.enableRoadbook) : ['prestation', 'stage'].includes(formData.type)),
    isPublic: Boolean(formData.isPublic),
    enableInscriptions: formData.enableInscriptions !== false,
    hasCommissions: Boolean(formData.hasCommissions),
    activerRecolteMedias: isRecolteActiveForDoc,
    publierSurVaral: formData.publierSurVaral !== undefined ? Boolean(formData.publierSurVaral) : (isRecolteActiveForDoc !== false),
    sendPushNotification: formData.sendPushNotification !== false,
    description: formData.description || '',
    latitude: formData.latitude ? Number(formData.latitude) : null,
    longitude: formData.longitude ? Number(formData.longitude) : null,
    linkedPatterns: formData.linkedPatterns || [],
    setlist: (formData.setlist || []).map((item) => ({
      id: item.id || item.pieceId,
      pieceId: item.pieceId || item.id,
      repertoireId: item.repertoireId || item.pieceId || item.id,
      titre: (item.titre || '').trim(),
      notes: (item.notes || '').trim(),
      sequenceurId: item.sequenceurId || null,
      sequenceurType: item.sequenceurType || null,
      sequenceurFileUrl: item.sequenceurFileUrl || item.jsonUrl || null,
      jsonUrl: item.jsonUrl || item.sequenceurFileUrl || null,
      audioUrl: item.audioUrl || null,
      toadaDocId: item.toadaDocId || null,
      cultureDocId: item.cultureDocId || null,
      cultureDocIds: Array.isArray(item.cultureDocIds) ? item.cultureDocIds : (item.cultureDocId ? [item.cultureDocId] : []),
      dancadorChoreoId: item.dancadorChoreoId || null,
      videos: Array.isArray(item.videos) ? item.videos : [],
      signalIds: Array.isArray(item.signalIds) ? item.signalIds : []
    })),
    specialiteAtelier: ['atelier', 'stage'].includes(formData.type) ? (formData.specialiteAtelier || 'general') : null,
    programmeFabrication: ['atelier', 'stage'].includes(formData.type) && formData.specialiteAtelier === 'fabrication' ? (formData.programmeFabrication || null) : null
  };
}
