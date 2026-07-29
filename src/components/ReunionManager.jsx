import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import EventReportSection from './event-details/EventReportSection';
import ImportAgendaModal from './agenda/ImportAgendaModal';
import LocationSelector from './LocationSelector';
import { useTranslation } from './LanguageContext';
import { XiloCalendar } from './XiloIcons';

/**
 * Composant de gestion des Réunions dans le Studio.
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
  // Lieu de la réunion
  const [lieu, setLieu] = useState('Salle de réunion / En ligne');
  const [lieuxImportants, setLieuxImportants] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = 
    profileData?.role === 'mestre' || 
    profileData?.role === 'super-admin' || 
    profileData?.role === 'secretaire' || 
    profileData?.isSystemAdmin === true;

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
            pointsOrdreDuJour: pointsOrdreDuJour,
            lienDocument: lienDocument.trim(),
            compteRenduStatus: 'brouillon',
            compteRenduApprovals: {},
            suggestionsOrdreDuJour: [],
            inscriptions: [],
            lieu: lieu.trim() || 'Salle de réunion / En ligne'
          };
          await addDoc(collection(db, 'events'), newEventDoc);
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
          pointsOrdreDuJour: pointsOrdreDuJour,
          lienDocument: lienDocument.trim(),
          compteRenduStatus: 'brouillon',
          compteRenduApprovals: {},
          suggestionsOrdreDuJour: [],
          inscriptions: [],
          lieu: lieu.trim() || 'Salle de réunion / En ligne'
        };
        const docRef = await addDoc(collection(db, 'events'), newEventDoc);
        setSelectedEventId(docRef.id);
        alert("Réunion créée avec succès !");
      }

      // Réinitialisation du formulaire
      setTitle('');
      setDate('');
      setTime('');
      setTimeEnd('');
      setPointsOrdreDuJour([]);
      setLienDocument('');
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
        return <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px] animate-pulse">⏳ RELECTURE</span>;
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

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="flex flex-col gap-6 text-left select-none max-w-5xl mx-auto w-full">
      {/* Header Navigation */}
      <div className="flex justify-between items-center pb-2 border-b-2 border-dashed border-cordel-master-dark/30">
        <button 
          type="button" 
          onClick={selectedEventId ? () => setSelectedEventId('') : onBack} 
          className="text-[10px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-3 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center justify-center"
        >
          ⬅️ {selectedEventId ? "Liste des réunions" : t('common.back') || "Retour"}
        </button>
        
        <h2 className="text-sm font-extrabold tracking-widest text-cordel-wood uppercase flex items-center gap-2">
          <XiloCalendar size={16} /> Studio Réunions & Sondages
        </h2>
      </div>

      {selectedEventId && selectedEvent ? (
        /* Vue détaillée / Éditeur de compte-rendu */
        <div className="flex flex-col gap-4">
          <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg-light/30">
            <h3 className="text-sm font-black text-encre-noire">
              📅 {selectedEvent.titre}
            </h3>
            <p className="text-[10px] font-bold text-cordel-wood uppercase mt-1">
              {formatDate(selectedEvent.date)}
            </p>
          </CordelCard>
          
          <EventReportSection 
            event={selectedEvent} 
            user={user} 
            profileData={profileData} 
          />
        </div>
      ) : (
        /* Vue Liste + Formulaire de Création */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Formulaire de création avancée */}
          {isAdmin && (
            <div className="md:col-span-5">
              <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 bg-cordel-bg">
                <h3 className="text-xs font-black uppercase tracking-wider text-cordel-wood border-b border-dashed border-encre-noire/15 pb-2">
                  ➕ Créer une Réunion ou un Sondage
                </h3>
                
                {/* Switch Mode : Date Fixe vs Sondage */}
                <div className="flex gap-1.5 p-1 bg-white/60 rounded border border-cordel-master-dark/20">
                  <button
                    type="button"
                    onClick={() => setCreationMode('date')}
                    className={`flex-1 py-1.5 text-[9.5px] font-extrabold uppercase rounded transition-all cursor-pointer ${
                      creationMode === 'date'
                        ? 'bg-cordel-wood text-white shadow-sm'
                        : 'text-cordel-master-dark opacity-75 hover:opacity-100'
                    }`}
                  >
                    📅 Date Fixe
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('poll')}
                    className={`flex-1 py-1.5 text-[9.5px] font-extrabold uppercase rounded transition-all cursor-pointer ${
                      creationMode === 'poll'
                        ? 'bg-cordel-wood text-white shadow-sm'
                        : 'text-cordel-master-dark opacity-75 hover:opacity-100'
                    }`}
                  >
                    📊 Sondage Multi-Dates
                  </button>
                </div>

                <form onSubmit={handleCreateReunion} className="flex flex-col gap-3.5 text-xs">
                  {/* Titre */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Titre de la réunion *
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Ex: Assemblée Générale / Réunion de Bureau"
                      className="theme-input bg-white w-full py-1.5 text-xs font-bold"
                    />
                  </div>

                  {/* Lieu de la réunion avec sélecteur intelligent */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Lieu de la réunion
                    </label>
                    <LocationSelector
                      value={lieu}
                      lieuxImportants={lieuxImportants}
                      onChange={(val) => setLieu(val)}
                      placeholder="Ex: Salle de réunion, Local..."
                    />
                  </div>

                  {/* Mode Date Fixe */}
                  {creationMode === 'date' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Jour *
                        </label>
                        <input 
                          type="date" 
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          required
                          className="theme-input bg-white w-full py-1.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Heure début *
                        </label>
                        <input 
                          type="time" 
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                          className="theme-input bg-white w-full py-1.5"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Heure fin
                        </label>
                        <input 
                          type="time" 
                          value={timeEnd}
                          onChange={(e) => setTimeEnd(e.target.value)}
                          className="theme-input bg-white w-full py-1.5"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Mode Sondage Multi-Créneaux */
                    <div className="flex flex-col gap-3 border-t border-dashed border-cordel-master-dark/15 pt-2">
                      <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-wood flex items-center justify-between">
                        <span>Créneaux proposés (min. 2 dates)</span>
                      </label>

                      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                        {pollSlots.map((slot, idx) => (
                          <div key={idx} className="p-2 bg-white/70 rounded border border-cordel-master-dark/20 flex flex-col gap-1.5 relative">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-extrabold text-cordel-wood uppercase">
                                Option {idx + 1}
                              </span>
                              {idx >= 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePollSlot(idx)}
                                  className="text-red-600 hover:text-red-800 text-[10px] font-bold px-1"
                                >
                                  ✖
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                              <input
                                type="date"
                                value={slot.date}
                                onChange={(e) => handlePollSlotChange(idx, 'date', e.target.value)}
                                required
                                className="theme-input text-[11px] py-1 bg-white"
                              />
                              <input
                                type="time"
                                value={slot.timeStart}
                                onChange={(e) => handlePollSlotChange(idx, 'timeStart', e.target.value)}
                                required
                                className="theme-input text-[11px] py-1 bg-white"
                              />
                              <input
                                type="time"
                                value={slot.timeEnd}
                                onChange={(e) => handlePollSlotChange(idx, 'timeEnd', e.target.value)}
                                className="theme-input text-[11px] py-1 bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddPollSlot}
                        className="text-[9px] font-black uppercase text-cordel-wood hover:underline text-left mt-0.5 cursor-pointer"
                      >
                        + Ajouter une date proposée
                      </button>

                      {/* Restriction du vote */}
                      <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-dashed border-cordel-master-dark/15">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                          Restriction du vote
                        </label>
                        <select
                          value={pollRestrictionType}
                          onChange={(e) => {
                            setPollRestrictionType(e.target.value);
                            setPollTarget('');
                          }}
                          className="theme-input text-xs font-bold py-1 bg-white"
                        >
                          <option value="aucun">👥 Tous les membres</option>
                          <option value="tag">🏷️ Par Étiquette (ex: C.A, Bureau)</option>
                          <option value="instrument">🥁 Par Pupitre / Instrument</option>
                        </select>
                      </div>

                      {pollRestrictionType === 'tag' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                            Étiquette ciblée
                          </label>
                          <input
                            type="text"
                            value={pollTarget}
                            onChange={(e) => setPollTarget(e.target.value)}
                            placeholder="Ex: C.A, Bureau..."
                            className="theme-input text-xs font-bold py-1 bg-white"
                          />
                        </div>
                      )}

                      {pollRestrictionType === 'instrument' && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                            Pupitre / Instrument ciblé
                          </label>
                          <select
                            value={pollTarget}
                            onChange={(e) => setPollTarget(e.target.value)}
                            className="theme-input text-xs font-bold py-1 bg-white"
                          >
                            <option value="">-- Choisir l'instrument --</option>
                            {['Alfaia', 'Caixa', 'Gonguê', 'Agbê', 'Mineiro', 'Timbal', 'Chant', 'Danse'].map(inst => (
                              <option key={inst} value={inst}>{inst}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section Rédactrice de l'Ordre du Jour */}
                  <div className="border-t border-dashed border-cordel-master-dark/20 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <label className="text-[9.5px] uppercase font-black text-cordel-wood">
                        📋 Ordre du jour de la réunion
                      </label>
                      <CordelButton
                        type="button"
                        variant="vert"
                        useExtremeBorder={true}
                        onClick={() => setIsImportModalOpen(true)}
                        className="text-[8.5px] font-extrabold uppercase px-2 py-0.5"
                      >
                        📥 Importer un modèle
                      </CordelButton>
                    </div>

                    {/* Saisie rapide d'un point */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={newPointTitle}
                        onChange={(e) => setNewPointTitle(e.target.value)}
                        placeholder="Point à traiter..."
                        className="theme-input text-xs flex-1 bg-white py-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddAgendaPoint}
                        className="text-xs font-extrabold px-2.5 py-1 bg-cordel-wood text-white rounded hover:brightness-95 cursor-pointer"
                      >
                        ＋
                      </button>
                    </div>

                    {/* Aperçu des points ajoutés */}
                    {pointsOrdreDuJour.length > 0 && (
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto bg-white/70 p-2 rounded border border-cordel-master-dark/15">
                        {pointsOrdreDuJour.map((pt, idx) => (
                          <div key={pt.id || idx} className="flex justify-between items-center text-[11px] pl-1.5 border-l-2 border-cordel-wood font-medium">
                            <span>{idx + 1}. {pt.titre}</span>
                            <button
                              type="button"
                              onClick={() => setPointsOrdreDuJour(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-600 font-bold px-1 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lien du document externe */}
                    <input
                      type="url"
                      value={lienDocument}
                      onChange={(e) => setLienDocument(e.target.value)}
                      placeholder="Lien du document / Ordre du jour PDF (facultatif)"
                      className="theme-input text-[11px] w-full py-1 bg-white"
                    />
                  </div>

                  <CordelButton 
                    variant="ocre" 
                    type="submit" 
                    disabled={isSubmitting}
                    useExtremeBorder={true}
                    className="text-xs py-2.5 mt-2 font-extrabold uppercase tracking-wider w-full"
                  >
                    {isSubmitting ? "Création en cours..." : (creationMode === 'poll' ? "🚀 Lancer le Sondage" : "📅 Planifier la Réunion")}
                  </CordelButton>
                </form>
              </CordelCard>
            </div>
          )}

          {/* Colonne Droite: Tableau des réunions et sondages */}
          <div className={isAdmin ? "md:col-span-7 flex flex-col gap-4" : "col-span-12 flex flex-col gap-4"}>
            <p className="text-xs opacity-75 leading-relaxed">
              Consultez et gérez les ordres du jour, les votes de sondages et les comptes-rendus de toutes les réunions.
            </p>

            {loading ? (
              <div className="text-center py-12">
                <span className="text-xs font-bold uppercase tracking-widest text-cordel-master-dark opacity-65 animate-pulse">
                  Chargement des réunions...
                </span>
              </div>
            ) : events.length === 0 ? (
              <CordelCard className="p-8 text-center bg-white/50 border-dashed">
                <p className="text-xs italic opacity-60">Aucune réunion ni sondage répertorié pour le moment.</p>
              </CordelCard>
            ) : (
              <CordelCard className="p-0 overflow-hidden">
                <div className="w-full max-w-full overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-cordel-master-dark text-cordel-bg-light uppercase tracking-wider text-[9px] font-black border-b border-encre-noire">
                        <th className="py-2.5 px-3">Réunion / Sondage</th>
                        <th className="py-2.5 px-3">Date / Créneau</th>
                        <th className="py-2.5 px-3">Ordre du jour</th>
                        <th className="py-2.5 px-3">Votes / Statut</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev) => {
                        const pointsCount = (ev.pointsOrdreDuJour || []).length;
                        const presentCount = (ev.inscriptions || []).filter(ins => ins.status === 'present').length;
                        return (
                          <tr 
                            key={ev.id} 
                            className="border-b border-dashed border-encre-noire/15 hover:bg-cordel-hover/50 transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-encre-noire">
                              {ev.titre}
                            </td>
                            <td className="py-3 px-3 font-semibold opacity-85">
                              {formatDate(ev.date)}
                            </td>
                            <td className="py-3 px-3">
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
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1">
                                {getStatusBadge(ev)}
                                {ev.status === 'sondage' && (
                                  <span className="text-[9px] font-extrabold text-green-800">
                                    👥 {presentCount} présent(s)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
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
