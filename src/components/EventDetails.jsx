import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import ReunionAgendaManager from './ReunionAgendaManager';

export default function EventDetails({ event, user, profileData, onClose }) {
  // Find if the user has already responded to this event
  const existingResponse = (event.inscriptions || []).find(ins => ins.userId === user.uid);

  const [status, setStatus] = useState(existingResponse ? existingResponse.status : 'confirm'); // 'present', 'absent', 'confirm'
  const [transport, setTransport] = useState(existingResponse ? existingResponse.transport || 'propre' : 'propre'); // 'propre', 'cherche', 'propose'
  const [places, setPlaces] = useState(existingResponse ? existingResponse.places || 0 : 0);
  const [instruments, setInstruments] = useState(existingResponse ? existingResponse.instruments || '' : '');
  const [saving, setSaving] = useState(false);

  const isAuthorized = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  const [setlist, setSetlist] = useState(event.setlist || []);
  const [newMorceauTitre, setNewMorceauTitre] = useState('');
  const [newMorceauUrl, setNewMorceauUrl] = useState('');
  const [newMorceauNotes, setNewMorceauNotes] = useState('');
  const [updatingSetlist, setUpdatingSetlist] = useState(false);

  const handleAddMorceau = async (e) => {
    e.preventDefault();
    if (!newMorceauTitre.trim()) return;

    setUpdatingSetlist(true);
    try {
      const updatedSetlist = [
        ...setlist,
        {
          id: `morceau_${Date.now()}`,
          titre: newMorceauTitre.trim(),
          sequenceurUrl: newMorceauUrl.trim(),
          notes: newMorceauNotes.trim()
        }
      ];

      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });

      setSetlist(updatedSetlist);
      setNewMorceauTitre('');
      setNewMorceauUrl('');
      setNewMorceauNotes('');
    } catch (err) {
      console.error("EventDetails - Erreur handleAddMorceau :", err);
      alert("Erreur lors de l'ajout du morceau.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleRemoveMorceau = async (morceauId) => {
    setUpdatingSetlist(true);
    try {
      const updatedSetlist = setlist.filter(m => m.id !== morceauId);
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        setlist: updatedSetlist
      });
      setSetlist(updatedSetlist);
    } catch (err) {
      console.error("EventDetails - Erreur handleRemoveMorceau :", err);
      alert("Erreur lors de la suppression.");
    } finally {
      setUpdatingSetlist(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
  };

  const handleTransportChange = (e) => {
    setTransport(e.target.value);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Read existing inscriptions and filter out current user's past response
      const currentInscriptions = event.inscriptions || [];
      const updatedInscriptions = currentInscriptions.filter(ins => ins.userId !== user.uid);

      // 2. Add the new updated response object
      const newResponse = {
        userId: user.uid,
        userName: `${profileData.prenom} ${profileData.nom}`,
        status: status,
        transport: status === 'present' ? transport : null,
        places: status === 'present' && transport === 'propose' ? parseInt(places) || 0 : 0,
        instruments: status === 'present' && transport === 'propose' ? instruments : ""
      };

      updatedInscriptions.push(newResponse);

      // 3. Write update back to Firestore
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        inscriptions: updatedInscriptions
      });

      console.log("EventDetails - Inscription RSVP enregistrée avec succès !");
      onClose();
    } catch (error) {
      console.error("EventDetails - Erreur lors de la sauvegarde RSVP :", error);
      alert("Erreur lors de l'enregistrement de votre inscription.");
    } finally {
      setSaving(false);
    }
  };

  // Date parsing for visual header
  const dateObj = new Date(event.date);
  const formattedDate = isNaN(dateObj.getTime()) 
    ? 'Date inconnue' 
    : dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const typeVariants = {
    concert: 'ocre',
    repetition: 'vert',
    stage: 'bleu',
    reunion: 'kraft'
  };

  const currentVariant = typeVariants[event.type] || 'default';

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Header with back button */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
        <CordelButton variant="default" onClick={onClose} className="px-3 py-1 text-xs">
          ← Retour
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase">
          Détails Événement
        </span>
        <div className="w-12"></div>
      </div>

      {/* Event General Info Card */}
      <CordelCard variant={currentVariant} useExtremeBorder={true} className="py-4">
        <span className="text-[8px] uppercase tracking-widest font-black opacity-60">
          {event.type}
        </span>
        <h3 className="font-bold text-lg leading-tight mt-0.5 mb-2">{event.titre}</h3>
        <p className="text-xs font-semibold leading-relaxed">
          📅 {formattedDate} {formattedTime ? `à ${formattedTime}` : ''}
        </p>
      </CordelCard>

      {/* RSVP Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <CordelCard variant="default" useExtremeBorder={false} className="flex flex-col gap-4">
          <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
            Votre présence
          </h4>
          
          {/* Status Selection Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleStatusChange('present')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'present' 
                  ? 'theme-bg-vert font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-[#ece4d0]'}
              `}
            >
              Présent
            </button>
            
            <button
              type="button"
              disabled={saving}
              onClick={() => handleStatusChange('absent')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'absent' 
                  ? 'bg-cordel-wood text-cordel-bg-light font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-[#ece4d0]'}
              `}
            >
              Absent
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleStatusChange('confirm')}
              className={`
                theme-btn px-2 py-2 text-xs rounded-[4px_6px_3px_5px] transition-colors cursor-pointer select-none
                ${status === 'confirm' 
                  ? 'theme-bg-ocre font-black border-2 border-encre-noire shadow-none translate-x-[1px] translate-y-[1px]' 
                  : 'bg-cordel-bg-light text-encre-noire border-2 border-encre-noire shadow-[2px_2px_0px_0px_#181716] hover:bg-[#ece4d0]'}
              `}
            >
              À confirmer
            </button>
          </div>

          {/* Conditional Transport Options (Only visible when present) */}
          {status === 'present' && (
            <div className="flex flex-col gap-4 border-t border-dashed border-cordel-master-dark/20 pt-4 mt-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
                Logistique Covoiturage
              </h4>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="propre"
                    checked={transport === 'propre'}
                    onChange={handleTransportChange}
                    disabled={saving}
                    className="accent-cordel-wood scale-110"
                  />
                  <span>J'y vais par mes propres moyens</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="cherche"
                    checked={transport === 'cherche'}
                    onChange={handleTransportChange}
                    disabled={saving}
                    className="accent-cordel-wood scale-110"
                  />
                  <span>Je cherche une place</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="transport"
                    value="propose"
                    checked={transport === 'propose'}
                    onChange={handleTransportChange}
                    disabled={saving}
                    className="accent-cordel-wood scale-110"
                  />
                  <span>Je propose ma voiture</span>
                </label>
              </div>

              {/* Conditional Inputs if "propose ma voiture" */}
              {transport === 'propose' && (
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-cordel-wood/30 mt-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Places passagers disponibles
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={places}
                      onChange={(e) => setPlaces(e.target.value)}
                      required
                      disabled={saving}
                      className="theme-input w-24 text-center disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                      Espace instruments (Alfaia, Caisses, etc.)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2 Alfaias + 1 Tarol"
                      value={instruments}
                      onChange={(e) => setInstruments(e.target.value)}
                      required
                      disabled={saving}
                      className="theme-input w-full disabled:opacity-50 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CordelCard>

        {/* Validation Button */}
        <CordelButton 
          variant="ocre" 
          useExtremeBorder={true}
          disabled={saving}
          className="w-full py-3"
        >
          {saving ? "Validation..." : "Valider mon inscription"}
        </CordelButton>
      </form>

      {/* Setlist & Séquenceur de l'événement */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood border-b border-dashed border-cordel-master-dark/15 pb-1 mb-3">
          🎵 Programme de révision / Setlist
        </h4>

        {setlist.length === 0 ? (
          <p className="text-[11px] italic opacity-60">Aucun morceau ou rythme programmé pour cet événement.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {setlist.map((morceau) => (
              <div 
                key={morceau.id}
                className="text-xs p-3 rounded border border-dashed border-encre-noire/15 bg-[#fdfaf2] dark:bg-[#1a1816] flex flex-col gap-1.5"
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-encre-noire text-sm">{morceau.titre}</span>
                  {isAuthorized && (
                    <button
                      type="button"
                      disabled={updatingSetlist}
                      onClick={() => handleRemoveMorceau(morceau.id)}
                      className="text-[10px] text-red-600 hover:text-red-500 font-black cursor-pointer select-none"
                      title="Retirer de la setlist"
                    >
                      ✕ Retirer
                    </button>
                  )}
                </div>

                {morceau.notes && (
                  <p className="text-[11px] text-encre-noire/70 bg-white/40 dark:bg-black/20 p-1.5 rounded italic">
                    💡 {morceau.notes}
                  </p>
                )}

                {morceau.sequenceurUrl && (
                  <a
                    href={morceau.sequenceurUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:translate-x-[0.5px] active:translate-y-[0.5px] w-full text-center mt-1"
                  >
                    🎧 Travailler ce rythme (Séquenceur)
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulaire d'ajout pour les Admins */}
        {isAuthorized && (
          <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
            <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2">
              ➕ Ajouter un morceau / rythme
            </h5>
            <form onSubmit={handleAddMorceau} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <input 
                  type="text"
                  placeholder="Titre du morceau (ex: Baque de Luanda)"
                  value={newMorceauTitre}
                  onChange={(e) => setNewMorceauTitre(e.target.value)}
                  disabled={updatingSetlist}
                  required
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <div className="flex flex-col gap-1">
                <input 
                  type="url"
                  placeholder="URL Séquenceur (ex: https://sequenceur.app/...)"
                  value={newMorceauUrl}
                  onChange={(e) => setNewMorceauUrl(e.target.value)}
                  disabled={updatingSetlist}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <div className="flex flex-col gap-1">
                <input 
                  type="text"
                  placeholder="Notes de révision (ex: Tempo 120, variations A et B)"
                  value={newMorceauNotes}
                  onChange={(e) => setNewMorceauNotes(e.target.value)}
                  disabled={updatingSetlist}
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
                />
              </div>

              <CordelButton
                variant="ocre"
                useExtremeBorder={true}
                disabled={updatingSetlist || !newMorceauTitre.trim()}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest"
              >
                {updatingSetlist ? "Enregistrement..." : "Ajouter au programme"}
              </CordelButton>
            </form>
          </div>
        )}
      </CordelCard>

      {/* 💡 Reunion Specific Ordre du Jour & PDF minutes report manager */}
      {event.type === 'reunion' && (
        <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20">
          <ReunionAgendaManager 
            event={event}
            user={user}
            profileData={profileData}
          />
        </div>
      )}
    </div>
  );
}
