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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function getEventosSemana(inicio: Date): Promise<Evento[]> {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const { data } = await client.get<Evento[]>('/api/calendario', {
    params: { inicio: fmt(inicio), fim: fmt(fim) },
  });
  return data;
}
