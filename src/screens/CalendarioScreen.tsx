import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, AppState, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View,
} from 'react-native';
import Text from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { DIAS_MOSTRADOS, getEventosJanela, type Evento } from '../api/calendario';
import { FONTS, type Palette } from '../constants/theme';
import type { RootScreenProps } from '../navigation/types';
import { useColors, useThemedStyles } from '../context/ThemeContext';

// ── Dias da semana ───────────────────────────────────────────────────────────
const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// ── Cores litúrgicas ─────────────────────────────────────────────────────────
const COR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  branco:   { bg: '#ffffff', border: '#b0b0b0', text: '#333333' },
  vermelho: { bg: '#c0392b', border: '#c0392b', text: '#ffffff' },
  verde:    { bg: '#27ae60', border: '#27ae60', text: '#ffffff' },
  roxo:     { bg: '#6c3483', border: '#6c3483', text: '#ffffff' },
  morado:   { bg: '#6c3483', border: '#6c3483', text: '#ffffff' },
  rosa:     { bg: '#d45f9e', border: '#d45f9e', text: '#ffffff' },
  preto:    { bg: '#1a1a1a', border: '#1a1a1a', text: '#ffffff' },
  dourado:  { bg: '#c9a84c', border: '#c9a84c', text: '#ffffff' },
};
const DEFAULT_COR = { bg: '#555555', border: '#555555', text: '#ffffff' };

// A cor vem no início da descrição ("Verde ou branco – Ofício da féria…", "Verde ou verm. – …").
// Devolve as cores pela ordem em que aparecem no texto, aceitando as abreviaturas "verm." e "br.".
const RAIZES_COR: [RegExp, string][] = [
  [/^branc/, 'branco'], [/^br$/, 'branco'],
  [/^vermelh/, 'vermelho'], [/^verm$/, 'vermelho'],
  [/^verd/, 'verde'],
  [/^rox/, 'roxo'], [/^morad/, 'morado'],
  [/^ros/, 'rosa'], [/^pret/, 'preto'], [/^dourad/, 'dourado'],
];

function parseCores(descricao: string) {
  const parte = descricao.split(/[–\-]/)[0].toLowerCase();
  const nomes: string[] = [];
  for (const palavra of parte.match(/[a-zçãé]+/g) ?? []) {
    const nome = RAIZES_COR.find(([re]) => re.test(palavra))?.[1];
    if (nome && !nomes.includes(nome)) nomes.push(nome);
  }
  if (nomes.length === 0) return { cores: [DEFAULT_COR], dupla: false };
  return { cores: nomes.map(n => COR_MAP[n]), dupla: nomes.length >= 2 };
}

// ── Utilitários de data ───────────────────────────────────────────────────────
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

// O calendário só mostra de hoje em diante, por isso os anos começam no ano atual.
const ANO_MAX = 2035;

