import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrinho } from '../../context/useCarrinho';
import { formatarPreco } from '../../constants/moeda';
import CarrinhoFixo from '../../components/loja/CarrinhoFixo';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

export default function LojaProdutoScreen({ route, navigation }: MaisScreenProps<'LojaProduto'>) {
  const { produto } = route.params;
  const { adicionar } = useCarrinho();
  const [quantidade, setQuantidade] = useState(1);
  const precoEfetivo = produto.precoPromocional ?? produto.preco;

  const adicionarAoCarrinho = () => {
    adicionar(produto, quantidade);
    setQuantidade(1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
    <ScrollView contentContainerStyle={styles.container}>
      {produto.imagemUrl ? (
        <Image source={{ uri: produto.imagemUrl }} style={styles.imagem} />
      ) : (
        <View style={[styles.imagem, styles.imagemPlaceholder]}>
          <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
        </View>
      )}

      <View style={styles.card}>
        {produto.emDestaque && (
          <View style={styles.destaqueBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.destaqueBadgeTxt}>Em destaque</Text>
          </View>
        )}
        {produto.categoria ? <Text style={styles.categoria}>{produto.categoria}</Text> : null}
        <Text style={styles.nome}>{produto.nome}</Text>
        {produto.precoPromocional != null ? (
          <View style={styles.precoPromoRow}>
            <Text style={styles.precoRiscado}>{formatarPreco(produto.preco, produto.loja.moeda)}</Text>
            <Text style={styles.precoPromo}>{formatarPreco(produto.precoPromocional, produto.loja.moeda)}</Text>
          </View>
        ) : (
          <Text style={styles.preco}>{formatarPreco(produto.preco, produto.loja.moeda)}</Text>
        )}

        <TouchableOpacity
          style={styles.lojaBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('LojaDetalhe', { lojaId: produto.loja.id, lojaNome: produto.loja.nome })}
        >
          <Ionicons name="storefront-outline" size={15} color={COLORS.primary} />
          <Text style={styles.lojaBtnTxt}>{produto.loja.nome}</Text>
          {produto.distanciaKm != null && (
            <Text style={styles.lojaDistancia}>· {produto.distanciaKm.toFixed(1)} km</Text>
          )}
          <Ionicons name="chevron-forward" size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {produto.descricao ? (
          <>
            <View style={styles.separator} />
            <Text style={styles.descricao}>{produto.descricao}</Text>
          </>
        ) : null}

        <View style={styles.separator} />

        <View style={styles.quantidadeRow}>
          <Text style={styles.quantidadeLabel}>Quantidade</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantidade(q => Math.max(1, q - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.stepperValor}>{quantidade}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => setQuantidade(q => q + 1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.btnAdicionar} onPress={adicionarAoCarrinho} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.btnAdicionarTxt}>
            Adicionar — {formatarPreco(precoEfetivo * quantidade, produto.loja.moeda)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Espaço para a barra fixa do carrinho não tapar o botão de adicionar */}
      <View style={{ height: 70 }} />
    </ScrollView>

    <CarrinhoFixo onPress={() => navigation.navigate('LojaCarrinho')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, paddingBottom: 40 },
  imagem: { width: '100%', height: 260, backgroundColor: COLORS.border },
  imagemPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  card: {
    margin: 16, marginTop: -24, backgroundColor: COLORS.surface, borderRadius: 14, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  destaqueBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: '#c0392b', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 8,
  },
  destaqueBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: FONTS.serif, textTransform: 'uppercase' },
  categoria: {
    fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  nome: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginTop: 4 },
  preco: { fontSize: 22, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 6 },
  precoPromoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  precoRiscado: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.serif, textDecorationLine: 'line-through' },
  precoPromo: { fontSize: 22, fontWeight: '700', color: '#c0392b', fontFamily: FONTS.serif },
  lojaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: `${COLORS.primary}12`, alignSelf: 'flex-start',
    borderRadius: 16, paddingVertical: 7, paddingHorizontal: 10,
  },
  lojaBtnTxt: { fontSize: 12.5, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif },
  lojaDistancia: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  descricao: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, lineHeight: 23 },

  quantidadeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantidadeLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperBtn: {
    width: 34, height: 34, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderDark,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValor: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, minWidth: 28, textAlign: 'center' },

  btnAdicionar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.navbar, borderRadius: 14, paddingVertical: 14, marginTop: 20,
  },
  btnAdicionarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15 },
});
