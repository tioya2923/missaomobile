import client from './client';

export interface LojaResumo {
  id: number;
  nome: string;
  morada?: string | null;
  latitude: number;
  longitude: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: number;
  precoPromocional?: number | null;
  emDestaque: boolean;
  imagemUrl?: string | null;
  categoria?: string | null;
  disponivel: boolean;
  ordem: number;
  loja: LojaResumo;
  distanciaKm?: number | null;
}

export interface FormaPagamento {
  metodo: string;
  detalhe?: string | null;
}

export interface Loja {
  id: number;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  morada?: string | null;
  telefone?: string | null;
  latitude: number;
  longitude: number;
  distanciaKm?: number | null;
  formasPagamento?: FormaPagamento[];
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

// GET /api/produtos?q=&lat=&lng() — artigos de todas as lojas aprovadas, opcionalmente
// filtrados por nome e ordenados pela distância até à posição do comprador.
export async function getProdutos(params?: { q?: string; coords?: Coordenadas | null }): Promise<Produto[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.coords) {
    query.set('lat', String(params.coords.lat));
    query.set('lng', String(params.coords.lng));
  }
  const qs = query.toString();
  const { data } = await client.get<Produto[]>(`/api/produtos${qs ? `?${qs}` : ''}`);
  return data;
}

// GET /api/lojas?lat=&lng= — lojas parceiras aprovadas, ordenadas pela distância.
export async function getLojas(coords?: Coordenadas | null): Promise<Loja[]> {
  const query = new URLSearchParams();
  if (coords) {
    query.set('lat', String(coords.lat));
    query.set('lng', String(coords.lng));
  }
  const qs = query.toString();
  const { data } = await client.get<Loja[]>(`/api/lojas${qs ? `?${qs}` : ''}`);
  return data;
}

export async function getLoja(id: number, coords?: Coordenadas | null): Promise<Loja> {
  const query = new URLSearchParams();
  if (coords) {
    query.set('lat', String(coords.lat));
    query.set('lng', String(coords.lng));
  }
  const qs = query.toString();
  const { data } = await client.get<Loja>(`/api/lojas/${id}${qs ? `?${qs}` : ''}`);
  return data;
}

// GET /api/produtos/loja/{lojaId} — catálogo completo de uma loja
export async function getProdutosPorLoja(lojaId: number): Promise<Omit<Produto, 'loja' | 'distanciaKm'>[]> {
  const { data } = await client.get(`/api/produtos/loja/${lojaId}`);
  return data;
}

export interface ItemPedido {
  produtoId: number;
  quantidade: number;
}

export interface NovaEncomenda {
  nomeCliente: string;
  contacto: string;
  morada?: string;
  observacoes?: string;
  itens: ItemPedido[];
}

export interface ItemEncomendaResposta {
  produtoNome: string;
  precoUnitario: number;
  quantidade: number;
}

// Uma encomenda por loja — o carrinho pode ter artigos de várias lojas, mas ao
// finalizar o servidor divide-o automaticamente, uma encomenda por cada loja,
// todas ligadas pelo mesmo grupoId.
export interface EncomendaCriada {
  id: number;
  grupoId: string;
  lojaId: number;
  lojaNome: string;
  lojaTelefone?: string | null;
  infoPagamento?: string | null;
  formasPagamento: FormaPagamento[];
  total: number;
  estado: string;
  itens: ItemEncomendaResposta[];
}

export async function criarEncomenda(pedido: NovaEncomenda): Promise<EncomendaCriada[]> {
  const { data } = await client.post<EncomendaCriada[]>('/api/encomendas', pedido);
  return data;
}
