import React, { useState, useEffect } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import MemberTreasuryRow from '../MemberTreasuryRow';
import { useTranslation } from '../LanguageContext';
import CotisationsBlock from './CotisationsBlock';
import FormulesManager from '../association-settings/FormulesManager';
import { syncHelloAssoPayments } from '../../services/helloAssoService';

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

  // État de synchronisation manuelle HelloAsso
  const [isSyncingHelloAsso, setIsSyncingHelloAsso] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

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
    helloAssoSignatureKey: ''
  });

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
        helloAssoSignatureKey: helloAssoSignatureKey || ''
      });
    }
  }, [associationSettings, helloAssoSignatureKey]);

  // Statistiques globales
  const totalActive = members.length;
  const countPaid = members.filter(m => m.paymentStatus === 'paid' || m.cotisation?.statut === 'a_jour').length;
  const countPartial = members.filter(m => m.paymentStatus === 'partial' || m.paymentStatus === 'en_cours' || m.cotisation?.statut === 'en_cours').length;
  const countExempted = members.filter(m => m.paymentStatus === 'exempted').length;
  const countUnpaid = members.filter(m => (!m.paymentStatus || m.paymentStatus === 'unpaid') && m.cotisation?.statut !== 'a_jour' && m.cotisation?.statut !== 'en_cours').length;

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
    let matchesStatus = false;
    if (filterStatus === 'all') {
      matchesStatus = true;
    } else if (filterStatus === 'paid') {
      matchesStatus = status === 'paid' || member.cotisation?.statut === 'a_jour';
    } else if (filterStatus === 'partial') {
      matchesStatus = status === 'partial' || status === 'en_cours' || member.cotisation?.statut === 'en_cours';
    } else if (filterStatus === 'en_cours') {
      matchesStatus = status === 'en_cours' || member.cotisation?.statut === 'en_cours';
    } else if (filterStatus === 'unpaid') {
      matchesStatus = (!member.paymentStatus || member.paymentStatus === 'unpaid') && member.cotisation?.statut !== 'a_jour' && member.cotisation?.statut !== 'en_cours';
    } else {
      matchesStatus = status === filterStatus;
    }

    const caution = cautionsByMember?.[member.id] || { statutGlobal: 'na' };
    const matchesCaution = filterCaution === 'all' || caution.statutGlobal === filterCaution;

    return matchesSearch && matchesStatus && matchesCaution;
  });

  // Action de resynchronisation manuelle HelloAsso
  const handleSyncHelloAsso = async () => {
    if (!groupId) {
      alert("Identifiant de groupe manquant.");
      return;
    }
    setIsSyncingHelloAsso(true);
    setSyncFeedback(null);
    try {
      const result = await syncHelloAssoPayments(groupId);
      if (result.success) {
        setSyncFeedback({
          type: 'success',
          message: `Synchronisation terminée avec succès : ${result.syncedMembersCount} profil(s) mis à jour, ${result.syncedTxCount} écriture(s) comptable(s) synchronisée(s).`
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: `Erreur lors de la synchronisation HelloAsso : ${result.error || "Échec inattendu."}`
        });
      }
    } catch (err) {
      console.error("handleSyncHelloAsso - Erreur :", err);
      setSyncFeedback({
        type: 'error',
        message: `Erreur lors de la synchronisation : ${err.message || err}`
      });
    } finally {
      setIsSyncingHelloAsso(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 7000);
    }
  };

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
        helloAssoSignatureKey: formConfig.helloAssoSignatureKey
      };

      await handleSaveAssociationSettings(updates, {});
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
      if (member.paymentStatus === 'paid' || member.cotisation?.statut === 'a_jour') paymentStatusStr = t('widgetTreasury.upToDate') || "À jour";
      else if (member.paymentStatus === 'en_cours' || member.cotisation?.statut === 'en_cours') paymentStatusStr = "En cours (3x)";
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
        .map(i => `${i.type || i.typeGarantie || 'Chèque'}${i.referencePiece || i.reference ? ` (${i.referencePiece || i.reference})` : ''}`)
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
      {/* Badge Réservé : Trésorier */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[3px_5px_4px_3px] text-[10px] font-black uppercase tracking-wider bg-cordel-wood text-white border border-encre-noire shadow-[1px_1px_0px_0px_#181716]">
          🔒 {t('treasury.badgeReservedTreasurer')}
        </span>
      </div>

      {/* Barre de Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="border border-encre-noire/25 p-2 bg-white/40 dark:bg-black/10 rounded">
          <div className="text-[10px] uppercase font-bold text-cordel-master-dark opacity-60">{t('widgetTreasury.activeMembers') || "Membres actifs"}</div>
          <div className="text-xl font-black text-encre-noire">{totalActive}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-green-100/35 dark:bg-green-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-[var(--color-cordel-vert)] opacity-80">{t('treasury.statusPaidCashCheck')}</div>
          <div className="text-xl font-black text-[var(--color-cordel-vert)]">{countPaid}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-amber-100/35 dark:bg-amber-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-[var(--color-cordel-ocre)] opacity-80">{t('treasury.remainderToPay')}</div>
          <div className="text-xl font-black text-[var(--color-cordel-ocre)]">{countPartial}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-blue-100/35 dark:bg-blue-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 opacity-80">{t('treasury.statusExempted')}</div>
          <div className="text-xl font-black text-blue-700 dark:text-blue-400">{countExempted}</div>
        </div>
        <div className="border border-encre-noire/25 p-2 bg-red-100/35 dark:bg-red-950/15 rounded">
          <div className="text-[10px] uppercase font-bold text-[var(--theme-primary)] opacity-80">{t('treasury.statusPending')}</div>
          <div className="text-xl font-black text-[var(--theme-primary)]">{countUnpaid}</div>
        </div>
      </div>

      {/* Section Paramètres & Configuration des Cotisations (Accordéon) */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-4">
        <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setShowConfig(!showConfig)}>
          <h3 className="text-xs font-extrabold tracking-wider text-cordel-wood uppercase">
            ⚙️ {t('treasury.contributionsTitle')} - {t('common.settings')}
          </h3>
          <span className="text-xs font-black">
            {showConfig ? `▲ ${t('treasury.btnCollapseConfig') || 'Replier'}` : `▼ ${t('treasury.btnDeployConfig') || 'Déployer'}`}
          </span>
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

      {/* Message de notification de synchronisation HelloAsso */}
      {syncFeedback && (
        <div
          className={`p-3 rounded-[4px_6px_3px_5px] border-2 text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_0px_#181716] ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[var(--color-cordel-vert)] border-[var(--color-cordel-vert)]'
              : 'bg-red-50 dark:bg-red-950/40 text-[var(--theme-primary)] border-[var(--theme-primary)]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{syncFeedback.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{syncFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-xs font-black opacity-70 hover:opacity-100 px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Barre d'outils, Recherche et Filtres */}
      <CordelCard variant="default" useExtremeBorder={false} className="p-4 bg-cordel-bg flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1 flex flex-col gap-1 text-left w-full">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
            🔍 {t('treasury.searchMemberPlaceholder')}
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('treasury.searchMemberPlaceholder')}
            className="theme-input w-full text-xs font-bold py-1.5"
          />
        </div>

        <div className="flex flex-col gap-1 text-left min-w-[130px] w-full md:w-auto">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
            {t('treasury.paymentStatus')}
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
          >
            <option value="all">{t('widgetTreasury.allStatuses') || "Tous les statuts"}</option>
            <option value="paid">{t('treasury.statusPaidCashCheck')}</option>
            <option value="partial">{t('treasury.remainderToPay')}</option>
            <option value="en_cours">⏳ {t('treasury.statusPending')} (3x)</option>
            <option value="exempted">{t('treasury.statusExempted')}</option>
            <option value="unpaid">{t('treasury.statusPending')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 text-left min-w-[140px] w-full md:w-auto">
          <label className="text-[9px] uppercase font-extrabold tracking-wider text-cordel-wood">
            {t('treasury.cautionInstrumentLabel') || "Caution instrument"}
          </label>
          <select
            value={filterCaution}
            onChange={(e) => setFilterCaution(e.target.value)}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light"
          >
            <option value="all">{t('treasury.filterAllCautions')}</option>
            <option value="en_attente">⏳ Cautions en attente</option>
            <option value="recue">✓ Cautions reçues</option>
            <option value="na">Sans prêt (N/A)</option>
          </select>
        </div>

        {/* Bouton de resynchronisation manuelle HelloAsso */}
        <button
          type="button"
          onClick={handleSyncHelloAsso}
          disabled={isSyncingHelloAsso}
          title="Forcer la vérification et resynchronisation des paiements HelloAsso"
          className="text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)] hover:brightness-110 text-white border-2 border-encre-noire px-3 py-1.5 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 w-full md:w-auto h-[34px] disabled:opacity-50 disabled:cursor-not-allowed select-none"
        >
          {isSyncingHelloAsso ? (
            <>
              <span className="inline-block animate-spin">🔄</span>
              <span>Synchro...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>{t('treasury.btnSyncHelloasso')}</span>
            </>
          )}
        </button>

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
              <div className="col-span-1 text-center">{t('treasury.membershipFormula')}</div>
              <div className="col-span-2 text-left">{t('widgetTreasury.tableOptions') || "Options"}</div>
              <div className="col-span-2 text-center">{t('treasury.amountDue')}</div>
              <div className="col-span-2 text-center">{t('treasury.thCautionInstrument') || "Caution instrument"}</div>
              <div className="col-span-2 text-right">{t('treasury.paymentStatus')}</div>
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
