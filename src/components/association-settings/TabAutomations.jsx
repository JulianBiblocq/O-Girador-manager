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
    joursAvant: 2,
    pointDeReference: 'registrationDeadline', // 'registrationDeadline' ou 'eventDate'
    titreNotification: '⏳ Rappel : Réponse attendue',
    messageNotification: 'Bonjour ! N’oublie pas d’indiquer ta présence pour {{nomEvenement}} !',
    isActive: true
  });

  const resetForm = () => {
    setFormData({
      titre: '',
      typeEvenementCible: 'tous',
      joursAvant: 2,
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
      joursAvant: rule.joursAvant !== undefined ? rule.joursAvant : 2,
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
                  {eventTypes.map((tType) => (
                    <option key={tType} value={tType}>
                      🎭 {tType.charAt(0).toUpperCase() + tType.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jours avant */}
              {formData.pointDeReference !== 'eventConfirmed' && (
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
                  onChange={(e) => setFormData(prev => ({ ...prev, pointDeReference: e.target.value }))}
                  disabled={saving}
                  className="theme-input text-xs font-bold py-1.5 bg-amber-50 dark:bg-amber-950/30 border-amber-400"
                >
                  <option value="registrationDeadline">📌 Avant la date limite d'inscription</option>
                  <option value="eventDate">📅 Avant la date de l'événement</option>
                  <option value="eventConfirmed">✅ À la confirmation de l'événement</option>
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
                className="theme-input text-xs font-semibold py-1.5 resize-none"
              />
            </div>

            {/* Activation */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="isActiveRule"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                disabled={saving}
                className="w-4 h-4 cursor-pointer"
              />
              <label htmlFor="isActiveRule" className="text-xs font-bold cursor-pointer select-none">
                Activer cette règle de relance automatique
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
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                      r.isActive ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' : 'bg-neutral-200 text-neutral-700'
                    }`}>
                      {r.isActive ? '🟢 Actif' : '⚪ Inactif'}
                    </span>
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase">
                      🎭 {r.typeEvenementCible === 'tous' ? 'Tous les événements' : r.typeEvenementCible}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-encre-noire/80 mt-0.5">
                    ⏱️ Déclenchement : 
                    {r.pointDeReference === 'eventConfirmed' ? (
                      <span className="font-extrabold ml-1">Immédiat à la confirmation</span>
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

                {/* Actions sur la règle */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => toggleRuleActive(r.id, r.isActive)}
                    className={`text-[9.5px] font-black uppercase px-2.5 py-1 rounded cursor-pointer transition-colors ${
                      r.isActive 
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-400' 
                        : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-400'
                    }`}
                    title={r.isActive ? "Désactiver la règle" : "Activer la règle"}
                  >
                    {r.isActive ? 'Pause ⏸️' : 'Activer ▶️'}
                  </button>

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
