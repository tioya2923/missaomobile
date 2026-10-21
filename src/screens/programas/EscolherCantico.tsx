import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getCanticosPorTopico, getTopicos, type CanticoResumo, type Topico } from '../../api/canticos';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import ErrorView from '../../components/ErrorView';
import IdiomaSelect from '../../components/IdiomaSelect';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useIdioma } from '../../context/IdiomaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';

interface Props {
  momento: string;
  onEscolher: (c: { idioma: string; slug: string; titulo: string }) => void;
  onCancelar: () => void;
}

// Escolhe um cântico da própria app: já abre no tópico do momento da Missa (ex.: Entrada).
export default function EscolherCantico({ momento, onEscolher, onCancelar }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { codigo: idioma } = useIdioma('canticos');

  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [topicoSlug, setTopicoSlug] = useState<string | null>(null);
  const [canticos, setCanticos] = useState<CanticoResumo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [aCarregarTopicos, setACarregarTopicos] = useState(true);
  const [aCarregarCanticos, setACarregarCanticos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pedido = useRef(0);

  const carregarTopicos = useCallback(async () => {
    const id = ++pedido.current;
    setACarregarTopicos(true);
    setErro(null);
    try {
      const lista = await getTopicos(idioma);
      if (id !== pedido.current) return;
      setTopicos(lista);
      // Abre no tópico com o mesmo nome do momento; se não existir neste idioma, no primeiro.
      const igual = lista.find(t => t.nome === momento) ?? lista[0];
      setTopicoSlug(igual ? igual.slug : null);
    } catch {
      if (id === pedido.current) setErro('Não foi possível carregar os tópicos.');
    } finally {
      if (id === pedido.current) setACarregarTopicos(false);
    }
  }, [idioma, momento]);

  useEffect(() => { carregarTopicos(); }, [carregarTopicos]);

  useEffect(() => {
    if (!topicoSlug) { setCanticos([]); return; }
    let cancelado = false;
    setACarregarCanticos(true);
    getCanticosPorTopico(idioma, topicoSlug)
      .then(l => { if (!cancelado) setCanticos(l); })
      .catch(() => { if (!cancelado) setErro('Não foi possível carregar os cânticos.'); })
      .finally(() => { if (!cancelado) setACarregarCanticos(false); });
    return () => { cancelado = true; };
  }, [idioma, topicoSlug]);

  const visiveis = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    return f ? canticos.filter(c => c.titulo.toLowerCase().includes(f)) : canticos;
  }, [canticos, filtro]);

  return (
    <View style={styles.ecra}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={onCancelar} style={styles.voltar} activeOpacity={0.7} accessibilityLabel="Cancelar">
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Escolher cântico</Text>
          <Text style={styles.sub}>{momento}</Text>
        </View>
      </View>

      <View style={styles.bloco}>
        <IdiomaSelect secao="canticos" />
      </View>

      {aCarregarTopicos ? (
        <LoadingView />
      ) : erro && !topicos.length ? (
        <ErrorView message={erro} onRetry={carregarTopicos} />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
            {topicos.map(t => {
              const activo = t.slug === topicoSlug;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, activo && styles.chipActivo]}
                  onPress={() => setTopicoSlug(t.slug)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, activo && styles.chipTxtActivo]}>{t.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.bloco}>
            <View style={styles.pesquisa}>
              <Ionicons name="search-outline" size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.pesquisaInput}
                value={filtro}
                onChangeText={setFiltro}
                placeholder="Filtrar por título"
                placeholderTextColor={COLORS.textSecondary}
                autoCorrect={false}
              />
            </View>
          </View>

          {aCarregarCanticos ? (
            <LoadingView />
          ) : (
            <ScrollView contentContainerStyle={styles.lista} keyboardShouldPersistTaps="handled">
              {visiveis.length === 0 ? (
                <Text style={styles.vazio}>
                  {canticos.length ? 'Nenhum cântico com esse título.' : 'Ainda não há cânticos neste tópico e idioma.'}
                </Text>
              ) : (
                <View style={styles.grupo}>
                  {visiveis.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.linha}
                      activeOpacity={0.6}
                      onPress={() => onEscolher({ idioma, slug: c.slug, titulo: c.titulo })}
                    >
                      <Text style={styles.linhaTxt}>{c.titulo}</Text>
                      <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  voltar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 20, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  sub: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  bloco: { paddingHorizontal: 16, paddingTop: 10 },
  chipsScroll: { flexGrow: 0, flexShrink: 0, minHeight: 40, marginTop: 12 },
  chips: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActivo: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  chipTxtActivo: { color: '#fff' },
  pesquisa: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.pill, paddingHorizontal: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pesquisaInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans },
  lista: { padding: 16, paddingBottom: 32 },
  grupo: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },
  linha: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54,
    paddingVertical: 12, paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border,
  },
  linhaTxt: { flex: 1, fontSize: 15, fontWeight: '500', fontFamily: FONTS.sans, color: COLORS.text },
  vazio: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: FONTS.sans, fontStyle: 'italic', marginTop: 24 },
});
