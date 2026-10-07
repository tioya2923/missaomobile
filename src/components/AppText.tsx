import { createContext, useContext } from 'react';
import { StyleSheet, Text as RNText, type TextProps } from 'react-native';
import { FONTS } from '../constants/theme';

type Base = 'Inter' | 'Fraunces';

// Texto aninhado herda a família do pai, tal como no React Native nativo.
const ParentFamily = createContext<Base | null>(null);

function weightSuffix(base: Base, weight: string | undefined): string {
  const w = weight === 'bold' ? 700 : weight === 'normal' || !weight ? 400 : Number(weight) || 400;
  if (base === 'Fraunces') {
    if (w >= 700) return '700Bold';
    if (w >= 500) return '600SemiBold';
    return '400Regular';
  }
  if (w >= 700) return '700Bold';
  if (w >= 600) return '600SemiBold';
  if (w >= 500) return '500Medium';
  return '400Regular';
}

function baseOf(family: string | undefined, parent: Base | null): Base | null {
  if (family === FONTS.display) return 'Fraunces';
  if (family === FONTS.sans) return 'Inter';
  if (family) return null; // família personalizada (ex.: monospace) — não mexer
  return parent ?? 'Inter';
}

/** Traduz (família, peso, itálico) para o nome do ficheiro de letra carregado; null = não alterar. */
export function fontFile(
  family: string | undefined,
  weight: string | undefined,
  italic: boolean,
  parent: Base | null,
): string | null {
  const base = baseOf(family, parent);
  if (!base) return null;
  // Só existem itálicos a 400; os restantes pesos usam esse.
  return `${base}_${italic ? '400Regular_Italic' : weightSuffix(base, weight)}`;
}

export default function AppText({ style, ...rest }: TextProps) {
  const parent = useContext(ParentFamily);
  const flat = StyleSheet.flatten(style) ?? {};
  const own = flat.fontFamily;

  const base = baseOf(own, parent);
  if (!base) return <RNText style={style} {...rest} />;

  // Texto aninhado sem tipografia própria herda peso e estilo do pai.
  if (parent && !own && !flat.fontWeight && !flat.fontStyle) return <RNText style={style} {...rest} />;

  const file = fontFile(own, flat.fontWeight as string | undefined, flat.fontStyle === 'italic', parent);

  return (
    <ParentFamily.Provider value={base}>
      {/* fontWeight/fontStyle ficam "normal" porque o próprio ficheiro já os contém */}
      <RNText style={[style, { fontFamily: file ?? undefined, fontWeight: 'normal', fontStyle: 'normal' }]} {...rest} />
    </ParentFamily.Provider>
  );
}
