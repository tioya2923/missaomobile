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

export type SecaoIdioma = 'canticos' | 'catecismo';

// Os idiomas vêm do backend: o que o admin cria ou desactiva aparece aqui sem nova versão da app.
// O servidor só devolve os que têm conteúdo na secção pedida (Cânticos ou Catecismo/Orações).
export async function getIdiomas(secao: SecaoIdioma): Promise<IdiomaInfo[]> {
  return cachedFetch(`idiomas:${secao}`, async () => {
    const { data } = await client.get<IdiomaApi[]>('/api/idiomas', { params: { secao } });
    return data
      .filter(i => i.ativo)
      .sort((a, b) => a.ordem - b.ordem)
      .map(i => ({ codigo: i.codigo, nome: i.nome }));
  });
}
