import client from './client';

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
  pdfUrl?: string;
}

// Ordem litúrgica dos tópicos PT
const ORDEM_TOPICOS_PT = [
  'Procissão', 'Entrada', 'Kyrie', 'Entronização da Palavra', 'Aleluia',
  'Oração dos Fiéis', 'Ofertório', 'Elevação', 'Santo', 'Saudação',
  'Cordeiro de Deus', 'Comunhão', 'Acção de Graças', 'Saída',
];

function canticosPrefix(idioma: 'pt' | 'ub' | 'lat'): string {
  if (idioma === 'pt') return '/api/Canticos';
  if (idioma === 'lat') return '/api/CanticosLat';
  return '/api/umbundu/canticos';
}

export async function getTopicos(idioma: 'pt' | 'ub' | 'lat'): Promise<Topico[]> {
  let endpoint: string;
  if (idioma === 'pt') endpoint = '/api/Topicos';
  else if (idioma === 'lat') endpoint = '/api/TopicosLat';
  else endpoint = '/api/umbundu/topicos';

  const { data } = await client.get<Topico[]>(endpoint);
  if (idioma === 'pt') {
    return ORDEM_TOPICOS_PT
      .map(nome => data.find(t => t.nome === nome))
      .filter((t): t is Topico => t !== undefined);
  }
  return data;
}

export async function getCanticosPorTopico(idioma: 'pt' | 'ub' | 'lat', slug: string): Promise<CanticoResumo[]> {
  const prefix = canticosPrefix(idioma);
  const { data } = await client.get<CanticoResumo[]>(`${prefix}/topico/${encodeURIComponent(slug)}`);
  return data.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'));
}

export async function getCantico(idioma: 'pt' | 'ub' | 'lat', slug: string): Promise<Cantico> {
  const prefix = canticosPrefix(idioma);
  const { data } = await client.get<Cantico>(`${prefix}/${encodeURIComponent(slug)}`);
  return data;
}
