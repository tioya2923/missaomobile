import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { search, type SearchResults } from '../api/search';
import { COLORS, FONTS } from '../constants/theme';

export default function PesquisaScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ultimaPesquisa = useRef('');

  const executarPesquisa = async (termo: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await search(termo);
      // Ignora respostas atrasadas de uma pesquisa entretanto substituída.
      if (ultimaPesquisa.current === termo) setResults(data);
    } catch {
      if (ultimaPesquisa.current === termo) setError('Erro ao pesquisar. Tente novamente.');
    } finally {
      if (ultimaPesquisa.current === termo) setLoading(false);
    }
  };

  // Pesquisa automaticamente enquanto o utilizador escreve, com uma pequena
  // pausa — não é preciso tocar em "Pesquisar" para ver resultados.
  useEffect(() => {
    const termo = query.trim();
    ultimaPesquisa.current = termo;
    if (termo.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }
    const id = setTimeout(() => executarPesquisa(termo), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSearch = () => {
    const termo = query.trim();
    if (termo.length < 2) return;
    ultimaPesquisa.current = termo;
    executarPesquisa(termo);
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

  const irTopico = (idioma: 'pt' | 'ub', topicoSlug: string, topicoNome: string) =>
    navigation.navigate('Canticos', {
      screen: 'CanticosLista',
      params: { idioma, topicoSlug, topicoNome },
    });

  const irCalendario = () => navigation.navigate('Calendario');

  return (
    <View style={styles.container}>
      {/* Barra de pesquisa */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={17} color={COLORS.textSecondary} />
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
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!query.trim() && (
        <View style={styles.hint}>
          <Ionicons name="search-outline" size={30} color={COLORS.textSecondary} />
          <Text style={styles.hintText}>O que procura?</Text>
          <Text style={styles.hintSub}>Cânticos, temas do catecismo ou eventos do calendário.</Text>
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 32 }} color={COLORS.navbar} />}
      {error && <Text style={styles.error}>{error}</Text>}
      {!loading && results && !hasResults && (
        <View style={styles.hint}>
          <Ionicons name="file-tray-outline" size={30} color={COLORS.textSecondary} />
          <Text style={styles.hintText}>Nenhum resultado encontrado</Text>
          <Text style={styles.hintSub}>Tente outra palavra, ou uma palavra mais curta.</Text>
        </View>
      )}

      {hasResults && (
        <ScrollView contentContainerStyle={styles.results} keyboardShouldPersistTaps="handled">

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

          <Section title="Tópicos — Cânticos (Português)">
            {results!.topicos.map(item => (
              <ResultItem
                key={item.id}
                label={item.nome}
                onPress={() => irTopico('pt', item.slug, item.nome)}
              />
            ))}
          </Section>

          <Section title="Tópicos — Cânticos (Umbundu)">
            {results!.topicosUmb.map(item => (
              <ResultItem
                key={item.id}
                label={item.nome}
                onPress={() => irTopico('ub', item.slug, item.nome)}
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
    padding: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },

  error: {
    color: COLORS.error, textAlign: 'center', fontFamily: FONTS.serif,
    marginTop: 24, paddingHorizontal: 16,
  },
  hint: {
    alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 56, paddingHorizontal: 32,
  },
  hintText: {
    color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '700', fontSize: 16,
  },
  hintSub: {
    color: COLORS.textSecondary, fontFamily: FONTS.serif, fontSize: 13,
    textAlign: 'center', lineHeight: 19,
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
