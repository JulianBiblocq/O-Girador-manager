import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import { runAutomationEngine } from '../../utils/automationEngine';
import useConfirm from '../../hooks/useConfirm';
import { useTranslation } from '../LanguageContext';
import AutomationTargetTagsSelector from './AutomationTargetTagsSelector';
import AutomationRuleCard from './AutomationRuleCard';

/**
 * Composant TabAutomations
 * Interface d'administration pour la gestion des règles d'automatisation et de relance.
 * Permet de configurer des relances dynamiques basées sur la date d'événement ou la date limite d'inscription.
 */
export default function TabAutomations({ groupId, eventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion'], t: propT }) {
  const { t: contextT } = useTranslation();
  const t = propT || contextT;
  const { confirm } = useConfirm();
  const { rules, loading, addRule, updateRule, deleteRule, toggleRuleActive } = useAutomationRules(groupId);

  const [isEditing, setIsEditing] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Formulaire de règle
  const [formData, setFormData] = useState({
    titre: '',
    typeEvenementCible: 'tous',
    publicCible: 'tous',
    targetTags: ['Mestre', 'CA', 'Bureau'],
    joursAvant: 2,
    joursApres: 1,
    pointDeReference: 'registrationDeadline', // 'registrationDeadline', 'eventDate', 'after_event' ou 'on_registration_deadline_summary'
    titreNotification: '⏳ Rappel : Réponse attendue',
    messageNotification: 'Bonjour ! N’oublie pas d’indiquer ta présence pour {{nomEvenement}} !',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      titre: '',
      typeEvenementCible: 'tous',
      publicCible: 'tous',
      targetTags: ['Mestre', 'CA', 'Bureau'],
      joursAvant: 2,
      joursApres: 1,
      pointDeReference: 'registrationDeadline',
      titreNotification: '⏳ Rappel : Réponse attendue',
      messageNotification: 'Bonjour ! N’oublie pas d’indiquer ta présence pour {{nomEvenement}} !',
      isActive: true
    });
    setIsEditing(false);
    setEditingRuleId(null);
  };

  const handleEdit = (rule) => {
    setEditingRuleId(rule.id);
    setFormData({
      titre: rule.titre || '',
      typeEvenementCible: rule.typeEvenementCible || 'tous',
      publicCible: rule.publicCible || 'tous',
      targetTags: Array.isArray(rule.targetTags) && rule.targetTags.length > 0 ? rule.targetTags : ['Mestre', 'CA', 'Bureau'],
      joursAvant: rule.joursAvant !== undefined ? rule.joursAvant : 2,
      joursApres: rule.joursApres !== undefined ? rule.joursApres : (rule.joursAvant !== undefined ? rule.joursAvant : 1),
      pointDeReference: rule.pointDeReference || 'registrationDeadline',
      titreNotification: rule.titreNotification || '',
      messageNotification: rule.messageNotification || '',
      isActive: rule.isActive !== false
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim()) {
      alert(t('settings.communication.tabAutomations.veuillezSaisirUnTitrePour'));
      return;
    }

    setSaving(true);
    try {
      if (editingRuleId) {
        await updateRule(editingRuleId, formData);
      } else {
        await addRule(formData);
      }
      resetForm();
    } catch (err) {
      console.error("TabAutomations - Erreur sauvegarde règle :", err);
      alert(t('settings.communication.tabAutomations.erreurLorsDeLEnregistrement'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    const isOk = await confirm({
      title: t('settings.communication.tabAutomations.supprimerLaRegleDAutomatisation'),
      message: `Voulez-vous vraiment supprimer la règle "${rule.titre}" ?`,
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });

    if (isOk) {
      try {
        await deleteRule(rule.id);
      } catch (err) {
        console.error("TabAutomations - Erreur suppression règle :", err);
        alert(t('settings.communication.tabAutomations.impossibleDeSupprimerLaRegle'));
      }
    }
  };

  const handleTestEngine = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await runAutomationEngine(groupId, false);
      setTestResult(res);
    } catch (err) {
      console.error("TabAutomations - Erreur test moteur :", err);
      alert(t('settings.communication.tabAutomations.erreurLorsDeLExecution'));
    } finally {
      setTesting(false);
    }
  };

  const insertVariable = () => {
    setFormData(prev => ({
      ...prev,
      messageNotification: prev.messageNotification + " {{nomEvenement}}"
    }));
  };

  // Modèles de règles suggérés
  const SUGGESTED_TEMPLATES = [
    {
      id: 'retour_costume',
      badge: t('settings.communication.tabAutomations.recommande'),
      titre: t('settings.communication.tabAutomations.retourDesCostumesDeScene'),
      typeEvenementCible: 'prestation',
      publicCible: 'present_only',
      joursApres: 1,
      joursAvant: 1,
      pointDeReference: 'after_event',
      titreNotification: '🎭 Tenue : {{nomEvenement}}',
      messageNotification: "Pense à indiquer si ton costume est au bac ou à laver !",
      isActive: true,
      description: t('settings.communication.tabAutomations.relanceAutomatiqueAJ1')
    },
    {
      id: 'relance_rsvp',
      badge: t('settings.communication.tabAutomations.classique'),
      titre: t('settings.communication.tabAutomations.relanceRsvpGenerale'),
      typeEvenementCible: 'tous',
      publicCible: 'tous',
      joursAvant: 2,
      joursApres: 1,
      pointDeReference: 'registrationDeadline',
      titreNotification: '⏳ Rappel : Réponse attendue',
      messageNotification: 'Bonjour ! N’oublie pas d’indiquer ta présence pour {{nomEvenement}} !',
      isActive: true,
      description: t('settings.communication.tabAutomations.rappelAutomatique2JoursAvant')
    },
    {
      id: 'feuille_route',
      badge: t('settings.communication.tabAutomations.logistique'),
      titre: t('settings.communication.tabAutomations.feuilleDeRouteLaVeille'),
      typeEvenementCible: 'prestation',
      publicCible: 'present_only',
      joursAvant: 1,
      joursApres: 1,
      pointDeReference: 'eventDate',
      titreNotification: '📋 Feuille de route : {{nomEvenement}}',
      messageNotification: "Voici les informations et la feuille de route pour demain pour {{nomEvenement}}.",
      isActive: true,
      description: t('settings.communication.tabAutomations.envoiDeLaFeuilleDe')
    },
    {
      id: 'publication_cr',
      badge: '📜 ' + (t('settings.communication.tabAutomations.varal') || 'Varal'),
      titre: t('settings.communication.tabAutomations.publicationDuCompteRenduAuVaral') || '📜 Publication Compte-Rendu au Varal',
      typeEvenementCible: 'reunion',
      publicCible: 'tous',
      joursAvant: 0,
      joursApres: 0,
      pointDeReference: 'on_report_published',
      titreNotification: '📜 Nouveau compte-rendu disponible',
      messageNotification: 'Le compte-rendu de "{{nomEvenement}}" est validé et accroché sur le Varal !',
      isActive: true,
      description: t('settings.communication.tabAutomations.notificationDesQueLeCR') || "Notification Push automatique dès qu'un compte-rendu est validé et accroché sur le Varal."
    },
    {
      id: 'bilan_cloture_inscriptions',
      badge: '📊 Encadrement',
      titre: '📊 Bilan de clôture des inscriptions',
      typeEvenementCible: 'tous',
      publicCible: 'tous',
      targetTags: ['Mestre', 'CA', 'Bureau'],
      joursAvant: 0,
      joursApres: 0,
      pointDeReference: 'on_registration_deadline_summary',
      titreNotification: '📊 Clôture des inscriptions : {{nomEvenement}}',
      messageNotification: 'Bilan automatique des inscrits et votes par pupitre à la clôture.',
      isActive: true,
      description: "Envoie un bilan complet par pupitre à l'encadrement dès que la date limite d'inscription est atteinte."
    }
  ];

  const applyTemplate = (tpl) => {
    setFormData({
      titre: tpl.titre,
      typeEvenementCible: tpl.typeEvenementCible,
      publicCible: tpl.publicCible,
      targetTags: Array.isArray(tpl.targetTags) ? tpl.targetTags : ['Mestre', 'CA', 'Bureau'],
      joursAvant: tpl.joursAvant,
      joursApres: tpl.joursApres,
      pointDeReference: tpl.pointDeReference,
      titreNotification: tpl.titreNotification,
      messageNotification: tpl.messageNotification,
      isActive: tpl.isActive
    });
    setIsEditing(true);
  };

  const hasCostumeRule = rules.some(r => r.pointDeReference === 'after_event');

  return (
    <div className="flex flex-col gap-5 text-left">
      
      {/* En-tête de la section Automatisations */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-2">
              {t('settings.communication.tabAutomations.automatisationsMoteurDeRelances')}
            </h3>
            <p className="text-[10px] text-cordel-master-dark opacity-80 leading-relaxed mt-1">
              {t('settings.communication.tabAutomations.configurezDesReglesAutomatiquesPour')}
            </p>
          </div>
          
          <CordelButton
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleTestEngine}
            disabled={testing}
            className="text-[10px] py-2 px-3 font-extrabold uppercase tracking-wider shrink-0"
          >
            {testing ? t('settings.communication.tabAutomations.analyse') : t('settings.communication.tabAutomations.testerLesRelancesDuJour')}
          </CordelButton>
        </div>

        {/* Résultat du test local */}
        {testResult && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-400 rounded text-xs">
            <div className="font-extrabold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              {t('settings.communication.tabAutomations.syntheseDuMoteur')}{testResult.totalRules} {t('settings.communication.tabAutomations.reglesActives')} {testResult.totalEvents} {t('settings.communication.tabAutomations.evenementsAnalyses')}
            </div>
            <ul className="list-disc list-inside text-[11px] font-semibold text-cordel-master-dark space-y-1">
              {testResult.details.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </CordelCard>

      {/* Bannière de recommandation si aucune règle retour_costume n'est configurée */}
      {!hasCostumeRule && !loading && (
        <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 border-2 border-dashed border-purple-400 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[8.5px] font-black uppercase text-purple-900 dark:text-purple-200 bg-purple-200/80 px-2 py-0.5 rounded tracking-wider">
              {t('settings.communication.tabAutomations.modeleRecommande')}
            </span>
            <h4 className="text-xs font-black text-purple-950 dark:text-purple-100 mt-1 flex items-center gap-1.5">
              <span>🎭</span> {t('settings.communication.tabAutomations.relanceRetourDesCostumesJ')}
            </h4>
            <p className="text-[10px] text-purple-900/80 dark:text-purple-200/70 mt-0.5 leading-snug">
              {t('settings.communication.tabAutomations.relanceAutomatiquementLesParticipantsConfirmes')}
            </p>
          </div>
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={() => applyTemplate(SUGGESTED_TEMPLATES[0])}
            className="text-[10px] py-1.5 px-3 font-black uppercase shrink-0 flex items-center gap-1.5"
          >
            {t('settings.communication.tabAutomations.activerLaRegle')}
          </CordelButton>
        </div>
      )}

      {/* Formulaire d'Ajout / Modification */}
      {(isEditing || rules.length === 0) && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 bg-cordel-bg-light/40">
          <div className="flex justify-between items-center mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {editingRuleId ? t('settings.communication.tabAutomations.modifierLaRegle') : t('settings.communication.tabAutomations.nouvelleRegleDAutomatisation')}
            </h4>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-bold text-cordel-master-dark hover:underline">
                {t('settings.communication.tabAutomations.annuler')}
              </button>
            )}
          </div>

          {/* Raccourcis de modèles suggérés en mode création */}
          {!editingRuleId && (
            <div className="flex flex-col gap-1.5 mb-3 p-2.5 bg-cordel-bg-light/70 rounded border border-dashed border-cordel-master-dark/20">
              <span className="text-[9px] uppercase font-black text-cordel-master-dark tracking-wider">
                {t('settings.communication.tabAutomations.modelesPretsALEmploi')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className="text-[9.5px] font-bold py-1 px-2.5 rounded bg-white/80 hover:bg-white border border-cordel-master-dark/30 hover:border-encre-noire transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    title={tpl.description}
                  >
                    <span>{tpl.titre}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Titre de la règle */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('settings.communication.tabAutomations.titreExplicatifDeLaRegle')}
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  placeholder={t('settings.communication.tabAutomations.exRelanceUrgenteConcert')}
                  required
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5"
                />
              </div>

              {/* Type d'événement ciblé */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('settings.communication.tabAutomations.typeDEvenementCible')}
                </label>
                <select
                  value={formData.typeEvenementCible}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeEvenementCible: e.target.value }))}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5"
                >
                  <option value="tous">{t('settings.communication.tabAutomations.tousLesEvenements')}</option>
                  <option value="prestation">{t('settings.communication.tabAutomations.prestationsSorties')}</option>
                  <option value="repetition">{t('settings.communication.tabAutomations.repetitions')}</option>
                  <option value="reunion">{t('settings.communication.tabAutomations.reunions')}</option>
                  <option value="atelier">{t('settings.communication.tabAutomations.ateliers')}</option>
                  {(eventTypes || [])
                    .filter(tType => !['prestation', 'repetition', 'reunion', 'atelier'].includes(tType))
                    .map((tType) => (
                      <option key={tType} value={tType}>
                        🎭 {tType.charAt(0).toUpperCase() + tType.slice(1)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Public Ciblé */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('settings.communication.tabAutomations.publicCibleDestinataires')}
                </label>
                <select
                  value={formData.publicCible}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicCible: e.target.value }))}
                  disabled={saving || formData.pointDeReference === 'reportValidation'}
                  className={`theme-input text-xs font-bold py-1.5 ${formData.pointDeReference === 'reportValidation' ? 'opacity-50' : ''}`}
                >
                  <option value="tous">{t('settings.communication.tabAutomations.toutLeMondeSelonLes')}</option>
                  <option value="present_only">{t('settings.communication.tabAutomations.uniquementLesConfirmesPresents')}</option>
                  <option value="inscrits">{t('settings.communication.tabAutomations.tousLesInscritsPresentsEn')}</option>
                  <option value="concernes">{t('settings.communication.tabAutomations.lePublicConcerneCriteresExacts')}</option>
                  <option value="percussion">{t('settings.communication.tabAutomations.sectionPercussionUniquement')}</option>
                  <option value="danse">{t('settings.communication.tabAutomations.sectionDanseUniquement')}</option>
                </select>
              </div>

              {/* Jours avant / après */}
              {formData.pointDeReference === 'after_event' ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                    {t('settings.communication.tabAutomations.nombreDeJoursApresL')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.joursApres !== undefined ? formData.joursApres : 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, joursApres: e.target.value }))}
                    required
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5"
                  />
                </div>
              ) : !['eventConfirmed', 'eventCancelled', 'reportValidation', 'on_report_published', 'on_registration_deadline_summary'].includes(formData.pointDeReference) && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                    {t('settings.communication.tabAutomations.nombreDeJoursAvantDeclenchement')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={formData.joursAvant}
                    onChange={(e) => setFormData(prev => ({ ...prev, joursAvant: e.target.value }))}
                    required
                    disabled={saving}
                    className="theme-input text-xs font-bold py-1.5"
                  />
                </div>
              )}

              {/* Point de référence dynamique */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('settings.communication.tabAutomations.pointDeReferenceDeclenchement')}
                </label>
                <select
                  value={formData.pointDeReference}
                  onChange={(e) => {
                    const newPoint = e.target.value;
                    setFormData(prev => {
                      const next = { ...prev, pointDeReference: newPoint };
                      if (newPoint === 'after_event') {
                        next.publicCible = 'present_only';
                        if (!prev.titre || prev.titre === '⏳ Rappel : Réponse attendue') {
                          next.titre = 'Relance Retour des Costumes (J+1)';
                        }
                        if (prev.titreNotification === '⏳ Rappel : Réponse attendue' || !prev.titreNotification) {
                          next.titreNotification = '🎭 Tenues : {{nomEvenement}}';
                        }
                        if (!prev.messageNotification || prev.messageNotification.includes('indiquer ta présence')) {
                          next.messageNotification = "Merci d'indiquer l'état de ton costume (rendu, à laver ou retouche).";
                        }
                        if (!prev.joursApres) {
                          next.joursApres = 1;
                        }
                      } else if (newPoint === 'on_report_published') {
                        next.typeEvenementCible = 'reunion';
                        next.titreNotification = '📜 Nouveau compte-rendu disponible';
                        next.messageNotification = 'Le compte-rendu de "{{nomEvenement}}" est validé et accroché sur le Varal !';
                        if (!prev.titre || prev.titre === '⏳ Rappel : Réponse attendue' || !prev.titre.trim()) {
                          next.titre = t('settings.communication.tabAutomations.publicationDuCompteRenduAuVaral') || 'Publication Compte-Rendu au Varal';
                        }
                      } else if (newPoint === 'on_registration_deadline_summary') {
                        next.targetTags = Array.isArray(prev.targetTags) && prev.targetTags.length > 0
                          ? prev.targetTags
                          : ['Mestre', 'CA', 'Bureau'];
                        next.titreNotification = '📊 Clôture des inscriptions : {{nomEvenement}}';
                        next.messageNotification = 'Bilan automatique des inscrits et votes par pupitre à la clôture.';
                        if (!prev.titre || prev.titre === '⏳ Rappel : Réponse attendue' || !prev.titre.trim()) {
                          next.titre = '📊 Bilan de clôture des inscriptions';
                        }
                      }
                      return next;
                    });
                  }}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-amber-50 dark:bg-amber-950/30 border-amber-400"
                >
                  <option value="registrationDeadline">{t('settings.communication.tabAutomations.avantLaDateLimiteDOption')}</option>
                  <option value="eventDate">{t('settings.communication.tabAutomations.avantLaDateDeLOption')}</option>
                  <option value="after_event">{t('settings.communication.tabAutomations.apresLaFinDeL')}</option>
                  <option value="eventConfirmed">{t('settings.communication.tabAutomations.aLaConfirmationDeL')}</option>
                  <option value="eventCancelled">{t('settings.communication.tabAutomations.aLAnnulationDeL')}</option>
                  <option value="reportValidation">{t('settings.communication.tabAutomations.aLaSoumissionDuCompte')}</option>
                  <option value="on_report_published">{t('settings.communication.tabAutomations.aLaPublicationDuCompteRenduAuVaral') || "📜 À la publication d'un Compte-Rendu au Varal"}</option>
                  <option value="on_registration_deadline_summary">📊 À la clôture des inscriptions : Bilan pour l'encadrement</option>
                </select>
              </div>

            </div>

            {formData.pointDeReference === 'on_registration_deadline_summary' && (
              <AutomationTargetTagsSelector
                groupId={groupId}
                selectedTags={formData.targetTags}
                onChangeTags={(nextTags) => setFormData(prev => ({ ...prev, targetTags: nextTags }))}
                disabled={saving}
              />
            )}

            {/* Titre de la notification */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                {t('settings.communication.tabAutomations.titreDeLaNotificationPush')}
              </label>
              <input
                type="text"
                value={formData.titreNotification}
                onChange={(e) => setFormData(prev => ({ ...prev, titreNotification: e.target.value }))}
                placeholder={t('settings.communication.tabAutomations.exRappelReponseAttendue')}
                required
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5"
              />
            </div>

            {/* Message de la notification */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  {t('settings.communication.tabAutomations.messageDeLaNotification')}
                </label>
                <button
                  type="button"
                  onClick={insertVariable}
                  className="text-[8.5px] font-black uppercase text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded cursor-pointer border border-amber-300"
                >
                  {t('settings.communication.tabAutomations.inserer')} {t('settings.communication.tabAutomations.nomevenement')}
                </button>
              </div>
              <textarea
                rows={2}
                value={formData.messageNotification}
                onChange={(e) => setFormData(prev => ({ ...prev, messageNotification: e.target.value }))}
                placeholder={t('settings.communication.tabAutomations.bonjourNOubliePasD')}
                required
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5 resize-none"
              />
            </div>

            {/* Deep link automatique explicatif si after_event */}
            {formData.pointDeReference === 'after_event' && (
              <div className="text-[10px] font-semibold text-purple-900 dark:text-purple-200 bg-purple-50 dark:bg-purple-950/20 p-2 rounded border border-dashed border-purple-300 flex items-center gap-1.5">
                <span>🔗</span>
                <span>
                  {t('settings.communication.tabAutomations.destinationAutomatiqueAuClicDeep')} <strong>/mon-vestiaire?eventId={t('settings.communication.tabAutomations.eventid')}</strong>
                </span>
              </div>
            )}

            {/* Deep link automatique explicatif si on_report_published */}
            {formData.pointDeReference === 'on_report_published' && (
              <div className="text-[10px] font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded border border-dashed border-emerald-300 flex items-center gap-1.5">
                <span>🔗</span>
                <span>
                  {t('settings.communication.tabAutomations.destinationAutomatiqueAuClicDeep')} <strong>/events/{t('settings.communication.tabAutomations.eventid')}</strong> • Filtrage strict selon l'audience (CA / Bureau si réunion CA, public ciblé si réunion publique).
                </span>
              </div>
            )}

            {/* Option activer immédiatement */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                disabled={saving}
                className="rounded text-amber-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="isActiveCheckbox" className="text-xs font-bold text-cordel-master-dark cursor-pointer select-none">
                {t('settings.communication.tabAutomations.activerImmediatementCetteRegleD')}
              </label>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-2 justify-end mt-2">
              {editingRuleId && (
                <CordelButton
                  type="button"
                  variant="default"
                  onClick={resetForm}
                  disabled={saving}
                  className="text-xs py-1.5 px-3"
                >
                  {t('settings.communication.tabAutomations.annuler')}
                </CordelButton>
              )}
              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={saving}
                className="text-xs py-1.5 px-4 font-black uppercase"
              >
                {saving ? t('settings.communication.tabAutomations.enregistrement') : (editingRuleId ? t('settings.communication.tabAutomations.enregistrerLaRegle') : t('settings.communication.tabAutomations.creerLaRegle'))}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      )}

      {/* Liste des règles configurées */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-cordel-wood">
            {t('settings.communication.tabAutomations.reglesDAutomatisation')}{rules.length})
          </h4>
          {!isEditing && (
            <CordelButton
              variant="default"
              onClick={() => setIsEditing(true)}
              className="text-[9.5px] py-1 px-2.5 font-black uppercase tracking-wider"
            >
              {t('settings.communication.tabAutomations.ajouterUneRegle')}
            </CordelButton>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs font-bold animate-pulse opacity-60">
            {t('settings.communication.tabAutomations.chargementDesRegles')}
          </div>
        ) : rules.length === 0 ? (
          <div className="p-4 bg-cordel-bg-light border border-dashed border-cordel-master-dark/20 text-center rounded">
            <p className="text-xs font-bold text-cordel-master-dark opacity-70">
              {t('settings.communication.tabAutomations.aucuneRegleDAutomatisationN')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((r) => (
              <AutomationRuleCard
                key={r.id}
                rule={r}
                toggleRuleActive={toggleRuleActive}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                t={t}
              />
            ))}
          </div>
        )}
      </CordelCard>

    </div>
  );
}
