import React, { useState, useEffect, useRef, useMemo } from 'react';
import { doc, updateDoc, collection, addDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useTranslation } from '../LanguageContext';
import useConfirm from '../../hooks/useConfirm';
import ImportAgendaModal from '../agenda/ImportAgendaModal';
import { generateCompteRenduPDF } from '../../utils/pdfGenerator';
import { triggerEventStatusAutomation } from '../../utils/automationEngine';
import { notifyMembersByTag } from '../../utils/inAppNotificationService';
import { publishReportDefinitive } from '../../utils/reportPublicationUtils';
import EventEmargementSection from './EventEmargementSection';
import ReportValidatorsSelector from './ReportValidatorsSelector';
import { getEffectiveMemberTags, getCanonicalTagKey, isMemberCaOrBureau } from '../../utils/memberUtils';

export default function EventReportSection({ event, user, profileData, associationSettings }) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const [localPoints, setLocalPoints] = useState([]);
  const [newPointTitle, setNewPointTitle] = useState('');
  const [activeMicPointId, setActiveMicPointId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [editingPointId, setEditingPointId] = useState(null);
  const [editingPointTitle, setEditingPointTitle] = useState('');
  
  // État local de la portée / audience de la réunion ('publique' ou 'ca')
  const [localAudience, setLocalAudience] = useState(event?.audience || event?.portee || 'publique');

  // Option d'auto-validation à J+7 (décochée par défaut)
  const [autoValidateAfter7Days, setAutoValidateAfter7Days] = useState(Boolean(event?.autoValidateAfter7Days ?? false));
  const autoValidatedRef = useRef(false);

  // Données membres et étiquettes pour la sélection SaaS du collège de validation
  const [members, setMembers] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Mode de validation et sélection des relecteurs ('all_presents' | 'present_by_tags' | 'custom_users')
  const [validationMode, setValidationMode] = useState(
    event?.compteRenduValidationMode || (event?.audience === 'ca' ? 'all_presents' : 'all_presents')
  );
  const [selectedValidationTags, setSelectedValidationTags] = useState(
    Array.isArray(event?.compteRenduValidationTags) ? event.compteRenduValidationTags : []
  );
  const [selectedCustomUserIds, setSelectedCustomUserIds] = useState(() => {
    if (Array.isArray(event?.compteRenduValidators) && event.compteRenduValidators.length > 0) {
      return event.compteRenduValidators.map(v => (typeof v === 'object' ? v.uid : v));
    }
    return [];
  });

  // Collaborative suggestions states
  const [newSuggestionTitle, setNewSuggestionTitle] = useState('');
  const [secretaryResponses, setSecretaryResponses] = useState({});
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  
  const recognitionRef = useRef(null);

  // Collaborative propositions during review
  const [newPropositionText, setNewPropositionText] = useState({});

  const presents = event.inscriptions?.filter(ins => ins.status === 'present') || [];

  // Vérifier roles: Admins, Secrétaires ou le Rédacteur désigné
  const isGlobalAdmin = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'secretaire' || 
    profileData?.isSystemAdmin === true;

  const isRedacteur = event.redacteurId === user.uid;
  const isAdmin = isGlobalAdmin || isRedacteur;

  // Current report status: empty, 'brouillon', 'attente_relecture', 'publie'
  const reportStatus = event.compteRenduStatus || '';

  // Synchronisation de l'audience avec les props de l'événement
  useEffect(() => {
    if (event?.audience || event?.portee) {
      setLocalAudience(event.audience || event.portee || 'publique');
    }
  }, [event?.audience, event?.portee]);

  // Synchronisation de l'option autoValidateAfter7Days
  useEffect(() => {
    setAutoValidateAfter7Days(Boolean(event?.autoValidateAfter7Days ?? false));
  }, [event?.autoValidateAfter7Days]);

  // Fallback Frontend : Auto-validation à J+7 si échéance atteinte et sans opposition démocratique
  useEffect(() => {
    if (
      reportStatus === 'attente_relecture' &&
      event?.autoValidateAfter7Days &&
      event?.compteRenduAutoValidateAt &&
      !autoValidatedRef.current &&
      !isSaving
    ) {
      const now = new Date();
      const autoDate = new Date(event.compteRenduAutoValidateAt);
      const hasRejection = Object.values(event.compteRenduApprovals || {}).some(v => v && v.approved === false);

      if (!isNaN(autoDate.getTime()) && now >= autoDate && !hasRejection) {
        autoValidatedRef.current = true;
        handlePublishDefinitive(localPoints, event.compteRenduApprovals || {}, true /* isAutomatic */);
      }
    }
  }, [reportStatus, event?.autoValidateAfter7Days, event?.compteRenduAutoValidateAt, event?.compteRenduApprovals, isSaving]);

  // Synchronize local points with Firestore pointsOrdreDuJour
  useEffect(() => {
    if (event.pointsOrdreDuJour) {
      setLocalPoints(event.pointsOrdreDuJour);
    } else {
      setLocalPoints([]);
    }
  }, [event.pointsOrdreDuJour]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Synchronisation du mode de validation si présent dans event
  useEffect(() => {
    if (event?.compteRenduValidationMode) {
      setValidationMode(event.compteRenduValidationMode);
    } else if (localAudience === 'ca' || event?.audience === 'ca') {
      setValidationMode('all_presents');
    }
  }, [event?.compteRenduValidationMode, localAudience, event?.audience]);

  useEffect(() => {
    if (Array.isArray(event?.compteRenduValidationTags)) {
      setSelectedValidationTags(event.compteRenduValidationTags);
    }
  }, [event?.compteRenduValidationTags]);

  // Chargement des membres et des étiquettes disponibles de l'association
  useEffect(() => {
    const targetGroupId = event?.groupId || profileData?.groupId || user?.groupId;
    if (!targetGroupId) return;

    let isMounted = true;
    const usersRef = collection(db, 'users');
    const qUsers = query(usersRef, where('groupId', '==', targetGroupId));

    getDocs(qUsers).then((snap) => {
      if (!isMounted) return;
      const fetchedMembers = [];
      const tagsMap = new Map();

      snap.forEach((docSnap) => {
        const uData = { id: docSnap.id, uid: docSnap.id, ...docSnap.data() };
        fetchedMembers.push(uData);

        const effTags = getEffectiveMemberTags(uData);
        effTags.forEach((t) => {
          const raw = typeof t === 'object' ? (t.nomM || t.nom || t.label || t.id || '') : String(t);
          const canonical = getCanonicalTagKey(t);
          if (canonical && !tagsMap.has(canonical)) {
            tagsMap.set(canonical, raw || canonical);
          }
        });
      });

      setMembers(fetchedMembers);

      // Charger les étiquettes personnalisées de l'association
      const assocRef = query(collection(db, 'associations'), where('__name__', '==', targetGroupId));
      getDocs(assocRef).then((assocSnap) => {
        if (!isMounted) return;
        if (!assocSnap.empty) {
          const assocData = assocSnap.docs[0].data();
          if (Array.isArray(assocData.tagsDisponibles)) {
            assocData.tagsDisponibles.forEach((t) => {
              const raw = typeof t === 'object' ? (t.nomM || t.nom || t.label || t.id || '') : String(t);
              const canonical = getCanonicalTagKey(t);
              if (canonical && !tagsMap.has(canonical)) {
                tagsMap.set(canonical, raw || canonical);
              }
            });
          }
        }

        // Assurer la présence des badges institutionnels clés
        if (!tagsMap.has('ca')) tagsMap.set('ca', 'CA');
        if (!tagsMap.has('bureau')) tagsMap.set('bureau', 'Bureau');

        const tagsList = Array.from(tagsMap.entries()).map(([key, label]) => ({
          id: key,
          label
        }));
        setAvailableTags(tagsList);
      }).catch((assocErr) => {
        console.warn("EventReportSection - Erreur lecture association tags :", assocErr);
        if (!tagsMap.has('ca')) tagsMap.set('ca', 'CA');
        if (!tagsMap.has('bureau')) tagsMap.set('bureau', 'Bureau');
        setAvailableTags(Array.from(tagsMap.entries()).map(([k, l]) => ({ id: k, label: l })));
      });
    }).catch((err) => {
      console.error("EventReportSection - Erreur chargement membres :", err);
    });

    return () => {
      isMounted = false;
    };
  }, [event?.groupId, profileData?.groupId, user?.groupId]);

  // Résolution en temps réel des relecteurs désignés avant soumission
  const resolvedValidators = useMemo(() => {
    if (validationMode === 'all_presents') {
      return presents.map((p) => ({
        uid: p.userId,
        displayName: p.userName || 'Membre'
      }));
    }

    if (validationMode === 'present_by_tags') {
      if (selectedValidationTags.length === 0) return [];

      return presents.filter((p) => {
        const memberProfile = members.find((m) => (m.id || m.uid) === p.userId) || { uid: p.userId, displayName: p.userName };
        const effTags = getEffectiveMemberTags(memberProfile);
        const allMemberTags = [...effTags, ...(Array.isArray(memberProfile.tags) ? memberProfile.tags : [])];

        return selectedValidationTags.some((selTag) => {
          const selCanonical = getCanonicalTagKey(selTag);
          if ((selCanonical === 'ca' || selCanonical === 'bureau') && isMemberCaOrBureau(memberProfile)) {
            return true;
          }
          return allMemberTags.some((t) => {
            const tCanonical = getCanonicalTagKey(t);
            const tRaw = typeof t === 'object' ? (t.nomM || t.label || t.nom || t.id || '') : String(t);
            const selRaw = typeof selTag === 'object' ? (selTag.nomM || selTag.label || selTag.nom || selTag.id || '') : String(selTag);
            return (tCanonical && tCanonical === selCanonical) || tRaw.toLowerCase().trim() === selRaw.toLowerCase().trim();
          });
        });
      }).map((p) => ({
        uid: p.userId,
        displayName: p.userName || 'Membre'
      }));
    }

    if (validationMode === 'custom_users') {
      return presents
        .filter((p) => selectedCustomUserIds.includes(p.userId))
        .map((p) => ({
          uid: p.userId,
          displayName: p.userName || 'Membre'
        }));
    }

    return presents.map((p) => ({
      uid: p.userId,
      displayName: p.userName || 'Membre'
    }));
  }, [validationMode, presents, selectedValidationTags, selectedCustomUserIds, members]);

  // Handlers pour la sélection de relecteurs
  const handleToggleValidationTag = (tag) => {
    setSelectedValidationTags((prev) => {
      const exists = prev.some((t) => t === tag || getCanonicalTagKey(t) === getCanonicalTagKey(tag));
      if (exists) {
        return prev.filter((t) => t !== tag && getCanonicalTagKey(t) !== getCanonicalTagKey(tag));
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleToggleCustomUser = (userId) => {
    setSelectedCustomUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllCustomUsers = () => {
    setSelectedCustomUserIds(presents.map((p) => p.userId));
  };

  const handleDeselectAllCustomUsers = () => {
    setSelectedCustomUserIds([]);
  };

  // Collège de validation effectif en phase de relecture (rétrocompatibilité si absent)
  const effectiveValidators = useMemo(() => {
    if (Array.isArray(event.compteRenduValidators) && event.compteRenduValidators.length > 0) {
      return event.compteRenduValidators.map((v) => {
        if (typeof v === 'object' && v.uid) {
          return { uid: v.uid, displayName: v.displayName || v.userName || 'Membre' };
        }
        const found = presents.find((p) => p.userId === v);
        return { uid: v, displayName: found ? found.userName : 'Membre' };
      });
    }
    // Rétrocompatibilité : tous les membres pointés présents
    return presents.map((p) => ({
      uid: p.userId,
      displayName: p.userName || 'Membre'
    }));
  }, [event.compteRenduValidators, presents]);

  // Formater date utilitaire: DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Ajouter a new point to the order of the day
  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!newPointTitle.trim()) return;

    const newPoint = {
      id: Date.now().toString(),
      titre: newPointTitle.trim(),
      notesCR: ''
    };

    const updatedPoints = [...localPoints, newPoint];
    setLocalPoints(updatedPoints);
    setNewPointTitle('');

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        pointsOrdreDuJour: updatedPoints,
        // Auto définir to brouillon if first point is added and status is empty
        ...(reportStatus === '' ? { compteRenduStatus: 'brouillon' } : {})
      });
    } catch (err) {
      console.error("Error adding point:", err);
      alert("Erreur lors de l'ajout du point à l'ordre du jour.");
    }
  };

  // Modifier la portée de la réunion (CA vs Publique)
  const handleUpdateAudience = async (newAudience) => {
    setLocalAudience(newAudience);
    if (event) {
      event.audience = newAudience;
      event.portee = newAudience;
    }
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        audience: newAudience,
        portee: newAudience
      });
    } catch (err) {
      console.error("EventReportSection - Erreur mise à jour portée réunion :", err);
    }
  };

  // Initialisation immédiate d'un compte-rendu libre en cas de réunion sans ODJ préalable
  const handleInitFreeReport = async () => {
    const freePoint = {
      id: Date.now().toString(),
      titre: "Compte-rendu des échanges",
      notesCR: ""
    };

    const updatedPoints = [...localPoints, freePoint];
    setLocalPoints(updatedPoints);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        pointsOrdreDuJour: updatedPoints,
        ...(reportStatus === '' ? { compteRenduStatus: 'brouillon' } : {})
      });
    } catch (err) {
      console.error("EventReportSection - Erreur initialisation CR libre :", err);
      alert("Erreur lors de l'initialisation du compte-rendu.");
    }
  };

  // Edit point title
  const handleStartEditPoint = (point) => {
    setEditingPointId(point.id);
    setEditingPointTitle(point.titre);
  };

  const handleSavePointTitle = async (pointId) => {
    if (!editingPointTitle.trim()) return;
    const updated = localPoints.map(p => p.id === pointId ? { ...p, titre: editingPointTitle.trim() } : p);
    setLocalPoints(updated);
    setEditingPointId(null);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { pointsOrdreDuJour: updated });
    } catch (err) {
      console.error("Error updating point title:", err);
    }
  };

  // Supprimer a point
  const handleDeletePoint = async (pointId) => {
    const confirmDelete = await confirm({
      title: "Supprimer le point",
      message: "Voulez-vous vraiment supprimer ce point de l'ordre du jour ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (!confirmDelete) return;

    const updated = localPoints.filter(p => p.id !== pointId);
    setLocalPoints(updated);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { pointsOrdreDuJour: updated });
    } catch (err) {
      console.error("Error deleting point:", err);
    }
  };

  // Move points up/down for reordering
  const handleMovePoint = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localPoints.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...localPoints];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setLocalPoints(updated);

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { pointsOrdreDuJour: updated });
    } catch (err) {
      console.error("Error reordering points:", err);
    }
  };

  // Basculer Speech Recognition for a specific point
  const handleToggleSpeech = (pointId) => {
    if (activeMicPointId === pointId) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setActiveMicPointId(null);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("La dictée vocale n'est pas prise en charge par votre navigateur. Essayez avec Google Chrome ou Microsoft Edge.");
        return;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'fr-FR';

      rec.onstart = () => {
        setActiveMicPointId(pointId);
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e);
        alert("Une erreur est survenue avec le microphone.");
        setActiveMicPointId(null);
      };

      rec.onend = () => {
        setActiveMicPointId(null);
      };

      rec.onresult = (e) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setLocalPoints(prev => {
            const updated = prev.map(p => {
              if (p.id === pointId) {
                const currentNotes = p.notesCR || '';
                const separator = currentNotes ? ' ' : '';
                return { ...p, notesCR: currentNotes + separator + finalTranscript.trim() };
              }
              return p;
            });
            // Auto-enregistrer mettre à jour to firestore when speech adds text
            const eventRef = doc(db, 'events', event.id);
            updateDoc(eventRef, { pointsOrdreDuJour: updated }).catch(err => {
              console.error("Speech autosave error:", err);
            });
            return updated;
          });
        }
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Gérer local text change in textarea
  const handleNotesChange = (pointId, value) => {
    setLocalPoints(prev => prev.map(p => p.id === pointId ? { ...p, notesCR: value } : p));
  };

  // Explicit draft enregistrer
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        pointsOrdreDuJour: localPoints,
        compteRenduStatus: 'brouillon'
      });
      alert(t('agenda.reportSaved') || "Compte-rendu enregistré avec succès !");
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("Erreur lors de l'enregistrement du brouillon.");
    } finally {
      setIsSaving(false);
    }
  };

  // Submit report for review (attente_relecture)
  const handleSubmitForReview = async () => {
    if (resolvedValidators.length === 0) {
      alert("Veuillez sélectionner au moins un validateur parmi les présents avant de soumettre.");
      return;
    }

    const confirmSubmit = await confirm({
      title: "Soumettre pour relecture",
      message: `Voulez-vous soumettre ce compte-rendu à la relecture par les ${resolvedValidators.length} membre(s) désigné(s) ?`,
      confirmText: "Oui, soumettre",
      cancelText: "Annuler",
      variant: "warning"
    });
    if (!confirmSubmit) return;

    setIsSaving(true);
    try {
      const eventRef = doc(db, 'events', event.id);
      const nowIso = new Date().toISOString();
      const autoValidateAtIso = autoValidateAfter7Days
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await updateDoc(eventRef, {
        pointsOrdreDuJour: localPoints,
        compteRenduStatus: 'attente_relecture',
        compteRenduApprovals: {}, // Réinitialiser approvals for new review cycle
        autoValidateAfter7Days: Boolean(autoValidateAfter7Days),
        compteRenduSubmittedAt: nowIso,
        compteRenduAutoValidateAt: autoValidateAtIso,
        compteRenduValidationMode: validationMode,
        compteRenduValidationTags: validationMode === 'present_by_tags' ? selectedValidationTags : [],
        compteRenduValidators: resolvedValidators
      });
      
      // Déclenchement de l'automatisation de notification de relecture
      try {
        const targetGroupId = event.groupId || profileData?.groupId || user?.groupId;
        if (targetGroupId) {
          await triggerEventStatusAutomation(targetGroupId, { ...event, id: event.id }, 'reportValidation');
        }
      } catch (triggerErr) {
        console.error("Erreur déclenchement notification relecture :", triggerErr);
      }

      alert("Le compte-rendu est maintenant en attente de relecture.");
    } catch (err) {
      console.error("Error submitting for review:", err);
      alert("Erreur lors de la soumission pour relecture.");
    } finally {
      setIsSaving(false);
    }
  };

  // Publish report definitively
  const handlePublishDefinitive = async (pointsToPublish = localPoints, approvals = event.compteRenduApprovals || {}, isAutomatic = false) => {
    setIsSaving(true);
    try {
      await publishReportDefinitive({
        event: {
          ...event,
          audience: localAudience || event.audience || 'publique',
          portee: localAudience || event.portee || 'publique'
        },
        points: pointsToPublish,
        approvals,
        isAutomatic,
        associationSettings: associationSettings || event.associationSettings || "O Girador"
      });

      if (!isAutomatic) {
        alert("Le compte-rendu a été définitivement validé, publié au Varal et le PDF officiel a été généré !");
      }
    } catch (err) {
      console.error("Error publishing report:", err);
      if (!isAutomatic) {
        alert("Erreur lors de la publication : " + err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Revert report to draft for modifications
  const handleRevertToDraft = async () => {
    const confirmRevert = await confirm({
      title: "Repasser en brouillon",
      message: "Voulez-vous repasser ce compte-rendu en brouillon ? Cela réinitialisera les votes d'approbation et vous permettra d'éditer le texte.",
      confirmText: "Oui, repasser en brouillon",
      cancelText: "Annuler",
      variant: "warning"
    });
    if (!confirmRevert) return;

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        compteRenduStatus: 'brouillon',
        compteRenduApprovals: {},
        compteRenduAutoValidateAt: null
      });
      alert("Le compte-rendu a été réinitialisé en brouillon.");
    } catch (err) {
      console.error("Erreur lors de la remise en brouillon :", err);
      alert("Erreur lors de la remise en brouillon.");
    }
  };

  // On-demand PDF download
  const handleDownloadPDF = () => {
    try {
      const presentsNames = presents.map(ins => ins.userName || 'Membre anonyme');
      const isCA = (localAudience === 'ca' || event.audience === 'ca' || event.portee === 'ca');
      const enrichedEvent = {
        ...event,
        audience: isCA ? 'ca' : 'publique',
        invitesOuPublicCount: event.invitesOuPublicCount || 0
      };
      const pdfDoc = generateCompteRenduPDF(enrichedEvent, localPoints, presentsNames, associationSettings || event.associationSettings || "O Girador");
      pdfDoc.save(`Compte_Rendu_${isCA ? 'CA_' : 'Public_'}${event.titre ? event.titre.replace(/[^a-zA-Z0-9]/g, '_') : 'Reunion'}.pdf`);
    } catch (err) {
      console.error("Erreur génération PDF :", err);
      alert("Erreur lors du téléchargement du PDF.");
    }
  };

  // Vote handler for present members
  const handleVote = async (approved, commentText = '') => {
    const approvals = event.compteRenduApprovals || {};
    const currentVote = {
      approved,
      date: new Date().toISOString(),
      commentaire: commentText,
      userName: `${profileData.prenom || ''} ${profileData.nom || ''}`.trim()
    };

    const updatedApprovals = {
      ...approvals,
      [user.uid]: currentVote
    };

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        compteRenduApprovals: updatedApprovals
      });
      setComment('');
      alert(approved ? "Vous avez approuvé ce compte-rendu !" : "Vos demandes de modifications ont été transmises.");

      // Vérifier si 100 % des validateurs désignés ont approuvé
      if (totalValidators > 0) {
        const isUnanimous = effectiveValidators.every(val => {
          const vote = updatedApprovals[val.uid];
          return vote?.approved === true;
        });

        if (isUnanimous) {
          // Publication automatique immédiate dès unanimité du collège
          await handlePublishDefinitive(localPoints, updatedApprovals);
        }
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
      alert("Erreur lors du vote.");
    }
  };

  // Ajouter une proposition de modification par un membre présent
  const handleAddProposition = async (pointId) => {
    const text = newPropositionText[pointId];
    if (!text || !text.trim()) return;

    try {
      const newProposition = {
        id: Date.now().toString(),
        pointId,
        userId: user.uid,
        userName: `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || 'Membre',
        texte: text.trim(),
        date: new Date().toISOString(),
        traitee: false
      };

      const updatedPropositions = [...(event.propositionsCR || []), newProposition];
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { propositionsCR: updatedPropositions });
      
      // Clear input
      setNewPropositionText(prev => ({ ...prev, [pointId]: '' }));
    } catch (err) {
      console.error("Error adding proposition:", err);
      alert("Erreur lors de la soumission de la proposition.");
    }
  };

  // Rédacteur : marquer une proposition comme traitée ou non traitée
  const handleTogglePropositionStatus = async (propositionId, currentStatus) => {
    try {
      const updatedPropositions = (event.propositionsCR || []).map(prop => {
        if (prop.id === propositionId) {
          return { ...prop, traitee: !currentStatus };
        }
        return prop;
      });
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { propositionsCR: updatedPropositions });
    } catch (err) {
      console.error("Error toggling proposition status:", err);
    }
  };

  // Ajouter suggestion from member
  const handleAddSuggestion = async (e) => {
    e.preventDefault();
    if (!newSuggestionTitle.trim()) return;

    setIsSubmittingSuggestion(true);
    try {
      const authorName = `${profileData?.prenom || ''} ${profileData?.nom || ''}`.trim() || user?.displayName || 'Un membre';
      const newSuggestion = {
        id: Date.now().toString(),
        userId: user.uid,
        userName: authorName,
        titre: newSuggestionTitle.trim(),
        status: 'en_attente',
        reponseSecretaire: ''
      };

      const updatedSuggestions = [...(event.suggestionsOrdreDuJour || []), newSuggestion];
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, { suggestionsOrdreDuJour: updatedSuggestions });
      setNewSuggestionTitle('');
      alert("Votre suggestion de point a été soumise au secrétaire !");

      // Notification interne pour le secrétariat et le bureau
      try {
        const eventDateStr = event.date || event.dateDebut || 'à venir';
        notifyMembersByTag({
          groupId: event.groupId || profileData?.groupId,
          tags: ['Secrétaire', 'secretaire', 'Bureau', 'bureau'],
          title: "💡 Nouvelle proposition ODJ",
          message: `${authorName} propose un point pour la réunion du ${eventDateStr}`,
          targetUrl: `/app/events/${event.id}`,
          icon: "💡"
        }).catch((err) => console.warn("EventReportSection - Notification ODJ ignorée :", err));
      } catch (notifErr) {
        console.warn("EventReportSection - Erreur notification ODJ :", notifErr);
      }
    } catch (err) {
      console.error("Error adding suggestion:", err);
      alert("Erreur lors de la soumission de la suggestion.");
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  // Moderate suggestion from member (Secretary/Admin action)
  const handleModerateSuggestion = async (suggestionId, action, reponseText) => {
    const suggestions = event.suggestionsOrdreDuJour || [];
    let points = event.pointsOrdreDuJour || [];

    const updatedSuggestions = suggestions.map(s => {
      if (s.id === suggestionId) {
        return {
          ...s,
          status: action === 'valide' ? 'valide' : 'invalide',
          reponseSecretaire: reponseText.trim()
        };
      }
      return s;
    });

    if (action === 'valide') {
      const target = suggestions.find(s => s.id === suggestionId);
      if (target) {
        const newPoint = {
          id: Date.now().toString(),
          titre: target.titre,
          notesCR: ''
        };
        points = [...points, newPoint];
      }
    }

    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        suggestionsOrdreDuJour: updatedSuggestions,
        pointsOrdreDuJour: points,
        ...(reportStatus === '' && action === 'valide' ? { compteRenduStatus: 'brouillon' } : {})
      });
      alert(action === 'valide' ? "Suggestion validée et ajoutée à l'ordre du jour !" : "Suggestion refusée.");
    } catch (err) {
      console.error("Error moderating suggestion:", err);
      alert("Erreur lors du traitement de la suggestion.");
    }
  };

  // Calculer vote statistics sur le collège de validateurs désignés
  const totalValidators = effectiveValidators.length;
  const approvals = event.compteRenduApprovals || {};
  
  const validatorsApproved = effectiveValidators.filter(val => approvals[val.uid]?.approved === true);
  const validatorsRejected = effectiveValidators.filter(val => approvals[val.uid]?.approved === false);
  const validatorsPending = effectiveValidators.filter(val => !approvals[val.uid]);

  const approvedCount = validatorsApproved.length;
  const rejectedCount = validatorsRejected.length;
  const pendingCount = validatorsPending.length;

  const isUserValidator = effectiveValidators.some(val => val.uid === user.uid);
  const isUserPresent = presents.some(ins => ins.userId === user.uid);
  const userVote = approvals[user.uid];

  return (
    <div className="flex flex-col gap-5 text-left">
      
      {/* 📌 Header de Section */}
      <div className="flex flex-col gap-3 pb-2 border-b-2 border-dashed border-cordel-master-dark/20">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase">
            📋 {t('agenda.reportSectionTitle') || 'Ordre du jour & Comptes-rendus'}
          </h3>
          
          {/* Status Badge */}
          {reportStatus === 'publie' && (
            <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] tracking-wider">
              📜 ARCHIVÉ AU VARAL
            </span>
          )}
          {reportStatus === 'attente_relecture' && (
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] tracking-wider animate-pulse">
              ⏳ EN ATTENTE DE RELECTURE ({approvedCount}/{totalValidators} Validations)
            </span>
          )}
          {(reportStatus === '' || reportStatus === 'brouillon') && localPoints.length > 0 && (
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] opacity-75 tracking-wider">
              ✏️ BROUILLON
            </span>
          )}
        </div>

        {/* Sélection du rédacteur et Portée de la réunion */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] pt-1">
          {isGlobalAdmin && (reportStatus === '' || reportStatus === 'brouillon') ? (
            <div className="flex items-center gap-2 p-1.5 bg-neutral-100 rounded border border-dashed border-neutral-300">
               <label className="font-bold text-neutral-600 uppercase tracking-wider">Rédacteur de séance :</label>
               <select 
                 value={event.redacteurId || ''}
                 onChange={async (e) => {
                   const newRedacteurId = e.target.value;
                   const selectedUser = presents.find(p => p.userId === newRedacteurId);
                   try {
                     await updateDoc(doc(db, 'events', event.id), {
                       redacteurId: newRedacteurId,
                       redacteurName: selectedUser ? selectedUser.userName : ''
                     });
                   } catch (err) {
                     console.error("Erreur mise à jour rédacteur:", err);
                   }
                 }}
                 className="theme-input py-0.5 px-2 text-xs bg-white border-neutral-300"
               >
                 <option value="">-- Choisir un rédacteur parmi les présents --</option>
                 {presents.map(p => (
                   <option key={p.userId} value={p.userId}>{p.userName}</option>
                 ))}
               </select>
            </div>
          ) : event.redacteurName ? (
            <span className="italic text-neutral-600 font-bold bg-neutral-100 px-2 py-1 rounded">
              ✍️ Rédacteur de séance : {event.redacteurName}
            </span>
          ) : (
            <span className="italic text-neutral-400">Aucun rédacteur désigné</span>
          )}

          {/* Sélecteur de Portée : CA vs Publique */}
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold uppercase text-[9px] text-cordel-master-dark opacity-75">
              Portée :
            </span>
            {isAdmin && (reportStatus === '' || reportStatus === 'brouillon') ? (
              <div className="flex p-0.5 bg-white rounded border border-cordel-master-dark/20">
                <button
                  type="button"
                  onClick={() => handleUpdateAudience('publique')}
                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded transition-all cursor-pointer ${
                    localAudience !== 'ca'
                      ? 'bg-[var(--color-cordel-vert)] text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Visible par l'ensemble des adhérents, archivage Varal général"
                >
                  👥 Publique
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAudience('ca')}
                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded transition-all cursor-pointer ${
                    localAudience === 'ca'
                      ? 'bg-cordel-wood text-white shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Visible uniquement par les membres porteurs du badge CA/Bureau, archivage restreint"
                >
                  🔒 CA / Bureau
                </button>
              </div>
            ) : (
              <span className={`theme-stamp-badge text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                localAudience === 'ca'
                  ? 'bg-amber-100 text-amber-900 border-amber-500'
                  : 'bg-[var(--color-cordel-vert)]/10 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]/40'
              }`}>
                {localAudience === 'ca' ? '🔒 Réunion de CA / Bureau' : '👥 Réunion Publique'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 👥 Émargement des présents & participants */}
      <EventEmargementSection
        event={event}
        groupId={event.groupId || profileData?.groupId}
        isAdmin={isAdmin}
      />

      {/* 1. Mettre en place l'ordre du jour (Mode brouillon - ADMIN ONLY) */}
      {(reportStatus === '' || reportStatus === 'brouillon') && isAdmin && (
        <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light/45 border-dashed">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <h4 className="font-bold text-xs text-cordel-wood">➕ Ajouter un point ou un sujet abordé</h4>
            <CordelButton
              type="button"
              variant="vert"
              useExtremeBorder={true}
              onClick={() => setIsImportModalOpen(true)}
              className="text-[9.5px] font-extrabold uppercase px-2.5 py-1 flex items-center gap-1 shadow-sm"
            >
              📥 Importer un ordre du jour
            </CordelButton>
          </div>
          <form onSubmit={handleAddPoint} className="flex gap-2">
            <input 
              id="new-agenda-point-input"
              type="text" 
              value={newPointTitle}
              onChange={(e) => setNewPointTitle(e.target.value)}
              placeholder="Ex: Point 1 : Trésorerie, ou sujet spontané..."
              className="theme-input text-xs flex-1 bg-white/70 py-1.5"
            />
            <CordelButton variant="ocre" type="submit" className="text-xs px-3 py-1 font-bold whitespace-nowrap">
              Ajouter
            </CordelButton>
          </form>
        </CordelCard>
      )}

      {/* 2. Affichage des points (DRAFT/EDIT MODE - ADMIN ONLY) */}
      {(reportStatus === '' || reportStatus === 'brouillon') ? (
        isAdmin ? (
          <div className="flex flex-col gap-4">
            {localPoints.length === 0 ? (
              /* Encart d'accueil Tolérance Zéro-ODJ */
              <div className="p-5 bg-white/75 border-2 border-dashed border-cordel-master-dark/25 rounded-[6px_10px_5px_8px] text-center flex flex-col items-center gap-3">
                <span className="text-3xl select-none">📝</span>
                <div className="max-w-md">
                  <h4 className="font-extrabold text-xs uppercase text-cordel-wood tracking-wide">
                    Aucun ordre du jour préalable pour cette réunion
                  </h4>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Cette réunion s'est tenue sans ordre du jour formel ? Vous pouvez rédiger directement le compte-rendu libre ou consigner les sujets abordés. La saisie et la dictée vocale sont disponibles immédiatement.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center mt-1">
                  <CordelButton
                    type="button"
                    variant="vert"
                    useExtremeBorder={true}
                    onClick={handleInitFreeReport}
                    className="text-xs font-bold py-2 px-4 flex items-center gap-1.5 shadow-sm"
                  >
                    <span>✍️</span>
                    <span>Initialiser un compte-rendu libre</span>
                  </CordelButton>
                  <CordelButton
                    type="button"
                    variant="ocre"
                    useExtremeBorder={false}
                    onClick={() => {
                      const inputEl = document.getElementById('new-agenda-point-input');
                      if (inputEl) {
                        inputEl.focus();
                        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="text-xs font-bold py-2 px-3.5 flex items-center gap-1.5"
                  >
                    <span>➕</span>
                    <span>Ajouter un sujet abordé</span>
                  </CordelButton>
                </div>
              </div>
            ) : (
              localPoints.map((point, index) => (
                <div key={point.id} className="theme-inner-panel p-4 rounded-[4px_6px_3px_5px] flex flex-col gap-2 relative">
                  {/* Point Title Bar */}
                  <div className="flex justify-between items-center border-b border-dashed border-encre-noire/10 pb-1.5 gap-2 flex-wrap">
                    {editingPointId === point.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input 
                          type="text"
                          value={editingPointTitle}
                          onChange={(e) => setEditingPointTitle(e.target.value)}
                          className="theme-input text-xs font-bold py-0.5 flex-1 bg-white"
                        />
                        <button onClick={() => handleSavePointTitle(point.id)} className="text-[10px] text-green-700 font-extrabold hover:underline">💾</button>
                        <button onClick={() => setEditingPointId(null)} className="text-[10px] text-red-700 font-extrabold hover:underline">❌</button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-encre-noire flex-1">
                        📌 {point.titre}
                      </span>
                    )}

                    {/* Point Control Buttons */}
                    <div className="flex items-center gap-1">
                      <button 
                        type="button" 
                        onClick={() => handleMovePoint(index, 'up')}
                        disabled={index === 0}
                        className="text-[9px] font-bold p-1 bg-neutral-200/60 rounded hover:bg-neutral-300/60 disabled:opacity-30 cursor-pointer"
                        title="Monter"
                      >
                        ▲
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleMovePoint(index, 'down')}
                        disabled={index === localPoints.length - 1}
                        className="text-[9px] font-bold p-1 bg-neutral-200/60 rounded hover:bg-neutral-300/60 disabled:opacity-30 cursor-pointer"
                        title="Descendre"
                      >
                        ▼
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleStartEditPoint(point)}
                        className="text-[10px] p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded border border-amber-300"
                        title="Modifier le titre"
                      >
                        ✏️
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeletePoint(point.id)}
                        className="text-[10px] p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Notes Draft Area with Mic */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[8px] uppercase font-extrabold tracking-wider text-cordel-master-dark/65">
                        Notes et compte-rendu
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleSpeech(point.id)}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border rounded transition-all cursor-pointer flex items-center gap-1 ${
                          activeMicPointId === point.id
                            ? 'bg-red-600 text-white border-red-700 animate-pulse font-black'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-encre-noire border-encre-noire/30'
                        }`}
                      >
                        {activeMicPointId === point.id ? (
                          <>🔴 Dictée active... Clic pour couper</>
                        ) : (
                          <>🎤 Démarrer la dictée</>
                        )}
                      </button>
                    </div>

                    <textarea
                      value={point.notesCR || ''}
                      onChange={(e) => handleNotesChange(point.id, e.target.value)}
                      placeholder={t('agenda.reportPlaceholder') || "Saisissez des notes ou parlez après avoir démarré la dictée vocale..."}
                      className="theme-input text-xs w-full min-h-[70px] font-medium leading-relaxed resize-y bg-white/70"
                    />

                    {/* Affichage des propositions pour le rédacteur en mode édition */}
                    {(() => {
                      const pointPropositions = (event.propositionsCR || []).filter(p => p.pointId === point.id);
                      if (pointPropositions.length === 0) return null;
                      return (
                        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-wood">
                            💡 Propositions des membres
                          </span>
                          {pointPropositions.map(prop => (
                            <div key={prop.id} className={`p-2 rounded border text-xs flex justify-between gap-2 ${prop.traitee ? 'bg-green-50/50 border-green-200' : 'bg-amber-50/50 border-amber-200'}`}>
                              <div className="flex flex-col gap-1 flex-1">
                                <span className="font-bold text-[10px] text-encre-noire opacity-75">👤 {prop.userName}</span>
                                <span className="italic">{prop.texte}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleTogglePropositionStatus(prop.id, prop.traitee)}
                                className={`text-[9px] font-bold px-2 py-1 rounded border h-fit whitespace-nowrap cursor-pointer transition-colors ${prop.traitee ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white hover:bg-neutral-50 text-encre-noire border-neutral-300'}`}
                              >
                                {prop.traitee ? '✅ Traitée' : '⏳ Marquer traitée'}
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}

            {/* Action Bar (Draft Mode) */}
            {localPoints.length > 0 && (
              <div className="flex flex-col gap-3 mt-3">
                {/* 👥 Sélecteur SaaS du collège de validation */}
                <ReportValidatorsSelector
                  validationMode={validationMode}
                  onChangeValidationMode={setValidationMode}
                  selectedTags={selectedValidationTags}
                  onToggleTag={handleToggleValidationTag}
                  availableTags={availableTags}
                  presents={presents}
                  members={members}
                  selectedCustomUserIds={selectedCustomUserIds}
                  onToggleCustomUser={handleToggleCustomUser}
                  onSelectAllCustomUsers={handleSelectAllCustomUsers}
                  onDeselectAllCustomUsers={handleDeselectAllCustomUsers}
                  resolvedValidators={resolvedValidators}
                  audience={localAudience}
                />

                <div className="flex flex-col items-end gap-2.5">
                  {/* Case à cocher d'auto-validation à 7 jours (décochée par défaut) */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-cordel-master-dark cursor-pointer select-none bg-white/40 hover:bg-white/60 py-1.5 px-3 rounded border border-dashed border-cordel-master-dark/25 transition-colors">
                    <input 
                      type="checkbox"
                      checked={autoValidateAfter7Days}
                      onChange={(e) => setAutoValidateAfter7Days(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
                    />
                    <span>⏳ Valider et publier automatiquement au bout de 7 jours (sans opposition)</span>
                  </label>

                  <div className="flex justify-end gap-2.5">
                    <CordelButton 
                      variant="default" 
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                      className="text-xs py-2 px-4 font-bold"
                    >
                      {isSaving ? "⏳ Enregistrement..." : (t('agenda.btnSaveReport') ? `💾 ${t('agenda.btnSaveReport')}` : "💾 Enregistrer le compte-rendu")}
                    </CordelButton>
                    <CordelButton 
                      variant="ocre" 
                      onClick={handleSubmitForReview}
                      disabled={isSaving || resolvedValidators.length === 0}
                      className="text-xs py-2 px-4 font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "⏳ Soumission..." : "📤 Soumettre pour validation"}
                    </CordelButton>
                  </div>
                </div>
              </div>
            )}

            {/* Secrétaire Moderation Panel */}
            <div className="mt-6 border-t-2 border-dashed border-cordel-master-dark/15 pt-4 flex flex-col gap-3">
              <h4 className="font-bold text-xs text-cordel-wood flex items-center gap-1">
                💡 Suggestions d'ordre du jour des membres ({(event.suggestionsOrdreDuJour || []).length})
              </h4>
              
              {(event.suggestionsOrdreDuJour || []).length === 0 ? (
                <p className="text-xs italic opacity-60">Aucune suggestion soumise par les membres pour le moment.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {(event.suggestionsOrdreDuJour || []).map((s) => {
                    const isPending = s.status === 'en_attente';
                    
                    return (
                      <div key={s.id} className="theme-inner-panel p-3 rounded bg-white/30 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2 text-xs">
                          <div>
                            <span className="font-extrabold text-encre-noire block">
                              📝 {s.titre}
                            </span>
                            <span className="text-[9px] opacity-65 font-bold">
                              Proposé par {s.userName}
                            </span>
                          </div>
                          
                          <div>
                            {s.status === 'valide' && (
                              <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] tracking-wider text-green-700 border-green-700 bg-green-50">
                                VALIDÉ
                              </span>
                            )}
                            {s.status === 'invalide' && (
                              <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] tracking-wider text-red-700 border-red-700 bg-red-50">
                                REFUSÉ
                              </span>
                            )}
                            {s.status === 'en_attente' && (
                              <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] tracking-wider text-amber-700 border-amber-700 bg-amber-50 animate-pulse">
                                EN ATTENTE
                              </span>
                            )}
                          </div>
                        </div>

                        {s.reponseSecretaire && (
                          <p className="text-[10px] bg-white/50 p-1.5 rounded italic opacity-75 border-l-2 border-encre-noire/15">
                            <strong>Réponse secrétaire :</strong> "{s.reponseSecretaire}"
                          </p>
                        )}

                        {isPending && (
                          <div className="flex flex-col gap-2 mt-1 border-t border-dashed border-encre-noire/10 pt-2">
                            <div className="flex flex-col gap-1">
                              <label className="text-[8px] uppercase font-bold tracking-wider opacity-65">
                                Réponse courte facultative
                              </label>
                              <input 
                                type="text"
                                value={secretaryResponses[s.id] || ''}
                                onChange={(e) => setSecretaryResponses(prev => ({ ...prev, [s.id]: e.target.value }))}
                                placeholder="Justifiez l'acceptation ou le refus..."
                                className="theme-input text-xs w-full py-1 bg-white"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <CordelButton
                                variant="vert"
                                onClick={() => handleModerateSuggestion(s.id, 'valide', secretaryResponses[s.id] || '')}
                                className="text-[10px] py-1 px-2.5 font-bold"
                              >
                                ✅ Valider
                              </CordelButton>
                              <CordelButton
                                variant="rouge"
                                onClick={() => handleModerateSuggestion(s.id, 'invalide', secretaryResponses[s.id] || '')}
                                className="text-[10px] py-1 px-2.5 font-bold"
                              >
                                ❌ Refuser
                              </CordelButton>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Draft mode, but NOT Admin */
          <div className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-3">
              <span className="text-[9px] uppercase font-bold tracking-wider text-cordel-wood">📌 Ordre du jour actuel :</span>
              {localPoints.length === 0 ? (
                <p className="text-xs italic opacity-60">{t('agenda.noReportYet') || "L'ordre du jour n'a pas encore été rédigé."}</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {localPoints.map((p, idx) => (
                    <div key={p.id} className="text-xs pl-3 border-l-2 border-cordel-wood font-semibold">
                      {idx + 1}. {p.titre}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <CordelCard variant="default" useExtremeBorder={true} className="p-4 bg-cordel-bg-light/45 border-dashed mt-2">
              <h4 className="font-bold text-xs text-cordel-wood mb-2 flex items-center gap-1.5">
                💡 Ordre du jour participatif
              </h4>
              <p className="text-[10px] opacity-75 mb-3 leading-relaxed">
                Proposez un point que vous aimeriez aborder lors de cette réunion. Le secrétaire décidera de son intégration.
              </p>
              
              <form onSubmit={handleAddSuggestion} className="flex gap-2">
                <input 
                  type="text" 
                  value={newSuggestionTitle}
                  onChange={(e) => setNewSuggestionTitle(e.target.value)}
                  placeholder="Sujet du point..."
                  required
                  disabled={isSubmittingSuggestion}
                  className="theme-input text-xs flex-1 bg-white/70 py-1.5"
                />
                <CordelButton variant="ocre" type="submit" disabled={isSubmittingSuggestion} className="text-xs px-3 py-1 font-bold whitespace-nowrap">
                  {isSubmittingSuggestion ? "Envoi..." : "Proposer"}
                </CordelButton>
              </form>

              {(() => {
                const mySuggestions = (event.suggestionsOrdreDuJour || []).filter(s => s.userId === user.uid);
                if (mySuggestions.length === 0) return null;
                
                return (
                  <div className="mt-4 border-t border-dashed border-encre-noire/10 pt-3 flex flex-col gap-2">
                    <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">
                      Vos propositions :
                    </span>
                    <div className="flex flex-col gap-2">
                      {mySuggestions.map(s => (
                        <div key={s.id} className="bg-white/40 p-2.5 rounded border border-encre-noire/5 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center gap-2 text-xs">
                            <span className="font-bold text-encre-noire">📝 {s.titre}</span>
                            <div>
                              {s.status === 'valide' && (
                                <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] text-green-700 border-green-700 bg-green-50">
                                  ACCEPTÉ
                                </span>
                              )}
                              {s.status === 'invalide' && (
                                <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] text-red-700 border-red-700 bg-red-50">
                                  REFUSÉ
                                </span>
                              )}
                              {s.status === 'en_attente' && (
                                <span className="theme-stamp-badge theme-stamp-badge-dark text-[7px] text-amber-700 border-amber-700 bg-amber-50 animate-pulse">
                                  EN ATTENTE
                                </span>
                              )}
                            </div>
                          </div>
                          {s.reponseSecretaire && (
                            <p className="text-[9px] bg-white/40 p-1.5 rounded italic opacity-75 border-l-2 border-encre-noire/15 mt-0.5">
                              <strong>Réponse secrétaire :</strong> "{s.reponseSecretaire}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CordelCard>
          </div>
        )
      ) : null}

      {/* 3. Mode validation/attente relecture OU publié */}
      {reportStatus !== '' && reportStatus !== 'brouillon' && (
        <div className="flex flex-col gap-4">
          
          {/* Read-Only Report Content Display */}
          <div className="theme-inner-panel p-5 rounded-[6px_10px_5px_8px] bg-white/50 flex flex-col gap-4 shadow-sm">
            <div className="border-b border-dashed border-encre-noire/15 pb-2">
              <h4 className="text-sm font-black text-encre-noire tracking-wide">
                COMPTE-RENDU DE RÉUNION - {formatDate(event.date)}
              </h4>
              <p className="text-[8px] uppercase tracking-wider font-extrabold text-cordel-wood mt-0.5">
                Statut : {reportStatus === 'publie' ? '✅ VALIDÉ ET PUBLIÉ' : '⏳ EN RELECTURE DÉMOCRATIQUE'}
              </p>

              {/* Badge d'auto-validation à J+7 */}
              {reportStatus === 'attente_relecture' && event.autoValidateAfter7Days && event.compteRenduAutoValidateAt && (
                <div className="mt-2 py-1.5 px-2.5 rounded bg-amber-50/90 border border-dashed border-amber-400 flex items-center justify-between flex-wrap gap-2 text-[10px] font-bold text-amber-950">
                  <span className="flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>Validation automatique prévue le <strong>{formatDate(event.compteRenduAutoValidateAt)}</strong> (sauf demande de modification).</span>
                  </span>
                  {Object.values(approvals).some(v => v?.approved === false) && (
                    <span className="text-[8.5px] font-black uppercase text-red-700 bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                      ⚠️ Suspendue (modification demandée)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {localPoints.map((point, index) => (
                <div key={point.id} className="flex flex-col gap-1 pl-3 border-l-2 border-cordel-wood/30">
                  <h5 className="font-bold text-encre-noire">📌 {point.titre}</h5>
                  <p className="opacity-90 leading-relaxed font-medium whitespace-pre-wrap pl-2 italic">
                    {point.notesCR ? point.notesCR.trim() : "Aucune note."}
                  </p>

                  {/* Propositions System for this point */}
                  {reportStatus === 'attente_relecture' && (
                    <div className="mt-2 ml-2 flex flex-col gap-2">
                      {/* Affichage des propositions existantes */}
                      {(() => {
                        const pointPropositions = (event.propositionsCR || []).filter(p => p.pointId === point.id);
                        if (pointPropositions.length === 0) return null;
                        return (
                          <div className="flex flex-col gap-1.5 border-l-2 border-amber-300 pl-2">
                            {pointPropositions.map(prop => (
                              <div key={prop.id} className="text-[10px] bg-amber-50/50 p-1.5 rounded border border-amber-100 flex flex-col">
                                <span className="font-bold text-encre-noire opacity-75">👤 {prop.userName}</span>
                                <span className="italic">{prop.texte}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      
                      {/* Ajout d'une proposition */}
                      {isUserPresent && (
                        <div className="flex gap-2 items-center mt-1">
                          <input
                            type="text"
                            value={newPropositionText[point.id] || ''}
                            onChange={(e) => setNewPropositionText(prev => ({ ...prev, [point.id]: e.target.value }))}
                            placeholder="Proposer une modification..."
                            className="theme-input text-[10px] flex-1 py-1 bg-white/70"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddProposition(point.id)}
                            disabled={!newPropositionText[point.id]?.trim()}
                            className="text-[9px] font-bold uppercase tracking-wider bg-cordel-wood text-white px-2 py-1 rounded shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            💬 Proposer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Liste des adhérents et participants présents */}
            {(presents.length > 0 || (event.invitesOuPublicCount || 0) > 0) && (
              <div className="border-t border-dashed border-encre-noire/10 pt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">
                  Présents ({presents.length + (event.invitesOuPublicCount || 0)}) :
                </span>
                {presents.map(ins => (
                  <span key={ins.userId} className="text-[9px] font-bold px-2 py-0.5 bg-neutral-200/60 rounded text-encre-noire">
                    👤 {ins.userName}
                  </span>
                ))}
                {(event.invitesOuPublicCount || 0) > 0 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded">
                    👥 + {event.invitesOuPublicCount} invité(s) / public
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 4. Sondage / Vote pour les Présents et Validateurs désignés */}
          {reportStatus === 'attente_relecture' && (
            <div className="flex flex-col gap-3">
              {/* Vote Encart (Visible exclusively to designated validators or info for other presents) */}
              {isUserValidator ? (
                <CordelCard variant="default" useExtremeBorder={true} className="p-5 border-2 border-cordel-wood bg-cordel-bg-light shadow-md">
                  <h4 className="text-xs font-extrabold uppercase text-cordel-wood tracking-wider mb-2.5 flex items-center gap-1.5">
                    🗳️ Approbation du Compte-Rendu (Validateur désigné)
                  </h4>
                  
                  {event.autoValidateAfter7Days && event.compteRenduAutoValidateAt && (
                    <div className="mb-2.5 p-1.5 rounded bg-amber-50 text-[10px] text-amber-900 border border-amber-300 font-semibold flex items-center gap-1.5">
                      <span>⏳</span>
                      <span>Validation automatique prévue le <strong>{formatDate(event.compteRenduAutoValidateAt)}</strong> (sauf demande de modification).</span>
                    </div>
                  )}

                  {userVote ? (
                    <div className="flex flex-col gap-2.5">
                      <p className="text-xs font-semibold leading-relaxed text-encre-noire">
                        Vous avez voté : {userVote.approved ? (
                          <span className="text-green-700 font-extrabold">✅ APPROUVÉ</span>
                        ) : (
                          <span className="text-red-700 font-extrabold">❌ MODIFICATION DEMANDÉE</span>
                        )}
                        {userVote.commentaire && (
                          <span className="block mt-1 pl-3 border-l-2 border-dashed border-red-500 italic text-[11px] opacity-75">
                            "{userVote.commentaire}"
                          </span>
                        )}
                      </p>
                      
                      <div className="flex">
                        <button 
                          onClick={() => {
                            // Réinitialiser vote so they can edit it
                            const updated = { ...approvals };
                            delete updated[user.uid];
                            const eventRef = doc(db, 'events', event.id);
                            updateDoc(eventRef, { compteRenduApprovals: updated });
                          }}
                          className="text-[9px] font-black uppercase tracking-wider text-blue-700 hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          ✏️ Modifier mon vote
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-[11px] leading-relaxed opacity-85">
                        En tant que validateur désigné, veuillez confirmer si ce compte-rendu reflète fidèlement la réunion ou demander des modifications.
                      </p>
                      
                      {/* Optional comments for modification */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[8px] uppercase font-bold tracking-wider opacity-65">
                          Commentaire facultatif (requis si demande de modif)
                        </label>
                        <input 
                          type="text" 
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Ajoutez des précisions..."
                          className="theme-input text-xs w-full py-1.5 bg-white"
                        />
                      </div>

                      <div className="flex gap-2">
                        <CordelButton
                          variant="vert"
                          onClick={() => handleVote(true)}
                          className="text-xs py-2 px-3 flex-1 font-bold"
                        >
                          ✅ Approuver
                        </CordelButton>
                        <CordelButton
                          variant="rouge"
                          onClick={() => {
                            if (!comment.trim()) {
                              alert("Veuillez saisir un commentaire expliquant la modification demandée.");
                              return;
                            }
                            handleVote(false, comment);
                          }}
                          className="text-xs py-2 px-3 flex-1 font-bold"
                        >
                          ❌ Demander une modification
                        </CordelButton>
                      </div>
                    </div>
                  )}
                </CordelCard>
              ) : isUserPresent ? (
                /* Membre présent mais ne faisant pas partie du collège de relecteurs désignés */
                <div className="p-4 bg-amber-50/80 border border-dashed border-amber-400 rounded text-amber-900 text-xs font-medium flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">⏳</span>
                    <div>
                      <p className="font-bold text-amber-950">
                        En cours de relecture par les validateurs désignés ({approvedCount}/{totalValidators} validations).
                      </p>
                      <p className="text-[10.5px] opacity-80 mt-0.5">
                        Vous étiez présent à cette réunion. La validation de ce compte-rendu a été confiée aux relecteurs désignés avant publication officielle.
                      </p>
                    </div>
                  </div>
                  <span className="theme-stamp-badge text-[8px] font-black uppercase tracking-wider bg-white/70 text-amber-800 border-amber-300">
                    👀 Relecture restreinte
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-neutral-100 text-neutral-600 rounded text-center text-[10px] italic">
                  🔒 Le vote d'approbation est réservé aux validateurs désignés pour cette réunion.
                </div>
              )}

              {/* Vote Statistics (For all, especially Admin) */}
              <div className="theme-inner-panel p-3.5 rounded-[4px_6px_3px_5px] flex flex-col gap-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[8px] uppercase font-black tracking-wider text-cordel-master-dark opacity-65">
                    État des votes ({approvedCount + rejectedCount} / {totalValidators} validateur{totalValidators > 1 ? 's' : ''} désigné{totalValidators > 1 ? 's' : ''})
                  </span>
                  {event.compteRenduValidationMode && (
                    <span className="text-[8px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-300">
                      Collège : {event.compteRenduValidationMode === 'present_by_tags' ? '🏷️ Par badge' : event.compteRenduValidationMode === 'custom_users' ? '👤 Nominatif' : '👥 Tous les présents'}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-4 text-xs font-semibold flex-wrap">
                  <div className="text-green-700">✅ {approvedCount} Approbation{approvedCount > 1 ? 's' : ''}</div>
                  <div className="text-red-700">❌ {rejectedCount} Demande{rejectedCount > 1 ? 's' : ''} de modification</div>
                  <div className="text-neutral-500">⏳ {pendingCount} En attente</div>
                </div>

                <div className="mt-1">
                  <button 
                    onClick={() => setShowVoters(!showVoters)}
                    className="text-[10px] text-[var(--color-cordel-ocre,#c05621)] font-extrabold hover:underline uppercase tracking-wider bg-transparent border-0 cursor-pointer"
                  >
                    👥 {showVoters ? "Masquer le détail des validateurs" : "Voir le détail des validateurs désignés"}
                  </button>
                </div>

                {showVoters && (
                  <div className="mt-1 mb-2 flex flex-col gap-3 p-3 bg-white/40 border border-dashed border-cordel-master-dark/15 rounded text-[10px]">
                    {validatorsApproved.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-[var(--color-cordel-vert,#2d6a4f)]">✅ Ont approuvé :</span>
                        <div className="flex flex-wrap gap-1">
                          {validatorsApproved.map(val => (
                            <span key={val.uid} className="px-1.5 py-0.5 bg-[var(--color-cordel-vert)]/10 text-[var(--color-cordel-vert,#2d6a4f)] rounded font-semibold">
                              {val.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {validatorsRejected.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-[var(--color-cordel-rouge,#8b2a1a)]">❌ Ont demandé une modification :</span>
                        <div className="flex flex-wrap gap-1">
                          {validatorsRejected.map(val => (
                            <span key={val.uid} className="px-1.5 py-0.5 bg-[var(--theme-primary)]/10 text-[var(--color-cordel-rouge,#8b2a1a)] rounded font-semibold">
                              {val.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {validatorsPending.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="font-extrabold text-[var(--color-cordel-ocre,#c05621)]">⏳ En attente de vote :</span>
                        <div className="flex flex-wrap gap-1">
                          {validatorsPending.map(val => (
                            <span key={val.uid} className="px-1.5 py-0.5 bg-[var(--color-cordel-ocre)]/10 text-[var(--color-cordel-ocre,#c05621)] rounded font-semibold">
                              {val.displayName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* List of comments/modifs */}
                {Object.keys(approvals).some(uid => approvals[uid]?.commentaire) && (
                  <div className="mt-2 border-t border-dashed border-encre-noire/10 pt-2 flex flex-col gap-1.5">
                    <span className="text-[8px] uppercase font-bold tracking-wider text-cordel-wood">Modifications demandées :</span>
                    {Object.keys(approvals).map(uid => {
                      const vote = approvals[uid];
                      if (!vote?.commentaire) return null;
                      return (
                        <div key={uid} className="text-[10px] leading-relaxed bg-red-50 text-red-800 p-2 rounded border border-red-200">
                          <span className="font-bold">👤 {vote.userName || 'Membre'} :</span> "{vote.commentaire}"
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Publish & Revert Buttons (ADMIN ONLY - when status is review) */}
                {isAdmin && (
                  <div className="flex justify-between items-center border-t border-dashed border-encre-noire/10 pt-3 mt-1 flex-wrap gap-2">
                    <CordelButton 
                      variant="rouge" 
                      onClick={handleRevertToDraft}
                      disabled={isSaving}
                      className="text-xs py-1.5 px-3 font-bold"
                    >
                      ✏️ Repasser en brouillon
                    </CordelButton>
                    <CordelButton 
                      variant="vert" 
                      useExtremeBorder={true}
                      onClick={() => handlePublishDefinitive(localPoints, approvals)}
                      disabled={isSaving}
                      className="text-xs py-1.5 px-4 font-extrabold uppercase tracking-wider"
                    >
                      {isSaving ? "⏳ Validation..." : "⚡ Forcer la validation définitive (Override)"}
                    </CordelButton>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 5. Message Published & PDF Download */}
          {reportStatus === 'publie' && (
            <div className="p-4 bg-green-50 border border-green-300 rounded text-center text-xs font-bold text-green-900 flex flex-col gap-3 items-center">
              <div>
                🎉 Ce compte-rendu est <strong>officiellement validé</strong> et archivé dans la catégorie <strong>Comptes-rendus</strong> du Varal.
              </div>
              <CordelButton
                variant="vert"
                useExtremeBorder={true}
                onClick={handleDownloadPDF}
                className="text-xs font-extrabold uppercase px-4 py-2 flex items-center gap-1.5 shadow-sm"
              >
                📄 Télécharger le PDF officiel du Compte-Rendu
              </CordelButton>
            </div>
          )}

        </div>
      )}
      
      {/* Modale d'importation de modèles d'ordre du jour */}
      <ImportAgendaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        groupId={event.groupId}
        onSelectTemplate={async (template) => {
          try {
            const formattedPoints = (template.points || []).map(p => {
              if (typeof p === 'object' && p.titre) return p;
              return { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), titre: String(p), notesCR: '' };
            });

            const eventRef = doc(db, 'events', event.id);
            await updateDoc(eventRef, {
              pointsOrdreDuJour: formattedPoints,
              ...(reportStatus === '' ? { compteRenduStatus: 'brouillon' } : {})
            });
            setLocalPoints(formattedPoints);

            // Synchronisation si événement faisant partie d'un sondage
            if (event.pollGroupId) {
              const pollConstraints = [where('pollGroupId', '==', event.pollGroupId)];
              if (event.groupId) {
                pollConstraints.push(where('groupId', '==', event.groupId));
              }
              const pollQuery = query(collection(db, 'events'), ...pollConstraints);
              const pollSnapshot = await getDocs(pollQuery);
              if (!pollSnapshot.empty) {
                const batch = writeBatch(db);
                pollSnapshot.forEach((docSnap) => {
                  if (docSnap.id !== event.id) {
                    batch.update(docSnap.ref, { pointsOrdreDuJour: formattedPoints });
                  }
                });
                await batch.commit();
              }
            }
            alert("Ordre du jour importé avec succès !");
          } catch (err) {
            console.error("Erreur lors de l'importation de l'ordre du jour :", err);
            alert("Erreur lors de l'importation de l'ordre du jour.");
          }
        }}
      />
    </div>
  );
}
