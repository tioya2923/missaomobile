import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/AppText';
import { getTopicos, type Topico } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import type { CanticosScreenProps } from '../../navigation/types';
import { useThemedStyles } from '../../context/ThemeContext';

export default function CanticosTopicosScreen({ route, navigation }: CanticosScreenProps<'CanticosTopicos'>) {
  const styles = useThemedStyles(createStyles);
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
    const titulos = {
      pt: 'Cânticos — Português',
      ub: 'Cânticos — Umbundu',
      lat: 'Cânticos — Latim',
      kmb: 'Cânticos — Kimbundu',
      otc: 'Cânticos — Oshikwanhama',
    };
    navigation.setOptions({ title: titulos[idioma] });
    load();
  }, [idioma, load, navigation]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  if (!topicos.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.empty}>Ainda não há cânticos disponíveis neste idioma.</Text>
      </View>
    );
  }

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

const createStyles = (COLORS: Palette) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16 },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 32 },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    fontStyle: 'italic',
    fontSize: 16,
  },
});
