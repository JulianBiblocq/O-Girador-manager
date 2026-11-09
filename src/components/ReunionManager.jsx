import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import EventReportSection from './event-details/EventReportSection';
import ImportAgendaModal from './agenda/ImportAgendaModal';
import ReunionCreationFormCard from './agenda/ReunionCreationFormCard';
import { useTranslation } from './LanguageContext';
import { XiloCalendar } from './XiloIcons';
import { checkAndExecuteAutoValidation } from '../utils/reportPublicationUtils';
import { getEffectiveMemberTags, isMemberCaOrBureau } from '../utils/memberUtils';
import { canManageReunions } from '../utils/permissionUtils';
import { notifyNewAgendaEventOrPoll } from '../utils/agendaNotificationUtils';
import { canUserSeeReunionInAgenda } from '../utils/reunionPrivacyUtils';
import ReunionPrivacyBadge from './agenda/ReunionPrivacyBadge';

/**
 * Composant de gestion des Réunions dans le Studio / Gouvernance.
 * Permet de planifier des réunions à date fixe ou des sondages de dates multi-créneaux,
 * de préparer l'Ordre du Jour (saisie directe ou import de modèle) et de gérer le compte-rendu.
 */
export default function ReunionManager({ groupId, user, profileData, onBack }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');

  // Mode de création : 'date' (date fixe) ou 'poll' (sondage multi-dates)
  const [creationMode, setCreationMode] = useState('date');
  
  // Portée & Confidentialité de la réunion (Groupe convoqué, Mode de visibilité, Masquage ODJ/CR)
  const [audience, setAudience] = useState('publique');
  const [targetGroup, setTargetGroup] = useState('all');
  const [reunionPrivacyMode, setReunionPrivacyMode] = useState('public');
  const [hideAgendaFromNonTarget, setHideAgendaFromNonTarget] = useState(false);
  const [tagsDisponibles, setTagsDisponibles] = useState([]);

  // Champs généraux de création
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timeEnd, setTimeEnd] = useState('');

  // Créneaux de sondage (multi-dates)
  const [pollSlots, setPollSlots] = useState([
    { date: '', timeStart: '19:00', timeEnd: '21:00' },
    { date: '', timeStart: '19:00', timeEnd: '21:00' }
  ]);
  const [pollRestrictionType, setPollRestrictionType] = useState('aucun');
  const [pollTarget, setPollTarget] = useState('');

  // Ordre du jour de la réunion
  const [pointsOrdreDuJour, setPointsOrdreDuJour] = useState([]);
  const [newPointTitle, setNewPointTitle] = useState('');
  // Lieu et document de la réunion
  const [lieu, setLieu] = useState('Salle de réunion / En ligne');
  const [lieuId, setLieuId] = useState(null);
  const [lieuxImportants, setLieuxImportants] = useState([]);
  const [lienDocument, setLienDocument] = useState('');
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin =
    profileData?.role === 'mestre' ||
    profileData?.role === 'super-admin' ||
    profileData?.role === 'secretaire' ||
    profileData?.isSystemAdmin === true ||
    isMemberCaOrBureau(profileData) ||
    canManageReunions(profileData, null, getEffectiveMemberTags(profileData));

  // Chargement en temps réel des événements de type réunion
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('groupId', '==', groupId), where('type', '==', 'reunion'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetched = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Trier par date décroissante
      fetched.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(fetched);
      setLoading(false);

      // Fallback Frontend : Auto-validation à J+7 des comptes-rendus échus sans opposition
      fetched.forEach((ev) => {
        if (ev.compteRenduStatus === 'attente_relecture' && ev.autoValidateAfter7Days && ev.compteRenduAutoValidateAt) {
          checkAndExecuteAutoValidation(ev);
        }
      });
    }, (error) => {
      console.error("ReunionManager - Erreur lors de la récupération des réunions :", error);
      setLoading(false);
    });

    // Chargement des lieux importants et lieu par défaut de l'association
    const assocRef = doc(db, 'associations', groupId);
    const unsubscribeAssoc = onSnapshot(assocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const lieux = Array.isArray(data.lieuxImportants) ? data.lieuxImportants : [];
        setLieuxImportants(lieux);
        setTagsDisponibles(Array.isArray(data.tagsDisponibles) ? data.tagsDisponibles : []);

        // Pré-remplissage automatique du lieu par défaut pour les réunions si configuré
        const defaultLieuId = data.defaultLocationsByEventType?.reunion;
        if (defaultLieuId) {
          const foundLieu = lieux.find(l => l.id === defaultLieuId);
          if (foundLieu) {
            const fullLocationText = foundLieu.nom && foundLieu.adresse ? `${foundLieu.nom} - ${foundLieu.adresse}` : (foundLieu.adresse || foundLieu.nom);
            setLieu(fullLocationText);
          }
        }
      }
    }, (err) => {
      console.warn("ReunionManager - Erreur lecture paramètres association :", err);
    });

    return () => {
      unsubscribe();
      unsubscribeAssoc();
    };
  }, [groupId]);

  // Ajouter un créneau au sondage
  const handleAddPollSlot = () => {
    setPollSlots(prev => [...prev, { date: '', timeStart: '19:00', timeEnd: '21:00' }]);
  };

  // Retirer un créneau du sondage
  const handleRemovePollSlot = (index) => {
    if (pollSlots.length <= 2) return;
    setPollSlots(prev => prev.filter((_, i) => i !== index));
  };

  // Modifier un créneau du sondage
  const handlePollSlotChange = (index, field, value) => {
    setPollSlots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Ajouter manuellement un point à l'ordre du jour
  const handleAddAgendaPoint = (e) => {
    e.preventDefault();
    if (!newPointTitle.trim()) return;
    setPointsOrdreDuJour(prev => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), titre: newPointTitle.trim(), notesCR: '' }
    ]);
    setNewPointTitle('');
  };

  // Création de la réunion ou du sondage
  const handleCreateReunion = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (creationMode === 'date' && (!date || !time)) {
      alert("Veuillez indiquer le jour et l'heure de la réunion.");
      return;
    }

    if (creationMode === 'poll') {
      const validSlots = pollSlots.filter(s => s.date && s.timeStart);
      if (validSlots.length < 2) {
        alert("Un sondage de réunion nécessite au moins 2 créneaux valides.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (creationMode === 'poll') {
        const validSlots = pollSlots.filter(s => s.date && s.timeStart);
        const pollGroupId = `poll_reunion_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let firstCreatedEventId = null;

        for (let i = 0; i < validSlots.length; i++) {
          const slot = validSlots[i];
          const dateTimeStartStr = `${slot.date}T${slot.timeStart}:00`;
          const dateTimeEndStr = slot.timeEnd ? `${slot.date}T${slot.timeEnd}:00` : '';

          const newEventDoc = {
            titre: title.trim(),
            date: dateTimeStartStr,
            dateFin: dateTimeEndStr,
            type: 'reunion',
            status: 'sondage',
            pollGroupId: pollGroupId,
            optionIndex: i + 1,
            totalOptions: validSlots.length,
            pollRestrictionType: pollRestrictionType || 'aucun',
            pollTarget: pollTarget || '',
            groupId: groupId,
            audience: audience,
            portee: audience,
            targetGroup: targetGroup || 'all',
            reunionPrivacyMode: reunionPrivacyMode || 'public',
            hideAgendaFromNonTarget: Boolean(hideAgendaFromNonTarget),
            pointsOrdreDuJour: pointsOrdreDuJour,
            lienDocument: (lienDocument || '').trim(),
            sendPushNotification: sendPushNotification !== false,
            clientNotified: true,
            compteRenduStatus: 'brouillon',
            compteRenduApprovals: {},
            autoValidateAfter7Days: false,
            compteRenduAutoValidateAt: null,
            compteRenduValidationMode: 'all_presents',
            compteRenduValidationTags: [],
            compteRenduValidators: [],
            suggestionsOrdreDuJour: [],
            inscriptions: [],
            lieu: (lieu || '').trim() || 'Salle de réunion / En ligne',
            lieuSimple: (lieu || '').trim() || 'Salle de réunion / En ligne',
            lieuId: lieuId || null
          };
          const createdRef = await addDoc(collection(db, 'events'), newEventDoc);
          if (i === 0) firstCreatedEventId = createdRef.id;
        }
        if (firstCreatedEventId) {
          await notifyNewAgendaEventOrPoll({
            groupId,
            creatorId: user?.uid,
            titre: title.trim(),
            isPoll: true,
            validDatesCount: validSlots.length,
            firstCreatedEventId,
            audience,
            targetGroup,
            reunionPrivacyMode,
            hideAgendaFromNonTarget,
            pollRestrictionType: pollRestrictionType === 'tag' ? 'badge' : pollRestrictionType,
            pollTarget,
            sendPush: sendPushNotification !== false
          });
        }
        alert(`Sondage de réunion créé avec succès ! (${validSlots.length} créneaux générés dans l'Agenda)`);
      } else {
        const dateTimeStartStr = `${date}T${time}:00`;
        const dateTimeEndStr = timeEnd ? `${date}T${timeEnd}:00` : '';

        const newEventDoc = {
          titre: title.trim(),
          date: dateTimeStartStr,
          dateFin: dateTimeEndStr,
          type: 'reunion',
          groupId: groupId,
          audience: audience,
          portee: audience,
          targetGroup: targetGroup || 'all',
          reunionPrivacyMode: reunionPrivacyMode || 'public',
          hideAgendaFromNonTarget: Boolean(hideAgendaFromNonTarget),
          pointsOrdreDuJour: pointsOrdreDuJour,
          lienDocument: (lienDocument || '').trim(),
          sendPushNotification: sendPushNotification !== false,
          clientNotified: true,
          compteRenduStatus: 'brouillon',
          compteRenduApprovals: {},
          autoValidateAfter7Days: false,
          compteRenduAutoValidateAt: null,
          compteRenduValidationMode: 'all_presents',
          compteRenduValidationTags: [],
          compteRenduValidators: [],
          suggestionsOrdreDuJour: [],
          inscriptions: [],
          lieu: (lieu || '').trim() || 'Salle de réunion / En ligne',
          lieuSimple: (lieu || '').trim() || 'Salle de réunion / En ligne',
          lieuId: lieuId || null
        };
        const docRef = await addDoc(collection(db, 'events'), newEventDoc);
        if (docRef?.id) {
          await notifyNewAgendaEventOrPoll({
            groupId,
            creatorId: user?.uid,
            titre: title.trim(),
            isPoll: false,
            dateStr: dateTimeStartStr,
            firstCreatedEventId: docRef.id,
            audience,
            targetGroup,
            reunionPrivacyMode,
            hideAgendaFromNonTarget,
            sendPush: sendPushNotification !== false
          });
        }
        setSelectedEventId(docRef.id);
        alert("Réunion créée avec succès !");
      }

      // Réinitialisation du formulaire
      setTitle('');
      setDate('');
      setTime('');
      setTimeEnd('');
      setAudience('publique');
      setTargetGroup('all');
      setReunionPrivacyMode('public');
      setHideAgendaFromNonTarget(false);
      setPointsOrdreDuJour([]);
      setLienDocument('');
      setSendPushNotification(true);
      setLieuId(null);
      setPollSlots([
        { date: '', timeStart: '19:00', timeEnd: '21:00' },
        { date: '', timeStart: '19:00', timeEnd: '21:00' }
      ]);
    } catch (err) {
      console.error("ReunionManager - Erreur lors de la création de la réunion :", err);
      alert("Erreur lors de la création de la réunion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (eventObj) => {
    if (eventObj?.status === 'sondage') {
      return (
        <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] bg-amber-100 border-amber-600 text-amber-900 font-bold">
          📊 SONDAGE ({eventObj.optionIndex || 1}/{eventObj.totalOptions || 1})
        </span>
      );
    }

    const crStatus = eventObj?.compteRenduStatus;
    switch (crStatus) {
      case 'publie':
        return <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px]">📜 ARCHIVÉ</span>;
      case 'attente_relecture':
        return (
          <div className="flex flex-col gap-0.5">
            <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] animate-pulse">⏳ RELECTURE</span>
            {Array.isArray(eventObj.compteRenduValidators) && eventObj.compteRenduValidators.length > 0 && (
              <span className="text-[7.5px] font-bold text-stone-600">
                👥 {eventObj.compteRenduValidators.length} validateur{eventObj.compteRenduValidators.length > 1 ? 's' : ''}
              </span>
            )}
            {eventObj.autoValidateAfter7Days && eventObj.compteRenduAutoValidateAt && (
              <span className="text-[7.5px] font-bold text-amber-800">
                ⏳ Auto le {new Date(eventObj.compteRenduAutoValidateAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
          </div>
        );
      default:
        return <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] opacity-75">✏️ BROUILLON</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${formattedDate} à ${hours}h${minutes}`;
  };

  const visibleEvents = events.filter((ev) =>
    canUserSeeReunionInAgenda(ev, profileData, getEffectiveMemberTags(profileData))
  );
  const selectedEvent = visibleEvents.find(e => e.id === selectedEventId);

  return (
    <div className="flex flex-col gap-4 text-left select-none w-full max-w-none">
      {/* Header Navigation */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30 flex-wrap gap-2 w-full">
        <button 
          type="button" 
          onClick={selectedEventId ? () => setSelectedEventId('') : onBack} 
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
        >
          ⬅️ {selectedEventId ? "Liste des réunions" : t('common.back') || "Retour"}
        </button>
        
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
            <XiloCalendar size={16} /> {t('governance.studioTitle')}
          </h2>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEventId('');
                  const formEl = document.getElementById('meeting-form-section');
                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 bg-[var(--color-cordel-vert)] text-white rounded border border-encre-noire shadow-2xs hover:brightness-110 cursor-pointer"
              >
                ➕ {t('governance.btnNewMeeting')}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedEventId('');
                const tableEl = document.getElementById('meetings-studio-table');
                if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 bg-amber-100 text-amber-900 rounded border border-amber-800/40 shadow-2xs hover:bg-amber-200 cursor-pointer"
            >
              📜 {t('governance.btnReportsArchives')}
            </button>
          </div>
        </div>
      </div>

      {selectedEventId && selectedEvent ? (
        /* Vue détaillée / Éditeur de compte-rendu */
        <div className="flex flex-col gap-4 w-full">
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light/30 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-encre-noire">
                📅 {selectedEvent.titre}
              </h3>
              <p className="text-[10px] font-bold text-cordel-wood uppercase mt-1">
                {formatDate(selectedEvent.date)}
              </p>
            </div>
            <ReunionPrivacyBadge event={selectedEvent} tagsDisponibles={tagsDisponibles} showPublic={true} />
          </CordelCard>
          
          <EventReportSection 
            event={selectedEvent} 
            user={user} 
            profileData={profileData} 
          />
        </div>
      ) : (
        /* Vue Liste + Formulaire de Création (40% gauche / 60% droite sur Desktop) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          
          {/* Formulaire de création avancée compacté (40% = 5/12 colonnes) */}
          {isAdmin && (
            <div className="lg:col-span-5 min-w-0 w-full" id="meeting-form-section">
              <ReunionCreationFormCard
                creationMode={creationMode}
                setCreationMode={setCreationMode}
                title={title}
                setTitle={setTitle}
                audience={audience}
                setAudience={setAudience}
                targetGroup={targetGroup}
                setTargetGroup={setTargetGroup}
                reunionPrivacyMode={reunionPrivacyMode}
                setReunionPrivacyMode={setReunionPrivacyMode}
                hideAgendaFromNonTarget={hideAgendaFromNonTarget}
                setHideAgendaFromNonTarget={setHideAgendaFromNonTarget}
                tagsDisponibles={tagsDisponibles}
                lieu={lieu}
                setLieu={setLieu}
                setLieuId={setLieuId}
                lieuxImportants={lieuxImportants}
                date={date}
                setDate={setDate}
                time={time}
                setTime={setTime}
                timeEnd={timeEnd}
                setTimeEnd={setTimeEnd}
                pollSlots={pollSlots}
                handleAddPollSlot={handleAddPollSlot}
                handleRemovePollSlot={handleRemovePollSlot}
                handlePollSlotChange={handlePollSlotChange}
                pollRestrictionType={pollRestrictionType}
                setPollRestrictionType={setPollRestrictionType}
                pollTarget={pollTarget}
                setPollTarget={setPollTarget}
                pointsOrdreDuJour={pointsOrdreDuJour}
                setPointsOrdreDuJour={setPointsOrdreDuJour}
                newPointTitle={newPointTitle}
                setNewPointTitle={setNewPointTitle}
                handleAddAgendaPoint={handleAddAgendaPoint}
                lienDocument={lienDocument}
                setLienDocument={setLienDocument}
                sendPushNotification={sendPushNotification}
                setSendPushNotification={setSendPushNotification}
                isSubmitting={isSubmitting}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onSubmit={handleCreateReunion}
              />
            </div>
          )}

          {/* Colonne Droite: Tableau des réunions et sondages (60% = 7/12 colonnes) */}
          <div id="meetings-studio-table" className={isAdmin ? "lg:col-span-7 flex flex-col gap-3 min-w-0 w-full" : "col-span-12 flex flex-col gap-3 min-w-0 w-full"}>
            <p className="text-xs opacity-75 leading-relaxed">
              {t('governance.studioSubtitle')}
            </p>

            {loading ? (
              <div className="text-center py-12">
                <span className="text-xs font-bold uppercase tracking-widest text-cordel-master-dark opacity-65 animate-pulse">
                  Chargement des réunions...
                </span>
              </div>
            ) : visibleEvents.length === 0 ? (
              <CordelCard className="p-8 text-center bg-white/50 border-dashed">
                <p className="text-xs italic opacity-60">Aucune réunion ni sondage répertorié pour le moment.</p>
              </CordelCard>
            ) : (
              <CordelCard className="p-0 overflow-hidden">
                <div className="w-full max-w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                        <th className="py-2.5 px-3">{t('governance.thMeetingTheme')}</th>
                        <th className="py-2.5 px-3">{t('governance.thDateSlot')}</th>
                        <th className="py-2.5 px-3">{t('governance.thAgenda')}</th>
                        <th className="py-2.5 px-3">{t('governance.thVotesStatus')}</th>
                        <th className="py-2.5 px-3 text-right">{t('governance.thAction')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEvents.map((ev) => {
                        const pointsCount = (ev.pointsOrdreDuJour || []).length;
                        const presentCount = (ev.inscriptions || []).filter(ins => ins.status === 'present').length;
                        return (
                          <tr 
                            key={ev.id} 
                            className="border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover/50 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-bold text-encre-noire">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{ev.titre}</span>
                                <ReunionPrivacyBadge event={ev} tagsDisponibles={tagsDisponibles} showPublic={true} />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-semibold opacity-85">
                              {formatDate(ev.date)}
                            </td>
                            <td className="py-2.5 px-3">
                              {pointsCount > 0 ? (
                                <span className="text-[10px] font-bold text-cordel-wood bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                                  📋 {pointsCount} point(s)
                                </span>
                              ) : ev.lienDocument ? (
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  📄 Document
                                </span>
                              ) : (
                                <span className="text-[10px] italic opacity-50">Non rédigé</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(ev)}
                                {ev.status === 'sondage' && (
                                  <span className="text-[9px] font-extrabold text-green-800">
                                    👥 {presentCount} présent(s)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedEventId(ev.id)}
                                className="text-[10px] font-black uppercase bg-neutral-100 hover:bg-neutral-200 text-encre-noire border border-encre-noire/30 px-3 py-1 rounded cursor-pointer"
                              >
                                Gérer
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CordelCard>
            )}
          </div>

        </div>
      )}

      {/* Modale d'importation d'ordre du jour */}
      <ImportAgendaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        groupId={groupId}
        onSelectTemplate={(template) => {
          const formattedPoints = (template.points || []).map(p => {
            if (typeof p === 'object' && p.titre) return p;
            return { id: Date.now().toString() + Math.random().toString(36).substring(2, 5), titre: String(p), notesCR: '' };
          });
          setPointsOrdreDuJour(formattedPoints);
        }}
      />
    </div>
  );
}
