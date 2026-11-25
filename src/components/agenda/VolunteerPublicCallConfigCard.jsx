import React, { useState } from 'react';
import { normalizePublicVolunteerConfig } from '../../utils/volunteerApplicationUtils';
import EventVolunteerShareModal from '../event-details/volunteers/EventVolunteerShareModal';

/**
 * Carte de configuration « à la carte » de l'appel public à bénévoles d'un événement.
 * Stockée dans `event.publicVolunteerConfig` (interrupteur, message d'accueil, 4 options et partage QR).
 */
export default function VolunteerPublicCallConfigCard({
  event = null,
  config = null,
  onChange,
  saving = false,
  tr
}) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const t = typeof tr === 'function' ? tr : (k, fb) => fb || k;
  const defaultWelcome = t('agenda.volunteerPublicWelcomeDefault') || 'Merci pour votre coup de main ! Repas et boissons offerts aux bénévoles le Jour J.';
  const cfg = normalizePublicVolunteerConfig(config);

  const emit = (patch) => {
    if (typeof onChange !== 'function') return;
    onChange(normalizePublicVolunteerConfig({ ...cfg, ...patch }));
  };

  const handleToggleEnabled = (checked) => {
    emit({
      enabled: checked,
      welcomeMessage: checked && !cfg.welcomeMessage.trim() ? defaultWelcome : cfg.welcomeMessage
    });
  };

  const logisticOptions = [
    { key: 'askDietary', icon: '🍽️', label: t('agenda.volunteerAskDietary') || 'Régime alimentaire / allergies' },
    { key: 'askTshirtSize', icon: '👕', label: t('agenda.volunteerAskTshirtSize') || 'Taille de T-shirt' },
    { key: 'askVehicle', icon: '🚗', label: t('agenda.volunteerAskVehicle') || 'Véhicule / Remorque / Permis' },
    { key: 'askAdultStatus', icon: '🪪', label: t('agenda.volunteerAskAdultStatus') || 'Confirmation Majeur / Mineur (assurance)' }
  ];

  return (
    <div className="p-3 rounded-lg bg-[var(--cordel-bg)] border border-dashed border-[var(--theme-border)]/35 flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-start justify-between gap-3 cursor-pointer select-none flex-1 min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-[var(--cordel-wood)] flex items-center gap-1.5">
              🌍 {t('agenda.volunteerPublicCallToggle') || 'Ouvrir un appel public à bénévoles'}
            </span>
            <span className="text-[9.5px] opacity-75 leading-snug">
              {t('agenda.volunteerPublicCallHint') || 'Permet aux proches et sympathisants externes de proposer leur aide via le portail public.'}
            </span>
          </div>
          <input
            type="checkbox" checked={cfg.enabled} disabled={saving}
            onChange={(e) => handleToggleEnabled(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[var(--color-cordel-vert)] cursor-pointer shrink-0"
          />
        </label>
        {cfg.enabled && event?.id && (
          <button
            type="button" onClick={() => setIsShareOpen(true)}
            className="px-2 py-1 rounded border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-[9.5px] font-black uppercase cursor-pointer shrink-0"
          >
            🔗 {t('agenda.volunteerShareCallBtn') || "Partager l'appel / QR Code"}
          </button>
        )}
      </div>

      {cfg.enabled && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-dashed border-[var(--theme-border)]/20">
          <div className="flex flex-col gap-1">
            <label className="text-[8.5px] uppercase font-bold tracking-wider">
              {t('agenda.volunteerPublicWelcomeLabel') || "Message d'accueil & avantages bénévoles"}
            </label>
            <textarea
              rows={2} value={cfg.welcomeMessage} disabled={saving} placeholder={defaultWelcome}
              onChange={(e) => emit({ welcomeMessage: e.target.value })}
              className="theme-input py-1.5 px-2.5 text-xs w-full resize-y"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[8.5px] uppercase font-bold tracking-wider opacity-85">
              {t('agenda.volunteerPublicQuestionsTitle') || 'Questions logistiques à la carte (optionnelles)'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {logisticOptions.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 p-2 rounded border border-[var(--theme-border)]/25 bg-[var(--theme-input-bg)] text-[10.5px] font-semibold cursor-pointer select-none">
                  <input type="checkbox" checked={Boolean(cfg[opt.key])} disabled={saving} onChange={(e) => emit({ [opt.key]: e.target.checked })} className="w-3.5 h-3.5 accent-[var(--color-cordel-vert)] cursor-pointer shrink-0" />
                  <span className="truncate">{opt.icon} {opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-[9.5px] italic opacity-70 leading-snug">
            ℹ️ {t('agenda.volunteerPublicBaseFieldsNote') || "Socle toujours inclus : Prénom, Nom, E-mail, Téléphone, Lien avec l'asso et choix Créneaux précis ou Poste flexible."}
          </p>
        </div>
      )}

      <EventVolunteerShareModal isOpen={isShareOpen} event={event} onClose={() => setIsShareOpen(false)} tr={tr} />
    </div>
  );
}
