import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// --- Tab raiz ---
export type RootTabParamList = {
  Calendario: undefined;
  Canticos: undefined;
  Catecismo: undefined;
  Pesquisa: undefined;
  Mais: undefined;
};

// --- Stack: Cânticos ---
export type CanticosStackParamList = {
  CanticosIdioma: undefined;
  CanticosTopicos: { idioma: 'pt' | 'ub' };
  CanticosLista: { idioma: 'pt' | 'ub'; topicoSlug: string; topicoNome: string };
  CanticoDetalhe: { idioma: 'pt' | 'ub'; slug: string; titulo: string };
};

// --- Stack: Catecismo ---
export type CatecismoStackParamList = {
  CatecismoIdioma: undefined;
  CatecismoTopicos: { idioma: 'pt' | 'ub' };
  CatecismoTitulos: { idioma: 'pt' | 'ub'; topicoId: number; topicoTitulo: string };
  CatecismoTexto: { idioma: 'pt' | 'ub'; id: number; titulo: string };
};

// --- Stack: Mais ---
export type MaisStackParamList = {
  MaisMenu: undefined;
  Sobre: undefined;
  Contacto: undefined;
};

// Helpers de tipagem para props dos ecrãs
export type CanticosScreenProps<T extends keyof CanticosStackParamList> =
  NativeStackScreenProps<CanticosStackParamList, T>;

export type CatecismoScreenProps<T extends keyof CatecismoStackParamList> =
  NativeStackScreenProps<CatecismoStackParamList, T>;

export type MaisScreenProps<T extends keyof MaisStackParamList> =
  NativeStackScreenProps<MaisStackParamList, T>;
