import React, { useState } from 'react';
import CordelButton from '../../CordelButton';
import { launchCrossApp } from '../../../utils/crossAppAuth';
import { useTranslation } from '../../LanguageContext';

/**
 * Pied de page de l'onglet Fil Conducteur : rythmes Sequenciador associés et formulaire d'ajout Admin (< 130 lignes).
 */
export default function EventRevisionFilConducteurFooter({
  linkedSequencerRhythms = [],
  assocSequenceurUrl,
  isEventDanse = false,
  isAuthorized = false,
  updatingSetlist = false,
  loadingRepertoire = false,
  activeRepertoirePieces = [],
  newMorceauTitre = '',
  setNewMorceauTitre,
  newMorceauNotes = '',
  setNewMorceauNotes,
  handleAddMorceau,
  handleAddRepertoirePiece
}) {
  const { t } = useTranslation();
  const [selectedRepertoirePieceId, setSelectedRepertoirePieceId] = useState('');

  return (
    <>
      {linkedSequencerRhythms.length > 0 && (
        <div className="mt-5 pt-4 border-t-2 border-dashed border-cordel-master-dark/15 flex flex-col gap-2.5">
          <h5 className="font-black text-xs uppercase tracking-wider text-cordel-wood flex items-center gap-1.5">
            <span>🎛️</span>
            <span>Rythmes &amp; Presets Sequenciador associés ({linkedSequencerRhythms.length})</span>
          </h5>
          {linkedSequencerRhythms.map((rhythm) => {
            const baseUrl = assocSequenceurUrl || 'https://sequenciador.o-girador.com';
            const paramKey = rhythm._collection === 'sections' ? 'sectionId' : 'presetId';
            const modeParam = isEventDanse ? '&mode=danse' : '';
            const targetUrl = baseUrl.includes('?') ? `${baseUrl}&${paramKey}=${rhythm.id}${modeParam}` : `${baseUrl}?${paramKey}=${rhythm.id}${modeParam}`;

            return (
              <div key={rhythm.id} className="text-xs p-3 rounded theme-inner-panel flex flex-col gap-2 border border-cordel-master-dark/20 bg-white">
                <div className="flex flex-col">
                  <span className="font-bold text-encre-noire text-sm flex items-center gap-1.5">
                    🎛️ {rhythm.title || rhythm.titre || rhythm.name || 'Sans titre'}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-cordel-master-dark/60">
                    {rhythm._collection === 'sections' ? 'Section' : (rhythm._collection === 'presets' ? 'Preset (Arrangement Complet)' : 'Rythme')}
                  </span>
                </div>
                {rhythm.audioUrl && <audio controls src={rhythm.audioUrl} className="w-full h-8 mt-1" />}
                <button
                  type="button"
                  onClick={() => launchCrossApp(targetUrl, { appLabel: isEventDanse ? 'Sequenciador (Danse)' : 'Sequenciador', mode: isEventDanse ? 'danse' : undefined })}
                  className="theme-btn theme-bg-ocre text-encre-noire px-3 py-1.5 text-[10px] font-black rounded-[4px_6px_3px_5px] shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] inline-flex items-center justify-center gap-1.5 hover:brightness-105 w-full text-center mt-1 cursor-pointer"
                >
                  🎧 {isEventDanse ? 'Console Danse (Sequenciador)' : 'Ouvrir dans Sequenciador'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isAuthorized && (
        <div className="mt-4 pt-4 border-t border-dashed border-cordel-master-dark/15">
          <h5 className="font-bold text-[10px] uppercase tracking-widest text-cordel-wood mb-2.5 flex items-center gap-1.5">
            <span>➕</span><span>{t('agenda.programAddPiece') || 'Ajouter un morceau au programme'}</span>
          </h5>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const piece = activeRepertoirePieces.find((p) => p.id === selectedRepertoirePieceId);
              if (piece) {
                if (handleAddRepertoirePiece) handleAddRepertoirePiece(piece, newMorceauNotes);
                setSelectedRepertoirePieceId('');
                setNewMorceauTitre('');
                setNewMorceauNotes('');
              } else if (newMorceauTitre.trim()) {
                handleAddMorceau(e);
              }
            }}
            className="flex flex-col gap-2.5"
          >
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('agenda.chooseFromRepertoire') || 'Choisir un morceau du Répertoire'}
              </label>
              <select
                value={selectedRepertoirePieceId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedRepertoirePieceId(id);
                  const found = activeRepertoirePieces.find((p) => p.id === id);
                  if (found) {
                    setNewMorceauTitre(found.titre || '');
                    if (found.notes) setNewMorceauNotes(found.notes);
                  }
                }}
                disabled={updatingSetlist || loadingRepertoire}
                className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light w-full cursor-pointer"
              >
                <option value="">
                  {loadingRepertoire ? '-- Chargement du répertoire... --' : activeRepertoirePieces.length === 0 ? '-- Aucun morceau dans le répertoire --' : (t('agenda.programSelectFromRepertoire') || '-- Sélectionner un morceau du Répertoire --')}
                </option>
                {activeRepertoirePieces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.statutSaison === 'chantier' ? '🔨' : '📜'} {p.titre}{p.statutSaison === 'chantier' ? ' (En chantier)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                {t('agenda.pieceOrIntentionTitle') || "Titre du morceau ou de l'intention *"}
              </label>
              <input type="text" placeholder={t('agenda.programCustomTitlePlaceholder') || 'Titre du morceau...'} value={newMorceauTitre} onChange={(e) => setNewMorceauTitre(e.target.value)} disabled={updatingSetlist} required className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light" />
            </div>
            <div className="flex flex-col gap-1 text-left">
              <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
                🎯 {t('agenda.intentNotesFocus') || "Notes d'intention / focus de travail"}
              </label>
              <input type="text" placeholder={t('agenda.programMestreNotesPlaceholder') || 'Notes / consignes du Mestre...'} value={newMorceauNotes} onChange={(e) => setNewMorceauNotes(e.target.value)} disabled={updatingSetlist} className="theme-input text-xs font-bold py-1.5 bg-cordel-bg-light" />
            </div>
            <CordelButton variant="ocre" useExtremeBorder={true} disabled={updatingSetlist || (!newMorceauTitre.trim() && !selectedRepertoirePieceId)} className="w-full py-2 text-[10px] font-black uppercase tracking-widest">
              {updatingSetlist ? 'Enregistrement...' : (t('agenda.programBtnSaveSet') || 'Enregistrer le programme du set')}
            </CordelButton>
          </form>
        </div>
      )}
    </>
  );
}

