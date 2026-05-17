import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCatecismoEntradas, type CatecismoEntrada } from '../../api/catecismo';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { CatecismoScreenProps } from '../../navigation/types';

export default function CatecismoSubTopicoDetalheScreen({ route, navigation }: CatecismoScreenProps<'CatecismoSubTopicoDetalhe'>) {
  const { idioma, subTopicoId, subTopicoTitulo } = route.params;
  const [entradas, setEntradas] = useState<CatecismoEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEntradas(await getCatecismoEntradas(idioma, subTopicoId));
    } catch {
      setError('Não foi possível carregar as perguntas.');
    } finally {
      setLoading(false);
    }
  }, [idioma, subTopicoId]);

  useEffect(() => {
    navigation.setOptions({ title: subTopicoTitulo });
    load();
  }, [load, navigation, subTopicoTitulo]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {entradas.map((item, index) => (
        <View key={String(item.id)} style={[styles.card, index > 0 && styles.cardSpacing]}>
          <Text style={styles.pergunta}>{item.titulo}</Text>
          <View style={styles.separator} />
          <Text style={styles.resposta}>{item.texto}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSpacing: { marginTop: 12 },
  pergunta: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginVertical: 12,
  },
  resposta: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 26,
  },
});
