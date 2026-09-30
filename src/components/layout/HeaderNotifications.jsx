/**
 * Composant HeaderNotifications
 * Enveloppe et expose le Centre de Notifications (cloche) pour la barre de navigation supérieure.
 * Assure la compatibilité architecturale Cordel.
 */

import React from 'react';
import NotificationCenter from '../notifications/NotificationCenter';

export default function HeaderNotifications(props) {
  return <NotificationCenter {...props} />;
}
