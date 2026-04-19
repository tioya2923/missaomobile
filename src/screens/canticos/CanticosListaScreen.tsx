import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCanticosPorTopico, type CanticoResumo } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { CanticosScreenProps } from '../../navigation/types';

export default function CanticosListaScreen({ route, navigation }: CanticosScreenProps<'CanticosLista'>) {
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
        {canticos.map(item => (
          <ListItem
            key={String(item.id)}
            title={item.titulo}
            onPress={() => navigation.navigate('CanticoDetalhe', {
              idioma,
              slug: item.slug,
              titulo: item.titulo,
            })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16 },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    fontSize: 16,
  },
});
