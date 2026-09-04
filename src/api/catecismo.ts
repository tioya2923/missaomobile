import client from './client';
import { cachedFetch } from '../utils/cache';

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

type Idioma = 'pt' | 'ub' | 'lat' | 'otc';

// O admin gere Catecismo/Orações de todos os idiomas através das mesmas
// tabelas genéricas do backend (/api/catecismopttopicos, /api/catecismopt,
// ?idioma=<código>) — por isso a app tem de ler dali também, senão o que o
// admin edita/cria deixa de aparecer aqui. "ub" (código local) corresponde
// a "umb" no backend.
function codigoBackend(idioma: Idioma): string {
  return idioma === 'ub' ? 'umb' : idioma;
}

export async function getCatecismoTopicos(idioma: Idioma): Promise<CatecismoTopico[]> {
  return cachedFetch(`catecismo:topicos:${idioma}`, async () => {
    const { data } = await client.get<CatecismoTopico[]>('/api/CatecismoPtTopicos/topicos', {
      params: { idioma: codigoBackend(idioma) },
    });
    return data;
  });
}

export async function getCatecismoSubTopicos(topicoId: number): Promise<CatecismoTopico[]> {
  return cachedFetch(`catecismo:subtopicos:${topicoId}`, async () => {
    const { data } = await client.get<CatecismoTopico[]>(
      `/api/CatecismoPtTopicos/topicos/${topicoId}/subtopicos`
    );
    return data;
  });
}

export async function getCatecismoEntradas(idioma: Idioma, topicoId: number): Promise<CatecismoEntrada[]> {
  return cachedFetch(`catecismo:entradas:${idioma}:${topicoId}`, async () => {
    const { data } = await client.get<CatecismoEntrada[]>('/api/catecismopt', {
      params: { topicoId, idioma: codigoBackend(idioma) },
    });
    return data;
  });
}

export async function getCatecismoTitulos(idioma: Idioma, topicoId: number): Promise<CatecismoTitulo[]> {
  return cachedFetch(`catecismo:titulos:${idioma}:${topicoId}`, async () => {
    const { data } = await client.get<CatecismoTitulo[]>('/api/catecismopt', {
      params: { topicoId, idioma: codigoBackend(idioma) },
    });
    return data;
  });
}

export async function getCatecismoTexto(idioma: Idioma, id: number): Promise<CatecismoTexto> {
  return cachedFetch(`catecismo:texto:${idioma}:${id}`, async () => {
    const { data } = await client.get<CatecismoTexto>(`/api/catecismopt/${id}`);
    return data;
  });
}
