import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc, serverTimestamp, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import EventCreateForm from '../agenda/EventCreateForm';
import { useTranslation } from '../LanguageContext';

/**
 * Modale d'intégration directe du formulaire officiel de création d'événement de l'Agenda (EventCreateForm)
 * pré-rempli depuis un dossier de prestation du Pôle Diffusion avec bouclier anti-doublon.
 */
export default function GigEventCreateModal({
  isOpen,
  onClose,
  gig,
  groupId,
  onSuccess
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [adresseLocal, setAdresseLocal] = useState('');
  const [lieuxImportants, setLieuxImportants] = useState([]);
  const [defaultLocationsByEventType, setDefaultLocationsByEventType] = useState({});
  const [associationEventTypes, setAssociationEventTypes] = useState(['prestation', 'repetition', 'stage', 'atelier', 'reunion']);
  const [eventTypeConfigs, setEventTypeConfigs] = useState({});
  const [dressCodes, setDressCodes] = useState([]);

  // État du bouclier anti-doublon
  const [existingEventId, setExistingEventId] = useState(gig?.eventId || null);
  const [checkingExisting, setCheckingExisting] = useState(false);

  // Détection d'un événement existant pour éviter les doublons
  useEffect(() => {
    if (!isOpen || !gig) return;

    if (gig.eventId) {
      setExistingEventId(gig.eventId);
      return;
    }

    let isMounted = true;
    const checkExistingEvent = async () => {
      if (!gig.id) return;
      setCheckingExisting(true);
      try {
        const eventsRef = collection(db, 'events');
        const q1 = query(eventsRef, where('gigId', '==', gig.id));
        const snap1 = await getDocs(q1);
        if (!snap1.empty && isMounted) {
          const foundId = snap1.docs[0].id;
          setExistingEventId(foundId);
          // Raccordement rétroactif sur le document gigs_pipeline
          await updateDoc(doc(db, 'gigs_pipeline', gig.id), { eventId: foundId });
          return;
        }

        const q2 = query(eventsRef, where('createdFromGigId', '==', gig.id));
        const snap2 = await getDocs(q2);
        if (!snap2.empty && isMounted) {
          const foundId = snap2.docs[0].id;
          setExistingEventId(foundId);
          // Raccordement rétroactif sur le document gigs_pipeline
          await updateDoc(doc(db, 'gigs_pipeline', gig.id), { eventId: foundId });
        }
      } catch (err) {
        console.warn("GigEventCreateModal - Erreur détection doublon :", err);
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    };

    checkExistingEvent();
    return () => { isMounted = false; };
  }, [gig?.id, gig?.eventId, isOpen]);

  // Chargement de la configuration de l'association pour EventCreateForm
  useEffect(() => {
    if (!groupId) return;
    const assocRef = doc(db, 'associations', groupId);
    const unsub = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdresseLocal(data.adresseLocal || '');
        setLieuxImportants(Array.isArray(data.lieuxImportants) ? data.lieuxImportants : []);
        setDefaultLocationsByEventType(data.defaultLocationsByEventType || {});
        setEventTypeConfigs(data.eventTypeConfigs || {});
        if (Array.isArray(data.eventTypes) && data.eventTypes.length > 0) {
          setAssociationEventTypes(data.eventTypes);
        }
        setDressCodes(data.dressCodes || []);
      }
    });
    return () => unsub();
  }, [groupId]);

  // État du formulaire Agenda pré-rempli
  const [formData, setFormData] = useState({
    titre: '',
    type: 'prestation',
    date: '',
    dateFin: '',
    lieu: '',
    horairesPassages: '',
    horaireCovoiturage: '',
    niveauRequis: 'tous',
    niveauDanseRequis: 'aucun',
    lienDocument: '',
    distanceAllerRetourKm: '',
    lienSocial: '',
    imageUrl: '',
    requiresValidation: false,
    montantRecette: '',
    montantDepense: '',
    budgetRecettes: [],
    budgetDepenses: [],
    dateLimiteInscription: '',
    includesPercussion: false,
    includesDance: false,
    enableCarpool: true,
    description: '',
    status: 'a_confirmer',
    isOption: true,
    isPublic: false
  });

  // Pré-remplissage dynamique sélectif lors de l'ouverture
  useEffect(() => {
    if (gig) {
      const budgetVal = parseFloat(gig.amount) || 0;

      // Concaténation des horaires logistiques s'ils existent sur la prestation
      const horairesParts = [];
      if (gig.heureArrivee) horairesParts.push(`Arrivée: ${gig.heureArrivee}`);
      if (gig.heureBalances) horairesParts.push(`Balances: ${gig.heureBalances}`);
      if (gig.heurePassage) horairesParts.push(`Passage: ${gig.heurePassage}`);
      const horairesStr = horairesParts.join(' | ');

      setFormData({
        titre: `[OPTION] - ${gig.eventName || ''}`,
        type: 'prestation',
        date: gig.date || new Date().toISOString().split('T')[0],
        dateFin: '',
        lieu: gig.location || '',
        horairesPassages: horairesStr,
        horaireCovoiturage: '',
        niveauRequis: 'tous',
        niveauDanseRequis: 'aucun',
        lienDocument: '',
        distanceAllerRetourKm: '',
        lienSocial: '',
        imageUrl: '',
        requiresValidation: false,
        montantRecette: budgetVal ? String(budgetVal) : '',
        montantDepense: '',
        budgetRecettes: budgetVal > 0 ? [{ id: '1', libelle: 'Cachet prestation', montant: budgetVal }] : [],
        budgetDepenses: [],
        dateLimiteInscription: '',
        includesPercussion: false,
        includesDance: false,
        enableCarpool: true,
        description: '', // Laissé sciemment vide pour confidentialité des contacts
        status: 'a_confirmer', // Statut positionné par défaut sur "À confirmer"
        isOption: true,
        isPublic: false // Décoché par défaut pour rester interne
      });
    }
  }, [gig, isOpen]);

  if (!isOpen || !gig) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!groupId) {
      alert("Erreur : Aucun groupe n'est sélectionné.");
      return;
    }
    if (!formData.titre.trim()) {
      alert("Veuillez saisir un titre d'événement.");
      return;
    }
    if (!formData.date) {
      alert("Veuillez spécifier la date de l'événement.");
      return;
    }

    setSaving(true);
    try {
      const budgetAmount = parseFloat(formData.montantRecette) || 0;

      // 1. Enregistrement de l'événement dans la collection `events`
      const newEventDoc = {
        groupId: gig.groupId || groupId,
        titre: formData.titre.trim(),
        type: formData.type || 'prestation',
        date: formData.date,
        dateFin: formData.dateFin || '',
        lieu: formData.lieu?.trim() || '',
        horairesPassages: formData.horairesPassages?.trim() || '',
        horaireCovoiturage: formData.horaireCovoiturage?.trim() || '',
        niveauRequis: formData.niveauRequis || 'tous',
        niveauDanseRequis: formData.niveauDanseRequis || 'aucun',
        lienDocument: formData.lienDocument?.trim() || '',
        distanceAllerRetourKm: parseFloat(formData.distanceAllerRetourKm) || 0,
        status: formData.status || 'a_confirmer',
        isOption: true,
        isPublic: Boolean(formData.isPublic),
        montantRecette: budgetAmount,
        budgetRecettes: Array.isArray(formData.budgetRecettes) ? formData.budgetRecettes : [],
        budgetDepenses: Array.isArray(formData.budgetDepenses) ? formData.budgetDepenses : [],
        dateLimiteInscription: formData.dateLimiteInscription || '',
        description: formData.description?.trim() || '',
        inscriptions: [],
        gigId: gig.id,
        createdFromGigId: gig.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'events'), newEventDoc);

      // 2. Passage automatique du dossier de prestation au statut 2_option et mémorisation de eventId
      const gigRef = doc(db, 'gigs_pipeline', gig.id);
      await updateDoc(gigRef, {
        eventId: docRef.id,
        status: '2_option',
        updatedAt: serverTimestamp()
      });

      setExistingEventId(docRef.id);

      // 3. Notification & fermeture
      if (onSuccess) {
        onSuccess(gig.id);
      }
      onClose();
    } catch (err) {
      console.error("GigEventCreateModal - Erreur création événement dans events :", err);
      alert("Erreur lors de l'enregistrement de l'événement dans l'Agenda.");
    } finally {
      setSaving(false);
    }
  };

  const createConfig = {
    agendaEnableCarpool: true,
    agendaEnableInscriptions: true,
    agendaEnableFinance: true,
    agendaEnableAdresse: true,
    agendaEnableOrdreDuJour: true,
    agendaEnableRecurrence: false
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={(e) => e.key === 'Escape' && !saving && onClose()}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none outline-none animate-fade-in"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-2xl border-2 border-cordel-master-dark/40 overflow-hidden text-left">
        {/* 1. Header (Fixe) */}
        <div className="flex-shrink-0 p-4 border-b border-dashed border-cordel-master-dark/20 flex justify-between items-center bg-white">
          <h3 className="text-sm sm:text-base font-extrabold uppercase text-cordel-wood flex items-center gap-2">
            <span>📅 Poser une option dans l'Agenda (Événement)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-stone-400 hover:text-stone-800 font-bold text-lg cursor-pointer"
            title="Fermer (Échap)"
          >
            ✕
          </button>
        </div>

        {/* 2. Body (Défilable verticalement) */}
        <div className="flex-1 overflow-y-auto p-4">
          {existingEventId ? (
            /* Bouclier Anti-Doublon : Affichage du bandeau préventif */
            <div className="flex flex-col items-center justify-center p-8 bg-amber-50/90 border-2 border-amber-400 rounded-lg text-center gap-4 my-6">
              <div className="text-4xl">⚠️</div>
              <div className="flex flex-col gap-1 max-w-lg">
                <h4 className="text-base font-black uppercase text-amber-950">
                  Option déjà posée dans l'Agenda
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Une option est déjà enregistrée dans le Registre des dates pour ce dossier de prestation (Identifiant événement : <span className="font-mono font-bold text-amber-950">{existingEventId}</span>).
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <CordelButton
                  type="button"
                  variant="ocre"
                  onClick={() => {
                    onClose();
                    alert(`Option d'agenda active (ID: ${existingEventId}). Vous pouvez consulter et modifier cet événement directement dans l'onglet Agenda.`);
                  }}
                  className="text-xs font-black uppercase flex items-center gap-1.5"
                >
                  <span>📅</span>
                  <span>Une option est déjà posée dans l'agenda. Voir l'événement ➜</span>
                </CordelButton>
                <CordelButton type="button" variant="default" onClick={onClose} className="text-xs">
                  Fermer
                </CordelButton>
              </div>
            </div>
          ) : checkingExisting ? (
            <div className="py-16 text-center text-xs font-bold text-stone-400 uppercase tracking-widest animate-pulse">
              ⏳ Vérification de l'existence d'une option agenda...
            </div>
          ) : (
            <EventCreateForm
              formData={formData}
              setFormData={setFormData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              handleCloseForm={onClose}
              saving={saving}
              dressCodes={dressCodes}
              createConfig={createConfig}
              rawCreateConfig={eventTypeConfigs}
              associationEventTypes={associationEventTypes}
              adresseLocal={adresseLocal}
              lieuxImportants={lieuxImportants}
              defaultLocationsByEventType={defaultLocationsByEventType}
              eventTypeConfigs={eventTypeConfigs}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

