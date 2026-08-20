import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCarrinho } from '../../context/useCarrinho';
import { criarEncomenda } from '../../api/loja';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

export default function LojaCarrinhoScreen({ navigation }: MaisScreenProps<'LojaCarrinho'>) {
  const { itens, total, atualizarQuantidade, removerItem, limpar } = useCarrinho();

  const [nome, setNome] = useState('');
  const [contacto, setContacto] = useState('');
  const [morada, setMorada] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [aEnviar, setAEnviar] = useState(false);

  const finalizarEncomenda = async () => {
    if (!nome.trim() || !contacto.trim()) {
      Alert.alert('Dados em falta', 'Indique o seu nome e um contacto (telefone ou email).');
      return;
    }
    if (itens.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione pelo menos um artigo antes de finalizar.');
      return;
    }
    setAEnviar(true);
    try {
      const encomenda = await criarEncomenda({
        nomeCliente: nome.trim(),
        contacto: contacto.trim(),
        morada: morada.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        itens: itens.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
      });
      limpar();
      navigation.replace('LojaConfirmacao', { encomendaId: encomenda.id, total: encomenda.total });
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar a encomenda. Verifique a ligação e tente novamente.');
    } finally {
      setAEnviar(false);
    }
  };

  if (itens.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.empty}>O seu carrinho está vazio.</Text>
        <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.navigate('Loja')} activeOpacity={0.8}>
          <Text style={styles.btnVoltarTxt}>Ver a loja</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>O seu carrinho</Text>
          <View style={styles.separator} />
          {itens.map(item => (
            <View key={item.produtoId} style={styles.item}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemNome}>{item.nome}</Text>
                <Text style={styles.itemPreco}>{item.preco.toFixed(2)} Kz</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => atualizarQuantidade(item.produtoId, item.quantidade - 1)}
                >
                  <Ionicons name="remove" size={16} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.stepperValor}>{item.quantidade}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => atualizarQuantidade(item.produtoId, item.quantidade + 1)}
                >
                  <Ionicons name="add" size={16} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removerItem(item.produtoId)} style={{ marginLeft: 10 }}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>{total.toFixed(2)} Kz</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Dados para a encomenda</Text>
          <View style={styles.separator} />

          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="O seu nome" placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.label}>Contacto (telefone ou email) *</Text>
          <TextInput style={styles.input} value={contacto} onChangeText={setContacto} placeholder="923 000 000" placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.label}>Morada / local de entrega (opcional)</Text>
          <TextInput style={styles.input} value={morada} onChangeText={setMorada} placeholder="Bairro, referência..." placeholderTextColor={COLORS.textSecondary} />

          <Text style={styles.label}>Observações (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultilinha]}
            value={observacoes}
            onChangeText={setObservacoes}
            placeholder="Alguma indicação adicional"
            placeholderTextColor={COLORS.textSecondary}
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.btnFinalizar, aEnviar && { opacity: 0.6 }]}
          onPress={finalizarEncomenda}
          disabled={aEnviar}
          activeOpacity={0.85}
        >
          <Text style={styles.btnFinalizarTxt}>{aEnviar ? 'A enviar…' : 'Finalizar encomenda'}</Text>
        </TouchableOpacity>
        <Text style={styles.aviso}>
          Ao finalizar, receberá as instruções de pagamento. A encomenda só é confirmada após a receção do pagamento.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.background },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  cardTitulo: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.5 },
  separator: { height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 4 },

  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemNome: { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  itemPreco: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 2 },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepperBtn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: COLORS.borderDark, alignItems: 'center', justifyContent: 'center' },
  stepperValor: { fontSize: 14, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, minWidth: 22, textAlign: 'center' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  totalValor: { fontSize: 18, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif },

  label: { fontSize: 12.5, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 12, marginBottom: 6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, fontFamily: FONTS.serif, color: COLORS.text,
  },
  inputMultilinha: { minHeight: 70, textAlignVertical: 'top' },

  btnFinalizar: { backgroundColor: COLORS.navbar, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  btnFinalizarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 16 },
  aviso: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', textAlign: 'center', marginTop: 12, lineHeight: 18 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: COLORS.background },
  empty: { color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 16, textAlign: 'center' },
  btnVoltar: { backgroundColor: COLORS.navbar, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 },
  btnVoltarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif },
});
