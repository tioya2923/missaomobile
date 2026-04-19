import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { search, type SearchResults } from '../api/search';
import { COLORS, FONTS } from '../constants/theme';

export default function PesquisaScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setResults(await search(query.trim()));
    } catch {
      setError('Erro ao pesquisar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const hasResults = results && Object.values(results).some(v => v.length > 0);

  // ── Navegação por tipo de resultado ──────────────────────────────────────
  const irCantico = (idioma: 'pt' | 'ub', slug: string, titulo: string) =>
    navigation.navigate('Canticos', {
      screen: 'CanticoDetalhe',
      params: { idioma, slug, titulo },
    });

  const irCatecismo = (idioma: 'pt' | 'ub', id: number, titulo: string) =>
    navigation.navigate('Catecismo', {
      screen: 'CatecismoTexto',
      params: { idioma, id, titulo },
    });

  const irCalendario = () => navigation.navigate('Calendario');

  return (
    <View style={styles.container}>
      {/* Barra de pesquisa */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Pesquisar cânticos, catecismo..."
          placeholderTextColor={COLORS.textSecondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        <TouchableOpacity style={styles.btn} onPress={handleSearch}>
          <Text style={styles.btnText}>Pesquisar</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.text} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {results && !hasResults && (
        <Text style={styles.empty}>Nenhum resultado encontrado.</Text>
      )}

      {hasResults && (
        <ScrollView contentContainerStyle={styles.results}>

          <Section title="Cânticos (Português)">
            {results!.canticos.map(item => (
              <ResultItem
                key={item.id}
                label={item.titulo}
                onPress={() => irCantico('pt', item.slug, item.titulo)}
              />
            ))}
          </Section>

          <Section title="Cânticos (Umbundu)">
            {results!.canticosUmb.map(item => (
              <ResultItem
                key={item.id}
                label={item.titulo}
                onPress={() => irCantico('ub', item.slug, item.titulo)}
              />
            ))}
          </Section>

          <Section title="Catecismo (Português)">
            {results!.catecismosPt.map(item => (
              <ResultItem
                key={item.id}
                label={item.titulo}
                onPress={() => irCatecismo('pt', item.id, item.titulo)}
              />
            ))}
          </Section>

          <Section title="Catecismo (Umbundu)">
            {results!.catecismosUb.map(item => (
              <ResultItem
                key={item.id}
                label={item.titulo}
                onPress={() => irCatecismo('ub', item.id, item.titulo)}
              />
            ))}
          </Section>

          <Section title="Calendário">
            {results!.eventos.map(item => (
              <ResultItem
                key={item.id}
                label={item.titulo}
                onPress={irCalendario}
              />
            ))}
          </Section>

        </ScrollView>
      )}
    </View>
  );
}

// ── Componentes auxiliares ───────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);
  if (!hasChildren) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionGroup}>{children}</View>
    </View>
  );
}

function ResultItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.resultItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.resultText}>{label}</Text>
      <Text style={styles.resultChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  searchRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  btn: {
    backgroundColor: COLORS.navbar,
    paddingHorizontal: 14,
    borderRadius: 6,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 14 },

  error: {
    color: COLORS.error, textAlign: 'center', fontFamily: FONTS.serif,
    marginTop: 24, paddingHorizontal: 16,
  },
  empty: {
    color: COLORS.textSecondary, textAlign: 'center', fontFamily: FONTS.serif,
    fontStyle: 'italic', marginTop: 48, fontSize: 16,
  },

  results: { padding: 16, gap: 12 },

  section: { gap: 2 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontFamily: FONTS.serif,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  sectionGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  resultText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 20,
  },
  resultChevron: {
    fontSize: 22,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});
