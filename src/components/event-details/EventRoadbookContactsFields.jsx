import React from 'react';

const PUPITRES_DISPONIBLES = [
  'Alfaia', 'Caixa', 'Tarol', 'Gonguê', 'Agbê', 'Mineiro', 'Timbal', 'Danse', 'Chant'
];

/**
 * Sous-composant de saisie des contacts clés du jour J (Orga, Référent groupe, Chefs de pupitre).
 *
 * @param {Object} props
 * @param {Object} props.contactsJourJ - Données des contacts
 * @param {Function} props.onChange - Fonction de mise à jour (champ, valeur)
 * @param {Array} props.allUsers - Liste des membres
 * @param {boolean} [props.disabled] - Désactivation des champs
 */
export default function EventRoadbookContactsFields({
  contactsJourJ = {},
  onChange,
  allUsers = [],
  disabled = false
}) {
  const referentsPupitres = contactsJourJ.referentsPupitres || [];

  const handleAddReferentPupitre = (pupitre) => {
    if (!pupitre || referentsPupitres.some((p) => p.pupitre === pupitre)) return;
    const updated = [...referentsPupitres, { pupitre, memberId: '' }];
    onChange('referentsPupitres', updated);
  };

  const handleUpdateReferentPupitre = (index, memberId) => {
    const updated = [...referentsPupitres];
    updated[index] = { ...updated[index], memberId };
    onChange('referentsPupitres', updated);
  };

  const handleRemoveReferentPupitre = (index) => {
    const updated = referentsPupitres.filter((_, i) => i !== index);
    onChange('referentsPupitres', updated);
  };

  return (
    <div className="p-2.5 bg-white/70 dark:bg-stone-800/70 rounded border border-encre-noire/10 flex flex-col gap-2">
      <span className="text-[9px] font-black uppercase text-cordel-wood">📞 Contacts Clés Jour J</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Nom du référent organisateur"
          value={contactsJourJ.referentOrgaNom || ''}
          onChange={(e) => onChange('referentOrgaNom', e.target.value)}
          disabled={disabled}
          className="theme-input text-[9px] py-1 px-1.5"
        />
        <input
          type="tel"
          placeholder="Tél référent organisateur"
          value={contactsJourJ.referentOrgaTel || ''}
          onChange={(e) => onChange('referentOrgaTel', e.target.value)}
          disabled={disabled}
          className="theme-input text-[9px] py-1 px-1.5"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[8px] uppercase font-bold text-cordel-master-dark">Référent Groupe (Jour J)</label>
        <select
          value={contactsJourJ.referentGroupeId || ''}
          onChange={(e) => onChange('referentGroupeId', e.target.value)}
          disabled={disabled}
          className="theme-input text-[9px] py-1 px-1.5 bg-white"
        >
          <option value="">-- Sélectionner un référent --</option>
          {allUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.prenom} {u.nom} {u.telephone ? `(${u.telephone})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Référents Pupitres */}
      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-dashed border-encre-noire/15">
        <div className="flex items-center justify-between">
          <span className="text-[8px] uppercase font-bold text-cordel-master-dark">Chefs de pupitre</span>
          <select
            value=""
            onChange={(e) => handleAddReferentPupitre(e.target.value)}
            disabled={disabled}
            className="text-[8px] font-bold py-0.5 px-1 rounded border border-encre-noire/20"
          >
            <option value="">+ Ajouter un pupitre...</option>
            {PUPITRES_DISPONIBLES.filter((p) => !referentsPupitres.some((r) => r.pupitre === p)).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {referentsPupitres.map((refPup, idx) => (
          <div key={refPup.pupitre} className="flex items-center gap-1.5">
            <span className="text-[8.5px] font-black w-16 text-cordel-wood shrink-0">{refPup.pupitre} :</span>
            <select
              value={refPup.memberId || ''}
              onChange={(e) => handleUpdateReferentPupitre(idx, e.target.value)}
              disabled={disabled}
              className="theme-input text-[8.5px] py-0.5 px-1 bg-white flex-1"
            >
              <option value="">-- Chef de pupitre --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleRemoveReferentPupitre(idx)}
              disabled={disabled}
              className="text-red-600 hover:text-red-800 font-black text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
