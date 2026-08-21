import client from './client';
import { API_BASE_URL } from '../constants/api';
import type { FormaPagamento } from './loja';

// ── Sessão ────────────────────────────────────────────────────────────────

export interface SessaoLoja {
  token: string;
  lojaId: number;
  nome: string;
  aprovada: boolean;
}

export async function loginLoja(email: string, password: string): Promise<SessaoLoja> {
  const { data } = await client.post<SessaoLoja>('/api/lojas/login', { email, password });
  return data;
}

export interface RegistoLojaPayload {
  nome: string;
  email: string;
  password: string;
  telefone?: string;
  morada?: string;
  categoria?: string;
  descricao?: string;
  moeda: string;
  latitude: number;
  longitude: number;
}

export async function registarLoja(payload: RegistoLojaPayload): Promise<SessaoLoja> {
  const { data } = await client.post<SessaoLoja>('/api/lojas/registar', payload);
  return data;
}

// ── Perfil da própria loja ───────────────────────────────────────────────

export interface PerfilLoja {
  id: number;
  nome: string;
  email: string;
  descricao?: string | null;
  telefone?: string | null;
  morada?: string | null;
  categoria?: string | null;
  infoPagamento?: string | null;
  formasPagamento: FormaPagamento[];
  latitude: number;
  longitude: number;
  moeda: string;
  aprovada: boolean;
  ativa: boolean;
}

export async function getPerfilProprio(): Promise<PerfilLoja> {
  const { data } = await client.get<PerfilLoja>('/api/lojas/eu');
  return data;
}

export interface AtualizarPerfilPayload {
  nome: string;
  descricao?: string | null;
  telefone?: string | null;
  morada?: string | null;
  categoria?: string | null;
  infoPagamento?: string | null;
  latitude: number;
  longitude: number;
  formasPagamento: FormaPagamento[];
  moeda: string;
}

export async function atualizarPerfilProprio(payload: AtualizarPerfilPayload): Promise<void> {
  await client.put('/api/lojas/eu', payload);
}

export async function pausarOuReativar(ativa: boolean): Promise<void> {
  await client.put('/api/lojas/eu/pausar', ativa);
}

// ── Produtos da própria loja ─────────────────────────────────────────────

export interface ProdutoLoja {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: number;
  precoPromocional?: number | null;
  emDestaque: boolean;
  categoria?: string | null;
  imagemUrl?: string | null;
  ordem: number;
  disponivel: boolean;
}

export type ProdutoLojaPayload = Omit<ProdutoLoja, 'id'>;

export async function getMeusProdutos(): Promise<ProdutoLoja[]> {
  const { data } = await client.get<ProdutoLoja[]>('/api/produtos/minha');
  return data;
}

export async function criarProduto(payload: ProdutoLojaPayload): Promise<ProdutoLoja> {
  const { data } = await client.post<ProdutoLoja>('/api/produtos', payload);
  return data;
}

export async function atualizarProduto(id: number, payload: ProdutoLojaPayload): Promise<void> {
  await client.put(`/api/produtos/${id}`, payload);
}

export async function eliminarProduto(id: number): Promise<void> {
  await client.delete(`/api/produtos/${id}`);
}

// Carrega uma imagem do dispositivo (em vez de indicar um URL externo) e devolve o
// URL absoluto já pronto a usar no campo imagemUrl do produto.
export async function uploadImagemProduto(uri: string): Promise<string> {
  const filename = uri.split('/').pop() ?? 'imagem.jpg';
  const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase();
  const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const form = new FormData();
  form.append('imagem', { uri, name: filename, type } as unknown as Blob);

  const { data } = await client.post<{ imagemUrl: string }>(
    '/api/produtos/imagem',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return `${API_BASE_URL}${data.imagemUrl}`;
}

// ── Encomendas da própria loja ───────────────────────────────────────────

export interface ItemEncomendaLoja {
  produtoNome: string;
  precoUnitario: number;
  quantidade: number;
}

export interface EncomendaLoja {
  id: number;
  data: string;
  nomeCliente: string;
  contacto: string;
  morada?: string | null;
  observacoes?: string | null;
  estado: string;
  total: number;
  moeda: string;
  itens: ItemEncomendaLoja[];
}

export async function getMinhasEncomendas(): Promise<EncomendaLoja[]> {
  const { data } = await client.get<EncomendaLoja[]>('/api/encomendas/minha-loja');
  return data;
}

export async function atualizarEstadoEncomenda(id: number, estado: string): Promise<void> {
  await client.put(`/api/encomendas/${id}/estado`, { estado });
}
