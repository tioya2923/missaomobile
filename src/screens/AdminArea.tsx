import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { formatarPreco, labelMoeda } from '../constants/moeda';
import { labelMetodoPagamento } from '../constants/metodosPagamento';
import { useLojaAuth } from '../context/useLojaAuth';
import client from '../api/client';
import {
  RECURSOS, getRecurso, getGrupos, type RecursoConfig, type CampoRecurso,
} from '../constants/resourcesConfig';
import { listarRecurso, criarRecurso, atualizarRecurso, eliminarRecurso } from '../api/adminResource';
import {
  getLojasAdmin, moderarLoja, eliminarLoja, type LojaAdmin,
  getEncomendasAdmin, atualizarEstadoEncomendaAdmin, eliminarEncomendaAdmin, type EncomendaAdmin,
  getResumoVendas, enviarLembreteApoioAgora, type ResumoVendas,
} from '../api/adminMarketplace';

type Vista = 'hub' | 'recurso' | 'lojas' | 'encomendas' | 'vendas';

const ESTADOS = ['Pendente', 'Confirmada', 'Enviada', 'Cancelada'];
const CORES_ESTADO: Record<string, string> = {
  Pendente: '#b45309', Confirmada: '#1976d2', Enviada: '#2e7d32', Cancelada: '#b71c1c',
};

function respostaErro(e: unknown, fallback: string): string {
  const dados = (e as { response?: { data?: unknown } })?.response?.data;
  return typeof dados === 'string' ? dados : fallback;
}

// ── Cabeçalho reutilizável ───────────────────────────────────────────────

function CabecalhoAdmin({ onVoltar, acao }: { onVoltar: () => void; acao?: React.ReactNode }) {
  return (
    <View style={styles.painelHeader}>
      <TouchableOpacity style={styles.voltarBtn} onPress={onVoltar} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        <Text style={styles.voltarTxt}>Voltar</Text>
      </TouchableOpacity>
      {acao}
    </View>
  );
}

// ── Ecrã principal ───────────────────────────────────────────────────────
// Área nativa de administração — replica o que existe no site (/admin), para
// o gestor geral não precisar de sair da app.

