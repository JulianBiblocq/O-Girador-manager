import { useMemo } from 'react';
import { useEventCommissions } from './useEventCommissions';
import { useVolunteerApplications } from './useVolunteerApplications';
import { consolidateVolunteerShifts, computeVolunteerCoverage } from '../utils/volunteerShiftUtils';
import { hasActiveVolunteerModule, isEventVolunteerCoordinator } from '../utils/volunteerCoordinatorUtils';

/**
 * Hook léger calculant la visibilité conditionnelle de l'onglet « 🤝 Bénévoles »,
 * le statut coordinateur de l'utilisateur et la pastille synthétique de l'onglet.
 */
export function useEventVolunteerTabMeta({ event, user, profileData, isAuthorized = false }) {
  const shouldListenCommissions = Boolean(event?.id && event?.hasCommissions);
  const { commissions } = useEventCommissions(shouldListenCommissions ? event.id : null, event);

  const showVolunteersTab = useMemo(
    () => hasActiveVolunteerModule(event, commissions),
    [event, commissions]
  );

  const isVolunteerCoordinator = useMemo(
    () => isEventVolunteerCoordinator({ user, profileData, event, commissions, canManageEvents: isAuthorized }),
    [user, profileData, event, commissions, isAuthorized]
  );

  const consolidatedShifts = useMemo(
    () => (showVolunteersTab ? consolidateVolunteerShifts(event, commissions) : []),
    [showVolunteersTab, event, commissions]
  );

  const coverage = useMemo(
    () => computeVolunteerCoverage(consolidatedShifts),
    [consolidatedShifts]
  );

  const { pendingApplications } = useVolunteerApplications({
    event: showVolunteersTab && isVolunteerCoordinator ? event : null,
    commissions,
    consolidatedShifts,
    user,
    profileData,
    isAuthorized
  });

  const pendingCount = isVolunteerCoordinator ? pendingApplications.length : 0;

  const volunteersBadge = useMemo(() => {
    if (!showVolunteersTab) return null;
    if (pendingCount > 0) return `📥 ${pendingCount}`;
    if (coverage.totalRequired > 0) return `${coverage.filledPosts}/${coverage.totalRequired}`;
    if (coverage.totalInscrits > 0) return `${coverage.totalInscrits}`;
    return null;
  }, [showVolunteersTab, pendingCount, coverage]);

  const volunteersBadgeTone = pendingCount > 0
    ? 'ocre'
    : (coverage.isComplete ? 'vert' : 'ocre');

  return {
    showVolunteersTab,
    isVolunteerCoordinator,
    commissions,
    consolidatedShifts,
    coverage,
    pendingCount,
    volunteersBadge,
    volunteersBadgeTone
  };
}
