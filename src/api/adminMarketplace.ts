import client from './client';
import type { FormaPagamento } from './loja';

// ── Lojas parceiras ──────────────────────────────────────────────────────

export interface LojaAdmin {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  morada?: string | null;
  categoria?: string | null;
  latitude: number;
  longitude: number;
  moeda: string;
  aprovada: boolean;
  ativa: boolean;
  formasPagamento: FormaPagamento[];
  dataRegisto: string;
}

export async function getLojasAdmin(): Promise<LojaAdmin[]> {
  const { data } = await client.get<LojaAdmin[]>('/api/lojas/admin');
  return data;
}

export async function moderarLoja(id: number, alteracoes: { aprovada: boolean; ativa: boolean }): Promise<void> {
  await client.put(`/api/lojas/${id}/moderar`, alteracoes);
}

export async function eliminarLoja(id: number): Promise<void> {
  await client.delete(`/api/lojas/${id}`);
}

// ── Todas as encomendas ──────────────────────────────────────────────────

export interface ItemEncomendaAdmin {
  produtoNome: string;
  precoUnitario: number;
  quantidade: number;
}

export interface EncomendaAdmin {
  id: number;
  data: string;
  nomeCliente: string;
  contacto: string;
  morada?: string | null;
  observacoes?: string | null;
  estado: string;
  lojaNome: string;
  total: number;
  moeda: string;
  itens: ItemEncomendaAdmin[];
}

export async function getEncomendasAdmin(): Promise<EncomendaAdmin[]> {
  const { data } = await client.get<EncomendaAdmin[]>('/api/encomendas');
  return data;
}

export async function atualizarEstadoEncomendaAdmin(id: number, estado: string): Promise<void> {
  await client.put(`/api/encomendas/${id}/estado`, { estado });
}

export async function eliminarEncomendaAdmin(id: number): Promise<void> {
  await client.delete(`/api/encomendas/${id}`);
}

// ── Vendas das lojas ─────────────────────────────────────────────────────

export interface VendaLoja {
  lojaId: number;
  lojaNome: string;
  numeroEncomendas: number;
  totalVendido: number;
  moeda: string;
}

export interface ResumoVendas {
  lojas: VendaLoja[];
}

export async function getResumoVendas(): Promise<ResumoVendas> {
  const { data } = await client.get<ResumoVendas>('/api/encomendas/comissoes');
  return data;
}

export interface RespostaLembrete {
  enviados: number;
  referenteA: string;
}

export async function enviarLembreteApoioAgora(): Promise<RespostaLembrete> {
  const { data } = await client.post<RespostaLembrete>('/api/lembretes/apoio/enviar-agora');
  return data;
}
