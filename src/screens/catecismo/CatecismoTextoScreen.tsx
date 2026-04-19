import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCatecismoTexto, type CatecismoTexto } from '../../api/catecismo';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { CatecismoScreenProps } from '../../navigation/types';

export default function CatecismoTextoScreen({ route, navigation }: CatecismoScreenProps<'CatecismoTexto'>) {
  const { idioma, id, titulo } = route.params;
  const [item, setItem] = useState<CatecismoTexto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setItem(await getCatecismoTexto(idioma, id));
    } catch {
      setError('Não foi possível carregar o texto.');
    } finally {
      setLoading(false);
    }
  }, [idioma, id]);

  useEffect(() => {
    navigation.setOptions({ title: titulo });
    load();
  }, [load, navigation, titulo]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>{item?.titulo}</Text>
        <View style={styles.separator} />
        <Text style={styles.texto}>{item?.texto}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginBottom: 16,
  },
  texto: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 28,
  },
});
