import React, { useState } from 'react';
import CordelButton from '../CordelButton';

/**
 * Formulaire interne d'une campagne de commande groupée.
 * Sur mobile (< 768px), affiche la miniature (64x64px / 80x80px) horizontalement à côté du sélecteur
 * d'article (cliquable pour agrandir), tout en conservant le grand aperçu sur PC/Tablette (>= 768px).
 */
export default function CampaignOrderForm({
  catalog,
  article,
  setArticle,
  selectedTaille,
  setSelectedTaille,
  quantite,
  setQuantite,
  notes,
  setNotes,
  suggestion,
  setSuggestion,
  isPersonalOrder,
  setIsPersonalOrder,
  saving,
  handleSubmit,
  getArticleLabel,
  profileData,
  t
}) {
  const [zoomImageUrl, setZoomImageUrl] = useState(null);
  const FREE_REQUEST_VALUE = 'Hors catalogue / Demande libre';
  const isFreeRequest = article === FREE_REQUEST_VALUE;
  const artObj = catalog.find((item) => item.nom === article);
  const isTshirtSelected = article === 'T-shirt Homme' || article === 'T-shirt Femme';
  const isAlfaiaSkinSelected =
    article === 'Peau d\'Alfaia (18", 20" ou 22")' ||
    article === 'Housse de protection Alfaia (18", 20" ou 22")';

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        {/* Sélecteur d'article + miniature mobile (64x64px / 80x80px) alignée horizontalement */}
        <div className="flex items-end gap-2.5">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
              {t('widgetCommandes.articleLabel') || 'Article souhaité'}
            </label>
            <select
              value={article}
              onChange={(e) => setArticle(e.target.value)}
              disabled={saving}
              className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light w-full"
            >
              {catalog.map((item) => (
                <option key={item.nom} value={item.nom}>
                  {getArticleLabel(item.nom)} {item.prix > 0 ? `(${item.prix}€)` : ''}
                </option>
              ))}
              <option value="Hors catalogue / Demande libre">
                {t('widgetCommandes.freeRequestOption') || '✨ Demande libre / Hors catalogue'}
              </option>
            </select>
          </div>

          {artObj?.imageUrl && (
            <button
              type="button"
              onClick={() => setZoomImageUrl(artObj.imageUrl)}
              className="md:hidden w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded border-2 border-encre-noire overflow-hidden bg-white shadow-[2px_2px_0px_0px_#181716] flex items-center justify-center relative cursor-pointer"
              title="Touchez pour agrandir la photo"
            >
              <img src={artObj.imageUrl} alt={artObj.nom} className="w-full h-full object-cover" />
              <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded">🔍</span>
            </button>
          )}
        </div>

        {/* Grand aperçu image uniquement sur PC/Tablette (>= 768px) */}
        {artObj?.imageUrl && (
          <div
            onClick={() => setZoomImageUrl(artObj.imageUrl)}
            className="hidden md:flex mt-1 mb-0.5 w-full max-w-[180px] aspect-square rounded border-2 border-encre-noire overflow-hidden bg-white shadow-md mx-auto items-center justify-center cursor-pointer"
            title="Cliquer pour agrandir"
          >
            <img src={artObj.imageUrl} alt={artObj.nom} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Déclinaisons / Tailles */}
        {artObj?.tailles?.length > 0 && (
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">Taille / Déclinaison</label>
            <select
              value={selectedTaille}
              onChange={(e) => setSelectedTaille(e.target.value)}
              disabled={saving}
              className="theme-input text-xs font-bold py-1.5 px-2 bg-cordel-bg-light w-full"
            >
              {artObj.tailles.map((sz) => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>
        )}

        {isTshirtSelected && !selectedTaille && (
          <div className="text-[9px] font-bold text-green-700 bg-white/50 p-1.5 rounded border border-dashed border-green-400/50">
            {t('widgetCommandes.tshirtNotice')
              ? t('widgetCommandes.tshirtNotice').replace('{{size}}', profileData?.tailleTshirt || 'M')
              : `Taille T-shirt : ${profileData?.tailleTshirt || 'M'}`}
          </div>
        )}

        {isAlfaiaSkinSelected && !selectedTaille && (
          <div className="text-[9px] font-bold text-cordel-wood bg-white/50 p-1.5 rounded border border-dashed border-cordel-wood/40">
            {t('widgetCommandes.alfaiaNotice') || 'Précisez la taille en pouces dans les notes.'}
          </div>
        )}

        {/* Quantité & Notes */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1 col-span-1">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('widgetCommandes.qtyLabel') || 'Quantité'}</label>
            <input
              type="number"
              min="1"
              required
              value={quantite}
              onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={saving}
              className="theme-input text-xs py-1 px-2 font-bold"
            />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">{t('widgetCommandes.notesLabel') || 'Notes'}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder={isAlfaiaSkinSelected ? 'Ex : 22 pouces...' : 'Précisions...'}
              className="theme-input text-xs py-1 px-2 font-semibold"
            />
          </div>
        </div>

        {/* Suggestion ou description obligatoire en cas de demande hors catalogue */}
        <div className="flex flex-col gap-1">
          <label className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark">
            {isFreeRequest
              ? (t('widgetCommandes.freeRequestDescLabel') || "Description précise de l'article souhaité (Obligatoire) *")
              : (t('widgetCommandes.suggestionLabel') || 'Suggérer un autre article ou demande spéciale (Optionnel)')}
          </label>
          <textarea
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            required={isFreeRequest}
            disabled={saving}
            placeholder={
              isFreeRequest
                ? (t('widgetCommandes.freeRequestPlaceholder') || "Décrivez précisément l'article hors catalogue souhaité (modèle, taille, référence, usage)...")
                : "Ex : J'aimerais suggérer un autre article..."
            }
            className="theme-input text-xs py-1 px-2 min-h-[42px] resize-y font-semibold"
          />
        </div>

        {/* Case à cocher commande personnelle */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPersonalOrder"
              checked={isPersonalOrder}
              onChange={(e) => setIsPersonalOrder(e.target.checked)}
              disabled={saving}
              className="accent-cordel-wood scale-105 cursor-pointer"
            />
            <label htmlFor="isPersonalOrder" className="text-[9px] uppercase font-bold tracking-wider text-cordel-master-dark cursor-pointer">
              {t('widgetCommandes.personalOrderLabel') || 'Ceci est une commande personnelle'}
            </label>
          </div>
          <span className="text-[8px] font-bold text-cordel-master-dark/65 pl-5">
            {isPersonalOrder
              ? (t('widgetCommandes.personalOrderDesc') || 'Achat à vos frais personnels.')
              : (t('widgetCommandes.suggestionOrderDesc') || "Suggestion d'achat pour le parc de l'association.")}
          </span>
        </div>

        <CordelButton
          type="submit"
          variant="ocre"
          useExtremeBorder={true}
          disabled={saving || !article || (isFreeRequest && !suggestion.trim())}
          className="w-full py-2 font-bold uppercase tracking-widest text-[10px] mt-0.5"
        >
          {saving ? (t('widgetCommandes.adding') || 'Envoi...') : (t('widgetCommandes.addBtn') || 'Commander')}
        </CordelButton>
      </form>

      {/* Modale d'agrandissement de la photo produit */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-sm w-full bg-white p-2 rounded border-2 border-encre-noire shadow-[4px_4px_0px_0px_#181716]">
            <img src={zoomImageUrl} alt={article} className="w-full h-auto rounded object-contain max-h-[75vh]" />
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              className="mt-2 w-full py-1.5 text-xs font-black uppercase bg-cordel-wood text-white rounded border border-encre-noire cursor-pointer"
            >
              Fermer ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

