import React, { useState } from 'react';
import CordelCard from '../CordelCard';
import EmailConfigSection from './email/EmailConfigSection';
import BrevoIntegrationBlock from './blocks/BrevoIntegrationBlock';
import TabAutomations from './TabAutomations';

/**
 * Pôle Configuration - Onglet Communication, E-mails & Automatisations ('config-comms').
 * Regroupe la gestion de l'expéditeur d'e-mails, Brevo, newsletter et relances automatiques.
 */
export default function TabConfigComms({ formData, handleChange, groupId, saving, t }) {
  const [activeSection, setActiveSection] = useState('email'); // 'email' | 'automations'

  return (
    <div className="flex flex-col gap-4 text-left select-none">
      {/* Sélecteur de sous-onglets compact */}
      <div className="flex items-center gap-2 border-b border-dashed border-cordel-master-dark/20 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('email')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeSection === 'email'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          ✉️ E-mails, Expéditeur & Brevo
        </button>

        <button
          type="button"
          data-tour="config-comms-automations"
          onClick={() => setActiveSection('automations')}
          className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer ${
            activeSection === 'automations'
              ? 'bg-[var(--color-cordel-vert,#2d6a4f)] text-white shadow-2xs'
              : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
          }`}
        >
          ⚡ Relances Automatiques (J-1 / J-2)
        </button>
      </div>

      {/* Section 1 : Configuration Expéditeur & API Brevo */}
      {activeSection === 'email' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Configuration générale de l'expéditeur et du mode d'envoi */}
          <div data-tour="config-comms-email">
            <EmailConfigSection
              formData={formData}
              handleChange={handleChange}
              saving={saving}
            />
          </div>

          {/* Intégration API Brevo / Sendinblue */}
          <div data-tour="config-comms-dns">
            <BrevoIntegrationBlock
              formData={formData}
              handleChange={handleChange}
              saving={saving}
            />
          </div>
        </div>
      )}

      {/* Section 2 : Règles de Relance Automatique */}
      {activeSection === 'automations' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <TabAutomations
            groupId={groupId}
            eventTypes={formData.eventTypes || ['prestation', 'repetition', 'stage', 'atelier', 'reunion']}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
