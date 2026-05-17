import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// --- Tab raiz ---
export type RootTabParamList = {
  Calendario: undefined;
  Canticos: undefined;
  Catecismo: undefined;
  Eu: undefined;
  Pesquisa: undefined;
  Mais: undefined;
};

// --- Stack: Cânticos ---
export type CanticosStackParamList = {
  CanticosIdioma: undefined;
  CanticosTopicos: { idioma: 'pt' | 'ub' | 'lat' };
  CanticosLista: { idioma: 'pt' | 'ub' | 'lat'; topicoSlug: string; topicoNome: string };
  CanticoDetalhe: { idioma: 'pt' | 'ub' | 'lat'; slug: string; titulo: string };
};

// --- Stack: Catecismo ---
export type CatecismoStackParamList = {
  CatecismoIdioma: undefined;
  CatecismoTopicos: { idioma: 'pt' | 'ub' | 'lat' };
  // Nível intermédio: subtópicos do Compêndio
  CatecismoSubTopicos: { idioma: 'pt' | 'ub' | 'lat'; topicoId: number; topicoTitulo: string };
  // Detalhe: todas as Q&A de um subtópico numa só página
  CatecismoSubTopicoDetalhe: { idioma: 'pt' | 'ub' | 'lat'; subTopicoId: number; subTopicoTitulo: string };
  // Orações / Latim: lista de títulos → texto individual
  CatecismoTitulos: { idioma: 'pt' | 'ub' | 'lat'; topicoId: number; topicoTitulo: string };
  CatecismoTexto: { idioma: 'pt' | 'ub' | 'lat'; id: number; titulo: string };
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
