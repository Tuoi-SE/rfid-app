import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import React, { useEffect } from 'react';
import { RootNavigator } from '../navigation/root-navigator';
import { useScanSessionStore } from '../../features/inventory/store/scan-session.store';

export function AppRoot() {
  const loadFromStorage = useScanSessionStore(s => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return <RootNavigator />;
}
