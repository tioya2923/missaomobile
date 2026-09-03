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

// Otchikwama nunca teve tabelas/endpoints próprios de cânticos — usa a API
// genérica multi-idioma do backend (?idioma=otc) em vez de um prefixo fixo.
const IDIOMA_GENERICO = 'otc';

function canticosPrefix(idioma: Idioma): string {
  if (idioma === 'pt') return '/api/Canticos';
  if (idioma === 'lat') return '/api/CanticosLat';
  if (idioma === 'kmb') return '/api/kimbundu/canticos';
  if (idioma === 'otc') return '/api/canticos';
  return '/api/umbundu/canticos';
}

function paramsGenericos(idioma: Idioma) {
  return idioma === IDIOMA_GENERICO ? { idioma } : undefined;
}

export async function getTopicos(idioma: Idioma): Promise<Topico[]> {
  return cachedFetch(`canticos:topicos:${idioma}`, async () => {
    let endpoint: string;
    if (idioma === 'pt') endpoint = '/api/Topicos';
    else if (idioma === 'lat') endpoint = '/api/TopicosLat';
    else if (idioma === 'kmb') endpoint = '/api/kimbundu/topicos';
    else if (idioma === 'otc') endpoint = '/api/topicos';
    else endpoint = '/api/umbundu/topicos';

    const { data } = await client.get<Topico[]>(endpoint, { params: paramsGenericos(idioma) });
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
    const prefix = canticosPrefix(idioma);
    const { data } = await client.get<CanticoResumo[]>(`${prefix}/topico/${encodeURIComponent(slug)}`, {
      params: paramsGenericos(idioma),
    });
    return data.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'));
  });
}

export async function getCantico(idioma: Idioma, slug: string): Promise<Cantico> {
  return cachedFetch(`canticos:cantico:${idioma}:${slug}`, async () => {
    const prefix = canticosPrefix(idioma);
    const { data } = await client.get<Cantico>(`${prefix}/${encodeURIComponent(slug)}`, {
      params: paramsGenericos(idioma),
    });
    return data;
  });
}
