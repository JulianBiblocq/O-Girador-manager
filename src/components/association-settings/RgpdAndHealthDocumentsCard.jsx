import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Carte de gestion des documents RGPD (Charte de droit à l'image) et Santé (Modèle de certificat médical).
 * Utilise des sélecteurs de fichier personnalisés (<label> stylisé + <input type="file" className="sr-only">)
 * afin que les libellés « Choisir un fichier » et « Aucun fichier choisi » soient traduits en FR / PT-BR.
 */
export default function RgpdAndHealthDocumentsCard({
  demanderDroitImage,
  droitImageDocUrl,
  droitImageFile,
  setDroitImageFile,
  demanderAttestationSante,
  aptitudeMedicaleDocUrl,
  aptitudeMedicaleFile,
  setAptitudeMedicaleFile,
  handleChange,
  saving,
  t
}) {
  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <h3 className="text-xs uppercase font-extrabold tracking-wider text-cordel-wood mb-3">
        {t('settings.communication.tabDocuments.documentsDeLAssociationRgpd')}
      </h3>

      {/* Bascule Droit à l'image */}
      <div className="flex flex-col gap-1 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left mb-3">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={demanderDroitImage}
            onChange={(e) => handleChange('demanderDroitImage', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-encre-noire">
              {t('settings.communication.tabDocuments.activerLaDemandeDeDroit')}
            </span>
            <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
              {t('settings.communication.tabDocuments.siActiveLesAdherentsVerront')}
            </span>
          </div>
        </label>
      </div>

      {/* Document PDF : Charte de droit à l'image */}
      <div className="flex flex-col gap-2 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark">
          {t('settings.communication.tabDocuments.charteDeDroitAL')}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="droit-image-pdf-input"
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border border-encre-noire bg-cordel-bg-light hover:bg-white text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] transition-all select-none ${
                saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {t('secretariat.btnChooseFile')}
            </label>
            <input
              id="droit-image-pdf-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setDroitImageFile(e.target.files?.[0] || null)}
              disabled={saving}
              className="sr-only"
            />
            <span className="text-[10px] font-semibold text-cordel-master-dark/75">
              {droitImageFile ? droitImageFile.name : t('secretariat.noFileChosen')}
            </span>
          </div>
          {droitImageFile && (
            <span className="text-[9px] text-green-600 font-bold">
              {t('settings.communication.tabDocuments.selectionne')} {droitImageFile.name}
            </span>
          )}
          {droitImageDocUrl && (
            <a
              href={droitImageDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-cordel-wood hover:underline font-bold"
            >
              {t('settings.communication.tabDocuments.voirLeDocumentEnLigne')}
            </a>
          )}
        </div>
      </div>

      {/* Bascule Aptitude médicale */}
      <div className="flex flex-col gap-1 pb-3 border-b border-dashed border-cordel-master-dark/15 text-left mb-3 mt-3">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={demanderAttestationSante}
            onChange={(e) => handleChange('demanderAttestationSante', e.target.checked)}
            disabled={saving}
            className="w-4 h-4 cursor-pointer mt-0.5 shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-encre-noire">
              {t('settings.communication.tabDocuments.activerLaDemandeDAptitude')}
            </span>
            <span className="text-[9px] text-cordel-master-dark/70 font-semibold mt-0.5 leading-relaxed">
              {t('settings.communication.tabDocuments.siActiveLesAdherentsDevront')}
            </span>
          </div>
        </label>
      </div>

      {/* Document PDF : Modèle de certificat médical */}
      <div className="flex flex-col gap-2 mt-3 text-left">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cordel-master-dark mb-1">
          {t('settings.communication.tabDocuments.modeleDeCertificatMedicalReglement')}
        </span>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor="aptitude-medicale-pdf-input"
              className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-[4px_6px_3px_5px] border border-encre-noire bg-cordel-bg-light hover:bg-white text-encre-noire shadow-[1.5px_1.5px_0px_0px_#181716] transition-all select-none ${
                saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {t('secretariat.btnChooseFile')}
            </label>
            <input
              id="aptitude-medicale-pdf-input"
              type="file"
              accept="application/pdf"
              onChange={(e) => setAptitudeMedicaleFile(e.target.files?.[0] || null)}
              disabled={saving}
              className="sr-only"
            />
            <span className="text-[10px] font-semibold text-cordel-master-dark/75">
              {aptitudeMedicaleFile ? aptitudeMedicaleFile.name : t('secretariat.noFileChosen')}
            </span>
          </div>
          {aptitudeMedicaleFile && (
            <span className="text-[9px] text-green-600 font-bold">
              {t('settings.communication.tabDocuments.selectionne')} {aptitudeMedicaleFile.name}
            </span>
          )}
          {aptitudeMedicaleDocUrl && (
            <a
              href={aptitudeMedicaleDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-cordel-wood hover:underline font-bold"
            >
              {t('settings.communication.tabDocuments.voirLeDocumentEnLigne')}
            </a>
          )}
        </div>
      </div>
    </CordelCard>
  );
}