function startOfDay(d: Date): Date {
  const r = new Date(d); r.setHours(0, 0, 0, 0); return r;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
function fmtLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function weekLabel(inicio: Date): string {
  const fim = addDays(inicio, DIAS_MOSTRADOS - 1);
  return inicio.getMonth() === fim.getMonth()
    ? `${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`
    : `${MESES[inicio.getMonth()]} – ${MESES[fim.getMonth()]} ${fim.getFullYear()}`;
}

// ── Modal picker genérico ─────────────────────────────────────────────────────
function PickerModal<T extends string | number>({
  visible, items, selected, labelOf, onSelect, onClose,
}: {
  visible: boolean;
  items: T[];
  selected: T;
  labelOf: (v: T) => string;
  onSelect: (v: T) => void;
  onClose: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalBox}>
          <FlatList
            data={items}
            keyExtractor={String}
            initialScrollIndex={Math.max(0, items.indexOf(selected))}
            getItemLayout={(_, i) => ({ length: 44, offset: 44 * i, index: i })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.modalItem, item === selected && styles.modalItemActive]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <Text style={[styles.modalItemText, item === selected && styles.modalItemTextActive]}>
                  {labelOf(item)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Ecrã principal ────────────────────────────────────────────────────────────
export default function CalendarioScreen({ navigation }: RootScreenProps<'Calendario'>) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  // Contador que força a actualização quando a app volta ao primeiro plano (o "hoje" pode ter mudado).
  const [, setTique] = useState(0);
  useEffect(() => {
    const sub = AppState.addEventListener('change', estado => { if (estado === 'active') setTique(t => t + 1); });
    return () => sub.remove();
  }, []);

  const today = startOfDay(new Date());
  const ANOS = Array.from({ length: ANO_MAX - today.getFullYear() + 1 }, (_, i) => today.getFullYear() + i);

  // Primeiro dia mostrado: nunca antes de hoje.
  const [inicioEscolhido, setInicioEscolhido] = useState<Date>(today);
  const inicio = inicioEscolhido < today ? today : inicioEscolhido;
  const inicioChave = fmtLocal(inicio);
  const naoHaAnterior = inicioChave === fmtLocal(today);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seletores "Ir para"
  const [selMes, setSelMes] = useState<number>(today.getMonth());
  const [selAno, setSelAno] = useState<number>(today.getFullYear());
  const [showMes, setShowMes] = useState(false);
  const [showAno, setShowAno] = useState(false);

  const load = useCallback(async (de: Date) => {
    try {
      setLoading(true); setError(null);
      setEventos(await getEventosJanela(de));
    } catch {
      setError('Não foi possível carregar os eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(inicio); }, [inicioChave, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setEventos(await getEventosJanela(inicio));
      setError(null);
    } catch {
      setError('Não foi possível carregar os eventos.');
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicioChave]);

  const irParaData = () => setInicioEscolhido(startOfDay(new Date(selAno, selMes, 1)));
  const navegar = (n: number) => setInicioEscolhido(addDays(inicio, n));
  const hoje = () => {
    setInicioEscolhido(today);
    setSelMes(today.getMonth());
    setSelAno(today.getFullYear());
  };

  const dias = Array.from({ length: DIAS_MOSTRADOS }, (_, i) => addDays(inicio, i));

  return (
    <View style={styles.root}>
      {/* ── Barra de navegação ── */}
      <View style={styles.navBar}>

        {/* Linha 1: seletores Mês / Ano / Ir */}
        <View style={styles.selectorRow}>
          <TouchableOpacity style={styles.selector} onPress={() => setShowMes(true)}>
            <Text style={styles.selectorText}>{MESES[selMes]}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.selector} onPress={() => setShowAno(true)}>
            <Text style={styles.selectorText}>{selAno}</Text>
            <Text style={styles.selectorArrow}>▼</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.irBtn} onPress={irParaData}>
            <Text style={styles.irBtnText}>Ir</Text>
          </TouchableOpacity>
        </View>

        {/* Linha 2: Anterior / Hoje / Próximo */}
        <View style={styles.navBtns}>
          <TouchableOpacity style={[styles.navBtn, naoHaAnterior && { opacity: 0.35 }]} onPress={() => navegar(-DIAS_MOSTRADOS)} disabled={naoHaAnterior}>
            <Text style={styles.navBtnText}>‹ Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnHoje]} onPress={hoje}>
            <Text style={[styles.navBtnText, styles.navBtnHojeText]}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navegar(DIAS_MOSTRADOS)}>
            <Text style={styles.navBtnText}>Próximo ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.weekLabel}>{weekLabel(inicio)}</Text>
      </View>

      {/* ── Conteúdo ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(inicio)}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {eventos.length === 0 && (
            <Text style={styles.semDados}>Ainda não há dados do calendário litúrgico para estes dias.</Text>
          )}
          {dias.map(dia => {
            const evs = eventos.filter(e => e.data?.slice(0, 10) === fmtLocal(dia));
            return (
              <DiaCard
                key={dia.toISOString()}
                dia={dia}
                eventos={evs}
                isToday={isSameDay(dia, today)}
              />
            );
          })}
        </ScrollView>
      )}

      {/* ── Acessos rápidos: Loja e Apoiar — fixos, acima do rodapé ── */}
      <View style={styles.acessosRow}>
        <TouchableOpacity
          style={styles.acessoBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Mais', { screen: 'Loja' })}
        >
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.acessoTxt}>Loja</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acessoBtn, styles.acessoBtnApoiar]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Mais', { screen: 'Apoiar' })}
        >
          <Ionicons name="heart-outline" size={18} color={COLORS.primary} />
          <Text style={[styles.acessoTxt, styles.acessoTxtApoiar]}>Apoiar</Text>
        </TouchableOpacity>
      </View>

      {/* Modais */}
      <PickerModal
        visible={showMes}
        items={MESES.map((_, i) => i) as number[]}
        selected={selMes}
        labelOf={i => MESES[i as number]}
        onSelect={v => setSelMes(v as number)}
        onClose={() => setShowMes(false)}
      />
      <PickerModal
        visible={showAno}
        items={ANOS}
        selected={selAno}
        labelOf={v => String(v)}
        onSelect={v => setSelAno(v as number)}
        onClose={() => setShowAno(false)}
      />
    </View>
  );
}

