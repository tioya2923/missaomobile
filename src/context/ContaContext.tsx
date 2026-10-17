import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CONTA_TOKEN_KEY, definirAoExpirarConta, eliminarContaNoServidor, entrarConta, listarRecebidas,
  obterMeuCodigo, registarConta, type SessaoConta,
} from '../api/conta';

const DADOS_KEY = '@ndatava_conta_dados';

interface ContaValue {
  carregado: boolean;
  autenticado: boolean;
  nome: string | null;
  email: string | null;
  codigo: string | null;
  naoLidas: number;
  entrar: (email: string, password: string) => Promise<void>;
  registar: (nome: string, email: string, password: string) => Promise<void>;
  sair: () => Promise<void>;
  eliminar: () => Promise<void>;
  atualizarNaoLidas: () => Promise<void>;
}

const ContaContext = createContext<ContaValue | null>(null);

export function ContaProvider({ children }: { children: ReactNode }) {
  const [carregado, setCarregado] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [naoLidas, setNaoLidas] = useState(0);

  const limpar = useCallback(async () => {
    await AsyncStorage.multiRemove([CONTA_TOKEN_KEY, DADOS_KEY]);
    setToken(null); setNome(null); setEmail(null); setCodigo(null); setNaoLidas(0);
  }, []);

  const guardar = useCallback(async (s: SessaoConta) => {
    await AsyncStorage.multiSet([[CONTA_TOKEN_KEY, s.token], [DADOS_KEY, JSON.stringify({ nome: s.nome, email: s.email })]]);
    setToken(s.token); setNome(s.nome); setEmail(s.email);
    obterMeuCodigo().then(r => setCodigo(r.codigo)).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.multiGet([CONTA_TOKEN_KEY, DADOS_KEY]).then(([[, t], [, d]]) => {
      if (t) {
        setToken(t);
        try { const o = d ? JSON.parse(d) : {}; setNome(o.nome ?? null); setEmail(o.email ?? null); } catch { /* ignorar */ }
        obterMeuCodigo().then(r => setCodigo(r.codigo)).catch(() => {});
      }
    }).catch(() => {}).finally(() => setCarregado(true));
  }, []);

  // Sessão expirada no servidor: volta ao ecrã de entrada em vez de mostrar erros genéricos.
  useEffect(() => {
    definirAoExpirarConta(() => { limpar(); });
    return () => definirAoExpirarConta(null);
  }, [limpar]);

  const entrar = useCallback(async (e: string, p: string) => { await guardar(await entrarConta(e.trim(), p)); }, [guardar]);
  const registar = useCallback(async (n: string, e: string, p: string) => { await guardar(await registarConta(n.trim(), e.trim(), p)); }, [guardar]);
  const sair = limpar;
  const eliminar = useCallback(async () => { await eliminarContaNoServidor(); await limpar(); }, [limpar]);

  const atualizarNaoLidas = useCallback(async () => {
    if (!token) { setNaoLidas(0); return; }
    try { setNaoLidas((await listarRecebidas()).filter(r => !r.lido).length); } catch { /* sem ligação: mantém */ }
  }, [token]);

  const value = useMemo<ContaValue>(() => ({
    carregado, autenticado: !!token, nome, email, codigo, naoLidas,
    entrar, registar, sair, eliminar, atualizarNaoLidas,
  }), [carregado, token, nome, email, codigo, naoLidas, entrar, registar, sair, eliminar, atualizarNaoLidas]);

  return <ContaContext.Provider value={value}>{children}</ContaContext.Provider>;
}

export function useConta(): ContaValue {
  const ctx = useContext(ContaContext);
  if (!ctx) throw new Error('useConta fora do ContaProvider');
  return ctx;
}
