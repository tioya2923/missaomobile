import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Produto } from '../api/loja';

const STORAGE_KEY = '@ndatava_carrinho';

export interface ItemCarrinho {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  total: number;
  quantidadeTotal: number;
  adicionar: (produto: Produto, quantidade?: number) => void;
  atualizarQuantidade: (produtoId: number, quantidade: number) => void;
  removerItem: (produtoId: number) => void;
  limpar: () => void;
}

export const CarrinhoContext = createContext<CarrinhoContextType | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) { try { setItens(JSON.parse(raw)); } catch { /* ignora */ } }
      setCarregado(true);
    });
  }, []);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens, carregado]);

  const adicionar = useCallback((produto: Produto, quantidade = 1) => {
    setItens(atual => {
      const existente = atual.find(i => i.produtoId === produto.id);
      if (existente) {
        return atual.map(i => i.produtoId === produto.id
          ? { ...i, quantidade: i.quantidade + quantidade }
          : i);
      }
      return [...atual, { produtoId: produto.id, nome: produto.nome, preco: produto.preco, quantidade }];
    });
  }, []);

  const atualizarQuantidade = useCallback((produtoId: number, quantidade: number) => {
    setItens(atual => {
      if (quantidade <= 0) return atual.filter(i => i.produtoId !== produtoId);
      return atual.map(i => i.produtoId === produtoId ? { ...i, quantidade } : i);
    });
  }, []);

  const removerItem = useCallback((produtoId: number) => {
    setItens(atual => atual.filter(i => i.produtoId !== produtoId));
  }, []);

  const limpar = useCallback(() => setItens([]), []);

  const total = useMemo(() => itens.reduce((s, i) => s + i.preco * i.quantidade, 0), [itens]);
  const quantidadeTotal = useMemo(() => itens.reduce((s, i) => s + i.quantidade, 0), [itens]);

  return (
    <CarrinhoContext.Provider value={{ itens, total, quantidadeTotal, adicionar, atualizarQuantidade, removerItem, limpar }}>
      {children}
    </CarrinhoContext.Provider>
  );
}
