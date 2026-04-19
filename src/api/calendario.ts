import client from './client';

export interface Evento {
  id: number;
  titulo: string;
  data: string;
  descricao: string;
  leituras: string;
  observacoes: string;
}

function fmt(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getEventosSemana(inicio: Date): Promise<Evento[]> {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const { data } = await client.get<Evento[]>('/api/calendario', {
    params: { inicio: fmt(inicio), fim: fmt(fim) },
  });
  return data;
}
