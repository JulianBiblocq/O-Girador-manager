import React from 'react';
import CordelCard from '../CordelCard';
import { generateImageCharterPDF, generateMedicalAttestationPDF } from '../../utils/pdfGenerator';
import { formatTagGender, getTagId } from '../../utils/tagUtils';
import { getMigratedRoleAndTags, VALID_SYSTEM_ROLES } from '../../utils/roleMigration';

/**
 * Composant SystemUserList
 * Affiche la liste des membres inscrits et fournit les contrôles pour modifier leurs rôles système,
 * leurs étiquettes (tags), leurs niveaux, leurs champs personnalisés et imprimer leurs attestations PDF.
 * Extrait de SystemAdminPanel pour modulariser la gestion des utilisateurs.
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
  handleToggleArchive,
  handleDeleteUser
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {usersList.map((userItem) => {
        const migrated = getMigratedRoleAndTags(userItem);
        const currentRole = migrated.newRole;
        const currentTags = userItem.tags || [];
        const currentLevel = userItem.niveau || 'aucun';
        const currentDanceLevel = userItem.niveauDanse || 'aucun';
        
        const draftRole = draftRoles[userItem.id];
        const draftTag = draftTags[userItem.id];
        const draftLevel = draftLevels[userItem.id];
        const draftDanceLevel = draftDanceLevels[userItem.id];
        const userDraft = draftFields[userItem.id] || {};
        
        const activeRole = draftRole !== undefined ? draftRole : currentRole;
        const normalizedActiveRole = VALID_SYSTEM_ROLES.includes(activeRole) ? activeRole : getMigratedRoleAndTags({ role: activeRole }).newRole;
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
              <span className="text-[10px] font-black uppercase text-cordel-wood">Actions rôle & membre</span>
              
              <div className="flex items-center gap-1.5">
                {isArchived ? (
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(userItem.id, true)}
                    disabled={savingId === userItem.id}
                    className="text-[9px] font-black uppercase bg-[#2d6a4f]/10 hover:bg-[#2d6a4f] text-[#2d6a4f] hover:text-white border border-[#2d6a4f]/40 px-2.5 py-1 rounded shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-colors"
                  >
                    Désarchiver
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(userItem.id, false)}
                      disabled={savingId === userItem.id}
                      className="text-[9px] font-black uppercase bg-[#8b2a1a]/10 hover:bg-[#8b2a1a] text-[#8b2a1a] hover:text-white border border-[#8b2a1a]/40 px-2 py-1 rounded shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer transition-colors"
                      title="Masquer le membre de l'annuaire actif"
                    >
                      Archiver
                    </button>
                    {hasChanged && (
                      <button
                        type="button"
                        onClick={() => handleSavePermissions(userItem.id, userItem)}
                        disabled={savingId === userItem.id}
                        className="text-[9px] font-black uppercase bg-amber-500 hover:bg-amber-600 border border-encre-noire text-white px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer animate-pulse"
                      >
                        {savingId === userItem.id ? "..." : "Enregistrer"}
                      </button>
                    )}
                  </>
                )}

                {handleDeleteUser && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(userItem.id, `${userItem.prenom || ''} ${userItem.nom || ''}`.trim())}
                    disabled={savingId === userItem.id}
                    className="text-[9px] font-black uppercase bg-red-700 hover:bg-red-800 border border-encre-noire text-white px-2 py-1 rounded shadow-[1px_1px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                    title="Supprimer définitivement la fiche de ce membre"
                  >
                    🗑️ Supprimer
                  </button>
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
                    value={normalizedActiveRole}
                    onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                    disabled={savingId === userItem.id}
                    className="theme-input text-[10px] font-bold py-1 px-1.5 bg-cordel-bg-light"
                  >
                    <option value="membre">Membre</option>
                    <option value="admin">Admin</option>
                    <option value="mestre">Mestre (Super-Admin)</option>
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
                      <span className="text-[8px] font-bold text-cordel-wood">Surnom</span>
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
                    <div className="flex flex-col gap-1 col-span-2">
                      <span className="text-[8px] font-bold text-cordel-wood">Adresse physique (Rue / Code Postal / Ville)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        <input
                          type="text"
                          placeholder="Rue / Voie"
                          value={userDraft.adresseRue !== undefined ? userDraft.adresseRue : (userItem.adresseRue || userItem.adresse || '')}
                          onChange={(e) => handleFieldChange(userItem.id, 'adresseRue', e.target.value)}
                          disabled={savingId === userItem.id}
                          className="theme-input text-[10px] font-bold py-1 px-1.5 w-full"
                        />
                        <input
                          type="text"
                          placeholder="Code Postal"
                          value={userDraft.adresseCP !== undefined ? userDraft.adresseCP : (userItem.adresseCP || '')}
                          onChange={(e) => handleFieldChange(userItem.id, 'adresseCP', e.target.value)}
                          disabled={savingId === userItem.id}
                          className="theme-input text-[10px] font-bold py-1 px-1.5 w-full"
                        />
                        <input
                          type="text"
                          placeholder="Ville"
                          value={userDraft.adresseVille !== undefined ? userDraft.adresseVille : (userItem.adresseVille || '')}
                          onChange={(e) => handleFieldChange(userItem.id, 'adresseVille', e.target.value)}
                          disabled={savingId === userItem.id}
                          className="theme-input text-[10px] font-bold py-1 px-1.5 w-full"
                        />
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
