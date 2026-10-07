import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/AppText';
import { getCantico, type Cantico } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../constants/theme';
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
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={styles.separator} />
        <Text style={styles.letra}>{cantico?.letra}</Text>
        {!!cantico?.autor && (
          <Text style={styles.autor}>Letra e Música: {cantico.autor}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 24,
    paddingVertical: 28,
    ...SHADOW.card,
  },
  titulo: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.display,
    textAlign: 'center',
  },
  separator: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 22,
  },
  letra: {
    fontSize: 17,
    color: COLORS.text,
    fontFamily: FONTS.sans,
    lineHeight: 30,
  },
  autor: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 20,
  },
});
