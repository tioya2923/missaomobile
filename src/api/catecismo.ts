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

// Entrada completa (título + texto) — usada no detalhe de subtópico
export interface CatecismoEntrada {
  id: number;
  titulo: string;
  texto: string;
}

export interface CatecismoTexto {
  id: number;
  titulo: string;
  texto: string;
}

export async function getCatecismoTopicos(idioma: 'pt' | 'ub'): Promise<CatecismoTopico[]> {
  const endpoint = idioma === 'pt'
    ? '/api/CatecismoPtTopicos/topicos'
    : '/api/CatecismoUbTopicos';
  const { data } = await client.get<CatecismoTopico[]>(endpoint);
  return data;
}

export async function getCatecismoSubTopicos(topicoId: number): Promise<CatecismoTopico[]> {
  const { data } = await client.get<CatecismoTopico[]>(
    `/api/CatecismoPtTopicos/topicos/${topicoId}/subtopicos`
  );
  return data;
}

export async function getCatecismoEntradas(idioma: 'pt' | 'ub', topicoId: number): Promise<CatecismoEntrada[]> {
  const endpoint = idioma === 'pt' ? '/api/catecismopt' : '/api/catecismoub';
  const { data } = await client.get<CatecismoEntrada[]>(endpoint, { params: { topicoId } });
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
