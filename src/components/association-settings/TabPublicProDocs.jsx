import React from 'react';
import CordelCard from '../CordelCard';

/**
 * Sub-composant d'administration dédié à la gestion des 4 documents Espace Pro
 * (Dossier de présentation, Fiche technique, Plan de scène, Kit Presse).
 */
export default function TabPublicProDocs({
  formData,
  handleChange,
  dossierPresentationFile,
  setDossierPresentationFile,
  ficheTechniqueFile,
  setFicheTechniqueFile,
  planSceneFile,
  setPlanSceneFile,
  kitPresseFile,
  setKitPresseFile,
  saving
}) {
  const publicTheme = formData.publicTheme || {};

  // Mise à jour de l'URL d'un document dans le thème public
  const handleDocUrlChange = (field, value) => {
    handleChange('publicTheme', {
      ...publicTheme,
      [field]: value
    });
  };

  // Suppression d'un document (réinitialisation de l'URL et du fichier en attente)
  const handleDeleteDoc = (urlField, setFileFn) => {
    if (setFileFn) setFileFn(null);
    handleDocUrlChange(urlField, '');
  };

  // Configuration des 4 documents Espace Pro
  const docsConfig = [
    {
      key: 'dossierPresentationUrl',
      label: '📄 Dossier de présentation complet (PDF)',
      description: 'Présentation complète de la troupe, historique et univers artistique.',
      accept: 'application/pdf',
      fileState: dossierPresentationFile,
      setFileFn: setDossierPresentationFile,
      placeholder: 'https://exemple.com/dossier-presentation.pdf'
    },
    {
      key: 'ficheTechniqueUrl',
      label: '🛠️ Fiche technique (Besoins son/lumière/logistique) (PDF)',
      description: 'Fiche technique officielle décrivant les besoins logistiques et sonores.',
      accept: 'application/pdf',
      fileState: ficheTechniqueFile,
      setFileFn: setFicheTechniqueFile,
      placeholder: 'https://exemple.com/fiche-technique.pdf'
    },
    {
      key: 'planSceneUrl',
      label: '📐 Plan de scène (PDF ou Image)',
      description: 'Plan de placement sur scène ou schéma d\'implantation scénique.',
      accept: 'application/pdf,image/*',
      fileState: planSceneFile,
      setFileFn: setPlanSceneFile,
      placeholder: 'https://exemple.com/plan-de-scene.pdf'
    },
    {
      key: 'kitPresseUrl',
      label: '📦 Kit Presse (Texte & Photos HD) (ZIP ou PDF)',
      description: 'Kit presse complet incluant visuels HD et dossiers de presse pour les médias.',
      accept: 'application/pdf,application/zip,application/x-zip-compressed',
      fileState: kitPresseFile,
      setFileFn: setKitPresseFile,
      placeholder: 'https://exemple.com/kit-presse.zip'
    }
  ];

  return (
    <CordelCard variant="default" className="p-5 flex flex-col gap-5 bg-white border-2 border-cordel-master-dark/30">
      <h4 className="text-xs font-black uppercase tracking-widest text-cordel-wood border-b border-dashed border-cordel-master-dark/20 pb-2 flex items-center justify-between">
        <span>📑 Documents Espace Pro & Organisateurs</span>
        <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-300">
          Téléchargements Vitrine
        </span>
      </h4>

      <p className="text-xs text-stone-600 leading-relaxed">
        Ajoutez les documents officiels téléchargeables par les organisateurs de spectacles et la presse. Seuls les documents renseignés disposeront d'un bouton de téléchargement actif sur la vitrine publique.
      </p>

      {/* Basculer Activer / Désactiver Espace Pro */}
      <div className="flex items-center gap-3 p-3 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] select-none mt-2">
        <input
          type="checkbox"
          id="afficherEspacePro"
          checked={publicTheme.afficherEspacePro !== false}
          onChange={(e) => handleDocUrlChange('afficherEspacePro', e.target.checked)}
          disabled={saving}
          className="w-4 h-4 cursor-pointer accent-[var(--color-cordel-vert,#2d6a4f)]"
        />
        <label htmlFor="afficherEspacePro" className="text-xs font-bold uppercase tracking-wider text-encre-noire cursor-pointer flex flex-wrap items-center gap-1.5">
          <span>Afficher le bloc "Espace Pro" (téléchargements) en bas de la vitrine</span>
        </label>
      </div>

      <div className="flex flex-col gap-6 pt-1">
        {docsConfig.map((doc) => {
          const currentUrl = publicTheme[doc.key] || (doc.key === 'dossierPresentationUrl' ? publicTheme.dossierProPdfUrl : '');
          const hasUrl = Boolean(currentUrl);

          return (
            <div 
              key={doc.key} 
              className="p-4 bg-[#fdfaf2] border border-encre-noire/20 rounded-[4px_6px_3px_5px] flex flex-col gap-3"
            >
              {/* En-tête du document & Témoin de présence */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-encre-noire/15 pb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-encre-noire flex items-center gap-1.5">
                  <span>{doc.label}</span>
                </label>

                <div className="flex items-center gap-2">
                  {hasUrl && (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-emerald-800 hover:underline bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>👁️ Consulter le fichier</span> ↗
                    </a>
                  )}
                  {hasUrl && (
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.key, doc.setFileFn)}
                      disabled={saving}
                      className="text-[11px] font-bold text-red-700 hover:bg-red-50 px-2 py-0.5 rounded border border-red-300 transition-colors cursor-pointer"
                      title="Supprimer le document actuel"
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-stone-500 font-medium leading-tight">
                {doc.description}
              </p>

              {/* Champ de Téléversement de Fichier */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="file"
                  accept={doc.accept}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      doc.setFileFn(e.target.files[0]);
                    }
                  }}
                  disabled={saving}
                  className="flex-1 text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-cordel-bg file:text-encre-noire hover:file:brightness-95 cursor-pointer"
                />
                {doc.fileState && (
                  <button
                    type="button"
                    onClick={() => doc.setFileFn(null)}
                    className="text-[10px] font-bold text-red-700 hover:underline cursor-pointer"
                  >
                    ✖ Annuler
                  </button>
                )}
              </div>

              {/* Indication du nouveau fichier prêt à l'envoi */}
              {doc.fileState && (
                <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <span>📌 Nouveau fichier prêt à l'envoi : <strong>{doc.fileState.name}</strong> ({(doc.fileState.size / 1024).toFixed(0)} Ko)</span>
                </div>
              )}

              {/* Saisie directe d'URL (alternative / fallback) */}
              <input
                type="url"
                value={currentUrl || ''}
                onChange={(e) => handleDocUrlChange(doc.key, e.target.value)}
                disabled={saving}
                placeholder={doc.placeholder}
                className="text-xs px-3.5 py-2 border border-encre-noire/30 rounded bg-white font-mono"
              />
            </div>
          );
        })}
      </div>
    </CordelCard>
  );
}
