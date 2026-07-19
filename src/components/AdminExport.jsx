import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import CordelCard from './CordelCard';
import CordelButton from './CordelButton';
import { useTranslation } from './LanguageContext';
import { useTerminologie } from '../hooks/useTerminologie';
import { XiloScroll, XiloPeople } from './XiloIcons';

export default function AdminExport({ user, profileData, onBack }) {
  const { t } = useTranslation();
  const { tRole } = useTerminologie();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [associationSettings, setAssociationSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const columnsConfig = {
    identity: {
      label: "Identité & Contact",
      fields: [
        { key: 'nom', label: 'Nom', defaultSelected: true },
        { key: 'prenom', label: 'Prénom', defaultSelected: true },
        { key: 'email', label: 'Email', defaultSelected: true },
        { key: 'telephone', label: 'Téléphone', defaultSelected: true },
        { key: 'adresse', label: 'Adresse physique', defaultSelected: false }
      ]
    },
    artistic: {
      label: "Profil Artistique",
      fields: [
        { key: 'instrumentsJoues', label: 'Instruments joués', defaultSelected: true },
        { key: 'niveau', label: 'Niveaux de percussion', defaultSelected: false },
        { key: 'niveauDanse', label: 'Niveau de Danse', defaultSelected: false }
      ]
    },
    roles: {
      label: "Rôles & Statuts",
      fields: [
        { key: 'role', label: 'Rôle', defaultSelected: true },
        { key: 'tags', label: 'Badges / Étiquettes', defaultSelected: false }
      ]
    },
    treasury: {
      label: "Trésorerie",
      fields: [
        { key: 'paymentStatus', label: 'Statut de paiement', defaultSelected: false },
        { key: 'adhesionBase', label: 'Adhésion de base', defaultSelected: false },
        { key: 'selectedOptions', label: 'Options cochées', defaultSelected: false },
        { key: 'montantTotal', label: 'Montant total', defaultSelected: false },
        { key: 'anneeEnCours', label: 'Année en cours', defaultSelected: false }
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

  // Load association settings (adhesion fee amount, options description, etc.)
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

  // Load group members in real-time
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
      // Sort users by last name
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

  // Filter members list based on search bar query
  const filteredMembers = members.filter(member => {
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const email = (member.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
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

    // Calculate base price and options mapping
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
          return Array.isArray(val) ? val.join(', ') : (member.instrument || '');
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

        // Default formatting
        if (val === undefined || val === null) return '';
        return String(val);
      });
    });

    // 3. Format CSV string
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <XiloPeople size={16} className="inline" /> Annuaire des membres ({filteredMembers.length})
          </h3>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-input w-full md:w-80"
          />
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
          <div className="overflow-x-auto border border-dashed border-cordel-master-dark/20 rounded-[4px_6px_3px_5px]">
            <table className="min-w-full divide-y divide-cordel-master-dark/10 bg-cordel-bg/25">
              <thead>
                <tr className="bg-cordel-master-dark/5 text-[9px] font-black uppercase tracking-wider text-cordel-master-dark">
                  <th className="px-4 py-2.5 text-left">Nom complet</th>
                  <th className="px-4 py-2.5 text-left">Email</th>
                  <th className="px-4 py-2.5 text-left">Téléphone</th>
                  <th className="px-4 py-2.5 text-left">Rôle</th>
                  <th className="px-4 py-2.5 text-left">Instruments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cordel-master-dark/5 text-xs font-semibold text-encre-noire">
                {filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-cordel-bg/40 transition-colors">
                    <td className="px-4 py-2.5 font-bold truncate max-w-[150px]">
                      {member.prenom} {member.nom}
                    </td>
                    <td className="px-4 py-2.5 truncate max-w-[200px]">
                      {member.email}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {member.telephone || "-"}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="theme-stamp-badge theme-stamp-badge-wood text-[7.5px] border-dashed">
                        {tRole(member.role || 'membre', member.genre)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 truncate max-w-[220px]">
                      {Array.isArray(member.instrumentsJoues) && member.instrumentsJoues.length > 0 
                        ? member.instrumentsJoues.join(', ')
                        : member.instrument || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CordelCard>

      {/* Main Instructions & Export trigger (Colonnes à inclure et Générateur CSV en dessous) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Selection details (spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <CordelCard variant="default" useExtremeBorder={false} className="p-5">
            <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood mb-4">
              Colonnes à inclure dans l'export
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(columnsConfig).map(([catKey, category]) => {
                const catFields = category.fields;
                const checkedCount = catFields.filter(f => checkedFields[f.key]).length;
                const allChecked = checkedCount === catFields.length;

                return (
                  <div key={catKey} className="border border-dashed border-cordel-master-dark/15 p-4 rounded-[4px_6px_3px_5px] bg-cordel-bg/50">
                    <div className="flex justify-between items-center mb-3 pb-1.5 border-b border-dashed border-cordel-master-dark/10">
                      <span className="font-extrabold text-xs text-encre-noire flex items-center gap-1.5">
                        {category.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(catKey, allChecked)}
                        className="text-[9px] font-black uppercase tracking-widest text-cordel-wood hover:opacity-80 transition-opacity cursor-pointer border border-dashed border-cordel-wood/30 px-1.5 py-0.5 rounded bg-white/40"
                      >
                        {allChecked ? "Aucun" : "Tous"}
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {catFields.map(field => (
                        <label 
                          key={field.key} 
                          className="flex items-center gap-2 text-xs font-semibold text-encre-noire cursor-pointer select-none py-0.5 hover:translate-x-[2px] transition-transform"
                        >
                          <input
                            type="checkbox"
                            checked={checkedFields[field.key] || false}
                            onChange={() => handleCheckboxChange(field.key)}
                            className="w-3.5 h-3.5 border-2 border-encre-noire text-cordel-wood rounded-sm focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <span>{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CordelCard>
        </div>

        {/* Right column: Action Trigger */}
        <div className="flex flex-col gap-6">
          <CordelCard variant="ocre" useExtremeBorder={true} className="p-5 flex flex-col justify-between h-full">
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-encre-noire mb-1">
                Générateur CSV
              </h3>
              <p className="text-xs font-semibold text-encre-noire/80 leading-relaxed">
                Ce bouton génère un fichier tableur CSV configuré spécifiquement pour Microsoft Excel France.
              </p>
              <div className="flex flex-col gap-2 text-[10px] font-semibold text-encre-noire/70 border-t border-dashed border-encre-noire/25 pt-3 mt-1">
                <span className="flex items-center gap-1.5">✔️ Séparateur : point-virgule (;)</span>
                <span className="flex items-center gap-1.5">✔️ Encodage : UTF-8 avec BOM (accents préservés)</span>
                <span className="flex items-center gap-1.5">✔️ Total : <strong className="text-sm text-encre-noire">{filteredMembers.length} membres</strong></span>
              </div>
            </div>
            
            <CordelButton 
              type="button"
              variant="default"
              onClick={exportToCSV}
              className="w-full mt-6 py-2.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#181716] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#181716] hover:scale-[1.01]"
            >
              📥 Exporter les données (CSV)
            </CordelButton>
          </CordelCard>
        </div>
      </div>
    </div>
  );
}
