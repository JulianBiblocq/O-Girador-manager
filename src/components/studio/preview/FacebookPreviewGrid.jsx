import React from 'react';

/**
 * Aperçu réaliste d'une publication au format Grille Mosaïque Facebook
 */
export default function FacebookPreviewGrid({
  mediaList = [],
  branding = null,
  publicationText = ''
}) {
  const assocName = branding?.nom || 'Samambaia Maracatu';
  const logoUrl = branding?.logoUrl || '/Pictures/tambour.png';
  const count = mediaList.length;

  return (
    <div className="w-full max-w-[380px] bg-white border border-stone-300 rounded-lg overflow-hidden shadow-md flex flex-col text-left font-sans select-none text-neutral-900">
      {/* En-tête profil Facebook */}
      <div className="p-3 flex items-center gap-2.5 border-b border-stone-100">
        <img src={logoUrl} alt="Logo" className="w-9 h-9 rounded-full border border-stone-200 object-cover" />
        <div className="flex flex-col">
          <span className="text-xs font-black text-stone-900">{assocName}</span>
          <span className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
            À l'instant · 🌐
          </span>
        </div>
      </div>

      {/* Texte de la publication Facebook au-dessus des photos */}
      <div className="px-3 py-2 text-xs text-stone-800 font-mono whitespace-pre-wrap max-h-[100px] overflow-y-auto leading-relaxed">
        {publicationText || "(Texte de publication en cours de saisie...)"}
      </div>

      {/* Mosaïque de photos adaptative */}
      <div className="w-full bg-stone-200 overflow-hidden">
        {count === 0 && (
          <div className="aspect-square flex items-center justify-center text-xs text-stone-400 font-bold p-4 text-center">
            Aucune photo sélectionnée
          </div>
        )}

        {count === 1 && (
          <div className="aspect-square w-full">
            <img src={mediaList[0].url} alt="Photo 1" className="w-full h-full object-cover" />
          </div>
        )}

        {count === 2 && (
          <div className="grid grid-cols-2 gap-0.5 aspect-square">
            <img src={mediaList[0].url} alt="Photo 1" className="w-full h-full object-cover" />
            <img src={mediaList[1].url} alt="Photo 2" className="w-full h-full object-cover" />
          </div>
        )}

        {count === 3 && (
          <div className="grid grid-cols-2 gap-0.5 aspect-square">
            <div className="h-full">
              <img src={mediaList[0].url} alt="Photo 1" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-rows-2 gap-0.5 h-full">
              <img src={mediaList[1].url} alt="Photo 2" className="w-full h-full object-cover" />
              <img src={mediaList[2].url} alt="Photo 3" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {count === 4 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square">
            {mediaList.slice(0, 4).map((img, i) => (
              <img key={img.id} src={img.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            ))}
          </div>
        )}

        {count >= 5 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-square">
            <img src={mediaList[0].url} alt="Photo 1" className="w-full h-full object-cover" />
            <img src={mediaList[1].url} alt="Photo 2" className="w-full h-full object-cover" />
            <img src={mediaList[2].url} alt="Photo 3" className="w-full h-full object-cover" />
            <div className="relative w-full h-full">
              <img src={mediaList[3].url} alt="Photo 4" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-black">
                +{count - 3}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barre d'actions Facebook */}
      <div className="p-2 border-t border-stone-200 flex items-center justify-around text-xs font-semibold text-stone-600">
        <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
          👍 J'aime
        </span>
        <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
          💬 Commenter
        </span>
        <span className="flex items-center gap-1 cursor-pointer hover:text-blue-600">
          ↗️ Partager
        </span>
      </div>
    </div>
  );
}
