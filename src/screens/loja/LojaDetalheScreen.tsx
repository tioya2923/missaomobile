import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLoja, getProdutosPorLoja, type Loja, type Produto } from '../../api/loja';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import { labelMetodoPagamento, iconeMetodoPagamento } from '../../constants/metodosPagamento';
import CarrinhoFixo from '../../components/loja/CarrinhoFixo';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

export default function LojaDetalheScreen({ route, navigation }: MaisScreenProps<'LojaDetalhe'>) {
  const { lojaId, lojaNome } = route.params;
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Omit<Produto, 'loja' | 'distanciaKm'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { coords } = useLocalizacao();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dadosLoja, dadosProdutos] = await Promise.all([
        getLoja(lojaId, coords),
        getProdutosPorLoja(lojaId),
      ]);
      setLoja(dadosLoja);
      setProdutos(dadosProdutos);
    } catch {
      setError('Não foi possível carregar esta loja.');
    } finally {
      setLoading(false);
    }
  }, [lojaId, coords]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  const abrirProduto = (produtoResumido: Omit<Produto, 'loja' | 'distanciaKm'>) => {
    if (!loja) return;
    const produto: Produto = {
      ...produtoResumido,
      loja: { id: loja.id, nome: loja.nome, morada: loja.morada, latitude: loja.latitude, longitude: loja.longitude },
      distanciaKm: loja.distanciaKm,
    };
    navigation.navigate('LojaProduto', { produto });
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.cabecalho}>
        <Text style={styles.nome}>{loja?.nome ?? lojaNome}</Text>
        {loja?.categoria ? <Text style={styles.categoria}>{loja.categoria}</Text> : null}
        {loja?.descricao ? <Text style={styles.descricao}>{loja.descricao}</Text> : null}
        <View style={styles.linhaInfo}>
          {loja?.morada ? (
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoTxt}>{loja.morada}</Text>
            </View>
          ) : null}
          {loja?.distanciaKm != null ? (
            <View style={styles.infoItem}>
              <Ionicons name="navigate-outline" size={14} color={COLORS.primary} />
              <Text style={[styles.infoTxt, { color: COLORS.primary, fontWeight: '700' }]}>{loja.distanciaKm.toFixed(1)} km</Text>
            </View>
          ) : null}
          {loja?.telefone ? (
            <TouchableOpacity style={styles.infoItem} onPress={() => Linking.openURL(`tel:${loja.telefone}`)}>
              <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoTxt}>{loja.telefone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {loja?.formasPagamento && loja.formasPagamento.length > 0 && (
          <View style={styles.pagamentoRow}>
            {loja.formasPagamento.map((f) => (
              <View key={f.metodo} style={styles.pagamentoChip}>
                <Ionicons name={iconeMetodoPagamento(f.metodo) as never} size={12} color={COLORS.primary} />
                <Text style={styles.pagamentoChipTxt}>{labelMetodoPagamento(f.metodo)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {produtos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Esta loja ainda não tem artigos disponíveis.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {produtos.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => abrirProduto(p)}
            >
              {p.emDestaque && (
                <View style={styles.destaqueBadge}>
                  <Ionicons name="star" size={11} color="#fff" />
                </View>
              )}
              {p.imagemUrl ? (
                <Image source={{ uri: p.imagemUrl }} style={styles.imagem} />
              ) : (
                <View style={[styles.imagem, styles.imagemPlaceholder]}>
                  <Ionicons name="image-outline" size={28} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={styles.info}>
                {p.categoria ? <Text style={styles.produtoCategoria}>{p.categoria}</Text> : null}
                <Text style={styles.produtoNome} numberOfLines={2}>{p.nome}</Text>
                {p.precoPromocional != null ? (
                  <View style={styles.precoPromoRow}>
                    <Text style={styles.precoRiscado}>{p.preco.toFixed(2)} Kz</Text>
                    <Text style={styles.precoPromo}>{p.precoPromocional.toFixed(2)} Kz</Text>
                  </View>
                ) : (
                  <Text style={styles.preco}>{p.preco.toFixed(2)} Kz</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <CarrinhoFixo onPress={() => navigation.navigate('LojaCarrinho')} />
    </View>
  );
}

const CARD_W = '48%';

const styles = StyleSheet.create({
  cabecalho: {
    backgroundColor: COLORS.surface, margin: 16, marginTop: 12, padding: 16, borderRadius: 10, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  nome: { fontSize: 19, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  categoria: { fontSize: 11.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.4 },
  descricao: { fontSize: 13.5, color: COLORS.text, fontFamily: FONTS.serif, lineHeight: 20, marginTop: 4 },
  linhaInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pagamentoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  pagamentoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: `${COLORS.primary}12`, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8,
  },
  pagamentoChipTxt: { fontSize: 11, color: COLORS.primary, fontWeight: '600', fontFamily: FONTS.serif },
  infoTxt: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: FONTS.serif },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    padding: 16, paddingTop: 4, paddingBottom: 90, gap: 12,
  },
  card: {
    width: CARD_W, backgroundColor: COLORS.surface, borderRadius: 10, overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  destaqueBadge: {
    position: 'absolute', top: 8, right: 8, zIndex: 1,
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#c0392b',
    alignItems: 'center', justifyContent: 'center',
  },
  imagem: { width: '100%', height: 120, backgroundColor: COLORS.border },
  imagemPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10, gap: 3 },
  produtoCategoria: {
    fontSize: 10.5, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  produtoNome: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif, minHeight: 34 },
  preco: { fontSize: 15, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 2 },
  precoPromoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  precoRiscado: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif, textDecorationLine: 'line-through' },
  precoPromo: { fontSize: 15, fontWeight: '700', color: '#c0392b', fontFamily: FONTS.serif },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: {
    color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic',
    fontSize: 16, textAlign: 'center',
  },
});
