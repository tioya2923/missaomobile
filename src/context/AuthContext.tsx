import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { loginUtilizador, registarUtilizador, type AuthResponse } from '../api/auth';

const TOKEN_KEY = '@lombembwa_token';
const USER_KEY  = '@lombembwa_utilizador';

export interface Utilizador { nome: string; email: string; }

interface AuthContextType {
  token:       string | null;
  utilizador:  Utilizador | null;
  isLoading:   boolean;
  login:       (email: string, password: string) => Promise<void>;
  registar:    (nome: string, email: string, password: string) => Promise<void>;
  logout:      () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,      setToken]      = useState<string | null>(null);
  const [utilizador, setUtilizador] = useState<Utilizador | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]).then(([[, t], [, u]]) => {
      if (t) setToken(t);
      if (u) { try { setUtilizador(JSON.parse(u)); } catch {} }
      setIsLoading(false);
    });
  }, []);

  const salvar = async (res: AuthResponse) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, res.token],
      [USER_KEY, JSON.stringify({ nome: res.nome, email: res.email })],
    ]);
    setToken(res.token);
    setUtilizador({ nome: res.nome, email: res.email });
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginUtilizador(email, password);
    await salvar(res);
  }, []);

  const registar = useCallback(async (nome: string, email: string, password: string) => {
    const res = await registarUtilizador(nome, email, password);
    await salvar(res);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUtilizador(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, utilizador, isLoading, login, registar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
