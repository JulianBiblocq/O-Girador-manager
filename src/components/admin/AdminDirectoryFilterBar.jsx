import React from 'react';
import CordelButton from '../CordelButton';
import { XiloPeople } from '../XiloIcons';

/**
 * Barre d'en-tête et de filtrage de l'annuaire des membres (Secrétariat).
 * Regroupe le compteur des membres joignables, les boutons d'action (Export, Inscription),
 * les onglets de statut (Actifs / Archivés / Tous) et les sélecteurs de filtre (Push, Rôle, Recherche).
 */
export default function AdminDirectoryFilterBar({
  filteredCount,
  reachableActiveCount,
  activeCount,
  archivedCount,
  totalCount,
  canCreateMember,
  statusFilter,
  setStatusFilter,
  pushFilter,
  setPushFilter,
  roleFilter,
  setRoleFilter,
  searchQuery,
  setSearchQuery,
  onOpenExportModal,
  onOpenManualModal,
  t
}) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-sm font-black uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
          <XiloPeople size={16} className="inline" /> {t('secretariat.membersDirectoryTitle', { count: filteredCount })}
        </h3>
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--color-cordel-vert,#2d6a4f)]/40 bg-[var(--color-cordel-vert,#2d6a4f)]/10 text-[var(--color-cordel-vert,#2d6a4f)] text-[10px] font-black uppercase tracking-wider"
          title="Nombre de membres actifs ayant activé les notifications Push sur au moins un appareil"
        >
          🔔 {t('secretariat.reachableActiveMembers', { reachable: reachableActiveCount, total: activeCount })}
        </span>
        <CordelButton
          type="button"
          variant="ocre"
          useExtremeBorder={true}
          onClick={onOpenExportModal}
          className="px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 ml-2 cursor-pointer"
        >
          📥 {t('secretariat.btnExportData') || 'Exporter les données'}
        </CordelButton>

        {canCreateMember && (
          <CordelButton
            type="button"
            variant="vert"
            useExtremeBorder={true}
            onClick={onOpenManualModal}
            className="px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5 ml-1 cursor-pointer"
            title="Inscrire manuellement un membre dans l'application sans qu'il ait besoin de créer son compte"
          >
            + {t('secretariat.btnRegisterMember')}
          </CordelButton>
        )}
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
        {/* Barre d'onglets de statut : Actifs / Archivés / Tous */}
        <div className="flex items-center gap-1.5 bg-cordel-master-dark/5 p-1 rounded border border-cordel-master-dark/15">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'active'
                ? 'bg-[var(--color-cordel-vert)] text-white shadow-xs'
                : 'text-cordel-master-dark hover:bg-black/5'
            }`}
          >
            <span>{t('secretariat.tabActive')}</span>
            <span
              className={`text-[8.5px] px-1 py-0.2 rounded-full font-black ${
                statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-black/10'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'archived'
                ? 'bg-cordel-wood text-white shadow-xs'
                : 'text-cordel-master-dark hover:bg-black/5'
            }`}
          >
            <span>{t('secretariat.tabArchived')}</span>
            <span
              className={`text-[8.5px] px-1 py-0.2 rounded-full font-black ${
                statusFilter === 'archived' ? 'bg-white/20 text-white' : 'bg-black/10'
              }`}
            >
              {archivedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'all'
                ? 'bg-cordel-master-dark text-white shadow-xs'
                : 'text-cordel-master-dark hover:bg-black/5'
            }`}
          >
            <span>{t('secretariat.tabAll')}</span>
            <span
              className={`text-[8.5px] px-1 py-0.2 rounded-full font-black ${
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/10'
              }`}
            >
              {totalCount}
            </span>
          </button>
        </div>

        {/* Filtre rapide Notifications Push */}
        <select
          value={pushFilter}
          onChange={(e) => setPushFilter(e.target.value)}
          className="theme-input text-xs font-bold py-1 px-2 bg-white"
          title="Filtrer par réception des notifications Push"
        >
          <option value="all">🔔 {t('secretariat.filterAllPush')}</option>
          <option value="reachable">{t('secretariat.pushFilterReachable') || '🔔 Joignables'}</option>
          <option value="unreachable">{t('secretariat.pushFilterUnreachable') || '🔕 Non joignables'}</option>
        </select>

        {/* Filtre de rôle */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="theme-input text-xs font-bold py-1 px-2 bg-white"
        >
          <option value="all">{t('secretariat.allRoles') || 'Tous les rôles'}</option>
          <option value="mestre">Mestre</option>
          <option value="admin">Administrateur</option>
          <option value="bureau">Bureau</option>
          <option value="ca">Conseil d&apos;Administration</option>
          <option value="membre">{t('secretariat.badgeMemberMasc') || 'Adhérent'}</option>
        </select>

        {/* Barre de recherche textuelle */}
        <input
          type="text"
          placeholder={t('secretariat.searchMemberDirectoryPlaceholder') || 'Rechercher nom, email, instrument...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="theme-input text-xs w-full md:w-56"
        />
      </div>
    </div>
  );
}

