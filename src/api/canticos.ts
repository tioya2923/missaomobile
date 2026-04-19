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

export async function getTopicos(idioma: 'pt' | 'ub'): Promise<Topico[]> {
  const endpoint = idioma === 'pt' ? '/api/Topicos' : '/api/umbundu/topicos';
  const { data } = await client.get<Topico[]>(endpoint);
  if (idioma === 'pt') {
    return ORDEM_TOPICOS_PT
      .map(nome => data.find(t => t.nome === nome))
      .filter((t): t is Topico => t !== undefined);
  }
  return data;
}

export async function getCanticosPorTopico(idioma: 'pt' | 'ub', slug: string): Promise<CanticoResumo[]> {
  const prefix = idioma === 'pt' ? '/api/Canticos' : '/api/umbundu/canticos';
  const { data } = await client.get<CanticoResumo[]>(`${prefix}/topico/${encodeURIComponent(slug)}`);
  return data.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt'));
}

export async function getCantico(idioma: 'pt' | 'ub', slug: string): Promise<Cantico> {
  const prefix = idioma === 'pt' ? '/api/Canticos' : '/api/umbundu/canticos';
  const { data } = await client.get<Cantico>(`${prefix}/${encodeURIComponent(slug)}`);
  return data;
}
