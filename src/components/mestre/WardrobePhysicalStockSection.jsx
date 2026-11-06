import React from 'react';
import CordelCard from '../CordelCard';
import { isActiveMember } from '../../utils/memberUtils';
import { exportWardrobeInventoryToCsv } from '../../utils/wardrobeCsvExportUtils';

/**
 * Section de gestion du stock physique des tenues, prêts aux adhérents et export CSV.
 * Extraite de WardrobeManager.jsx conformément à la Règle du Boy Scout (< 140 lignes).
 */
export default function WardrobePhysicalStockSection({
  costumes = [], allUsers = [], showCostumeForm = false, setShowCostumeForm,
  editingCostume, setEditingCostume, costumeForm, setCostumeForm,
  saving = false, handleCostumeSubmit, handleEditCostume, handleDeleteCostume, t
}) {
  return (
    <div className="pt-4 border-t-2 border-dashed border-cordel-master-dark/20 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-heading font-black text-sm text-cordel-wood uppercase tracking-wider text-left">
          {t('costumerie.stockPhysiqueEmpruntsDePieces')}
        </h3>
        <button
          type="button"
          onClick={() => exportWardrobeInventoryToCsv(costumes)}
          disabled={costumes.length === 0}
          className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded bg-cordel-bg hover:bg-white text-encre-noire border border-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] disabled:opacity-40 cursor-pointer self-start sm:self-auto"
        >
          📥 {t('costumerie.exportCsvBtn') || 'Exporter CSV'}
        </button>
      </div>

      <div className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-3 rounded border border-dashed border-encre-noire/15">
        <span className="text-xs font-bold text-cordel-master-dark">
          {t('costumerie.total')} {costumes.length} {t('costumerie.piece')}{costumes.length > 1 ? 's' : ''} {t('costumerie.repertoriee')}{costumes.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={() => {
            setEditingCostume(null);
            setCostumeForm({ type: '', taille: 'M', etat: 'Bon', statut: 'local', emprunteurId: '' });
            setShowCostumeForm(!showCostumeForm);
          }}
          className="text-[10px] font-black uppercase bg-cordel-vert hover:bg-cordel-vert/90 text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer"
        >
          {showCostumeForm ? 'Fermer le formulaire' : t('costumerie.btnAddPiece')}
        </button>
      </div>

      {showCostumeForm && (
        <form onSubmit={handleCostumeSubmit} className="flex flex-col gap-3.5 bg-white/40 dark:bg-black/20 p-4 rounded border border-dashed border-encre-noire/15 text-xs text-left">
          <span className="font-extrabold text-cordel-wood uppercase tracking-wider text-[10px] border-b border-dashed border-encre-noire/10 pb-1">
            {editingCostume ? '📝 Modifier la pièce' : '➕ Enregistrer une pièce de costume'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('wardrobe.pieceType')}</label>
              <input type="text" required disabled={saving} value={costumeForm.type} onChange={(e) => setCostumeForm({ ...costumeForm, type: e.target.value })} placeholder={t('costumerie.exJupeChemiseChapeau')} className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('costumerie.taille')}</label>
              <select disabled={saving} value={costumeForm.taille} onChange={(e) => setCostumeForm({ ...costumeForm, taille: e.target.value })} className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('costumerie.etat')}</label>
              <select disabled={saving} value={costumeForm.etat} onChange={(e) => setCostumeForm({ ...costumeForm, etat: e.target.value })} className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light">
                <option value="Neuf">{t('costumerie.neuf')}</option>
                <option value="Bon">{t('costumerie.bon')}</option>
                <option value="Moyen">{t('costumerie.moyen')}</option>
                <option value="Abîmé">{t('costumerie.abime')}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('costumerie.statut')}</label>
              <select disabled={saving} value={costumeForm.statut} onChange={(e) => setCostumeForm({ ...costumeForm, statut: e.target.value })} className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light">
                <option value="local">{t('costumerie.auLocal')}</option>
                <option value="emprunte">{t('costumerie.emprunte')}</option>
                <option value="reparation">{t('costumerie.enReparation')}</option>
              </select>
            </div>
            {costumeForm.statut === 'emprunte' && (
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[9px] uppercase font-bold text-cordel-master-dark">{t('costumerie.emprunteur')}</label>
                <select required disabled={saving} value={costumeForm.emprunteurId} onChange={(e) => setCostumeForm({ ...costumeForm, emprunteurId: e.target.value })} className="theme-input font-bold py-1.5 px-2 bg-cordel-bg-light">
                  <option value="" disabled>{t('costumerie.selectionnerUnMembre')}</option>
                  {(allUsers || []).filter(isActiveMember).map((u) => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button type="submit" disabled={saving} className="text-[10px] font-black uppercase bg-cordel-ocre text-encre-noire border border-encre-noire px-3 py-1.5 rounded shadow-[1.5px_1.5px_0px_0px_#181716] cursor-pointer">
              {saving ? 'Enregistrement...' : 'Valider'}
            </button>
          </div>
        </form>
      )}

      <CordelCard data-tour="costumerie-pieces-table" variant="default" useExtremeBorder={true} className="p-0 overflow-hidden">
        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold border-collapse">
            <thead>
              <tr className="bg-cordel-bg border-b border-encre-noire text-[9px] uppercase font-black text-cordel-master-dark tracking-wider select-none">
                <th className="py-2 px-2 md:py-2.5 md:px-4">{t('common.type')}</th>
                <th className="py-2 px-2 md:py-2.5 md:px-4 text-center">{t('onboarding.tshirtSize')}</th>
                <th className="py-2 px-2 md:py-2.5 md:px-4 text-center">{t('common.status')}</th>
                <th className="py-2 px-2 md:py-2.5 md:px-4">{t('common.status')}</th>
                <th data-tour="costumerie-pieces-assign" className="py-2 px-2 md:py-2.5 md:px-4">{t('costumerie.emprunteur')}</th>
                <th className="py-2 px-2 md:py-2.5 md:px-4 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-encre-noire/10">
              {costumes.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center italic opacity-60">{t('costumerie.lInventaireDesCostumesEst')}</td></tr>
              ) : (
                costumes.map((piece) => (
                  <tr key={piece.id} className="hover:bg-white/20 transition-colors">
                    <td className="py-2 px-2 md:py-2.5 md:px-4 font-bold">{piece.type}</td>
                    <td className="py-2 px-2 md:py-2.5 md:px-4 text-center font-black"><span className="bg-amber-100 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">{piece.taille}</span></td>
                    <td className="py-2 px-2 md:py-2.5 md:px-4 text-center"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 border border-encre-noire/15">{piece.etat}</span></td>
                    <td className="py-2 px-2 md:py-2.5 md:px-4 font-bold">{piece.statut === 'local' ? '🏠 Au local' : piece.statut === 'emprunte' ? '🎒 Emprunté' : '🛠️ En réparation'}</td>
                    <td className="py-2 px-2 md:py-2.5 md:px-4 italic text-cordel-wood/90">{piece.statut === 'emprunte' ? piece.emprunteurNom : '-'}</td>
                    <td className="py-2 px-2 md:py-2.5 md:px-4 text-right">
                      <div className="flex gap-2.5 justify-end">
                        <button type="button" onClick={() => handleEditCostume(piece)} className="text-[10px] font-black uppercase text-cordel-wood hover:underline cursor-pointer">{t('costumerie.btnEdit')}</button>
                        <button type="button" onClick={() => handleDeleteCostume(piece.id)} className="text-[10px] font-black uppercase text-red-600 hover:underline cursor-pointer">{t('costumerie.supprimer')}</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CordelCard>
    </div>
  );
}
