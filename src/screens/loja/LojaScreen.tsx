import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLojas, getProdutos, type Loja, type Produto } from '../../api/loja';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import { formatarPreco } from '../../constants/moeda';
import CarrinhoFixo from '../../components/loja/CarrinhoFixo';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

type Aba = 'artigos' | 'lojas';

export default function LojaScreen({ navigation }: MaisScreenProps<'Loja'>) {
  const [aba, setAba] = useState<Aba>('artigos');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [pesquisa, setPesquisa] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { coords, estado, pedir } = useLocalizacao();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dadosProdutos, dadosLojas] = await Promise.all([
        getProdutos({ q: pesquisa.trim() || undefined, coords }),
        getLojas(coords),
      ]);
      setProdutos(dadosProdutos);
      setLojas(dadosLojas);
    } catch {
      setError('Não foi possível carregar a loja.');
    } finally {
      setLoading(false);
    }
  }, [pesquisa, coords]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.buscaRow}>
        <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
        <TextInput
          style={styles.buscaInput}
          value={pesquisa}
          onChangeText={setPesquisa}
          placeholder="Pesquisar artigos…"
          placeholderTextColor={COLORS.textSecondary}
          returnKeyType="search"
        />
        {pesquisa.length > 0 && (
          <TouchableOpacity onPress={() => setPesquisa('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.abas}>
        <TouchableOpacity style={[styles.aba, aba === 'artigos' && styles.abaAtiva]} onPress={() => setAba('artigos')}>
          <Text style={[styles.abaTxt, aba === 'artigos' && styles.abaTxtAtivo]}>Artigos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aba, aba === 'lojas' && styles.abaAtiva]} onPress={() => setAba('lojas')}>
          <Text style={[styles.abaTxt, aba === 'lojas' && styles.abaTxtAtivo]}>Lojas próximas</Text>
        </TouchableOpacity>
      </View>

      {estado === 'negada' || estado === 'indisponivel' ? (
        <TouchableOpacity style={styles.avisoLocalizacao} onPress={pedir} activeOpacity={0.8}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <Text style={styles.avisoLocalizacaoTxt}>
            Ative a localização para ver os artigos e lojas mais próximos de si.
          </Text>
        </TouchableOpacity>
      ) : null}

      {aba === 'artigos' ? (
        produtos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>
              {pesquisa ? 'Nenhum artigo encontrado.' : 'A loja estará disponível em breve.'}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.grid}>
            {produtos.some(p => p.emDestaque) && (
              <View style={styles.destaqueTitulo}>
                <Ionicons name="star" size={14} color="#c0392b" />
                <Text style={styles.destaqueTituloTxt}>Em destaque</Text>
              </View>
            )}
            {[...produtos].sort((a, b) => Number(b.emDestaque) - Number(a.emDestaque)).map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('LojaProduto', { produto: p })}
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
                  {p.categoria ? <Text style={styles.categoria}>{p.categoria}</Text> : null}
                  <Text style={styles.nome} numberOfLines={2}>{p.nome}</Text>
                  {p.precoPromocional != null ? (
                    <View style={styles.precoPromoRow}>
                      <Text style={styles.precoRiscado}>{formatarPreco(p.preco, p.loja.moeda)}</Text>
                      <Text style={styles.precoPromo}>{formatarPreco(p.precoPromocional, p.loja.moeda)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.preco}>{formatarPreco(p.preco, p.loja.moeda)}</Text>
                  )}
                  <View style={styles.lojaRow}>
                    <Ionicons name="storefront-outline" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.lojaNome} numberOfLines={1}>{p.loja.nome}</Text>
                  </View>
                  {p.distanciaKm != null && (
                    <Text style={styles.distancia}>{p.distanciaKm.toFixed(1)} km</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      ) : (
        lojas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>Ainda não há lojas parceiras registadas.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listaLojas}>
            {lojas.map(l => (
              <TouchableOpacity
                key={l.id}
                style={styles.lojaCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('LojaDetalhe', { lojaId: l.id, lojaNome: l.nome })}
              >
                <View style={styles.lojaIcone}>
                  <Ionicons name="storefront-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lojaCardNome}>{l.nome}</Text>
                  {l.categoria ? <Text style={styles.lojaCardCategoria}>{l.categoria}</Text> : null}
                  {l.morada ? <Text style={styles.lojaCardMorada} numberOfLines={1}>{l.morada}</Text> : null}
                </View>
                {l.distanciaKm != null && (
                  <Text style={styles.lojaCardDistancia}>{l.distanciaKm.toFixed(1)} km</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      )}

      <CarrinhoFixo onPress={() => navigation.navigate('LojaCarrinho')} />
    </View>
  );
}

const CARD_W = '48%';

const styles = StyleSheet.create({
  buscaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 12,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: COLORS.border,
  },
  buscaInput: { flex: 1, fontSize: 14.5, fontFamily: FONTS.serif, color: COLORS.text, padding: 0 },

  abas: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 12 },
  aba: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  abaAtiva: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  abaTxt: { fontSize: 13, fontWeight: '700', fontFamily: FONTS.serif, color: COLORS.textSecondary },
  abaTxtAtivo: { color: '#fff' },

  avisoLocalizacao: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, padding: 10, borderRadius: 8,
    backgroundColor: `${COLORS.primary}12`,
  },
  avisoLocalizacaoTxt: { flex: 1, fontSize: 12.5, fontFamily: FONTS.serif, color: COLORS.primary },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    padding: 16, paddingBottom: 90, gap: 12,
  },
  destaqueTitulo: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: -4 },
  destaqueTituloTxt: { fontSize: 13, fontWeight: '700', color: '#c0392b', fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.4 },

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
  categoria: {
    fontSize: 10.5, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textTransform: 'uppercase', letterSpacing: 0.4,
  },
  nome: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif, minHeight: 34 },
  preco: { fontSize: 15, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 2 },
  precoPromoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  precoRiscado: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif, textDecorationLine: 'line-through' },
  precoPromo: { fontSize: 15, fontWeight: '700', color: '#c0392b', fontFamily: FONTS.serif },
  lojaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  lojaNome: { fontSize: 11.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, flexShrink: 1 },
  distancia: { fontSize: 11, color: COLORS.primary, fontFamily: FONTS.serif, fontWeight: '600', marginTop: 1 },

  listaLojas: { padding: 16, paddingBottom: 90, gap: 10 },
  lojaCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  lojaIcone: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  lojaCardNome: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  lojaCardCategoria: { fontSize: 11.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', marginTop: 1 },
  lojaCardMorada: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 2 },
  lojaCardDistancia: { fontSize: 12.5, color: COLORS.primary, fontWeight: '700', fontFamily: FONTS.serif },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: {
    color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic',
    fontSize: 16, textAlign: 'center',
  },
});
