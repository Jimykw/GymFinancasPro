import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, registerGoogleApi, syncApi, updateProfileApi } from '../services/apiClient';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string | null;
  name: string;
  role: 'admin' | 'funcionario';
  filialId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (payload: { name: string; username: string; email: string; password: string }) => Promise<boolean>;
  registerWithGoogle: (payload: { name: string; email: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'username' | 'email' | 'avatarUrl'>>) => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PENDING_DESPESA_UPDATES_KEY = 'gym_financas_pending_despesa_updates';
const PENDING_PROFILE_UPDATES_KEY = 'gym_financas_pending_profile_updates';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const applyPendingProfileUpdates = (currentUser: User | null): User | null => {
    if (!currentUser) {
      return currentUser;
    }

    try {
      const raw = localStorage.getItem(PENDING_PROFILE_UPDATES_KEY);
      if (!raw) {
        return currentUser;
      }

      const pending = JSON.parse(raw);
      if (!pending || typeof pending !== 'object') {
        return currentUser;
      }

      return {
        ...currentUser,
        ...pending,
      };
    } catch {
      return currentUser;
    }
  };

  const applyPendingDespesaUpdates = (data: any) => {
    try {
      const raw = localStorage.getItem(PENDING_DESPESA_UPDATES_KEY);
      const pending = raw ? JSON.parse(raw) : {};
      if (!pending || typeof pending !== 'object' || !Array.isArray(data?.despesas)) {
        return data;
      }

      const despesas = data.despesas.map((despesa: any) => {
        const patch = pending[despesa.id];
        if (!patch) {
          return despesa;
        }

        return {
          ...despesa,
          status: patch.status ?? despesa.status,
          dataPagamento: patch.dataPagamento ?? undefined,
        };
      });

      return {
        ...data,
        despesas,
      };
    } catch {
      return data;
    }
  };

  const syncData = async (token: string) => {
    const synced = await syncApi(token);
    const merged = applyPendingDespesaUpdates(synced);
    localStorage.setItem('gym_financas_data', JSON.stringify(merged));
  };

  const applySession = async (resp: { token: string; user: User }) => {
    const mergedUser = applyPendingProfileUpdates(resp.user as User) as User;
    localStorage.setItem('gym_token', resp.token);
    localStorage.setItem('gym_user', JSON.stringify(mergedUser));
    await syncData(resp.token);
    setUser(mergedUser);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('gym_user');
    const savedToken = localStorage.getItem('gym_token');

    if (!savedUser || !savedToken) return;

    const parsedUser = applyPendingProfileUpdates(JSON.parse(savedUser) as User) as User;

    syncData(savedToken)
      .then(() => setUser(parsedUser))
      .catch(() => {
        localStorage.removeItem('gym_token');
        localStorage.removeItem('gym_user');
        localStorage.removeItem('gym_financas_data');
        setUser(null);
      });
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const resp = await loginApi(username, password);
    await applySession(resp as any);
    return true;
  };

  const register = async (payload: { name: string; username: string; email: string; password: string }): Promise<boolean> => {
    const resp = await registerApi(payload);
    await applySession(resp as any);
    return true;
  };

  const registerWithGoogle = async (payload: { name: string; email: string }): Promise<boolean> => {
    const resp = await registerGoogleApi(payload);
    await applySession(resp as any);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gym_user');
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_financas_data');
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'username' | 'email' | 'avatarUrl'>>): Promise<boolean> => {
    const token = localStorage.getItem('gym_token');

    if (!user) {
      return false;
    }

    const nextName = String(updates.name ?? user.name).trim();
    const nextEmail = String(updates.email ?? user.email ?? '').trim().toLowerCase();
    const nextAvatarUrl = updates.avatarUrl !== undefined ? updates.avatarUrl : (user.avatarUrl ?? null);

    const optimisticUser = {
      ...user,
      name: nextName,
      email: nextEmail,
      avatarUrl: nextAvatarUrl,
    } as User;

    setUser(optimisticUser);
    localStorage.setItem('gym_user', JSON.stringify(optimisticUser));
    localStorage.setItem(
      PENDING_PROFILE_UPDATES_KEY,
      JSON.stringify({
        name: optimisticUser.name,
        email: optimisticUser.email,
        avatarUrl: optimisticUser.avatarUrl ?? null,
      }),
    );

    if (!token) {
      return true;
    }

    try {
      const response = await updateProfileApi(token, {
        name: nextName,
        email: nextEmail,
        avatarUrl: nextAvatarUrl,
      });

      const nextUser = {
        ...optimisticUser,
        ...response.user,
      } as User;

      setUser(nextUser);
      localStorage.setItem('gym_user', JSON.stringify(nextUser));
      localStorage.removeItem(PENDING_PROFILE_UPDATES_KEY);
      return true;
    } catch (error) {
      return true;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, registerWithGoogle, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
