import React from 'react';
import CordelCard from '../CordelCard';
import { generateImageCharterPDF, generateMedicalAttestationPDF } from '../../utils/pdfGenerator';
import { formatTagGender, getTagId } from '../../utils/tagUtils';

/**
 * SystemUserList renders the list of registered users and controls to edit their permissions,
 * levels, custom fields, and print PDF certificates.
 * Extracted from SystemAdminPanel to modularize user management.
 */
export default function SystemUserList({
  usersList,
  draftRoles,
  draftTags,
  draftFields,
  draftLevels,
  draftDanceLevels,
  savingId,
  availableTags,
  fieldsConfig,
  associationName,
  handleRoleChange,
  handleTagToggle,
  handleLevelChange,
  handleDanceLevelChange,
  handleFieldChange,
  handleSavePermissions,
  handleToggleArchive
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {usersList.map((userItem) => {
        const currentRole = userItem.role || 'membre';
        const currentTags = userItem.tags || [];
        const currentLevel = userItem.niveau || 'aucun';
        const currentDanceLevel = userItem.niveauDanse || 'aucun';
        
        const draftRole = draftRoles[userItem.id];
        const draftTag = draftTags[userItem.id];
        const draftLevel = draftLevels[userItem.id];
        const draftDanceLevel = draftDanceLevels[userItem.id];
        const userDraft = draftFields[userItem.id] || {};
        
        const activeRole = draftRole !== undefined ? draftRole : currentRole;
        const activeTags = draftTag !== undefined ? draftTag : currentTags;
        const activeLevel = draftLevel !== undefined ? draftLevel : currentLevel;
        const activeDanceLevel = draftDanceLevel !== undefined ? draftDanceLevel : currentDanceLevel;

        const isArchived = userItem.statutActuel === 'archived';

        const hasChanged = 
          draftRole !== undefined || 
          draftTag !== undefined || 
          draftLevel !== undefined || 
          draftDanceLevel !== undefined || 
          Object.keys(userDraft).length > 0;

        return (
          <CordelCard 
            key={userItem.id} 
            variant="default" 
            useExtremeBorder={false} 
            className="flex flex-col gap-3 relative p-4 text-left select-none"
          >
            {/* User identity info */}
            <div className="flex items-center gap-3">
              {userItem.photoUrl ? (
                <div className="w-10 h-10 border border-encre-noire rounded-full overflow-hidden bg-white shrink-0">
                  <img src={userItem.photoUrl} alt={userItem.prenom} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 border border-encre-noire rounded-full bg-cordel-bg-light/60 flex items-center justify-center shrink-0">
                  <span className="text-xs uppercase font-black text-cordel-wood">
                    {userItem.prenom?.charAt(0)}{userItem.nom?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-black uppercase text-encre-noire truncate leading-none mb-1">
                  {userItem.prenom} {userItem.nom}
                </span>
                <span className="text-[9px] font-bold text-cordel-master-dark opacity-60 leading-none break-all">
                  {userItem.email}
                </span>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex justify-between items-center gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
              <span className="text-[10px] font-black uppercase text-cordel-wood">Actions rôle</span>
              
              <div className="flex items-center gap-2">
                {isArchived ? (
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(userItem.id, true)}
                    disabled={savingId === userItem.id}
                    className="text-[9px] font-black uppercase bg-green-100 hover:bg-green-200 border border-green-700 text-green-700 px-3 py-1 rounded shadow-[1px_1px_0px_0px_rgba(22,101,52,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                  >
                    Désarchiver
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(userItem.id, false)}
                      disabled={savingId === userItem.id}
                      className="text-[9px] font-black uppercase bg-red-100 hover:bg-red-200 border border-red-700 text-red-700 px-3 py-1 rounded shadow-[1px_1px_0px_0px_rgba(185,28,28,0.15)] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                    >
                      Archiver
                    </button>
                    {hasChanged && (
                      <button
                        type="button"
                        onClick={() => handleSavePermissions(userItem.id, userItem)}
                        disabled={savingId === userItem.id}
                        className="text-[9px] font-black uppercase bg-amber-500 hover:bg-amber-600 border border-encre-noire text-white px-3 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer animate-pulse"
                      >
                        {savingId === userItem.id ? "..." : "Enregistrer"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Role dropdown and Levels */}
            {!isArchived && (
              <div className="grid grid-cols-3 gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
                <div className="flex flex-col gap-0.5">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Attribuer un rôle
                  </label>
                  <select
                    value={activeRole}
                    onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                    disabled={savingId === userItem.id}
                    className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                  >
                    <option value="membre">Membre</option>
                    <option value="tresorier">Trésorier</option>
                    <option value="logistique">Logistique</option>
                    <option value="mestre">Mestre</option>
                    <option value="super-admin">Super Admin</option>
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Niveau Musique
                  </label>
                  <select
                    value={activeLevel}
                    onChange={(e) => handleLevelChange(userItem.id, e.target.value)}
                    disabled={savingId === userItem.id}
                    className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                  >
                    <option value="aucun">Aucun</option>
                    <option value="debutant">Débutant</option>
                    <option value="confirme">Confirmé</option>
                  </select>
                </div>

                <div className="flex flex-col gap-0.5">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Niveau Danse
                  </label>
                  <select
                    value={activeDanceLevel}
                    onChange={(e) => handleDanceLevelChange(userItem.id, e.target.value)}
                    disabled={savingId === userItem.id}
                    className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                  >
                    <option value="aucun">Aucun</option>
                    <option value="debutant">Débutant</option>
                    <option value="confirme">Confirmé</option>
                  </select>
                </div>
              </div>
            )}

            {/* Custom info fields (if enabled in organization settings) */}
            {fieldsConfig && !isArchived && (
              <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Informations de profil admin/membre
                </label>
                
                <div className="grid grid-cols-2 gap-2 text-left">
                  {/* Telephone */}
                  {fieldsConfig.telephone?.enabled && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-cordel-wood">Téléphone</span>
                      <input
                        type="text"
                        value={userDraft.telephone !== undefined ? userDraft.telephone : (userItem.telephone || '')}
                        onChange={(e) => handleFieldChange(userItem.id, 'telephone', e.target.value)}
                        disabled={savingId === userItem.id}
                        className="theme-input text-[10px] font-bold py-1 px-1.5"
                      />
                    </div>
                  )}

                  {/* Surnom */}
                  {fieldsConfig.surnom?.enabled && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-cordel-wood">Nom de scène/Surnom</span>
                      <input
                        type="text"
                        value={userDraft.surnom !== undefined ? userDraft.surnom : (userItem.surnom || '')}
                        onChange={(e) => handleFieldChange(userItem.id, 'surnom', e.target.value)}
                        disabled={savingId === userItem.id}
                        className="theme-input text-[10px] font-bold py-1 px-1.5"
                      />
                    </div>
                  )}

                  {/* Adresse */}
                  {fieldsConfig.adresse?.enabled && (
                    <div className="flex flex-col gap-0.5 col-span-2">
                      <span className="text-[8px] font-bold text-cordel-wood">Adresse physique (Ville/Département)</span>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={userDraft.adresse !== undefined ? userDraft.adresse : (userItem.adresse || '')}
                            onChange={(e) => handleFieldChange(userItem.id, 'adresse', e.target.value)}
                            disabled={savingId === userItem.id}
                            className="theme-input text-[10px] font-bold py-1 px-1.5 w-full truncate"
                          />
                        </div>
                      </div>
                      {/* Fallback display of old address format */}
                      {userItem.adresse && !userItem.adresseRue && (
                        <span className="text-[7.5px] italic text-cordel-master-dark/70 mt-0.5 block">
                          Ancien format : {userItem.adresse}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Taille Tshirt */}
                  {fieldsConfig.tailleTshirt?.enabled && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-cordel-wood">Taille T-Shirt</span>
                      <select
                        value={userDraft.tailleTshirt !== undefined ? userDraft.tailleTshirt : (userItem.tailleTshirt || 'M')}
                        onChange={(e) => handleFieldChange(userItem.id, 'tailleTshirt', e.target.value)}
                        disabled={savingId === userItem.id}
                        className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                      >
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                  )}

                  {/* Latéralité */}
                  {fieldsConfig.lateralite?.enabled && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-cordel-wood">Latéralité</span>
                      <select
                        value={userDraft.lateralite !== undefined ? userDraft.lateralite : (userItem.lateralite || 'droitier')}
                        onChange={(e) => handleFieldChange(userItem.id, 'lateralite', e.target.value)}
                        disabled={savingId === userItem.id}
                        className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                      >
                        <option value="droitier">Droitier</option>
                        <option value="gaucher">Gaucher</option>
                      </select>
                    </div>
                  )}

                  {/* Date de naissance */}
                  {fieldsConfig.dateNaissance?.enabled && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-bold text-cordel-wood">Naissance</span>
                      <input
                        type="date"
                        value={userDraft.dateNaissance !== undefined ? userDraft.dateNaissance : (userItem.dateNaissance || '')}
                        onChange={(e) => handleFieldChange(userItem.id, 'dateNaissance', e.target.value)}
                        disabled={savingId === userItem.id}
                        className="theme-input text-[10px] font-bold py-1 px-1.5"
                      />
                    </div>
                  )}
                </div>

                {/* Checkboxes for right to image and medical fitness */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-0.5">
                  {fieldsConfig.droitImage?.enabled && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none">
                      <input
                        type="checkbox"
                        checked={userDraft.droitImage !== undefined ? userDraft.droitImage : (userItem.droitImage !== false)}
                        onChange={(e) => handleFieldChange(userItem.id, 'droitImage', e.target.checked)}
                        disabled={savingId === userItem.id}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <span>Droit image</span>
                    </label>
                  )}

                  {fieldsConfig.aptitudeMedicale?.enabled && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none">
                      <input
                        type="checkbox"
                        checked={userDraft.aptitudeMedicale !== undefined ? userDraft.aptitudeMedicale : (userItem.aptitudeMedicale === true)}
                        onChange={(e) => handleFieldChange(userItem.id, 'aptitudeMedicale', e.target.checked)}
                        disabled={savingId === userItem.id}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <span>Aptitude méd.</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Tags Selector Panel (Checkboxes) */}
            {availableTags.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-3 text-left">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                  Étiquettes attribuées
                </label>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-0.5">
                  {availableTags.map((tag) => {
                    const tagId = getTagId(tag);
                    const isChecked = activeTags.includes(tagId) || (typeof tag === 'string' && activeTags.includes(tag));
                    const formattedLabel = formatTagGender(tag, userItem.genre, false, availableTags);
                    return (
                      <label key={tagId} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold select-none hover:opacity-80">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={savingId === userItem.id}
                          onChange={(e) => handleTagToggle(userItem.id, tagId, e.target.checked, currentTags)}
                          className="rounded border-encre-noire text-cordel-wood focus:ring-cordel-wood w-3 h-3 cursor-pointer"
                        />
                        <span className="theme-stamp-badge theme-stamp-badge-wood text-[8px] px-1 py-0.5 normal-case tracking-normal rotate-0 bg-transparent shadow-none border-dashed border">
                          {formattedLabel}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PDF Generation section */}
            {(userItem.droitImage === true || userItem.aptitudeMedicale === true) && (
              <div className="flex flex-wrap gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3 mt-1.5 text-left">
                <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark w-full">
                  Documents Signés (PDF)
                </label>
                {userItem.droitImage === true && (
                  <button
                    type="button"
                    onClick={() => generateImageCharterPDF(userItem, associationName)}
                    className="text-[9px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
                  >
                    📄 Télécharger Charte Image PDF
                  </button>
                )}
                {userItem.aptitudeMedicale === true && (
                  <button
                    type="button"
                    onClick={() => generateMedicalAttestationPDF(userItem, associationName)}
                    className="text-[9px] font-black uppercase tracking-widest bg-cordel-bg border border-encre-noire px-2.5 py-1 rounded-[4px_6px_3px_5px] shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none hover:brightness-95 cursor-pointer flex items-center gap-1"
                  >
                    📄 Télécharger Attestation Santé PDF
                  </button>
                )}
              </div>
            )}

            {/* Stamp badge representing current live role and archived status */}
            <div className="absolute right-4 top-4 select-none flex flex-col items-end gap-1">
              <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px]">
                {currentRole}
              </span>
              {isArchived && (
                <span className="theme-stamp-badge theme-stamp-badge-wood text-[7px] border-red-600 text-red-600 font-extrabold uppercase rotate-[-3deg]">
                  Archivé
                </span>
              )}
            </div>
          </CordelCard>
        );
      })}
    </div>
  );
}
