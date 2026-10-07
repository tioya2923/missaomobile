import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/AppText';
import { getCatecismoTitulos, type CatecismoTitulo } from '../../api/catecismo';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import type { CatecismoScreenProps } from '../../navigation/types';
import { useThemedStyles } from '../../context/ThemeContext';

export default function CatecismoTitulosScreen({ route, navigation }: CatecismoScreenProps<'CatecismoTitulos'>) {
  const styles = useThemedStyles(createStyles);
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
            titleBold
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
