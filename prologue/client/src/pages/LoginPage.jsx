import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const STAT_PILLS = [
  '2,400+ Projects Completed',
  '94% Placement Rate',
  '150+ Companies Trust Us',
];

function generateEmployeeId() {
  const year = new Date().getFullYear();
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `PRO-${year}-${digits}`;
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('prologue_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistUser(user) {
  localStorage.setItem('prologue_user', JSON.stringify(user));
}

function completeAuth(employeeId, name, email) {
  const user = { employeeId, name: name || '', email: email || '' };
  persistUser(user);
  const onboardingComplete = localStorage.getItem('prologue_onboarding_complete') === 'true';
  return onboardingComplete ? '/dashboard' : '/onboarding';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');
  const [loginEmployeeId, setLoginEmployeeId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState('');
  const [signupNameForRedirect, setSignupNameForRedirect] = useState('');
  const [signupEmailForRedirect, setSignupEmailForRedirect] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const user = getStoredUser();
    if (!user) {
      setLoginError('No account found with this Employee ID.');
      return;
    }
    if (user.employeeId !== loginEmployeeId.trim()) {
      setLoginError('Invalid Employee ID or password.');
      return;
    }
    const path = completeAuth(user.employeeId, user.name, user.email);
    navigate(path);
  };

  const handleSignup = (e) => {
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
    if (!signupPassword) {
      setSignupError('Password is required.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError('Passwords do not match.');
      return;
    }
    const employeeId = generateEmployeeId();
    setGeneratedId(employeeId);
    setSignupNameForRedirect(signupName.trim());
    setSignupEmailForRedirect(signupEmail.trim());
    persistUser({
      employeeId,
      name: signupName.trim(),
      email: signupEmail.trim(),
    });
    setSignupSuccess(true);
  };

  const handleEnterPrologue = () => {
    const path = completeAuth(generatedId, signupNameForRedirect, signupEmailForRedirect);
    navigate(path);
  };

  const handleCopyId = () => {
    if (generatedId) {
      navigator.clipboard.writeText(generatedId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex">
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
                    {loginError && <p className="text-sm text-highlight">{loginError}</p>}
                    <Button type="submit" className="w-full" size="lg">
                      Login
                    </Button>
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
                    {signupError && <p className="text-sm text-highlight">{signupError}</p>}
                    <Button type="submit" className="w-full" size="lg">
                      Create Account & Get Employee ID
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
                <p className="text-xs text-text-secondary">Save this ID — you’ll use it to log in.</p>
                <Button onClick={handleEnterPrologue} className="w-full" size="lg">
                  Enter Prologue
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
