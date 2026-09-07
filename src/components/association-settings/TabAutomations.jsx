import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import { runAutomationEngine } from '../../utils/automationEngine';
import useConfirm from '../../hooks/useConfirm';

/**
 * Composant TabAutomations
 * Interface d'administration pour la gestion des règles d'automatisation et de relance.
 * Permet de configurer des relances dynamiques basées sur la date d'événement ou la date limite d'inscription.
 */
export default function TabAutomations({ groupId, eventTypes = ['prestation', 'repetition', 'stage', 'atelier', 'reunion'], t }) {
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
    joursAvant: 2,
    joursApres: 1,
    pointDeReference: 'registrationDeadline', // 'registrationDeadline', 'eventDate', ou 'after_event'
    titreNotification: '⏳ Rappel : Réponse attendue',
    messageNotification: 'Bonjour ! N’oublie pas d’indiquer ta présence pour {{nomEvenement}} !',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      titre: '',
      typeEvenementCible: 'tous',
      publicCible: 'tous',
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
      alert("Veuillez saisir un titre pour la règle.");
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
      alert("Erreur lors de l'enregistrement de la règle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rule) => {
    const isOk = await confirm({
      title: "Supprimer la règle d'automatisation",
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
        alert("Impossible de supprimer la règle.");
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
      alert("Erreur lors de l'exécution du moteur de relance.");
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
      badge: '🎭 Recommandé',
      titre: '🎭 Retour des costumes de scène',
      typeEvenementCible: 'prestation',
      publicCible: 'present_only',
      joursApres: 1,
      joursAvant: 1,
      pointDeReference: 'after_event',
      titreNotification: '🎭 Tenue : {{nomEvenement}}',
      messageNotification: "Pense à indiquer si ton costume est au bac ou à laver !",
      isActive: true,
      description: "Relance automatique à J+1 pour le retour des tenues aux membres présents."
    },
    {
      id: 'relance_rsvp',
      badge: '⏳ Classique',
      titre: '📅 Relance RSVP générale',
      typeEvenementCible: 'tous',
      publicCible: 'tous',
      joursAvant: 2,
      joursApres: 1,
      pointDeReference: 'registrationDeadline',
      titreNotification: '⏳ Rappel : Réponse attendue',
      messageNotification: 'Bonjour ! N’oublie pas d’indiquer ta présence pour {{nomEvenement}} !',
      isActive: true,
      description: "Rappel automatique 2 jours avant la date limite d'inscription."
    },
    {
      id: 'feuille_route',
      badge: '📋 Logistique',
      titre: '📋 Feuille de route la veille',
      typeEvenementCible: 'prestation',
      publicCible: 'present_only',
      joursAvant: 1,
      joursApres: 1,
      pointDeReference: 'eventDate',
      titreNotification: '📋 Feuille de route : {{nomEvenement}}',
      messageNotification: "Voici les informations et la feuille de route pour demain pour {{nomEvenement}}.",
      isActive: true,
      description: "Envoi de la feuille de route la veille aux seuls participants confirmés."
    }
  ];

  const applyTemplate = (tpl) => {
    setFormData({
      titre: tpl.titre,
      typeEvenementCible: tpl.typeEvenementCible,
      publicCible: tpl.publicCible,
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
              🤖 Automatisations & Moteur de Relances
            </h3>
            <p className="text-[10px] text-cordel-master-dark opacity-80 leading-relaxed mt-1">
              Configurez des règles automatiques pour rappeler aux membres de valider leur présence avant la date limite d'inscription ou avant l'événement.
            </p>
          </div>
          
          <CordelButton
            variant="ocre"
            useExtremeBorder={true}
            onClick={handleTestEngine}
            disabled={testing}
            className="text-[10px] py-2 px-3 font-extrabold uppercase tracking-wider shrink-0"
          >
            {testing ? "⏳ Analyse..." : "⚡ Tester les relances du jour"}
          </CordelButton>
        </div>

        {/* Résultat du test local */}
        {testResult && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-dashed border-amber-400 rounded text-xs">
            <div className="font-extrabold text-amber-900 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              📊 Synthèse du Moteur ({testResult.totalRules} règles actives, {testResult.totalEvents} événements analysés) :
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
              💡 Modèle Recommandé
            </span>
            <h4 className="text-xs font-black text-purple-950 dark:text-purple-100 mt-1 flex items-center gap-1.5">
              <span>🎭</span> Relance Retour des Costumes (J+1)
            </h4>
            <p className="text-[10px] text-purple-900/80 dark:text-purple-200/70 mt-0.5 leading-snug">
              Relance automatiquement les participants confirmés le lendemain d'une prestation pour déclarer l'état de leur tenue (bac, lavage ou retouche).
            </p>
          </div>
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={() => applyTemplate(SUGGESTED_TEMPLATES[0])}
            className="text-[10px] py-1.5 px-3 font-black uppercase shrink-0 flex items-center gap-1.5"
          >
            ➕ Activer la règle
          </CordelButton>
        </div>
      )}

      {/* Formulaire d'Ajout / Modification */}
      {(isEditing || rules.length === 0) && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 bg-cordel-bg-light/40">
          <div className="flex justify-between items-center mb-3 border-b border-dashed border-cordel-master-dark/20 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-cordel-wood">
              {editingRuleId ? "✏️ Modifier la règle" : "➕ Nouvelle Règle d'Automatisation"}
            </h4>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[10px] font-bold text-cordel-master-dark hover:underline"
              >
                Annuler
              </button>
            )}
          </div>

          {/* Raccourcis de modèles suggérés en mode création */}
          {!editingRuleId && (
            <div className="flex flex-col gap-1.5 mb-3 p-2.5 bg-cordel-bg-light/70 rounded border border-dashed border-cordel-master-dark/20">
              <span className="text-[9px] uppercase font-black text-cordel-master-dark tracking-wider">
                ⚡ Modèles prêts à l'emploi (1 clic pour pré-remplir) :
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
                  Titre explicatif de la règle
                </label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData(prev => ({ ...prev, titre: e.target.value }))}
                  placeholder="ex: Relance Urgente Concert"
                  required
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5"
                />
              </div>

              {/* Type d'événement ciblé */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  Type d'événement ciblé
                </label>
                <select
                  value={formData.typeEvenementCible}
                  onChange={(e) => setFormData(prev => ({ ...prev, typeEvenementCible: e.target.value }))}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5"
                >
                  <option value="tous">🌐 Tous les événements</option>
                  <option value="prestation">🎭 Prestations / Sorties</option>
                  <option value="repetition">🥁 Répétitions</option>
                  <option value="reunion">📋 Réunions</option>
                  <option value="atelier">🧵 Ateliers</option>
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
                  Public Ciblé (Destinataires)
                </label>
                <select
                  value={formData.publicCible}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicCible: e.target.value }))}
                  disabled={saving || formData.pointDeReference === 'reportValidation'}
                  className={`theme-input text-xs font-bold py-1.5 ${formData.pointDeReference === 'reportValidation' ? 'opacity-50' : ''}`}
                >
                  <option value="tous">🌍 Tout le monde (selon les niveaux de l'événement)</option>
                  <option value="present_only">✅ Uniquement les confirmés (Présents)</option>
                  <option value="inscrits">📋 Tous les inscrits (Présents, En attente...)</option>
                  <option value="concernes">🎯 Le public concerné (critères exacts)</option>
                  <option value="percussion">🥁 Section Percussion uniquement</option>
                  <option value="danse">💃 Section Danse uniquement</option>
                </select>
              </div>

              {/* Jours avant / après */}
              {formData.pointDeReference === 'after_event' ? (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                    Nombre de jours après l'événement (ex: 1 pour J+1)
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
              ) : !['eventConfirmed', 'eventCancelled', 'reportValidation'].includes(formData.pointDeReference) && (
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                    Nombre de jours avant déclenchement
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
                  Point de référence (Déclenchement)
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
                      }
                      return next;
                    });
                  }}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-amber-50 dark:bg-amber-950/30 border-amber-400"
                >
                  <option value="registrationDeadline">📌 Avant la date limite d'inscription</option>
                  <option value="eventDate">📅 Avant la date de l'événement</option>
                  <option value="after_event">🎭 Après la fin de l'événement (Retour des costumes)</option>
                  <option value="eventConfirmed">✅ À la confirmation de l'événement</option>
                  <option value="eventCancelled">❌ À l'annulation de l'événement</option>
                  <option value="reportValidation">📝 À la soumission du compte-rendu pour validation</option>
                </select>
              </div>

            </div>

            {/* Titre de la notification */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                Titre de la notification Push
              </label>
              <input
                type="text"
                value={formData.titreNotification}
                onChange={(e) => setFormData(prev => ({ ...prev, titreNotification: e.target.value }))}
                placeholder="ex: ⏳ Rappel : Réponse attendue"
                required
                disabled={saving}
                className="theme-input text-xs font-bold py-1.5"
              />
            </div>

            {/* Message de la notification */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">
                  Message de la notification
                </label>
                <button
                  type="button"
                  onClick={insertVariable}
                  className="text-[8.5px] font-black uppercase text-amber-800 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded cursor-pointer border border-amber-300"
                >
                  + Insérer {"{{nomEvenement}}"}
                </button>
              </div>
              <textarea
                rows={2}
                value={formData.messageNotification}
                onChange={(e) => setFormData(prev => ({ ...prev, messageNotification: e.target.value }))}
                placeholder="Bonjour ! N'oublie pas d'indiquer ta présence pour {{nomEvenement}} !"
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
                  Destination automatique au clic (Deep Link) : <strong>/mon-vestiaire?eventId={'{{eventId}}'}</strong>
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
                Activer immédiatement cette règle d'automatisation
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
                  Annuler
                </CordelButton>
              )}
              <CordelButton
                type="submit"
                variant="vert"
                useExtremeBorder={true}
                disabled={saving}
                className="text-xs py-1.5 px-4 font-black uppercase"
              >
                {saving ? "⏳ Enregistrement..." : (editingRuleId ? "💾 Enregistrer la règle" : "➕ Créer la règle")}
              </CordelButton>
            </div>
          </form>
        </CordelCard>
      )}

      {/* Liste des règles configurées */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-cordel-wood">
            📋 Règles d'Automatisation ({rules.length})
          </h4>
          {!isEditing && (
            <CordelButton
              variant="default"
              onClick={() => setIsEditing(true)}
              className="text-[9.5px] py-1 px-2.5 font-black uppercase tracking-wider"
            >
              ➕ Ajouter une règle
            </CordelButton>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs font-bold animate-pulse opacity-60">
            ⏳ Chargement des règles...
          </div>
        ) : rules.length === 0 ? (
          <div className="p-4 bg-cordel-bg-light border border-dashed border-cordel-master-dark/20 text-center rounded">
            <p className="text-xs font-bold text-cordel-master-dark opacity-70">
              Aucune règle d'automatisation n'est configurée pour le moment.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rules.map((r) => (
              <div 
                key={r.id} 
                className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                  r.isActive 
                    ? 'bg-white/80 dark:bg-black/20 border-cordel-master-dark/25' 
                    : 'bg-neutral-100/60 opacity-60 border-dashed border-neutral-300'
                }`}
              >
                {/* Informations de la règle */}
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs text-cordel-wood">
                      {r.titre}
                    </span>
                    
                    {/* Badge Cordel distinctif : Post-Événement vs Pré-Événement */}
                    {r.pointDeReference === 'after_event' ? (
                      <span className="bg-purple-100 text-purple-900 border border-purple-400 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        🎭 Post-Événement (J+{r.joursApres || r.joursAvant || 1})
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        ⏳ Pré-Événement (J-{r.joursAvant || 0})
                      </span>
                    )}

                    <span className="bg-amber-100/70 text-amber-900 border border-amber-300 text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase">
                      🎭 {r.typeEvenementCible === 'tous' ? 'Tous événements' : r.typeEvenementCible}
                    </span>
                    <span className="bg-sky-100 text-sky-900 border border-sky-300 text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase">
                      🎯 {r.publicCible === 'tous' ? 'Tout le monde' : r.publicCible === 'present_only' ? 'Confirmés (Présents)' : r.publicCible === 'inscrits' ? 'Inscrits' : r.publicCible === 'percussion' ? 'Percussion' : r.publicCible === 'danse' ? 'Danse' : 'Public concerné'}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-encre-noire/80 mt-0.5">
                    ⏱️ Déclenchement : 
                    {r.pointDeReference === 'eventConfirmed' ? (
                      <span className="font-extrabold ml-1">Immédiat à la confirmation</span>
                    ) : r.pointDeReference === 'eventCancelled' ? (
                      <span className="font-extrabold ml-1">Immédiat à l'annulation</span>
                    ) : r.pointDeReference === 'reportValidation' ? (
                      <span className="font-extrabold ml-1">Immédiat à la soumission du compte-rendu</span>
                    ) : r.pointDeReference === 'after_event' ? (
                      <>
                        <span className="underline decoration-amber-500 font-extrabold mx-1">{r.joursApres || r.joursAvant || 1} jour(s)</span>
                        après la date de fin de l’événement (Costumes)
                      </>
                    ) : (
                      <>
                        <span className="underline decoration-amber-500 font-extrabold mx-1">{r.joursAvant} jour(s)</span>
                        {r.pointDeReference === 'registrationDeadline' ? 'avant la date limite d’inscription' : 'avant la date de l’événement'}
                      </>
                    )}
                  </p>

                  <p className="text-[10px] font-semibold text-cordel-master-dark opacity-75 italic truncate">
                    💬 "{r.messageNotification}"
                  </p>
                </div>

                {/* Actions sur la règle avec Switch interactif direct */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  
                  {/* Switch interactif inline */}
                  <div className="flex items-center gap-1.5 bg-cordel-bg-light/90 py-1 px-2 rounded border border-cordel-master-dark/20 shadow-xs">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={r.isActive}
                      onClick={() => toggleRuleActive(r.id, r.isActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-encre-noire transition-colors duration-200 ease-in-out focus:outline-none ${
                        r.isActive ? 'bg-[var(--color-cordel-vert)]' : 'bg-neutral-300'
                      }`}
                      title={r.isActive ? "Désactiver la règle immédiatement" : "Activer la règle immédiatement"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
                          r.isActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[8.5px] font-black uppercase tracking-wider select-none">
                      {r.isActive ? <span className="text-[var(--color-cordel-vert)]">ON</span> : <span className="text-neutral-500">OFF</span>}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEdit(r)}
                    className="text-[9.5px] font-extrabold uppercase bg-cordel-bg text-encre-noire border border-encre-noire px-2.5 py-1 rounded hover:bg-neutral-200 cursor-pointer"
                  >
                    ✏️ Éditer
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(r)}
                    className="text-[9.5px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-400 px-2 py-1 rounded hover:bg-red-200 cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CordelCard>

    </div>
  );
}
