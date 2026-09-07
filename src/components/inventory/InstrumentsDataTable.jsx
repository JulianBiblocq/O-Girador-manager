import React from 'react';
import { XiloChisel } from '../XiloIcons';
import XiloAvatar from '../XiloAvatar';
import {
  INSTRUMENT_TYPES,
  ETAT_OPTIONS,
  INSTRUMENT_ICONS,
  getEtatLabel,
  getKitCompletionText
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
  onReturnInstrument,
  onOpenEdit,
  onDelete,
  onDiagnose,
  logisticsKits = [],
  t
}) {
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
    <div className="w-full max-h-[calc(100vh-280px)] overflow-x-auto overflow-y-auto border-2 border-encre-noire rounded-[6px_4px_5px_3px] shadow-[2px_2px_0px_0px_#181716] bg-cordel-card-bg relative">
      <table className="w-full text-left text-xs border-collapse min-w-[950px]">
        <thead className="bg-cordel-bg-light border-b-2 border-encre-noire text-[10px] uppercase tracking-wider text-cordel-wood font-black select-none sticky top-0 z-20">
          <tr>
            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('nom')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 left-0 z-30 bg-cordel-bg-light"
              title="Cliquer pour trier par Nom / Réf"
            >
              <div className="flex items-center gap-1">
                <span>Nom / Réf</span>
                {renderSortChevron('nom')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('type')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par Famille / Type"
            >
              <div className="flex items-center gap-1">
                <span>Famille / Type</span>
                {renderSortChevron('type')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('proprietaire')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par Propriétaire"
            >
              <div className="flex items-center gap-1">
                <span>Propriétaire</span>
                {renderSortChevron('proprietaire')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('localisation')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par Localisation"
            >
              <div className="flex items-center gap-1">
                <span>Localisation</span>
                {renderSortChevron('localisation')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('etat')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par État"
            >
              <div className="flex items-center gap-1">
                <span>État</span>
                {renderSortChevron('etat')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('kit')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par Kit"
            >
              <div className="flex items-center gap-1 justify-center">
                <span>Kit</span>
                {renderSortChevron('kit')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('status')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par Statut / Prêt"
            >
              <div className="flex items-center gap-1">
                <span>Statut / Prêt</span>
                {renderSortChevron('status')}
              </div>
            </th>

            <th 
              onClick={() => onSortHeaderClick && onSortHeaderClick('assignations')}
              className="p-3 border-r border-encre-noire/15 cursor-pointer hover:bg-black/5 transition-colors sticky top-0 z-20"
              title="Cliquer pour trier par Assignations"
            >
              <div className="flex items-center gap-1">
                <span>Assignations</span>
                {renderSortChevron('assignations')}
              </div>
            </th>

            <th className="p-3 text-right sticky top-0 z-20">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-encre-noire/10 font-medium">
          {instruments.map((inst) => {
            const iconPath = INSTRUMENT_ICONS[inst.type] || INSTRUMENT_ICONS.Autre;

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
                      placeholder="Nom de l'instrument"
                      title="Cliquer pour modifier le nom"
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
                    title="Modifier la famille d'instrument"
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
                    title="Modifier le propriétaire"
                  >
                    <option value="Association">🏢 Association</option>
                    <optgroup label="Membres">
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
                    title="Modifier le lieu de stockage"
                  >
                    <option value="Local">📍 Local</option>
                    <optgroup label="Chez un membre">
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>🏠 Chez {u.prenom} {u.nom}</option>
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
                    title="Modifier l'état"
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
                      title="Modifier le statut d'utilisation"
                    >
                      <option value="En stock">En stock</option>
                      <option value="Emprunté">Emprunté</option>
                      <option value="En réparation">En réparation</option>
                    </select>

                    {inst.status === 'Emprunté' && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <select
                          value={inst.borrowedBy || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onAssignBorrower?.(inst.id, e.target.value)}
                          className="theme-input text-[9px] font-bold py-0.5 px-1 bg-white dark:bg-stone-800 border-amber-400 w-full"
                          title="Membre emprunteur"
                        >
                          <option value="">🤝 Emprunteur...</option>
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
                            title="Restituer l'instrument au local"
                          >
                            ↩️
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>

                {/* Colonne 8 : Assignations de membres */}
                <td className="p-2 border-r border-encre-noire/10">
                  {inst.assignations && inst.assignations.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {inst.assignations.map((uid) => {
                        const u = usersList.find((userObj) => userObj.id === uid);
                        if (!u) return null;
                        const fullName = `${u.prenom} ${u.nom}`;
                        return (
                          <span 
                            key={uid} 
                            className="inline-flex items-center gap-1 bg-white/60 dark:bg-stone-800/60 px-1.5 py-0.5 rounded border border-dashed border-encre-noire/20 text-[9px] font-semibold"
                          >
                            <XiloAvatar src={u.photoURL} name={fullName} size={14} />
                            <span>{fullName}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] opacity-40 italic">-</span>
                  )}
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
                      title="Formulaire d'édition complet (assignations, kit, nomenclature...)"
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
                        title="Diagnostiquer (Réparation en atelier)"
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
                      title="Supprimer définitivement de l'inventaire"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
