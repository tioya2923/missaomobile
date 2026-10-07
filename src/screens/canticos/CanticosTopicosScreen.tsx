import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../../components/AppText';
import { getTopicos, type Topico } from '../../api/canticos';
import ErrorView from '../../components/ErrorView';
import IdiomaSelect from '../../components/IdiomaSelect';
import ListItem from '../../components/ListItem';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useIdioma } from '../../context/IdiomaContext';
import type { CanticosScreenProps } from '../../navigation/types';
import { useThemedStyles } from '../../context/ThemeContext';

export default function CanticosTopicosScreen({ navigation }: CanticosScreenProps<'CanticosTopicos'>) {
  const styles = useThemedStyles(createStyles);
  const { codigo: idioma } = useIdioma();
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pedido = useRef(0);

  const load = useCallback(async () => {
    const id = ++pedido.current;
    try {
      setLoading(true);
      setError(null);
      const dados = await getTopicos(idioma);
      if (id === pedido.current) setTopicos(dados);
    } catch {
      if (id === pedido.current) setError('Não foi possível carregar os tópicos.');
    } finally {
      if (id === pedido.current) setLoading(false);
    }
  }, [idioma]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.root}>
      <View style={styles.selectWrap}>
        <IdiomaSelect />
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : !topicos.length ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Ainda não há cânticos disponíveis neste idioma.</Text>
        </View>
      ) : (
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
      )}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  selectWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  scroll: { flex: 1 },
  container: { padding: 16 },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  empty: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    fontStyle: 'italic',
    fontSize: 16,
  },
});
