import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const ACT_KEY = '@lombembwa_actividades';

type Modo = 'som' | 'vibrar' | 'som_vibrar' | 'silencio';

/* ── Lembrete simples (com data opcional) ── */
type Lembrete = {
  ativo: boolean;
  hora: string; minuto: string;
  dia: string;  mes: string;  ano: string;
  modo: Modo;
};

/* ── Lembrete por dia da semana (Missa) ── */
type LembreteDia = { ativo: boolean; hora: string; minuto: string; modo: Modo };
type DiaSemana   = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
type LembreteMissa = Record<DiaSemana, LembreteDia>;

type LembreteOutro = Lembrete & { id: string; titulo: string };
type ChaveFixa = 'manha' | 'tarde' | 'noite' | 'ensaios' | 'reunioes';

type Dados = {
  manha: Lembrete; tarde: Lembrete; noite: Lembrete;
  missa: LembreteMissa;
  ensaios: Lembrete; reunioes: Lembrete;
  outros: LembreteOutro[];
};

/* ── Constantes ── */
const FIXOS: { chave: ChaveFixa; label: string; icone: string }[] = [
  { chave: 'manha',    label: 'Oração da Manhã',  icone: 'sunny-outline' },
  { chave: 'tarde',    label: 'Oração da Tarde',  icone: 'partly-sunny-outline' },
  { chave: 'noite',    label: 'Oração da Noite',  icone: 'moon-outline' },
  { chave: 'ensaios',  label: 'Ensaios',           icone: 'musical-notes-outline' },
  { chave: 'reunioes', label: 'Reuniões',          icone: 'people-outline' },
];

const DIAS: { chave: DiaSemana; label: string }[] = [
  { chave: 'domingo', label: 'Domingo' },
  { chave: 'segunda', label: 'Segunda-feira' },
  { chave: 'terca',   label: 'Terça-feira' },
  { chave: 'quarta',  label: 'Quarta-feira' },
  { chave: 'quinta',  label: 'Quinta-feira' },
  { chave: 'sexta',   label: 'Sexta-feira' },
  { chave: 'sabado',  label: 'Sábado' },
];

const MODOS: { valor: Modo; label: string; icone: string }[] = [
  { valor: 'som',        label: 'Som',          icone: 'volume-high-outline' },
  { valor: 'vibrar',     label: 'Vibrar',       icone: 'phone-portrait-outline' },
  { valor: 'som_vibrar', label: 'Som + Vibrar', icone: 'notifications-outline' },
  { valor: 'silencio',   label: 'Silêncio',     icone: 'volume-mute-outline' },
];

/* ── Valores por defeito ── */
const lembreteVazio  = (): Lembrete    => ({ ativo: false, hora: '', minuto: '', dia: '', mes: '', ano: '', modo: 'som' });
const lembreteDiaVazio = (): LembreteDia => ({ ativo: false, hora: '', minuto: '', modo: 'som' });
const missaVazia     = (): LembreteMissa => ({
  domingo: lembreteDiaVazio(), segunda: lembreteDiaVazio(), terca:  lembreteDiaVazio(),
  quarta:  lembreteDiaVazio(), quinta:  lembreteDiaVazio(), sexta:  lembreteDiaVazio(),
  sabado:  lembreteDiaVazio(),
});
const dadosVazios = (): Dados => ({
  manha: lembreteVazio(), tarde: lembreteVazio(), noite: lembreteVazio(),
  missa: missaVazia(),
  ensaios: lembreteVazio(), reunioes: lembreteVazio(),
  outros: [],
});

/* ── Verificação de disparos ── */
function lembreteDisparou(l: Lembrete, agora: Date): boolean {
  if (!l.ativo || !l.hora || !l.minuto) return false;
  const hh = parseInt(l.hora, 10), mm = parseInt(l.minuto, 10);
  if (isNaN(hh) || isNaN(mm)) return false;
  if (agora.getHours() !== hh || agora.getMinutes() !== mm) return false;
  if (l.dia && l.mes && l.ano) {
    if (agora.getDate()        !== parseInt(l.dia, 10) ||
        agora.getMonth() + 1   !== parseInt(l.mes, 10) ||
        agora.getFullYear()    !== parseInt(l.ano, 10)) return false;
  }
  return true;
}
function missaDisparou(m: LembreteMissa, agora: Date): string | null {
  const diaIdx = agora.getDay(); // 0=Dom … 6=Sáb
  const { chave, label } = DIAS[diaIdx];
  const l = m[chave];
  if (!l.ativo || !l.hora || !l.minuto) return null;
  const hh = parseInt(l.hora, 10), mm = parseInt(l.minuto, 10);
  if (isNaN(hh) || isNaN(mm)) return null;
  return agora.getHours() === hh && agora.getMinutes() === mm ? `Missa — ${label}` : null;
}

