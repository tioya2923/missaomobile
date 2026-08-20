import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrinho } from '../../context/useCarrinho';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

export default function LojaProdutoScreen({ route, navigation }: MaisScreenProps<'LojaProduto'>) {
  const { produto } = route.params;
  const { adicionar } = useCarrinho();
  const [quantidade, setQuantidade] = useState(1);

  const adicionarAoCarrinho = () => {
    adicionar(produto, quantidade);
    Alert.alert(
      'Adicionado ao carrinho',
      `${quantidade}× ${produto.nome}`,
      [
        { text: 'Continuar a comprar', style: 'cancel' },
        { text: 'Ver carrinho', onPress: () => navigation.navigate('LojaCarrinho') },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {produto.imagemUrl ? (
        <Image source={{ uri: produto.imagemUrl }} style={styles.imagem} />
      ) : (
        <View style={[styles.imagem, styles.imagemPlaceholder]}>
          <Ionicons name="image-outline" size={48} color={COLORS.textSecondary} />
        </View>
      )}

      <View style={styles.card}>
        {produto.categoria ? <Text style={styles.categoria}>{produto.categoria}</Text> : null}
        <Text style={styles.nome}>{produto.nome}</Text>
        <Text style={styles.preco}>{produto.preco.toFixed(2)} Kz</Text>

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
            Adicionar — {(produto.preco * quantidade).toFixed(2)} Kz
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  categoria: {
    fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  nome: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginTop: 4 },
  preco: { fontSize: 22, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 6 },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  descricao: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, lineHeight: 23 },

  quantidadeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  quantidadeLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperBtn: {
    width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderDark,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValor: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, minWidth: 28, textAlign: 'center' },

  btnAdicionar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.navbar, borderRadius: 10, paddingVertical: 14, marginTop: 20,
  },
  btnAdicionarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15 },
});