export default function AdminArea({ onVoltar }: { onVoltar: () => void }) {
  const { nome, logout } = useLojaAuth();
  const [vista, setVista] = useState<Vista>('hub');
  const [recursoKey, setRecursoKey] = useState<string | null>(null);

  const sair = () => {
    Alert.alert('Sair', 'Terminar sessão de administrador?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { logout(); } },
    ]);
  };

  const abrirRecurso = (key: string) => { setRecursoKey(key); setVista('recurso'); };
  const voltarAoHub = () => { setVista('hub'); setRecursoKey(null); };

  if (vista === 'lojas') return <AdminLojasScreen onVoltar={voltarAoHub} />;
  if (vista === 'encomendas') return <AdminEncomendasScreen onVoltar={voltarAoHub} />;
  if (vista === 'vendas') return <AdminVendasScreen onVoltar={voltarAoHub} />;
  if (vista === 'recurso' && recursoKey) return <AdminResourceCrud recursoKey={recursoKey} onVoltar={voltarAoHub} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={styles.abaContainer} showsVerticalScrollIndicator={false}>
      <CabecalhoAdmin
        onVoltar={onVoltar}
        acao={<TouchableOpacity onPress={sair} activeOpacity={0.7}><Text style={styles.linkTxtForte}>Sair</Text></TouchableOpacity>}
      />
      <Text style={styles.titulo}>Administração</Text>
      <Text style={styles.subtitulo}>{nome}</Text>

      {getGrupos().map((g) => (
        <View key={g.nome} style={styles.grupoWrap}>
          <Text style={styles.grupoTitulo}>{g.nome}</Text>
          <View style={styles.card}>
            {g.itens.map((item, i) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.grupoItem, i < g.itens.length - 1 && styles.grupoItemSep]}
                onPress={() => (item.ehExtra ? setVista(item.key as Vista) : abrirRecurso(item.key))}
                activeOpacity={0.7}
              >
                <Text style={styles.grupoItemTxt}>{item.titulo}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ── CRUD genérico (Apoio, Calendário, Cânticos, Catecismo) ──────────────

interface OpcaoRef { valor: string | number; label: string }

function CampoRecursoInput({
  campo, valor, onChange, opcoes, excluirId,
}: {
  campo: CampoRecurso; valor: unknown; onChange: (v: unknown) => void;
  opcoes?: Record<string, unknown>[]; excluirId?: number | null;
}) {
  if (campo.tipo === 'boolean') {
    return (
      <View style={styles.linhaSwitch}>
        <Text style={[styles.label, { flex: 1, textTransform: 'none' }]}>{campo.label}</Text>
        <Switch value={!!valor} onValueChange={onChange} trackColor={{ false: COLORS.border, true: COLORS.navbar }} thumbColor="#fff" />
      </View>
    );
  }

  if (campo.tipo === 'textarea') {
    return (
      <View style={styles.campo}>
        <Text style={styles.label}>{campo.label}</Text>
        <TextInput
          style={[styles.input, styles.inputMultilinha]}
          value={typeof valor === 'string' ? valor : ''}
          onChangeText={onChange}
          multiline
          numberOfLines={campo.linhas || 4}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
    );
  }

  if (campo.tipo === 'select') {
    const opcoesLista: OpcaoRef[] = campo.opcoesEstaticas
      ? campo.opcoesEstaticas.map((o) => ({ valor: o.valor, label: o.label }))
      : (opcoes || [])
          .filter((o) => !(campo.excluirProprio && excluirId != null && o[campo.opcoes!.valor] === excluirId))
          .map((o) => ({ valor: o[campo.opcoes!.valor] as string | number, label: String(o[campo.opcoes!.label]) }));

    return (
      <View style={styles.campo}>
        <Text style={styles.label}>{campo.label}</Text>
        <View style={styles.chipsWrap}>
          {!campo.obrigatorio && (
            <TouchableOpacity
              style={[styles.chip, (valor === '' || valor == null) && styles.chipOn]}
              onPress={() => onChange('')} activeOpacity={0.8}
            >
              <Text style={[styles.chipTxt, (valor === '' || valor == null) && styles.chipTxtOn]}>— Nenhum —</Text>
            </TouchableOpacity>
          )}
          {opcoesLista.map((o) => (
            <TouchableOpacity
              key={String(o.valor)}
              style={[styles.chip, String(valor) === String(o.valor) && styles.chipOn]}
              onPress={() => onChange(o.valor)} activeOpacity={0.8}
            >
              <Text style={[styles.chipTxt, String(valor) === String(o.valor) && styles.chipTxtOn]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{campo.label}</Text>
      <TextInput
        style={styles.input}
        value={valor != null ? String(valor) : ''}
        onChangeText={onChange}
        placeholder={campo.tipo === 'date' ? 'AAAA-MM-DD' : undefined}
        placeholderTextColor={COLORS.textSecondary}
        keyboardType={campo.tipo === 'number' ? 'decimal-pad' : 'default'}
        autoCapitalize={campo.tipo === 'date' ? 'none' : 'sentences'}
      />
    </View>
  );
}

function valorInicialDoCampo(campo: CampoRecurso): unknown {
  if (campo.valorInicial !== undefined) return campo.valorInicial;
  if (campo.tipo === 'boolean') return false;
  if (campo.tipo === 'number') return 0;
  return '';
}

function AdminResourceCrud({ recursoKey, onVoltar }: { recursoKey: string; onVoltar: () => void }) {
  const recurso = useMemo(() => getRecurso(recursoKey), [recursoKey]);
  const [itens, setItens] = useState<Record<string, unknown>[]>([]);
  const [opcoesPorCampo, setOpcoesPorCampo] = useState<Record<string, Record<string, unknown>[]>>({});
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aEditar, setAEditar] = useState<'nova' | number | null>(null);
  const [rascunho, setRascunho] = useState<Record<string, unknown>>({});
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);

  const camposSelectEndpoint = useMemo(
    () => (recurso ? recurso.campos.filter((c) => c.tipo === 'select' && c.opcoes?.endpoint) : []),
    [recurso],
  );

  const carregar = useCallback(async () => {
    if (!recurso) return;
    setLoading(true);
    setErro(null);
    try {
      const [lista, ...opcoesResultados] = await Promise.all([
        listarRecurso(recurso.api.list),
        ...camposSelectEndpoint.map((c) => client.get(c.opcoes!.endpoint).then((r) => r.data)),
      ]);
      setItens(lista);
      const mapa: Record<string, Record<string, unknown>[]> = {};
      camposSelectEndpoint.forEach((c, i) => { mapa[c.nome] = opcoesResultados[i]; });
      setOpcoesPorCampo(mapa);
    } catch {
      setErro('Não foi possível carregar o conteúdo.');
    } finally {
      setLoading(false);
    }
  }, [recurso, camposSelectEndpoint]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!recurso) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>Tipo de conteúdo desconhecido.</Text>
      </View>
    );
  }

  const iniciarNova = () => {
    const r: Record<string, unknown> = {};
    for (const c of recurso.campos) r[c.nome] = valorInicialDoCampo(c);
    setRascunho(r);
    setErroForm(null);
    setAEditar('nova');
  };

  const iniciarEdicao = (item: Record<string, unknown>) => {
    const r: Record<string, unknown> = {};
    for (const c of recurso.campos) {
      if (c.tipo === 'date') r[c.nome] = item[c.nome] ? String(item[c.nome]).slice(0, 10) : '';
      else r[c.nome] = item[c.nome] ?? valorInicialDoCampo(c);
    }
    setRascunho(r);
    setErroForm(null);
    setAEditar(item.id as number);
  };

  const construirPayload = () => {
    const payload: Record<string, unknown> = {};
    for (const c of recurso.campos) {
      let v = rascunho[c.nome];
      if (c.tipo === 'number') v = Number(v) || 0;
      if (c.tipo === 'select' && !c.opcoesEstaticas) v = v === '' || v == null ? null : Number(v);
      if (typeof v === 'string') v = v.trim();
      if (v === '' && !c.obrigatorio) v = null;
      payload[c.nome] = v;
    }
    return payload;
  };

  const guardar = async () => {
    for (const c of recurso.campos) {
      if (c.obrigatorio) {
        const v = rascunho[c.nome];
        if (v === '' || v === null || v === undefined) {
          setErroForm(`Preencha o campo "${c.label}".`);
          return;
        }
      }
    }
    setAGuardar(true);
    setErroForm(null);
    try {
      const payload = construirPayload();
      if (aEditar === 'nova') await criarRecurso(recurso.api.base, payload);
      else await atualizarRecurso(recurso.api.base, aEditar as number, { ...payload, id: aEditar });
      setAEditar(null);
      await carregar();
    } catch (e) {
      setErroForm(respostaErro(e, 'Não foi possível guardar.'));
    } finally {
      setAGuardar(false);
    }
  };

  const remover = (item: Record<string, unknown>) => {
    const label = (item[recurso.tituloCampo] as string) || `#${item.id}`;
    Alert.alert('Eliminar', `Eliminar "${label}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await eliminarRecurso(recurso.api.base, item.id as number); await carregar(); }
          catch { Alert.alert('Erro', 'Não foi possível eliminar.'); }
        },
      },
    ]);
  };

  const valorRef = (item: Record<string, unknown>, colRefCampo: string) => {
    const id = item[colRefCampo];
    if (id === null || id === undefined) return '—';
    const campo = recurso.campos.find((c) => c.nome === colRefCampo);
    const opcoes = opcoesPorCampo[colRefCampo] || [];
    const match = opcoes.find((o) => o[campo!.opcoes!.valor] === id);
    return match ? String(match[campo!.opcoes!.label]) : '—';
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}>
      <ScrollView contentContainerStyle={styles.abaContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CabecalhoAdmin
          onVoltar={onVoltar}
          acao={<TouchableOpacity style={styles.btnPrimarioPequeno} onPress={iniciarNova} activeOpacity={0.85}><Text style={styles.btnPrimarioPequenoTxt}>+ Novo</Text></TouchableOpacity>}
        />
        <Text style={styles.titulo}>{recurso.titulo}</Text>
        <Text style={styles.subtitulo}>{recurso.grupo}</Text>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        {aEditar !== null && (
          <View style={styles.card}>
            <Text style={styles.secaoTitulo}>{aEditar === 'nova' ? `Novo — ${recurso.titulo}` : `Editar — ${recurso.titulo}`}</Text>
            {erroForm && <Text style={styles.erro}>{erroForm}</Text>}
            {recurso.campos.map((c) => (
              <CampoRecursoInput
                key={c.nome}
                campo={c}
                valor={rascunho[c.nome]}
                onChange={(v) => setRascunho((r) => ({ ...r, [c.nome]: v }))}
                opcoes={opcoesPorCampo[c.nome]}
                excluirId={c.excluirProprio && aEditar !== 'nova' ? (aEditar as number) : null}
              />
            ))}
            <View style={styles.formAcoes}>
              <TouchableOpacity style={[styles.btnSecundario, styles.formAcoesBtn]} onPress={() => setAEditar(null)} activeOpacity={0.8}>
                <Text style={styles.btnSecundarioTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnPrimario, styles.formAcoesBtn]} onPress={guardar} disabled={aGuardar} activeOpacity={0.85}>
                {aGuardar ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimarioTxt}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />
        ) : itens.length === 0 ? (
          <Text style={styles.vazio}>Ainda não existe conteúdo aqui.</Text>
        ) : (
          itens.map((item) => (
            <View key={item.id as number} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                {recurso.colunas.map((col, i) => {
                  const texto = col.ref ? valorRef(item, col.ref) : col.formatar ? col.formatar(item[col.campo]) : String(item[col.campo] ?? '—');
                  return i === 0
                    ? <Text key={col.campo} style={styles.itemTitulo}>{texto}</Text>
                    : <Text key={col.campo} style={styles.itemDescMuted}>{col.label}: {texto}</Text>;
                })}
              </View>
              <View style={{ gap: 8 }}>
                <TouchableOpacity style={styles.btnSecundarioPequeno} onPress={() => iniciarEdicao(item)} activeOpacity={0.8}>
                  <Text style={styles.btnSecundarioPequenoTxt}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPerigoPequeno} onPress={() => remover(item)} activeOpacity={0.8}>
                  <Text style={styles.btnPerigoPequenoTxt}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Lojas parceiras ──────────────────────────────────────────────────────

function AdminLojasScreen({ onVoltar }: { onVoltar: () => void }) {
  const [lojas, setLojas] = useState<LojaAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setLojas(await getLojasAdmin()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const moderar = async (loja: LojaAdmin, alteracoes: Partial<Pick<LojaAdmin, 'aprovada' | 'ativa'>>) => {
    try {
      await moderarLoja(loja.id, { aprovada: loja.aprovada, ativa: loja.ativa, ...alteracoes });
      setLojas((lista) => lista.map((l) => (l.id === loja.id ? { ...l, ...alteracoes } : l)));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a loja.');
    }
  };

  const remover = (loja: LojaAdmin) => {
    Alert.alert('Eliminar loja', `Eliminar "${loja.nome}"? Só é possível se não tiver produtos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await eliminarLoja(loja.id); await carregar(); }
          catch (e) { Alert.alert('Erro', respostaErro(e, 'Não foi possível eliminar.')); }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={styles.abaContainer} showsVerticalScrollIndicator={false}>
      <CabecalhoAdmin onVoltar={onVoltar} />
      <Text style={styles.titulo}>Lojas parceiras</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />
      ) : lojas.length === 0 ? (
        <Text style={styles.vazio}>Ainda não há lojas registadas.</Text>
      ) : (
        lojas.map((l) => (
          <View key={l.id} style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                <Text style={styles.itemTitulo}>{l.nome}</Text>
                <View style={[styles.badge, { backgroundColor: l.aprovada ? '#e8f5e9' : '#fff3e0' }]}>
                  <Text style={[styles.badgeTxt, { color: l.aprovada ? '#2e7d32' : '#e65100' }]}>{l.aprovada ? 'Aprovada' : 'Pendente'}</Text>
                </View>
                {!l.ativa && (
                  <View style={[styles.badge, { backgroundColor: COLORS.border }]}>
                    <Text style={[styles.badgeTxt, { color: COLORS.textSecondary }]}>Pausada</Text>
                  </View>
                )}
              </View>
              <Text style={styles.itemDescMuted}>{l.email}{l.telefone ? ` · ${l.telefone}` : ''}</Text>
              <Text style={styles.itemDescMuted}>{l.morada}{l.categoria ? ` · ${l.categoria}` : ''} · {labelMoeda(l.moeda)}</Text>
              <Text style={styles.itemDescMuted}>
                Pagamento: {l.formasPagamento?.length > 0 ? l.formasPagamento.map((f) => labelMetodoPagamento(f.metodo)).join(', ') : 'nenhuma forma definida ainda'}
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {!l.aprovada && (
                <TouchableOpacity style={styles.btnSecundarioPequeno} onPress={() => moderar(l, { aprovada: true })} activeOpacity={0.8}>
                  <Text style={styles.btnSecundarioPequenoTxt}>Aprovar</Text>
                </TouchableOpacity>
              )}
              {l.aprovada && (
                <TouchableOpacity style={styles.btnSecundarioPequeno} onPress={() => moderar(l, { ativa: !l.ativa })} activeOpacity={0.8}>
                  <Text style={styles.btnSecundarioPequenoTxt}>{l.ativa ? 'Pausar' : 'Reativar'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.btnPerigoPequeno} onPress={() => remover(l)} activeOpacity={0.8}>
                <Text style={styles.btnPerigoPequenoTxt}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── Todas as encomendas ──────────────────────────────────────────────────

function AdminEncomendasScreen({ onVoltar }: { onVoltar: () => void }) {
  const [encomendas, setEncomendas] = useState<EncomendaAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setEncomendas(await getEncomendasAdmin()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const mudarEstado = async (enc: EncomendaAdmin, estado: string) => {
    try {
      await atualizarEstadoEncomendaAdmin(enc.id, estado);
      setEncomendas((lista) => lista.map((e) => (e.id === enc.id ? { ...e, estado } : e)));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o estado.');
    }
  };

  const remover = (enc: EncomendaAdmin) => {
    Alert.alert('Eliminar encomenda', `Eliminar a encomenda #${enc.id} de ${enc.nomeCliente}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await eliminarEncomendaAdmin(enc.id); await carregar(); }
          catch { Alert.alert('Erro', 'Não foi possível eliminar.'); }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={styles.abaContainer} showsVerticalScrollIndicator={false}>
      <CabecalhoAdmin onVoltar={onVoltar} />
      <Text style={styles.titulo}>Todas as encomendas</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />
      ) : encomendas.length === 0 ? (
        <Text style={styles.vazio}>Ainda não existem encomendas.</Text>
      ) : (
        encomendas.map((enc) => (
          <View key={enc.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>#{enc.id} — {enc.nomeCliente}</Text>
                <Text style={styles.itemDescMuted}>Loja: {enc.lojaNome}</Text>
                <Text style={styles.itemDescMuted}>{enc.contacto}{enc.morada ? ` · ${enc.morada}` : ''}</Text>
                <Text style={styles.itemDescMuted}>{new Date(enc.data).toLocaleString('pt-PT')}</Text>
                {enc.observacoes && <Text style={styles.itemDescMuted}>Obs.: {enc.observacoes}</Text>}
              </View>
              <View style={[styles.badge, { backgroundColor: `${CORES_ESTADO[enc.estado]}20` }]}>
                <Text style={[styles.badgeTxt, { color: CORES_ESTADO[enc.estado] }]}>{enc.estado}</Text>
              </View>
            </View>

            <View style={styles.itensSep}>
              {enc.itens.map((item, i) => (
                <View key={i} style={styles.itemLinha}>
                  <Text style={styles.itemDesc}>{item.quantidade}× {item.produtoNome}</Text>
                  <Text style={styles.itemDesc}>{formatarPreco(item.precoUnitario * item.quantidade, enc.moeda)}</Text>
                </View>
              ))}
              <View style={styles.itemLinha}>
                <Text style={styles.totalTxt}>Total (100% para a loja — sem comissão)</Text>
                <Text style={styles.totalTxt}>{formatarPreco(enc.total, enc.moeda)}</Text>
              </View>
            </View>

            <View style={styles.chipsWrap}>
              {ESTADOS.map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[styles.chip, enc.estado === estado && { backgroundColor: CORES_ESTADO[estado], borderColor: CORES_ESTADO[estado] }]}
                  onPress={() => mudarEstado(enc, estado)} activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, enc.estado === estado && styles.chipTxtOn]}>{estado}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.btnPerigoPequeno, { marginTop: 10, alignSelf: 'flex-start' }]} onPress={() => remover(enc)} activeOpacity={0.8}>
              <Text style={styles.btnPerigoPequenoTxt}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── Vendas das lojas ─────────────────────────────────────────────────────

function AdminVendasScreen({ onVoltar }: { onVoltar: () => void }) {
  const [resumo, setResumo] = useState<ResumoVendas | null>(null);
  const [loading, setLoading] = useState(true);
  const [aEnviar, setAEnviar] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setResumo(await getResumoVendas()); } finally { setLoading(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const enviarAgora = () => {
    Alert.alert('Enviar lembrete', 'Enviar já, a todas as lojas aprovadas e ativas, o email a pedir apoio voluntário?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar', onPress: async () => {
          setAEnviar(true);
          setMensagem(null);
          try {
            const data = await enviarLembreteApoioAgora();
            setMensagem(`Enviado a ${data.enviados} loja${data.enviados !== 1 ? 's' : ''} (referente a ${data.referenteA}).`);
          } catch {
            setMensagem('Não foi possível enviar o lembrete.');
          } finally {
            setAEnviar(false);
          }
        },
      },
    ]);
  };

  const totaisPorMoeda = useMemo(() => {
    if (!resumo) return [] as [string, number][];
    const mapa = new Map<string, number>();
    for (const l of resumo.lojas) mapa.set(l.moeda, (mapa.get(l.moeda) ?? 0) + Number(l.totalVendido));
    return Array.from(mapa.entries());
  }, [resumo]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.background }} contentContainerStyle={styles.abaContainer} showsVerticalScrollIndicator={false}>
      <CabecalhoAdmin onVoltar={onVoltar} />
      <Text style={styles.titulo}>Vendas das lojas</Text>

      <View style={[styles.aviso, styles.avisoInfo]}>
        <Text style={styles.avisoInfoTxt}>
          A Ndatava não cobra comissão — perto do fim de cada mês, envia-se automaticamente um email a
          todas as lojas a pedir uma doação voluntária. Pode disparar já, manualmente, para testar.
        </Text>
        <TouchableOpacity style={[styles.btnPrimario, { marginTop: 10 }]} onPress={enviarAgora} disabled={aEnviar} activeOpacity={0.85}>
          {aEnviar ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimarioTxt}>Enviar agora</Text>}
        </TouchableOpacity>
      </View>
      {mensagem && <Text style={styles.sucesso}>{mensagem}</Text>}

      {loading ? (
        <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />
      ) : !resumo || resumo.lojas.length === 0 ? (
        <Text style={styles.vazio}>Ainda não há encomendas registadas.</Text>
      ) : (
        <>
          <View style={[styles.aviso, styles.avisoOk]}>
            <Text style={[styles.itemTitulo, { marginBottom: 8 }]}>Total vendido, por moeda</Text>
            {totaisPorMoeda.map(([moeda, total]) => (
              <View key={moeda} style={styles.itemLinha}>
                <Text style={styles.avisoOkTxt}>{moeda}</Text>
                <Text style={[styles.avisoOkTxt, { fontWeight: '700' }]}>{formatarPreco(total, moeda)}</Text>
              </View>
            ))}
          </View>

          {resumo.lojas.map((l) => (
            <View key={l.lojaId} style={styles.itemCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>{l.lojaNome}</Text>
                <Text style={styles.itemDescMuted}>{l.numeroEncomendas} encomenda{l.numeroEncomendas !== 1 ? 's' : ''}</Text>
              </View>
              <Text style={styles.itemTitulo}>{formatarPreco(l.totalVendido, l.moeda)}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },

  painelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voltarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  voltarTxt: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },
  linkTxtForte: { fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.serif },

  titulo: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginTop: 8 },
  subtitulo: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 4, marginBottom: 16 },

  erro: { color: COLORS.error, fontFamily: FONTS.serif, fontSize: 13, marginBottom: 12 },
  sucesso: { color: '#2e7d32', fontFamily: FONTS.serif, fontSize: 13, marginBottom: 12 },

  abaContainer: { padding: 16, paddingBottom: 48, backgroundColor: COLORS.background },

  grupoWrap: { marginBottom: 20 },
  grupoTitulo: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  grupoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16 },
  grupoItemSep: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  grupoItemTxt: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },

  card: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginBottom: 4 },
  campo: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  inputMultilinha: { minHeight: 90, textAlignVertical: 'top' },

  btnPrimario: {
    backgroundColor: COLORS.navbar, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', minHeight: 50,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 2,
  },
  btnPrimarioTxt: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: FONTS.serif, letterSpacing: 0.2 },
  btnSecundario: {
    borderWidth: 1.5, borderColor: COLORS.borderDark, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', minHeight: 50, backgroundColor: COLORS.surface,
  },
  btnSecundarioTxt: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, letterSpacing: 0.2 },
  formAcoesBtn: { flex: 1 },
  formAcoes: { flexDirection: 'row', gap: 10, marginTop: 4 },

  btnPrimarioPequeno: { backgroundColor: COLORS.navbar, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  btnPrimarioPequenoTxt: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.serif },
  btnSecundarioPequeno: { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  btnSecundarioPequenoTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  btnPerigoPequeno: { borderWidth: 1, borderColor: COLORS.error, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  btnPerigoPequenoTxt: { fontSize: 12, fontWeight: '600', color: COLORS.error, fontFamily: FONTS.serif },

  vazio: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', marginTop: 24 },

  itemCard: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  itemTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginBottom: 2 },
  itemDesc: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.serif },
  itemDescMuted: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 2 },

  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.serif },

  itensSep: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 10, paddingTop: 10, marginBottom: 12 },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalTxt: { fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginTop: 4 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 13 },
  chipOn: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },
  chipTxtOn: { color: '#fff' },

  linhaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },

  aviso: { borderRadius: 10, padding: 14, marginBottom: 16 },
  avisoOk: { backgroundColor: '#e8f5e9' },
  avisoOkTxt: { color: '#2e7d32', fontFamily: FONTS.serif, fontSize: 13, lineHeight: 19 },
  avisoInfo: { backgroundColor: '#eef4fc' },
  avisoInfoTxt: { color: '#1c4a7a', fontFamily: FONTS.serif, fontSize: 13, lineHeight: 19 },
});
