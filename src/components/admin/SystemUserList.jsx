import React, { useState } from 'react';

import { generateImageCharterPDF, generateMedicalAttestationPDF } from '../../utils/pdfGenerator';
import { formatTagGender, getTagId } from '../../utils/tagUtils';
import { getMigratedRoleAndTags, VALID_SYSTEM_ROLES } from '../../utils/roleMigration';
import { DEFAULT_CUSTOM_CATEGORIES } from '../../utils/categoryUtils';
import MemberProfileEditModal from './MemberProfileEditModal';
import CordelAccordion, { CordelAccordionGroup } from '../CordelAccordion';

/**
 * Composant SystemUserList
 * Affiche la liste des membres inscrits et fournit les contrôles pour modifier leurs rôles système,
 * leurs étiquettes (tags), leurs niveaux, leurs champs personnalisés et imprimer leurs attestations PDF.
 * Permet également d'ouvrir la modale d'édition complète et de valider les nouvelles inscriptions (isNew === true).
 */
export default function SystemUserList({
  usersList,
  draftRoles,
  draftTags,
  draftFields,
  draftLevels,
  draftDanceLevels,
  draftAppRights,
  quotas = {},
  appRightsUsage = {},
  savingId,
  availableTags,
  customCategories = DEFAULT_CUSTOM_CATEGORIES,
  fieldsConfig,
  associationName,
  handleRoleChange,
  handleTagToggle,
  handleLevelChange,
  handleDanceLevelChange,
  handleAppRightToggle,
  handleFieldChange,
  handleSavePermissions,
  handleValidateNewMember,
  handleSaveFullModalProfile,
  handleToggleArchive,
  handleDeleteUser
}) {
  const [modalUser, setModalUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUsers, setExpandedUsers] = useState({});

  const handleOpenModal = (userItem) => {
    setModalUser(userItem);
  };

  const handleCloseModal = () => {
    setModalUser(null);
  };

  const handleSaveFromModal = async (userId, payload) => {
    if (handleSaveFullModalProfile) {
      await handleSaveFullModalProfile(userId, payload);
    }
    setModalUser(null);
  };

  const toggleAll = (expand) => {
    if (expand) {
      const allIds = {};
      usersList.forEach(u => allIds[u.id] = true);
      setExpandedUsers(allIds);
    } else {
      setExpandedUsers({});
    }
  };

  const toggleUser = (userId, expand) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: expand
    }));
  };

  const filteredUsers = usersList.filter(user => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
    return fullName.includes(term) || (user.email || '').toLowerCase().includes(term);
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4 bg-cordel-bg-light p-3 rounded border border-cordel-master-dark/20">
        <div className="flex-1 w-full relative">
          <input 
            type="text" 
            placeholder="Rechercher un membre par nom ou email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="theme-input w-full text-sm font-bold py-2 px-3 pl-8"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            type="button" 
            onClick={() => toggleAll(true)}
            className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer hover:bg-neutral-200"
          >
            Tout déplier
          </button>
          <button 
            type="button" 
            onClick={() => toggleAll(false)}
            className="text-[10px] font-black uppercase bg-cordel-bg border border-encre-noire px-3 py-1.5 rounded shadow-[2px_2px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer hover:bg-neutral-200"
          >
            Tout replier
          </button>
        </div>
      </div>

      <CordelAccordionGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map((userItem) => {
          const migrated = getMigratedRoleAndTags(userItem);
          const currentRole = migrated.newRole;
          const currentTags = userItem.tags || [];
          const currentLevel = userItem.niveau || userItem.niveauMusique || 'aucun';
          const currentDanceLevel = userItem.niveauDanse || 'aucun';
          const currentAppRights = {
            sequenciador: userItem.canWriteSequenciador === true,
            dansador: userItem.canWriteDansador === true,
            orchestrador: userItem.canWriteOrchestrador === true
          };
          
          const draftRole = draftRoles[userItem.id];
          const draftTag = draftTags[userItem.id];
          const draftLevel = draftLevels[userItem.id];
          const draftDanceLevel = draftDanceLevels[userItem.id];
          const draftUserAppRights = draftAppRights?.[userItem.id] || {};
          const userDraft = draftFields[userItem.id] || {};
          
          const activeRole = draftRole !== undefined ? draftRole : currentRole;
          const normalizedActiveRole = VALID_SYSTEM_ROLES.includes(activeRole) ? activeRole : getMigratedRoleAndTags({ role: activeRole }).newRole;
          const activeTags = draftTag !== undefined ? draftTag : currentTags;
          const activeLevel = draftLevel !== undefined ? draftLevel : currentLevel;
          const activeDanceLevel = draftDanceLevel !== undefined ? draftDanceLevel : currentDanceLevel;
          const activeAppRights = {
            sequenciador: draftUserAppRights.sequenciador !== undefined ? draftUserAppRights.sequenciador : currentAppRights.sequenciador,
            dansador: draftUserAppRights.dansador !== undefined ? draftUserAppRights.dansador : currentAppRights.dansador,
            orchestrador: draftUserAppRights.orchestrador !== undefined ? draftUserAppRights.orchestrador : currentAppRights.orchestrador
          };

          const isArchived = userItem.statutActuel === 'archived';
          const isNewMember = userItem.isNew === true;

          const isQuotaReached = (app) => {
            if (quotas[app] === undefined || quotas[app] === null) return false;
            return appRightsUsage[app] >= quotas[app];
          };

          const seqReached = isQuotaReached('sequenciador');
          const danReached = isQuotaReached('dansador');
          const orchReached = isQuotaReached('orchestrador');

          const hasChanged = 
            draftRole !== undefined || 
            draftTag !== undefined || 
            draftLevel !== undefined || 
            draftDanceLevel !== undefined || 
            Object.keys(draftUserAppRights).length > 0 ||
            Object.keys(userDraft).length > 0;

          const isUserExpanded = !!expandedUsers[userItem.id];

          const userTitleContent = (
            <div className="flex items-center gap-3 pr-8">
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black uppercase text-encre-noire truncate leading-none">
                    {userItem.prenom} {userItem.nom}
                  </span>
                  {isNewMember && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white border border-encre-noire animate-pulse shadow-xs">
                      🆕 Nouveau
                    </span>
                  )}
                  {isArchived && (
                    <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white border border-encre-noire shadow-xs">
                      Archivé
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-cordel-master-dark opacity-60 leading-none break-all mt-1">
                  {userItem.email}
                </span>
              </div>
            </div>
          );

          return (
            <CordelAccordion
              key={userItem.id}
              title={userTitleContent}
              isOpen={isUserExpanded}
              onToggle={(isOpen) => toggleUser(userItem.id, isOpen)}
              badge={hasChanged ? "Modifié" : null}
              className={`${isNewMember ? 'border-amber-600 shadow-[3px_3px_0px_0px_#c05621]' : 'shadow-[3px_3px_0px_0px_#181716] border-encre-noire'}`}
            >
              <div className="flex flex-col gap-3 relative text-left select-none">


              {/* Actions panel */}
              <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                <span className="text-[10px] font-black uppercase text-cordel-wood">Actions & Validation</span>
                
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Bouton d'édition du profil complet par l'administrateur */}
                  <button
                    type="button"
                    onClick={() => handleOpenModal(userItem)}
                    className="text-[9px] font-black uppercase bg-cordel-bg hover:bg-neutral-200 text-encre-noire border border-encre-noire px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer flex items-center gap-1"
                    title="Ouvrir la fiche complète et éditer tous les champs du profil"
                  >
                    ✏️ Profil complet
                  </button>

                  {/* Bouton de validation pour les nouveaux membres (vert sémantique) */}
                  {isNewMember && handleValidateNewMember && (
                    <button
                      type="button"
                      onClick={() => handleValidateNewMember(userItem.id)}
                      disabled={savingId === userItem.id}
                      className="text-[9px] font-black uppercase bg-[#2d6a4f] hover:bg-[#2d6a4f]/90 text-white border border-encre-noire px-2.5 py-1 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer animate-pulse"
                      title="Valider l'inscription de ce nouveau membre"
                    >
                      {savingId === userItem.id ? "..." : "✅ Valider l'inscription"}
                    </button>
                  )}

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
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
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
                      {customCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* External App Rights */}
              {!isArchived && (
                <div className="flex flex-col gap-1.5 border-t border-dashed border-cordel-master-dark/10 pt-3">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Accès Autres Applications (Écriture)
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-0.5">
                    <label className={`flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none hover:opacity-80 ${seqReached && !activeAppRights.sequenciador ? 'opacity-50 grayscale' : ''}`}>
                      <input
                        type="checkbox"
                        checked={activeAppRights.sequenciador}
                        onChange={(e) => handleAppRightToggle(userItem.id, 'sequenciador', e.target.checked)}
                        disabled={savingId === userItem.id || (seqReached && !activeAppRights.sequenciador)}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <span>
                        Séquenciador (Mestre)
                        {quotas.sequenciador !== undefined && quotas.sequenciador !== null && (
                          <span className="text-[7px] text-cordel-master-dark ml-1">({appRightsUsage.sequenciador}/{quotas.sequenciador})</span>
                        )}
                      </span>
                    </label>
                    <label className={`flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none hover:opacity-80 ${danReached && !activeAppRights.dansador ? 'opacity-50 grayscale' : ''}`}>
                      <input
                        type="checkbox"
                        checked={activeAppRights.dansador}
                        onChange={(e) => handleAppRightToggle(userItem.id, 'dansador', e.target.checked)}
                        disabled={savingId === userItem.id || (danReached && !activeAppRights.dansador)}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <span>
                        Dançador (Mestre)
                        {quotas.dansador !== undefined && quotas.dansador !== null && (
                          <span className="text-[7px] text-cordel-master-dark ml-1">({appRightsUsage.dansador}/{quotas.dansador})</span>
                        )}
                      </span>
                    </label>
                    <label className={`flex items-center gap-1.5 cursor-pointer text-[9px] font-bold select-none hover:opacity-80 ${orchReached && !activeAppRights.orchestrador ? 'opacity-50 grayscale' : ''}`}>
                      <input
                        type="checkbox"
                        checked={activeAppRights.orchestrador}
                        onChange={(e) => handleAppRightToggle(userItem.id, 'orchestrador', e.target.checked)}
                        disabled={savingId === userItem.id || (orchReached && !activeAppRights.orchestrador)}
                        className="w-3 h-3 cursor-pointer"
                      />
                      <span>
                        Orchestrador (Mestre)
                        {quotas.orchestrador !== undefined && quotas.orchestrador !== null && (
                          <span className="text-[7px] text-cordel-master-dark ml-1">({appRightsUsage.orchestrador}/{quotas.orchestrador})</span>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Custom info fields (if enabled in organization settings) */}
              {fieldsConfig && !isArchived && (
                <div className="flex flex-col gap-2 border-t border-dashed border-cordel-master-dark/10 pt-3">
                  <label className="text-[8px] uppercase font-bold tracking-wider text-cordel-master-dark">
                    Informations rapides de profil
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

              {/* Tags Selector Panel */}
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

              </div>
            </CordelAccordion>
          );
        })}
      </CordelAccordionGroup>

      {/* Modale d'édition complète du profil par l'administrateur */}
      {modalUser && (
        <MemberProfileEditModal
          userItem={modalUser}
          availableTags={availableTags}
          customCategories={customCategories}
          onClose={handleCloseModal}
          onSave={handleSaveFromModal}
          onValidateNewMember={handleValidateNewMember}
          saving={savingId === modalUser.id}
        />
      )}
    </>
  );
}
