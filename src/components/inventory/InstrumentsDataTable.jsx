import React from 'react';
import { XiloChisel } from '../XiloIcons';
import XiloAvatar from '../XiloAvatar';
import { useTranslation } from '../LanguageContext';
import {
  INSTRUMENT_TYPES,
  ETAT_OPTIONS,
  INSTRUMENT_ICONS,
  getEtatLabel,
  getKitCompletionText,
  normalizeInstrumentAttribution
} from './inventoryConstants';

/**
 * Tableau interactif du parc d'instruments avec colonnes sticky,
 * édition rapide en ligne et déclencheurs d'actions.
 *
 * @param {Object} props
 * @param {Array} props.instruments Liste des instruments (filtrés et triés)
 * @param {Array} props.usersList Liste complète des membres du groupe
 * @param {Object} props.usersMap Dictionnaire ID -> Nom Prénom
 * @param {Object} props.sortConfig Configuration active du tri ({ key, direction })
 * @param {Function} props.onSortHeaderClick Callback de changement de tri
 * @param {Function} props.onInlineFieldChange Callback de modification inline d'un champ
 * @param {Function} props.onAssignBorrower Callback d'affectation d'emprunteur
 * @param {Function} props.onReturnInstrument Callback de retour rapide au local
 * @param {Function} props.onOpenEdit Callback d'ouverture de la modale d'édition complète
 * @param {Function} props.onDelete Callback de suppression d'un instrument
 * @param {Function} props.onDiagnose Callback d'ouverture du diagnostic atelier
 * @param {Array} props.logisticsKits Kits configurés pour le calcul d'avancement
 * @param {Function} props.t Fonction de traduction
 */
