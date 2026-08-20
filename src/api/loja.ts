import client from './client';

export interface Produto {
  id: number;
  nome: string;
  descricao?: string | null;
  preco: number;
  imagemUrl?: string | null;
  categoria?: string | null;
  disponivel: boolean;
  ordem: number;
}

export async function getProdutos(): Promise<Produto[]> {
  const { data } = await client.get<Produto[]>('/api/produtos');
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

export interface EncomendaCriada {
  id: number;
  total: number;
  estado: string;
}

export async function criarEncomenda(pedido: NovaEncomenda): Promise<EncomendaCriada> {
  const { data } = await client.post<EncomendaCriada>('/api/encomendas', pedido);
  return data;
}
