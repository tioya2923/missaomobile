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

export async function getCatecismoTopicos(idioma: 'pt' | 'ub' | 'lat'): Promise<CatecismoTopico[]> {
  let endpoint: string;
  if (idioma === 'pt') endpoint = '/api/CatecismoPtTopicos/topicos';
  else if (idioma === 'lat') endpoint = '/api/CatecismoLatTopicos';
  else endpoint = '/api/CatecismoUbTopicos';
  const { data } = await client.get<CatecismoTopico[]>(endpoint);
  return data;
}

export async function getCatecismoSubTopicos(topicoId: number): Promise<CatecismoTopico[]> {
  const { data } = await client.get<CatecismoTopico[]>(
    `/api/CatecismoPtTopicos/topicos/${topicoId}/subtopicos`
  );
  return data;
}

export async function getCatecismoEntradas(idioma: 'pt' | 'ub' | 'lat', topicoId: number): Promise<CatecismoEntrada[]> {
  let endpoint: string;
  if (idioma === 'pt') endpoint = '/api/catecismopt';
  else if (idioma === 'lat') endpoint = '/api/CatecismoLat';
  else endpoint = '/api/catecismoub';
  const { data } = await client.get<CatecismoEntrada[]>(endpoint, { params: { topicoId } });
  return data;
}

export async function getCatecismoTitulos(idioma: 'pt' | 'ub' | 'lat', topicoId: number): Promise<CatecismoTitulo[]> {
  let endpoint: string;
  if (idioma === 'pt') endpoint = '/api/catecismopt';
  else if (idioma === 'lat') endpoint = '/api/CatecismoLat';
  else endpoint = '/api/catecismoub';
  const { data } = await client.get<CatecismoTitulo[]>(endpoint, { params: { topicoId } });
  return data;
}

export async function getCatecismoTexto(idioma: 'pt' | 'ub' | 'lat', id: number): Promise<CatecismoTexto> {
  let endpoint: string;
  if (idioma === 'pt') endpoint = `/api/catecismopt/${id}`;
  else if (idioma === 'lat') endpoint = `/api/CatecismoLat/${id}`;
  else endpoint = `/api/catecismoub/${id}`;
  const { data } = await client.get<CatecismoTexto>(endpoint);
  return data;
}
