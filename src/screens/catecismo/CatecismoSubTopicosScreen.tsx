import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { getCatecismoSubTopicos, type CatecismoTopico } from '../../api/catecismo';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { COLORS } from '../../constants/theme';
import type { CatecismoScreenProps } from '../../navigation/types';

export default function CatecismoSubTopicosScreen({ route, navigation }: CatecismoScreenProps<'CatecismoSubTopicos'>) {
  const { idioma, topicoId, topicoTitulo } = route.params;
  const [subtopicos, setSubtopicos] = useState<CatecismoTopico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSubtopicos(await getCatecismoSubTopicos(topicoId));
    } catch {
      setError('Não foi possível carregar os capítulos.');
    } finally {
      setLoading(false);
    }
  }, [topicoId]);

  useEffect(() => {
    navigation.setOptions({ title: topicoTitulo });
    load();
  }, [load, navigation, topicoTitulo]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.group}>
        {subtopicos.map(item => (
          <ListItem
            key={String(item.id)}
            title={item.titulo}
            onPress={() => navigation.navigate('CatecismoSubTopicoDetalhe', {
              idioma,
              subTopicoId: item.id,
              subTopicoTitulo: item.titulo,
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
