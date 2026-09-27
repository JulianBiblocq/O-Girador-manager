import React, { useState } from 'react';
import CordelButton from '../../CordelButton';

const FIELD_TYPES = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'multiselect', label: 'Choix multiples' },
  { value: 'checkbox', label: 'Case à cocher' }
];

/**
 * Formulaire compact d'ajout d'une question personnalisée pour l'adhésion.
 */
export default function CustomFieldAddForm({ onAdd, saving }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [required, setRequired] = useState(false);
  const [target, setTarget] = useState('both');
  const [options, setOptions] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `field_${Date.now()}_${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: name.trim(),
      type,
      required,
      target,
      options: ['select', 'multiselect'].includes(type) && options.trim()
        ? options.split(',').map(o => o.trim()).filter(Boolean)
        : []
    });
    setName('');
    setType('text');
    setRequired(false);
    setTarget('both');
    setOptions('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-stone-50 border border-stone-200 rounded flex flex-col gap-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="text-[9px] uppercase font-bold text-cordel-master-dark block mb-0.5">
            Nom de la question *
          </label>
          <input 
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Régime alimentaire"
            className="theme-input text-xs font-bold py-1 bg-white w-full"
          />
        </div>
        
        <div>
          <label className="text-[9px] uppercase font-bold text-cordel-master-dark block mb-0.5">
            Type de réponse
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="theme-input text-xs font-bold py-1 bg-white w-full cursor-pointer"
          >
            {FIELD_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {['select', 'multiselect'].includes(type) && (
        <div>
          <label className="text-[9px] uppercase font-bold text-cordel-master-dark block mb-0.5">
            Options (séparées par une virgule)
          </label>
          <input 
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Ex: Végétarien, Végan, Sans gluten"
            className="theme-input text-xs font-bold py-1 bg-white w-full"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-dashed border-stone-200">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input 
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-[10px] font-bold text-stone-700">Réponse obligatoire</span>
        </label>

        <CordelButton 
          type="submit"
          variant="ocre"
          useExtremeBorder={true}
          disabled={saving || !name.trim()}
          className="py-1 px-3 text-[10px] font-black uppercase tracking-wider self-end sm:self-auto cursor-pointer"
        >
          + Ajouter la question
        </CordelButton>
      </div>
    </form>
  );
}
