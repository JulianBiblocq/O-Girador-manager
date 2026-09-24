import React from 'react';
import CordelCard from '../CordelCard';
import PieceAisanceSection from './PieceAisanceSection';

// Échelle des 4 niveaux de confort personnel de l'adhérent
const COMFORT_LEVELS = [
  { level: 1, label: 'Découverte', icon: '🌱', tip: 'En phase de découverte' },
  { level: 2, label: 'En pratique', icon: '🌿', tip: 'En cours d\'apprentissage' },
  { level: 3, label: 'À l\'aise', icon: '🌳', tip: 'Autonome sur le morceau' },
  { level: 4, label: 'Référent', icon: '👑', tip: 'Parfaitement maîtrisé, prêt à guider' }
];

/**
 * Carte individuelle d'un morceau du Répertoire destinée aux élèves/adhérents (< 200 lignes).
 * Intègre les demandes de révision, le curseur de confort, les passerelles multimédias
 * et le bloc d'aisance Speed Trainer (règle Zéro bloc vide).
 */
export default function MemberPieceCard({
  piece,
  userId,
  groupId,
  trainings = [],
  aisanceMap = {},
  isRevisionRequested = false,
  comfortLevel = 0,
  onToggleRevision,
  onSetComfortLevel,
  onOpenTablature,
  onOpenToada,
  onOpenCulture,
  sequenceurUrl
}) {
  if (!piece) return null;
  const isMastered = piece.etatValidation === 'pret';

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="p-4 flex flex-col gap-3 text-left">
      {/* 1. En-tête : Titre et badge de maturité artistique */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/20 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-base font-black text-encre-noire uppercase tracking-wide">
            {piece.titre}
          </h3>
          {piece.activeBpm && (
            <span className="text-[10px] font-bold text-stone-600 bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded border border-encre-noire/15">
              {piece.activeBpm} BPM
            </span>
          )}
        </div>

        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border self-start sm:self-auto ${
          isMastered ? 'bg-emerald-100 text-emerald-900 border-emerald-400' : 'bg-amber-100 text-amber-900 border-amber-400'
        }`}>
          {isMastered ? '🟢 Maîtrisé' : '🟡 En apprentissage'}
        </span>
      </div>

      {/* 2. Ligne d'actions adhérent : Demande de révision & Curseur de confort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-cordel-bg-light/60 p-2.5 rounded border border-encre-noire/15">
        <button
          type="button"
          onClick={() => onToggleRevision && onToggleRevision(piece.id)}
          className={`px-3 py-1.5 text-xs font-black rounded border transition-all cursor-pointer flex items-center gap-1.5 self-start select-none shadow-2xs ${
            isRevisionRequested
              ? 'bg-amber-100 border-[var(--color-cordel-ocre,#c05621)] text-[var(--color-cordel-ocre,#c05621)]'
              : 'bg-white border-encre-noire/25 text-stone-700 hover:bg-stone-50'
          }`}
          title={isRevisionRequested ? 'Annuler la demande' : 'Signaler au Mestre le besoin de réviser'}
        >
          <span>🙋</span>
          <span>{isRevisionRequested ? 'Révision demandée' : 'Demander à réviser'}</span>
        </button>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[9.5px] uppercase font-bold text-stone-600 mr-1 select-none">Mon confort :</span>
          <div className="flex items-center gap-1">
            {COMFORT_LEVELS.map((c) => {
              const isSelected = comfortLevel === c.level;
              return (
                <button
                  key={c.level}
                  type="button"
                  onClick={() => onSetComfortLevel && onSetComfortLevel(piece.id, isSelected ? 0 : c.level)}
                  className={`px-2 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-2xs select-none ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-950 scale-105'
                      : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 opacity-75 hover:opacity-100'
                  }`}
                  title={`${c.icon} ${c.label} : ${c.tip}`}
                >
                  <span>{c.icon}</span>
                  <span className="text-[9px] hidden md:inline">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Notes du Mestre (affichées uniquement si renseignées) */}
      {piece.notes && piece.notes.trim() !== '' && (
        <div className="p-2.5 rounded bg-amber-50/80 border border-dashed border-amber-300 text-left">
          <span className="text-[9.5px] uppercase font-black text-amber-950 flex items-center gap-1 mb-1">
            <span>📝</span>
            <span>Notes du Mestre</span>
          </span>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{piece.notes}</p>
        </div>
      )}

      {/* 4. Badges & Passerelles multimédias (rendu conditionnel strict) */}
      <div className="flex flex-wrap items-center gap-2">
        {piece.activeToada && (
          <button
            type="button"
            onClick={() => onOpenToada && onOpenToada(piece.activeToada)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter les paroles de la Toada"
          >
            <span>🗣️</span>
            <span>Paroles ({piece.activeToada.titre || 'Toada'})</span>
          </button>
        )}

        {piece.hasTablature && (
          <button
            type="button"
            onClick={() => onOpenTablature && onOpenTablature(piece)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-stone-50 hover:bg-stone-100 border border-stone-300 text-stone-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter la tablature complète"
          >
            <span>📄</span>
            <span>Tablature</span>
          </button>
        )}

        {piece.activeChoreography && (
          <div className="px-2.5 py-1 text-xs font-bold rounded bg-purple-50 border border-purple-200 text-purple-900 flex items-center gap-1.5 shadow-2xs select-none">
            <span>💃</span>
            <span>Danse : {piece.activeChoreography.nom || 'Chorégraphie'}</span>
          </div>
        )}

        {piece.activeCultureDoc && (
          <button
            type="button"
            onClick={() => onOpenCulture && onOpenCulture(piece.activeCultureDoc)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Consulter la fiche culturelle"
          >
            <span>📖</span>
            <span>Fiche Culture</span>
          </button>
        )}
      </div>

      {/* Lecteur audio autonome si renseigné */}
      {piece.activeAudioUrl && (
        <div className="flex items-center gap-2 p-2 rounded bg-black/5 dark:bg-white/5 border border-encre-noire/15">
          <span className="text-xs select-none">🎧</span>
          <audio controls src={piece.activeAudioUrl} className="w-full h-8" preload="none" />
        </div>
      )}

      {/* 5. Pied de carte : Paliers d'Aisance & Speed Trainer */}
      <PieceAisanceSection
        piece={piece}
        trainings={trainings}
        aisanceMap={aisanceMap}
        userId={userId}
        groupId={groupId}
        sequenceurUrl={sequenceurUrl}
      />
    </CordelCard>
  );
}
