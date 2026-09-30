import React from 'react';
import ThreadMessage from '../ThreadMessage';

/**
 * ThreadMessageItem
 * Wrapper d'intégration pour ThreadMessage avec support complet de l'accusé de lecture.
 */
const ThreadMessageItem = React.memo((props) => {
  return <ThreadMessage {...props} />;
});

export default ThreadMessageItem;
