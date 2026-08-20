import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Produto } from '../api/loja';

// v2: os artigos passaram a ter uma loja associada (marketplace multi-loja)
const STORAGE_KEY = '@ndatava_carrinho_v2';

export interface ItemCarrinho {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
  lojaId: number;
  lojaNome: string;
}

export interface GrupoCarrinho {
  lojaId: number;
  lojaNome: string;
  itens: ItemCarrinho[];
  subtotal: number;
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  grupos: GrupoCarrinho[];
  total: number;
  quantidadeTotal: number;
  adicionar: (produto: Produto, quantidade?: number) => void;
  atualizarQuantidade: (produtoId: number, quantidade: number) => void;
  removerItem: (produtoId: number) => void;
  limpar: () => void;
}

export const CarrinhoContext = createContext<CarrinhoContextType | null>(null);

function itemValido(i: unknown): i is ItemCarrinho {
  return !!i && typeof i === 'object'
    && typeof (i as ItemCarrinho).produtoId === 'number'
    && typeof (i as ItemCarrinho).lojaId === 'number';
}

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const dados = JSON.parse(raw);
          if (Array.isArray(dados)) setItens(dados.filter(itemValido));
        } catch { /* ignora */ }
      }
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
      return [...atual, {
        produtoId: produto.id,
        nome: produto.nome,
        preco: produto.precoPromocional ?? produto.preco,
        quantidade,
        lojaId: produto.loja.id,
        lojaNome: produto.loja.nome,
      }];
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

  const grupos = useMemo<GrupoCarrinho[]>(() => {
    const mapa = new Map<number, GrupoCarrinho>();
    for (const item of itens) {
      let grupo = mapa.get(item.lojaId);
      if (!grupo) {
        grupo = { lojaId: item.lojaId, lojaNome: item.lojaNome, itens: [], subtotal: 0 };
        mapa.set(item.lojaId, grupo);
      }
      grupo.itens.push(item);
      grupo.subtotal += item.preco * item.quantidade;
    }
    return Array.from(mapa.values());
  }, [itens]);

  return (
    <CarrinhoContext.Provider value={{ itens, grupos, total, quantidadeTotal, adicionar, atualizarQuantidade, removerItem, limpar }}>
      {children}
    </CarrinhoContext.Provider>
  );
}
