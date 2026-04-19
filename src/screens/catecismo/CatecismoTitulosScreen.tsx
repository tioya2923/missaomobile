import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getCatecismoTitulos, type CatecismoTitulo } from '../../api/catecismo';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { COLORS, FONTS } from '../../constants/theme';
import type { CatecismoScreenProps } from '../../navigation/types';

export default function CatecismoTitulosScreen({ route, navigation }: CatecismoScreenProps<'CatecismoTitulos'>) {
  const { idioma, topicoId, topicoTitulo } = route.params;
  const [titulos, setTitulos] = useState<CatecismoTitulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTitulos(await getCatecismoTitulos(idioma, topicoId));
    } catch {
      setError('Não foi possível carregar os títulos.');
    } finally {
      setLoading(false);
    }
  }, [idioma, topicoId]);

  useEffect(() => {
    navigation.setOptions({ title: topicoTitulo });
    load();
  }, [load, navigation, topicoTitulo]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  if (!titulos.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>Nenhum título disponível.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.group}>
        {titulos.map(item => (
          <ListItem
            key={String(item.id)}
            title={item.titulo}
            onPress={() => navigation.navigate('CatecismoTexto', {
              idioma,
              id: item.id,
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
