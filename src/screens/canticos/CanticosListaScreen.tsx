import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/AppText';
import { getCanticosPorTopico, type CanticoResumo } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import type { CanticosScreenProps } from '../../navigation/types';
import { useThemedStyles } from '../../context/ThemeContext';

export default function CanticosListaScreen({ route, navigation }: CanticosScreenProps<'CanticosLista'>) {
  const styles = useThemedStyles(createStyles);
  const { idioma, topicoSlug, topicoNome } = route.params;
  const [canticos, setCanticos] = useState<CanticoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setCanticos(await getCanticosPorTopico(idioma, topicoSlug));
    } catch {
      setError('Não foi possível carregar os cânticos.');
    } finally {
      setLoading(false);
    }
  }, [idioma, topicoSlug]);

  useEffect(() => {
    navigation.setOptions({ title: topicoNome });
    load();
  }, [load, navigation, topicoNome]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  if (!canticos.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>Nenhum cântico neste tópico.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.group}>
        {canticos.map((item, index) => (
          <ListItem
            key={String(item.id)}
            prefix={`${index + 1}.`}
            title={item.titulo}
            onPress={() => navigation.navigate('CanticoDetalhe', {
              idioma,
              slug: item.slug,
              titulo: `${index + 1}. ${item.titulo}`,
            })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16 },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    fontStyle: 'italic',
    fontSize: 16,
  },
});
