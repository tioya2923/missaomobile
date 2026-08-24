import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Produto } from '../api/loja';

// v3: os artigos passaram a ter uma moeda associada (cada loja vende na sua própria)
const STORAGE_KEY = '@ndatava_carrinho_v3';

export interface ItemCarrinho {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
  lojaId: number;
  lojaNome: string;
  moeda: string;
}

export interface GrupoCarrinho {
  lojaId: number;
  lojaNome: string;
  moeda: string;
  itens: ItemCarrinho[];
  subtotal: number;
}

// O carrinho pode ter artigos de lojas em moedas diferentes (ex.: uma loja em Angola
// e outra em Portugal) — por isso não existe um "total" único, mas sim um total por
// cada moeda presente no carrinho.
export interface TotalPorMoeda {
  moeda: string;
  total: number;
}

interface CarrinhoContextType {
  itens: ItemCarrinho[];
  grupos: GrupoCarrinho[];
  totaisPorMoeda: TotalPorMoeda[];
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
    && typeof (i as ItemCarrinho).lojaId === 'number'
    && typeof (i as ItemCarrinho).moeda === 'string';
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
    }).catch(() => {
      // Falha a ler o carrinho guardado — continua com o carrinho vazio em
      // vez de nunca marcar como carregado (o que impediria futuras gravações).
      setCarregado(true);
    });
  }, []);

  useEffect(() => {
    if (carregado) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens, carregado]);

  const adicionar = useCallback((produto: Produto, quantidade = 1) => {
    const precoAtual = produto.precoPromocional ?? produto.preco;
    setItens(atual => {
      const existente = atual.find(i => i.produtoId === produto.id);
      if (existente) {
        // Atualiza também o preço (e nome/moeda, caso a loja os tenha mudado
        // entretanto) — sem isto, um artigo já no carrinho ficava "congelado"
        // no preço de quando foi adicionado, mesmo que já não fosse o atual.
        // O total real cobrado já vinha sempre certo (o backend repriça no
        // momento da encomenda); isto corrige o que era mostrado ao comprador.
        return atual.map(i => i.produtoId === produto.id
          ? { ...i, quantidade: i.quantidade + quantidade, preco: precoAtual, nome: produto.nome, moeda: produto.loja.moeda }
          : i);
      }
      return [...atual, {
        produtoId: produto.id,
        nome: produto.nome,
        preco: precoAtual,
        quantidade,
        lojaId: produto.loja.id,
        lojaNome: produto.loja.nome,
        moeda: produto.loja.moeda,
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

  const quantidadeTotal = useMemo(() => itens.reduce((s, i) => s + i.quantidade, 0), [itens]);

  const grupos = useMemo<GrupoCarrinho[]>(() => {
    const mapa = new Map<number, GrupoCarrinho>();
    for (const item of itens) {
      let grupo = mapa.get(item.lojaId);
      if (!grupo) {
        grupo = { lojaId: item.lojaId, lojaNome: item.lojaNome, moeda: item.moeda, itens: [], subtotal: 0 };
        mapa.set(item.lojaId, grupo);
      }
      grupo.itens.push(item);
      grupo.subtotal += item.preco * item.quantidade;
    }
    return Array.from(mapa.values());
  }, [itens]);

  const totaisPorMoeda = useMemo<TotalPorMoeda[]>(() => {
    const mapa = new Map<string, number>();
    for (const grupo of grupos) {
      mapa.set(grupo.moeda, (mapa.get(grupo.moeda) ?? 0) + grupo.subtotal);
    }
    return Array.from(mapa.entries()).map(([moeda, total]) => ({ moeda, total }));
  }, [grupos]);

  return (
    <CarrinhoContext.Provider value={{
      itens, grupos, totaisPorMoeda, quantidadeTotal,
      adicionar, atualizarQuantidade, removerItem, limpar,
    }}>
      {children}
    </CarrinhoContext.Provider>
  );
}
