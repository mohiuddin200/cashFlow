import React, { useState, useEffect } from 'react';
import { getConnectivityStatus } from '../services/firebase';

interface SyncStatus {
  isOnline: boolean;
  pendingChanges: number;
  syncInProgress: boolean;
}

const OfflineIndicator: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    pendingChanges: 0,
    syncInProgress: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const status = await getConnectivityStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Error getting connectivity status:', error);
      }
    };

    // Initial status check
    updateStatus();

    // Listen for online/offline events
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      updateStatus(); // Recheck sync status when coming online
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Periodically check sync status
    const interval = setInterval(updateStatus, 5000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (syncStatus.isOnline && syncStatus.pendingChanges === 0) {
    // Don't show anything when online and synced
    return null;
  }

  const getStatusColor = () => {
    if (syncStatus.syncInProgress) return 'bg-yellow-500';
    if (!syncStatus.isOnline) return 'bg-red-500';
    if (syncStatus.pendingChanges > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (syncStatus.syncInProgress) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingChanges > 0) return `${syncStatus.pendingChanges} pending sync`;
    return 'All synced';
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="relative">
        {/* Status indicator dot */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 bg-white rounded-full shadow-lg px-3 py-2 border border-gray-200 hover:shadow-xl transition-shadow"
        >
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${syncStatus.syncInProgress ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        </button>

        {/* Detailed status panel */}
        {showDetails && (
          <div className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Connection Status</h3>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium ${syncStatus.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending changes:</span>
                <span className={`text-sm font-medium ${syncStatus.pendingChanges > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {syncStatus.pendingChanges}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Sync status:</span>
                <span className={`text-sm font-medium ${syncStatus.syncInProgress ? 'text-yellow-600' : 'text-green-600'}`}>
                  {syncStatus.syncInProgress ? 'In progress' : 'Idle'}
                </span>
              </div>
            </div>

            {!syncStatus.isOnline && (
              <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                <p className="text-xs text-red-600">
                  You're currently offline. Your changes will be saved locally and synced when you reconnect.
                </p>
              </div>
            )}

            {syncStatus.isOnline && syncStatus.pendingChanges > 0 && (
              <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                <p className="text-xs text-orange-600">
                  You have unsynchronized changes. They will be synced automatically.
                </p>
              </div>
            )}

            <button
              onClick={() => setShowDetails(false)}
              className="mt-3 w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;