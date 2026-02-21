import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUser(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadUser(session.user);
      else setLoading(false);
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
    if (authError) throw authError;
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
    await supabase.auth.signOut();
  };

  const value = {
    user,
    signUp,
    signInWithEmployeeId,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
