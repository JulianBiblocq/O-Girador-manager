import React, { useState } from 'react';
import CordelAccordion from './CordelAccordion';

/**
 * PermissionsGuideBox component displays a permanent pedagogical 3-step guide
 * for setting up tags/badges and role permissions.
 * Multi-theme compliant using semantic CSS variables.
 *
 * @param {Object} props
 * @param {boolean} [props.defaultOpen=true] - Initial open state
 * @param {string} [props.className] - Additional wrapper CSS classes
 * @param {Function} [props.onNavigateToTagManager] - Optional shortcut callback
 */
export default function PermissionsGuideBox({
  defaultOpen = true,
  className = '',
  onNavigateToTagManager
}) {
  return (
    <CordelAccordion
      title="💡 Comment configurer les permissions et les accès de votre bureau ?"
      subtitle="Guide en 3 étapes pour répartir les rôles et sécuriser l'application"
      icon="💡"
      defaultOpen={defaultOpen}
      className={`mb-4 border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20 text-left ${className}`}
    >
      <div className="flex flex-col gap-3.5 text-xs text-[var(--encre-noire)] leading-relaxed py-1">
        <p className="font-semibold opacity-90">
          Pour garantir une gestion simple et sécurisée, les accès de l'application s'appuient sur un système d'<strong>Étiquettes (Badges)</strong> attribuables aux membres de votre association :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-1">
          {/* Step 1 */}
          <div className="p-3 bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] rounded-[8px] flex flex-col gap-1.5 shadow-xs">
            <div className="font-extrabold text-[var(--cordel-wood)] text-xs flex items-center gap-1.5">
              <span>1️⃣</span>
              <span>Créez les étiquettes</span>
            </div>
            <p className="text-[11px] opacity-85">
              Dans le <strong>Gestionnaire d'Étiquettes</strong>, créez les rôles de votre bureau (ex : <em>Trésorier, Secrétaire, CA, Mestre, Commission Logistique</em>).
            </p>
            {onNavigateToTagManager && (
              <button
                type="button"
                onClick={onNavigateToTagManager}
                className="mt-auto text-[10px] font-bold text-[var(--cordel-wood)] hover:underline text-left pt-1 cursor-pointer flex items-center gap-1"
              >
                🏷️ Ouvrir les Étiquettes →
              </button>
            )}
          </div>

          {/* Step 2 */}
          <div className="p-3 bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] rounded-[8px] flex flex-col gap-1.5 shadow-xs">
            <div className="font-extrabold text-[var(--cordel-wood)] text-xs flex items-center gap-1.5">
              <span>2️⃣</span>
              <span>Définissez les droits</span>
            </div>
            <p className="text-[11px] opacity-85">
              Dans la <strong>Matrice des Permissions</strong> ci-dessous, cochez à quels pôles/onglets chaque étiquette donne accès (ex : <em>Bilan Financier</em> pour <em>Président</em>).
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3 bg-[var(--cordel-card-bg)] border border-[var(--cordel-border)] rounded-[8px] flex flex-col gap-1.5 shadow-xs">
            <div className="font-extrabold text-[var(--cordel-wood)] text-xs flex items-center gap-1.5">
              <span>3️⃣</span>
              <span>Attribuez l'étiquette</span>
            </div>
            <p className="text-[11px] opacity-85">
              Allez sur le profil d'un membre ou dans l'administration des utilisateurs et ajoutez-lui l'étiquette pour lui transmettre <strong>instantanément</strong> ses nouveaux accès.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 bg-amber-100/50 dark:bg-amber-900/20 border border-dashed border-amber-600/30 rounded text-[11px] font-medium opacity-90">
          <span>ℹ️</span>
          <span>
            <strong>Note :</strong> Les rôles système <em>Super-Admin</em> et <em>Mestre</em> conservent toujours un accès d'administration global.
          </span>
        </div>
      </div>
    </CordelAccordion>
  );
}
