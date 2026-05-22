import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from '../components/LoadingScreen';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function AuthPage() {
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'RESET'>('LOGIN');

  const [identifier, setIdentifier] = useState('+91');
  const [password, setPassword] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const { login, firebaseLoginHandle } = useAuth();
  const navigate = useNavigate();

  const [loginMethod, setLoginMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (err) {
        console.error('Recaptcha init error:', err);
      }
    }

    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.error('Error clearing recaptcha:', e);
        }
        delete (window as any).recaptchaVerifier;
      }
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);
    
    try {
      const res = await login(identifier, password);
      if (res.success) {
        if (res.isNewUser) {
          navigate('/profile?edit_name=true');
        } else {
           navigate('/');
        }
      } else {
        setError(res.error || 'Invalid login credentials');
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsAuthenticating(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);
    try {
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleVerifyOtpAndSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setError('');
    setIsAuthenticating(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const res = await firebaseLoginHandle(user.uid, user.phoneNumber || phoneNumber, password);
      if (res.success) {
        if (view === 'RESET') {
          alert('Password reset successfully.');
        }
        if (res.isNewUser && view !== 'RESET') {
          navigate('/profile?edit_name=true');
        } else {
          navigate('/');
        }
      } else {
        setError('Failed, please try again.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please try again.');
      } else {
        setError(err.message || 'Invalid OTP');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary/10 px-4">
      {isAuthenticating && <LoadingScreen message="Processing..." />}
      
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md mb-4 flex justify-start">
        <button 
          onClick={() => navigate('/')} 
          className="text-primary/70 hover:text-primary transition-colors flex items-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Store
        </button>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-lg border border-secondary/20 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-serif font-bold text-primary mb-2">Cake House</h2>
          <p className="text-sm text-primary/60">
            {view === 'LOGIN' && 'Welcome back! Please login.'}
            {view === 'REGISTER' && 'Create a new Customer account.'}
            {view === 'RESET' && 'Reset your password.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        {view === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="flex justify-center space-x-4 mb-4">
              <button
                type="button"
                onClick={() => { setLoginMethod('PHONE'); setIdentifier('+91'); }}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${loginMethod === 'PHONE' ? 'bg-primary text-background' : 'bg-secondary/20 text-primary/70 hover:bg-secondary/30'}`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('EMAIL'); setIdentifier(''); }}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${loginMethod === 'EMAIL' ? 'bg-primary text-background' : 'bg-secondary/20 text-primary/70 hover:bg-secondary/30'}`}
              >
                Email
              </button>
            </div>
            
            {loginMethod === 'PHONE' ? (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Phone Number
                </label>
                <div className="flex border border-secondary/30 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-accent">
                  <span className="bg-secondary/10 px-4 py-2 border-r border-secondary/30 text-primary font-medium flex items-center">+91</span>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2 focus:outline-none"
                    value={identifier.startsWith('+91') ? identifier.replace(/^\+91/, '') : identifier}
                    onChange={(e) => setIdentifier('+91' + e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  value={identifier.startsWith('+91') ? '' : identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {loginMethod === 'PHONE' && (
                <div className="mt-1 text-right">
                  <button type="button" onClick={() => { setView('RESET'); setOtpSent(false); setPassword(''); setPhoneNumber(identifier.includes('+') ? identifier : '+91'); }} className="text-xs text-accent hover:underline">Forgot Password?</button>
                </div>
              )}
            </div>
            
            <button type="submit" className="w-full py-2 bg-primary text-background rounded-md font-medium hover:bg-primary/90 transition-colors">
              Login
            </button>
            <div className="text-center mt-4 text-sm text-primary/60">
              New customer? <button type="button" onClick={() => { setView('REGISTER'); setOtpSent(false); setPassword(''); setPhoneNumber('+91'); }} className="text-accent font-medium hover:underline">Create an account</button>
            </div>
          </form>
        )}

        {(view === 'REGISTER' || view === 'RESET') && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Phone Number</label>
                  <div className="flex border border-secondary/30 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-accent">
                    <span className="bg-secondary/10 px-4 py-2 border-r border-secondary/30 text-primary font-medium flex items-center">+91</span>
                    <input
                      type="tel"
                      required
                      className="w-full px-4 py-2 focus:outline-none"
                      value={phoneNumber.replace(/^\+91/, '')}
                      onChange={(e) => setPhoneNumber('+91' + e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-primary text-background rounded-md font-medium hover:bg-primary/90 transition-colors">
                  Send OTP
                </button>
                <div className="text-center mt-4 text-sm text-primary/60">
                  <button type="button" onClick={() => setView('LOGIN')} className="text-primary hover:underline">Back to Login</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndSetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Enter OTP</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent tracking-widest text-center"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">{view === 'RESET' ? 'New Password' : 'Password'}</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-accent text-white rounded-md font-medium hover:bg-accent/90 transition-colors">
                  {view === 'REGISTER' ? 'Verify & Create Account' : 'Verify & Reset Password'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setOtpSent(false)}
                  className="w-full py-2 text-primary/60 text-sm hover:text-primary transition-colors"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}

        {view === 'LOGIN' && (
          <div className="mt-6 text-center text-sm text-primary/60 flex flex-col gap-2">
            <div className="mt-4 p-3 bg-secondary/20 rounded-md text-xs text-left">
              <strong className="block mb-1 text-primary">Demo Accounts (Password: dummy)</strong>
              <div className="flex justify-between"><span>Admin:</span> <code>admin@rustic.com</code></div>
              <div className="flex justify-between"><span>Kitchen:</span> <code>kitchen@rustic.com</code></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
