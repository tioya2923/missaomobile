import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { getFormasApoio, type FormaApoio } from '../api/apoio';

export default function ApoiarScreen() {
  const [formas, setFormas] = useState<FormaApoio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(false);
    try {
      const dados = await getFormasApoio();
      setFormas(dados.filter(f => f.ativo));
    } catch {
      setErro(true);
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
      {/* Cabeçalho */}
      <View style={styles.hero}>
        <Ionicons name="heart-outline" size={40} color={COLORS.navbar} />
        <Text style={styles.heroTitulo}>Apoie o Ndatava</Text>
        <Text style={styles.heroTexto}>
          Esta aplicação é e será sempre gratuita para todos. Se quiser, pode ajudar
          voluntariamente a manter o calendário litúrgico, os cânticos, o catecismo e as
          orações sempre disponíveis e atualizados. Nenhum conteúdo fica bloqueado — o seu
          apoio é inteiramente livre.
        </Text>
      </View>

      {/* Métodos de apoio */}
      {loading ? (
        <View style={styles.card}>
          <ActivityIndicator color={COLORS.text} />
        </View>
      ) : erro ? (
        <View style={styles.card}>
          <Text style={styles.emBreveTexto}>Não foi possível carregar as formas de apoio.</Text>
          <TouchableOpacity onPress={carregar} style={{ marginTop: 12, alignSelf: 'center' }}>
            <Text style={{ color: COLORS.primary, fontFamily: FONTS.serif, fontWeight: '700' }}>
              Tentar novamente
            </Text>
          </TouchableOpacity>
        </View>
      ) : formas.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Formas de apoiar</Text>
          <View style={styles.separator} />
          {formas.map((f, i) => (
            <View key={f.id} style={[styles.metodo, i < formas.length - 1 && styles.metodoSep]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.metodoLabel}>{f.label}</Text>
                {f.descricao ? <Text style={styles.metodoDesc}>{f.descricao}</Text> : null}
                <Text style={styles.metodoValor}>{f.valor}</Text>
              </View>
              <TouchableOpacity
                style={styles.copiarBtn}
                onPress={() => copiar(f.id, f.valor)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={copiadoId === f.id ? 'checkmark' : 'copy-outline'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.copiarTxt}>{copiadoId === f.id ? 'Copiado' : 'Copiar'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.emBreveTexto}>
            As formas de apoio estarão disponíveis em breve.
          </Text>
        </View>
      )}

      <Text style={styles.rodape}>
        Obrigado por fazer parte desta comunidade. Que Deus lhe recompense a generosidade.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.background },

  hero: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 8, gap: 10 },
  heroTitulo: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, textAlign: 'center' },
  heroTexto: {
    fontSize: 14.5, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textAlign: 'center', lineHeight: 22, marginTop: 4,
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitulo: {
    fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  separator: { height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 4 },

  metodo: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  metodoSep: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  metodoLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  metodoDesc: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: FONTS.serif },
  metodoValor: { fontSize: 15, color: COLORS.primary, fontFamily: FONTS.serif, marginTop: 4, fontWeight: '600' },

  copiarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.navbar, borderRadius: 16,
    paddingVertical: 9, paddingHorizontal: 12,
  },
  copiarTxt: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.serif },

  emBreveTexto: {
    fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    fontStyle: 'italic', textAlign: 'center', paddingVertical: 8,
  },

  rodape: {
    fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif,
    fontStyle: 'italic', textAlign: 'center', marginTop: 8, paddingHorizontal: 16, lineHeight: 20,
  },
});
