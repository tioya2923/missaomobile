import client from './client';

export interface FormaApoio {
  id: number;
  label: string;
  valor: string;
  descricao?: string | null;
  ativo: boolean;
  ordem: number;
}

export async function getFormasApoio(): Promise<FormaApoio[]> {
  const { data } = await client.get<FormaApoio[]>('/api/formasapoio');
  return data;
}
