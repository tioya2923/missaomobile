import client from './client';
import { cachedFetch } from '../utils/cache';

export interface Topico {
  id: number;
  nome: string;
  slug: string;
}

export interface CanticoResumo {
  id: number;
  titulo: string;
  slug: string;
}

export interface Cantico {
  id: number;
  titulo: string;
  slug: string;
  letra: string;
  autor?: string | null;
  pdfUrl?: string;
}

// Ordem litúrgica dos tópicos PT
const ORDEM_TOPICOS_PT = [
  'Procissão', 'Entrada', 'Kyrie', 'Entronização da Palavra', 'Aleluia',
  'Oração dos Fiéis', 'Ofertório', 'Elevação', 'Santo', 'Saudação',
  'Cordeiro de Deus', 'Comunhão', 'Acção de Graças', 'Saída',
];

type Idioma = 'pt' | 'ub' | 'lat' | 'kmb' | 'otc';

// O admin gere Cânticos de todos os idiomas através das mesmas tabelas
// genéricas do backend (/api/topicos, /api/canticos, ?idioma=<código>) —
// por isso a app tem de ler dali também, senão o que o admin edita/cria
// deixa de aparecer aqui. "ub" (código local) corresponde a "umb" no backend.
function codigoBackend(idioma: Idioma): string {
  return idioma === 'ub' ? 'umb' : idioma;
}

export async function getTopicos(idioma: Idioma): Promise<Topico[]> {
  return cachedFetch(`canticos:topicos:${idioma}`, async () => {
    const { data } = await client.get<Topico[]>('/api/topicos', { params: { idioma: codigoBackend(idioma) } });
    if (idioma === 'pt') {
      return ORDEM_TOPICOS_PT
        .map(nome => data.find(t => t.nome === nome))
        .filter((t): t is Topico => t !== undefined);
    }
    return data;
  });
}

export async function getCanticosPorTopico(idioma: Idioma, slug: string): Promise<CanticoResumo[]> {
  return cachedFetch(`canticos:por-topico:${idioma}:${slug}`, async () => {
    const { data } = await client.get<CanticoResumo[]>(`/api/canticos/topico/${encodeURIComponent(slug)}`, {
      params: { idioma: codigoBackend(idioma) },
    });
    return data.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'));
  });
}

export async function getCantico(idioma: Idioma, slug: string): Promise<Cantico> {
  return cachedFetch(`canticos:cantico:${idioma}:${slug}`, async () => {
    const { data } = await client.get<Cantico>(`/api/canticos/${encodeURIComponent(slug)}`, {
      params: { idioma: codigoBackend(idioma) },
    });
    return data;
  });
}
