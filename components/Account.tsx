
import React, { useState } from 'react';
import { auth, signOut, User, deleteAllUserData } from '../services/firebase';
import { CURRENCIES } from '../constants';
import { Currency } from '../types';
import { getAvatarUrl } from '../utils/avatar';
import { useConsent } from '../services/consentContext';
import { exportAllUserData, downloadAsJson, downloadAsCsv } from '../services/dataExport';
import { offlineSyncService } from '../services/offlineSync';
import PrivacyPolicy from './PrivacyPolicy';

interface AccountProps {
  user: User;
  currency: string;
  setCurrency: (currency: string) => void;
  carryForwardEnabled: boolean;
  setCarryForward: (enabled: boolean) => void;
}

const Account: React.FC<AccountProps> = ({ user, currency, setCurrency, carryForwardEnabled, setCarryForward }) => {
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isMonthSettingsModalOpen, setIsMonthSettingsModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  const { consent, updateConsent } = useConsent();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out? Local data will be cleared for your privacy.')) {
      try {
        await offlineSyncService.clearOfflineData();
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing local data:', error);
      }
      await signOut(auth);
    }
  };

  const handleResetData = async () => {
    const confirmation = window.prompt(
      'This will permanently delete ALL your data including transactions, loans, categories, and your account. Type "DELETE" to confirm. This action cannot be undone!'
    );

    if (confirmation === 'DELETE') {
      setIsResetting(true);
      try {
        await deleteAllUserData(user.uid);
        // Clear all local data
        await offlineSyncService.clearOfflineData();
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        localStorage.clear();
        // Optionally delete the Firebase Auth account
        try {
          await user.delete();
        } catch {
          // If re-auth is required, just sign out
          await signOut(auth);
        }
        window.location.reload();
      } catch (error) {
        console.error('Error resetting data:', error);
        alert('Failed to reset data. Please try again.');
        setIsResetting(false);
      }
    } else if (confirmation !== null) {
      alert('Please type "DELETE" exactly to confirm.');
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllUserData(user.uid);
      downloadAsJson(data);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllUserData(user.uid);
      downloadAsCsv(data);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleAiConsent = async () => {
    try {
      await updateConsent({ aiProcessing: !consent?.aiProcessing });
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const handleToggleNotificationConsent = async () => {
    try {
      await updateConsent({ pushNotifications: !consent?.pushNotifications });
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const getCurrentCurrency = () => {
    return CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setIsCurrencyModalOpen(false);
  };

  const handleToggleCarryForward = async () => {
    const newValue = !carryForwardEnabled;
    setCarryForward(newValue);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg mb-6">
          <img
            src={getAvatarUrl(user)}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{user.displayName || 'Finance User'}</h3>
        <p className="text-gray-400 text-sm font-medium">{user.email}</p>

        <div className="mt-8 w-full flex gap-3">
          <div className="flex-1 bg-blue-50 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Joined</p>
            <p className="text-sm font-bold text-blue-700">
              {new Date(user.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
        <button
          onClick={() => setIsCurrencyModalOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getCurrentCurrency().flag}</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Currency</p>
              <p className="text-xs text-gray-500">{getCurrentCurrency().name} ({getCurrentCurrency().symbol})</p>
            </div>
          </div>
          <span className="text-gray-400">&rarr;</span>
        </button>
      </div>

      {/* Month Settings */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
        <button
          onClick={() => setIsMonthSettingsModalOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-3xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">📅</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Month Settings</p>
              <p className="text-xs text-gray-500">
                {carryForwardEnabled ? 'Carry-forward enabled' : 'Each month separate'}
              </p>
            </div>
          </div>
          <span className="text-gray-400">&rarr;</span>
        </button>
      </div>

      {/* Privacy & Data Settings */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Privacy & Data</h3>

        {/* AI Processing Toggle */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">AI Financial Analysis</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Send aggregated data for AI insights
              </p>
            </div>
            <button
              onClick={handleToggleAiConsent}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                consent?.aiProcessing ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  consent?.aiProcessing ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Push Notifications Toggle */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Push Notifications</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Receive reminders and alerts
              </p>
            </div>
            <button
              onClick={handleToggleNotificationConsent}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                consent?.pushNotifications ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  consent?.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Privacy Policy Link */}
        <button
          onClick={() => setIsPrivacyPolicyOpen(true)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-lg">📜</div>
            <p className="text-sm font-semibold text-gray-800">Privacy Policy</p>
          </div>
          <span className="text-gray-400">&rarr;</span>
        </button>
      </div>

      {/* Data Export */}
      <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 px-1">Your Data</h3>
        <p className="text-xs text-gray-500 mb-3 px-1">
          Download all your financial data. This includes transactions, categories, loans, and AI advice.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExportJson}
            disabled={isExporting}
            className="flex-1 py-3 bg-blue-50 text-blue-700 font-semibold rounded-2xl hover:bg-blue-100 transition-colors text-sm border border-blue-100 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex-1 py-3 bg-blue-50 text-blue-700 font-semibold rounded-2xl hover:bg-blue-100 transition-colors text-sm border border-blue-100 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Currency Modal */}
      {isCurrencyModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 safe-top safe-bottom">
          <div className="bg-white rounded-3xl p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Select Currency</h3>
            <div className="space-y-1.5">
              {CURRENCIES.map((currencyOption) => (
                <button
                  key={currencyOption.code}
                  onClick={() => handleCurrencyChange(currencyOption.code)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                    currency === currencyOption.code
                      ? 'bg-emerald-50 border border-emerald-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currencyOption.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-800">{currencyOption.name}</p>
                      <p className="text-[11px] text-gray-500">{currencyOption.code} • {currencyOption.symbol}</p>
                    </div>
                  </div>
                  {currency === currencyOption.code && (
                    <span className="text-emerald-600 text-lg">✓</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsCurrencyModalOpen(false)}
              className="w-full mt-4 p-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Month Settings Modal */}
      {isMonthSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 safe-top safe-bottom">
          <div className="bg-white rounded-3xl p-4 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Month Settings</h3>

            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Carry-forward Balance</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Previous month's remaining balance carries forward
                  </p>
                </div>
                <button
                  onClick={handleToggleCarryForward}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    carryForwardEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      carryForwardEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 mb-4">
              <p className="text-[11px] text-blue-800 font-medium leading-tight">
                {carryForwardEnabled
                  ? "Each month starts with previous month's remaining balance (income - expenses)"
                  : "Each month starts fresh from zero. Only current month transactions are counted."
                }
              </p>
            </div>

            <button
              onClick={() => setIsMonthSettingsModalOpen(false)}
              className="w-full p-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyPolicyOpen && (
        <PrivacyPolicy onClose={() => setIsPrivacyPolicyOpen(false)} />
      )}

      <div className="space-y-3">
        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="w-full bg-orange-50 p-5 rounded-3xl border border-orange-100 flex items-center justify-between group"
        >
          <div className={`flex items-center gap-4 ${isResetting ? 'text-orange-400' : 'text-orange-600'}`}>
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg">
              {isResetting ? '⏳' : '🗑️'}
            </div>
            <div className="text-left">
              <span className="font-bold block">{isResetting ? 'Deleting...' : 'Delete Account & Data'}</span>
              <span className="text-[11px] text-orange-400 font-medium">Permanently removes all your data</span>
            </div>
          </div>
          <span className="text-orange-200">&rarr;</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 p-5 rounded-3xl border border-red-100 flex items-center justify-between group mt-10"
        >
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg">🚪</div>
            <div className="text-left">
              <span className="font-bold block">Sign Out</span>
              <span className="text-[11px] text-red-400 font-medium">Local data will be cleared</span>
            </div>
          </div>
          <span className="text-red-200">&rarr;</span>
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-10">CashFlow v2.0.1 • Personal Edition</p>
    </div>
  );
};

export default Account;
