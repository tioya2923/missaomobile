import client from './client';

export interface SearchResults {
  canticos:     Array<{ id: number; titulo: string; slug: string }>;
  canticosUmb:  Array<{ id: number; titulo: string; slug: string }>;
  topicos:      Array<{ id: number; nome: string;   slug: string }>;
  topicosUmb:   Array<{ id: number; nome: string;   slug: string }>;
  catecismosPt: Array<{ id: number; titulo: string; slug: string }>;
  catecismosUb: Array<{ id: number; titulo: string }>;
  eventos:      Array<{ id: number; titulo: string; data: string }>;
}

export async function search(query: string): Promise<SearchResults> {
  const { data } = await client.get<SearchResults>('/api/search', { params: { q: query } });
  return data;
}
