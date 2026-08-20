import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProdutos, type Produto } from '../../api/loja';
import { useCarrinho } from '../../context/useCarrinho';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

export default function LojaScreen({ navigation }: MaisScreenProps<'Loja'>) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { quantidadeTotal } = useCarrinho();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProdutos(await getProdutos());
    } catch {
      setError('Não foi possível carregar a loja.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <TouchableOpacity
        style={styles.carrinhoBtn}
        onPress={() => navigation.navigate('LojaCarrinho')}
        activeOpacity={0.8}
      >
        <Ionicons name="cart-outline" size={18} color="#fff" />
        <Text style={styles.carrinhoTxt}>Carrinho{quantidadeTotal > 0 ? ` (${quantidadeTotal})` : ''}</Text>
      </TouchableOpacity>

      {produtos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>A loja estará disponível em breve.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {produtos.map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LojaProduto', { produto: p })}
            >
              {p.imagemUrl ? (
                <Image source={{ uri: p.imagemUrl }} style={styles.imagem} />
              ) : (
                <View style={[styles.imagem, styles.imagemPlaceholder]}>
                  <Ionicons name="image-outline" size={28} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={styles.info}>
                {p.categoria ? <Text style={styles.categoria}>{p.categoria}</Text> : null}
                <Text style={styles.nome} numberOfLines={2}>{p.nome}</Text>
                <Text style={styles.preco}>{p.preco.toFixed(2)} Kz</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const CARD_W = '48%';

const styles = StyleSheet.create({
  carrinhoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.navbar, margin: 16, marginBottom: 4,
    borderRadius: 10, paddingVertical: 12,
  },
  carrinhoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    padding: 16, gap: 12,
  },
  card: {
    width: CARD_W, backgroundColor: COLORS.surface, borderRadius: 10, overflow: 'hidden',
    marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  imagem: { width: '100%', height: 120, backgroundColor: COLORS.border },
  imagemPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  info: { padding: 10, gap: 3 },
  categoria: {
    fontSize: 10.5, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  nome: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif, minHeight: 34 },
  preco: { fontSize: 15, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 2 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: {
    color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic',
    fontSize: 16, textAlign: 'center',
  },
});
