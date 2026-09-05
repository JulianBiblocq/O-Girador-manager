import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import MemberTreasuryRow from '../MemberTreasuryRow';
import { useTranslation } from '../LanguageContext';
import CotisationsBlock from '../association-settings/blocks/CotisationsBlock';
import FormulesManager from '../association-settings/FormulesManager';

export default function TreasuryCotisations({
  members = [],
  associationSettings,
  helloAssoSignatureKey,
  savingSettings,
  handleSaveAssociationSettings,
  groupId,
  cautionsByMember = {},
  handleUpdateCaution
}) {
  const { t } = useTranslation();

  // États de recherche et de filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCaution, setFilterCaution] = useState('all');

  // État de l'accordéon de configuration
  const [showConfig, setShowConfig] = useState(false);

  // État du formulaire de configuration locale
  const [formConfig, setFormConfig] = useState({
    montantAdhesion: 0,
    montantCautionDefaut: 150,
    optionsCotisation: [],
    formulesAdhesion: [],
    lienPaiementExterne: '',
    instructionsPaiement: '',
    demanderDroitImage: false,
    demanderAttestationSante: false,
    helloAssoSignatureKey: ''
  });

  const [droitImageFile, setDroitImageFile] = useState(null);
  const [aptitudeMedicaleFile, setAptitudeMedicaleFile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'o-girador-7828c';
  const webhookUrl = `https://us-central1-${projectId}.cloudfunctions.net/helloAssoWebhook?groupId=${groupId}`;

  // Synchronisation des paramètres associatifs reçus
  useEffect(() => {
    if (associationSettings) {
      const existingFormules = Array.isArray(associationSettings.formulesAdhesion) && associationSettings.formulesAdhesion.length > 0
        ? associationSettings.formulesAdhesion
        : (Array.isArray(associationSettings.publicTheme?.formulesRecrutement) ? associationSettings.publicTheme.formulesRecrutement : []);

      setFormConfig({
        montantAdhesion: associationSettings.montantAdhesion !== undefined 
          ? associationSettings.montantAdhesion 
          : (associationSettings.montantCotisation || 0),
        montantCautionDefaut: associationSettings.montantCautionDefaut !== undefined
          ? associationSettings.montantCautionDefaut
          : 150,
        optionsCotisation: Array.isArray(associationSettings.optionsCotisation) 
          ? [...associationSettings.optionsCotisation] 
          : [],
        formulesAdhesion: existingFormules,
        lienPaiementExterne: associationSettings.lienPaiementExterne || '',
        instructionsPaiement: associationSettings.instructionsPaiement || '',
        demanderDroitImage: associationSettings.demanderDroitImage || false,
        demanderAttestationSante: associationSettings.demanderAttestationSante || false,
        helloAssoSignatureKey: helloAssoSignatureKey || ''
      });
    }
  }, [associationSettings, helloAssoSignatureKey]);

  // Statistiques globales
  const totalActive = members.length;
  const countPaid = members.filter(m => m.paymentStatus === 'paid').length;
  const countPartial = members.filter(m => m.paymentStatus === 'partial').length;
  const countExempted = members.filter(m => m.paymentStatus === 'exempted').length;
  const countUnpaid = members.filter(m => !m.paymentStatus || m.paymentStatus === 'unpaid').length;

  const baseAdhesionAmount = associationSettings?.montantAdhesion !== undefined 
    ? associationSettings.montantAdhesion 
    : (associationSettings?.montantCotisation || 0);

  const optionsCotisation = Array.isArray(associationSettings?.optionsCotisation) 
    ? associationSettings.optionsCotisation 
    : [];

  // Filtrage combiné des adhérents (Recherche, Statut Cotisation, Statut Caution)
  const filteredMembers = members.filter((member) => {
    const fullName = `${member.prenom || ''} ${member.nom || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    const status = member.paymentStatus || 'unpaid';
    const matchesStatus = filterStatus === 'all' || status === filterStatus;

    const caution = cautionsByMember?.[member.id] || { statutGlobal: 'na' };
    const matchesCaution = filterCaution === 'all' || caution.statutGlobal === filterCaution;

    return matchesSearch && matchesStatus && matchesCaution;
  });

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(err => {
      console.error("Erreur de copie :", err);
    });
  };

  const handleConfigChange = (key, value) => {
    setFormConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddOption = () => {
    setFormConfig(prev => ({
      ...prev,
      optionsCotisation: [
        ...prev.optionsCotisation,
        {
          id: `cot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          nom: '',
          montant: 0
        }
      ]
    }));
  };

  const handleRemoveOption = (idx) => {
    setFormConfig(prev => ({
      ...prev,
      optionsCotisation: prev.optionsCotisation.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      const updates = {
        montantAdhesion: parseFloat(formConfig.montantAdhesion) || 0,
        montantCautionDefaut: parseFloat(formConfig.montantCautionDefaut) || 150,
        optionsCotisation: formConfig.optionsCotisation,
        formulesAdhesion: formConfig.formulesAdhesion,
        "publicTheme.formulesRecrutement": formConfig.formulesAdhesion,
        lienPaiementExterne: formConfig.lienPaiementExterne,
        instructionsPaiement: formConfig.instructionsPaiement,
        demanderDroitImage: formConfig.demanderDroitImage,
        demanderAttestationSante: formConfig.demanderAttestationSante,
        helloAssoSignatureKey: formConfig.helloAssoSignatureKey
      };
      
      const files = {
        droitImageFile,
        aptitudeMedicaleFile
      };

      await handleSaveAssociationSettings(updates, files);
      setDroitImageFile(null);
      setAptitudeMedicaleFile(null);
      alert("Configuration sauvegardée avec succès !");
      setShowConfig(false);
    } catch (err) {
      alert(err.message || "Erreur lors de la sauvegarde.");
    }
  };

  // Export comptable complet au format CSV
  const exportToCSV = () => {
    const headers = [
      t('widgetTreasury.tableMemberName') || "Nom du membre",
      t('widgetTreasury.tableBaseAdhesion') || "Adhésion de base",
      t('widgetTreasury.tableOptions') || "Options choisies",
      `${t('widgetTreasury.tableTotalDue') || "Total dû"} (€)`,
      t('widgetTreasury.tablePaymentStatus') || "Statut du paiement",
      "Instruments prêtés",
      "Caution requise (€)",
      "Statut caution",
      "Garantie & Réf"
    ];
    
    const rows = filteredMembers.map(member => {
      const fullName = `${member.prenom || ''} ${member.nom || ''}`;
      const hasBase = member.adhesionBase !== false;
      const baseMembership = hasBase ? (t('common.yes') || "Oui") : (t('common.no') || "Non");

      const chosenOptionsList = (member.selectedOptions || [])
        .map(optId => {
          const opt = optionsCotisation.find(o => o.id === optId);
          return opt ? opt.nom : null;
        })
        .filter(Boolean)
        .join(', ');

      const baseAmount = hasBase ? parseFloat(baseAdhesionAmount) || 0 : 0;
      const optionsAmount = (member.selectedOptions || []).reduce((sum, optId) => {
        const opt = optionsCotisation.find(o => o.id === optId);
        return sum + (opt ? parseFloat(opt.montant) || 0 : 0);
      }, 0);
      const totalDue = baseAmount + optionsAmount;

      let paymentStatusStr = t('widgetTreasury.unpaid') || "Non payé";
      if (member.paymentStatus === 'paid') paymentStatusStr = t('widgetTreasury.upToDate') || "À jour";
      else if (member.paymentStatus === 'partial') paymentStatusStr = t('widgetTreasury.partial') || "Partiel";
      else if (member.paymentStatus === 'exempted') paymentStatusStr = t('widgetTreasury.exempted') || "Exonéré";

      // Cautions
      const caution = cautionsByMember?.[member.id] || { statutGlobal: 'na', totalCaution: 0, instruments: [] };
      const instrumentsList = caution.instruments.map(i => i.nom).join(', ') || 'Aucun';
      const cautionMontant = caution.totalCaution || 0;
      let cautionStatutLabel = 'N/A';
      if (caution.statutGlobal === 'recue') cautionStatutLabel = 'Reçue';
      else if (caution.statutGlobal === 'en_attente') cautionStatutLabel = 'En attente';

      const garantiesRefs = caution.instruments
        .map(i => `${i.typeGarantie || 'Chèque'}${i.reference ? ` (${i.reference})` : ''}`)
        .join(', ') || '';

      return [
        fullName,
        baseMembership,
        chosenOptionsList,
        totalDue,
        paymentStatusStr,
        instrumentsList,
        cautionMontant,
        cautionStatutLabel,
        garantiesRefs
      ];
    });

    const csvContent = "\uFEFF" + [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tresorerie_pointage_${groupId || 'membres'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Barre de Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="border border-encre-noire/25 p-2 bg-white/40 dark:bg-black/10 rounded">
          <div className="text-[10px] uppercase font-bold text-cordel-master-dark opacity-60">{t('widgetTreasury.activeMembers') || "Membres actifs"}</div>
          <div className="text-xl font-black text-encre-noire">{totalActive}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-green-100/35 dark:bg-green-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-[#2d6a4f] opacity-80">{t('widgetTreasury.upToDate') || "À jour"}</div>
          <div className="text-xl font-black text-[#2d6a4f]">{countPaid}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-amber-100/35 dark:bg-amber-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-[#c05621] opacity-80">{t('widgetTreasury.partial') || "Partiel"}</div>
          <div className="text-xl font-black text-[#c05621]">{countPartial}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-blue-100/35 dark:bg-blue-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 opacity-80">{t('widgetTreasury.exempted') || "Exonéré"}</div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-400">{countExempted}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-red-100/35 dark:bg-red-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-[#8b2a1a] opacity-80">{t('widgetTreasury.unpaid') || "Non payé"}</div>
          <div className="text-xl font-black text-[#8b2a1a]">{countUnpaid}</div>
        </div>
      </div>

      {/* Section Paramètres & Configuration des Cotisations (Accordéon) */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowConfig(!showConfig)}>
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
            ⚙️ Paramètres & Configuration des Cotisations
          </h3>
          <span className="text-xs font-black">{showConfig ? '▲ Masquer' : '▼ Déployer'}</span>
        </div>

        {showConfig && (
          <form onSubmit={handleSaveConfig} className="flex flex-col gap-4 mt-4 pt-4 border-t border-dashed border-cordel-master-dark/20 text-left">
            <CotisationsBlock 
              formData={formConfig} 
              handleChange={handleConfigChange} 
              saving={savingSettings} 
              groupId={groupId} 
              handleSaveHelloAssoKey={() => handleSaveConfig({ preventDefault: () => {} })}
            />

            {/* Gestionnaire des Cartes de Formules d'Adhésion (Percu, Danse, etc.) */}
            <div className="pt-2 border-t border-dashed border-cordel-master-dark/20">
              <FormulesManager 
                formules={formConfig.formulesAdhesion}
                onChangeFormules={(updatedList) => {
                  setFormConfig(prev => ({
                    ...prev,
                    formulesAdhesion: updatedList
                  }));
                }}
                saving={savingSettings}
                groupId={groupId}
              />
            </div>

            <div className="flex justify-end mt-2 pt-3 border-t border-dashed border-cordel-master-dark/15">
              <CordelButton
                type="submit"
                variant="ocre"
                useExtremeBorder={true}
                disabled={savingSettings}
                className="px-6 py-2 uppercase font-black tracking-wider text-xs"
              >
                {savingSettings ? "Enregistrement..." : "💾 Enregistrer les Paramètres"}
              </CordelButton>
            </div>
          </form>
        )}
      </CordelCard>

      {/* Barre d'outils, Recherche et Filtres */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 flex flex-col gap-1 text-left w-full">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
            🔍 Rechercher un membre
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('widgetTreasury.searchPlaceholder') || "Rechercher par nom..."}
            className="theme-input w-full text-xs font-bold py-1.5"
          />
        </div>

        <div className="flex flex-col gap-1 text-left min-w-[130px] w-full md:w-auto">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
            {t('widgetTreasury.statusLabel') || "Statut cotisation"}
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
          >
            <option value="all">{t('widgetTreasury.allStatuses') || "Tous les statuts"}</option>
            <option value="paid">{t('widgetTreasury.statusPaid') || "À jour"}</option>
            <option value="partial">{t('widgetTreasury.statusPartial') || "Partiel"}</option>
            <option value="exempted">{t('widgetTreasury.statusExempted') || "Exonéré"}</option>
            <option value="unpaid">{t('widgetTreasury.statusUnpaid') || "Non payé"}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 text-left min-w-[140px] w-full md:w-auto">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
            Caution instrument
          </label>
          <select
            value={filterCaution}
            onChange={(e) => setFilterCaution(e.target.value)}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
          >
            <option value="all">Toutes les cautions</option>
            <option value="en_attente">⏳ Cautions en attente</option>
            <option value="recue">✓ Cautions reçues</option>
            <option value="na">Sans prêt (N/A)</option>
          </select>
        </div>

        <button
          type="button"
          onClick={exportToCSV}
          className="text-[10px] font-black uppercase tracking-widest bg-[#84967a] hover:bg-[#728369] text-encre-noire border-2 border-encre-noire px-4 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-105 transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full md:w-auto h-[34px]"
        >
          {t('widgetTreasury.exportCSV') || "Exporter (CSV)"}
        </button>
      </CordelCard>

      {/* Tableau de pointage de rentrée */}
      <div className="flex flex-col gap-3">
        {filteredMembers.length === 0 ? (
          <CordelCard variant="default" useExtremeBorder={false} className="p-8 text-center bg-cordel-bg">
            <p className="text-xs font-bold opacity-75">{t('widgetTreasury.noMembers') || "Aucun membre trouvé."}</p>
          </CordelCard>
        ) : (
          <div className="flex flex-col gap-2">
            {/* En-tête Desktop à 6 colonnes (Total 12 colonnes de grille) */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 border-b border-dashed border-cordel-master-dark/30 text-[9px] font-extrabold uppercase tracking-wider text-cordel-wood">
              <div className="col-span-3 text-left">{t('widgetTreasury.tableMemberName') || "Membre"}</div>
              <div className="col-span-1 text-center">{t('widgetTreasury.tableBaseAdhesion') || "Base"}</div>
              <div className="col-span-2 text-left">{t('widgetTreasury.tableOptions') || "Options"}</div>
              <div className="col-span-2 text-center">{t('widgetTreasury.tableTotalDue') || "Total dû"}</div>
              <div className="col-span-2 text-center">Caution instrument</div>
              <div className="col-span-2 text-right">{t('widgetTreasury.tablePaymentStatus') || "Statut"}</div>
            </div>

            {/* Lignes du tableau */}
            {filteredMembers.map((member) => (
              <MemberTreasuryRow
                key={member.id}
                member={member}
                optionsCotisation={optionsCotisation}
                baseAdhesionAmount={parseFloat(baseAdhesionAmount) || 0}
                cautionData={cautionsByMember?.[member.id]}
                onUpdateCaution={handleUpdateCaution}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
