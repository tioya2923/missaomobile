import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFormasApoio, type FormaApoio } from '../../api/apoio';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

export default function LojaConfirmacaoScreen({ route, navigation }: MaisScreenProps<'LojaConfirmacao'>) {
  const { encomendaId, total } = route.params;
  const [formas, setFormas] = useState<FormaApoio[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setFormas((await getFormasApoio()).filter(f => f.ativo));
    } catch {
      setFormas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const copiar = async (id: number, valor: string) => {
    await Clipboard.setStringAsync(valor);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(c => (c === id ? null : c)), 2000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.primary} />
        <Text style={styles.heroTitulo}>Encomenda recebida!</Text>
        <Text style={styles.heroTexto}>
          Referência da encomenda: <Text style={{ fontWeight: '700' }}>#{encomendaId}</Text>{'\n'}
          Total a pagar: <Text style={{ fontWeight: '700' }}>{total.toFixed(2)} Kz</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitulo}>Como pagar</Text>
        <Text style={styles.cardTexto}>
          Efetue o pagamento por uma das formas abaixo e depois envie-nos o comprovativo
          juntamente com a referência #{encomendaId}, através do Contacto na app, para
          confirmarmos a sua encomenda.
        </Text>
        <View style={styles.separator} />

        {loading ? (
          <ActivityIndicator color={COLORS.text} />
        ) : formas.length === 0 ? (
          <Text style={styles.emBreve}>As formas de pagamento estarão disponíveis em breve.</Text>
        ) : (
          formas.map((f, i) => (
            <View key={f.id} style={[styles.metodo, i < formas.length - 1 && styles.metodoSep]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.metodoLabel}>{f.label}</Text>
                {f.descricao ? <Text style={styles.metodoDesc}>{f.descricao}</Text> : null}
                <Text style={styles.metodoValor}>{f.valor}</Text>
              </View>
              <TouchableOpacity style={styles.copiarBtn} onPress={() => copiar(f.id, f.valor)} activeOpacity={0.7}>
                <Ionicons name={copiadoId === f.id ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
                <Text style={styles.copiarTxt}>{copiadoId === f.id ? 'Copiado' : 'Copiar'}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.btnVoltar}
        onPress={() => navigation.navigate('Loja')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnVoltarTxt}>Voltar à loja</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.background },

  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroTitulo: { fontSize: 19, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  heroTexto: { fontSize: 14.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  cardTitulo: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTexto: { fontSize: 14, color: COLORS.text, fontFamily: FONTS.serif, lineHeight: 21, marginTop: 8 },
  separator: { height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 4 },
  emBreve: { fontSize: 14, color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },

  metodo: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  metodoSep: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  metodoLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  metodoDesc: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: FONTS.serif },
  metodoValor: { fontSize: 15, color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 4, fontWeight: '600' },

  copiarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.navbar, borderRadius: 8, paddingVertical: 9, paddingHorizontal: 12 },
  copiarTxt: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.serif },

  btnVoltar: { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnVoltarTxt: { color: COLORS.text, fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15 },
});
