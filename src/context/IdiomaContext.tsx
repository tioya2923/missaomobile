import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { getIdiomas, IDIOMAS_BASE, type IdiomaInfo, type SecaoIdioma } from '../api/idiomas';

const CHAVE = 'ndatava:idioma';

interface IdiomaValue {
  /** Idiomas com conteúdo, por secção. */
  listas: Record<SecaoIdioma, IdiomaInfo[]>;
  /** Idioma que a pessoa escolheu por último (pode não existir numa das secções). */
  guardado: string;
  setCodigo: (codigo: string) => void;
}

const IdiomaContext = createContext<IdiomaValue>({
  listas: { canticos: IDIOMAS_BASE, catecismo: IDIOMAS_BASE },
  guardado: 'pt',
  setCodigo: () => {},
});

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [listas, setListas] = useState<Record<SecaoIdioma, IdiomaInfo[]>>({ canticos: IDIOMAS_BASE, catecismo: IDIOMAS_BASE });
  const [guardado, setGuardado] = useState('pt');

  useEffect(() => {
    AsyncStorage.getItem(CHAVE).then(v => { if (v) setGuardado(v); }).catch(() => {});
    // Uma lista vazia é uma resposta válida (ainda não há conteúdo nessa secção): não se substitui pela lista base.
    (['canticos', 'catecismo'] as const).forEach(secao => {
      getIdiomas(secao).then(lista => setListas(l => ({ ...l, [secao]: lista }))).catch(() => {});
    });
  }, []);

  const setCodigo = useCallback((c: string) => {
    setGuardado(c);
    AsyncStorage.setItem(CHAVE, c).catch(() => {});
  }, []);

  const value = useMemo(() => ({ listas, guardado, setCodigo }), [listas, guardado, setCodigo]);
  return <IdiomaContext.Provider value={value}>{children}</IdiomaContext.Provider>;
}

/**
 * Idiomas e idioma activo de uma secção. Só aparecem os idiomas que têm conteúdo nessa secção; se o idioma
 * escolhido não tem conteúdo nela (ou foi desactivado), usa o primeiro da lista.
 */
export function useIdioma(secao: SecaoIdioma = 'canticos') {
  const { listas, guardado, setCodigo } = useContext(IdiomaContext);
  const idiomas = listas[secao];
  const codigo = idiomas.some(i => i.codigo === guardado) ? guardado : idiomas[0]?.codigo ?? '';
  return { idiomas, codigo, setCodigo };
}
