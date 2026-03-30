import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 safe-top safe-bottom">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            x
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6 text-sm text-gray-700 leading-relaxed">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Effective Date: March 31, 2026</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Version 1.0</p>
          </div>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">1. Data Controller</h3>
            <p>
              CashFlow is a personal finance management application. Your data is processed in accordance with the
              General Data Protection Regulation (GDPR) and applicable privacy laws.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">2. Data We Collect</h3>
            <p className="mb-2">We collect and process the following categories of personal data:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Account Data:</strong> Email address, display name, profile photo (from Google OAuth)</li>
              <li><strong>Financial Data:</strong> Transaction records (amounts, categories, dates, notes), spending goals, currency preferences</li>
              <li><strong>Loan Data:</strong> Loan records including person names, contact info, amounts, dates, and payment history</li>
              <li><strong>AI-Generated Data:</strong> Financial advice generated based on your aggregated spending data</li>
              <li><strong>Technical Data:</strong> Push notification tokens (if you consent to notifications)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">3. Legal Basis for Processing</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Contract Performance:</strong> Processing your financial data is necessary to provide the core service (tracking transactions, loans, and budgets)</li>
              <li><strong>Consent:</strong> AI-powered financial analysis (sending aggregated data to our AI provider) and push notifications require your explicit consent, which you can withdraw at any time</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">4. How We Store Your Data</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Cloud Storage:</strong> Your data is stored in Google Firebase (Firestore), protected by industry-standard encryption in transit and at rest</li>
              <li><strong>Local Storage:</strong> For offline access, data is cached in your browser's IndexedDB. This data is cleared when you sign out</li>
              <li><strong>Access Control:</strong> Your data is isolated by your unique user ID. No other user can access your financial records</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">5. Third-Party Data Sharing</h3>
            <p className="mb-2">We share data with third parties only as necessary to provide the service:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                <strong>AI Analysis Provider (DeepSeek):</strong> When you consent to AI features, we send
                <em> only aggregated financial summaries</em> (total income, total expenses, budget status, transaction count).
                No personally identifiable information (names, emails, specific transaction notes) is sent.
              </li>
              <li>
                <strong>Google Firebase:</strong> Authentication and data storage are provided by Google under their
                Data Processing Agreement. Google does not access your financial data for advertising purposes.
              </li>
            </ul>
            <p className="mt-2 font-semibold text-gray-800">We never sell your personal or financial data to any third party.</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">6. Data Retention</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Your financial data is retained for as long as your account is active</li>
              <li>AI-generated advice is retained for reference but can be deleted at any time</li>
              <li>When you delete your account, all data is permanently removed from our servers and your local device</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">7. Your Rights (GDPR Articles 15-20)</h3>
            <p className="mb-2">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Right to Access:</strong> Download all your data in JSON or CSV format from Account settings</li>
              <li><strong>Right to Rectification:</strong> Edit any transaction, loan, or category directly in the app</li>
              <li><strong>Right to Erasure:</strong> Delete your entire account and all associated data from Account settings</li>
              <li><strong>Right to Data Portability:</strong> Export your data in machine-readable formats (JSON, CSV)</li>
              <li><strong>Right to Restrict Processing:</strong> Disable AI analysis or push notifications individually from Privacy Settings</li>
              <li><strong>Right to Withdraw Consent:</strong> Change your consent preferences at any time from Account settings. Withdrawal does not affect the lawfulness of prior processing</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">8. Data Security</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>All data in transit is encrypted using TLS/HTTPS</li>
              <li>Firebase Firestore encrypts data at rest using AES-256</li>
              <li>User data is isolated using Firebase Security Rules that enforce per-user access control</li>
              <li>Local offline data is cleared automatically on sign-out</li>
              <li>AI API communications use server-side proxy to protect API credentials</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">9. Children's Privacy</h3>
            <p>
              CashFlow is not intended for use by children under the age of 16. We do not knowingly collect
              personal data from children.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">10. Changes to This Policy</h3>
            <p>
              We may update this privacy policy from time to time. When we make significant changes,
              you will be asked to review and accept the updated policy through the consent banner.
              The policy version number and date will be updated accordingly.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-2">11. Contact</h3>
            <p>
              If you have questions about this privacy policy or wish to exercise your data rights,
              please contact us through the application settings or raise an issue on our project repository.
            </p>
          </section>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <p className="text-xs text-emerald-700 font-medium">
              This privacy policy is compliant with the General Data Protection Regulation (EU) 2016/679 (GDPR)
              and aims to provide transparent information about how your data is processed.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors text-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
