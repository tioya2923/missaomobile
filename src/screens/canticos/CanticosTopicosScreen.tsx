import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getTopicos, type Topico } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { COLORS } from '../../constants/theme';
import type { CanticosScreenProps } from '../../navigation/types';

export default function CanticosTopicosScreen({ route, navigation }: CanticosScreenProps<'CanticosTopicos'>) {
  const { idioma } = route.params;
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTopicos(await getTopicos(idioma));
    } catch {
      setError('Não foi possível carregar os tópicos.');
    } finally {
      setLoading(false);
    }
  }, [idioma]);

  useEffect(() => {
    navigation.setOptions({ title: idioma === 'pt' ? 'Cânticos — Português' : 'Cânticos — Umbundu' });
    load();
  }, [idioma, load, navigation]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.group}>
        {topicos.map(item => (
          <ListItem
            key={String(item.id)}
            title={item.nome}
            onPress={() => navigation.navigate('CanticosLista', {
              idioma,
              topicoSlug: item.slug,
              topicoNome: item.nome,
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
});
