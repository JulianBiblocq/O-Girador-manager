import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';
import useConfirm from '../../hooks/useConfirm';
import InstrumentsCatalogBlock from './blocks/InstrumentsCatalogBlock';

export default function TabOrganization({ formData, handleChange, saving, t, mode }) {
  const { dynamicProfileFields = [] } = formData;
  const { confirm } = useConfirm();
  
  const translationFn = t || ((key) => key);
  
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldTarget, setNewFieldTarget] = useState('both');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const FIELD_TYPES = [
    { value: 'text', label: 'Texte court' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'number', label: 'Nombre' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Liste déroulante (choix unique)' },
    { value: 'multiselect', label: 'Choix multiples' },
    { value: 'checkbox', label: 'Case à cocher' }
  ];

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    
    const fieldId = `field_${Date.now()}_${newFieldName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    const newField = {
      id: fieldId,
      name: newFieldName.trim(),
      type: newFieldType,
      required: newFieldRequired,
      target: newFieldTarget, 
      options: ['select', 'multiselect'].includes(newFieldType) && newFieldOptions.trim()
        ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
        : []
    };

    handleChange('dynamicProfileFields', [...dynamicProfileFields, newField]);
    
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldRequired(false);
    setNewFieldTarget('both');
    setNewFieldOptions('');
  };

  const handleRemoveField = async (id) => {
    const isOk = await confirm({
      title: "Supprimer le champ personnalisé",
      message: "Êtes-vous sûr de vouloir supprimer ce champ ? Les données déjà saisies par les membres ne seront pas effacées de la base, mais le champ n'apparaîtra plus dans les formulaires.",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
    
    if (isOk) {
      handleChange('dynamicProfileFields', dynamicProfileFields.filter(f => f.id !== id));
    }
  };

  const getTargetLabel = (target) => {
    switch (target) {
      case 'onboarding': return 'Inscription uniquement';
      case 'profile': return 'Profil membre uniquement';
      case 'both': return 'Inscription & Profil';
      default: return 'Inscription & Profil';
    }
  };

  const getTypeLabel = (type) => {
    const found = FIELD_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Mode « instruments-only » : afficher uniquement le bloc Pupitres / Instruments
  if (mode === 'instruments-only') {
    return (
      <InstrumentsCatalogBlock formData={formData} handleChange={handleChange} saving={saving} t={t} />
    );
  }

  // Mode « profile-fields-only » ou pas de mode : afficher les réglages d'organisation
  return (
    <>
      {/* 1. Nom Court */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mb-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          🏢 {translationFn('associationSettings.shortNameLabel') || "Nom court de l'association"}
        </h3>
        <div className="flex flex-col gap-1 text-left">
          <input 
            type="text"
            value={formData.shortName || ''}
            onChange={(e) => handleChange('shortName', e.target.value)}
            placeholder={translationFn('associationSettings.shortNamePlaceholder') || "Ex: Le Girador"}
            disabled={saving}
            className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
          />
        </div>
      </CordelCard>

      {/* 2. Règles de fonctionnement */}
      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mb-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          ⚖️ {translationFn('associationSettings.associationRulesLabel') || "Règles de fonctionnement"}
        </h3>
        <div className="flex flex-col gap-1 text-left">
          <textarea 
            value={formData.associationRules || ''}
            onChange={(e) => handleChange('associationRules', e.target.value)}
            placeholder={translationFn('associationSettings.associationRulesPlaceholder') || "Saisissez les règles internes de l'association (affichées aux membres)..."}
            disabled={saving}
            rows={4}
            className="theme-input text-xs font-bold py-2 bg-cordel-bg-light w-full resize-y"
          />
        </div>
      </CordelCard>



      {/* Bloc Instruments/Pupitres : affiché uniquement dans le mode global (tous les onglets visibles) */}
      {!mode && (
        <div className="mt-4">
          <InstrumentsCatalogBlock formData={formData} handleChange={handleChange} saving={saving} t={t} />
        </div>
      )}

      <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5 mt-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
          📝 Champs Personnalisés (Inscription & Profil)
        </h3>
        
        <p className="text-[10px] text-cordel-master-dark/70 font-semibold mb-3 leading-relaxed text-left">
          Ajoutez des champs supplémentaires pour collecter des informations spécifiques (ex: Taille de t-shirt, Régime alimentaire, Besoin de covoiturage...).
        </p>

        <div className="flex flex-col gap-3 pb-4 border-b border-dashed border-cordel-master-dark/15 text-xs text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Nom du champ (Label)
              </label>
              <input 
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                placeholder="Ex: Taille de t-shirt"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Type de donnée
              </label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
              >
                {FIELD_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {['select', 'multiselect'].includes(newFieldType) && (
            <div className="flex flex-col gap-1 mt-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Options de sélection (séparées par des virgules)
              </label>
              <input 
                type="text"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                placeholder="Ex: S, M, L, XL, XXL"
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                Emplacement
              </label>
              <select
                value={newFieldTarget}
                onChange={(e) => setNewFieldTarget(e.target.value)}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
              >
                <option value="both">Inscription ET Profil membre</option>
                <option value="onboarding">Formulaire d'inscription uniquement</option>
                <option value="profile">Profil membre uniquement</option>
              </select>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <input 
                type="checkbox"
                id="fieldRequired"
                checked={newFieldRequired}
                onChange={(e) => setNewFieldRequired(e.target.checked)}
                className="cursor-pointer"
              />
              <label htmlFor="fieldRequired" className="text-[10px] font-bold cursor-pointer">
                Champ obligatoire
              </label>
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <CordelButton 
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleAddField}
              disabled={saving || !newFieldName.trim() || (['select', 'multiselect'].includes(newFieldType) && !newFieldOptions.trim())}
              className="py-1.5 text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
            >
              + Ajouter le champ
            </CordelButton>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
            Champs configurés
          </span>
          {dynamicProfileFields.length === 0 ? (
            <span className="text-[10px] italic opacity-60">
              Aucun champ personnalisé configuré.
            </span>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {dynamicProfileFields.map((field) => (
                <div 
                  key={field.id}
                  className="p-2.5 rounded-[4px] border border-cordel-master-dark/20 bg-white/40 flex justify-between items-start"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold text-encre-noire">{field.name}</span>
                      {field.required && (
                        <span className="text-[8px] uppercase font-black text-red-600 bg-red-100 px-1.5 rounded-sm">Obligatoire</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[9px] text-cordel-master-dark/80 font-semibold">
                      <span className="bg-cordel-master-dark/10 px-1.5 rounded-sm">Type: {getTypeLabel(field.type)}</span>
                      <span className="bg-cordel-master-dark/10 px-1.5 rounded-sm">Affiché: {getTargetLabel(field.target)}</span>
                    </div>
                    {field.options && field.options.length > 0 && (
                      <div className="text-[9px] mt-1 text-cordel-wood font-medium italic">
                        Options : {field.options.join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleRemoveField(field.id)}
                    className="text-xs hover:text-red-500 font-bold px-2 py-1 cursor-pointer select-none"
                    title="Supprimer ce champ"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CordelCard>
    </>
  );
}
