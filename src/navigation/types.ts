import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// --- Tab raiz ---
export type RootTabParamList = {
  Calendario: undefined;
  Canticos: undefined;
  Catecismo: undefined;
  Eu: undefined;
  Pesquisa: undefined;
  Mais: NavigatorScreenParams<MaisStackParamList> | undefined;
};

// --- Stack: Cânticos ---
export type CanticosStackParamList = {
  CanticosTopicos: undefined;
  CanticosLista: { idioma: string; topicoSlug: string; topicoNome: string };
  CanticoDetalhe: { idioma: string; slug: string; titulo: string };
};

// --- Stack: Catecismo ---
export type CatecismoStackParamList = {
  CatecismoTopicos: undefined;
  // Nível intermédio: subtópicos do Compêndio
  CatecismoSubTopicos: { idioma: string; topicoId: number; topicoTitulo: string };
  // Detalhe: todas as Q&A de um subtópico numa só página
  CatecismoSubTopicoDetalhe: { idioma: string; subTopicoId: number; subTopicoTitulo: string };
  // Orações / Latim / Otchikwama: lista de títulos → texto individual
  CatecismoTitulos: { idioma: string; topicoId: number; topicoTitulo: string };
  CatecismoTexto: { idioma: string; id: number; titulo: string };
};

// --- Stack: Mais ---
export type MaisStackParamList = {
  MaisMenu: undefined;
  Sobre: undefined;
  Privacidade: undefined;
  Contacto: undefined;
  Aparencia: undefined;
  Apoiar: undefined;
  Loja: undefined;
  LojaProduto: { produto: import('../api/loja').Produto };
  LojaDetalhe: { lojaId: number; lojaNome: string };
  LojaCarrinho: undefined;
  LojaConfirmacao: { encomendas: import('../api/loja').EncomendaCriada[] };
};

// Helpers de tipagem para props dos ecrãs
export type RootScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;

export type CanticosScreenProps<T extends keyof CanticosStackParamList> =
  NativeStackScreenProps<CanticosStackParamList, T>;

export type CatecismoScreenProps<T extends keyof CatecismoStackParamList> =
  NativeStackScreenProps<CatecismoStackParamList, T>;

export type MaisScreenProps<T extends keyof MaisStackParamList> =
  NativeStackScreenProps<MaisStackParamList, T>;
