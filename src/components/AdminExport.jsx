import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';
import { XiloScroll, XiloPeople } from './XiloIcons';
import AdminExportModal from './admin/AdminExportModal';
import { formatPratiques, getPratiquesList } from '../utils/instrumentUtils';

export default function AdminExport({ user, profileData, onBack }) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const columnsConfig = {
    identity: {
      label: t('export.catIdentity', "Identité & Contact"),
      fields: [
        { key: 'nom', label: t('export.nom', 'Nom'), defaultSelected: true },
        { key: 'prenom', label: t('export.prenom', 'Prénom'), defaultSelected: true },
        { key: 'email', label: t('export.email', 'Email'), defaultSelected: true },
        { key: 'telephone', label: t('export.telephone', 'Téléphone'), defaultSelected: true },
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

  // Charger association settings (adhesion fee amount, options description, etc.)
  useEffect(() => {
    if (!profileData?.groupId) return;
    const assocRef = doc(db, 'associations', profileData.groupId);
    getDoc(assocRef).then((snap) => {
      if (snap.exists()) {
        setAssociationSettings(snap.data());
      }
    }).catch(err => {
      console.error("AdminExport - Error fetching association settings:", err);
    });
  }, [profileData?.groupId]);

  // Charger group members in real-time
  useEffect(() => {
    if (!profileData?.groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const usersRef = collection(db, 'users');
    const q = profileData.isSystemAdmin === true
      ? query(usersRef)
      : query(usersRef, where('groupId', '==', profileData.groupId));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMembers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // We only export active members by default, as requested for association active roster
        const isActive = !data.statutActuel || data.statutActuel === 'active';
        if (isActive) {
          fetchedMembers.push({
            id: doc.id,
            ...data
          });
        }
      });
      // Trier users by last name
      fetchedMembers.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
      setMembers(fetchedMembers);
      setLoading(false);
    }, (error) => {
      console.error("AdminExport - Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profileData?.groupId, profileData?.isSystemAdmin]);

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

  // Filtrer members list based on search bar query & role filter
  const filteredMembers = members.filter(member => {
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
          return tRole(val || 'membre', member.genre);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
              <XiloPeople size={16} className="inline" /> Annuaire des membres ({filteredMembers.length})
            </h3>
            <CordelButton
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 ml-2 cursor-pointer"
            >
              📥 Exporter les données
            </CordelButton>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Filtre de rôle */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="theme-input text-xs font-bold py-1 px-2 bg-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="mestre">Mestre</option>
              <option value="admin">Administrateur</option>
              <option value="bureau">Bureau</option>
              <option value="ca">Conseil d'Administration</option>
              <option value="membre">Adhérent</option>
            </select>

            {/* Barre de recherche textuelle */}
            <input
              type="text"
              placeholder="Rechercher nom, email, instrument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="theme-input text-xs w-full md:w-64"
            />
          </div>
        </div>

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
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">Nom complet</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">Email</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">Téléphone</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">Rôle</th>
                  <th className="px-2 py-2 md:px-4 md:py-2.5 text-left">Instruments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cordel-master-dark/5 text-xs font-semibold text-encre-noire">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-2 py-2 md:px-4 md:py-2.5 font-bold truncate max-w-[150px]">
                      {member.prenom} {member.nom}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-2.5 truncate max-w-[200px]">
                      {member.email}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-2.5 whitespace-nowrap">
                      {member.telephone || "-"}
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-2.5 whitespace-nowrap">
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] border-dashed">
                        {tRole(member.role || 'membre', member.genre)}
                      </span>
                    </td>
                    <td className="px-2 py-2 md:px-4 md:py-2.5 max-w-[240px]">
                      {(() => {
                        const pratiques = getPratiquesList(member);
                        if (pratiques.length === 0) {
                          return (
                            <span className="opacity-50 text-[11px]">
                              {member.statutActuel === 'en_attente' ? 'En attente' : '-'}
                            </span>
                          );
                        }
                        return (
                          <div className="flex flex-wrap gap-1 items-center">
                            {pratiques.map((pratique, pIdx) => {
                              const isDanse = typeof pratique === 'string' && pratique.toLowerCase().includes('danse');
                              return (
                                <span
                                  key={`${member.id}-prat-${pIdx}`}
                                  className={`theme-stamp-badge ${
                                    isDanse 
                                      ? 'theme-stamp-badge-ocre text-[8px] bg-amber-500/15 border-amber-800/40 text-amber-950 font-black' 
                                      : 'theme-stamp-badge-wood text-[8px]'
                                  } px-1.5 py-0.5 normal-case font-bold inline-flex items-center gap-1 shadow-none`}
                                >
                                  {isDanse ? '💃' : '🥁'} {pratique}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
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
    </div>
  );
}
