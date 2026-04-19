import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { getEventosSemana, type Evento } from '../api/calendario';
import { COLORS, FONTS } from '../constants/theme';

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

function parseCores(descricao: string) {
  const parte = descricao.split(/[–\-]/)[0].toLowerCase();
  const nomes = Object.keys(COR_MAP).filter(k => parte.includes(k));
  if (nomes.length === 0) return { cores: [DEFAULT_COR], dupla: false };
  return { cores: nomes.map(n => COR_MAP[n]), dupla: nomes.length >= 2 };
}

// ── Utilitários de data ───────────────────────────────────────────────────────
const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const ANO_MIN = 2020;
const ANO_MAX = 2035;
const ANOS = Array.from({ length: ANO_MAX - ANO_MIN + 1 }, (_, i) => ANO_MIN + i);

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
function weekLabel(inicio: Date): string {
  const fim = addDays(inicio, 6);
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
export default function CalendarioScreen() {
  const today = startOfDay(new Date());

  const [semanaInicio, setSemanaInicio] = useState<Date>(today);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seletores "Ir para"
  const [selMes, setSelMes] = useState<number>(today.getMonth());
  const [selAno, setSelAno] = useState<number>(today.getFullYear());
  const [showMes, setShowMes] = useState(false);
  const [showAno, setShowAno] = useState(false);

  const load = useCallback(async (inicio: Date) => {
    try {
      setLoading(true); setError(null);
      setEventos(await getEventosSemana(inicio));
    } catch {
      setError('Não foi possível carregar os eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(semanaInicio); }, [semanaInicio, load]);

  const irParaData = () => setSemanaInicio(startOfDay(new Date(selAno, selMes, 1)));
  const navSemana = (n: number) => setSemanaInicio(prev => addDays(prev, n));
  const hoje = () => {
    setSemanaInicio(today);
    setSelMes(today.getMonth());
    setSelAno(today.getFullYear());
  };

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semanaInicio, i));

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
          <TouchableOpacity style={styles.navBtn} onPress={() => navSemana(-7)}>
            <Text style={styles.navBtnText}>‹ Anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnHoje]} onPress={hoje}>
            <Text style={[styles.navBtnText, styles.navBtnHojeText]}>Hoje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => navSemana(7)}>
            <Text style={styles.navBtnText}>Próximo ›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.weekLabel}>{weekLabel(semanaInicio)}</Text>
      </View>

      {/* ── Conteúdo ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(semanaInicio)}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {dias.map(dia => {
            const evs = eventos.filter(e => isSameDay(new Date(e.data), dia));
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
  if (eventos.length === 0) return null;

  return (
    <>
      {eventos.map(evento => {
        const { cores, dupla } = parseCores(evento.descricao ?? '');
        const cor1 = cores[0];
        const cor2 = dupla ? cores[1] : null;

        return (
          <View key={evento.id} style={[styles.card, { borderColor: cor1.border }, isToday && styles.cardToday]}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitulo}>{evento.titulo}</Text>

              {dupla && cor2 ? (
                <View style={styles.badge}>
                  <View style={[styles.badgeHalf, { backgroundColor: cor1.bg, borderTopLeftRadius: 19, borderBottomLeftRadius: 19 }]} />
                  <View style={[styles.badgeHalf, { backgroundColor: cor2.bg, borderTopRightRadius: 19, borderBottomRightRadius: 19 }]} />
                  <Text style={[styles.badgeText, { color: '#fff', textShadowColor: '#0005', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
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
const styles = StyleSheet.create({
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
    borderColor: COLORS.borderDark,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: COLORS.background,
  },
  selectorText: { fontFamily: FONTS.serif, fontSize: 13, fontWeight: '700', color: COLORS.text },
  selectorArrow: { fontSize: 9, color: COLORS.textSecondary, marginLeft: 4 },
  irBtn: {
    backgroundColor: COLORS.navbar,
    borderRadius: 4,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  irBtnText: { color: '#fff', fontFamily: FONTS.serif, fontWeight: '700', fontSize: 13 },

  /* Anterior / Hoje / Próximo */
  navBtns: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  navBtn: {
    borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 4,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  navBtnText: { fontFamily: FONTS.serif, fontSize: 13, fontWeight: '700', color: COLORS.text },
  navBtnHoje: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  navBtnHojeText: { color: '#fff' },

  weekLabel: {
    fontFamily: FONTS.serif, fontWeight: '700', fontSize: 13,
    color: COLORS.textSecondary, textAlign: 'center',
  },

  /* Lista */
  list: { padding: 12, gap: 12 },

  /* Card */
  card: {
    backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 2,
    padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  cardToday: { shadowOpacity: 0.18, elevation: 5 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardTitulo: {
    flex: 1, fontSize: 15, fontWeight: '700',
    fontFamily: FONTS.serif, color: COLORS.text, lineHeight: 21,
  },
  badge: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  badgeHalf: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  badgeText: { fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15, zIndex: 1 },
  cardDescricao: {
    fontSize: 14, fontFamily: FONTS.serif, color: COLORS.text, lineHeight: 21, marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13, fontFamily: FONTS.serif, color: COLORS.textSecondary, lineHeight: 19, marginTop: 3,
  },

  /* Modal */
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: COLORS.surface, borderRadius: 10,
    width: 220, maxHeight: 320,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  modalItem: { height: 44, justifyContent: 'center', paddingHorizontal: 20 },
  modalItemActive: { backgroundColor: COLORS.navbar },
  modalItemText: { fontFamily: FONTS.serif, fontSize: 15, color: COLORS.text },
  modalItemTextActive: { color: '#fff', fontWeight: '700' },

  /* Estados */
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  loadingText: { fontFamily: FONTS.serif, fontStyle: 'italic', color: COLORS.textSecondary, fontSize: 15 },
  errorText: { color: COLORS.error, fontFamily: FONTS.serif, fontSize: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.text, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15 },
});
