import React, { useState } from 'react';
import { useConsent } from '../services/consentContext';
import PrivacyPolicy from './PrivacyPolicy';

const ConsentBanner: React.FC = () => {
  const { updateConsent } = useConsent();
  const [aiProcessing, setAiProcessing] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAcceptSelected = async () => {
    setSaving(true);
    try {
      await updateConsent({
        essential: true,
        aiProcessing,
        pushNotifications,
        consentVersion: '1.0',
        consentedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptAll = async () => {
    setSaving(true);
    try {
      await updateConsent({
        essential: true,
        aiProcessing: true,
        pushNotifications: true,
        consentVersion: '1.0',
        consentedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Failed to save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 safe-top safe-bottom">
        <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Your Privacy Matters</h2>
              <p className="text-xs text-gray-500">We need your consent to proceed</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            CashFlow processes your financial data to help you track spending and manage budgets.
            Please review and choose which optional features you'd like to enable.
          </p>

          <div className="space-y-3">
            {/* Essential - always on */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Essential Data Processing</p>
                  <p className="text-xs text-gray-500 mt-0.5">Required for app to function</p>
                </div>
                <div className="relative inline-flex h-7 w-12 items-center rounded-full bg-emerald-500 cursor-not-allowed opacity-70">
                  <span className="inline-block h-5 w-5 transform rounded-full bg-white translate-x-6" />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Storing transactions, categories, loans, and settings in your secure account
              </p>
            </div>

            {/* AI Processing */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">AI Financial Analysis</p>
                  <p className="text-xs text-gray-500 mt-0.5">Personalized spending insights</p>
                </div>
                <button
                  onClick={() => setAiProcessing(!aiProcessing)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    aiProcessing ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      aiProcessing ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Aggregated financial summaries (no personal details) are sent to our AI provider for analysis
              </p>
            </div>

            {/* Push Notifications */}
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Push Notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">Reminders and updates</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    pushNotifications ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      pushNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                Receive loan due date reminders and financial alerts
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleAcceptAll}
              disabled={saving}
              className="w-full py-3.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving...' : 'Accept All'}
            </button>
            <button
              onClick={handleAcceptSelected}
              disabled={saving}
              className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 text-sm"
            >
              {saving ? 'Saving...' : 'Accept Selected'}
            </button>
          </div>

          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="w-full text-center text-xs text-emerald-600 font-semibold underline underline-offset-2"
          >
            Read our Privacy Policy
          </button>
        </div>
      </div>

      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={() => setShowPrivacyPolicy(false)} />
      )}
    </>
  );
};

export default ConsentBanner;
