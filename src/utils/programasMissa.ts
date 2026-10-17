import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

// Os programas ficam guardados só neste telemóvel (nada é enviado para o servidor).
const CHAVE = '@ndatava_programas_missa';
const PASTA_AUDIO = (FileSystem.documentDirectory ?? '') + 'programas-audio/';

// Os nomes são os mesmos dos tópicos de cânticos, para sugerir logo os cânticos certos.
export const MOMENTOS = [
  'Procissão', 'Entrada', 'Kyrie', 'Glória', 'Entronização da Palavra', 'Aleluia',
  'Oração dos Fiéis', 'Ofertório', 'Elevação', 'Santo', 'Saudação',
  'Cordeiro de Deus', 'Comunhão', 'Acção de Graças', 'Saída',
] as const;

export type Momento = (typeof MOMENTOS)[number];

export type Escolha =
  | { id: string; tipo: 'app'; idioma: string; slug: string; titulo: string }
  | { id: string; tipo: 'proprio'; titulo: string; letra: string; audioUri?: string };

export interface Programa {
  id: string;
  titulo: string;
  celebracao: string;
  criadoEm: number;
  itens: Partial<Record<Momento, Escolha[]>>;
}

export function novoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function carregarProgramas(): Promise<Programa[]> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE);
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

export async function guardarProgramas(lista: Programa[]): Promise<void> {
  await AsyncStorage.setItem(CHAVE, JSON.stringify(lista));
}

/** Copia a gravação temporária para uma pasta permanente da app e devolve o novo caminho. */
export async function guardarAudio(uriTemporario: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(PASTA_AUDIO, { intermediates: true }).catch(() => {});
  const extensao = uriTemporario.split('.').pop()?.split('?')[0] || 'm4a';
  const destino = `${PASTA_AUDIO}${novoId()}.${extensao}`;
  await FileSystem.copyAsync({ from: uriTemporario, to: destino });
  return destino;
}

export async function apagarAudio(uri?: string): Promise<void> {
  if (!uri) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}

export function todasAsEscolhas(p: Programa): Escolha[] {
  return MOMENTOS.flatMap(m => p.itens[m] ?? []);
}

/** Texto simples do programa, para partilhar (WhatsApp, e-mail…). */
export function textoParaPartilhar(p: Programa): string {
  const linhas: string[] = [p.titulo];
  if (p.celebracao.trim()) linhas.push(p.celebracao.trim());
  linhas.push('');
  for (const m of MOMENTOS) {
    const escolhas = p.itens[m] ?? [];
    if (!escolhas.length) continue;
    linhas.push(`${m}:`);
    for (const e of escolhas) linhas.push(`  • ${e.titulo}${e.tipo === 'proprio' ? ' (letra própria)' : ''}`);
  }
  linhas.push('', 'Programa feito na app Ndatava.');
  return linhas.join('\n');
}
