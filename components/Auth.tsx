
import React, { useState } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/firebase';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: any) => {
    const code = err.code || '';
    if (code === 'auth/configuration-not-found') {
      return "Firebase Auth is not enabled. Please go to your Firebase Console > Build > Authentication and enable 'Email/Password' and 'Google' providers.";
    }
    if (code === 'auth/invalid-credential') {
      return "Invalid email or password. Please try again.";
    }
    if (code === 'auth/popup-closed-by-user') {
      return "Login cancelled.";
    }
    return err.message || "An unexpected error occurred.";
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8 text-center">
      <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-emerald-100 mb-6">
        💸
      </div>
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">CashFlow</h1>
      <p className="text-gray-500 mt-2 mb-8 text-sm font-medium">Your Personal Finance Assistant</p>

      {error && (
        <div className="w-full bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold mb-6 border border-red-100 leading-relaxed text-left">
          <div className="flex items-start gap-2">
            <span className="shrink-0 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="w-full space-y-4">
        <input 
          type="email" 
          placeholder="Email Address"
          className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input 
          type="password" 
          placeholder="Password"
          className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-800"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          disabled={loading}
          type="submit"
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="flex items-center my-8 w-full">
        <div className="flex-1 h-px bg-gray-100"></div>
        <span className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
        <div className="flex-1 h-px bg-gray-100"></div>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-4 bg-white border-2 border-gray-50 flex items-center justify-center gap-3 rounded-2xl font-bold text-gray-700 shadow-sm active:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Google
      </button>

      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="mt-8 text-xs font-bold text-emerald-600 uppercase tracking-widest"
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </div>
  );
};

export default Auth;
