import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { DARK, LIGHT, type Palette } from '../constants/theme';

export type Preferencia = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'ndatava:tema';

interface ThemeValue {
  colors: Palette;
  isDark: boolean;
  preferencia: Preferencia;
  setPreferencia: (p: Preferencia) => void;
  pronto: boolean;
}

const ThemeContext = createContext<ThemeValue>({
  colors: LIGHT,
  isDark: false,
  preferencia: 'sistema',
  setPreferencia: () => {},
  pronto: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPref] = useState<Preferencia>('sistema');
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE)
      .then(v => { if (v === 'claro' || v === 'escuro' || v === 'sistema') setPref(v); })
      .catch(() => {})
      .finally(() => setPronto(true));
  }, []);

  // Faz com que alertas, teclado e outros componentes nativos sigam a escolha.
  useEffect(() => {
    try {
      Appearance.setColorScheme?.(preferencia === 'sistema' ? null : preferencia === 'escuro' ? 'dark' : 'light');
    } catch { /* plataforma sem suporte */ }
  }, [preferencia]);

  const setPreferencia = useCallback((p: Preferencia) => {
    setPref(p);
    AsyncStorage.setItem(CHAVE, p).catch(() => {});
  }, []);

  const isDark = preferencia === 'sistema' ? sistema === 'dark' : preferencia === 'escuro';

  const value = useMemo<ThemeValue>(() => ({
    colors: isDark ? DARK : LIGHT,
    isDark,
    preferencia,
    setPreferencia,
    pronto,
  }), [isDark, preferencia, setPreferencia, pronto]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export const useColors = () => useContext(ThemeContext).colors;

/** Cria os estilos do ecrã para a paleta activa (recalcula só quando o tema muda). */
export function useThemedStyles<T>(create: (colors: Palette) => T): T {
  const colors = useColors();
  return useMemo(() => create(colors), [create, colors]);
}