/* ── Validação ── */
function validarLembrete(l: Lembrete, titulo: string): string | null {
  if (!l.ativo) return null;
  if (!l.hora || !l.minuto) return `${titulo}: preencha a hora e os minutos.`;
  const hh = parseInt(l.hora, 10), mm = parseInt(l.minuto, 10);
  if (isNaN(hh) || hh < 0 || hh > 23) return `${titulo}: hora "${l.hora}" inválida — use 00 a 23.`;
  if (isNaN(mm) || mm < 0 || mm > 59) return `${titulo}: minutos "${l.minuto}" inválidos — use 00 a 59.`;
  const temAlgum = l.dia || l.mes || l.ano;
  if (temAlgum) {
    if (!l.dia || !l.mes || !l.ano) return `${titulo}: preencha o dia, o mês e o ano, ou deixe a data em branco.`;
    const dd = parseInt(l.dia, 10), mes = parseInt(l.mes, 10), ano = parseInt(l.ano, 10);
    const anoAtual = new Date().getFullYear();
    if (isNaN(dd)  || dd  < 1 || dd  > 31) return `${titulo}: dia "${l.dia}" inválido — use 01 a 31.`;
    if (isNaN(mes) || mes < 1 || mes > 12) return `${titulo}: mês "${l.mes}" inválido — use 01 a 12.`;
    if (isNaN(ano) || ano < anoAtual || ano > anoAtual + 10) return `${titulo}: ano "${l.ano}" inválido — use ${anoAtual} a ${anoAtual + 10}.`;
    const dt = new Date(ano, mes - 1, dd);
    if (dt.getDate() !== dd || dt.getMonth() !== mes - 1 || dt.getFullYear() !== ano)
      return `${titulo}: ${String(dd).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${ano} não existe no calendário.`;
    if (new Date(ano, mes - 1, dd, hh, mm) <= new Date()) return `${titulo}: a data e hora já passaram.`;
  }
  return null;
}
function validarMissa(m: LembreteMissa): string | null {
  for (const { chave, label } of DIAS) {
    const l = m[chave];
    if (!l.ativo) continue;
    if (!l.hora || !l.minuto) return `Missa — ${label}: preencha a hora e os minutos.`;
    const hh = parseInt(l.hora, 10), mm = parseInt(l.minuto, 10);
    if (isNaN(hh) || hh < 0 || hh > 23) return `Missa — ${label}: hora "${l.hora}" inválida — use 00 a 23.`;
    if (isNaN(mm) || mm < 0 || mm > 59) return `Missa — ${label}: minutos "${l.minuto}" inválidos — use 00 a 59.`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MinhasActividadesScreen({ onVoltar }: { onVoltar: () => void }) {

  const [dados,         setDados]         = useState<Dados>(dadosVazios());
  const [expandido,     setExpandido]     = useState<string | null>(null);
  const [rascunho,      setRascunho]      = useState<(Lembrete | LembreteOutro) | null>(null);
  const [rascunhoMissa, setRascunhoMissa] = useState<LembreteMissa | null>(null);
  const [novoOutro,     setNovoOutro]     = useState<LembreteOutro | null>(null);

  const scrollRef   = useRef<ScrollView>(null);
  const cardY       = useRef<Partial<Record<string, number>>>({});
  const dadosRef    = useRef<Dados>(dadosVazios());
  const ultimaChave = useRef('');

  useEffect(() => { dadosRef.current = dados; }, [dados]);

  /* ── carregar + verificação periódica ── */
  useEffect(() => {
    AsyncStorage.getItem(ACT_KEY).then(raw => {
      if (raw) try {
        const parsed = JSON.parse(raw);
        // Garantir que missa tem todos os dias (compatibilidade com dados antigos)
        if (!parsed.missa) parsed.missa = missaVazia();
        else DIAS.forEach(d => { if (!parsed.missa[d.chave]) parsed.missa[d.chave] = lembreteDiaVazio(); });
        setDados(parsed);
      } catch {}
    });

    const tick = () => {
      const agora = new Date();
      const chave = `${agora.getHours()}:${agora.getMinutes()}`;
      if (chave === ultimaChave.current) return;
      ultimaChave.current = chave;
      const d = dadosRef.current;
      const disparados: string[] = [];
      FIXOS.forEach(f => { if (lembreteDisparou(d[f.chave], agora)) disparados.push(f.label); });
      const dm = missaDisparou(d.missa, agora);
      if (dm) disparados.push(dm);
      d.outros.forEach(o => { if (lembreteDisparou(o, agora)) disparados.push(o.titulo || 'Lembrete'); });
      if (disparados.length) Alert.alert('🔔 Lembrete', disparados.join('\n'), [{ text: 'OK' }]);
    };
    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── scroll ao abrir card ── */
  useEffect(() => {
    if (!expandido) return;
    const t = setTimeout(() => {
      const y = cardY.current[expandido];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
    }, 150);
    return () => clearTimeout(t);
  }, [expandido]);

  const persistir = async (d: Dados) => {
    await AsyncStorage.setItem(ACT_KEY, JSON.stringify(d));
    setDados(d);
  };

  const updR = (patch: Partial<Lembrete & LembreteOutro>) =>
    setRascunho(r => r ? { ...r, ...patch } : r);

  const updMissa = (dia: DiaSemana, patch: Partial<LembreteDia>) =>
    setRascunhoMissa(m => m ? { ...m, [dia]: { ...m[dia], ...patch } } : m);

  const fechar = () => { setExpandido(null); setRascunho(null); setRascunhoMissa(null); setNovoOutro(null); };

  const abrir = (id: string, lembrete: Lembrete | LembreteOutro) => {
    if (expandido === id) { fechar(); return; }
    setExpandido(id); setRascunho({ ...lembrete }); setRascunhoMissa(null); setNovoOutro(null);
  };
  const abrirMissa = () => {
    if (expandido === 'missa') { fechar(); return; }
    setExpandido('missa'); setRascunhoMissa({ ...dados.missa }); setRascunho(null); setNovoOutro(null);
  };

  /* ── guardar fixo ── */
  const guardarFixo = async (chave: ChaveFixa) => {
    if (!rascunho) return;
    const r    = rascunho as Lembrete;
    const label = FIXOS.find(f => f.chave === chave)!.label;
    const erro = validarLembrete(r, label);
    if (erro) { Alert.alert('Dados inválidos', erro); return; }
    await persistir({ ...dados, [chave]: { ...r } });
    fechar();
  };

  /* ── guardar missa ── */
  const guardarMissa = async () => {
    if (!rascunhoMissa) return;
    const erro = validarMissa(rascunhoMissa);
    if (erro) { Alert.alert('Dados inválidos', erro); return; }
    await persistir({ ...dados, missa: rascunhoMissa });
    fechar();
  };

  /* ── guardar outro ── */
  const guardarOutro = async () => {
    if (!rascunho) return;
    const r = rascunho as LembreteOutro;
    if (!r.titulo.trim()) { Alert.alert('Nome obrigatório', 'Dê um nome ao lembrete.'); return; }
    const erro = validarLembrete(r, r.titulo.trim() || 'Lembrete');
    if (erro) { Alert.alert('Dados inválidos', erro); return; }
    const existente = dados.outros.find(o => o.id === r.id);
    const novaLista = existente
      ? dados.outros.map(o => o.id === r.id ? { ...r } : o)
      : [...dados.outros, { ...r }];
    await persistir({ ...dados, outros: novaLista });
    fechar();
  };

  const eliminarOutro = (id: string) =>
    Alert.alert('Eliminar lembrete', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await persistir({ ...dados, outros: dados.outros.filter(o => o.id !== id) });
        if (expandido === id) fechar();
      }},
    ]);

  const adicionarOutro = () => {
    const id = `outro_${Date.now()}`;
    const novo: LembreteOutro = { ...lembreteVazio(), id, titulo: '', ativo: true };
    setNovoOutro(novo); setExpandido(id); setRascunho({ ...novo });
  };

  /* ══════════════════════════════════════════════════════════════════
     Funções de render — chamadas com {} para não desmontarem inputs
  ══════════════════════════════════════════════════════════════════ */

  const renderModos = (modo: Modo, onChange: (m: Modo) => void) => (
    <View style={styles.modosRow}>
      {MODOS.map(m => (
        <TouchableOpacity key={m.valor}
          style={[styles.modoBtn, modo === m.valor && styles.modoBtnOn]}
          onPress={() => onChange(m.valor)}
          activeOpacity={0.7}
        >
          <Ionicons name={m.icone as never} size={14} color={modo === m.valor ? '#fff' : COLORS.text}/>
          <Text style={[styles.modoTxt, modo === m.valor && styles.modoTxtOn]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCampos = (r: Lembrete) => (
    <View style={styles.camposWrap}>
      <Text style={styles.camposLabel}>Hora</Text>
      <View style={styles.horaRow}>
        <TextInput style={styles.inputHH} value={r.hora}
          onChangeText={v => updR({ hora: v.replace(/\D/g,'').slice(0,2) })}
          placeholder="HH" placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric" maxLength={2}/>
        <Text style={styles.doisPontos}>:</Text>
        <TextInput style={styles.inputMM} value={r.minuto}
          onChangeText={v => updR({ minuto: v.replace(/\D/g,'').slice(0,2) })}
          placeholder="MM" placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric" maxLength={2}/>
      </View>
      <Text style={[styles.camposLabel, {marginTop:14}]}>
        Data <Text style={styles.opcionalTxt}>(opcional — sem data repete diariamente)</Text>
      </Text>
      <View style={styles.dataRow}>
        <TextInput style={styles.inputDD} value={r.dia}
          onChangeText={v => updR({ dia: v.replace(/\D/g,'').slice(0,2) })}
          placeholder="DD" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" maxLength={2}/>
        <Text style={styles.barra}>/</Text>
        <TextInput style={styles.inputMM2} value={r.mes}
          onChangeText={v => updR({ mes: v.replace(/\D/g,'').slice(0,2) })}
          placeholder="MM" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" maxLength={2}/>
        <Text style={styles.barra}>/</Text>
        <TextInput style={styles.inputAAAA} value={r.ano}
          onChangeText={v => updR({ ano: v.replace(/\D/g,'').slice(0,4) })}
          placeholder="AAAA" placeholderTextColor={COLORS.textSecondary} keyboardType="numeric" maxLength={4}/>
      </View>
      <Text style={[styles.camposLabel, {marginTop:14}]}>Notificação</Text>
      {renderModos(r.modo, m => updR({ modo: m }))}
    </View>
  );

  const renderAcoes = (onGuardar: () => void) => (
    <View style={styles.actAcoes}>
      <TouchableOpacity style={styles.btnCancelar} onPress={fechar} activeOpacity={0.7}>
        <Text style={styles.btnCancelarTxt}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnGuardar} onPress={onGuardar} activeOpacity={0.8}>
        <Text style={styles.btnGuardarTxt}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCorpo = (r: Lembrete | LembreteOutro, onGuardar: () => void, extraTopo?: React.ReactNode) => (
    <View style={styles.actBody}>
      {extraTopo}
      <View style={styles.ativoRow}>
        <Text style={styles.ativoLabel}>Lembrete activo</Text>
        {renderToggle(r.ativo, v => updR({ ativo: v }))}
      </View>
      {r.ativo && renderCampos(r)}
      {renderAcoes(onGuardar)}
    </View>
  );

  const renderToggle = (ativo: boolean, onChange: (v: boolean) => void) => (
    <TouchableOpacity
      style={[styles.toggle, ativo && styles.toggleOn]}
      onPress={() => onChange(!ativo)}
      activeOpacity={0.8}
    >
      <View style={[styles.toggleThumb, ativo && styles.toggleThumbOn]}/>
    </TouchableOpacity>
  );

  /* ── Card especial da Missa ── */
  const renderCardMissa = () => {
    const aberto = expandido === 'missa';
    const m = aberto && rascunhoMissa ? rascunhoMissa : dados.missa;
    const algumActivo = DIAS.some(d => dados.missa[d.chave].ativo);

    return (
      <View style={styles.actCard} onLayout={e => { cardY.current['missa'] = e.nativeEvent.layout.y; }}>
        <TouchableOpacity style={styles.actHeader} onPress={abrirMissa} activeOpacity={0.75}>
          <View style={styles.actHeaderLeft}>
            <View style={[styles.actIcone, algumActivo && styles.actIconeOn]}>
              <Ionicons name="book-outline" size={20} color={algumActivo ? '#fff' : COLORS.textSecondary}/>
            </View>
            <Text style={styles.actLabel}>Missa</Text>
          </View>
          <View style={styles.actHeaderRight}>
            {algumActivo && (
              <Text style={styles.actHora}>
                {DIAS.filter(d => dados.missa[d.chave].ativo).length}d
              </Text>
            )}
            <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary}/>
          </View>
        </TouchableOpacity>

        {aberto && (
          <View style={styles.actBody}>
            {DIAS.map(({ chave, label }, idx) => {
              const l = m[chave];
              return (
                <View key={chave} style={[styles.diaWrap, idx < DIAS.length - 1 && styles.diaSep]}>
                  {/* Cabeçalho do dia */}
                  <View style={styles.diaHeader}>
                    <Text style={styles.diaLabel}>{label}</Text>
                    {renderToggle(l.ativo, v => updMissa(chave, { ativo: v }))}
                  </View>

                  {/* Campos (só se activo) */}
                  {l.ativo && (
                    <View style={styles.diaCampos}>
                      <View style={styles.horaRow}>
                        <TextInput
                          style={styles.inputHH}
                          value={l.hora}
                          onChangeText={v => updMissa(chave, { hora: v.replace(/\D/g,'').slice(0,2) })}
                          placeholder="HH"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                        <Text style={styles.doisPontos}>:</Text>
                        <TextInput
                          style={styles.inputMM}
                          value={l.minuto}
                          onChangeText={v => updMissa(chave, { minuto: v.replace(/\D/g,'').slice(0,2) })}
                          placeholder="MM"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          maxLength={2}
                        />
                      </View>
                      <View style={{marginTop:10}}>
                        {renderModos(l.modo, v => updMissa(chave, { modo: v }))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
            {renderAcoes(guardarMissa)}
          </View>
        )}
      </View>
    );
  };

  const renderHoraPreview = (l: Lembrete) =>
    l.ativo && l.hora
      ? <Text style={styles.actHora}>{l.hora.padStart(2,'0')}:{l.minuto.padStart(2,'0')}</Text>
      : null;

  /* ══════════════════════════════════════════════════════════════════
     RENDER PRINCIPAL
  ══════════════════════════════════════════════════════════════════ */

  return (
    <View style={styles.ecra}>
      <TouchableOpacity style={styles.voltarBtn} onPress={onVoltar} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text}/>
        <Text style={styles.voltarTxt}>Voltar</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{flex:1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          {/* Aviso */}
          <View style={styles.aviso}>
            <Ionicons name="information-circle-outline" size={16} color="#1d4ed8"/>
            <Text style={styles.avisoTxt}>
              Os lembretes aparecem enquanto a aplicação estiver aberta. Para notificações em segundo plano, instale a aplicação a partir de um build.
            </Text>
          </View>

          {/* ── Lembretes fixos (Manhã, Tarde, Noite) ── */}
          <Text style={styles.secaoTitulo}>Lembretes</Text>

          {FIXOS.slice(0, 3).map(({ chave, label, icone }) => {
            const lembrete = dados[chave];
            const aberto   = expandido === chave;
            const r        = aberto && rascunho ? (rascunho as Lembrete) : lembrete;
            return (
              <View key={chave} style={styles.actCard}
                onLayout={e => { cardY.current[chave] = e.nativeEvent.layout.y; }}>
                <TouchableOpacity style={styles.actHeader}
                  onPress={() => abrir(chave, lembrete)} activeOpacity={0.75}>
                  <View style={styles.actHeaderLeft}>
                    <View style={[styles.actIcone, lembrete.ativo && styles.actIconeOn]}>
                      <Ionicons name={icone as never} size={20}
                        color={lembrete.ativo ? '#fff' : COLORS.textSecondary}/>
                    </View>
                    <Text style={styles.actLabel}>{label}</Text>
                  </View>
                  <View style={styles.actHeaderRight}>
                    {renderHoraPreview(lembrete)}
                    <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary}/>
                  </View>
                </TouchableOpacity>
                {aberto && renderCorpo(r, () => guardarFixo(chave))}
              </View>
            );
          })}

          {/* ── Missa (card especial) ── */}
          {renderCardMissa()}

          {/* ── Ensaios e Reuniões ── */}
          {FIXOS.slice(3).map(({ chave, label, icone }) => {
            const lembrete = dados[chave];
            const aberto   = expandido === chave;
            const r        = aberto && rascunho ? (rascunho as Lembrete) : lembrete;
            return (
              <View key={chave} style={styles.actCard}
                onLayout={e => { cardY.current[chave] = e.nativeEvent.layout.y; }}>
                <TouchableOpacity style={styles.actHeader}
                  onPress={() => abrir(chave, lembrete)} activeOpacity={0.75}>
                  <View style={styles.actHeaderLeft}>
                    <View style={[styles.actIcone, lembrete.ativo && styles.actIconeOn]}>
                      <Ionicons name={icone as never} size={20}
                        color={lembrete.ativo ? '#fff' : COLORS.textSecondary}/>
                    </View>
                    <Text style={styles.actLabel}>{label}</Text>
                  </View>
                  <View style={styles.actHeaderRight}>
                    {renderHoraPreview(lembrete)}
                    <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary}/>
                  </View>
                </TouchableOpacity>
                {aberto && renderCorpo(r, () => guardarFixo(chave))}
              </View>
            );
          })}

          {/* ── Outros lembretes ── */}
          <View style={styles.outrosHeader}>
            <Text style={styles.secaoTitulo}>Outros Lembretes</Text>
            <TouchableOpacity style={styles.addBtn} onPress={adicionarOutro} activeOpacity={0.7}>
              <Ionicons name="add" size={22} color="#fff"/>
            </TouchableOpacity>
          </View>

          {dados.outros.length === 0 && !novoOutro && (
            <Text style={styles.vazioTxt}>Toque em "+" para adicionar um lembrete personalizado.</Text>
          )}

          {dados.outros.map(outro => {
            const aberto = expandido === outro.id;
            const r      = aberto && rascunho ? (rascunho as LembreteOutro) : outro;
            return (
              <View key={outro.id} style={styles.actCard}
                onLayout={e => { cardY.current[outro.id] = e.nativeEvent.layout.y; }}>
                <TouchableOpacity style={styles.actHeader}
                  onPress={() => abrir(outro.id, outro)} activeOpacity={0.75}>
                  <View style={styles.actHeaderLeft}>
                    <View style={[styles.actIcone, outro.ativo && styles.actIconeOn]}>
                      <Ionicons name="alarm-outline" size={20}
                        color={outro.ativo ? '#fff' : COLORS.textSecondary}/>
                    </View>
                    <Text style={styles.actLabel} numberOfLines={1}>
                      {outro.titulo.trim() || 'Lembrete'}
                    </Text>
                  </View>
                  <View style={styles.actHeaderRight}>
                    {renderHoraPreview(outro)}
                    <TouchableOpacity onPress={() => eliminarOutro(outro.id)}
                      hitSlop={{top:8,bottom:8,left:8,right:8}}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.error}/>
                    </TouchableOpacity>
                    <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary}/>
                  </View>
                </TouchableOpacity>
                {aberto && renderCorpo(r, guardarOutro,
                  <TextInput style={styles.inputTitulo}
                    value={(r as LembreteOutro).titulo}
                    onChangeText={v => updR({ titulo: v })}
                    placeholder="Nome do lembrete"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="sentences"/>
                )}
              </View>
            );
          })}

          {/* Novo lembrete em criação */}
          {novoOutro && expandido === novoOutro.id && rascunho && (
            <View style={styles.actCard}
              onLayout={e => { cardY.current[novoOutro.id] = e.nativeEvent.layout.y; }}>
              <View style={styles.actHeader}>
                <View style={styles.actHeaderLeft}>
                  <View style={[styles.actIcone, styles.actIconeOn]}>
                    <Ionicons name="alarm-outline" size={20} color="#fff"/>
                  </View>
                  <Text style={styles.actLabel}>Novo lembrete</Text>
                </View>
              </View>
              {renderCorpo(rascunho as LembreteOutro, guardarOutro,
                <TextInput style={styles.inputTitulo}
                  value={(rascunho as LembreteOutro).titulo}
                  onChangeText={v => updR({ titulo: v })}
                  placeholder="Nome do lembrete"
                  placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="sentences"
                  autoFocus/>
              )}
            </View>
          )}

          <View style={{height:120}}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  ecra:      { flex: 1, backgroundColor: COLORS.background },
  voltarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 },
  voltarTxt: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },
  container: { paddingHorizontal: 16, paddingBottom: 32 },

  aviso:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#dbeafe', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#bfdbfe' },
  avisoTxt: { flex: 1, fontSize: 12, color: '#1e40af', fontFamily: FONTS.serif, lineHeight: 18 },

  secaoTitulo:  { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  outrosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  addBtn:   { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.navbar, alignItems: 'center', justifyContent: 'center' },
  vazioTxt: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', textAlign: 'center', paddingVertical: 24 },

  actCard:       { backgroundColor: COLORS.surface, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  actHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  actHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actHeaderRight:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
  actIcone:      { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  actIconeOn:    { backgroundColor: COLORS.navbar },
  actLabel:      { fontSize: 15, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif, flex: 1 },
  actHora:       { fontSize: 14, color: COLORS.primary, fontFamily: FONTS.serif, fontWeight: '700' },
  actBody:       { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 14, gap: 14 },

  /* Dias da Missa */
  diaWrap:   { gap: 10 },
  diaSep:    { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 14 },
  diaHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  diaLabel:  { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  diaCampos: { gap: 8 },

  ativoRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ativoLabel:{ fontSize: 14, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },

  toggle:        { width: 46, height: 26, borderRadius: 13, backgroundColor: '#adb5bd', justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn:      { backgroundColor: COLORS.navbar },
  toggleThumb:   { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset:{width:0,height:1}, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },

  camposWrap:  { gap: 6 },
  camposLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.5 },
  opcionalTxt: { fontSize: 10, fontWeight: '400', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'none' },

  horaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inputHH:    { width: 64, fontSize: 26, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, borderBottomWidth: 2, borderBottomColor: COLORS.borderDark, paddingVertical: 6, textAlign: 'center' },
  inputMM:    { width: 64, fontSize: 26, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, borderBottomWidth: 2, borderBottomColor: COLORS.borderDark, paddingVertical: 6, textAlign: 'center' },
  doisPontos: { fontSize: 30, color: COLORS.text, fontWeight: '700', fontFamily: FONTS.serif },

  dataRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inputDD:  { width: 46, fontSize: 16, color: COLORS.text, fontFamily: FONTS.serif, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark, paddingVertical: 6, textAlign: 'center' },
  inputMM2: { width: 46, fontSize: 16, color: COLORS.text, fontFamily: FONTS.serif, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark, paddingVertical: 6, textAlign: 'center' },
  inputAAAA:{ width: 68, fontSize: 16, color: COLORS.text, fontFamily: FONTS.serif, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark, paddingVertical: 6, textAlign: 'center' },
  barra:    { fontSize: 18, color: COLORS.textSecondary, fontFamily: FONTS.serif },

  modosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  modoBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  modoBtnOn:{ backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  modoTxt:  { fontSize: 12, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },
  modoTxtOn:{ color: '#fff' },

  inputTitulo: { fontSize: 16, color: COLORS.text, fontFamily: FONTS.serif, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark, paddingVertical: 8 },

  actAcoes:      { flexDirection: 'row', gap: 8 },
  btnCancelar:   { flex: 1, borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnCancelarTxt:{ fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  btnGuardar:    { flex: 2, backgroundColor: COLORS.navbar, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnGuardarTxt: { fontSize: 14, fontWeight: '700', color: '#fff', fontFamily: FONTS.serif },
});
