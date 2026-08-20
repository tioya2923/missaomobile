import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrinho } from '../../context/useCarrinho';
import { COLORS, FONTS } from '../../constants/theme';

interface Props {
  onPress: () => void;
}

// Barra do carrinho fixa em baixo do ecrã: fica visível enquanto houver artigos
// no carrinho, para que o comprador tenha sempre acesso rápido a "Ver carrinho"
// durante toda a compra. Ao contrário de um aviso temporário, só desaparece
// quando o carrinho fica vazio (não tem temporizador).
export default function CarrinhoFixo({ onPress }: Props) {
  const { quantidadeTotal, total } = useCarrinho();

  if (quantidadeTotal === 0) return null;

  return (
    <TouchableOpacity style={styles.barra} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.info}>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{quantidadeTotal}</Text>
        </View>
        <Text style={styles.total}>{total.toFixed(2)} Kz</Text>
      </View>
      <View style={styles.verBtn}>
        <Ionicons name="cart" size={16} color="#fff" />
        <Text style={styles.verBtnTxt}>Ver carrinho</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  barra: {
    position: 'absolute', left: 16, right: 16, bottom: 16,
    backgroundColor: COLORS.navbar, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    minWidth: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeTxt: { color: COLORS.navbar, fontWeight: '700', fontFamily: FONTS.serif, fontSize: 12.5 },
  total: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 14.5 },
  verBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verBtnTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 13.5 },
});
