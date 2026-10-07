import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { getIdiomas, IDIOMAS_BASE, type IdiomaInfo } from '../api/idiomas';

const CHAVE = 'ndatava:idioma';

interface IdiomaValue {
  idiomas: IdiomaInfo[];
  /** Código do idioma escolhido (o mesmo usado nos pedidos à API). */
  codigo: string;
  setCodigo: (codigo: string) => void;
}

const IdiomaContext = createContext<IdiomaValue>({
  idiomas: IDIOMAS_BASE,
  codigo: 'pt',
  setCodigo: () => {},
});

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idiomas, setIdiomas] = useState<IdiomaInfo[]>(IDIOMAS_BASE);
  const [guardado, setGuardado] = useState('pt');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE).then(v => { if (v) setGuardado(v); }).catch(() => {});
    getIdiomas().then(lista => { if (lista.length) setIdiomas(lista); }).catch(() => {});
  }, []);

  const setCodigo = useCallback((c: string) => {
    setGuardado(c);
    AsyncStorage.setItem(CHAVE, c).catch(() => {});
  }, []);

  // Se o idioma guardado já não existe (ex.: desactivado no admin), volta ao primeiro da lista.
  const codigo = idiomas.some(i => i.codigo === guardado) ? guardado : idiomas[0]?.codigo ?? 'pt';

  const value = useMemo(() => ({ idiomas, codigo, setCodigo }), [idiomas, codigo, setCodigo]);
  return <IdiomaContext.Provider value={value}>{children}</IdiomaContext.Provider>;
}

export const useIdioma = () => useContext(IdiomaContext);
