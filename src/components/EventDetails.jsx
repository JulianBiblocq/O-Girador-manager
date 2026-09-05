import React, { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import CordelAccordion, { CordelAccordionGroup } from './CordelAccordion';
import ReunionAgendaManager from './ReunionAgendaManager';
import { useTranslation } from './LanguageContext';
import { XiloCalendar, XiloMegaphone } from './XiloIcons';
import XiloAvatar from './XiloAvatar';
import AddressAutocomplete from './AddressAutocomplete';
import { calculateRoadDistance } from '../utils/googleMaps';

import { useEventRSVP } from '../hooks/useEventRSVP';
import { useEventCarpool, calculateCarStatus } from '../hooks/useEventCarpool';
import { useEventSetlist } from '../hooks/useEventSetlist';
import useConfirm from '../hooks/useConfirm';

import EventRSVPSection from './event-details/EventRSVPSection';
import EventCarpoolSection from './event-details/EventCarpoolSection';
import EventRevisionProgram from './event-details/EventRevisionProgram';
import EventWorkshopProgram from './event-details/EventWorkshopProgram';
import EventReportSection from './event-details/EventReportSection';
import EventStageLayoutSection from './event-details/EventStageLayoutSection';
import EventVolunteerSection from './event-details/EventVolunteerSection';
import { DEFAULT_CUSTOM_CATEGORIES, resolveCategory, isUserCategoryMatchingEvent } from '../utils/categoryUtils';
import { resolveEffectiveUserTags, findTagObject, getTagId } from '../utils/tagUtils';
import { canManageEvents } from '../utils/permissionUtils';
import EventBudgetEditor from './event-details/EventBudgetEditor';
import EventBudgetSection from './event-details/EventBudgetSection';
import EventEditForm from './event-details/EventEditForm';
import EventPollSection from './event-details/EventPollSection';
import { useEventDetailsController } from '../hooks/useEventDetailsController';
import EventHeaderCard from './event-details/EventHeaderCard';
import EventQuickActionsBar from './event-details/EventQuickActionsBar';
import EventLocationMapBox from './event-details/EventLocationMapBox';
import EventCommentsSection from './event-details/EventCommentsSection';
import SendContractModal from './studio/SendContractModal';
import EventPublicQrCodeModal from './event-details/EventPublicQrCodeModal';
import EventMediaQrCodeModal from './event-details/EventMediaQrCodeModal';
import EventTabsNav from './event-details/EventTabsNav';
import TabRsvp from './event-details/tabs/TabRsvp';
import TabLogistics from './event-details/tabs/TabLogistics';
import TabProgram from './event-details/tabs/TabProgram';
import TabAdmin from './event-details/tabs/TabAdmin';
import useHardwareBack from '../hooks/useHardwareBack';
import { triggerEventStatusAutomation } from '../utils/automationEngine';

export default function EventDetails({ event, user, profileData, onNavigateToView, onClose, onPrev, onNext, viewMode, setViewMode, onGoToStageLayoutEditor }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const [activeTab, setActiveTab] = useState('rsvp');

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const {
    activeEvent,
    isEditingEvent,
    setIsEditingEvent,
    toggleEditing,
    toastMessage,
    setToastMessage,
    showToast,
    savingEvent,
    setSavingEvent,
    handleDeleteEvent
  } = useEventDetailsController(event, onClose, t);

  const [allUsers, setAllUsers] = useState([]);
  const [editForm, setEditForm] = useState({
    titre: event.titre || '',
    type: event.type || 'repetition',
    date: event.date || '',
    dateFin: event.dateFin || '',
    lieu: event.lieu || '',
    horairesPassages: event.horairesPassages || '',
    horaireCovoiturage: event.horaireCovoiturage || '',
    niveauRequis: event.niveauRequis || 'tous',
    niveauDanseRequis: event.niveauDanseRequis || 'aucun',
    lienDocument: event.lienDocument || '',
    lienDepotMedias: event.lienDepotMedias || '',
    distanceAllerRetourKm: event.distanceAllerRetourKm || '',
    lienSocial: event.lienSocial || '',
    imageUrl: event.imageUrl || '',
    requiresValidation: event.requiresValidation || false,
    montantRecette: event.montantRecette !== undefined ? event.montantRecette.toString() : '',
    montantDepense: event.montantDepense !== undefined ? event.montantDepense.toString() : '',
    budgetRecettes: event.budgetRecettes || [],
    budgetDepenses: event.budgetDepenses || [],
    dateLimiteInscription: event.dateLimiteInscription || '',
    tenueRequise: event.tenueRequise || '',
    volunteerShifts: event.volunteerShifts || [],
    includesPercussion: event.includesPercussion !== false,
    includesDance: event.includesDance !== false,
    enableCarpool: event.enableCarpool !== false,
    description: event.description || '',
    linkedPatterns: event.linkedPatterns || [],
    specialiteAtelier: event.specialiteAtelier || 'general',
    programmeFabrication: event.programmeFabrication || null
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState(() => {
    const url = event.imageUrl;
    if (url && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('firebasestorage')) {
      return 'url';
    }
    return 'upload';
  });

  const [indemniteKilometrique, setIndemniteKilometrique] = useState(0);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [lieuxImportants, setLieuxImportants] = useState([]);
  const [defaultLocationsByEventType, setDefaultLocationsByEventType] = useState({});
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(["Alfaia", "Caixa", "Tarol", "Gonguê", "Agbê", "Mineiro", "Timbal", "Chant", "Danse"]);
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [enableCarpoolReimbursement, setEnableCarpoolReimbursement] = useState(true);
  const [reimbursementRule, setReimbursementRule] = useState('full_cars_only');
  const [lienGoogleFormRecoltePhotos, setLienGoogleFormRecoltePhotos] = useState('');
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [showMediaQrCodeModal, setShowMediaQrCodeModal] = useState(false);
  const [isSendContractModalOpen, setIsSendContractModalOpen] = useState(false);
  const [isHeaderCalendarMenuOpen, setIsHeaderCalendarMenuOpen] = useState(false);

  useHardwareBack(isEditingEvent, () => { if (typeof toggleEditing === 'function') toggleEditing(); else setIsEditingEvent(false); });
  useHardwareBack(showQrCodeModal, () => setShowQrCodeModal(false));
  useHardwareBack(showMediaQrCodeModal, () => setShowMediaQrCodeModal(false));
  useHardwareBack(isSendContractModalOpen, () => setIsSendContractModalOpen(false));

  const {
    morceauxSelectionnes,
    showMorceauxList,
    setShowMorceauxList,
    setlist,
    setSetlist,
    newMorceauTitre,
    setNewMorceauTitre,
    selectedCatalogRhythmUrl,
    setSelectedCatalogRhythmUrl,
    newMorceauJsonFile,
    setNewMorceauJsonFile,
    fileInputKey,
    setFileInputKey,
    newMorceauNotes,
    setNewMorceauNotes,
    updatingSetlist,
    handleAddMorceau,
    handleRemoveMorceau,
    handleAddDancadorChoreo,
    handleRemoveDancadorChoreo,
    dancadorChoreoIds
  } = useEventSetlist(event);

  const [assocSequenceurUrl, setAssocSequenceurUrl] = useState('');
  const [agendaRequireInstrument, setAgendaRequireInstrument] = useState(false);
  const [agendaEnableMaybeStatus, setAgendaEnableMaybeStatus] = useState(true);
  const [agendaEnableStageLayout, setAgendaEnableStageLayout] = useState(true);
  const [agendaEnableRevisionProgram, setAgendaEnableRevisionProgram] = useState(true);
  const [agendaEnableFinance, setAgendaEnableFinance] = useState(true);
  const [agendaEnableInscriptions, setAgendaEnableInscriptions] = useState(true);
  const [agendaEnableCarpool, setAgendaEnableCarpool] = useState(true);
  const [agendaEnableVolunteerShifts, setAgendaEnableVolunteerShifts] = useState(true);
  const [associationEventTypes, setAssociationEventTypes] = useState(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
  const [eventTypeConfigs, setEventTypeConfigs] = useState({});
  const [associationName, setAssociationName] = useState('');
  const [dressCodes, setDressCodes] = useState([]);
  const [customCategories, setCustomCategories] = useState(DEFAULT_CUSTOM_CATEGORIES);

  // 1. Vérification du Niveau Musique / Catégorie de pratique
  const eventRequiredPublic = resolveCategory(event.niveauRequis || event.publicCible, customCategories);
  
  let isMusicLevelRestricted = true;
  if (profileData?.niveauxParInstrument && Object.keys(profileData.niveauxParInstrument).length > 0) {
    // S'il y a des niveaux granulaires, on vérifie si au moins un instrument a le niveau requis
    const hasMatchingInst = Object.values(profileData.niveauxParInstrument).some(niv => {
      const resolvedNiv = resolveCategory(niv, customCategories);
      return isUserCategoryMatchingEvent(resolvedNiv, eventRequiredPublic, customCategories);
    });
    isMusicLevelRestricted = !hasMatchingInst;
  } else {
    // Fallback sur le niveau global
    const userMusicLevel = resolveCategory(profileData?.niveauMusique || profileData?.niveau, customCategories);
    isMusicLevelRestricted = !isUserCategoryMatchingEvent(userMusicLevel, eventRequiredPublic, customCategories);
  }

  // 2. Vérification du Niveau Danse
  const danseNiveauRequis = resolveCategory(event.niveauDanseRequis || event.danseNiveauRequis, customCategories);
  const userDanceLevel = resolveCategory(profileData?.niveauDanse, customCategories);
  const isDanceEvent = event.includesDance !== false || ['stage', 'prestation', 'atelier', 'repetition'].includes(event.type);
  const isDanceLevelRestricted = isDanceEvent && danseNiveauRequis && danseNiveauRequis !== 'tous' && danseNiveauRequis !== 'aucun' && (userDanceLevel !== danseNiveauRequis);

  const isPrestationRestricted = isMusicLevelRestricted;

  // useEventRSVP hook
  const {
    status,
    setStatus,
    transport,
    setTransport,
    demandeRemboursementKm,
    setDemandeRemboursementKm,
    besoinTransportInstrument,
    setBesoinTransportInstrument,
    saving,
    instrumentChoisi,
    setInstrumentChoisi,
    isInstrumentLocked,
    existingResponse,
    selectedManualUserId,
    setSelectedManualUserId,
    selectedManualInstrument,
    setSelectedManualInstrument,
    isManualRegisterOpen,
    setIsManualRegisterOpen,
    savingManualRegistration,
    handleStatusChange,
    handleSave,
    handleValidatePending,
    handleManualRegister,
    handleManualUnregister,
    handleUpdateStatus,
    handleUpdateMemberInstrument,
    handleAddInviteExterne,
    handleRemoveInviteExterne,
    dependents,
    familyMembers,
    familyResponses,
    handleToggleFamilyMemberSelection,
    handleFamilyMemberStatusChange,
    handleFamilyMemberInstrumentChange,
    handleFamilySave
  } = useEventRSVP(event, user, profileData, allUsers, isMusicLevelRestricted, setToastMessage);

  // useEventCarpool hook
  const {
    showProposerForm,
    setShowProposerForm,
    voitureForm,
    setVoitureForm,
    joiningVoitureId,
    setJoiningVoitureId,
    joinForm,
    setJoinForm,
    submittingCovoit,
    handleProposerVoiture,
    handleConfirmJoin,
    handleQuitterVoiture,
    handleRetirerVoiture,
    handleToggleRemboursement,
    handleChercherPlace,
    handleAnnulerCherchePlace,
    handleAssignPassenger,
    handleRemovePassenger
  } = useEventCarpool({
    event,
    user,
    profileData,
    demandeRemboursementKm,
    setDemandeRemboursementKm,
    enableCarpoolReimbursement,
    reimbursementRule
  });



  useEffect(() => {
    setIsEditingEvent(false);
    setEditForm({
      titre: event.titre || '',
      type: event.type || 'repetition',
      date: event.date || '',
      dateFin: event.dateFin || '',
      lieu: event.lieu || '',
      horairesPassages: event.horairesPassages || '',
      horaireCovoiturage: event.horaireCovoiturage || '',
      niveauRequis: event.niveauRequis || 'tous',
      niveauDanseRequis: event.niveauDanseRequis || 'aucun',
      lienDocument: event.lienDocument || '',
      distanceAllerRetourKm: event.distanceAllerRetourKm || '',
      lienSocial: event.lienSocial || '',
      imageUrl: event.imageUrl || '',
      requiresValidation: event.requiresValidation || false,
      isPublic: event.isPublic || false,
      montantRecette: event.montantRecette !== undefined ? event.montantRecette.toString() : '',
      montantDepense: event.montantDepense !== undefined ? event.montantDepense.toString() : '',
      budgetRecettes: event.budgetRecettes || [],
      budgetDepenses: event.budgetDepenses || [],
      dateLimiteInscription: event.dateLimiteInscription || '',
      dressCodePercussion: event.dressCodePercussion || '',
      dressCodeDanse: event.dressCodeDanse || '',
      tenueRequise: event.tenueRequise || '',
      volunteerShifts: event.volunteerShifts || [],
      includesPercussion: event.includesPercussion !== false,
      includesDance: event.includesDance !== false,
      enableCarpool: event.enableCarpool !== false,
      enableInscriptions: event.enableInscriptions !== false,
      description: event.description || '',
      latitude: event.latitude || null,
      longitude: event.longitude || null,
      linkedPatterns: event.linkedPatterns || []
    });
    const url = event.imageUrl;
    setImageMode(url && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('firebasestorage') ? 'url' : 'upload');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id, event.type, event.montantRecette, event.montantDepense, JSON.stringify(event.budgetRecettes), JSON.stringify(event.budgetDepenses), event.dateLimiteInscription, event.tenueRequise, event.volunteerShifts, event.imageUrl, event.includesPercussion, event.includesDance, event.enableCarpool, event.description]);

  // Charger association settings
  useEffect(() => {
    if (!event.groupId) return;
    const assocRef = doc(db, 'associations', event.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.nom) {
          setAssociationName(data.nom);
        }
        setIndemniteKilometrique(data.indemniteKilometrique || 0);
        setAdresseLocal(data.adresseLocal || '');
        setAssocSequenceurUrl(data.sequenceurUrl || '');
        setLienGoogleFormRecoltePhotos(data.lienGoogleFormRecoltePhotos || '');
        setEnableCarpoolReimbursement(data.enableCarpoolReimbursement !== false);
        setReimbursementRule(data.reimbursementRule || 'full_cars_only');
        setAgendaRequireInstrument(data.agendaRequireInstrument || false);
        setAgendaEnableMaybeStatus(data.agendaEnableMaybeStatus !== false);
        setAgendaEnableStageLayout(data.agendaEnableStageLayout !== false);
        setAgendaEnableRevisionProgram(data.agendaEnableRevisionProgram !== false);
        setAgendaEnableFinance(data.agendaEnableFinance !== false);
        setAgendaEnableInscriptions(data.agendaEnableInscriptions !== false);
        setAgendaEnableCarpool(data.agendaEnableCarpool !== false);
        setAgendaEnableVolunteerShifts(data.agendaEnableVolunteerShifts !== false);
        setEventTypeConfigs(data.eventTypeConfigs || {});
        if (Array.isArray(data.eventTypes) && data.eventTypes.length > 0) {
          setAssociationEventTypes(data.eventTypes);
        } else {
          setAssociationEventTypes(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
        }
        setDressCodes(data.dressCodes || []);
        if (Array.isArray(data.customCategories) && data.customCategories.length > 0) {
          setCustomCategories(data.customCategories);
        }
        setLieuxImportants(Array.isArray(data.lieuxImportants) ? data.lieuxImportants : []);
        setDefaultLocationsByEventType(data.defaultLocationsByEventType && typeof data.defaultLocationsByEventType === 'object' ? data.defaultLocationsByEventType : {});
        if (Array.isArray(data.instrumentsDisponibles)) {
          setInstrumentsDisponibles(data.instrumentsDisponibles);
        }
        if (Array.isArray(data.linkedInstruments)) {
          const normalized = data.linkedInstruments.map(link => {
            if (Array.isArray(link)) {
              return { name: '', instruments: link };
            } else if (link && typeof link === 'object') {
              if (Array.isArray(link.instruments)) {
                return { name: link.name || '', instruments: link.instruments };
              } else if (link.inst1 && link.inst2) {
                return { name: link.name || '', instruments: [link.inst1, link.inst2] };
              }
            }
            return null;
          }).filter(Boolean);
          setLinkedInstruments(normalized);
        } else {
          setLinkedInstruments([]);
        }
      }
    });
    return () => unsubscribe();
  }, [event.groupId]);

  // Synchroniser users list to récupérer instruments and names in real-time
  useEffect(() => {
    if (!event.groupId) return;
    const q = query(collection(db, 'users'), where('groupId', '==', event.groupId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = [];
      snapshot.forEach(docSnap => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAllUsers(usersList);
    });
    return () => unsubscribe();
  }, [event.groupId]);

  const [wardrobeCostumes, setWardrobeCostumes] = useState([]);

  useEffect(() => {
    if (!event?.groupId) return;

    const qCostumes = query(collection(db, 'costumes'), where('groupId', '==', event.groupId));
    const qInventory = query(collection(db, 'wardrobeInventory'), where('groupId', '==', event.groupId));

    let costumesData = [];
    let inventoryData = [];

    const syncCostumes = () => {
      const merged = new Map();

      costumesData.forEach(c => {
        const name = (c.title || c.titre || c.name || c.type || '').trim();
        if (name && !merged.has(name)) {
          merged.set(name, {
            id: c.id || name,
            name: name,
            targetCategory: c.targetCategory || 'Toutes'
          });
        }
      });

      inventoryData.forEach(i => {
        const name = (i.type || i.nom || i.name || i.title || '').trim();
        if (name && !merged.has(name)) {
          merged.set(name, {
            id: i.id || name,
            name: name,
            targetCategory: i.category || 'Pièce'
          });
        }
      });

      setWardrobeCostumes(Array.from(merged.values()));
    };

    const unsubCostumes = onSnapshot(qCostumes, (snap) => {
      const list = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      costumesData = list;
      syncCostumes();
    }, (err) => console.warn("EventDetails - Erreur snapshot costumes:", err));

    const unsubInventory = onSnapshot(qInventory, (snap) => {
      const list = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      inventoryData = list;
      syncCostumes();
    }, (err) => console.warn("EventDetails - Erreur snapshot wardrobeInventory:", err));

    return () => {
      unsubCostumes();
      unsubInventory();
    };
  }, [event?.groupId]);

  // Enforce absent status if prestation is restricted for beginners
  useEffect(() => {
    if (isPrestationRestricted && status !== 'absent') {
      setStatus('absent');
    }
  }, [isPrestationRestricted, status, setStatus]);

  const handleUpdateEventStatus = async (newStatus) => {
    if (!event.id) return;
    try {
      const eventRef = doc(db, 'events', event.id);
      const updates = { status: newStatus };

      let isConfirmingNow = false;
      let isCancellingNow = false;

      if (event.status === 'a_confirmer' && newStatus === 'confirme') {
        const isOk = await confirm({
          title: "Confirmer l'événement",
          message: "Attention, en validant cet événement, une notification sera envoyée (selon vos règles d'automatisation) à tous les membres concernés par cet événement. Voulez-vous continuer ?",
          confirmText: "Oui, valider",
          cancelText: "Annuler",
          variant: "danger"
        });
        
        if (!isOk) return; // User cancelled
        
        updates.wasConfirmedLater = true;
        isConfirmingNow = true;
      } else if (event.status !== 'annule' && newStatus === 'annule') {
        const isOk = await confirm({
          title: "Annuler l'événement",
          message: "Attention, en annulant cet événement, une notification sera envoyée (selon vos règles d'automatisation) à tous les membres concernés par cet événement. Voulez-vous continuer ?",
          confirmText: "Oui, annuler",
          cancelText: "Retour",
          variant: "danger"
        });
        
        if (!isOk) return;
        isCancellingNow = true;
      }

      await updateDoc(eventRef, updates);

      if (isConfirmingNow && event.groupId) {
        // Run automation and await result to provide accurate feedback
        const result = await triggerEventStatusAutomation(event.groupId, { ...event, ...updates }, 'eventConfirmed');
        if (setToastMessage) {
           if (result.triggeredCount > 0) {
             setToastMessage(`Événement validé ! ${result.triggeredCount} notification(s) envoyée(s).`);
           } else {
             setToastMessage("Événement validé ! (0 notification : aucune règle active ou aucun membre concerné)");
           }
           setTimeout(() => setToastMessage(null), 4500);
           return;
        }
      }

      if (isCancellingNow && event.groupId) {
        const result = await triggerEventStatusAutomation(event.groupId, { ...event, ...updates }, 'eventCancelled');
        if (setToastMessage) {
           if (result.triggeredCount > 0) {
             setToastMessage(`Événement annulé ! ${result.triggeredCount} notification(s) envoyée(s).`);
           } else {
             setToastMessage("Événement annulé ! (0 notification : aucune règle active ou aucun membre concerné)");
           }
           setTimeout(() => setToastMessage(null), 4500);
           return;
        }
      }

      if (setToastMessage) {
        setToastMessage("Statut de l'événement mis à jour");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error("EventDetails - Erreur mise à jour statut événement :", err);
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  const [tagsDisponibles, setTagsDisponibles] = useState([]);
  const [permissionsMatrice, setPermissionsMatrice] = useState(null);

  useEffect(() => {
    if (!event?.groupId) return;
    const assocRef = doc(db, 'associations', event.groupId);
    const unsubscribe = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTagsDisponibles(Array.isArray(data.tagsDisponibles) ? data.tagsDisponibles : []);
        setPermissionsMatrice(data.permissionsMatrice || null);
      }
    });
    return () => unsubscribe();
  }, [event?.groupId]);

  const effectiveUserTags = React.useMemo(() => {
    return resolveEffectiveUserTags(profileData?.tags || [], tagsDisponibles);
  }, [profileData?.tags, tagsDisponibles]);

  const userDiscipline = React.useMemo(() => {
    const insts = (profileData?.instrumentsJoues || []).map(i => String(i).toLowerCase());
    const discipline = (profileData?.discipline || '').toLowerCase();
    const isDanse = insts.some(i => i.includes('danse')) || discipline === 'danse';
    const isPercu = insts.some(i => !i.includes('danse')) || discipline === 'percussion';

    if (isDanse && !isPercu) return 'danse';
    if (isPercu && !isDanse) return 'percussion';
    return 'both';
  }, [profileData?.instrumentsJoues, profileData?.discipline]);

  const [isMemberViewSimulation, setIsMemberViewSimulation] = useState(false);

  const rawIsAuthorized = React.useMemo(() => {
    return canManageEvents(profileData, permissionsMatrice, effectiveUserTags);
  }, [profileData, permissionsMatrice, effectiveUserTags]);

  const isAuthorized = rawIsAuthorized && !isMemberViewSimulation;

  const hasFinanceAccess = React.useMemo(() => {
    if (isAuthorized) return true;

    // Vérifier permissionsMatrice for 'events-finances' or 'tresorerie'
    if (permissionsMatrice) {
      const allowed = permissionsMatrice['events-finances'] || permissionsMatrice['tresorerie'] || [];
      if (allowed.includes('all')) return true;
      if (allowed.includes(profileData?.role)) return true;

      const hasTag = allowed.some(r => {
        const targetLower = String(r).toLowerCase();
        return effectiveUserTags.some(t => {
          const tagStr = typeof t === 'string' ? t : getTagId(t);
          if (tagStr.toLowerCase() === targetLower) return true;
          const tagObj = findTagObject(tagStr, tagsDisponibles);
          if (tagObj) {
            if (tagObj.id && String(tagObj.id).toLowerCase() === targetLower) return true;
            if (tagObj.nomM && String(tagObj.nomM).toLowerCase() === targetLower) return true;
            if (tagObj.nomF && String(tagObj.nomF).toLowerCase() === targetLower) return true;
          }
          return false;
        });
      });
      if (hasTag) return true;
    }

    // Keyword fallback vérifier (tresorier, tresorerie, bureau, ca, president, etc.)
    const financeKeywords = ['tresorier', 'tresoriere', 'tresorerie', 'bureau', 'ca', 'president', 'presidente'];
    const hasTagAccess = effectiveUserTags.some(t => {
      const tagStr = typeof t === 'string' ? t : getTagId(t);
      const lower = tagStr.toLowerCase();
      const tagObj = findTagObject(tagStr, tagsDisponibles);
      const nomMLower = tagObj?.nomM?.toLowerCase() || '';
      const nomFLower = tagObj?.nomF?.toLowerCase() || '';
      return financeKeywords.some(kw => lower.includes(kw) || nomMLower.includes(kw) || nomFLower.includes(kw));
    });

    return hasTagAccess && !isMemberViewSimulation;
  }, [isAuthorized, profileData?.role, permissionsMatrice, effectiveUserTags, tagsDisponibles, isMemberViewSimulation]);

  const canAccessAdminTab = isAuthorized || hasFinanceAccess;

  const getPupitreName = (inst) => {
    if (!inst) return null;
    const parts = inst.split(' + ').map(p => p.trim());
    const match = linkedInstruments.find(group => {
      const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      if (groupInsts.length !== parts.length) return false;
      const sortedGroup = [...groupInsts].sort();
      const sortedParts = [...parts].sort();
      return sortedGroup.every((val, idx) => val === sortedParts[idx]);
    });
    if (match && match.name) return match.name;

    if (parts.length === 1) {
      const containingGroup = linkedInstruments.find(group => {
        const groupInsts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
        return groupInsts.includes(parts[0]) && group.name;
      });
      if (containingGroup) return containingGroup.name;
    }
    return null;
  };

  const getMemberInstrumentOptions = (mInfo) => {
    let rawUserInstruments = [];
    const isDanse = Boolean(mInfo?.pratiqueDanse);
    const isPercussion = Boolean(mInfo?.pratiquePercussion);
    
    // Si percussion, on prend ses instruments de percussion
    if (isPercussion) {
      const percs = (mInfo?.instrumentsJoues && mInfo.instrumentsJoues.length > 0)
        ? mInfo.instrumentsJoues.filter(i => typeof i === 'string' && !i.toLowerCase().includes('danse'))
        : (mInfo?.instrument && !mInfo.instrument.toLowerCase().includes('danse') ? [mInfo.instrument] : []);
      rawUserInstruments = [...percs];
    } else if (!isDanse) {
      // Fallback ancien profil (ni l'un ni l'autre cochés, mais a un instrument)
      rawUserInstruments = (mInfo?.instrumentsJoues && mInfo.instrumentsJoues.length > 0)
        ? [...mInfo.instrumentsJoues]
        : (mInfo?.instrument ? [mInfo.instrument] : []);
    }

    // Filtrer selon le niveau requis de l'événement si défini (pour la musique)
    const eventRequiredPublic = resolveCategory(event.niveauRequis || event.publicCible, customCategories);
    if (eventRequiredPublic && eventRequiredPublic !== 'tous' && eventRequiredPublic !== 'aucun') {
      rawUserInstruments = rawUserInstruments.filter(inst => {
        const instNiveau = mInfo?.niveauxParInstrument?.[inst] || mInfo?.niveauMusique || mInfo?.niveau;
        const resolvedNiv = resolveCategory(instNiveau, customCategories);
        return isUserCategoryMatchingEvent(resolvedNiv, eventRequiredPublic, customCategories);
      });
    }

    let base = [...rawUserInstruments];

    // Ajout de la Danse si pratiquée et non restreinte
    if (isDanse || (mInfo?.instrument && mInfo.instrument.toLowerCase().includes('danse'))) {
      const mDanceLevel = mInfo?.niveauDanse || 'aucun';
      const mDanceRestricted = isDanceEvent && danseNiveauRequis === 'confirme' && (mDanceLevel === 'debutant' || mDanceLevel === 'aucun');
      if (!mDanceRestricted && !base.some(i => i.toLowerCase().includes('danse'))) {
        base.push('Danse');
      }
    }

    // Si mInfo a déjà un instrument choisi dans Firestore, le conserver
    if (mInfo?.instrumentChoisi && !base.includes(mInfo.instrumentChoisi)) {
      base.push(mInfo.instrumentChoisi);
    }

    // Combinaisons autorisées pour les polyvalents si le membre possède TOUS les instruments du groupe
    const percsOnly = base.filter(i => !i.toLowerCase().includes('danse'));
    if (percsOnly.length > 1) {
      linkedInstruments.forEach(link => {
        const instrumentsArray = link.instruments || (Array.isArray(link) ? link : [link.inst1, link.inst2]);
        const hasAll = instrumentsArray.every(inst => percsOnly.includes(inst));
        if (hasAll) {
          const combined = instrumentsArray.join(' + ');
          if (!base.includes(combined)) {
            base.push(combined);
          }
        }
      });
    }

    // S'il n'y a qu'une seule option "Danse" et que le membre ne fait pas de percussion,
    // on renvoie juste ['Danse'].
    return base;
  };

  const formatToUTCISO8601 = (date) => {
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    return `${y}${m}${d}T${h}${min}${s}Z`;
  };

  const getEventDetailsText = () => {
    let detailsText = `Type d'événement : ${event.type || ''}`;
    if (event.lieu) detailsText += `\n📍 Lieu : ${event.lieu}`;
    if (event.tenueRequise) detailsText += `\n👕 Tenue requise : ${event.tenueRequise}`;
    if (event.horairesPassages) detailsText += `\n⏱️ Horaires de passage : ${event.horairesPassages}`;
    if (event.horaireCovoiturage) detailsText += `\n🚗 Covoiturage : ${event.horaireCovoiturage}`;
    if (event.niveauRequis) {
      const musLvl = event.niveauRequis === 'aucun' ? 'Pas de musicien' :
                     event.niveauRequis === 'debutant' ? 'Débutant' :
                     event.niveauRequis === 'confirme' ? 'Confirmé' : 'Tout le monde';
      detailsText += `\n🎯 Niveau requis (Musique) : ${musLvl}`;
    }
    if (event.niveauDanseRequis) {
      const danseLvl = event.niveauDanseRequis === 'aucun' ? 'Pas de danse' :
                       event.niveauDanseRequis === 'debutant' ? 'Débutant' :
                       event.niveauDanseRequis === 'confirme' ? 'Confirmé' : 'Tout le monde';
      detailsText += `\n💃 Danse (Niveau requis) : ${danseLvl}`;
    }
    if (event.lienDocument) detailsText += `\n📄 Document / Ordre du jour : ${event.lienDocument}`;
    return detailsText;
  };

  const getEventEndTimestamp = (startDate) => {
    if (event.dateFin) {
      const parsedEnd = new Date(event.dateFin);
      if (!isNaN(parsedEnd.getTime()) && parsedEnd.getTime() > startDate.getTime()) {
        return parsedEnd;
      }
    }
    // Default duration: 1 hour if no end date specified
    return new Date(startDate.getTime() + 1 * 60 * 60 * 1000);
  };

  const handleAddToGoogleCalendar = () => {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) {
      alert("Impossible d'ajouter à l'agenda : date invalide.");
      return;
    }
    const endDate = getEventEndTimestamp(eventDate);
    const startStr = formatToUTCISO8601(eventDate);
    const endStr = formatToUTCISO8601(endDate);

    const title = encodeURIComponent(event.titre || 'Événement Roda');
    const dates = `${startStr}/${endStr}`;
    const details = encodeURIComponent(getEventDetailsText());
    const location = encodeURIComponent(event.lieu || '');

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadIcs = () => {
    const eventDate = new Date(event.date);
    if (isNaN(eventDate.getTime())) {
      alert("Impossible de générer le fichier iCal : date invalide.");
      return;
    }
    const endDate = getEventEndTimestamp(eventDate);
    const startStr = formatToUTCISO8601(eventDate);
    const endStr = formatToUTCISO8601(endDate);
    const stampStr = formatToUTCISO8601(new Date());

    const summary = event.titre || 'Événement Roda';
    const description = getEventDetailsText().replace(/\n/g, '\\n');
    const location = event.lieu || '';

    const prodIdName = (associationName || 'O Girador').replace(/[^a-zA-Z0-9 ]/g, '');
    const cleanUidDomain = (associationName || 'o-girador').toLowerCase().replace(/[^a-z0-9]/g, '-');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      `PRODID:-//${prodIdName}//Event Calendar//FR`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:event-${event.id || Date.now()}@${cleanUidDomain}`,
      `DTSTAMP:${stampStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (event.titre || 'evenement').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.download = `${cleanTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!event.id) return;

    const editType = editForm.type || 'repetition';
    const editConfig = {
      agendaRequireInstrument,
      agendaEnableMaybeStatus,
      agendaEnableStageLayout,
      agendaEnableRevisionProgram,
      agendaEnableCarpool: agendaEnableCarpool && (editForm.enableCarpool !== false),
      agendaEnableFinance,
      agendaEnableInscriptions,
      agendaEnableImage: true,
      agendaEnableOrdreDuJour: editType === 'reunion',
      agendaEnableAdresse: true,
      agendaEnableUrl: true
    };

    setSavingEvent(true);
    try {
      const updatedLienDocument = editConfig.agendaEnableOrdreDuJour ? editForm.lienDocument || '' : '';
      const updatedDescription = editForm.description || '';

      const updatedLieu = editConfig.agendaEnableAdresse ? editForm.lieu || '' : '';
      const updatedLieuId = editForm.lieuId !== undefined ? editForm.lieuId : (event.lieuId || null);

      const eventRef = doc(db, 'events', event.id);
      const docSnap = await getDoc(eventRef);
      if (!docSnap.exists()) {
        alert("Cet événement n'existe plus dans l'agenda (il a été supprimé lors de la validation d'une date de sondage).");
        if (onClose) onClose();
        return;
      }

      await updateDoc(eventRef, {
        titre: editForm.titre,
        type: editForm.type,
        date: editForm.date,
        dateFin: editForm.dateFin || '',
        lieu: updatedLieu,
        lieuSimple: updatedLieu,
        lieuId: updatedLieuId,
        horairesPassages: (editForm.type === 'prestation') ? editForm.horairesPassages || '' : '',
        horaireCovoiturage: editConfig.agendaEnableCarpool ? editForm.horaireCovoiturage || '' : '',
        niveauRequis: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') ? editForm.niveauRequis || 'tous' : 'tous',
        niveauDanseRequis: (editForm.type === 'prestation' || editForm.type === 'stage' || editForm.type === 'repetition' || editForm.type === 'atelier') ? editForm.niveauDanseRequis || 'aucun' : 'aucun',
        lienDocument: updatedLienDocument,
        lienDepotMedias: editForm.lienDepotMedias || '',
        distanceAllerRetourKm: editConfig.agendaEnableCarpool ? (parseFloat(editForm.distanceAllerRetourKm) || 0) : 0,
        lienSocial: editConfig.agendaEnableUrl ? editForm.lienSocial || '' : '',
        imageUrl: editConfig.agendaEnableImage ? editForm.imageUrl || '' : '',
        requiresValidation: editConfig.agendaEnableInscriptions ? (editForm.requiresValidation || false) : false,
        isPublic: editForm.isPublic || false,
        montantRecette: editConfig.agendaEnableFinance ? (parseFloat(editForm.montantRecette) || 0) : 0,
        montantDepense: editConfig.agendaEnableFinance ? ((editForm.budgetDepenses || []).reduce((sum, item) => sum + (parseFloat(item.montant) || 0), 0)) : 0,
        budgetRecettes: [], // Obsolète dans le nouveau modèle unifié
        budgetDepenses: editConfig.agendaEnableFinance ? (editForm.budgetDepenses || []) : [],
        dateLimiteInscription: editConfig.agendaEnableInscriptions ? editForm.dateLimiteInscription || '' : '',
        dressCodePercussion: editForm.dressCodePercussion || '',
        dressCodeDanse: editForm.dressCodeDanse || '',
        tenueRequise: editForm.tenueRequise || (
          editForm.dressCodePercussion && editForm.dressCodeDanse
            ? `🥁 Percussion: ${editForm.dressCodePercussion} | 💃 Danse: ${editForm.dressCodeDanse}`
            : (editForm.dressCodePercussion || editForm.dressCodeDanse || '')
        ),
        volunteerShifts: editForm.volunteerShifts || [],
        includesPercussion: editForm.includesPercussion || false,
        includesDance: editForm.includesDance || false,
        enableCarpool: editForm.enableCarpool !== false,
        enableInscriptions: editForm.enableInscriptions !== false,
        description: updatedDescription,
        latitude: editForm.latitude ? Number(editForm.latitude) : null,
        longitude: editForm.longitude ? Number(editForm.longitude) : null,
        linkedPatterns: editForm.linkedPatterns || [],
        specialiteAtelier: (editForm.type === 'atelier' || editForm.type === 'stage') ? (editForm.specialiteAtelier || 'general') : null,
        programmeFabrication: (editForm.type === 'atelier' || editForm.type === 'stage') && editForm.specialiteAtelier === 'fabrication' ? (editForm.programmeFabrication || null) : null
      });

      // Synchronisation automatique par lot (batch mettre à jour) si l'événement fait partie d'un sondage (pollGroupId)
      if (event.pollGroupId) {
        try {
          const pollQuery = query(collection(db, 'events'), where('pollGroupId', '==', event.pollGroupId));
          const pollSnapshot = await getDocs(pollQuery);
          if (!pollSnapshot.empty) {
            const batch = writeBatch(db);
            pollSnapshot.forEach((docSnap) => {
              if (docSnap.id !== event.id) {
                batch.update(docSnap.ref, {
                  lieu: updatedLieu,
                  lieuSimple: updatedLieu,
                  lieuId: updatedLieuId,
                  lienDocument: updatedLienDocument,
                  description: updatedDescription,
                  latitude: editForm.latitude ? Number(editForm.latitude) : null,
                  longitude: editForm.longitude ? Number(editForm.longitude) : null
                });
              }
            });
            await batch.commit();
          }
        } catch (batchErr) {
          console.error("EventDetails - Erreur de synchronisation des événements du sondage :", batchErr);
        }
      }

      setIsEditingEvent(false);
      alert("Événement mis à jour avec succès !");
    } catch (err) {
      console.error("EventDetails - Erreur de modification événement :", err);
      alert("Erreur lors de l'enregistrement de l'événement.");
    } finally {
      setSavingEvent(false);
    }
  };

  const handlePreparePublication = () => {
    const newUrl = `${window.location.pathname}?eventId=${event.id}`;
    window.history.pushState({}, '', newUrl);
    if (onNavigateToView) {
      onNavigateToView('studio-social');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const storagePath = `documents/${event.groupId}/events/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setEditForm(prev => ({ ...prev, imageUrl: downloadURL }));
      alert(translate('widgetAgenda.uploadSuccess', "Image téléversée !"));
    } catch (error) {
      console.error("EventDetails - Erreur upload image :", error);
      alert(translate('widgetAgenda.uploadError', "Erreur lors du téléversement de l'image."));
    } finally {
      setUploadingImage(false);
    }
  };

  // Group presents by instrument for grouped presence list display
  const presentsByInstrument = {};
  if (event.inscriptions && event.inscriptions.length > 0) {
    event.inscriptions.forEach((ins) => {
      if (ins.status === 'present') {
        const userInfo = allUsers.find(u => u.id === ins.userId) || { id: ins.userId, prenom: ins.userName, nom: '', instrument: 'Autre' };
        const inst = ins.instrumentChoisi || userInfo.instrument || 'Autre';
        if (!presentsByInstrument[inst]) {
          presentsByInstrument[inst] = [];
        }
        presentsByInstrument[inst].push({
          ...userInfo,
          isInvite: false
        });
      }
    });
  }

  // Ajouter external guests to grouped presence list
  if (event.invitesExternes && event.invitesExternes.length > 0) {
    event.invitesExternes.forEach((invite) => {
      const inst = invite.instrument || invite.fonction || 'Autre';
      if (!presentsByInstrument[inst]) {
        presentsByInstrument[inst] = [];
      }
      presentsByInstrument[inst].push({
        id: invite.id,
        prenom: invite.nom,
        nom: '',
        instrument: inst,
        photoURL: null,
        isInvite: true
      });
    });
  }

  // Extract convoi drivers and individual drivers
  const convoiDrivers = [];
  if (event.covoiturage?.voitures) {
    event.covoiturage.voitures.forEach(voiture => {
      if (voiture.chauffeurId && voiture.chauffeurNom) {
        const carStatus = calculateCarStatus(voiture, { enableCarpoolReimbursement, reimbursementRule });
        convoiDrivers.push({
          id: voiture.chauffeurId,
          nom: voiture.chauffeurNom,
          isEligibleRefund: carStatus.isEligibleForReimbursement
        });
      }
    });
  }

  const convoiChauffeurIds = new Set(convoiDrivers.map(d => d.id));
  const individualDrivers = [];
  if (event.inscriptions) {
    event.inscriptions.forEach(ins => {
      if (ins.status === 'present' && ins.transport === 'propre') {
        if (!convoiChauffeurIds.has(ins.userId)) {
          individualDrivers.push({
            id: ins.userId,
            nom: ins.userName
          });
        }
      }
    });
  }

  // Date parsing for visual header
  const dateObj = new Date(event.date);
  const formattedDate = isNaN(dateObj.getTime()) 
    ? 'Date inconnue' 
    : dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const dateFinObj = event.dateFin ? new Date(event.dateFin) : null;
  const hasDateFin = dateFinObj && !isNaN(dateFinObj.getTime());
  const formattedDateFin = hasDateFin
    ? dateFinObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const formattedTimeFin = hasDateFin
    ? dateFinObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const dateLimiteObj = event.dateLimiteInscription ? new Date(event.dateLimiteInscription) : null;
  const hasDateLimite = dateLimiteObj && !isNaN(dateLimiteObj.getTime());
  const formattedDateLimite = hasDateLimite
    ? dateLimiteObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const formattedTimeLimite = hasDateLimite
    ? dateLimiteObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const isRegistrationDeadlinePassed = event.dateLimiteInscription
    ? new Date(event.dateLimiteInscription) < new Date()
    : false;

  const typeVariants = {
    prestation: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft',
    atelier: 'jaune'
  };

  const currentVariant = typeVariants[event.type] || 'default';

  const eventType = event.type || 'repetition';
  const rawCurrentConfig = eventTypeConfigs[eventType] || {};
  const currentConfig = {
    agendaRequireInstrument: rawCurrentConfig.agendaRequireInstrument || false,
    agendaEnableMaybeStatus: rawCurrentConfig.agendaEnableMaybeStatus !== false,
    agendaEnableStageLayout: rawCurrentConfig.agendaEnableStageLayout !== false,
    agendaEnableRevisionProgram: rawCurrentConfig.agendaEnableRevisionProgram !== false,
    agendaEnableCarpool: (rawCurrentConfig.agendaEnableCarpool !== false) && (event.enableCarpool !== false),
    agendaEnableFinance: rawCurrentConfig.agendaEnableFinance !== undefined ? rawCurrentConfig.agendaEnableFinance : agendaEnableFinance,
    agendaEnableInscriptions: rawCurrentConfig.agendaEnableInscriptions !== false,
    agendaEnableImage: rawCurrentConfig.agendaEnableImage !== false,
    agendaEnableOrdreDuJour: rawCurrentConfig.agendaEnableOrdreDuJour !== undefined ? rawCurrentConfig.agendaEnableOrdreDuJour : (eventType === 'reunion'),
    agendaEnableAdresse: rawCurrentConfig.agendaEnableAdresse !== false,
    agendaEnableUrl: rawCurrentConfig.agendaEnableUrl !== false,
    agendaEnableVolunteerShifts: rawCurrentConfig.agendaEnableVolunteerShifts !== undefined ? rawCurrentConfig.agendaEnableVolunteerShifts : (agendaEnableVolunteerShifts && (eventType === 'prestation' || eventType === 'stage'))
  };

  const editType = editForm.type || 'repetition';
  const rawEditConfig = eventTypeConfigs[editType] || {};
  const editConfig = {
    agendaRequireInstrument: rawEditConfig.agendaRequireInstrument || false,
    agendaEnableMaybeStatus: rawEditConfig.agendaEnableMaybeStatus !== false,
    agendaEnableStageLayout: rawEditConfig.agendaEnableStageLayout !== false,
    agendaEnableRevisionProgram: rawEditConfig.agendaEnableRevisionProgram !== false,
    agendaEnableCarpool: (rawEditConfig.agendaEnableCarpool !== false) && (editForm.enableCarpool !== false),
    agendaEnableFinance: rawEditConfig.agendaEnableFinance !== undefined ? rawEditConfig.agendaEnableFinance : agendaEnableFinance,
    agendaEnableInscriptions: rawEditConfig.agendaEnableInscriptions !== false,
    agendaEnableImage: rawEditConfig.agendaEnableImage !== false,
    agendaEnableOrdreDuJour: rawEditConfig.agendaEnableOrdreDuJour !== undefined ? rawEditConfig.agendaEnableOrdreDuJour : (editType === 'reunion'),
    agendaEnableAdresse: rawEditConfig.agendaEnableAdresse !== false,
    agendaEnableUrl: rawEditConfig.agendaEnableUrl !== false,
    agendaEnableVolunteerShifts: rawEditConfig.agendaEnableVolunteerShifts !== undefined ? rawEditConfig.agendaEnableVolunteerShifts : (agendaEnableVolunteerShifts && (editType === 'prestation' || editType === 'stage'))
  };

  const unregisteredUsers = allUsers
    .filter(u => u.prenom && !(event.inscriptions || []).some(ins => ins.userId === u.id))
    .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`));

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full relative">
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#84967a] text-encre-noire border-2 border-encre-noire px-5 py-3 rounded-[8px_12px_9px_11px] shadow-[4px_4px_0px_0px_#181716] font-bold text-xs uppercase tracking-wider animate-bounce select-none">
          {toastMessage}
        </div>
      )}
      {/* Header with back button, modifier button & navigation arrows */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b-2 border-dashed border-cordel-master-dark/30 pb-2.5 select-none gap-3">
        {/* Navigation & Back buttons */}
        <div className="flex items-center justify-between w-full md:w-auto gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs font-black">
              ← {t('common.back')}
            </CordelButton>
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-2.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center justify-center select-none"
                title="Événement précédent"
              >
                ◀
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-2.5 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-neutral-100 cursor-pointer flex items-center justify-center select-none"
                title="Événement suivant"
              >
                ▶
              </button>
            )}
          </div>

          {/* Title on mobile */}
          <span className="panel-title text-xs font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-1 md:hidden">
            <XiloCalendar size={12} /> {t('eventDetails.title')}
          </span>
        </div>

        {/* Title on desktop */}
        <span className="panel-title text-sm font-extrabold tracking-wider text-cordel-wood uppercase hidden md:flex items-center gap-1 pt-1">
          <XiloCalendar size={14} /> {t('eventDetails.title')}
        </span>

        {/* Action buttons (QR Code Public, Publication, Modify, Supprimer) */}
        {!isEditingEvent && (
          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end md:max-w-[60%] xl:max-w-[50%]">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderCalendarMenuOpen(!isHeaderCalendarMenuOpen)}
                className="text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-900 px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-blue-200 cursor-pointer flex items-center gap-1 flex-1 lg:flex-none justify-center transition-colors"
                title="Ajouter cet événement à votre agenda personnel"
              >
                📅 Ajouter à mon agenda
              </button>
              {isHeaderCalendarMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsHeaderCalendarMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-full min-w-[180px] bg-cordel-bg-light border-2 border-encre-noire rounded-[6px_10px_8px_12px] shadow-[3px_3px_0px_0px_#181716] py-1.5 z-50 flex flex-col text-left">
                    <button
                       type="button"
                       onClick={() => {
                         handleAddToGoogleCalendar();
                         setIsHeaderCalendarMenuOpen(false);
                       }}
                       className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                    >
                       🔵 Google Agenda
                    </button>
                    <div className="border-t border-dashed border-encre-noire/15 my-0.5" />
                    <button
                       type="button"
                       onClick={() => {
                         handleDownloadIcs();
                         setIsHeaderCalendarMenuOpen(false);
                       }}
                       className="w-full px-4 py-2 text-[10px] font-black uppercase tracking-wider text-encre-noire hover:bg-cordel-hover cursor-pointer text-left"
                    >
                       🍏 Apple / Outlook (.ics)
                    </button>
                  </div>
                </>
              )}
            </div>

            {rawIsAuthorized && (
              <button
                type="button"
                onClick={() => setIsMemberViewSimulation(!isMemberViewSimulation)}
                className={`text-[10px] font-black uppercase border px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1 flex-1 lg:flex-none justify-center transition-colors ${
                  isMemberViewSimulation 
                    ? 'bg-amber-600 text-white border-amber-800' 
                    : 'bg-stone-200 text-stone-800 border-stone-400 hover:bg-stone-300'
                }`}
                title="Aperçu Vue Adhérent"
              >
                👁️ {isMemberViewSimulation ? 'Quitter la vue adhérent' : 'Aperçu Vue Adhérent'}
              </button>
            )}

            {lienGoogleFormRecoltePhotos && (
              <button
                type="button"
                onClick={() => setShowQrCodeModal(true)}
                className="text-[10px] font-black uppercase bg-amber-600 text-white border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:bg-amber-700 cursor-pointer flex items-center gap-1.5 flex-1 lg:flex-none justify-center transition-colors"
                title="Afficher le QR Code pour récolter les photos et vidéos des spectateurs"
              >
                📷 QR Code Récolte Photos
              </button>
            )}

            {isAuthorized && (
              <>
                <button
                  type="button"
                  onClick={() => setIsSendContractModalOpen(true)}
                  className="text-[10px] font-black uppercase bg-cordel-vert text-white border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 cursor-pointer flex items-center gap-1 flex-1 lg:flex-none justify-center transition-colors"
                  title="Envoyer un contrat ou devis par email via l'API Brevo"
                >
                  📝 Envoyer un contrat (Brevo)
                </button>
                <button
                  type="button"
                  onClick={handlePreparePublication}
                  className="text-[10px] font-black uppercase bg-cordel-ocre text-black border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1 flex-1 lg:flex-none justify-center"
                >
                  <XiloMegaphone size={12} /> Préparer la publication
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingEvent(true)}
                  className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex-1 lg:flex-none justify-center"
                >
                  ✏️ Modifier
                </button>
                <CordelButton
                  type="button"
                  variant="rouge"
                  onClick={handleDeleteEvent}
                  className="text-[10px] px-3 py-1.5 uppercase font-black flex items-center gap-1 flex-1 lg:flex-none justify-center"
                >
                  🗑️ Supprimer
                </CordelButton>
              </>
            )}
          </div>
        )}

        {/* Cancel button if editing */}
        {isAuthorized && isEditingEvent && (
          <div className="flex w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsEditingEvent(false)}
              className="text-[10px] font-black uppercase bg-neutral-200 border border-encre-noire px-3 py-1.5 rounded w-full md:w-auto text-center"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {isEditingEvent ? (
        <EventEditForm
          editForm={editForm}
          setEditForm={setEditForm}
          savingEvent={savingEvent}
          handleSaveEvent={handleSaveEvent}
          handleDeleteEvent={handleDeleteEvent}
          dressCodes={dressCodes}
          wardrobeCostumes={wardrobeCostumes}
          editConfig={editConfig}
          rawEditConfig={rawEditConfig}
          associationEventTypes={associationEventTypes}
          adresseLocal={adresseLocal}
          lieuxImportants={lieuxImportants}
          defaultLocationsByEventType={defaultLocationsByEventType}
          eventTypeConfigs={eventTypeConfigs}
          imageMode={imageMode}
          setImageMode={setImageMode}
          uploadingImage={uploadingImage}
          handleImageUpload={handleImageUpload}
          t={t}
          groupId={event.groupId}
        />
      ) : (
        <>
          {/* Section de Sondage de dates si l'événement est un sondage */}
          {(event.isPoll || event.status === 'sondage' || Boolean(event.pollGroupId)) && (
            <EventPollSection
              event={event}
              user={user}
              profileData={profileData}
              onNavigateToEventId={(targetId) => {
                if (onNavigateToView) {
                  onNavigateToView('agenda', targetId);
                }
              }}
            />
          )}

          {isMemberViewSimulation && (
            <div className="w-full mb-3 px-3.5 py-2 bg-amber-400 text-encre-noire border-2 border-encre-noire rounded shadow-[2px_2px_0px_0px_#181716] text-[10px] font-black uppercase tracking-wider flex items-center justify-between z-20 select-none animate-fade-in shrink-0">
              <span className="flex items-center gap-2">
                ⚠️ Mode Simulation Adhérent Actif
              </span>
              <button
                type="button"
                onClick={() => setIsMemberViewSimulation(false)}
                className="bg-encre-noire text-white text-[9px] px-2.5 py-1 rounded font-black uppercase hover:bg-neutral-800 cursor-pointer shadow-xs shrink-0 ml-2"
              >
                [ Revenir en mode Admin ]
              </button>
            </div>
          )}

          {/* Navigation par Onglets Thématiques Cordel */}
          <EventTabsNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            canAccessAdminTab={canAccessAdminTab}
            attendeesCount={((event.inscriptions || []).filter(ins => ins.status === 'present').length) + ((event.invitesExternes || []).length)}
            carsCount={(event.covoiturage?.voitures || []).length}
            hasProgram={Boolean(
              (event.linkedPatterns && event.linkedPatterns.length > 0) ||
              (setlist && setlist.length > 0) ||
              event.isStageLayoutPublished ||
              (event.volunteerShifts && event.volunteerShifts.length > 0) ||
              ((event.type === 'atelier' || event.type === 'stage') && event.specialiteAtelier === 'fabrication')
            )}
          />

          {/* Contenu de l'Onglet Actif */}
          <div className="mt-2">
            {activeTab === 'rsvp' && (
              <TabRsvp
                event={activeEvent || event}
                user={user}
                profileData={profileData}
                status={status}
                saving={saving}
                isPrestationRestricted={isPrestationRestricted}
                isMusicLevelRestricted={isMusicLevelRestricted}
                isDanceLevelRestricted={isDanceLevelRestricted}
                existingResponse={existingResponse}
                instrumentChoisi={instrumentChoisi}
                setInstrumentChoisi={setInstrumentChoisi}
                isInstrumentLocked={isInstrumentLocked}
                transport={transport}
                demandeRemboursementKm={demandeRemboursementKm}
                handleStatusChange={handleStatusChange}
                handleSave={handleSave}
                getMemberInstrumentOptions={getMemberInstrumentOptions}
                getPupitreName={getPupitreName}
                presentsByInstrument={presentsByInstrument}
                allUsers={allUsers}
                isAuthorized={isAuthorized}
                handleValidatePending={handleValidatePending}
                handleUpdateMemberInstrument={handleUpdateMemberInstrument}
                isManualRegisterOpen={isManualRegisterOpen}
                setIsManualRegisterOpen={setIsManualRegisterOpen}
                unregisteredUsers={unregisteredUsers}
                selectedManualUserId={selectedManualUserId}
                setSelectedManualUserId={setSelectedManualUserId}
                selectedManualInstrument={selectedManualInstrument}
                setSelectedManualInstrument={setSelectedManualInstrument}
                savingManualRegistration={savingManualRegistration}
                handleManualRegister={handleManualRegister}
                handleManualUnregister={handleManualUnregister}
                isRegistrationDeadlinePassed={isRegistrationDeadlinePassed}
                t={t}
                currentConfig={currentConfig}
                handleAddInviteExterne={handleAddInviteExterne}
                handleRemoveInviteExterne={handleRemoveInviteExterne}
                instrumentsDisponibles={instrumentsDisponibles}
                besoinTransportInstrument={besoinTransportInstrument}
                setBesoinTransportInstrument={setBesoinTransportInstrument}
                dependents={dependents}
                familyMembers={familyMembers}
                familyResponses={familyResponses}
                handleToggleFamilyMemberSelection={handleToggleFamilyMemberSelection}
                handleFamilyMemberStatusChange={handleFamilyMemberStatusChange}
                handleFamilyMemberInstrumentChange={handleFamilyMemberInstrumentChange}
                handleFamilySave={handleFamilySave}
                handleAddToGoogleCalendar={handleAddToGoogleCalendar}
                handleDownloadIcs={handleDownloadIcs}
              />
            )}

            {activeTab === 'logistics' && (
              <TabLogistics
                event={activeEvent || event}
                user={user}
                profileData={profileData}
                isAuthorized={isAuthorized}
                currentConfig={currentConfig}
                enableCarpoolReimbursement={enableCarpoolReimbursement}
                indemniteKilometrique={indemniteKilometrique}
                convoiDrivers={convoiDrivers}
                individualDrivers={individualDrivers}
                submittingCovoit={submittingCovoit}
                joiningVoitureId={joiningVoitureId}
                setJoiningVoitureId={setJoiningVoitureId}
                joinForm={joinForm}
                setJoinForm={setJoinForm}
                demandeRemboursementKm={demandeRemboursementKm}
                handleToggleRemboursement={handleToggleRemboursement}
                handleRetirerVoiture={handleRetirerVoiture}
                handleQuitterVoiture={handleQuitterVoiture}
                handleConfirmJoin={handleConfirmJoin}
                handleChercherPlace={handleChercherPlace}
                handleAnnulerCherchePlace={handleAnnulerCherchePlace}
                showProposerForm={showProposerForm}
                setShowProposerForm={setShowProposerForm}
                voitureForm={voitureForm}
                setVoitureForm={setVoitureForm}
                handleProposerVoiture={handleProposerVoiture}
                reimbursementRule={reimbursementRule}
                handleAssignPassenger={handleAssignPassenger}
                handleRemovePassenger={handleRemovePassenger}
                status={status}
                saving={saving}
                isPrestationRestricted={isPrestationRestricted}
                isMusicLevelRestricted={isMusicLevelRestricted}
                isDanceLevelRestricted={isDanceLevelRestricted}
                existingResponse={existingResponse}
                instrumentChoisi={instrumentChoisi}
                setInstrumentChoisi={setInstrumentChoisi}
                isInstrumentLocked={isInstrumentLocked}
                transport={transport}
                handleStatusChange={handleStatusChange}
                handleSave={handleSave}
                getMemberInstrumentOptions={getMemberInstrumentOptions}
                getPupitreName={getPupitreName}
                presentsByInstrument={presentsByInstrument}
                allUsers={allUsers}
                handleValidatePending={handleValidatePending}
                handleUpdateMemberInstrument={handleUpdateMemberInstrument}
                isManualRegisterOpen={isManualRegisterOpen}
                setIsManualRegisterOpen={setIsManualRegisterOpen}
                unregisteredUsers={unregisteredUsers}
                selectedManualUserId={selectedManualUserId}
                setSelectedManualUserId={setSelectedManualUserId}
                selectedManualInstrument={selectedManualInstrument}
                setSelectedManualInstrument={setSelectedManualInstrument}
                savingManualRegistration={savingManualRegistration}
                handleManualRegister={handleManualRegister}
                handleManualUnregister={handleManualUnregister}
                isRegistrationDeadlinePassed={isRegistrationDeadlinePassed}
                t={t}
                handleAddInviteExterne={handleAddInviteExterne}
                handleRemoveInviteExterne={handleRemoveInviteExterne}
                instrumentsDisponibles={instrumentsDisponibles}
                besoinTransportInstrument={besoinTransportInstrument}
                setBesoinTransportInstrument={setBesoinTransportInstrument}
                dependents={dependents}
                familyMembers={familyMembers}
                familyResponses={familyResponses}
                handleToggleFamilyMemberSelection={handleToggleFamilyMemberSelection}
                handleFamilyMemberStatusChange={handleFamilyMemberStatusChange}
                handleFamilyMemberInstrumentChange={handleFamilyMemberInstrumentChange}
                handleFamilySave={handleFamilySave}
                handleAddToGoogleCalendar={handleAddToGoogleCalendar}
                handleDownloadIcs={handleDownloadIcs}
              />
            )}

            {activeTab === 'program' && (
              <TabProgram
                event={activeEvent || event}
                activeEvent={activeEvent}
                user={user}
                profileData={profileData}
                isAuthorized={isAuthorized}
                currentConfig={currentConfig}
                allUsers={allUsers}
                t={t}
                setlist={setlist}
                updatingSetlist={updatingSetlist}
                handleRemoveMorceau={handleRemoveMorceau}
                assocSequenceurUrl={assocSequenceurUrl}
                handleAddMorceau={handleAddMorceau}
                newMorceauTitre={newMorceauTitre}
                setNewMorceauTitre={setNewMorceauTitre}
                selectedCatalogRhythmUrl={selectedCatalogRhythmUrl}
                setSelectedCatalogRhythmUrl={setSelectedCatalogRhythmUrl}
                fileInputKey={fileInputKey}
                setNewMorceauJsonFile={setNewMorceauJsonFile}
                newMorceauNotes={newMorceauNotes}
                setNewMorceauNotes={setNewMorceauNotes}
                dancadorChoreoIds={dancadorChoreoIds}
                handleAddDancadorChoreo={handleAddDancadorChoreo}
                handleRemoveDancadorChoreo={handleRemoveDancadorChoreo}
                onGoToStageLayoutEditor={onGoToStageLayoutEditor}
              />
            )}

            {activeTab === 'admin' && canAccessAdminTab && (
              <TabAdmin
                event={activeEvent || event}
                user={user}
                profileData={profileData}
                isAuthorized={isAuthorized}
                hasFinanceAccess={hasFinanceAccess}
                handleUpdateEventStatus={handleUpdateEventStatus}
                onNavigateToView={onNavigateToView}
                setIsSendContractModalOpen={setIsSendContractModalOpen}
                handlePreparePublication={handlePreparePublication}
                currentConfig={currentConfig}
              />
            )}
          </div>
      </>
    )}

      {/* SECTION : Discussion & Questions Logistiques */}
      <div className="mt-6">
        <EventCommentsSection
          event={activeEvent || event}
          user={user}
          profileData={profileData}
        />
      </div>

      {/* MODALE : QR Code Public Récolte Photos */}
      {showQrCodeModal && lienGoogleFormRecoltePhotos && (
        <EventPublicQrCodeModal
          qrUrl={lienGoogleFormRecoltePhotos}
          eventTitle={event.titre}
          onClose={() => setShowQrCodeModal(false)}
        />
      )}

      {/* MODALE : QR Code Dépôt Médias Événement (Framaspace, Drive...) */}
      {showMediaQrCodeModal && event.lienDepotMedias && (
        <EventMediaQrCodeModal
          qrUrl={event.lienDepotMedias}
          eventTitle={event.titre}
          onClose={() => setShowMediaQrCodeModal(false)}
        />
      )}

      {/* MODALE : Envoi de contrat / devis par email via Brevo */}
      <SendContractModal
        isOpen={isSendContractModalOpen}
        onClose={() => setIsSendContractModalOpen(false)}
        event={activeEvent || event}
        groupId={event.groupId}
      />
    </div>
  );
}
