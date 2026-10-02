import React from 'react';
import CordelCard from '../../CordelCard';
import VehicleFleetSection from './VehicleFleetSection';
import DepartureLocationAccordion from './DepartureLocationAccordion';
import { useTranslation } from '../../LanguageContext';

/**
 * Bloc de gestion des convois et de la flotte de véhicules
 * - Démarrage direct sur la flotte de véhicules (conducteur, places, capacité Alfaias, attelage)
 * - Carte GPS et point de départ repliés dans un accordéon compact fermé par défaut
 * - Les barèmes financiers (€/km) sont gérés au niveau de la Trésorerie
 */
export default function CarpoolBlock({ formData = {}, handleChange, saving = false, groupId }) {
  const { t } = useTranslation();
  const effectiveGroupId = groupId || formData.groupId || formData.id || '';

  return (
    <CordelCard variant="default" useExtremeBorder={true} className="py-4 px-5">
      <div className="flex flex-col gap-5">
        {/* Titre et introduction sobre */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-cordel-master-dark/15 pb-3">
          <div>
            <h3 className="text-sm uppercase font-extrabold tracking-wider text-cordel-wood flex items-center gap-2">
              <span>🚗</span>
              <span>{t('logistics.fleetConvoysTitle')}</span>
            </h3>
            <p className="text-[11px] text-cordel-master-dark/70 mt-0.5">
              {t('logistics.fleetConvoysDesc')}
            </p>
          </div>
        </div>

        {/* 1. Tableau récapitulatif de la flotte de véhicules en premier plan */}
        {effectiveGroupId ? (
          <div className="flex flex-col gap-2">
            <VehicleFleetSection groupId={effectiveGroupId} />
          </div>
        ) : (
          <div className="p-4 text-center text-xs font-bold text-cordel-master-dark/60 bg-cordel-bg-light border border-dashed border-cordel-master-dark/20 rounded">
            Groupe non spécifié pour afficher la flotte de véhicules.
          </div>
        )}

        {/* 2. Accordéon compact pour l'adresse du local et la carte GPS (fermé par défaut) */}
        <div className="pt-2">
          <DepartureLocationAccordion
            formData={formData}
            handleChange={handleChange}
            saving={saving}
          />
        </div>
      </div>
    </CordelCard>
  );
}
