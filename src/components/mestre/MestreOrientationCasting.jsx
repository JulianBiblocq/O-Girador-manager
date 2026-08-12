import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import XiloAvatar from '../XiloAvatar';
import { filterPublicPercussionInstruments } from '../../utils/tagUtils';
import { DEFAULT_CUSTOM_CATEGORIES, resolveCategory } from '../../utils/categoryUtils';

const DEFAULT_INSTRUMENTS = [
  "Alfaia Marcante",
  "Alfaia Meião",
  "Alfaia Repique",
  "Caixa",
  "Tarol",
  "Gonguê",
  "Agbê",
  "Mineiro",
  "Timbal",
  "Chant"
];

const getInstrumentIconPath = (instName) => {
  if (!instName) return '/favicon.svg';
  const name = instName.toLowerCase().trim();
  if (name.includes('danse') || name.includes('dance')) return '/icones/danse.svg';
  if (name.includes('alfaia')) return '/icones/alfaia.svg';
  if (name.includes('agbê') || name.includes('agbe') || name.includes('sementes')) return '/icones/agbe.svg';
  if (name.includes('gonguê') || name.includes('gongue')) return '/icones/gongue.svg';
  if (name.includes('caixa') || name.includes('tarol') || name.includes('caisse')) return '/icones/caixa.svg';
  if (name.includes('chant') || name.includes('voix') || name.includes('singer') || name.includes('micro')) return '/icones/micro.svg';
  if (name.includes('timbal')) return '/icones/timbal.svg';
  if (name.includes('mineiro')) return '/icones/mineiro.svg';
  if (name.includes('apito') || name.includes('mestre') || name.includes('chef')) return '/icones/apito.svg';
  return '/favicon.svg';
};

/**
 * Assainit les vœux d'orientation d'un membre pour extraire "Danse" des vœux de percussions.
 * Si "Danse" figurait dans voeuPrincipal, voeuSecondaire, voeuTertiaire ou voeuxInstruments :
 * 1. Bascule pratiqueDanse à true.
 * 2. Purge "Danse" du tableau des vœux de percussions.
 * 3. Persiste l'assainissement dans Firestore si nécessaire.
 */
const sanitizeMemberDanseWishes = (memberData, memberId) => {
  if (!memberData) return memberData;

  const copy = { ...memberData };
  let needsUpdate = false;

  const rawWishes = [
    copy.voeuPrincipal,
    copy.voeuSecondaire,
    copy.voeuTertiaire,
    ...(Array.isArray(copy.voeuxInstruments) ? copy.voeuxInstruments : [])
  ].filter(Boolean);

  const containsDanseWish = rawWishes.some(w => typeof w === 'string' && w.toLowerCase().trim() === 'danse');
  const containsDanseInstrument = (copy.instrument || '').toLowerCase().trim() === 'danse' || (copy.instrumentPrincipal || '').toLowerCase().trim() === 'danse';

  if (containsDanseWish || containsDanseInstrument) {
    if (!copy.pratiqueDanse) {
      copy.pratiqueDanse = true;
      needsUpdate = true;
    }

    const cleanPercussionWishes = rawWishes.filter(w => typeof w === 'string' && w.toLowerCase().trim() !== 'danse');
    const uniqueCleanWishes = Array.from(new Set(cleanPercussionWishes));

    if (JSON.stringify(copy.voeuxInstruments || []) !== JSON.stringify(uniqueCleanWishes)) {
      copy.voeuxInstruments = uniqueCleanWishes;
      copy.voeuPrincipal = uniqueCleanWishes[0] || '';
      copy.voeuSecondaire = uniqueCleanWishes[1] || '';
      copy.voeuTertiaire = uniqueCleanWishes[2] || '';
      needsUpdate = true;
    }

    if (needsUpdate && memberId) {
      try {
        const userRef = doc(db, 'users', memberId);
        const updatePayload = {
          pratiqueDanse: true,
          voeuxInstruments: copy.voeuxInstruments || [],
          voeuPrincipal: copy.voeuPrincipal || '',
          voeuSecondaire: copy.voeuSecondaire || '',
          voeuTertiaire: copy.voeuTertiaire || ''
        };

        // Sécurité supplémentaire : filtrer tout champ resté undefined
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined) {
            delete updatePayload[key];
          }
        });

        updateDoc(userRef, updatePayload).catch(err => console.error("MestreOrientationCasting - Erreur de sauvegarde assainissement :", err));
      } catch (e) {
        console.error("MestreOrientationCasting - Erreur d'assainissement :", e);
      }
    }
  }

  return copy;
};

/**
 * Composant MestreOrientationCasting
 * Tableau de bord "Orientation & Casting" pour le Mestre.
 * Permet la validation à 1-clic des vœux d'instruments et la gestion des pupitres.
 */
