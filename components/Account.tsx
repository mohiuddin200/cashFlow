
import React from 'react';
import { auth, signOut, User } from '../services/firebase';

interface AccountProps {
  user: User;
}

const Account: React.FC<AccountProps> = ({ user }) => {
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut(auth);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <h2 className="text-2xl font-bold text-gray-800">Account</h2>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-50 shadow-lg mb-6">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=10b981&color=fff`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{user.displayName || 'Finance User'}</h3>
        <p className="text-gray-400 text-sm font-medium">{user.email}</p>
        
        <div className="mt-8 w-full flex gap-3">
          {/* <div className="flex-1 bg-emerald-50 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Status</p>
            <p className="text-sm font-bold text-emerald-700">Premium</p>
          </div> */}
          <div className="flex-1 bg-blue-50 p-4 rounded-3xl text-center">
            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Joined</p>
            <p className="text-sm font-bold text-blue-700">
              {new Date(user.metadata.creationTime || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* <button className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">⚙️</div>
            <span className="font-bold text-gray-700">Settings</span>
          </div>
          <span className="text-gray-300 group-hover:translate-x-1 transition-transform">→</span>
        </button>
        <button className="w-full bg-white p-5 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-lg">📄</div>
            <span className="font-bold text-gray-700">Export Data</span>
          </div>
          <span className="text-gray-300 group-hover:translate-x-1 transition-transform">→</span>
        </button> */}
        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 p-5 rounded-3xl border border-red-100 flex items-center justify-between group mt-10"
        >
          <div className="flex items-center gap-4 text-red-600">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg">🚪</div>
            <span className="font-bold">Sign Out</span>
          </div>
          <span className="text-red-200">→</span>
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-10">CashFlow v2.0.1 • Personal Edition</p>
    </div>
  );
};

export default Account;
