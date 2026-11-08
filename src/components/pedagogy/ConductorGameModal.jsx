import React from 'react';
import SignalTimelineModal from './SignalTimelineModal';

/**
 * Ré-export de compatibilité vers SignalTimelineModal (< 20 lignes).
 */
export default function ConductorGameModal(props) {
  return <SignalTimelineModal {...props} />;
}
