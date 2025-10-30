// components/network-status.tsx
'use client';

import { JSX, useState } from 'react';
import { useSyncStatus } from '../lib/hooks/use-sync-status';

export function NetworkStatus(): JSX.Element | null {
  const { syncStatus, manualSync } = useSyncStatus();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleManualSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      await manualSync();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const totalPending = syncStatus.pendingPatients + syncStatus.pendingDoctors + syncStatus.pendingTests;

  if (syncStatus.isOnline && totalPending === 0) {
    return null; // Don't show status when everything is synced and online
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-sm font-medium ${syncStatus.isOnline
      ? totalPending > 0
        ? 'bg-yellow-500 text-yellow-900'
        : 'bg-green-500 text-white'
      : 'bg-red-500 text-white'
      }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${syncStatus.isOnline ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
            <span>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {totalPending > 0 && (
            <div className="flex items-center space-x-4 text-xs">
              {syncStatus.pendingPatients > 0 && (
                <span>Patients: {syncStatus.pendingPatients}</span>
              )}
              {syncStatus.pendingDoctors > 0 && (
                <span>Doctors: {syncStatus.pendingDoctors}</span>
              )}
              {syncStatus.pendingTests > 0 && (
                <span>Tests: {syncStatus.pendingTests}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {syncStatus.isOnline && totalPending > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`px-3 py-1 rounded text-xs font-medium ${isSyncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-white text-yellow-700 hover:bg-yellow-100'
                }`}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}

          {!syncStatus.isOnline && (
            <span className="text-xs">Changes will sync when online</span>
          )}
        </div>
      </div>
    </div>
  );
}