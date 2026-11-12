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
// "domingo, 15 de novembro de 2026" → só a primeira letra em maiúscula (em português "de" fica minúsculo).
function dataPorExtenso(dia: Date): string {
  const texto = dia.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
const SEPARADOR_LEITURAS = '\n\nLEITURAS NA ÍNTEGRA\n';
const SEPARADOR_LEITURAS_TOLERANTE = /\n{2}LEITURAS NA [^\r\n]{0,2}NTEGRA\r?\n/i;

function separarLeituras(leituras: string) {
  const encontrado = leituras.includes(SEPARADOR_LEITURAS)
    ? { index: leituras.indexOf(SEPARADOR_LEITURAS), texto: SEPARADOR_LEITURAS }
    : (() => {
      const correspondencia = SEPARADOR_LEITURAS_TOLERANTE.exec(leituras);
      return correspondencia && { index: correspondencia.index, texto: correspondencia[0] };
    })();
  if (!encontrado) return { resumo: leituras.trim(), integra: '' };
  return {
    resumo: leituras.slice(0, encontrado.index).trim(),
    integra: leituras.slice(encontrado.index + encontrado.texto.length).trim(),
  };
}

function formatarTextoLeitura(texto: string) {
  const linhas = texto.split('\n');
  type SegmentoLeitura = {
    texto: string;
    tipo: 'texto' | 'citacao' | 'salmo-titulo' | 'salmo-refrao' | 'salmo-verso' | 'leitura-titulo' | 'leitura-fonte';
    citacao: boolean;
    etiqueta?: string;
    referencia?: string;
  };
  const segmentos: SegmentoLeitura[] = [];
  const iniciosLinha: number[] = [];
  let offset = 0;
  for (const linha of linhas) {
    iniciosLinha.push(offset);
    offset += linha.length + 1;
  }

  const adicionar = (inicio: number, fim: number, tipo: 'texto' | 'citacao' | 'salmo-titulo' | 'salmo-refrao' | 'salmo-verso' | 'leitura-fonte') => {
    const conteudo = texto.slice(inicio, fim).trim();
    if (conteudo) segmentos.push({ texto: conteudo, tipo, citacao: tipo === 'citacao' });
  };
  const eInicioSecao = (linha: string) => /^(LEITURA(?:\s|$)|EVANGELHO(?:\s|$)|SALMO RESPONSORIAL\b|ACLAMAÇÃO(?:\s|$)|ACLAMACAO(?:\s|$))/i.test(linha.trim());
  let cursor = 0;
  let linhaAnterior = '';

  for (let i = 0; i < linhas.length; i += 1) {
    const linha = linhas[i];
    const tituloLeitura = /^(LEITURA\s+(?:I{1,3}|IV|V|VI|VII|[1-7]))(?:\s+(.+))?$/i.exec(linha.trim());
    if (tituloLeitura) {
      adicionar(cursor, iniciosLinha[i], 'texto');
      segmentos.push({
        texto: linha.trim(),
        tipo: 'leitura-titulo',
        citacao: false,
        etiqueta: tituloLeitura[1],
        referencia: tituloLeitura[2] || '',
      });
      cursor = iniciosLinha[i] + linha.length;
      linhaAnterior = linha.trim();
      continue;
    }

    if (/^(?:Leitura\s+(?:do|da|de)\b|Evangelho de Nosso Senhor\b)/i.test(linha.trim())) {
      adicionar(cursor, iniciosLinha[i], 'texto');
      adicionar(iniciosLinha[i], iniciosLinha[i] + linha.length, 'leitura-fonte');
      cursor = iniciosLinha[i] + linha.length;
      linhaAnterior = linha.trim();
      continue;
    }

    if (/^SALMO RESPONSORIAL\b/i.test(linha.trim())) {
      adicionar(cursor, iniciosLinha[i], 'texto');
      let fimTitulo = i + 1;
      while (fimTitulo < linhas.length && !/^\s*Refr[aã]o:/i.test(linhas[fimTitulo]) && !eInicioSecao(linhas[fimTitulo])) fimTitulo += 1;
      adicionar(iniciosLinha[i], fimTitulo < linhas.length ? iniciosLinha[fimTitulo] : texto.length, 'salmo-titulo');
      cursor = fimTitulo < linhas.length ? iniciosLinha[fimTitulo] : texto.length;

      if (fimTitulo < linhas.length && /^\s*Refr[aã]o:/i.test(linhas[fimTitulo])) {
        let fimRefrao = fimTitulo + 1;
        while (fimRefrao < linhas.length && !eInicioSecao(linhas[fimRefrao])
          && (!linhas[fimRefrao].trim() || /^\s/.test(linhas[fimRefrao]))) fimRefrao += 1;
        const fim = fimRefrao > fimTitulo + 1
          ? iniciosLinha[fimRefrao - 1] + linhas[fimRefrao - 1].length
          : iniciosLinha[fimTitulo] + linhas[fimTitulo].length;
        adicionar(iniciosLinha[fimTitulo], fim, 'salmo-refrao');
        cursor = fim;

        let linhaVerso = fimRefrao;
        while (linhaVerso < linhas.length && !eInicioSecao(linhas[linhaVerso])) {
          if (!linhas[linhaVerso].trim()) {
            linhaVerso += 1;
            continue;
          }
          const inicioEstrofe = linhaVerso;
          let linhasEstrofe = 0;
          while (linhaVerso < linhas.length && !eInicioSecao(linhas[linhaVerso])) {
            if (linhas[linhaVerso].trim()) linhasEstrofe += 1;
            linhaVerso += 1;
            if (linhasEstrofe === 2) break;
          }
          const fimEstrofe = iniciosLinha[linhaVerso - 1] + linhas[linhaVerso - 1].length;
          adicionar(iniciosLinha[inicioEstrofe], fimEstrofe, 'salmo-verso');
          cursor = fimEstrofe;
        }

        i = linhaVerso - 1;
        linhaAnterior = linhas[i]?.trim() ?? '';
        continue;
      }

      i = fimTitulo - 1;
      linhaAnterior = linhas[i]?.trim() ?? '';
      continue;
    }

    const inicioCitacao = /^[«“"]/.test(linha.trim())
      && /^(LEITURA(?:\s|$)|SALMO(?:\s|$)|EVANGELHO(?:\s|$)|ACLAMAÇÃO(?:\s|$)|ACLAMACAO(?:\s|$))/i.test(linhaAnterior);

    if (inicioCitacao) {
      let fimCitacao = i;
      while (fimCitacao < linhas.length && !/[»”"]/.test(linhas[fimCitacao])) fimCitacao += 1;
      if (fimCitacao < linhas.length) {
        const inicio = iniciosLinha[i];
        const fim = iniciosLinha[fimCitacao] + linhas[fimCitacao].length;
        adicionar(cursor, inicio, 'texto');
        adicionar(inicio, fim, 'citacao');
        cursor = fim;
        i = fimCitacao;
        linhaAnterior = linhas[fimCitacao].trim();
        continue;
      }
    } else if (linha.trim()) {
      linhaAnterior = linha.trim();
    }
  }

  adicionar(cursor, texto.length, 'texto');
  if (!segmentos.length) segmentos.push({ texto, tipo: 'texto', citacao: false });
  return segmentos;
}

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
  const [diaSelecionado, setDiaSelecionado] = useState<{ dia: Date; eventos: Evento[] } | null>(null);

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
      setEventos(await getEventosJanela(inicio, true));
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
                onSelect={() => setDiaSelecionado({ dia, eventos: evs })}
              />
            );
          })}
        </ScrollView>
      )}

      {/* ── Acesso rápido à Loja — fixo, acima do rodapé ── */}
      <View style={styles.acessosRow}>
        <TouchableOpacity
          style={styles.acessoBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Mais', { screen: 'Loja' })}
        >
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.acessoTxt}>Loja</Text>
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

      <Modal
        visible={diaSelecionado !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDiaSelecionado(null)}
      >
        <View style={styles.readingModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDiaSelecionado(null)}
            accessibilityRole="button"
            accessibilityLabel="Fechar leituras"
          />
          <View style={styles.readingModal}>
            <View style={styles.readingModalHeader}>
              <View style={styles.readingModalHeading}>
                <Text style={styles.readingModalDate}>
                  {diaSelecionado ? dataPorExtenso(diaSelecionado.dia) : ''}
                </Text>
                <Text style={styles.readingModalTitle}>Leituras litúrgicas</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDiaSelecionado(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar leituras"
                style={styles.readingModalClose}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.readingModalContent}>
              {diaSelecionado?.eventos.map(evento => {
                const { integra, resumo } = separarLeituras(evento.leituras ?? '');
                return (
                  <View key={evento.id} style={styles.readingEvent}>
                    <Text style={styles.readingEventTitle}>{evento.titulo}</Text>
                    {!!evento.descricao && <Text style={styles.readingEventDescription}>{evento.descricao}</Text>}
                    {integra
                      ? formatarTextoLeitura(integra).map((segmento, indice) => (
                        segmento.tipo === 'leitura-titulo'
                          ? <View key={indice} style={styles.readingTitleRow}>
                              <Text style={styles.readingTitleLabel}>{segmento.etiqueta}</Text>
                              {!!segmento.referencia && <Text style={styles.readingTitleReference}>{segmento.referencia}</Text>}
                            </View>
                          : <Text
                              key={indice}
                              style={[
                                styles.readingBody,
                                indice > 0 && styles.readingBodyFollowing,
                                segmento.citacao && styles.readingQuote,
                                segmento.tipo === 'leitura-fonte' && styles.readingSource,
                                segmento.tipo === 'salmo-titulo' && styles.readingPsalmTitle,
                                segmento.tipo === 'salmo-refrao' && styles.readingPsalmRefrain,
                                segmento.tipo === 'salmo-verso' && styles.readingPsalmVerse,
                              ]}
                            >
                              {segmento.texto}
                            </Text>
                      ))
                      : <Text style={styles.readingBody}>
                        {resumo ? 'O texto integral desta leitura ainda não está disponível.' : 'Não há leituras registadas para este dia.'}
                      </Text>}
                    {!!evento.observacoes && <Text style={styles.readingEventDescription}>{evento.observacoes}</Text>}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Card de evento ────────────────────────────────────────────────────────────
function DiaCard({ dia, eventos, isToday, onSelect }: {
  dia: Date;
  eventos: Evento[];
  isToday: boolean;
  onSelect: () => void;
}) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const nomeDia = DIAS_SEMANA[dia.getDay()];

  if (eventos.length === 0) {
    return (
      <View style={[styles.card, { borderColor: COLORS.border }, isToday && styles.cardToday]}>
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
          <TouchableOpacity
            key={evento.id}
            style={[styles.card, isToday ? styles.cardToday : { borderColor: cor1.border }, { borderLeftColor: cor1.border }]}
            onPress={onSelect}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Ver as leituras de ${evento.titulo}`}
          >
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
            {!!evento.leituras && (
              <Text style={styles.cardMeta}>{separarLeituras(evento.leituras).resumo}</Text>
            )}
            {!!evento.observacoes && <Text style={styles.cardMeta}>{evento.observacoes}</Text>}
          </TouchableOpacity>
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

  /* Acesso rápido à Loja — barra fixa acima do rodapé */
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
  acessoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14 },

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

  readingModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end',
  },
  readingModal: {
    maxHeight: '88%', backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden',
  },
  readingModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  readingModalHeading: { flex: 1, gap: 3 },
  readingModalDate: {
    color: COLORS.textSecondary, fontFamily: FONTS.sans, fontSize: 13,
  },
  readingModalTitle: { color: COLORS.text, fontFamily: FONTS.sans, fontSize: 18, fontWeight: '700' },
  readingModalClose: { padding: 6, marginLeft: 8 },
  readingModalContent: { padding: 18, paddingBottom: 32 },
  readingEvent: { marginBottom: 22 },
  readingEventTitle: {
    color: COLORS.text, fontFamily: FONTS.sans, fontSize: 16, fontWeight: '700', lineHeight: 23,
  },
  readingEventDescription: {
    color: COLORS.textSecondary, fontFamily: FONTS.sans, fontSize: 14, lineHeight: 21, marginTop: 8,
  },
  readingBody: {
    color: COLORS.text, fontFamily: FONTS.display, fontSize: 16, lineHeight: 24, marginTop: 12,
  },
  readingBodyFollowing: { marginTop: 0 },
  readingTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    marginTop: 16, marginBottom: 6,
  },
  readingTitleLabel: {
    color: '#c0392b', fontFamily: FONTS.display, fontSize: 16,
  },
  readingTitleReference: {
    flexShrink: 1, color: '#c0392b', fontFamily: FONTS.display, fontSize: 16, textAlign: 'right',
  },
  readingSource: {
    color: COLORS.text, fontFamily: FONTS.display, fontSize: 20, lineHeight: 27, marginTop: 8, marginBottom: 4,
  },
  readingQuote: {
    color: '#c0392b', fontStyle: 'italic', textAlign: 'center', marginVertical: 10,
  },
  readingPsalmTitle: {
    color: '#c0392b', fontWeight: '700', marginTop: 16, marginBottom: 8,
  },
  readingPsalmRefrain: {
    color: '#c0392b', fontWeight: '700', marginTop: 0, marginBottom: 12,
  },
  readingPsalmVerse: { marginTop: 0, marginBottom: 8 },

  semDados: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, fontSize: 14, lineHeight: 20, paddingHorizontal: 12 },

  /* Estados */
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  loadingText: { fontFamily: FONTS.sans, fontStyle: 'italic', color: COLORS.textSecondary, fontSize: 15 },
  errorText: { color: COLORS.error, fontFamily: FONTS.sans, fontSize: 16, textAlign: 'center' },
  retryBtn: { backgroundColor: COLORS.navbar, paddingHorizontal: 26, paddingVertical: 12, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
});
