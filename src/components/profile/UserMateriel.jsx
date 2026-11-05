import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTranslation } from '../LanguageContext';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { XiloClose } from '../XiloIcons';
import useHardwareBack from '../../hooks/useHardwareBack';
import { doc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { notifyMembersByTag } from '../../utils/inAppNotificationService';
import UserMaterielAccordionCards from './UserMaterielAccordionCards';

/**
 * UserMateriel Component
 * Displays member's personal instruments, borrowed association gear, and local assigned instruments.
 */
export default function UserMateriel({ user, profileData }) {
  const { t } = useTranslation();
  const { myInstruments, loadingInst } = useUserProfile(user, profileData, t);

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

  useHardwareBack(!!movementModalInst, () => setMovementModalInst(null));
  useHardwareBack(!!reportInstrumentModal, () => setReportInstrumentModal(null));

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
      alert(t('logistics.pleaseSelectMemberForTransfer'));
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

      // Notification interne pour le pôle Logistique & Matériel
      try {
        const userName = `${profileData?.prenom || user?.prenom || ''} ${profileData?.nom || user?.nom || ''}`.trim() || 'Un adhérent';
        const nomInstrument = movementModalInst?.nom || 'un instrument';
        notifyMembersByTag({
          groupId: profileData?.groupId || 'o-girador',
          tags: ['Logistique', 'logistique', 'Matériel', 'materiel'],
          title: "📦 Mouvement d'instrument à valider",
          message: `${userName} déclare un retour ou prêt pour ${nomInstrument}`,
          targetUrl: "/app/logistics?tab=inventaire",
          icon: "📦"
        }).catch((err) => console.warn("UserMateriel - Notification mouvement ignorée :", err));
      } catch (notifErr) {
        console.warn("UserMateriel - Erreur notification mouvement :", notifErr);
      }

      setMovementModalInst(null);
      setMovementType('return_to_local');
      setMovementToUser('');
      setMovementNote('');
    } catch (err) {
      console.error("UserMateriel - Erreur lors de la déclaration :", err);
      alert(t('logistics.errorSendingDeclaration'));
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
        link: '/app/logistics?tab=inventaire',
        createdAt: serverTimestamp(),
        targetRoles: ['mestre', 'admin', 'logisticien'] // Destinataires
      });

      // Notification interne pour le pôle Logistique, Matériel et Lutherie
      try {
        const userName = `${profileData?.prenom || user?.prenom || ''} ${profileData?.nom || user?.nom || ''}`.trim() || 'Un adhérent';
        const nomInstrument = inst?.nom || 'un instrument';
        notifyMembersByTag({
          groupId: profileData?.groupId || 'o-girador',
          tags: ['Logistique', 'logistique', 'Matériel', 'materiel', 'Lutherie'],
          title: "⚠️ Signalement matériel",
          message: `${userName} a signalé une anomalie sur ${nomInstrument}`,
          targetUrl: "/app/logistics?tab=inventaire",
          icon: "⚠️"
        }).catch((err) => console.warn("UserMateriel - Notification casse ignorée :", err));
      } catch (notifErr) {
        console.warn("UserMateriel - Erreur notification casse :", notifErr);
      }

      setReportInstrumentModal(null);
      setReportDescription('');
      setReportTargetPartId('ALL');
    } catch (err) {
      console.error("Erreur lors du signalement :", err);
      alert(t('logistics.errorReportingBreakage'));
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 text-left w-full max-w-none select-none">
      {/* Notice d'introduction (sans bouton Retour redondant) */}
      <p className="text-xs text-cordel-master-dark opacity-75 text-left leading-relaxed">
        {t('logistics.myInstrumentsNotice')}
      </p>

      {/* Contenu en 3 accordéons pliables (repliés par défaut si compteur à 0) */}
      {loadingInst ? (
        <div className="flex justify-center items-center py-12">
          <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">{t('logistics.loadingYourMaterial')}</span>
        </div>
      ) : (
        <UserMaterielAccordionCards
          personal={personal}
          borrowed={borrowed}
          localAssigned={localAssigned}
          allInventoryParts={allInventoryParts}
          onOpenReportModal={(inst) => {
            setReportInstrumentModal(inst);
            setReportTargetPartId('ALL');
            setReportDescription('');
          }}
          onOpenMovementModal={(inst) => setMovementModalInst(inst)}
          t={t}
        />
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
                {t('logistics.declareMovementTitle')}
              </h3>

              <div className="text-xs font-bold text-encre-noire">
                {t('logistics.instrumentLabel')} {movementModalInst.nom}
              </div>

              {movementModalInst.kit && (
                <div className="bg-cordel-ocre/10 border border-cordel-ocre/30 rounded p-2 text-[10px] text-cordel-wood leading-relaxed">
                  <span className="font-black">{t('logistics.warningLabel')}</span> {t('logistics.transferFullKitWarning')} <span className="font-bold">{movementModalInst.kit}</span>.
                </div>
              )}

              <form onSubmit={handleSubmitMovement} className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                    {t('logistics.movementTypeField')}
                  </label>
                  <select 
                    value={movementType} 
                    onChange={(e) => setMovementType(e.target.value)}
                    className="theme-input text-xs font-bold py-1.5"
                    disabled={submittingMovement}
                  >
                    <option value="return_to_local">{t('logistics.returnedInstrumentToLocal')}</option>
                    <option value="transfer">{t('logistics.transferredToAnotherMember')}</option>
                  </select>
                </div>

                {movementType === 'transfer' && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                      {t('logistics.targetMemberField')}
                    </label>
                    <select 
                      value={movementToUser} 
                      onChange={(e) => setMovementToUser(e.target.value)}
                      className="theme-input text-xs font-bold py-1.5"
                      required
                      disabled={submittingMovement || loadingUsers}
                    >
                      <option value="">{t('logistics.chooseMemberPrompt')}</option>
                      {usersList.map(u => (
                        <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
                    {t('logistics.observationsOptionalField')}
                  </label>
                  <textarea 
                    value={movementNote} 
                    onChange={(e) => setMovementNote(e.target.value)}
                    placeholder={t('logistics.observationsPlaceholder')}
                    className="theme-input text-xs font-bold py-1.5 resize-none h-16"
                    disabled={submittingMovement}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
                  <CordelButton type="button" variant="default" onClick={() => setMovementModalInst(null)} disabled={submittingMovement} className="text-xs px-3 py-1.5">
                    {t('logistics.btnCancel')}
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
              {t('logistics.reportBreakageTitle')}
            </h3>
            
            <p className="text-xs text-cordel-master-dark opacity-90">
              {t('logistics.onInstrumentNotice')} <strong>{reportInstrumentModal.nom}</strong>.
            </p>

            <form onSubmit={handleSubmitReport} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-encre-noire">{t('logistics.whatDoYouWantToReport')}</label>
                <select 
                  value={reportTargetPartId}
                  onChange={(e) => setReportTargetPartId(e.target.value)}
                  className="theme-input text-xs font-bold py-1.5"
                  disabled={submittingReport}
                >
                  <option value="ALL">{t('logistics.wholeInstrumentOrUnsure')}</option>
                  {/* Optionnel: Pièces réelles si l'instrument a une nomenclature */}
                  {(reportInstrumentModal.nomenclature || []).map(partId => {
                    const p = allInventoryParts.find(x => x.id === partId);
                    return p ? <option key={p.id} value={p.id}>{p.nom} {t('logistics.inStockParentheses')}</option> : null;
                  })}
                  {/* Optionnel: Pièces théoriques si modèle mais pas de nomenclature physique */}
                  {(!reportInstrumentModal.nomenclature || reportInstrumentModal.nomenclature.length === 0) && reportInstrumentModal.modelId && (() => {
                    const model = instrumentModels.find(m => m.id === reportInstrumentModal.modelId);
                    return (model?.parts || []).map(p => (
                      <option key={p.id} value={p.id}>{p.nom} {t('logistics.modelParentheses')}</option>
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
                        <div className="bg-[var(--color-cordel-vert)]/10 border border-[#2d6a4f]/30 p-2 rounded text-[10px] text-[var(--color-cordel-vert)]">
                          <span className="font-black">{t('logistics.goodNewsBadge')}</span> {t('logistics.workshopHasPartsPrefix')} {compatibleParts.length} {t('logistics.partsOfTypeMiddle')}{typePiece}{t('logistics.partsInStockForReplacementSuffix')}
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]/30 p-2 rounded text-[10px] text-[var(--theme-primary)]">
                          <span className="font-black">{t('logistics.informationBadge')}</span> {t('logistics.workshopHasNoPartsPrefix')}{typePiece}{t('logistics.logisticsOfficerWillBeNotifiedSuffix')}
                        </div>
                      );
                    }
                  }
                }
                return null;
              })()}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase text-encre-noire">{t('logistics.problemDescriptionField')}</label>
                <textarea
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  className="theme-input text-xs py-2 min-h-[80px]"
                  placeholder={t('logistics.explainProblemPlaceholder')}
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
