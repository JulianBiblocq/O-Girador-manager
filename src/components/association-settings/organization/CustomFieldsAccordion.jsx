import React, { useState } from 'react';
import CordelCard from '../../CordelCard';
import useConfirm from '../../../hooks/useConfirm';
import CustomFieldAddForm from './CustomFieldAddForm';

/**
 * Accordéon replié par défaut pour les champs de profil personnalisés (« Champs personnalisés (X actifs) ▾ »).
 */
export default function CustomFieldsAccordion({ formData = {}, handleChange, saving }) {
  const [isOpen, setIsOpen] = useState(false);
  const { confirm } = useConfirm();
  const dynamicProfileFields = Array.isArray(formData.dynamicProfileFields) ? formData.dynamicProfileFields : [];

  const handleAddField = (newField) => {
    handleChange('dynamicProfileFields', [...dynamicProfileFields, newField]);
  };

  const handleRemoveField = async (id) => {
    const isOk = await confirm({
      title: "Supprimer le champ personnalisé",
      message: "Êtes-vous sûr de vouloir supprimer ce champ personnalisé ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    if (isOk) {
      handleChange('dynamicProfileFields', dynamicProfileFields.filter(f => f.id !== id));
    }
  };

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-0 overflow-hidden mb-4">
      {/* En-tête de l'accordéon avec comptage des champs actifs */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="py-3 px-4 flex items-center justify-between cursor-pointer bg-cordel-bg-light/60 hover:bg-cordel-bg-light transition-colors select-none"
      >
        <div className="flex items-center gap-2 text-left">
          <span className="text-sm">📝</span>
          <span className="text-xs font-black uppercase tracking-wider text-cordel-wood">
            Champs personnalisés ({dynamicProfileFields.length} actifs) {isOpen ? '▲' : '▾'}
          </span>
          <span className="text-[9px] text-cordel-master-dark/60 font-semibold hidden sm:inline">
            (Questions sur-mesure pour l'inscription & le profil)
          </span>
        </div>

        <button
          type="button"
          className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded border border-encre-noire/30 bg-white hover:bg-stone-50 text-encre-noire transition-all cursor-pointer shadow-2xs"
        >
          {isOpen ? 'Fermer' : 'Gérer'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-dashed border-cordel-master-dark/20 flex flex-col gap-3 text-left animate-fade-in bg-white/40">
          <p className="text-[10px] text-cordel-master-dark/70 font-semibold leading-relaxed">
            Ajoutez des questions spécifiques selon les besoins de votre troupe (ex: Régime alimentaire, Besoin covoiturage, Pratique musicale antérieure...).
          </p>

          {/* Formulaire d'ajout modulaire */}
          <CustomFieldAddForm onAdd={handleAddField} saving={saving} />

          {/* Liste des champs configurés */}
          {dynamicProfileFields.length === 0 ? (
            <div className="p-3 border border-dashed border-stone-300 rounded text-center text-[10px] italic text-stone-500 bg-white/60">
              Aucune question personnalisée configurée.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dynamicProfileFields.map((field) => (
                <div 
                  key={field.id}
                  className="p-2.5 rounded border border-cordel-master-dark/20 bg-white flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-encre-noire">{field.name}</span>
                      {field.required && (
                        <span className="text-[8px] uppercase font-black text-red-600 bg-red-100 px-1 rounded">Obligatoire</span>
                      )}
                    </div>
                    <span className="text-[9px] text-stone-500 font-semibold">
                      Type : {field.type} {field.options?.length > 0 && `(${field.options.join(', ')})`}
                    </span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="text-xs hover:text-red-500 font-bold px-2 py-1 cursor-pointer"
                    title="Supprimer cette question"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CordelCard>
  );
}
