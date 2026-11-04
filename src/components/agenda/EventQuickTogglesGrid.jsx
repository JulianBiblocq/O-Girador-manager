import React from 'react';

/**
 * Grille des 10 interrupteurs rapides d'options & modules actifs d'un événement.
 * Extrait de EventFormFields.jsx (Règle du Boy Scout, < 140 lignes).
 */
export default function EventQuickTogglesGrid({
  formData,
  toggleBooleanField,
  saving = false,
  tr
}) {
  const buttons = [
    {
      field: 'includesPercussion',
      active: formData.includesPercussion !== false,
      icon: '🥁',
      label: tr('agenda.togglePercussion'),
      activeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-500 shadow-xs'
    },
    {
      field: 'includesDance',
      active: formData.includesDance !== false,
      icon: '💃',
      label: tr('agenda.toggleDance'),
      activeClass: 'bg-pink-100 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 border-pink-500 shadow-xs'
    },
    {
      field: 'enableCarpool',
      active: formData.enableCarpool !== false,
      icon: '🚗',
      label: tr('agenda.toggleCarpool'),
      activeClass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-500 shadow-xs'
    },
    {
      field: 'isPublic',
      active: Boolean(formData.isPublic),
      icon: '🌍',
      label: tr('agenda.togglePublic'),
      activeClass: 'bg-sky-100 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-500 shadow-xs'
    },
    {
      field: 'enableInscriptions',
      active: formData.enableInscriptions !== false,
      icon: '📝',
      label: tr('agenda.toggleRsvp'),
      activeClass: 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border-blue-500 shadow-xs'
    },
    {
      field: 'requiresValidation',
      active: Boolean(formData.requiresValidation),
      icon: '🔒',
      label: tr('agenda.toggleValidation'),
      activeClass: 'bg-purple-100 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-500 shadow-xs'
    },
    {
      field: 'activerRecolteMedias',
      active: formData.activerRecolteMedias !== false,
      icon: '📸',
      label: tr('agenda.togglePhotos') || 'Boîte photos',
      title: 'Activer la boîte à photos / QR Code et le stockage Framaspace',
      activeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-amber-500 shadow-xs'
    },
    {
      field: 'publierSurVaral',
      active: Boolean(formData.publierSurVaral),
      icon: '🪢',
      label: tr('agenda.toggleVaralPhotos') || 'Varal photos',
      title: 'Afficher sur le Varal Photos des membres',
      activeClass: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-500 shadow-xs'
    },
    {
      field: 'enableRoadbook',
      active: formData.enableRoadbook !== false,
      icon: '📄',
      label: tr('agenda.toggleRoadbook') || 'Feuille de route',
      title: 'Activer la feuille de route opérationnelle (Roadbook jour J)',
      activeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-amber-500 shadow-xs'
    },
    {
      field: 'hasCommissions',
      active: Boolean(formData.hasCommissions),
      icon: '🎪',
      label: tr('agenda.toggleCommissions') || 'Commissions',
      title: 'Activer la gestion par commissions (Tour de contrôle, rétro-planning, budget, bénévoles)',
      activeClass: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-[var(--color-cordel-ocre,#c05621)] shadow-xs'
    }
  ];

  const inactiveClass = 'bg-neutral-100 dark:bg-neutral-800/40 text-neutral-400 border-neutral-300 dark:border-neutral-700';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none">
      {buttons.map((btn) => (
        <button
          key={btn.field}
          type="button"
          onClick={() => toggleBooleanField(btn.field, btn.active)}
          disabled={saving}
          title={btn.title}
          className={`flex items-center justify-center gap-2 p-2 rounded text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
            btn.active ? btn.activeClass : inactiveClass
          }`}
        >
          <span>{btn.icon}</span>
          <span>{btn.label}</span>
          <span className="ml-auto text-[10px]">{btn.active ? 'ON' : 'OFF'}</span>
        </button>
      ))}
    </div>
  );
}