// ── Card de evento ────────────────────────────────────────────────────────────
function DiaCard({ dia, eventos, isToday }: { dia: Date; eventos: Evento[]; isToday: boolean }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const nomeDia = DIAS_SEMANA[dia.getDay()];

  if (eventos.length === 0) {
    return (
      <View style={[styles.card, { borderColor: COLORS.border }, isToday && styles.cardToday]}>
        {isToday && <View style={styles.hojeSelo}><Text style={styles.hojeSeloTxt}>HOJE</Text></View>}
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitulo, { color: COLORS.textSecondary }]}>{nomeDia}</Text>
          <View style={[styles.badge, { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border }]}>
            <Text style={[styles.badgeText, { color: COLORS.textSecondary }]}>{dia.getDate()}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      {eventos.map(evento => {
        const { cores, dupla } = parseCores(evento.descricao ?? '');
        const cor1 = cores[0];

        return (
          <View key={evento.id} style={[styles.card, isToday ? styles.cardToday : { borderColor: cor1.border }, { borderLeftColor: cor1.border }]}>
            {isToday && <View style={styles.hojeSelo}><Text style={styles.hojeSeloTxt}>HOJE</Text></View>}
            <View style={styles.cardTop}>
              <Text style={styles.cardTitulo}>{evento.titulo}</Text>

              {dupla ? (
                <View style={[styles.badge, { borderWidth: 1, borderColor: COLORS.border }]}>
                  {cores.map((c, i) => (
                    <View
                      key={i}
                      style={[styles.badgeFatia, { left: `${(100 / cores.length) * i}%`, width: `${100 / cores.length}%`, backgroundColor: c.bg }]}
                    />
                  ))}
                  <Text style={[styles.badgeText, cores.length === 2 && cores.some(c => c.bg === '#ffffff') ? { color: '#222222' } : { color: '#fff', textShadowColor: '#000a', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                    {dia.getDate()}
                  </Text>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: cor1.bg, borderWidth: cor1.bg === '#ffffff' ? 1 : 0, borderColor: '#ccc' }]}>
                  <Text style={[styles.badgeText, { color: cor1.text }]}>{dia.getDate()}</Text>
                </View>
              )}
            </View>

            {!!evento.descricao && <Text style={styles.cardDescricao}>{evento.descricao}</Text>}
            {!!evento.leituras && <Text style={styles.cardMeta}>{evento.leituras}</Text>}
            {!!evento.observacoes && <Text style={styles.cardMeta}>{evento.observacoes}</Text>}
          </View>
        );
      })}
    </>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const createStyles = (COLORS: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },

  navBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },

  /* Seletores mês/ano/ir */
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
  },
  selectorText: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '700', color: COLORS.text },
  selectorArrow: { fontSize: 9, color: COLORS.textSecondary, marginLeft: 4 },
  irBtn: {
    backgroundColor: COLORS.navbar,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  irBtnText: { color: '#fff', fontFamily: FONTS.sans, fontWeight: '700', fontSize: 13 },

  /* Anterior / Hoje / Próximo */
  navBtns: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  navBtn: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  navBtnText: { fontFamily: FONTS.sans, fontSize: 13, fontWeight: '700', color: COLORS.text },
  navBtnHoje: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  navBtnHojeText: { color: '#fff' },

  weekLabel: {
    fontFamily: FONTS.sans, fontWeight: '700', fontSize: 13,
    color: COLORS.textSecondary, textAlign: 'center',
  },

  /* Acessos rápidos: Loja / Apoiar — barra fixa acima do rodapé */
  acessosRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  acessoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: COLORS.navbar, borderRadius: 999, paddingVertical: 12,
  },
  acessoBtnApoiar: {
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  acessoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14 },
  acessoTxtApoiar: { color: COLORS.primary },

  /* Lista */
  list: { padding: 12, gap: 12 },

  /* Card */
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    borderLeftWidth: 5,
    padding: 14, shadowColor: '#3a2a1f', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardToday: { shadowOpacity: 0.16, elevation: 5, borderWidth: 1.5, borderColor: COLORS.primary },
  hojeSelo: { alignSelf: 'flex-start', backgroundColor: COLORS.primary, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 2, marginBottom: 6 },
  hojeSeloTxt: { color: '#fff', fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, fontFamily: FONTS.sans },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardTitulo: {
    flex: 1, fontSize: 15, fontWeight: '700',
    fontFamily: FONTS.sans, color: COLORS.text, lineHeight: 21,
  },
  badge: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  badgeFatia: { position: 'absolute', top: 0, bottom: 0 },
  badgeText: { fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15, zIndex: 1 },
  cardDescricao: {
    fontSize: 14, fontFamily: FONTS.sans, color: COLORS.text, lineHeight: 21, marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary, lineHeight: 19, marginTop: 3,
  },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    width: 220, maxHeight: 320,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  modalItem: { height: 44, justifyContent: 'center', paddingHorizontal: 20 },
  modalItemActive: { backgroundColor: COLORS.navbar },
  modalItemText: { fontFamily: FONTS.sans, fontSize: 15, color: COLORS.text },
  modalItemTextActive: { color: '#fff', fontWeight: '700' },

  semDados: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, fontSize: 14, lineHeight: 20, paddingHorizontal: 12 },

  /* Estados */
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  loadingText: { fontFamily: FONTS.sans, fontStyle: 'italic', color: COLORS.textSecondary, fontSize: 15 },
  errorText: { color: COLORS.error, fontFamily: FONTS.sans, fontSize: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.navbar, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
});
