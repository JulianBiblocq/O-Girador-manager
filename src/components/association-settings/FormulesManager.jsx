import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

// Formules d'adhésion par défaut si la liste est initialement vide
const DEFAULT_FORMULES = [
  {
    id: 'percussion',
    titre: 'Formule Percussion',
    icone: '🥁',
    description: 'Ateliers hebdomadaires de percussion maracatu (Alfaia, Caixa, Gonguê, Agbê, Mineiro).',
    tarif: 'Adhésion annuelle',
    avantages: ['Prêt des instruments inclus', 'Accès aux répétitions & prestations', 'Apprentissage des rythmes et de la technique']
  },
  {
    id: 'danse',
    titre: 'Formule Danse & Chant',
    icone: '💃',
    description: 'Ateliers de danse traditionnelle brésilienne, expression scénique et chant polyphonique.',
    tarif: 'Adhésion annuelle',
    avantages: ['Développement corporel & chorégraphies', 'Accès aux costumes et sorties scéniques', 'Ouvert à tous niveaux']
  },
  {
    id: 'complete',
    titre: 'Formule Complète',
    icone: '✨',
    description: 'Accès illimité à l\'ensemble des ateliers de percussion, de danse, de chant et aux stages.',
    tarif: 'Tarif préférentiel',
    avantages: ['Accès à tous les ateliers de la semaine', 'Participation prioritaire aux stages', 'Immersion totale dans la culture Maracatu']
  }
];

/**
 * Sous-composant d'administration permettant de gérer les cartes de formules d'adhésion 
 * pour la section Recrutement de la vitrine publique.
 *
 * @param {Object} props
 * @param {Array} props.formules - Liste actuelle des formules
 * @param {Function} props.onChangeFormules - Callback pour enregistrer la mise à jour des formules
 * @param {boolean} props.saving - État de sauvegarde
 */
