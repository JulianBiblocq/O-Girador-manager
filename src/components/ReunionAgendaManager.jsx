import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { XiloClose } from './XiloIcons';

export default function ReunionAgendaManager({ event, user, profileData }) {
  const [newTopic, setNewTopic] = useState('');
  const [submittingTopic, setSubmittingTopic] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const isAdmin = profileData?.role === 'mestre' || profileData?.role === 'super-admin' || profileData?.isSystemAdmin === true;

  // Add a topic to the sujetsProposes array in Firestore
  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    setSubmittingTopic(true);
    try {
      const currentSujets = event.sujetsProposes || [];
      const newSujetObj = {
        id: Date.now().toString(),
        titre: newTopic.trim(),
        auteurId: user.uid,
        auteurNom: `${profileData.prenom} ${profileData.nom}`,
        status: 'attente'
      };

      const docRef = doc(db, 'events', event.id);
      await updateDoc(docRef, {
        sujetsProposes: [...currentSujets, newSujetObj]
      });
      setNewTopic('');
    } catch (err) {
      console.error("ReunionAgendaManager - Erreur add topic :", err);
      alert("Erreur lors de la proposition du sujet.");
    } finally {
      setSubmittingTopic(false);
    }
  };

  // Moderate topic status (valide / refuse / delete)
  const handleSetTopicStatus = async (topicId, newStatus) => {
    try {
      const currentSujets = event.sujetsProposes || [];
      const updated = currentSujets.map(s => {
        if (s.id === topicId) {
          return { ...s, status: newStatus };
        }
        return s;
      });

      const docRef = doc(db, 'events', event.id);
      await updateDoc(docRef, {
        sujetsProposes: updated
      });
    } catch (err) {
      console.error("ReunionAgendaManager - Erreur status topic :", err);
      alert("Erreur lors de la modération du sujet.");
    }
  };

  // Remove a topic entirely (Admin or Author only)
  const handleDeleteTopic = async (topicId) => {
    const confirmDelete = window.confirm("Voulez-vous retirer cette proposition ?");
    if (!confirmDelete) return;

    try {
      const currentSujets = event.sujetsProposes || [];
      const updated = currentSujets.filter(s => s.id !== topicId);

      const docRef = doc(db, 'events', event.id);
      await updateDoc(docRef, {
        sujetsProposes: updated
      });
    } catch (err) {
      console.error("ReunionAgendaManager - Erreur delete topic :", err);
    }
  };

  // Upload Minutes PDF to Firebase Storage
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Format incorrect. Veuillez sélectionner un fichier PDF uniquement.");
      return;
    }

    setUploadingPdf(true);
    try {
      const storagePath = `reunions/${event.id}/${Date.now()}_${file.name}`;
      const fileRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // Save minutes link on event document
      const docRef = doc(db, 'events', event.id);
      await updateDoc(docRef, {
        compteRenduUrl: downloadUrl
      });
    } catch (err) {
      console.error("ReunionAgendaManager - Erreur upload PDF :", err);
      alert("Erreur lors de l'upload du compte-rendu.");
    } finally {
      setUploadingPdf(false);
    }
  };

  // Delete Minutes PDF link from event
  const handlePdfDelete = async () => {
    const confirmDelete = window.confirm("Voulez-vous vraiment détacher le compte-rendu de cette réunion ?");
    if (!confirmDelete) return;

    try {
      const docRef = doc(db, 'events', event.id);
      await updateDoc(docRef, {
        compteRenduUrl: ''
      });
    } catch (err) {
      console.error("ReunionAgendaManager - Erreur delete PDF :", err);
    }
  };

  // Local filtering based on role
  const allSujets = event.sujetsProposes || [];
  const validatedTopics = allSujets.filter(s => s.status === 'valide');
  const pendingTopics = allSujets.filter(s => isAdmin ? s.status === 'attente' : (s.status === 'attente' && s.auteurId === user.uid));
  const rejectedTopics = allSujets.filter(s => isAdmin ? s.status === 'refuse' : (s.status === 'refuse' && s.auteurId === user.uid));

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      
      {/* 📄 Compte-Rendu Section */}
      <div className="border-b border-dashed border-cordel-master-dark/15 pb-4">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood mb-2.5">
          📄 Compte-Rendu officiel
        </h4>

        {event.compteRenduUrl ? (
          <div className="flex items-center gap-2">
            <CordelButton
              variant="ocre"
              useExtremeBorder={true}
              onClick={() => window.open(event.compteRenduUrl, '_blank')}
              className="py-2.5 flex-1 text-xs font-extrabold flex items-center justify-center gap-2"
            >
              📄 Lire le Compte-Rendu (PDF)
            </CordelButton>
            {isAdmin && (
              <button
                type="button"
                onClick={handlePdfDelete}
                className="w-10 h-10 border-2 border-encre-noire bg-cordel-wood text-cordel-bg-light rounded-[6px_8px_5px_7px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-110 flex items-center justify-center cursor-pointer"
                title="Supprimer le compte-rendu"
              >
                <XiloClose size={12} />
              </button>
            )}
          </div>
        ) : (
          <div>
            {isAdmin ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Télécharger le compte-rendu PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf}
                  className="theme-input text-xs w-full py-1 cursor-pointer bg-cordel-bg-light disabled:opacity-50"
                />
                {uploadingPdf && (
                  <span className="text-[9px] uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Envoi en cours...</span>
                )}
              </div>
            ) : (
              <p className="text-[10px] italic opacity-60">Aucun compte-rendu n'a encore été mis en ligne pour cette réunion.</p>
            )}
          </div>
        )}
      </div>

      {/* 💡 Ordre du jour & Boîte à idées Section */}
      <div className="flex flex-col gap-3">
        <h4 className="font-bold text-xs uppercase tracking-wider text-cordel-wood">
          💡 Ordre du jour & Boîte à idées
        </h4>

        {/* 1. List of validated topics (visible to all) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[8px] uppercase font-extrabold tracking-wider text-cordel-master-dark opacity-65">
            Sujets retenus ({validatedTopics.length})
          </span>
          {validatedTopics.length === 0 ? (
            <p className="text-[10px] italic opacity-50 pl-1">Aucun sujet validé pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {validatedTopics.map(s => (
                <CordelCard key={s.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg flex items-center justify-between gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-encre-noire leading-snug break-words">
                      {s.titre}
                    </p>
                    <span className="text-[8px] opacity-65 font-semibold">Proposé par {s.auteurNom}</span>
                  </div>
                  {(isAdmin || s.auteurId === user.uid) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(s.id)}
                      className="p-1 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center shrink-0"
                      title="Supprimer la proposition"
                    >
                      <XiloClose size={8} />
                    </button>
                  )}
                </CordelCard>
              ))}
            </div>
          )}
        </div>

        {/* 2. List of pending topics (moderation) */}
        <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
          <span className="text-[8px] uppercase font-extrabold tracking-wider text-cordel-master-dark opacity-65">
            {isAdmin ? `Modération des suggestions (${pendingTopics.length})` : `Mes suggestions en attente (${pendingTopics.length})`}
          </span>
          {pendingTopics.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {pendingTopics.map(s => (
                <CordelCard key={s.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-cordel-bg-light/40 flex flex-col gap-2 text-left">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-encre-noire leading-snug break-words">
                        {s.titre}
                      </p>
                      <span className="text-[8px] opacity-65">De : {s.auteurNom}</span>
                    </div>
                    <span className="theme-stamp-badge theme-stamp-badge-wood text-[6px] rotate-1 px-1.5 py-0 shrink-0">
                      En attente
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-1.5">
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSetTopicStatus(s.id, 'refuse')}
                          className="text-[8px] px-2 py-0.5 border border-red-600 text-red-600 bg-transparent rounded font-bold hover:bg-red-50 cursor-pointer"
                        >
                          Refuser
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetTopicStatus(s.id, 'valide')}
                          className="text-[8px] px-2 py-0.5 border border-green-600 text-green-600 bg-transparent rounded font-bold hover:bg-green-50 cursor-pointer"
                        >
                          Valider
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(s.id)}
                        className="text-[8px] px-2 py-0.5 border border-encre-noire bg-transparent text-encre-noire rounded font-bold hover:bg-neutral-100 cursor-pointer flex items-center gap-1"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                </CordelCard>
              ))}
            </div>
          )}
        </div>

        {/* 3. List of rejected topics (only shown to admin, or to author of topic) */}
        {rejectedTopics.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-2">
            <span className="text-[8px] uppercase font-extrabold tracking-wider text-red-600 opacity-75">
              {isAdmin ? "Sujets Refusés" : "Mes suggestions refusées"}
            </span>
            <div className="flex flex-col gap-1.5">
              {rejectedTopics.map(s => (
                <CordelCard key={s.id} variant="default" useExtremeBorder={false} className="p-2.5 bg-transparent border-red-300 flex items-center justify-between gap-3 text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-500 leading-snug line-through break-words">
                      {s.titre}
                    </p>
                    <span className="text-[8px] opacity-60">Par {s.auteurNom}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleSetTopicStatus(s.id, 'valide')}
                        className="text-[8px] px-1.5 py-0.5 border border-green-600 text-green-600 rounded font-bold hover:bg-green-50 cursor-pointer"
                      >
                        Réactiver
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(s.id)}
                      className="p-1 border border-red-600 bg-transparent text-red-600 rounded cursor-pointer flex items-center justify-center"
                      title="Supprimer définitivement"
                    >
                      <XiloClose size={8} />
                    </button>
                  </div>
                </CordelCard>
              ))}
            </div>
          </div>
        )}

        {/* 4. Suggestion Form */}
        <form onSubmit={handleAddTopic} className="flex flex-col gap-1 border-t border-dashed border-cordel-master-dark/15 pt-3">
          <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
            Proposer un sujet à l'ordre du jour
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              disabled={submittingTopic}
              required
              maxLength={120}
              placeholder="Ex : Organisation Répétitions..."
              className="theme-input text-xs flex-1 py-1.5 disabled:opacity-50"
            />
            <CordelButton
              type="submit"
              variant="default"
              disabled={submittingTopic || !newTopic.trim()}
              className="text-[10px] px-3 py-1.5 font-bold uppercase shrink-0"
            >
              {submittingTopic ? "..." : "Suggérer"}
            </CordelButton>
          </div>
        </form>

      </div>

    </div>
  );
}
