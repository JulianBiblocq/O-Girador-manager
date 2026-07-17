import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import CordelButton from '../CordelButton';

export default function TabOrganization({
  formData,
  handleChange,
  saving,
  t,
  mode
}) {
  const { instrumentsDisponibles = [], linkedInstruments = [], fieldsConfig = {} } = formData;

  const [newInstrument, setNewInstrument] = useState('');
  const [newPupitreName, setNewPupitreName] = useState('');
  const [selectedInstrumentsForLink, setSelectedInstrumentsForLink] = useState([]);

  const handleAddInstrument = () => {
    const trimmed = newInstrument.trim();
    if (!trimmed) return;
    if (instrumentsDisponibles.includes(trimmed)) {
      alert("Cet instrument existe déjà !");
      return;
    }
    handleChange('instrumentsDisponibles', [...instrumentsDisponibles, trimmed]);
    setNewInstrument('');
  };

  const handleRemoveInstrument = (instToRemove) => {
    const updatedInsts = instrumentsDisponibles.filter(i => i !== instToRemove);
    handleChange('instrumentsDisponibles', updatedInsts);

    const updatedLinks = linkedInstruments.filter(group => {
      const insts = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      return !insts.includes(instToRemove);
    });
    handleChange('linkedInstruments', updatedLinks);
  };

  const handleLinkInstruments = () => {
    if (selectedInstrumentsForLink.length < 2) return;
    
    const sortedGroup = [...selectedInstrumentsForLink].sort();
    
    const exists = linkedInstruments.some(group => {
      const g = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
      if (g.length !== sortedGroup.length) return false;
      const sortedG = [...g].sort();
      return sortedG.every((val, index) => val === sortedGroup[index]);
    });
    
    if (exists) {
      alert("Cette liaison existe déjà !");
      return;
    }
    
    const pupitreObj = {
      name: newPupitreName.trim(),
      instruments: sortedGroup
    };
    
    handleChange('linkedInstruments', [...linkedInstruments, pupitreObj]);
    setSelectedInstrumentsForLink([]);
    setNewPupitreName('');
  };

  const handleRemoveLink = (indexToRemove) => {
    handleChange('linkedInstruments', linkedInstruments.filter((_, idx) => idx !== indexToRemove));
  };

  const handleToggleEnable = (key) => {
    const updated = {
      ...fieldsConfig,
      [key]: {
        ...fieldsConfig[key],
        enabled: !fieldsConfig[key].enabled
      }
    };
    handleChange('fieldsConfig', updated);
  };

  const handleFilledByChange = (key, value) => {
    const updated = {
      ...fieldsConfig,
      [key]: {
        ...fieldsConfig[key],
        filledBy: value
      }
    };
    handleChange('fieldsConfig', updated);
  };

  return (
    <>
      {(!mode || mode === 'instruments-only') && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
            🥁 Pupitres & Instruments
          </h3>
      
        <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Ajouter un instrument</span>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newInstrument}
              onChange={(e) => setNewInstrument(e.target.value)}
              placeholder="Ex: Agbê, Chant..."
              className="theme-input text-xs font-bold py-1.5 flex-1 bg-cordel-bg-light"
            />
            <CordelButton 
              type="button"
              variant="ocre"
              useExtremeBorder={true}
              onClick={handleAddInstrument}
              disabled={saving}
              className="text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
            >
              + Ajouter
            </CordelButton>
          </div>
        </div>

        {/* Instruments list */}
        <div className="flex flex-col gap-2 mt-3 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">Instruments configurés</span>
          {instrumentsDisponibles.length === 0 ? (
            <span className="text-[10px] italic opacity-60">Aucun instrument configuré.</span>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {instrumentsDisponibles.map((inst, index) => (
                <span 
                  key={inst + index}
                  className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed flex items-center gap-1.5"
                >
                  {inst}
                  <button 
                    type="button"
                    onClick={() => handleRemoveInstrument(inst)}
                    className="text-[9px] hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        </CordelCard>
      )}

      {/* Instruments Liés / Pupitres */}
      {(!mode || mode === 'linked-instruments-only') && (
        <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
            🔗 {t('associationSettings.linkedInstrumentsHeading') || "Instruments Liés / Pupitres"}
          </h3>
          
          {/* Form to link instruments */}
          <div className="flex flex-col gap-3 pb-3 border-b border-dashed border-cordel-master-dark/15 text-xs">
            <div className="flex flex-col gap-2 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Nom du Pupitre (Optionnel - ex: Alfaias, Sementes...)
                </label>
                <input 
                  type="text"
                  value={newPupitreName}
                  onChange={(e) => setNewPupitreName(e.target.value)}
                  placeholder="Saisissez un nom de pupitre personnalisé..."
                  className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full"
                />
              </div>

              <div className="flex flex-col gap-1 mt-1">
                <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark mb-1">
                  {t('associationSettings.selectInstrumentsForGroup') || "Sélectionner les instruments du pupitre (minimum 2)"}
                </label>
                <div className="flex flex-wrap gap-2 p-3 border-2 border-dashed border-[var(--cordel-border)] rounded-[4px_8px_3px_6px] bg-[var(--cordel-master-bg)] max-h-40 overflow-y-auto">
                  {instrumentsDisponibles.map(inst => {
                    const isSelected = selectedInstrumentsForLink.includes(inst);
                    return (
                      <label 
                        key={inst} 
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px_8px_3px_6px] border border-[var(--cordel-border)] cursor-pointer select-none text-[10px] font-bold transition-all ${
                          isSelected 
                            ? 'bg-[var(--cordel-wood)] text-white shadow-sm' 
                            : 'bg-[var(--cordel-bg)] text-[var(--cordel-text)] opacity-75 hover:opacity-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedInstrumentsForLink(prev => prev.filter(i => i !== inst));
                            } else {
                              setSelectedInstrumentsForLink(prev => [...prev, inst]);
                            }
                          }}
                          className="hidden"
                        />
                        {inst}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <CordelButton 
                type="button"
                variant="ocre"
                useExtremeBorder={true}
                onClick={handleLinkInstruments}
                disabled={saving || selectedInstrumentsForLink.length < 2}
                className="py-1.5 text-[10px] px-3 uppercase tracking-widest font-black shrink-0"
              >
                Créer le Pupitre
              </CordelButton>
            </div>
          </div>

          {/* Display configured groups */}
          <div className="flex flex-col gap-2 mt-3 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
              Pupitres configurés
            </span>
            {linkedInstruments.length === 0 ? (
              <span className="text-[10px] italic opacity-60">
                Aucun pupitre configuré pour le moment.
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {linkedInstruments.map((group, index) => {
                  const instrumentsArray = group.instruments || (Array.isArray(group) ? group : [group.inst1, group.inst2]);
                  const groupLabel = group.name 
                    ? `${group.name} (${instrumentsArray.join(' + ')})` 
                    : instrumentsArray.join(' + ');
                  return (
                    <span 
                      key={index}
                      className="theme-stamp-badge theme-stamp-badge-wood text-[9px] px-2 py-0.5 border-dashed flex items-center gap-1.5"
                    >
                      {groupLabel}
                      <button 
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="text-[9px] hover:text-red-500 font-bold ml-1 cursor-pointer select-none"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </CordelCard>
      )}

      {(!mode || mode === 'profile-fields-only') && (
        <>
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-master-dark opacity-75 mt-3 pl-1 text-left">
            ⚙️ Gestion des Champs
          </h3>

          <div className="flex flex-col gap-3">
            {Object.values(fieldsConfig).map((field) => (
              <CordelCard 
                key={field.key} 
                variant="default"
                useExtremeBorder={false}
                className={`p-3.5 flex flex-col gap-2.5 bg-cordel-bg transition-opacity ${field.enabled ? 'opacity-100' : 'opacity-60'}`}
              >
                <div className="flex justify-between items-center text-left">
                  <span className="font-extrabold text-xs text-encre-noire">
                    {field.label}
                  </span>
                  
                  {/* Enable checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={field.enabled}
                      onChange={() => handleToggleEnable(field.key)}
                      disabled={saving}
                      className="cursor-pointer"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">Actif</span>
                  </label>
                </div>

                {field.enabled && (
                  <div className="flex items-center gap-3 border-t border-dashed border-cordel-master-dark/10 pt-2 mt-0.5 text-left">
                    <span className="text-[9px] font-semibold text-cordel-master-dark/85">Rempli par :</span>
                    <select
                      value={field.filledBy}
                      onChange={(e) => handleFilledByChange(field.key, e.target.value)}
                      disabled={saving}
                      className="theme-input text-[10px] font-bold py-1 px-2 flex-1 bg-cordel-bg-light"
                    >
                      <option value="member">L'adhérent (Profil & Inscription)</option>
                      <option value="admin">L'administrateur (Console Admin uniquement)</option>
                    </select>
                  </div>
                )}
              </CordelCard>
            ))}
          </div>
        </>
      )}
    </>
  );
}
