import React, { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';
import { XiloScroll } from './XiloIcons';
import AdminExportModal from './admin/AdminExportModal';
import AdminDirectoryFilterBar from './admin/AdminDirectoryFilterBar';
import AdminDirectoryMemberRow from './admin/AdminDirectoryMemberRow';
import ManualMemberModal from './directory/ManualMemberModal';
import { formatPratiques, getPratiquesList } from '../utils/instrumentUtils';
import { useAssociationMembers } from '../hooks/useAssociationMembers';
import useConfirm from '../hooks/useConfirm';
import { isMemberArchived } from '../utils/memberUtils';
import { archiveMember, unarchiveMember } from '../services/memberArchiveService';
import { getMemberPushDiagnosticBadge } from '../utils/pushDiagnosticsUtils';

export default function AdminExport({ user: _user, profileData, groupId: propGroupId, onBack }) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();
  const { confirm } = useConfirm();

  // Synchronisation unifiée et multi-tenant des adhérents de l'association active
  const { currentGroupId, members, loading } = useAssociationMembers({
    groupId: propGroupId,
    profileData
  });
  const [associationSettings, setAssociationSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'archived' | 'all'
  const [pushFilter, setPushFilter] = useState('all'); // 'all' | 'reachable' | 'unreachable'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Droits pour inscrire manuellement un membre : Admin, Mestre, Bureau ou Secrétariat
  const canCreateMember = Boolean(
    profileData?.isSystemAdmin ||
    ['mestre', 'admin', 'super-admin'].includes((profileData?.role || '').toLowerCase()) ||
    (profileData?.tags || []).some(t => {
      const tagStr = (typeof t === 'string' ? t : (t.id || t.nomM || '')).toLowerCase();
      return tagStr.includes('bureau') || tagStr.includes('secrétariat') || tagStr.includes('secretariat') || tagStr.includes('ca');
    })
  );

  const columnsConfig = {
    identity: {
      label: t('export.catIdentity', "Identité & Contact"),
      fields: [
        { key: 'nom', label: t('export.nom', 'Nom'), defaultSelected: true },
        { key: 'prenom', label: t('export.prenom', 'Prénom'), defaultSelected: true },
        { key: 'email', label: t('export.email', 'Email'), defaultSelected: true },
        { key: 'telephone', label: t('export.telephone', 'Téléphone'), defaultSelected: true },
        { key: 'pushReachable', label: t('export.pushReachable', 'Notifications Push'), defaultSelected: true },
        { key: 'adresse', label: t('export.adresse', 'Adresse physique'), defaultSelected: false }
      ]
    },
    artistic: {
      label: t('export.catArtistic', "Profil Artistique"),
      fields: [
        { key: 'instrumentsJoues', label: t('export.instrumentsJoues', 'Instruments joués'), defaultSelected: true },
        { key: 'niveau', label: t('export.niveauPercu', 'Niveaux de percussion'), defaultSelected: false },
        { key: 'niveauDanse', label: t('export.niveauDanse', 'Niveau de Danse'), defaultSelected: false }
      ]
    },
    roles: {
      label: t('export.catRoles', "Rôles & Statuts"),
      fields: [
        { key: 'role', label: t('export.role', 'Rôle'), defaultSelected: true },
        { key: 'tags', label: t('export.tags', 'Badges / Étiquettes'), defaultSelected: false }
      ]
    },
    treasury: {
      label: t('export.catTreasury', "Trésorerie"),
      fields: [
        { key: 'paymentStatus', label: t('export.paymentStatus', 'Statut de paiement'), defaultSelected: false },
        { key: 'adhesionBase', label: t('export.adhesionBase', 'Adhésion de base'), defaultSelected: false },
        { key: 'selectedOptions', label: t('export.selectedOptions', 'Options cochées'), defaultSelected: false },
        { key: 'montantTotal', label: t('export.montantTotal', 'Montant total'), defaultSelected: false },
        { key: 'anneeEnCours', label: t('export.anneeEnCours', 'Année en cours'), defaultSelected: false }
      ]
    },
    logistics: {
      label: t('export.catLogistics', "Logistique & Santé"),
      fields: [
        { key: 'dietaryRestrictions', label: t('export.dietaryRestrictions', 'Régime / Préférences alimentaires'), defaultSelected: false },
        { key: 'allergies', label: t('export.allergies', 'Allergies & Précisions'), defaultSelected: false }
      ]
    }
  };

  const [checkedFields, setCheckedFields] = useState(() => {
    const initial = {};
    Object.values(columnsConfig).forEach(cat => {
      cat.fields.forEach(field => {
        initial[field.key] = field.defaultSelected;
      });
    });
    return initial;
  });

  // Charger les paramètres de l'association active (tarifs, options de cotisation, etc.)
  useEffect(() => {
    if (!currentGroupId) {
      setAssociationSettings(null);
      return;
    }
    const assocRef = doc(db, 'associations', currentGroupId);
    getDoc(assocRef).then((snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      } else if (currentGroupId.toLowerCase() !== currentGroupId) {
        // Secours si l'identifiant est stocké en minuscules
        getDoc(doc(db, 'associations', currentGroupId.toLowerCase())).then((fallbackSnap) => {
          if (fallbackSnap.exists()) {
            setAssociationSettings(fallbackSnap.data());
          }
        }).catch(() => {});
      }
    }).catch(err => {
      console.error("AdminExport - Erreur chargement configuration association :", err);
    });
  }, [currentGroupId]);

  const activeCount = useMemo(() => members.filter(m => !isMemberArchived(m)).length, [members]);
  const archivedCount = useMemo(() => members.filter(m => isMemberArchived(m)).length, [members]);
  const reachableActiveCount = useMemo(
    () => members.filter(m => !isMemberArchived(m) && Array.isArray(m.fcmTokens) && m.fcmTokens.length > 0).length,
    [members]
  );

  const handleToggleArchiveMember = async (targetMember) => {
    if (!targetMember?.id) return;
    const isArchived = isMemberArchived(targetMember);
    const memberName = `${targetMember.prenom || ''} ${targetMember.nom || ''}`.trim() || 'ce membre';

    if (isArchived) {
      const confirmed = await confirm({
        title: "Désarchiver le membre",
        message: `Voulez-vous réactiver ${memberName} dans l'association ? Son accès à l'application sera rétabli.`,
        confirmText: "Oui, réactiver",
        cancelText: "Annuler",
        variant: "warning"
      });
      if (!confirmed) return;

      setActionLoadingId(targetMember.id);
      try {
        await unarchiveMember(targetMember.id);
        alert(`Le membre ${memberName} a été réactivé avec succès.`);
      } catch (err) {
        console.error("Erreur lors de la réactivation :", err);
        alert("Une erreur est survenue lors de la réactivation.");
      } finally {
        setActionLoadingId(null);
      }
    } else {
      const confirmed = await confirm({
        title: "Archiver le membre",
        message: `Voulez-vous vraiment archiver ${memberName} ?\n\nSon accès à l'application sera suspendu et il sera automatiquement retiré des inscriptions (RSVP), du covoiturage et du plan de scène de tous les événements à venir. L'historique des événements passés sera intégralement préservé.`,
        confirmText: "Oui, archiver",
        cancelText: "Annuler",
        variant: "danger"
      });
      if (!confirmed) return;

      setActionLoadingId(targetMember.id);
      try {
        const result = await archiveMember(targetMember.id, currentGroupId);
        if (result.modifiedEventsCount > 0) {
          alert(`Le membre ${memberName} a été archivé.\n${result.modifiedEventsCount} événement(s) à venir mis à jour.`);
        } else {
          alert(`Le membre ${memberName} a été archivé avec succès.`);
        }
      } catch (err) {
        console.error("Erreur lors de l'archivage :", err);
        alert("Une erreur est survenue lors de l'archivage.");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleCheckboxChange = (fieldKey) => {
    setCheckedFields(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleToggleCategory = (catKey, allChecked) => {
    const category = columnsConfig[catKey];
    setCheckedFields(prev => {
      const updated = { ...prev };
      category.fields.forEach(field => {
        updated[field.key] = !allChecked;
      });
      return updated;
    });
  };

  // Filtrer members list based on search bar query, role filter & status filter
  const filteredMembers = members.filter(member => {
    // 0. Filtre par statut d'archivage
    const isArchived = isMemberArchived(member);
    if (statusFilter === 'active' && isArchived) return false;
    if (statusFilter === 'archived' && !isArchived) return false;

    // 0b. Filtre par joignabilité Push
    const isPushReachable = Array.isArray(member.fcmTokens) && member.fcmTokens.length > 0;
    if (pushFilter === 'reachable' && !isPushReachable) return false;
    if (pushFilter === 'unreachable' && isPushReachable) return false;

    // 1. Filtre par rôle
    if (roleFilter !== 'all') {
      const mRole = (member.role || 'membre').toLowerCase();
      if (roleFilter === 'bureau' || roleFilter === 'ca') {
        const hasTag = (member.tags || []).some(t => (t.nom || t.id || t).toLowerCase().includes(roleFilter));
        if (mRole !== roleFilter && !hasTag) return false;
      } else if (mRole !== roleFilter) {
        return false;
      }
    }

    // 2. Recherche textuelle multi-champs
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const email = (member.email || '').toLowerCase();
    const phone = (member.telephone || '').toLowerCase();
    const instr = formatPratiques(member).toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    if (!query) return true;
    return fullName.includes(query) || email.includes(query) || phone.includes(query) || instr.includes(query);
  });

  const exportToCSV = () => {
    // 1. Build headers
    const activeHeaders = [];
    const fieldMapping = []; // Array of { key, catKey, label }

    Object.entries(columnsConfig).forEach(([catKey, category]) => {
      category.fields.forEach(field => {
        if (checkedFields[field.key]) {
          activeHeaders.push(field.label);
          fieldMapping.push({ key: field.key, catKey, label: field.label });
        }
      });
    });

    if (fieldMapping.length === 0) {
      alert("Veuillez sélectionner au moins une colonne à exporter.");
      return;
    }

    // Calculer base price and options mapping
    const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
      ? associationSettings.montantAdhesion 
      : (associationSettings?.montantCotisation || 0);

    const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
      ? associationSettings.optionsCotisation 
      : [];

    const currentYear = new Date().getFullYear();

    // 2. Build rows
    const rows = filteredMembers.map(member => {
      return fieldMapping.map(field => {
        const val = member[field.key];
        
        // Custom formatting based on field key
        if (field.key === 'pushReachable') {
          const diag = getMemberPushDiagnosticBadge(member);
          return diag.isReachable
            ? 'Joignable (Oui)'
            : `Non joignable (${diag.label})`;
        }
        if (field.key === 'instrumentsJoues') {
          return formatPratiques(member);
        }
        if (field.key === 'niveau') {
          return val === 'confirme' ? 'Confirmé' : val === 'debutant' ? 'Débutant' : 'Aucun';
        }
        if (field.key === 'niveauDanse') {
          return val === 'confirme' ? 'Confirmé' : val === 'debutant' ? 'Débutant' : 'Aucun';
        }
        if (field.key === 'role') {
          return (val === 'membre' || !val)
            ? (member.genre === 'femme' ? t('secretariat.badgeMemberFem') : t('secretariat.badgeMemberMasc'))
            : tRole(val, member.genre);
        }
        if (field.key === 'tags') {
          return Array.isArray(val) ? val.join(', ') : '';
        }
        if (field.key === 'adhesionBase') {
          return val !== false ? 'Oui' : 'Non';
        }
        if (field.key === 'selectedOptions') {
          return (member.selectedOptions || [])
            .map(optId => {
              const opt = optionsCotisation.find(o => o.id === optId);
              return opt ? opt.nom : null;
            })
            .filter(Boolean)
            .join(', ');
        }
        if (field.key === 'montantTotal') {
          const hasBase = member.adhesionBase !== false;
          const baseAmount = hasBase ? parseFloat(baseAdhesionAmount) || 0 : 0;
          const optionsAmount = (member.selectedOptions || []).reduce((sum, optId) => {
            const opt = optionsCotisation.find(o => o.id === optId);
            return sum + (opt ? parseFloat(opt.montant) || 0 : 0);
          }, 0);
          return baseAmount + optionsAmount;
        }
        if (field.key === 'anneeEnCours') {
          return currentYear;
        }
        if (field.key === 'paymentStatus') {
          if (val === 'paid') return 'À jour';
          if (val === 'partial') return 'Partiel';
          return 'Non payé';
        }
        if (field.key === 'adresse') {
          if (member.adresseRue || member.adresseCP || member.adresseVille) {
            return [member.adresseRue, member.adresseCP, member.adresseVille].filter(Boolean).join(', ');
          }
          return member.adresse || member.adressePhysique || '';
        }
        if (field.key === 'dietaryRestrictions') {
          return Array.isArray(val) ? val.join(', ') : (val || '');
        }
        if (field.key === 'allergies') {
          return val || '';
        }

        // Default formatting
        if (val === undefined || val === null) return '';
        return String(val);
      });
    });

    // 3. Formater CSV string
    // MS Excel France requirement: semicolon separator, UTF-8 BOM, double quotes around values
    const csvContent = "\uFEFF" + [activeHeaders, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    // 4. Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Timestamped name: O_Girador_Membres_YYYY-MM-DD.csv
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `O_Girador_Membres_${dateStr}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center border-b-2 border-dashed border-cordel-master-dark/30 pb-3 select-none">
        <CordelButton variant="default" onClick={onBack} className="px-4 py-1.5 text-xs">
          ← {t('common.back') || "Retour"}
        </CordelButton>
        <span className="panel-title text-base font-extrabold tracking-wider text-cordel-wood uppercase flex items-center gap-2">
          <XiloScroll size={18} /> {t('menu.exportAnnu') || "Annuaire & Export"}
        </span>
        <div className="w-16" /> {/* Placeholder to balance back button */}
      </div>

      {/* Annuaire preview card (Annuaire des membres en premier) */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-5 flex flex-col gap-4">
        <AdminDirectoryFilterBar
          filteredCount={filteredMembers.length}
          reachableActiveCount={reachableActiveCount}
          activeCount={activeCount}
          archivedCount={archivedCount}
          totalCount={members.length}
          canCreateMember={canCreateMember}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          pushFilter={pushFilter}
          setPushFilter={setPushFilter}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          t={t}
        />

        {loading ? (
          <div className="text-center py-12">
            <span className="text-xs uppercase tracking-widest font-black animate-pulse opacity-60">⏳ Chargement de l'annuaire...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-cordel-master-dark/15 rounded-[4px_6px_3px_5px] bg-cordel-bg/30">
            <span className="text-xs font-bold opacity-60">Aucun membre ne correspond à votre recherche.</span>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto border border-dashed border-cordel-master-dark/20 rounded-[4px_6px_3px_5px]">
            <table className="min-w-full divide-y divide-cordel-master-dark/10 bg-cordel-bg/25">
              <thead>
                <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">{t('secretariat.thFullName') || "Nom complet"}</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">{t('secretariat.thEmail') || "Email"}</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">{t('secretariat.thPhone') || "Téléphone"}</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">{t('secretariat.thRole') || "Rôle"}</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">{t('secretariat.thInstruments') || "Instruments"}</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-right">{t('common.status') || "Statut & Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cordel-master-dark/5 text-xs font-semibold text-encre-noire">
                {filteredMembers.map(member => (
                  <AdminDirectoryMemberRow
                    key={member.id}
                    member={member}
                    getPratiquesList={getPratiquesList}
                    tRole={tRole}
                    t={t}
                    actionLoadingId={actionLoadingId}
                    canCreateMember={canCreateMember}
                    onToggleArchive={handleToggleArchiveMember}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CordelCard>

      {/* Modale d'exportation des données CSV */}
      <AdminExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        columnsConfig={columnsConfig}
        checkedFields={checkedFields}
        handleCheckboxChange={handleCheckboxChange}
        handleToggleCategory={handleToggleCategory}
        onExport={exportToCSV}
        membersCount={filteredMembers.length}
      />

      {/* Modale d'inscription manuelle par le Bureau */}
      <ManualMemberModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        groupId={currentGroupId}
        profileData={profileData}
        onMemberCreated={(newMember) => {
          if (newMember) {
            setMembers(prev => [newMember, ...prev]);
          }
        }}
      />
    </div>
  );
}
