import React from 'react';
import PieceAisanceSection from './PieceAisanceSection';

/**
 * Contenu déplié de la carte morceau pour adhérents (lecture seule stricte).
 * Affiche les notes, lecteurs audios, toadas, tablatures, danse, culture, vidéos et entraînements.
 */
export default function MemberPieceUnfoldedContent({
  piece,
  userId,
  groupId,
  trainings = [],
  aisanceMap = {},
  onOpenTablature,
  onOpenToada,
  onOpenCulture,
  sequenceurUrl
}) {
  const audioUrl = piece.activeAudioUrl || piece.audioUrl;
  const videoUrl = piece.activeVideoUrl || piece.videoUrl || piece.youtubeUrl;
  const cultureDocs = Array.isArray(piece.activeCultureDocs) && piece.activeCultureDocs.length > 0
    ? piece.activeCultureDocs
    : (piece.activeCultureDoc ? [piece.activeCultureDoc] : []);

  return (
    <div className="p-3.5 flex flex-col gap-3 text-left">
      {/* 1. Notes du Mestre */}
      {piece.notes && piece.notes.trim() !== '' && (
        <div className="p-2.5 rounded bg-amber-50/80 border border-dashed border-amber-300 text-left">
          <span className="text-[9.5px] uppercase font-black text-amber-950 flex items-center gap-1 mb-1">
            <span>📝</span>
            <span>Notes du Mestre</span>
          </span>
          <p className="text-xs text-amber-900 whitespace-pre-wrap leading-relaxed">{piece.notes}</p>
        </div>
      )}

      {/* 2. Lecteur audio compact Cordel */}
      {audioUrl && (
        <div className="flex items-center gap-2 p-2 rounded bg-cordel-bg-light border border-encre-noire/15">
          <span className="text-xs select-none">🎧</span>
          <audio controls src={audioUrl} className="w-full h-8" preload="none" />
        </div>
      )}

      {/* 3. Badges ressources multimédias */}
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
            <span>Danse : {piece.activeChoreography.nom || piece.activeChoreography.titre || 'Chorégraphie'}</span>
          </div>
        )}

        {cultureDocs.map((cDoc) => (
          <button
            key={cDoc.id}
            type="button"
            onClick={() => onOpenCulture && onOpenCulture(cDoc)}
            className="px-2.5 py-1 text-xs font-bold rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title={`Consulter la fiche culturelle : ${cDoc.titre || cDoc.name || ''}`}
          >
            <span>📖</span>
            <span>Culture : {cDoc.titre || cDoc.name || 'Fiche'}</span>
          </button>
        ))}

        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 text-xs font-bold rounded bg-red-50 hover:bg-red-100 border border-red-300 text-red-900 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all select-none"
            title="Regarder la vidéo du morceau"
          >
            <span>🎬</span>
            <span>Vidéo</span>
          </a>
        )}
      </div>

      {/* 4. Bloc Entraînements et Paliers d'Aisance */}
      <PieceAisanceSection
        piece={piece}
        trainings={trainings}
        aisanceMap={aisanceMap}
        userId={userId}
        groupId={groupId}
        sequenceurUrl={sequenceurUrl}
      />
    </div>
  );
}