export default function FormulesManager({ formules = [], onChangeFormules, saving }) {
  // Si aucune formule n'est encore enregistrée, initialiser avec les formules par défaut
  const activeFormules = Array.isArray(formules) && formules.length > 0 ? formules : DEFAULT_FORMULES;

  const [editingIndex, setEditingIndex] = useState(null);
  const [formState, setFormState] = useState({
    titre: '',
    icone: '🥁',
    tarif: '',
    description: '',
    avantagesText: ''
  });

  // Ouverture du formulaire de création / modification
  const handleOpenEdit = (index = null) => {
    if (index !== null && activeFormules[index]) {
      const item = activeFormules[index];
      setFormState({
        titre: item.titre || '',
        icone: item.icone || '🥁',
        tarif: item.tarif || '',
        description: item.description || '',
        avantagesText: Array.isArray(item.avantages) ? item.avantages.join('\n') : ''
      });
      setEditingIndex(index);
    } else {
      setFormState({
        titre: '',
        icone: '🥁',
        tarif: 'Adhésion annuelle',
        description: '',
        avantagesText: ''
      });
      setEditingIndex('new');
    }
  };

  // Fermeture du formulaire
  const handleCancel = () => {
    setEditingIndex(null);
  };

  // Enregistrement d'une formule dans la liste
  const handleSaveFormule = (e) => {
    e.preventDefault();
    if (!formState.titre.trim()) return;

    const avantagesList = formState.avantagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const updatedItem = {
      id: editingIndex === 'new' ? `formule_${Date.now()}` : activeFormules[editingIndex]?.id || `formule_${Date.now()}`,
      titre: formState.titre.trim(),
      icone: formState.icone.trim() || '🥁',
      tarif: formState.tarif.trim(),
      description: formState.description.trim(),
      avantages: avantagesList
    };

    let nextList = [...activeFormules];
    if (editingIndex === 'new') {
      nextList.push(updatedItem);
    } else {
      nextList[editingIndex] = updatedItem;
    }

    onChangeFormules(nextList);
    setEditingIndex(null);
  };

  // Suppression d'une formule
  const handleDeleteFormule = (index) => {
    const nextList = activeFormules.filter((_, idx) => idx !== index);
    onChangeFormules(nextList);
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex items-center justify-between border-b border-dashed border-cordel-master-dark/20 pb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-encre-noire/90 flex items-center gap-1.5">
          <span>🎫 Formules d'Adhésion & Cartes Recrutement</span>
        </label>
        <button
          type="button"
          onClick={() => handleOpenEdit(null)}
          disabled={saving || editingIndex !== null}
          className="text-[10px] font-black uppercase bg-cordel-vert text-white border border-encre-noire px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] hover:brightness-105 cursor-pointer disabled:opacity-50 flex items-center gap-1"
        >
          <span>➕ Ajouter une formule</span>
        </button>
      </div>

      <p className="text-[11px] text-stone-600 leading-relaxed">
        Personnalisez les cartes d'adhésion affichées dans la section recrutement du site public (ex: Danse, Percussion, Formule Complète).
      </p>

      {/* Liste des cartes actuelles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {activeFormules.map((f, idx) => (
          <div 
            key={f.id || idx}
            className="p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col justify-between gap-3 relative"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg">{f.icone || '🥁'}</span>
                <span className="text-[9px] font-mono bg-stone-200 px-1.5 py-0.5 rounded text-stone-700 font-bold">
                  {f.tarif || 'Formule'}
                </span>
              </div>
              <h5 className="text-xs font-bold text-cordel-wood truncate">{f.titre}</h5>
              {f.description && (
                <p className="text-[10px] text-stone-600 line-clamp-2 leading-tight">
                  {f.description}
                </p>
              )}
            </div>

            {/* Actions Modifier / Supprimer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-stone-300">
              <button
                type="button"
                onClick={() => handleOpenEdit(idx)}
                disabled={saving || editingIndex !== null}
                className="text-[9px] font-bold text-stone-700 hover:text-black cursor-pointer"
              >
                ✏️ Éditer
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFormule(idx)}
                disabled={saving || editingIndex !== null}
                className="text-[9px] font-bold text-red-700 hover:text-red-900 cursor-pointer ml-1"
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire d'édition / création d'une formule */}
      {editingIndex !== null && (
        <form onSubmit={handleSaveFormule} className="p-4 bg-white border-2 border-cordel-wood rounded-[6px_8px_5px_7px] flex flex-col gap-3 shadow-md animate-fade-in mt-2">
          <h5 className="text-xs font-black uppercase text-cordel-wood flex items-center justify-between border-b pb-1">
            <span>{editingIndex === 'new' ? "➕ Nouvelle Formule d'Adhésion" : "✏️ Modifier la Formule"}</span>
            <button type="button" onClick={handleCancel} className="text-xs text-stone-400 hover:text-black">✕</button>
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase">Icône / Émoji</label>
              <input
                type="text"
                required
                value={formState.icone}
                onChange={(e) => setFormState({ ...formState, icone: e.target.value })}
                placeholder="🥁"
                className="text-xs px-2 py-1.5 border rounded bg-white"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase">Titre de la Formule *</label>
              <input
                type="text"
                required
                value={formState.titre}
                onChange={(e) => setFormState({ ...formState, titre: e.target.value })}
                placeholder="Formule Percussion"
                className="text-xs px-2 py-1.5 border rounded bg-white font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase">Libellé du Tarif / Période</label>
            <input
              type="text"
              value={formState.tarif}
              onChange={(e) => setFormState({ ...formState, tarif: e.target.value })}
              placeholder="Adhésion annuelle / Tarif réduit"
              className="text-xs px-2 py-1.5 border rounded bg-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase">Description courte</label>
            <textarea
              rows={2}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="Ateliers hebdomadaires de percussion maracatu..."
              className="text-xs px-2 py-1.5 border rounded bg-white resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase flex items-center justify-between">
              <span>Points Forts / Avantages inclus (Un par ligne)</span>
              <span className="text-[9px] text-stone-400 font-normal">Chaque ligne deviendra une puce ✓</span>
            </label>
            <textarea
              rows={3}
              value={formState.avantagesText}
              onChange={(e) => setFormState({ ...formState, avantagesText: e.target.value })}
              placeholder="Prêt des instruments inclus&#10;Accès aux répétitions & prestations&#10;Ouvert à tous niveaux"
              className="text-xs px-2 py-1.5 border rounded bg-white font-mono resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <CordelButton type="button" variant="default" onClick={handleCancel} className="text-[10px] px-3 py-1">
              Annuler
            </CordelButton>
            <CordelButton type="submit" variant="vert" className="text-[10px] px-4 py-1 font-bold uppercase">
              Valider la formule
            </CordelButton>
          </div>
        </form>
      )}
    </div>
  );
}