export default function MestreOrientationCasting({ user, profileData, _onNavigateToMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instrumentsDisponibles, setInstrumentsDisponibles] = useState(DEFAULT_INSTRUMENTS);
  const [linkedInstruments, setLinkedInstruments] = useState([]);
  const [customCategories, setCustomCategories] = useState(DEFAULT_CUSTOM_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const groupId = profileData?.groupId || null;

  // Synchronisation en temps réel de la liste des membres avec assainissement des anciens vœux "Danse"
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('groupId', '==', groupId));

    const unsubscribeUsers = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        const memberId = docSnap.id;
        const sanitized = sanitizeMemberDanseWishes(rawData, memberId);
        fetched.push({
          id: memberId,
          ...sanitized
        });
      });
      setMembers(fetched);
      setLoading(false);
    }, (error) => {
      console.error("MestreOrientationCasting - Erreur de fetch des utilisateurs :", error);
      setLoading(false);
    });

    return () => unsubscribeUsers();
  }, [groupId]);

  // Synchronisation en temps réel des instruments configurés et liés de l'association
  useEffect(() => {
    if (!groupId) return;

    const assocRef = doc(db, 'associations', groupId);
    const unsubscribeAssoc = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data.instrumentsDisponibles) && data.instrumentsDisponibles.length > 0) {
          setInstrumentsDisponibles(data.instrumentsDisponibles);
        } else if (Array.isArray(data.instrumentsActifs) && data.instrumentsActifs.length > 0) {
          setInstrumentsDisponibles(data.instrumentsActifs);
        } else {
          setInstrumentsDisponibles([]);
        }

        if (Array.isArray(data.linkedInstruments)) {
          setLinkedInstruments(data.linkedInstruments);
        } else {
          setLinkedInstruments([]);
        }

        if (Array.isArray(data.customCategories) && data.customCategories.length > 0) {
          setCustomCategories(data.customCategories);
        } else {
          setCustomCategories(DEFAULT_CUSTOM_CATEGORIES);
        }
      }
    }, (error) => {
      console.error("MestreOrientationCasting - Erreur de chargement des instruments :", error);
    });

    return () => unsubscribeAssoc();
  }, [groupId]);

  // Détermine si un membre pratique ou souhaite pratiquer la percussion (exclut les danseurs 100% Danse sans percussion)
  const isPercussionistMember = (m) => {
    if (!m) return false;
    if (m.pratiquePercussion === false) return false;
    if (m.pratiquePercussion === true) return true;

    const inst = (m.instrument || m.instrumentPrincipal || '').toLowerCase().trim();
    const wishesList = Array.isArray(m.voeuxInstruments) && m.voeuxInstruments.length > 0
      ? m.voeuxInstruments.filter(Boolean)
      : [m.voeuPrincipal, m.voeuSecondaire, m.voeuTertiaire].filter(Boolean);

    const hasAssignedPercussion = inst && inst !== 'danse' && inst !== 'chant' && inst !== 'en attente';
    const hasPercussionWishes = wishesList.some(w => {
      const wishLower = w.toLowerCase().trim();
      return wishLower !== 'danse' && wishLower !== 'chant';
    });

    return hasAssignedPercussion || hasPercussionWishes;
  };

  // Filtrer les membres actifs (exclure uniquement les inactifs)
  const activeMembers = useMemo(() => {
    return members.filter(m => m.statutActuel !== 'inactive');
  }, [members]);

  // Pupitres combinés (groupes liés + instruments configurés seuls + Danse tout au bout)
  const displayPupitres = useMemo(() => {
    const result = [];
    const usedInstruments = new Set();

    // 1. Groupes d'instruments liés configurés (exclut Danse)
    (linkedInstruments || []).forEach((group, idx) => {
      const groupInsts = Array.isArray(group.instruments) ? group.instruments : [];
      if (groupInsts.length > 0) {
        const name = group.name && group.name.trim() ? group.name.trim() : groupInsts.join(' + ');
        result.push({
          id: `linked-${idx}-${name}`,
          name: name,
          subTitle: group.name ? groupInsts.join(' + ') : '',
          isGroup: true,
          instruments: groupInsts
        });
        groupInsts.forEach(i => usedInstruments.add(i.toLowerCase().trim()));
      }
    });

    // 2. Instruments autonomes configurés dans l'association (exclut Danse et rôle Mestre)
    (instrumentsDisponibles || []).forEach(inst => {
      const lower = inst.toLowerCase().trim();
      if (lower !== 'danse' && lower !== 'mestre' && lower !== 'direction' && !usedInstruments.has(lower)) {
        result.push({
          id: `single-${inst}`,
          name: inst,
          subTitle: '',
          isGroup: false,
          instruments: [inst]
        });
      }
    });

    // 3. Placer le pupitre Danse TOUT AU BOUT
    result.push({
      id: 'single-Danse',
      name: 'Danse',
      subTitle: 'Section Danse',
      isGroup: false,
      instruments: ['Danse']
    });

    return result;
  }, [linkedInstruments, instrumentsDisponibles]);

  // Calcul en temps réel des quotas d'effectifs par pupitre
  const quotasByPupitre = useMemo(() => {
    const counts = {};
    displayPupitres.forEach(pupitre => {
      counts[pupitre.id] = { primary: 0, secondary: 0 };
    });

    activeMembers.forEach(member => {
      const mainInst = (member.instrument || member.instrumentPrincipal || '').toLowerCase().trim();
      const secInst = (member.instrumentSecondaire || '').toLowerCase().trim();

      displayPupitres.forEach(pupitre => {
        if (pupitre.name.toLowerCase() === 'danse') {
          if (member.pratiqueDanse === true || mainInst === 'danse') {
            counts[pupitre.id].primary += 1;
          }
        } else {
          const matchMain = pupitre.instruments.some(i => {
            const clean = i.toLowerCase().trim();
            return clean === mainInst || (mainInst && (mainInst.includes(clean) || clean.includes(mainInst)));
          });
          const matchSec = pupitre.instruments.some(i => {
            const clean = i.toLowerCase().trim();
            return clean === secInst || (secInst && (secInst.includes(clean) || clean.includes(secInst)));
          });

          if (matchMain) {
            counts[pupitre.id].primary += 1;
          }
          if (matchSec) {
            counts[pupitre.id].secondary += 1;
          }
        }
      });
    });

    return counts;
  }, [activeMembers, displayPupitres]);

  // Détermine si un membre a un vœu réellement EN ATTENTE de traitement par le Mestre
  const hasPendingWishForMestre = (m) => {
    if (!isPercussionistMember(m)) return false;

    const isUnassigned = !m.instrument || m.instrument.trim() === '' || m.instrument === 'En attente';
    const hasFormulatedWishes = Boolean((Array.isArray(m.voeuxInstruments) && m.voeuxInstruments.length > 0) || m.voeuPrincipal);
    const wantsChange = Boolean(m.souhaiteChangerInstrument);
    const isLegacyDirectChoice = isUnassigned && !hasFormulatedWishes && m.estAncienMembre !== false;

    // Si pas encore d'instrument attribué et des vœux formulés -> en attente
    if (isUnassigned && hasFormulatedWishes) return true;
    
    // Ancien profil qui doit être assigné directement
    if (isLegacyDirectChoice) return true;

    // Si instrument déjà attribué, en attente uniquement si demande de réorientation explicite
    if (!isUnassigned && wantsChange && hasFormulatedWishes) return true;

    return false;
  };

  // Détermine si un percussionniste n'a pas encore d'instrument attribué
  const isUnassignedForMestre = (m) => {
    if (!isPercussionistMember(m)) return false;
    return !m.instrument || m.instrument.trim() === '' || m.instrument === 'En attente';
  };

  // Tri des membres du tableau
  const sortedMembers = useMemo(() => {
    const list = [...activeMembers];

    const needsAttention = (m) => {
      return isUnassignedForMestre(m) || hasPendingWishForMestre(m);
    };

    return list.sort((a, b) => {
      const aPriority = needsAttention(a) ? 0 : 1;
      const bPriority = needsAttention(b) ? 0 : 1;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      const nameA = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase();
      const nameB = `${b.prenom || ''} ${b.nom || ''}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [activeMembers]);

  // Membres filtrés selon la recherche et le filtre de vœux en attente
  const filteredMembers = useMemo(() => {
    let list = sortedMembers;

    if (showPendingOnly) {
      list = list.filter(m => {
        return isUnassignedForMestre(m) || hasPendingWishForMestre(m);
      });
    }

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase().trim();
    return list.filter(m => {
      const fullName = `${m.prenom || ''} ${m.nom || ''}`.toLowerCase();
      const surnom = (m.surnom || '').toLowerCase();
      const inst = (m.instrument || '').toLowerCase();
      const secInst = (m.instrumentSecondaire || '').toLowerCase();
      const v1 = (m.voeuPrincipal || '').toLowerCase();
      const v2 = (m.voeuSecondaire || '').toLowerCase();
      const v3 = (m.voeuTertiaire || '').toLowerCase();
      return fullName.includes(term) || surnom.includes(term) || inst.includes(term) || secInst.includes(term) || v1.includes(term) || v2.includes(term) || v3.includes(term);
    });
  }, [sortedMembers, searchTerm, showPendingOnly]);

  // Fonctions de sauvegarde inline
  const handleUpdateMainInstrument = async (memberId, newInstrument) => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', memberId);
      const updatePayload = {
        instrument: newInstrument,
        instrumentPrincipal: newInstrument,
        souhaiteChangerInstrument: false
      };
      
      const member = members.find(m => m.id === memberId);
      if (member) {
         const secInst = member.instrumentSecondaire || '';
         updatePayload.instrumentsJoues = Array.from(new Set([newInstrument, secInst].filter(Boolean)));
      }

      await updateDoc(userRef, updatePayload);
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMainLevel = async (memberId, newLevel) => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, { niveauMusique: newLevel, niveau: newLevel });
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSecondaryInstrument = async (memberId, newInstrument) => {
    setSaving(true);
    try {
      const member = members.find(m => m.id === memberId);
      const mainInst = member?.instrumentPrincipal || member?.instrument || '';
      const saisonInst = member?.instrumentSaison || '';
      
      const userRef = doc(db, 'users', memberId);
      const updatePayload = {
        instrumentSecondaire: newInstrument,
        instrumentsJoues: Array.from(new Set([mainInst, newInstrument, saisonInst].filter(Boolean)))
      };

      // Si c'est un instrument historique, on force le niveau à Confirmé (ou 2ème customCategory)
      if (newInstrument) {
         const confirmeCategory = customCategories.length > 1 ? customCategories[1] : (customCategories[0] || 'Confirmé');
         updatePayload[`niveauxParInstrument.${newInstrument}`] = confirmeCategory;
      }

      await updateDoc(userRef, updatePayload);
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSecondaryLevel = async (memberId, instName, newLevel) => {
    if (!instName) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        [`niveauxParInstrument.${instName}`]: newLevel
      });
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSaisonInstrument = async (memberId, newInstrument) => {
    setSaving(true);
    try {
      const member = members.find(m => m.id === memberId);
      const mainInst = member?.instrumentPrincipal || member?.instrument || '';
      const secInst = member?.instrumentSecondaire || '';
      
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        instrumentSaison: newInstrument,
        instrumentsJoues: Array.from(new Set([mainInst, secInst, newInstrument].filter(Boolean)))
      });
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSaisonLevel = async (memberId, instName, newLevel) => {
    if (!instName) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', memberId);
      await updateDoc(userRef, {
        [`niveauxParInstrument.${instName}`]: newLevel
      });
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSecoursInstrument = async (member, instrumentName) => {
    if (!instrumentName) return;
    setSaving(true);
    try {
      const currentList = member.dispoSecoursInstruments || [];
      const mainInst = member.instrumentPrincipal || member.instrument;
      
      // Migration douce depuis le vieux flag
      if (member.disponibleSecours && mainInst && !currentList.includes(mainInst)) {
        currentList.push(mainInst);
      }

      const newList = currentList.includes(instrumentName)
        ? currentList.filter(inst => inst !== instrumentName)
        : [...currentList, instrumentName];
        
      const userRef = doc(db, 'users', member.id);
      await updateDoc(userRef, { 
        dispoSecoursInstruments: newList,
        disponibleSecours: false // désactive le flag legacy
      });
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePoursuite = async (member, currentValue) => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', member.id);
      const newValue = !currentValue;
      
      const payload = { poursuiteInstrumentPrincipal: newValue };
      
      if (newValue) {
        const mainInst = member.instrumentPrincipal || member.instrument;
        if (mainInst) {
           payload.instrumentSaison = mainInst;
           payload.instrumentsJoues = Array.from(new Set([...(member.instrumentsJoues || []), mainInst]));
           const mainLevel = member.niveauMusique || member.niveau || 'aucun';
           payload[`niveauxParInstrument.${mainInst}`] = member.niveauxParInstrument?.[mainInst] || mainLevel;
        }
      } else {
        payload.instrumentSaison = '';
      }

      await updateDoc(userRef, payload);
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDanseStatusAndLevel = async (memberId, value) => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', memberId);
      let payload = {};
      if (value === 'aucun' || !value) {
        payload = { pratiqueDanse: false, niveauDanse: 'aucun' };
      } else {
        payload = { pratiqueDanse: true, niveauDanse: value };
      }
      await updateDoc(userRef, payload);
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPM = async (member) => {
    const msg = window.prompt(`Envoyer un message privé à ${member.prenom} :`);
    if (msg && msg.trim() && user?.uid) {
      try {
        await addDoc(collection(db, 'private_messages'), {
          senderId: user.uid,
          recipientId: member.id,
          content: msg.trim(),
          timestamp: new Date().toISOString(),
          read: false,
          groupId: groupId || member.groupId || ''
        });
        alert("Message envoyé !");
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'envoi.");
      }
    }
  };

  // Validation directe à 1-clic d'un vœu d'instrument par le Mestre
  const handleQuickValidate = async (memberTarget, validatedInstrument) => {
    await handleUpdateMainInstrument(memberTarget.id, validatedInstrument);
    alert(`✅ Vœu validé ! ${memberTarget.prenom || 'Le membre'} est à présent affecté(e) à ${validatedInstrument}.`);
  };

  // Exporter en CSV les affectations et vœux des membres
  const handleExportCSV = () => {
    const listToExport = filteredMembers;
    if (listToExport.length === 0) {
      alert("Aucun membre à exporter.");
      return;
    }

    const headers = [
      "Prénom",
      "Nom",
      "Surnom",
      "Disciplines",
      "Ancienneté",
      "Instrument Actuel / Validé",
      "Statut Affectation",
      "Souhait Réorientation",
      "Vœu 1",
      "Vœu 2",
      "Vœu 3",
      "Renfort Ancien Instrument"
    ];

    const rows = listToExport.map(m => {
      const prenom = (m.prenom || '').replace(/"/g, '""');
      const nom = (m.nom || '').replace(/"/g, '""');
      const surnom = (m.surnom || '').replace(/"/g, '""');

      const isPerc = isPercussionistMember(m);
      const disciplinesList = [];
      if (isPerc) disciplinesList.push("Percussion");
      if (m.pratiqueDanse) disciplinesList.push("Danse");
      const disciplinesStr = disciplinesList.join(' + ');

      const ancienneteStr = m.estAncienMembre ? 'Ancien' : 'Nouveau';

      const currentInst = (m.instrumentPrincipal || m.instrument || 'En attente').replace(/"/g, '""');
      const isAssigned = m.instrument && m.instrument.trim() !== '' && m.instrument !== 'En attente';
      const statutAffectation = isAssigned ? 'Validé' : 'En attente';

      const souhaiteChangerStr = m.souhaiteChangerInstrument ? 'Oui' : 'Non';

      const cleanVoeux = Array.isArray(m.voeuxInstruments) && m.voeuxInstruments.length > 0
        ? m.voeuxInstruments
        : [m.voeuPrincipal, m.voeuSecondaire, m.voeuTertiaire].filter(Boolean);

      const voeu1 = (cleanVoeux[0] || '').replace(/"/g, '""');
      const voeu2 = (cleanVoeux[1] || '').replace(/"/g, '""');
      const voeu3 = (cleanVoeux[2] || '').replace(/"/g, '""');

      const renfortStr = (m.volontaireAncienInstrument || m.accordRenfortAncienInstrument) ? 'Oui' : 'Non';

      return [
        `"${prenom}"`,
        `"${nom}"`,
        `"${surnom}"`,
        `"${disciplinesStr}"`,
        `"${ancienneteStr}"`,
        `"${currentInst}"`,
        `"${statutAffectation}"`,
        `"${souhaiteChangerStr}"`,
        `"${voeu1}"`,
        `"${voeu2}"`,
        `"${voeu3}"`,
        `"${renfortStr}"`
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `affectations_maracatu_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <div className="animate-spin text-2xl">⏳</div>
        <p className="text-xs font-bold text-cordel-wood uppercase tracking-wider">
          Chargement du Tableau d'Orientation & Casting...
        </p>
      </div>
    );
  }

  const unassignedCount = activeMembers.filter(m => isUnassignedForMestre(m)).length;
  const wishCount = activeMembers.filter(m => hasPendingWishForMestre(m)).length;

  return (
    <div className="flex flex-col gap-5 text-left max-w-5xl mx-auto w-full select-none">
      {/* Page Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-dashed border-cordel-master-dark/30 pb-3 gap-2">
        <div>
          <h2 className="panel-title text-xl font-extrabold tracking-wider text-cordel-wood uppercase">
            🎯 Orientation & Casting
          </h2>
          <p className="text-xs font-semibold text-cordel-master-dark/80 mt-0.5">
            Gestion des pupitres, validation des souhaits d'évolution et affectation des rôles.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="theme-stamp-badge theme-stamp-badge-wood text-[9px]">
            👥 {activeMembers.length} Actifs
          </span>
          {unassignedCount > 0 && (
            <span className="theme-stamp-badge theme-stamp-badge-ocre text-[9px] animate-pulse">
              ⚠️ {unassignedCount} À attribuer
            </span>
          )}
          {wishCount > 0 && (
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[9px]">
              ✨ {wishCount} Vœux formulés
            </span>
          )}
        </div>
      </div>

      {/* 1. Jauges des Quotas (Bandeau visuel des pupitres) */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 flex items-center justify-between">
          <span>📊 Quotas & Effectifs par Pupitre (Instruments Principaux)</span>
          <span className="text-[9px] text-cordel-master-dark/70 font-semibold normal-case">
            Calculé en temps réel sur les membres actifs
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {displayPupitres.map(pupitre => {
            const quota = quotasByPupitre[pupitre.id] || { primary: 0, secondary: 0 };
            const isLow = quota.primary === 0;
            const iconInst = pupitre.instruments[0] || pupitre.name;

            return (
              <div
                key={`quota-${pupitre.id}`}
                className={`p-2.5 rounded border flex flex-col justify-between transition-all ${
                  isLow
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-dashed border-amber-400/80 text-amber-950 dark:text-amber-200'
                    : 'bg-white/50 dark:bg-black/20 border-dashed border-cordel-master-dark/20 text-cordel-master-dark'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img
                        src={getInstrumentIconPath(iconInst)}
                        alt={pupitre.name}
                        className="w-4 h-4 object-contain shrink-0 dark:invert"
                      />
                      <span className="text-[10px] font-extrabold truncate" title={pupitre.name}>
                        {pupitre.name}
                      </span>
                    </div>
                    {pupitre.isGroup && (
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] px-1 py-0.2 shrink-0">
                        🔗 Lié
                      </span>
                    )}
                  </div>
                  {pupitre.subTitle && (
                    <span className="text-[8.5px] font-semibold text-cordel-wood block truncate mb-1" title={pupitre.subTitle}>
                      {pupitre.subTitle}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="font-black text-lg text-cordel-wood">{quota.primary}</span>
                    <span className="text-[8px] font-extrabold uppercase opacity-70">
                      princ.
                    </span>
                  </div>
                  {quota.secondary > 0 && (
                    <span className="text-[9px] font-bold text-cordel-master-dark/80 bg-white/60 dark:bg-black/30 px-1 py-0.5 rounded border border-cordel-master-dark/15">
                      +{quota.secondary} sec.
                    </span>
                  )}
                </div>

                {isLow && (
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1 block">
                    ⚠️ Effectif vide
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CordelCard>

      {/* 2. Tableau d'Affectation */}
      <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/15 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
              📋 Tableau d'Affectation
            </h3>
            {/* Filtre Tous / Vœux en attente */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setShowPendingOnly(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${!showPendingOnly ? 'bg-cordel-wood text-white shadow-xs' : 'bg-white/60 dark:bg-black/20 text-cordel-master-dark border border-cordel-master-dark/20'}`}
              >
                Tous ({activeMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setShowPendingOnly(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${showPendingOnly ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}
              >
                <span>⏳ Vœux en attente</span>
                {(unassignedCount > 0 || wishCount > 0) && (
                  <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.2 rounded-full font-black">
                    {unassignedCount + wishCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar & Export CSV button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-52">
              <input
                type="text"
                placeholder="🔍 Rechercher un membre ou vœu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="theme-input w-full text-xs py-1 px-2.5"
              />
            </div>

            <CordelButton
              type="button"
              variant="wood"
              onClick={handleExportCSV}
              className="text-[10px] py-1 px-2.5 shrink-0 flex items-center gap-1 font-bold shadow-xs cursor-pointer"
              title="Exporter les affectations et vœux au format CSV (Excel)"
            >
              <span>📥 Exporter (CSV)</span>
            </CordelButton>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-dashed border-cordel-master-dark/20 text-[9.5px] uppercase tracking-wider font-extrabold text-cordel-wood">
                <th className="py-2 px-2">Membre</th>
                <th className="py-2 px-2">Inst. Maîtrisé (Historique)</th>
                <th className="py-2 px-2">Orientation Saison & Vœux</th>
                <th className="py-2 px-2 text-right">Danse & Niveau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dashed divide-cordel-master-dark/15">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs font-bold text-cordel-master-dark/60 italic">
                    Aucun membre ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                   const name = `${m.prenom || ''} ${m.nom || ''}`.trim() || 'Sans Nom';
                  const isPercussionist = isPercussionistMember(m);
                  const isUnassigned = isPercussionist && isUnassignedForMestre(m);
                  
                  const mainInst = m.instrumentPrincipal || m.instrument;
                  const isLegacySecours = m.disponibleSecours && !m.dispoSecoursInstruments;
                  const isDispoMain = (m.dispoSecoursInstruments || []).includes(mainInst) || isLegacySecours;
                  const isAssigned = isPercussionist && !isUnassigned;
                  const wishesList = Array.isArray(m.voeuxInstruments) && m.voeuxInstruments.length > 0
                    ? m.voeuxInstruments.filter(w => w && !w.toLowerCase().includes('danse'))
                    : [m.voeuPrincipal, m.voeuSecondaire, m.voeuTertiaire].filter(w => w && !w.toLowerCase().includes('danse'));
                  const hasWishes = isPercussionist && wishesList.length > 0;

                  return (
                    <tr
                      key={`member-row-${m.id}`}
                      className={`hover:bg-cordel-bg-light/80 transition-colors border-b border-dashed border-cordel-master-dark/10 ${
                        isUnassigned
                          ? 'bg-amber-100/40 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                          : 'bg-white/40 dark:bg-black/10'
                      }`}
                    >
                      {/* 1. Nom / Avatar & MP */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2.5">
                          <XiloAvatar src={m.photoURL} name={name} size={36} />
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-cordel-master-dark flex items-center gap-1 flex-wrap">
                              {name}
                              <button
                                type="button"
                                onClick={() => handleSendPM(m)}
                                className="text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-1 py-0.5 rounded flex items-center gap-0.5 transition-colors cursor-pointer ml-1"
                                title={`Envoyer un message privé à ${m.prenom}`}
                              >
                                ✉️ MP
                              </button>
                            </span>
                            {m.surnom && (
                              <span className="text-[10px] font-semibold text-cordel-wood italic">
                                "{m.surnom}"
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Instrument Maîtrisé & Secours */}
                      <td className="py-2.5 px-2">
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">Inst. Principal</span>
                            <div className="flex items-center gap-1">
                              <select
                                value={(m.instrumentPrincipal || m.instrument) && (m.instrumentPrincipal || m.instrument) !== 'En attente' ? (m.instrumentPrincipal || m.instrument) : ''}
                                onChange={(e) => handleUpdateMainInstrument(m.id, e.target.value)}
                                disabled={saving}
                                className="theme-input text-[10px] py-1 bg-white w-[110px] font-bold"
                              >
                                <option value="">-- Aucun --</option>
                                {filterPublicPercussionInstruments(instrumentsDisponibles || []).map(inst => (
                                  <option key={`main-${inst}`} value={inst}>{inst}</option>
                                ))}
                              </select>
                              
                              {(m.instrumentPrincipal || m.instrument) && (m.instrumentPrincipal || m.instrument) !== 'En attente' && (
                                <select
                                  value={m.niveauMusique || m.niveau || 'aucun'}
                                  onChange={(e) => handleUpdateMainLevel(m.id, e.target.value)}
                                  disabled={saving}
                                  className="theme-input text-[10px] py-1 bg-white max-w-[80px]"
                                >
                                  <option value="aucun">- Niv. -</option>
                                  {customCategories.map(cat => (
                                    <option key={`cat-${cat}`} value={cat}>{resolveCategory(cat, customCategories)}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            
                            {/* Secours Main Inst */}
                            {mainInst && mainInst !== 'En attente' && mainInst.toLowerCase() !== 'danse' && (
                              <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity w-max">
                                <input
                                  type="checkbox"
                                  checked={isDispoMain}
                                  onChange={() => handleToggleSecoursInstrument(m, mainInst)}
                                  disabled={saving}
                                  className="w-2.5 h-2.5 accent-cordel-wood cursor-pointer"
                                />
                                <span className="text-[9px] font-semibold text-cordel-master-dark/70 uppercase">
                                  Dispo en secours
                                </span>
                              </label>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/10">
                            <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">2ème Inst. Historique</span>
                            <div className="flex items-center gap-1">
                              <select
                                value={m.instrumentSecondaire && m.instrumentSecondaire !== 'En attente' ? m.instrumentSecondaire : ''}
                                onChange={(e) => handleUpdateSecondaryInstrument(m.id, e.target.value)}
                                disabled={saving}
                                className="theme-input text-[10px] py-1 bg-white w-[110px]"
                              >
                                <option value="">-- Aucun --</option>
                                {filterPublicPercussionInstruments(instrumentsDisponibles || []).map(inst => (
                                  <option key={`sec-hist-${inst}`} value={inst}>{inst}</option>
                                ))}
                              </select>
                              {m.instrumentSecondaire && m.instrumentSecondaire !== 'En attente' && (
                                <select
                                  value={m.niveauxParInstrument?.[m.instrumentSecondaire] || 'aucun'}
                                  onChange={(e) => handleUpdateSecondaryLevel(m.id, m.instrumentSecondaire, e.target.value)}
                                  disabled={saving}
                                  className="theme-input text-[10px] py-1 bg-white max-w-[80px]"
                                >
                                  <option value="aucun">- Niv. -</option>
                                  {customCategories.map(cat => (
                                    <option key={`cat-sec-${cat}`} value={cat}>{resolveCategory(cat, customCategories)}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Secours 2nd Historic */}
                            {m.instrumentSecondaire && m.instrumentSecondaire !== 'En attente' && m.instrumentSecondaire.toLowerCase() !== 'danse' && (
                              <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity w-max">
                                <input
                                  type="checkbox"
                                  checked={(m.dispoSecoursInstruments || []).includes(m.instrumentSecondaire)}
                                  onChange={() => handleToggleSecoursInstrument(m, m.instrumentSecondaire)}
                                  disabled={saving}
                                  className="w-2.5 h-2.5 accent-cordel-wood cursor-pointer"
                                />
                                <span className="text-[9px] font-semibold text-cordel-master-dark/70 uppercase">
                                  Dispo en secours
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Vœux & Deuxième Instrument */}
                      <td className="py-2.5 px-2">
                        <div className="flex flex-col gap-2 items-start">
                          {hasWishes || m.souhaiteChangerInstrument ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">
                                Vœux actuels :
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {wishesList.map((wish, idx) => (
                                  <button
                                    key={`${wish}-${idx}`}
                                    type="button"
                                    onClick={() => handleQuickValidate(m, wish)}
                                    disabled={saving}
                                    className="text-[10px] font-bold bg-white/70 dark:bg-black/20 border border-cordel-wood/40 hover:bg-cordel-wood hover:text-white transition-all px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 shadow-xs"
                                    title={`Valider et affecter à ${wish}`}
                                  >
                                    <span className="text-[8px] font-black opacity-60">V{idx + 1}</span>
                                    {wish}
                                  </button>
                                ))}
                                {wishesList.length === 0 && m.souhaiteChangerInstrument && (
                                  <span className="text-[10px] italic text-cordel-master-dark/60 font-semibold">
                                    Souhaite changer
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            mainInst && mainInst !== 'En attente' && mainInst.toLowerCase() !== 'danse' ? (
                              <div className="flex flex-col gap-0.5 mb-1">
                                <label className="flex items-center gap-1.5 cursor-pointer opacity-90 hover:opacity-100 transition-opacity w-max bg-black/5 dark:bg-white/5 px-2 py-1 rounded border border-cordel-master-dark/10">
                                  <input
                                    type="checkbox"
                                    checked={m.poursuiteInstrumentPrincipal !== false}
                                    onChange={() => handleTogglePoursuite(m, m.poursuiteInstrumentPrincipal !== false)}
                                    disabled={saving}
                                    className="w-3 h-3 accent-cordel-wood cursor-pointer"
                                  />
                                  <span className="text-[10px] font-bold text-cordel-master-dark/80">
                                    🔄 Poursuite ({mainInst})
                                  </span>
                                </label>
                              </div>
                            ) : null
                          )}

                          {!(m.poursuiteInstrumentPrincipal !== false && mainInst && mainInst !== 'En attente' && mainInst.toLowerCase() !== 'danse' && !hasWishes && !m.souhaiteChangerInstrument) && (
                            <div className="flex flex-col gap-1 pt-1 border-t border-dashed border-cordel-master-dark/20 w-full max-w-[180px]">
                              <span className="text-[9px] font-black uppercase text-cordel-master-dark opacity-60">
                                Apprentissage Saison :
                              </span>
                              <select
                                value={m.instrumentSaison || ''}
                                onChange={(e) => handleUpdateSaisonInstrument(m.id, e.target.value)}
                                disabled={saving}
                                className="theme-input text-[10px] py-1 bg-white w-full"
                              >
                                <option value="">-- Aucun --</option>
                                {filterPublicPercussionInstruments(instrumentsDisponibles || []).map(inst => (
                                  <option key={`saison-${inst}`} value={inst}>{inst}</option>
                                ))}
                              </select>
                              
                              {m.instrumentSaison && (
                                <select
                                  value={m.niveauxParInstrument?.[m.instrumentSaison] || 'aucun'}
                                  onChange={(e) => handleUpdateSaisonLevel(m.id, m.instrumentSaison, e.target.value)}
                                  disabled={saving}
                                  className="theme-input text-[10px] py-0.5 bg-white w-full text-cordel-master-dark/80"
                                >
                                  <option value="aucun">-- Niveau --</option>
                                  {customCategories.map(cat => (
                                    <option key={`saison-cat-${cat}`} value={cat}>{resolveCategory(cat, customCategories)}</option>
                                  ))}
                                </select>
                              )}

                              {/* Secours Apprentissage */}
                              {m.instrumentSaison && m.instrumentSaison.toLowerCase() !== 'danse' && (
                                <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity w-max">
                                  <input
                                    type="checkbox"
                                    checked={(m.dispoSecoursInstruments || []).includes(m.instrumentSaison)}
                                    onChange={() => handleToggleSecoursInstrument(m, m.instrumentSaison)}
                                    disabled={saving}
                                    className="w-2.5 h-2.5 accent-cordel-wood cursor-pointer"
                                  />
                                  <span className="text-[9px] font-semibold text-cordel-master-dark/70 uppercase">
                                    Dispo en secours
                                  </span>
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Danse & Niveau */}
                      <td className="py-2.5 px-2 text-right">
                        <select
                          value={m.pratiqueDanse ? (m.niveauDanse && m.niveauDanse !== 'aucun' ? m.niveauDanse : 'debutant') : 'aucun'}
                          onChange={(e) => handleUpdateDanseStatusAndLevel(m.id, e.target.value)}
                          disabled={saving}
                          className="theme-input text-[10px] py-1 bg-white font-bold text-amber-900 border-amber-300"
                        >
                          <option value="aucun">Non inscrit(e)</option>
                          <option value="debutant">💃 Débutant</option>
                          {customCategories.filter(cat => cat.toLowerCase().replace(/é/g, 'e') !== 'debutant').map(cat => (
                            <option key={`danse-${cat}`} value={cat}>💃 {resolveCategory(cat, customCategories)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CordelCard>
    </div>
  );
}
