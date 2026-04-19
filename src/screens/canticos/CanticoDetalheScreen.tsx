import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCantico, type Cantico } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { CanticosScreenProps } from '../../navigation/types';

export default function CanticoDetalheScreen({ route, navigation }: CanticosScreenProps<'CanticoDetalhe'>) {
  const { idioma, slug, titulo } = route.params;
  const [cantico, setCantico] = useState<Cantico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCantico(await getCantico(idioma, slug));
    } catch {
      setError('Não foi possível carregar o cântico.');
    } finally {
      setLoading(false);
    }
  }, [idioma, slug]);

  useEffect(() => {
    navigation.setOptions({ title: titulo });
    load();
  }, [load, navigation, titulo]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>{cantico?.titulo}</Text>
        <View style={styles.separator} />
        <Text style={styles.letra}>{cantico?.letra}</Text>
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
  letra: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 28,
  },
});
