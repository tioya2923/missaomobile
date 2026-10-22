import client from './client';
import { cachedFetch } from '../utils/cache';

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

/** Número de dias mostrados no calendário: hoje e os 7 seguintes. */
export const DIAS_MOSTRADOS = 8;

export async function getEventosJanela(inicio: Date, forcar = false): Promise<Evento[]> {
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + DIAS_MOSTRADOS - 1);
  return cachedFetch(`calendario:${fmt(inicio)}`, async () => {
    const { data } = await client.get<Evento[]>('/api/calendario', {
      params: { inicio: fmt(inicio), fim: fmt(fim) },
    });
    return data;
  }, forcar);
}
