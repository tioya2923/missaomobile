import client from './client';

export interface CatecismoTopico {
  id: number;
  titulo: string;
  slug?: string;
}

export interface CatecismoTitulo {
  id: number;
  titulo: string;
}

export interface CatecismoTexto {
  id: number;
  titulo: string;
  texto: string;
}

export async function getCatecismoTopicos(idioma: 'pt' | 'ub'): Promise<CatecismoTopico[]> {
  // PT: [Route("api/[controller]/topicos")] + [HttpGet] → /api/CatecismoPtTopicos/topicos
  // UB: [Route("api/[controller]")]         + [HttpGet] → /api/CatecismoUbTopicos
  const endpoint = idioma === 'pt'
    ? '/api/CatecismoPtTopicos/topicos'
    : '/api/CatecismoUbTopicos';
  const { data } = await client.get<CatecismoTopico[]>(endpoint);
  return data;
}

export async function getCatecismoTitulos(idioma: 'pt' | 'ub', topicoId: number): Promise<CatecismoTitulo[]> {
  const endpoint = idioma === 'pt' ? '/api/catecismopt' : '/api/catecismoub';
  const { data } = await client.get<CatecismoTitulo[]>(endpoint, { params: { topicoId } });
  return data;
}

export async function getCatecismoTexto(idioma: 'pt' | 'ub', id: number): Promise<CatecismoTexto> {
  const endpoint = idioma === 'pt' ? `/api/catecismopt/${id}` : `/api/catecismoub/${id}`;
  const { data } = await client.get<CatecismoTexto>(endpoint);
  return data;
}
