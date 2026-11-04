import React, { useState, useRef, useEffect } from 'react';
import { XiloScroll } from '../../XiloIcons';
import { useTranslation } from '../../LanguageContext';

/**
 * Barre d'en-tête et d'actions regroupées sur 1 seule ligne pour les Bilans & Rapports AG :
 * - Sans bouton Retour redondant
 * - Bouton principal [ 📽️ Projection AG ]
 * - Menu déroulant [ 📥 Exporter / Imprimer ▾ ] (CSV Bilan AG, CSV Assiduité, Imprimer dossier AG)
 * - Bouton icône carré [ 🔄 ] (Actualiser)
 */
export default function AgReportsHeaderBar({
  loading = false,
  onOpenSlideshow,
  onExportSummaryCSV,
  onExportAttendanceCSV,
  onPrint,
  onRefresh
}) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fermeture automatique du menu déroulant au clic extérieur
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b-2 border-dashed border-cordel-master-dark/30 pb-2.5 no-print">
      {/* Titre sans bouton Retour */}
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-cordel-wood flex items-center gap-2">
          <XiloScroll size={18} />
          <span className="truncate">{t('secretariatReports.title') || "Rapports & Bilan d'Assemblée Générale"}</span>
        </h2>
        <p className="text-[10.5px] text-encre-noire/70 font-medium hidden sm:block">
          {t('secretariatReports.subtitle') || "Consolidation des indicateurs de la saison pour l'AG et les dossiers de subvention"}
        </p>
      </div>

      {/* Barre d'actions regroupée sur 1 seule ligne fluide */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap shrink-0" data-tour="reports-export-actions">
        {/* 1. Bouton principal : Projection AG */}
        <button
          type="button"
          onClick={onOpenSlideshow}
          disabled={loading}
          className="px-2.5 sm:px-3.5 py-1.5 min-h-[34px] text-[10px] font-black uppercase tracking-wider bg-[var(--color-cordel-vert)] text-white hover:bg-emerald-800 border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          title="Lancer la projection grand écran et le livret imprimable d'Assemblée Générale"
        >
          <span>📽️</span>
          <span>Projection AG</span>
        </button>

        {/* 2. Menu déroulant : Exporter / Imprimer */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            disabled={loading}
            className="px-2.5 sm:px-3 py-1.5 min-h-[34px] text-[10px] font-black uppercase tracking-wider bg-cordel-card-bg hover:bg-amber-200 text-encre-noire border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>📥</span>
            <span>Exporter / Imprimer</span>
            <span>▾</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-cordel-card-bg border-2 border-encre-noire rounded-[6px_9px_5px_8px] shadow-[3px_3px_0px_0px_#181716] py-1 z-40 flex flex-col text-left">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onExportSummaryCSV(); }}
                className="w-full px-3 py-2 text-[10.5px] font-black text-encre-noire hover:bg-amber-100 flex items-center gap-2 text-left cursor-pointer border-b border-dashed border-encre-noire/15"
              >
                <span>📊</span>
                <span>Exporter Bilan AG (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onExportAttendanceCSV(); }}
                className="w-full px-3 py-2 text-[10.5px] font-black text-encre-noire hover:bg-amber-100 flex items-center gap-2 text-left cursor-pointer border-b border-dashed border-encre-noire/15"
              >
                <span>📋</span>
                <span>Exporter Assiduité & Présences (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onPrint(); }}
                className="w-full px-3 py-2 text-[10.5px] font-black text-cordel-wood hover:bg-amber-100 flex items-center gap-2 text-left cursor-pointer"
              >
                <span>🖨️</span>
                <span>Imprimer le dossier AG</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. Bouton icône carré : Actualiser */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="w-[34px] h-[34px] text-xs font-black bg-cordel-bg hover:bg-amber-100 text-encre-noire border-2 border-encre-noire rounded-[4px_6px_3px_5px] shadow-[1.5px_1.5px_0px_0px_#181716] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center shrink-0"
          title={t('secretariatReports.refresh') || "Actualiser les indicateurs"}
          aria-label="Actualiser"
        >
          <span className={loading ? 'animate-spin' : ''}>🔄</span>
        </button>
      </div>
    </div>
  );
}

