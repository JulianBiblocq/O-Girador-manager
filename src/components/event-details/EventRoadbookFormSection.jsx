import React, { useState } from 'react';
import EventRoadbookParcoursFields from './EventRoadbookParcoursFields';
import EventRoadbookContactsFields from './EventRoadbookContactsFields';
import EventLogisticsKitsSelector from './EventLogisticsKitsSelector';
import { useTranslation } from '../LanguageContext';

/**
 * Sous-composant de formulaire pour la Feuille de Route / Roadbook du Jour J.
 * Respecte strictement la règle anti-monolithe (< 200 lignes).
 *
 * @param {Object} props
 * @param {Object} props.editForm - Données du formulaire d'édition d'événement
 * @param {Function} props.setEditForm - Setter du formulaire d'édition
 * @param {Array} props.allUsers - Liste des membres pour contacts et chefs de pupitre
 * @param {Array<string>} [props.pupitresList] - Noms des vrais pupitres configurés
 * @param {string} [props.groupId] - ID du groupe
 * @param {boolean} [props.saving] - Indicateur de sauvegarde en cours
 * @param {Function} [props.t] - Fonction de traduction
 */
export default function EventRoadbookFormSection({
  editForm = {},
  setEditForm,
  allUsers = [],
  pupitresList = [],
  groupId,
  saving = false,
  t
}) {
  const { t: contextT } = useTranslation();
  const tr = typeof t === 'function' ? t : contextT;
  const [isOpen, setIsOpen] = useState(false);

  const formatJeu = editForm.formatJeu || 'scene';
  const parcours = editForm.parcours || {};
  const hebergement = editForm.hebergement || {};
  const logistiqueDepart = editForm.logistiqueDepart || {};
  const contactsJourJ = editForm.contactsJourJ || {};

  const handleFieldChange = (section, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-cordel-master-dark/20 text-left">
      <div
        className="flex items-center justify-between cursor-pointer select-none bg-cordel-bg-light/80 p-2.5 rounded-[4px] border border-encre-noire/15 hover:bg-neutral-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📄</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-cordel-wood">
            {tr('agenda.roadbookOptionTitle') || "Feuille de route / Roadbook concert (optionnel)"}
          </span>
        </div>
        <span className="text-xs font-bold text-cordel-master-dark">
          {isOpen ? '▲ Masquer' : `▼ ${tr('agenda.btnConfigure') || "Configurer"}`}
        </span>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-3 p-3 bg-cordel-bg/40 border border-dashed border-encre-noire/20 rounded-[4px] animate-fadeIn text-xs">
          {/* Format de Jeu */}
          <div className="flex flex-col gap-1">
            <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Format de jeu</label>
            <select
              value={formatJeu}
              onChange={(e) => setEditForm((prev) => ({ ...prev, formatJeu: e.target.value }))}
              disabled={saving}
              className="theme-input text-xs font-bold py-1 bg-white"
            >
              <option value="scene">Scène fixe</option>
              <option value="deambulation">Déambulation de rue / Carnaval</option>
              <option value="mixte">Mixte (Déambulation &amp; Scène)</option>
            </select>
          </div>

          {/* Déambulation : Parcours */}
          {(formatJeu === 'deambulation' || formatJeu === 'mixte') && (
            <EventRoadbookParcoursFields
              parcours={parcours}
              onChange={(field, val) => handleFieldChange('parcours', field, val)}
              groupId={groupId || editForm.groupId}
              disabled={saving}
            />
          )}

          {/* Hébergement */}
          <div className="p-2.5 bg-white/70 dark:bg-stone-800/70 rounded border border-encre-noire/10 flex flex-col gap-2">
            <span className="text-[9px] font-black uppercase text-cordel-wood">🏨 Hébergement &amp; Nuitée</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Type (Hôtel, Gîte, Chez l'habitant...)"
                value={hebergement.type || ''}
                onChange={(e) => handleFieldChange('hebergement', 'type', e.target.value)}
                disabled={saving}
                className="theme-input text-[9px] py-1 px-1.5"
              />
              <input
                type="text"
                placeholder="Digicode / Consigne clés"
                value={hebergement.codeAcces || ''}
                onChange={(e) => handleFieldChange('hebergement', 'codeAcces', e.target.value)}
                disabled={saving}
                className="theme-input text-[9px] py-1 px-1.5"
              />
            </div>
            <input
              type="text"
              placeholder="Adresse de l'hébergement"
              value={hebergement.adresse || ''}
              onChange={(e) => handleFieldChange('hebergement', 'adresse', e.target.value)}
              disabled={saving}
              className="theme-input text-[9px] py-1 px-1.5"
            />
            <textarea
              rows={2}
              placeholder="Répartition des chambres / Notes couchage..."
              value={hebergement.repartitionChambres || ''}
              onChange={(e) => handleFieldChange('hebergement', 'repartitionChambres', e.target.value)}
              disabled={saving}
              className="theme-input text-[9px] py-1 px-1.5"
            />
          </div>

          {/* Logistique Départ & Malles Régie dynamiques */}
          <EventLogisticsKitsSelector
            formData={editForm}
            setFormData={setEditForm}
            groupId={groupId || editForm.groupId}
            disabled={saving}
          />

          {/* Contacts Clés Jour J */}
          <EventRoadbookContactsFields
            contactsJourJ={contactsJourJ}
            onChange={(field, val) => handleFieldChange('contactsJourJ', field, val)}
            allUsers={allUsers}
            pupitresList={pupitresList}
            disabled={saving}
          />
        </div>
      )}
    </div>
  );
}
