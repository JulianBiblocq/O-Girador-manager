import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloCaixa, XiloClose } from '../XiloIcons';
import { useAssociationSettings } from '../../hooks/useAssociationSettings';
import { doc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const getInstrumentIconPath = (instName) => {
  if (!instName) return '/favicon.svg';
  const name = instName.toLowerCase().trim();
  if (name.includes('alfaia')) return '/icones/alfaia.svg';
  if (name.includes('agbê') || name.includes('agbe') || name.includes('sementes')) return '/icones/agbe.svg';
  if (name.includes('gonguê') || name.includes('gongue')) return '/icones/gongue.svg';
  if (name.includes('caixa') || name.includes('tarol') || name.includes('caisse')) return '/icones/caixa.svg';
  if (name.includes('chant') || name.includes('voix') || name.includes('singer') || name.includes('danse') || name.includes('dance') || name.includes('micro')) return '/icones/micro.svg';
  if (name.includes('timbal')) return '/icones/timbal.svg';
  if (name.includes('mineiro')) return '/icones/mineiro.svg';
  if (name.includes('apito') || name.includes('mestre') || name.includes('chef')) return '/icones/apito.svg';
  return '/favicon.svg';
};

/**
 * UserMateriel Component
 * Displays member's personal instruments, borrowed association gear, and local assigned instruments.
 */
export default function UserMateriel({ user, profileData, onBack }) {
  const { t } = useTranslation();
  const { myInstruments, loadingInst } = useUserProfile(user, profileData, t);

  const translate = (key, fallback) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  const personal = myInstruments.filter(inst => inst.proprietaire === user?.uid);
  const borrowed = myInstruments.filter(inst => 
    (inst.status === 'Emprunté' && inst.borrowedBy === user?.uid) ||
    (inst.proprietaire === 'Association' && inst.localisationPhysique === user?.uid)
  );
  const localAssigned = myInstruments.filter(inst => 
    inst.localisationPhysique === 'Local' && 
    Array.isArray(inst.assignations) && 
    inst.assignations.includes(user?.uid)
  );

  const [movementModalInst, setMovementModalInst] = useState(null);
  const [movementType, setMovementType] = useState('return_to_local');
  const [movementToUser, setMovementToUser] = useState('');
  const [movementNote, setMovementNote] = useState('');
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submittingMovement, setSubmittingMovement] = useState(false);

  // Nouvel état pour le détail des pièces et le signalement
  const [allInventoryParts, setAllInventoryParts] = useState([]);
  const [instrumentModels, setInstrumentModels] = useState([]);
  const [reportInstrumentModal, setReportInstrumentModal] = useState(null);
  const [reportTargetPartId, setReportTargetPartId] = useState('ALL');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Fetch all inventory parts once
  useEffect(() => {
    if (profileData?.groupId) {
      const fetchParts = async () => {
        try {
          const q = query(collection(db, 'inventoryParts'), where('groupId', '==', profileData.groupId));
          const snapshot = await getDocs(q);
          const parts = [];
          snapshot.forEach(docSnap => {
            parts.push({ id: docSnap.id, ...docSnap.data() });
          });
          setAllInventoryParts(parts);

          const qModels = query(collection(db, 'instrument_models'), where('groupId', '==', profileData.groupId));
          const snapModels = await getDocs(qModels);
          const models = [];
          snapModels.forEach(docSnap => {
            models.push({ id: docSnap.id, ...docSnap.data() });
          });
          setInstrumentModels(models);
        } catch (err) {
          console.error("UserMateriel - Erreur fetch parts :", err);
        }
      };
      fetchParts();
    }
  }, [profileData?.groupId]);

  useEffect(() => {
    if (movementModalInst && usersList.length === 0 && profileData?.groupId) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const q = query(collection(db, 'users'), where('groupId', '==', profileData.groupId));
          const snapshot = await getDocs(q);
          const users = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (docSnap.id !== user.uid) { // exclude self
              users.push({ id: docSnap.id, nom: data.nom, prenom: data.prenom });
            }
          });
          users.sort((a, b) => (a.prenom || '').localeCompare(b.prenom || ''));
          setUsersList(users);
        } catch (err) {
          console.error("UserMateriel - Erreur fetch users :", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [movementModalInst, profileData?.groupId, usersList.length, user.uid]);

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    if (!movementModalInst) return;
    if (movementType === 'transfer' && !movementToUser) {
      alert("Veuillez sélectionner un membre pour le transfert.");
      return;
    }

    setSubmittingMovement(true);
    try {
      const payload = {
        type: movementType,
        fromUserId: user.uid,
        toUserId: movementType === 'transfer' ? movementToUser : null,
        date: new Date().toISOString(),
        note: movementNote.trim(),
        status: 'pending'
      };
      await updateDoc(doc(db, 'inventory', movementModalInst.id), {
        pendingMovement: payload
      });
      setMovementModalInst(null);
      setMovementType('return_to_local');
      setMovementToUser('');
      setMovementNote('');
    } catch (err) {
      console.error("UserMateriel - Erreur lors de la déclaration :", err);
      alert("Erreur lors de l'envoi de la déclaration.");
    } finally {
      setSubmittingMovement(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportInstrumentModal) return;
    
    setSubmittingReport(true);
    try {
      const inst = reportInstrumentModal;
      let partName = "l'instrument entier";
      
      if (reportTargetPartId !== 'ALL') {
        const isInventoryPart = allInventoryParts.find(p => p.id === reportTargetPartId);
        if (isInventoryPart) {
          partName = `la pièce "${isInventoryPart.nom}"`;
          // 1. Passer la pièce en 'À réparer'
          await updateDoc(doc(db, 'inventoryParts', isInventoryPart.id), {
            status: 'À réparer',
            notes: (isInventoryPart.notes ? isInventoryPart.notes + '\n' : '') + `[Casse signalée par ${user.nom}] ${reportDescription}`
          });
        } else {
          const model = instrumentModels.find(m => m.id === inst.modelId);
          const modelPart = model?.parts?.find(p => p.id === reportTargetPartId);
          if (modelPart) {
             partName = `la pièce "${modelPart.nom}" (modèle)`;
          }
        }
      }

      // 2. Passer l'instrument parent en 'À réparer'
      await updateDoc(doc(db, 'inventory', inst.id), {
        etat: 'À réparer',
        notes: (inst.notes ? inst.notes + '\n' : '') + `[Casse signalée par ${user.nom} - ${partName}] ${reportDescription}`
      });

      // 3. Créer une notification pour l'atelier (déclenchera le push)
      await addDoc(collection(db, 'notifications_queue'), {
        groupId: profileData.groupId,
        type: 'repair_needed',
        title: 'Signalement de casse',
        body: `${user.prenom || user.nom} a signalé une casse sur ${partName} de l'instrument "${inst.nom}".`,
        link: '/inventory',
        createdAt: serverTimestamp(),
        targetRoles: ['mestre', 'admin', 'logisticien'] // Destinataires
      });

      setReportInstrumentModal(null);
      setReportDescription('');
      setReportTargetPartId('ALL');
    } catch (err) {
      console.error("Erreur lors du signalement :", err);
      alert("Erreur lors du signalement de casse.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const renderNomenclature = (inst) => {
    if (!inst.nomenclature || !Array.isArray(inst.nomenclature) || inst.nomenclature.length === 0) return null;
    
    // Find the actual parts from allInventoryParts
    const parts = inst.nomenclature.map(partId => allInventoryParts.find(p => p.id === partId)).filter(Boolean);
    
    if (parts.length === 0) return null;

    return (
      <div className="mt-2 pt-2 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood mb-1">Détail des pièces (Nomenclature) :</span>
        {parts.map(part => (
          <div key={part.id} className="flex justify-between items-center bg-white/40 px-2 py-1 rounded text-[9px] border border-cordel-master-dark/10">
            <span className="font-bold text-encre-noire truncate pr-2">{part.nom}</span>
            {part.status === 'À réparer' ? (
              <span className="text-red-600 font-bold shrink-0">En réparation</span>
            ) : (
              <span className="text-green-700 font-bold shrink-0">OK</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 text-left max-w-3xl mx-auto w-full select-none">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-2">
        <CordelButton variant="default" onClick={onBack} className="px-3 py-1 text-xs font-bold uppercase">
          ← {t('common.back')}
        </CordelButton>
        <span className="panel-title text-base font-black tracking-wider text-cordel-wood uppercase flex items-center gap-2">
          🎺 {translate('userProfile.instrumentsHeading', 'Mon Matériel & Instruments')}
        </span>
        <div className="w-12"></div>
      </div>

      {/* Description */}
      <p className="text-xs text-cordel-master-dark opacity-75 text-left leading-relaxed">
        Consultez la liste de vos instruments personnels, du matériel prêté par l'association et des instruments qui vous sont assignés au local.
      </p>

      {/* Content */}
      {loadingInst ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement de votre matériel...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-5 mt-2">
          {/* 1. Instruments Personnels */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-cordel-bg">
            <span className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
              <span>🎸 {t('userProfile.personalInsts')}</span>
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px]">{personal.length}</span>
            </span>

            {personal.length === 0 ? (
              <p className="text-xs italic text-cordel-master-dark/60 py-2">{t('userProfile.noPersonal')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {personal.map(inst => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex flex-col gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                        <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">{inst.type}</span>
                      </div>
                    </div>
                    <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-wood'} text-[7px] shrink-0`}>
                      {inst.etat}
                    </span>
                  </div>
                  {renderNomenclature(inst)}
                </CordelCard>
                ))}
              </div>
            )}
          </CordelCard>

          {/* 2. Matériel Emprunté */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-cordel-bg">
            <span className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
              <span>🎒 {t('userProfile.borrowedInsts')}</span>
              <span className="theme-stamp-badge theme-stamp-badge-dark text-[8px]">{borrowed.length}</span>
            </span>

            {borrowed.length === 0 ? (
              <p className="text-xs italic text-cordel-master-dark/60 py-2">{t('userProfile.noBorrowed')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {borrowed.map(inst => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex flex-col gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                          <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">Stock Association</span>
                        </div>
                      </div>
                      <span className={`theme-stamp-badge ${inst.etat === 'À réparer' ? 'border-red-600 text-red-600' : 'theme-stamp-badge-dark'} text-[7px] shrink-0`}>
                        {inst.etat}
                      </span>
                    </div>

                    {inst.kit && (
                      <div className="text-[9px] italic text-cordel-wood bg-cordel-wood/5 p-1.5 rounded border-l-2 border-cordel-wood">
                        <span className="font-bold">Kit :</span> {inst.kit}
                      </div>
                    )}

                    {renderNomenclature(inst)}

                    <div className="flex justify-end pt-1 gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          setReportInstrumentModal(inst);
                          setReportTargetPartId('ALL');
                          setReportDescription('');
                        }}
                        className="text-[9px] font-bold uppercase tracking-wider text-red-600 border border-red-600/30 hover:bg-red-600/10 px-2 py-1 rounded transition-colors"
                      >
                        ⚠️ Signaler une casse
                      </button>
                      
                      {inst.pendingMovement ? (
                        <span className="text-[9px] font-bold text-cordel-ocre bg-cordel-ocre/10 px-2 py-1 rounded border border-cordel-ocre/30">
                          ⏳ En attente de validation logistique
                        </span>
                      ) : (
                        <button
                          onClick={() => setMovementModalInst(inst)}
                          className="text-[9px] font-bold uppercase tracking-wider text-cordel-wood border border-cordel-wood/30 hover:bg-cordel-wood/10 px-2 py-1 rounded transition-colors"
                        >
                          🔄 Déclarer un mouvement
                        </button>
                      )}
                    </div>
                  </CordelCard>
                ))}
              </div>
            )}
          </CordelCard>

          {/* 3. Instruments assignés au local */}
          <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 bg-cordel-bg">
            <span className="font-extrabold text-xs uppercase tracking-wider text-cordel-wood flex items-center justify-between border-b border-dashed border-cordel-master-dark/15 pb-2">
              <span>🏠 {t('userProfile.localAssignedInsts')}</span>
              <span className="theme-stamp-badge theme-stamp-badge-ocre text-[8px]">{localAssigned.length}</span>
            </span>

            {localAssigned.length === 0 ? (
              <p className="text-xs italic text-cordel-master-dark/60 py-2">{t('userProfile.noLocal')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                {localAssigned.map(inst => (
                  <CordelCard key={inst.id} variant="default" useExtremeBorder={false} className="p-3 bg-white/50 dark:bg-black/20 flex flex-col gap-3 text-left hover:shadow-[2px_2px_0px_0px_#181716] transition-all">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={getInstrumentIconPath(inst.type)} alt={inst.type} className="w-6 h-6 object-contain shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold truncate text-encre-noire">{inst.nom}</span>
                          <span className="text-[9px] opacity-70 text-cordel-master-dark truncate">Au Local</span>
                        </div>
                      </div>
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] shrink-0">
                        {inst.etat}
                      </span>
                    </div>
                    {renderNomenclature(inst)}
                  </CordelCard>
                ))}
              </div>
            )}
          </CordelCard>

        </div>
      )}

      {/* MODAL DE DECLARATION DE MOUVEMENT */}
      {movementModalInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <CordelCard variant="default" useExtremeBorder={true} className="p-5 flex flex-col gap-4 relative">
              <button 
                onClick={() => setMovementModalInst(null)}
                className="absolute top-3 right-3 text-cordel-master-dark hover:text-cordel-wood"
              >
                <XiloClose size={14} />
              </button>

              <h3 className="text-sm font-extrabold text-cordel-wood uppercase tracking-wider flex items-center gap-2 border-b border-dashed border-cordel-wood/20 pb-2">
                🔄 Déclarer un mouvement
              </h3>

              <div className="text-xs font-bold text-encre-noire">
                Instrument : {movementModalInst.nom}
              </div>

              {movementModalInst.kit && (
                <div className="bg-cordel-ocre/10 border border-cordel-ocre/30 rounded p-2 text-[10px] text-cordel-wood leading-relaxed">
                  <span className="font-black">Attention :</span> Vous vous apprêtez à transférer cet instrument avec son kit complet : <span className="font-bold">{movementModalInst.kit}</span>.
                </div>
              )}

              <form onSubmit={handleSubmitMovement} className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                    Type de mouvement
                  </label>
                  <select 
                    value={movementType} 
                    onChange={(e) => setMovementType(e.target.value)}
                    className="theme-input text-xs font-bold py-1.5"
                    disabled={submittingMovement}
                  >
                    <option value="return_to_local">J'ai rendu cet instrument au local</option>
                    <option value="transfer">Je l'ai transmis à un autre membre</option>
                  </select>
                </div>

                {movementType === 'transfer' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      Membre cible
                    </label>
                    <select 
                      value={movementToUser} 
                      onChange={(e) => setMovementToUser(e.target.value)}
                      className="theme-input text-xs font-bold py-1.5"
                      required
                      disabled={submittingMovement || loadingUsers}
                    >
                      <option value="">-- Choisir un membre --</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                    Observations (Optionnel)
                  </label>
                  <textarea 
                    value={movementNote} 
                    onChange={(e) => setMovementNote(e.target.value)}
                    placeholder="Ex: Il manque une baguette, la fermeture de la housse est coincée..."
                    className="theme-input text-xs font-bold py-1.5 resize-none h-16"
                    disabled={submittingMovement}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
                  <CordelButton type="button" variant="default" onClick={() => setMovementModalInst(null)} disabled={submittingMovement} className="text-xs px-3 py-1.5">
                    Annuler
                  </CordelButton>
                  <CordelButton type="submit" variant="ocre" disabled={submittingMovement || (movementType === 'transfer' && !movementToUser)} className="text-xs px-4 py-1.5 font-bold">
                    {submittingMovement ? 'Envoi...' : 'Envoyer la déclaration'}
                  </CordelButton>
                </div>
              </form>
            </CordelCard>
          </div>
        </div>
      )}
      {/* Report Instrument Modal */}
      {reportInstrumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <CordelCard variant="default" className="w-full max-w-sm p-5 flex flex-col gap-4 relative bg-cordel-bg shadow-2xl">
            <button 
              type="button" 
              onClick={() => {
                setReportInstrumentModal(null);
                setReportTargetPartId('ALL');
                setReportDescription('');
              }}
              className="absolute top-3 right-3 p-1.5 border border-encre-noire bg-cordel-bg hover:bg-neutral-200 text-encre-noire rounded-md shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center"
            >
              <XiloClose size={10} />
            </button>
            
            <h3 className="text-sm font-extrabold text-cordel-wood uppercase tracking-wider pr-8 leading-tight">
              Signaler une casse
            </h3>
            
            <p className="text-xs text-cordel-master-dark opacity-90">
              Sur l'instrument <strong>{reportInstrumentModal.nom}</strong>.
            </p>

            <form onSubmit={handleSubmitReport} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-encre-noire">Que souhaitez-vous signaler ?</label>
                <select 
                  value={reportTargetPartId}
                  onChange={(e) => setReportTargetPartId(e.target.value)}
                  className="theme-input text-xs font-bold py-1.5"
                  disabled={submittingReport}
                >
                  <option value="ALL">L'instrument entier / Je ne sais pas</option>
                  {/* Optionnel: Pièces réelles si l'instrument a une nomenclature */}
                  {(reportInstrumentModal.nomenclature || []).map(partId => {
                    const p = allInventoryParts.find(x => x.id === partId);
                    return p ? <option key={p.id} value={p.id}>{p.nom} (En stock)</option> : null;
                  })}
                  {/* Optionnel: Pièces théoriques si modèle mais pas de nomenclature physique */}
                  {(!reportInstrumentModal.nomenclature || reportInstrumentModal.nomenclature.length === 0) && reportInstrumentModal.modelId && (() => {
                    const model = instrumentModels.find(m => m.id === reportInstrumentModal.modelId);
                    return (model?.parts || []).map(p => (
                      <option key={p.id} value={p.id}>{p.nom} (Modèle)</option>
                    ));
                  })()}
                </select>
              </div>

              {(() => {
                if (reportTargetPartId !== 'ALL') {
                  const isInvPart = allInventoryParts.find(p => p.id === reportTargetPartId);
                  const typePiece = isInvPart ? isInvPart.typePiece : (() => {
                    const model = instrumentModels.find(m => m.id === reportInstrumentModal.modelId);
                    const mp = model?.parts?.find(p => p.id === reportTargetPartId);
                    return mp?.typePiece;
                  })();
                  
                  if (typePiece) {
                    const compatibleParts = allInventoryParts.filter(p => p.status === 'En stock' && p.typePiece === typePiece);
                    if (compatibleParts.length > 0) {
                      return (
                        <div className="bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 p-2 rounded text-[10px] text-[#2d6a4f]">
                          <span className="font-black">Bonne nouvelle :</span> L'atelier dispose de {compatibleParts.length} pièce(s) de type "{typePiece}" en stock pour un remplacement éventuel.
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-[#8b2a1a]/10 border border-[#8b2a1a]/30 p-2 rounded text-[10px] text-[#8b2a1a]">
                          <span className="font-black">Information :</span> L'atelier n'a actuellement aucune pièce de type "{typePiece}" en stock. Le responsable logistique sera notifié.
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-encre-noire">Description du problème</label>
                <textarea
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  className="theme-input text-xs py-2 min-h-[80px]"
                  placeholder="Expliquez ce qui est cassé ou défectueux..."
                  required
                />
              </div>

              <CordelButton 
                type="submit" 
                variant="vert" 
                useExtremeBorder={true}
                disabled={submittingReport || !reportDescription.trim()}
                className="w-full text-xs font-bold"
              >
                {submittingReport ? 'Envoi...' : 'Envoyer le signalement'}
              </CordelButton>
            </form>
          </CordelCard>
        </div>
      )}
    </div>
  );
}
