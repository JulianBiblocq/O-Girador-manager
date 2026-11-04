import React from 'react';
import CordelCard from '../CordelCard';
import { getCarpoolBulkyTerminology } from '../../utils/carpoolCascadeUtils';

/**
 * Accordéons pliables du profil : « Alimentation & Allergies » et « Véhicule associatif » (grille grid-cols-3).
 */
export default function ProfileDietAndVehicleAccordions({
  profileData,
  formData,
  universe,
  t,
  translateDiet,
  openSections,
  toggleSection
}) {
  const dietSummary =
    formData.dietaryRestrictions && formData.dietaryRestrictions.length > 0
      ? formData.dietaryRestrictions.map((d) => translateDiet(d)).join(', ')
      : t('userProfile.noDietSpecific');
  const allergySummary =
    formData.allergies && formData.allergies.trim()
      ? `⚠️ ${formData.allergies.trim()}`
      : t('userProfile.noAllergiesReported');

  const passengerSeats =
    profileData?.defaultPassengerSeats !== undefined ? profileData.defaultPassengerSeats : 3;
  const trunkCapacity =
    profileData?.defaultTrunkBulkyCapacity !== undefined
      ? profileData.defaultTrunkBulkyCapacity
      : profileData?.defaultTrunkCapacity !== undefined
        ? profileData.defaultTrunkCapacity
        : 1;
  const vehicleType = profileData?.vehicleType || 'Berline';

  return (
    <>
      {/* Accordéon 3 : Alimentation & Allergies */}
      <CordelCard variant="default" useExtremeBorder={true} className="p-3 text-left">
        <button
          type="button"
          onClick={() => toggleSection('diet')}
          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
        >
          <span className="text-[11px] sm:text-xs font-black text-encre-noire truncate">
            🥗 Régime : <span className="font-bold text-cordel-wood">{dietSummary}</span> •{' '}
            <span className={formData.allergies?.trim() ? 'text-[var(--color-cordel-rouge)] font-extrabold' : 'opacity-75 font-semibold'}>
              {allergySummary}
            </span>
          </span>
          <span className="text-xs font-black text-cordel-wood shrink-0">{openSections.diet ? '▴' : '▾'}</span>
        </button>
        {openSections.diet && (
          <div className="flex flex-col gap-2 text-xs mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/20">
            <div>
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 inline-block mr-1.5">
                {t('userProfile.dietLabel')}
              </span>
              <span className="font-extrabold text-cordel-wood bg-cordel-bg-light px-2 py-0.5 rounded border border-dashed border-cordel-master-dark/20">
                {dietSummary}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-cordel-master-dark/70 inline-block mr-1.5">
                {t('userProfile.allergiesLabel')}
              </span>
              {formData.allergies && formData.allergies.trim() ? (
                <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  ⚠️ {formData.allergies.trim()}
                </span>
              ) : (
                <span className="italic opacity-60">{t('userProfile.noAllergiesReported')}</span>
              )}
            </div>
          </div>
        )}
      </CordelCard>

      {/* Accordéon 4 : Véhicule associatif (si motorisé) */}
      {profileData?.hasVehicle && (
        <CordelCard variant="default" useExtremeBorder={true} className="p-3 text-left">
          <button
            type="button"
            onClick={() => toggleSection('vehicle')}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer select-none"
          >
            <span className="text-[11px] sm:text-xs font-black text-encre-noire truncate">
              🚗 Véhicule : <span className="font-bold text-cordel-wood">{vehicleType} • {passengerSeats} places • ~{trunkCapacity} fûts</span>
            </span>
            <span className="text-xs font-black text-cordel-wood shrink-0">{openSections.vehicle ? '▴' : '▾'}</span>
          </button>
          {openSections.vehicle && (
            <div className="flex flex-col gap-2.5 mt-3 pt-2.5 border-t border-dashed border-cordel-master-dark/20">
              {/* Grille compacte grid-cols-3 sur mobile et PC */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-cordel-bg-light/60 p-2 rounded border border-encre-noire/10 flex flex-col min-w-0">
                  <span className="text-[8.5px] uppercase font-bold text-cordel-master-dark/70 truncate">
                    {t('userProfile.vehicleCategory')}
                  </span>
                  <span className="font-extrabold text-encre-noire mt-0.5 truncate">{vehicleType}</span>
                </div>
                <div className="bg-cordel-bg-light/60 p-2 rounded border border-encre-noire/10 flex flex-col min-w-0">
                  <span className="text-[8.5px] uppercase font-bold text-cordel-master-dark/70 truncate">
                    {t('userProfile.vehiclePassengerSeats')}
                  </span>
                  <span className="font-extrabold text-encre-noire mt-0.5 truncate">
                    {t('userProfile.vehiclePassengerSeatsCount', { count: passengerSeats })}
                  </span>
                </div>
                <div className="bg-cordel-bg-light/60 p-2 rounded border border-encre-noire/10 flex flex-col min-w-0">
                  <span className="text-[8.5px] uppercase font-bold text-cordel-master-dark/70 truncate">
                    {getCarpoolBulkyTerminology(universe).trunkLabel || t('userProfile.vehicleTrunkAlfaias')}
                  </span>
                  <span className="font-extrabold text-cordel-wood mt-0.5 truncate">
                    {t('userProfile.vehicleTrunkAlfaiasCount', { count: trunkCapacity })}
                  </span>
                </div>
              </div>
              {(profileData?.hasRoofBars || profileData?.hasTowHitch) && (
                <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                  {profileData.hasRoofBars && <span className="bg-white/80 px-2 py-0.5 rounded border border-encre-noire/15">📦 Barres de toit</span>}
                  {profileData.hasTowHitch && <span className="bg-white/80 px-2 py-0.5 rounded border border-encre-noire/15">🔗 {t('userProfile.vehicleTowHitch')}</span>}
                </div>
              )}
            </div>
          )}
        </CordelCard>
      )}
    </>
  );
}

