import client from './client';
import { cachedFetch } from '../utils/cache';

export interface IdiomaInfo {
  codigo: string;
  nome: string;
}

interface IdiomaApi {
  codigo: string;
  nome: string;
  ordem: number;
  ativo: boolean;
}

// Usado só se a lista ainda não foi obtida e não há cópia guardada (primeiro arranque sem rede).
export const IDIOMAS_BASE: IdiomaInfo[] = [
  { codigo: 'pt',  nome: 'Português' },
  { codigo: 'umb', nome: 'Umbundu' },
  { codigo: 'lat', nome: 'Latim' },
  { codigo: 'kmb', nome: 'Kimbundu' },
  { codigo: 'otc', nome: 'Oshikwanhama' },
];

// Os idiomas vêm do backend: o que o admin cria ou desactiva aparece aqui sem nova versão da app.
export async function getIdiomas(): Promise<IdiomaInfo[]> {
  return cachedFetch('idiomas', async () => {
    const { data } = await client.get<IdiomaApi[]>('/api/idiomas');
    return data
      .filter(i => i.ativo)
      .sort((a, b) => a.ordem - b.ordem)
      .map(i => ({ codigo: i.codigo, nome: i.nome }));
  });
}
