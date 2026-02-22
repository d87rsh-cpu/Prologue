import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check, Loader2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STAT_PILLS = [
  '2,400+ Projects Completed',
  '94% Placement Rate',
  '150+ Companies Trust Us',
];

function getOnboardingComplete(user) {
  return user?.onboarding_complete === true;
}

function getRedirectPath(user) {
  return getOnboardingComplete(user) ? '/dashboard' : '/onboarding';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { signUp, signInWithEmployeeId, signOut, enterDemoMode, loading: authLoading } = useAuth();

  const [tab, setTab] = useState('login');
  const [loginEmployeeId, setLoginEmployeeId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSubmitLoading(true);
    try {
      await signInWithEmployeeId(loginEmployeeId, loginPassword);
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      let profile = null;
      if (sessionUser) {
        const { data } = await supabase.from('users').select('*').eq('id', sessionUser.id).single();
        profile = data;
      }
      const user = profile ? { ...sessionUser, ...profile } : sessionUser;
      navigate(getRedirectPath(user));
    } catch (err) {
      setLoginError(err?.message || 'Invalid Employee ID or password.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (!signupName.trim()) {
      setSignupError('Full name is required.');
      return;
    }
    if (!signupEmail.trim()) {
      setSignupError('Email is required.');
      return;
    }
    const emailTrimmed = signupEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setSignupError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }
    if (!signupPassword) {
      setSignupError('Password is required.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError('Passwords do not match.');
      return;
    }
    setSubmitLoading(true);
    try {
      const { employeeId } = await signUp(signupName.trim(), emailTrimmed, signupPassword);
      setGeneratedId(employeeId);
      setSignupSuccess(true);
    } catch (err) {
      const msg = err?.message || 'Sign up failed. Please try again.';
      setSignupError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEnterPrologue = () => {
    navigate('/onboarding');
  };

  const handleCopyId = () => {
    if (generatedId) {
      navigator.clipboard.writeText(generatedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <Loader2 className="w-10 h-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {!isSupabaseConfigured && (
        <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-200 px-4 py-3 text-sm text-center">
          <strong>Supabase not configured.</strong> To log in or sign up: create <code className="bg-black/20 px-1 rounded">client/.env</code> with <code className="bg-black/20 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-black/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> (copy from <code className="bg-black/20 px-1 rounded">.env.example</code>), then restart the dev server.
        </div>
      )}
      <div className="min-h-screen flex flex-1">
      {/* Left panel */}
      <div
        className="w-1/2 min-h-screen bg-primary relative flex flex-col justify-between p-10 overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(rgba(22, 33, 62, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22, 33, 62, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-sans)' }}>P</span>
            </div>
            <span className="text-xl font-light text-text-primary" style={{ fontFamily: 'Inter', fontWeight: 300 }}>Prologue</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-[48px] font-bold text-text-primary leading-tight" style={{ fontFamily: 'Inter', fontWeight: 700 }}>
            Your Career Starts Here.
          </h1>
          <p className="mt-4 text-base font-light text-text-secondary max-w-md" style={{ fontFamily: 'Inter', fontWeight: 300 }}>
            The world's first virtual workplace for students. Build real projects. Learn real skills. Get hired for real.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {STAT_PILLS.map((label) => (
            <span
              key={label}
              className="px-3 py-1.5 rounded border border-border bg-card-bg/80 text-text-secondary text-sm"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-1/2 min-h-screen bg-secondary flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          <div className="bg-card-bg border border-border rounded-lg shadow-card p-6">
            {!signupSuccess ? (
              <>
                <div className="flex rounded-lg border border-border p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => { setTab('login'); setLoginError(''); setSignupError(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'login' ? 'bg-accent text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('signup'); setLoginError(''); setSignupError(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'signup' ? 'bg-accent text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    Sign Up
                  </button>
                </div>

                {tab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Employee ID</label>
                      <Input
                        placeholder="e.g. PRO-2024-00123"
                        value={loginEmployeeId}
                        onChange={(e) => setLoginEmployeeId(e.target.value)}
                        error={!!loginError}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        error={!!loginError}
                      />
                    </div>
                    {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                    <Button type="submit" className="w-full" size="lg" disabled={submitLoading}>
                      {submitLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Login'}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmployeeId('PRO-2024-00001');
                        setLoginPassword('prologue2024demo');
                        setLoginError('');
                      }}
                      className="w-full text-sm text-text-secondary hover:text-accent transition-colors"
                    >
                      Try Demo Account (Judges)
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
                      <Input
                        placeholder="Your full name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        error={!!signupError}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        error={!!signupError}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        error={!!signupError}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm Password</label>
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        error={!!signupError}
                      />
                    </div>
                    {signupError && (
                      <div className="space-y-2">
                        <p className="text-sm text-red-500">{signupError}</p>
                        {signupError.includes('Too many') || signupError.includes('15') ? (
                          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200 space-y-2">
                            <p className="font-medium">Fix this for next time:</p>
                            <p>In Supabase Dashboard go to <strong>Authentication → Providers → Email</strong> and turn <strong>OFF</strong> &quot;Confirm email&quot;. Then sign-up won’t send emails and won’t hit the limit.</p>
                            <Button type="button" variant="secondary" className="w-full mt-2" onClick={() => { enterDemoMode(); navigate('/dashboard'); }}>
                              Continue to dashboard as demo user
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )}
                    <Button type="submit" className="w-full" size="lg" disabled={submitLoading}>
                      {submitLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account & Get Employee ID'}
                    </Button>
                  </form>
                )}

                <p className="mt-6 text-xs text-text-secondary text-center">
                  By signing up, you agree to Prologue's Terms of Service
                </p>
              </>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-text-secondary">Your Employee ID</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-2 bg-secondary border border-border rounded-lg text-text-primary font-mono text-lg">
                    {generatedId}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-2 rounded-lg border border-border hover:bg-secondary text-text-secondary hover:text-text-primary transition-colors"
                    title="Copy"
                  >
                    {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-text-secondary">Save this ID — you'll use it to log in.</p>
                <Button onClick={handleEnterPrologue} className="w-full" size="lg">
                  Enter Prologue
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