export default function InstrumentsDataTable({
  instruments = [],
  usersList = [],
  usersMap: _usersMap = {},
  sortConfig = { key: 'nom', direction: 'asc' },
  onSortHeaderClick,
  onInlineFieldChange,
  onAssignBorrower,
  onToggleAssignation,
  onReturnInstrument,
  onOpenEdit,
  onDelete,
  onDiagnose,
  logisticsKits = [],
  t: propT
}) {
  const { t: hookT } = useTranslation();
  const t = propT || hookT;
  const renderSortChevron = (key) => {
    if (sortConfig.key !== key) {
      return <span className="opacity-30 text-[9px] ml-1 font-bold select-none">↕️</span>;
    }
    return (
      <span className="text-[10px] ml-1 font-black text-cordel-wood select-none">
        {sortConfig.direction === 'asc' ? '🔼' : '🔽'}
      </span>
    );
  };

  return (
    <div data-tour="inventory-table-view" className="w-full max-h-[calc(100dvh-280px)] overflow-x-auto overflow-y-auto border-2 border-encre-noire rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-cordel-card-bg relative">
      <table className="w-full text-left text-xs border-collapse min-w-[950px]">
        <thead className="bg-cordel-bg-light border-b-2 border-encre-noire text-[10px] uppercase tracking-wider text-cordel-wood font-black select-none sticky top-0 z-20">
          <tr>
            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('nom')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 left-0 z-30 bg-cordel-bg-light"
              title={t('logistics.sortByNomRefTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thNomRef')}</span>
                {renderSortChevron('nom')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('type')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByFamilleTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thFamilleType')}</span>
                {renderSortChevron('type')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('proprietaire')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByProprietaireTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thProprietaire')}</span>
                {renderSortChevron('proprietaire')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('localisation')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByLocalisationTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thLocalisation')}</span>
                {renderSortChevron('localisation')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('etat')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByEtatTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thEtat')}</span>
                {renderSortChevron('etat')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('kit')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByKitTitle')}
            >
              <div className="flex items-center gap-1 justify-center">
                <span>{t('logistics.thKit')}</span>
                {renderSortChevron('kit')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('status')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByStatutPretTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thStatutPret')}</span>
                {renderSortChevron('status')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('assignations')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title={t('logistics.sortByAssignationsTitle')}
            >
              <div className="flex items-center gap-1">
                <span>{t('logistics.thAssignations')}</span>
                {renderSortChevron('assignations')}
              </div>
            </th>

            <th className="p-3 text-right sticky top-0 z-20">{t('logistics.thActions')}</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-encre-noire/10 font-medium">
          {(!instruments || instruments.length === 0) ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-xs text-cordel-master-dark/60 italic bg-white/30">
                {t('inventory.noInstrumentsFilter')}
              </td>
            </tr>
          ) : (
            instruments.map((inst) => {
              const iconPath = INSTRUMENT_ICONS[inst.type] || INSTRUMENT_ICONS.Autre;
              const attr = normalizeInstrumentAttribution(inst);

            return (
              <tr key={inst.id} className="hover:bg-cordel-hover/50 transition-colors">
                {/* Colonne fixe 1 : Nom / Réf */}
                <td className="p-2 border-r border-encre-noire/15 font-extrabold text-encre-noire sticky left-0 z-10 bg-cordel-bg shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] min-w-[170px]">
                  <div className="flex items-center gap-2">
                    <img src={iconPath} alt={inst.type || 'Instrument'} className="w-5 h-5 object-contain shrink-0" />
                    <input
                      type="text"
                      key={`${inst.id}_nom_${inst.nom}`}
                      defaultValue={inst.nom || ''}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== inst.nom && onInlineFieldChange) {
                          onInlineFieldChange(inst.id, 'nom', val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      className="theme-input text-xs font-extrabold py-1 px-1.5 bg-white/80 dark:bg-stone-800/80 focus:bg-white border-encre-noire/20 hover:border-encre-noire w-full rounded"
                      placeholder={t('logistics.instrumentNamePlaceholder')}
                      title={t('logistics.clickToEditNameTitle')}
                    />
                  </div>
                </td>

                {/* Colonne 2 : Famille / Type */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[120px]">
                  <select
                    value={inst.type || 'Alfaia'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onInlineFieldChange && onInlineFieldChange(inst.id, 'type', e.target.value)}
                    className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light/90 border-encre-noire/20 hover:border-encre-noire w-full rounded text-cordel-wood cursor-pointer"
                    title={t('logistics.editInstrumentFamilyTitle')}
                  >
                    {INSTRUMENT_TYPES.map((tVal) => (
                      <option key={tVal} value={tVal}>{tVal}</option>
                    ))}
                  </select>
                </td>

                {/* Colonne 3 : Propriétaire */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[155px]">
                  <select
                    value={inst.proprietaire || 'Association'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onInlineFieldChange && onInlineFieldChange(inst.id, 'proprietaire', e.target.value)}
                    className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light/90 border-encre-noire/20 hover:border-encre-noire w-full rounded text-cordel-master-dark cursor-pointer"
                    title={t('logistics.editOwnerTitle')}
                  >
                    <option value="Association">{t('logistics.ownerAssociation')}</option>
                    <optgroup label={t('logistics.groupMembers')}>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>👤 {u.prenom} {u.nom}</option>
                      ))}
                    </optgroup>
                  </select>
                </td>

                {/* Colonne 4 : Localisation physique */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[155px]">
                  <select
                    value={inst.localisationPhysique || 'Local'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onInlineFieldChange && onInlineFieldChange(inst.id, 'localisationPhysique', e.target.value)}
                    className="theme-input text-xs font-bold py-1 px-2 bg-cordel-bg-light/90 border-encre-noire/20 hover:border-encre-noire w-full rounded text-encre-noire cursor-pointer"
                    title={t('logistics.editStorageLocationTitle')}
                  >
                    <option value="Local">{t('logistics.locationLocal')}</option>
                    <optgroup label={t('logistics.groupAtMember')}>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>{t('logistics.locationAtMemberPrefix')} {u.prenom} {u.nom}</option>
                      ))}
                    </optgroup>
                  </select>
                </td>

                {/* Colonne 5 : État physique */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[110px]">
                  <select
                    value={inst.etat || 'Bon'}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onInlineFieldChange && onInlineFieldChange(inst.id, 'etat', e.target.value)}
                    className={`theme-input text-xs font-extrabold py-1 px-2 rounded border w-full cursor-pointer ${
                      inst.etat === 'À réparer' || inst.etat === 'Para consertar'
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-400 font-black'
                        : inst.etat === 'Neuf'
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-400'
                          : 'bg-cordel-bg-light/90 text-cordel-wood border-encre-noire/20'
                    }`}
                    title={t('logistics.editStateTitle')}
                  >
                    {ETAT_OPTIONS.map((eOpt) => (
                      <option key={eOpt} value={eOpt}>{getEtatLabel(eOpt, t)}</option>
                    ))}
                  </select>
                </td>

                {/* Colonne 6 : Kit Accessoires */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[70px] text-center text-[10px] font-bold text-encre-noire/80">
                  {getKitCompletionText(inst, logisticsKits)}
                </td>

                {/* Colonne 7 : Statut / Emprunt */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[160px]">
                  <div className="flex flex-col gap-1">
                    <select
                      value={inst.status || 'En stock'}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        if (newStatus !== 'Emprunté') {
                          onInlineFieldChange?.(inst.id, 'status', newStatus);
                          if (inst.borrowedBy) {
                            onInlineFieldChange?.(inst.id, 'borrowedBy', null);
                          }
                        } else {
                          onInlineFieldChange?.(inst.id, 'status', 'Emprunté');
                        }
                      }}
                      className={`text-[10px] font-black uppercase py-1 px-2 rounded border w-full cursor-pointer ${
                        inst.status === 'Emprunté'
                          ? 'bg-amber-100 dark:bg-amber-950/30 border-amber-400 text-amber-800 dark:text-amber-300'
                          : inst.status === 'En réparation'
                            ? 'bg-red-100 dark:bg-red-950/30 border-red-400 text-red-800 dark:text-red-300'
                            : 'bg-green-100 dark:bg-green-950/30 border-green-400 text-green-800 dark:text-green-300'
                      }`}
                      title={t('logistics.editUsageStatusTitle')}
                    >
                      <option value="En stock">{t('logistics.statusInStock')}</option>
                      <option value="Emprunté">{t('logistics.statusBorrowed')}</option>
                      <option value="En réparation">{t('logistics.statusInRepair')}</option>
                    </select>

                    {inst.status === 'Emprunté' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <select
                          value={inst.borrowedBy || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onAssignBorrower?.(inst.id, e.target.value)}
                          className="theme-input text-[9px] font-bold py-0.5 px-1 bg-white dark:bg-stone-800 border-amber-400 w-full"
                          title={t('logistics.borrowingMemberTitle')}
                        >
                          <option value="">{t('logistics.borrowerSelectPrompt')}</option>
                          {usersList.map((u) => (
                            <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                          ))}
                        </select>
                        {inst.borrowedBy && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onReturnInstrument?.(inst.id);
                            }}
                            className="text-[8px] font-black uppercase bg-cordel-wood text-white px-1.5 py-1 rounded border border-encre-noire hover:brightness-110 cursor-pointer shrink-0"
                            title={t('logistics.returnInstrumentToLocalTitle')}
                          >
                            ↩️
                          </button>
                        )}
                      </div>
                    )}

                    {/* Badges sobres régime d'attribution et caution */}
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {attr.regimeMiseADisposition === 'pret_gratuit' && (
                        <span className="text-[8px] font-bold text-[var(--color-cordel-vert)] bg-white/70 dark:bg-stone-800/70 px-1 py-0.5 rounded border border-[#2d6a4f]/25" title={t('logistics.pretGracieuxTitle')}>
                          {t('logistics.pretGratuitBadge')}
                        </span>
                      )}
                      {attr.regimeMiseADisposition === 'cotisation' && (
                        <span className="text-[8px] font-bold text-[var(--color-cordel-ocre)] bg-white/70 dark:bg-stone-800/70 px-1 py-0.5 rounded border border-[#c05621]/25" title={t('logistics.misADispositionCotisationSimpleTitle')}>
                          {t('logistics.cotisationBadge')}
                        </span>
                      )}
                      {attr.regimeMiseADisposition === 'personnel' && (
                        <span className="text-[8px] font-bold text-stone-600 dark:text-stone-300 bg-white/70 dark:bg-stone-800/70 px-1 py-0.5 rounded border border-stone-300" title={t('logistics.instrumentPersonnelMembreTitle')}>
                          {t('logistics.personnelBadge')}
                        </span>
                      )}

                      {attr.cautionRequise && (
                        <span
                          className={`text-[8px] font-black px-1 py-0.5 rounded border ${
                            attr.caution.statut === 'recue'
                              ? 'bg-[var(--color-cordel-vert)]/10 text-[var(--color-cordel-vert)] border-[#2d6a4f]/30'
                              : attr.caution.statut === 'restituee'
                                ? 'bg-stone-100 text-stone-600 border-stone-300'
                                : 'bg-[var(--color-cordel-ocre)]/10 text-[var(--color-cordel-ocre)] border-[#c05621]/30'
                          }`}
                          title={attr.caution.referencePiece ? `Caution ${attr.caution.type} (${attr.caution.referencePiece})` : `Caution ${attr.caution.type}`}
                        >
                          {attr.caution.statut === 'recue' && `✓ ${attr.caution.montant}€`}
                          {attr.caution.statut === 'en_attente' && `⏳ ${attr.caution.montant}€`}
                          {attr.caution.statut === 'restituee' && `↩️ Restituée`}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Colonne 8 : Assignations de membres */}
                <td className="p-2 border-r border-encre-noire/10 min-w-[160px]">
                  <div className="flex flex-col gap-1.5">
                    {/* Liste des membres assignés */}
                    <div className="flex flex-wrap items-center gap-1">
                      {inst.assignations && inst.assignations.length > 0 ? (
                        inst.assignations.map((uid) => {
                          const u = usersList.find((userObj) => userObj.id === uid);
                          if (!u) return null;
                          const fullName = `${u.prenom} ${u.nom}`;
                          return (
                            <span 
                              key={uid} 
                              className="inline-flex items-center gap-1 bg-white/70 dark:bg-stone-800/70 px-1.5 py-0.5 rounded border border-dashed border-encre-noire/25 text-[9px] font-semibold"
                            >
                              <XiloAvatar src={u.photoURL} name={fullName} size={14} />
                              <span>{fullName}</span>
                              {onToggleAssignation && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleAssignation(inst.id, uid);
                                  }}
                                  className="text-[9px] text-[var(--color-cordel-rouge)] hover:brightness-125 ml-0.5 font-black cursor-pointer leading-none px-0.5"
                                  title={`Retirer l'assignation de ${fullName}`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] opacity-40 italic">-</span>
                      )}
                    </div>

                    {/* Sélecteur d'assignation rapide en 1 clic */}
                    {onToggleAssignation && (
                      <div className="flex items-center gap-1">
                        <select
                          value=""
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            if (e.target.value) {
                              onToggleAssignation(inst.id, e.target.value);
                            }
                          }}
                          className="theme-input text-[9px] font-bold py-0.5 px-1 bg-white dark:bg-stone-800 border-dashed border-encre-noire/30 w-full cursor-pointer hover:border-encre-noire transition-colors"
                          title={t('logistics.assignMemberQuickTitle')}
                        >
                          <option value="">{t('logistics.assignMemberPrompt')}</option>
                          {usersList
                            .filter((u) => !(inst.assignations || []).includes(u.id))
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.prenom} {u.nom}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                </td>

                {/* Colonne 9 : Actions */}
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit?.(inst);
                      }}
                      className="p-1.5 border border-encre-noire bg-cordel-bg-light hover:bg-cordel-hover text-encre-noire rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                      title={t('logistics.fullEditFormTitle')}
                    >
                      <XiloChisel size={10} />
                    </button>

                    {inst.status === 'En réparation' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDiagnose?.(inst);
                        }}
                        className="p-1.5 border border-cordel-rouge/40 bg-cordel-rouge/10 hover:bg-cordel-rouge text-cordel-rouge hover:text-white rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-colors text-[10px]"
                        title={t('logistics.diagnoseWorkshopTitle')}
                      >
                        🩺
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(inst.id);
                      }}
                      className="p-1.5 border border-red-700 bg-red-50 hover:bg-red-100 text-red-700 rounded shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer text-[10px]"
                      title={t('logistics.deletePermanentTitle')}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
        </tbody>
      </table>
    </div>
  );
}
