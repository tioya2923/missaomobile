import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginLoja, registarLoja, type RegistoLojaPayload } from '../api/vendedor';
import { loginGestor } from '../api/admin';
import { definirAoExpirarSessao } from '../api/client';

// Reutiliza a mesma chave que o cliente axios (src/api/client.ts) já lê para
// anexar o cabeçalho Authorization a todos os pedidos autenticados. Só pode
// haver uma sessão ativa de cada vez — ou uma loja, ou o administrador geral —
// exatamente como no site: o mesmo formulário de entrada resolve para uma ou
// para a outra, consoante as credenciais.
const TOKEN_KEY = '@kwendi_token';
const NOME_KEY = '@ndatava_sessao_nome';
const ID_KEY = '@ndatava_sessao_lojaId';
const TIPO_KEY = '@ndatava_sessao_tipo';

export type TipoSessao = 'loja' | 'gestor' | null;

interface LojaAuthContextType {
  token: string | null;
  nome: string | null;
  lojaId: number | null;
  tipo: TipoSessao;
  isAuthenticated: boolean;
  isLoja: boolean;
  isGestor: boolean;
  carregado: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  registar: (payload: RegistoLojaPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const LojaAuthContext = createContext<LojaAuthContextType | null>(null);

export function LojaAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [lojaId, setLojaId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoSessao>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([TOKEN_KEY, NOME_KEY, ID_KEY, TIPO_KEY]).then(([[, t], [, n], [, id], [, tp]]) => {
      if (t) {
        setToken(t); setNome(n); setLojaId(id ? Number(id) : null);
        setTipo(tp === 'gestor' ? 'gestor' : tp === 'loja' ? 'loja' : null);
      }
      setCarregado(true);
    }).catch(() => {
      // Falha a ler o armazenamento local — trata como sessão não iniciada em
      // vez de deixar a área de vendedor/administrador presa no carregamento.
      setCarregado(true);
    });
  }, []);

  const guardarSessao = async (data: { token: string; nome: string; lojaId: number | null; tipo: 'loja' | 'gestor' }) => {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [NOME_KEY, data.nome],
      [ID_KEY, data.lojaId != null ? String(data.lojaId) : ''],
      [TIPO_KEY, data.tipo],
    ]);
    setToken(data.token);
    setNome(data.nome);
    setLojaId(data.lojaId);
    setTipo(data.tipo);
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginLoja(email, password);
    await guardarSessao({ token: data.token, nome: data.nome, lojaId: data.lojaId, tipo: 'loja' });
  }, []);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    const data = await loginGestor(email, password);
    await guardarSessao({ token: data.token, nome: data.nome, lojaId: null, tipo: 'gestor' });
  }, []);

  const registar = useCallback(async (payload: RegistoLojaPayload) => {
    const data = await registarLoja(payload);
    await guardarSessao({ token: data.token, nome: data.nome, lojaId: data.lojaId, tipo: 'loja' });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, NOME_KEY, ID_KEY, TIPO_KEY]);
    setToken(null);
    setNome(null);
    setLojaId(null);
    setTipo(null);
  }, []);

  // Regista o logout como reação a um 401 do servidor (sessão expirada), para
  // que a app volte sozinha ao ecrã de entrada em vez de ficar a mostrar
  // erros genéricos em cada ação depois do token deixar de ser válido.
  useEffect(() => {
    definirAoExpirarSessao(() => { logout(); });
    return () => definirAoExpirarSessao(null);
  }, [logout]);

  const value = useMemo<LojaAuthContextType>(() => ({
    token, nome, lojaId, tipo, isAuthenticated: !!token, isLoja: !!token && tipo === 'loja', isGestor: !!token && tipo === 'gestor',
    carregado, login, loginAdmin, registar, logout,
  }), [token, nome, lojaId, tipo, carregado, login, loginAdmin, registar, logout]);

  return <LojaAuthContext.Provider value={value}>{children}</LojaAuthContext.Provider>;
}
