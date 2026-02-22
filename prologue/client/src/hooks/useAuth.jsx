import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// TEMPORARY: Bypass login and use demo user. Set VITE_BYPASS_AUTH=false in .env to require login again.
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH !== 'false';

const DEMO_USER = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'Demo User',
  employee_id: 'PRO-DEMO',
  email: 'demo@local.dev',
  onboarding_complete: true,
  role_id: null,
};

function generateEmployeeId() {
  const year = new Date().getFullYear();
  const digits = Math.floor(10000 + Math.random() * 90000);
  return `PRO-${year}-${digits}`;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async (authUser) => {
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser({
          ...authUser,
          ...profile,
          email: authUser.email ?? profile?.email,
        });
      } catch (e) {
        if (typeof console !== 'undefined') console.log('[dbg] useAuth loadUser profile error', e?.message ?? e);
        setUser(authUser);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUser(session.user);
      } else {
        setUser(BYPASS_AUTH ? DEMO_USER : null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (typeof console !== 'undefined') console.log('[dbg] useAuth getSession resolved', { hasSession: !!session?.user });
      if (session?.user) loadUser(session.user);
      else if (BYPASS_AUTH) setUser(DEMO_USER);
      setLoading(false);
    }).catch((err) => {
      if (typeof console !== 'undefined') console.log('[dbg] useAuth getSession rejected', err?.message ?? err);
      if (BYPASS_AUTH) setUser(DEMO_USER);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (name, email, password) => {
    const employeeId = generateEmployeeId();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { employee_id: employeeId, full_name: name } },
    });
    if (authError) {
      const msg = (authError.message || '').toLowerCase();
      const code = authError.status || authError.code;
      if (code === 429 || msg.includes('rate limit') || msg.includes('too many')) {
        throw new Error('Too many sign-up attempts. Please wait 15–60 minutes and try again, or use a different email for now.');
      }
      if (msg.includes('invalid') && (msg.includes('email') || msg.includes('mail'))) {
        throw new Error('Please enter a valid email address (e.g. you@gmail.com). Check for typos and try again.');
      }
      throw authError;
    }
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      employee_id: employeeId,
      name: (name || '').trim(),
      email: (email || '').trim(),
      role: null,
    });
    if (insertError) throw insertError;
    return { employeeId, user: authData.user };
  };

  const signInWithEmployeeId = async (employeeId, password) => {
    const trimmed = (employeeId || '').trim();
    const { data: row, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .eq('employee_id', trimmed)
      .single();
    if (fetchError || !row?.email) {
      const err = new Error('Invalid Employee ID or password.');
      err.code = 'invalid_credentials';
      throw err;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: row.email,
      password,
    });
    if (signInError) {
      const err = new Error(signInError.message || 'Invalid Employee ID or password.');
      err.code = signInError.code;
      throw err;
    }
  };

  const signOut = async () => {
    if (BYPASS_AUTH) {
      setUser(DEMO_USER);
      return;
    }
    await supabase.auth.signOut();
  };

  const enterDemoMode = () => setUser(DEMO_USER);

  const value = {
    user,
    signUp,
    signInWithEmployeeId,
    signOut,
    enterDemoMode,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
