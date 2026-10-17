import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../../components/AppText';
import ConfirmarModal from '../../components/ConfirmarModal';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import {
  apagarAudio, carregarProgramas, guardarAudio, guardarProgramas, MOMENTOS, novoId, textoParaPartilhar,
  todasAsEscolhas, type Escolha, type Momento, type Programa,
} from '../../utils/programasMissa';
import CanticoProprio from './CanticoProprio';
import EscolherCantico from './EscolherCantico';
import LeitorCantico from './LeitorCantico';

type Sub =
  | null
  | { tipo: 'escolher'; momento: Momento }
  | { tipo: 'proprio'; momento: Momento; editar?: Extract<Escolha, { tipo: 'proprio' }> }
  | { tipo: 'ler'; escolha: Escolha };

// "Eu › Programas da Missa": o utilizador monta um ou mais programas de cânticos para a celebração.
export default function ProgramasMissaScreen({ onVoltar }: { onVoltar: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  // Programa novo ainda por guardar: só entra na lista quando o utilizador escreve ou adiciona algo.
  const [rascunho, setRascunho] = useState<Programa | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [confirmar, setConfirmar] = useState<{ titulo: string; mensagem: string; rotulo: string; acao: () => void } | null>(null);

  useEffect(() => {
    carregarProgramas().then(l => { programasRef.current = l; setProgramas(l); setCarregado(true); });
  }, []);

  // Referência sempre actual, para várias alterações seguidas não se perderem umas às outras.
  const programasRef = useRef<Programa[]>([]);

  const aplicar = useCallback((fn: (l: Programa[]) => Programa[]) => {
    const nova = fn(programasRef.current);
    programasRef.current = nova;
    setProgramas(nova);
    guardarProgramas(nova).catch(() => Alert.alert('Programas', 'Não foi possível guardar as alterações.'));
  }, []);

  const guardado = programas.find(p => p.id === abertoId) ?? null;
  const aberto = guardado ?? (rascunho && rascunho.id === abertoId ? rascunho : null);
  const ehNovo = !!aberto && !guardado;

  const alterarAberto = (fn: (p: Programa) => Programa) => {
    if (guardado) {
      aplicar(l => l.map(p => (p.id === abertoId ? fn(p) : p)));
    } else if (rascunho) {
      const novo = fn(rascunho);   // primeira alteração: o programa passa a existir
      setRascunho(null);
      aplicar(l => [novo, ...l]);
    }
  };

  const fecharPrograma = () => { setAbertoId(null); setRascunho(null); };

  /* ── ações sobre programas ── */
  const criar = () => {
    const p: Programa = { id: novoId(), titulo: 'Novo programa', celebracao: '', criadoEm: Date.now(), itens: {} };
    setRascunho(p);
    setAbertoId(p.id);
  };

  const duplicar = async (p: Programa) => {
    // As gravações são copiadas, para apagar uma cópia não afectar a outra.
    const itens: Programa['itens'] = {};
    for (const m of MOMENTOS) {
      const lista = p.itens[m];
      if (!lista) continue;
      itens[m] = await Promise.all(lista.map(async e => {
        if (e.tipo === 'proprio' && e.audioUri) {
          const copia = await guardarAudio(e.audioUri).catch(() => undefined);
          return { ...e, id: novoId(), audioUri: copia };
        }
        return { ...e, id: novoId() };
      }));
    }
    aplicar(l => [{ ...p, id: novoId(), titulo: `${p.titulo} (cópia)`, criadoEm: Date.now(), itens }, ...l]);
  };

  const eliminar = (p: Programa) => {
    setConfirmar({
      titulo: 'Eliminar programa',
      mensagem: `Eliminar "${p.titulo || 'Sem título'}"? As gravações próprias deste programa também são apagadas.`,
      rotulo: 'Eliminar',
      acao: async () => {
        await Promise.all(todasAsEscolhas(p).map(e => (e.tipo === 'proprio' ? apagarAudio(e.audioUri) : Promise.resolve())));
        aplicar(l => l.filter(x => x.id !== p.id));
        setAbertoId(atual => (atual === p.id ? null : atual));
        setRascunho(null);
      },
    });
  };

  const partilhar = (p: Programa) => {
    Share.share({ message: textoParaPartilhar(p), title: p.titulo }).catch(() => {});
  };

  /* ── ações sobre cânticos de um programa ── */
  const adicionar = (momento: Momento, e: Escolha) =>
    alterarAberto(p => ({ ...p, itens: { ...p.itens, [momento]: [...(p.itens[momento] ?? []), e] } }));

  const substituir = (momento: Momento, e: Escolha) =>
    alterarAberto(p => ({ ...p, itens: { ...p.itens, [momento]: (p.itens[momento] ?? []).map(x => (x.id === e.id ? e : x)) } }));

  const mover = (momento: Momento, indice: number, delta: -1 | 1) =>
    alterarAberto(p => {
      const lista = [...(p.itens[momento] ?? [])];
      const destino = indice + delta;
      if (destino < 0 || destino >= lista.length) return p;
      [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
      return { ...p, itens: { ...p.itens, [momento]: lista } };
    });

  const remover = (momento: Momento, e: Escolha) => {
    setConfirmar({
      titulo: 'Remover cântico',
      mensagem: `Remover "${e.titulo}" do programa?`,
      rotulo: 'Remover',
      acao: async () => {
        if (e.tipo === 'proprio') await apagarAudio(e.audioUri);
        alterarAberto(p => ({ ...p, itens: { ...p.itens, [momento]: (p.itens[momento] ?? []).filter(x => x.id !== e.id) } }));
      },
    });
  };

  /* ── sub-ecrãs ── */
  if (sub?.tipo === 'escolher') {
    const momento = sub.momento;
    return (
      <EscolherCantico
        momento={momento}
        onCancelar={() => setSub(null)}
        onEscolher={c => { adicionar(momento, { id: novoId(), tipo: 'app', ...c }); setSub(null); }}
      />
    );
  }
  if (sub?.tipo === 'proprio') {
    const momento = sub.momento;
    const editar = sub.editar;
    return (
      <CanticoProprio
        momento={momento}
        inicial={editar}
        onCancelar={() => setSub(null)}
        onGuardar={c => { if (editar) substituir(momento, c); else adicionar(momento, c); setSub(null); }}
      />
    );
  }
  if (sub?.tipo === 'ler') {
    return <LeitorCantico escolha={sub.escolha} onFechar={() => setSub(null)} />;
  }

  /* ── um programa aberto ── */
  if (aberto) {
    const total = todasAsEscolhas(aberto).length;
    return (
      <KeyboardAvoidingView style={styles.ecra} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.barra}>
          <TouchableOpacity style={styles.voltar} onPress={fecharPrograma} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            <Text style={styles.voltarTxt}>Programas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => partilhar(aberto)} style={styles.acaoIcone} accessibilityLabel="Partilhar programa" disabled={!total}>
            <Ionicons name="share-outline" size={22} color={total ? COLORS.primary : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
          <View style={styles.dados}>
            <Text style={styles.rotulo}>TÍTULO DO PROGRAMA</Text>
            <View style={styles.campo}>
              <TextInput
                style={styles.campoInput}
                value={aberto.titulo}
                onChangeText={v => alterarAberto(p => ({ ...p, titulo: v }))}
                placeholder="Ex.: Missa de domingo"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Ionicons name="pencil-outline" size={17} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.rotulo}>CELEBRAÇÃO</Text>
            <View style={styles.campo}>
              <TextInput
                style={styles.campoInput}
                value={aberto.celebracao}
                onChangeText={v => alterarAberto(p => ({ ...p, celebracao: v }))}
                placeholder="Ex.: XXVII Domingo do Tempo Comum, 4 de outubro"
                placeholderTextColor={COLORS.textSecondary}
              />
              <Ionicons name="pencil-outline" size={17} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.dica}>As alterações guardam-se automaticamente.</Text>
          </View>

          {MOMENTOS.map(momento => {
            const lista = aberto.itens[momento] ?? [];
            return (
              <View key={momento} style={styles.momento}>
                <Text style={styles.momentoNome}>{momento}</Text>

                {lista.map((e, indice) => (
                  <View key={e.id} style={styles.item}>
                    <TouchableOpacity style={styles.itemPrincipal} onPress={() => setSub({ tipo: 'ler', escolha: e })} activeOpacity={0.7}>
                      <Ionicons
                        name={e.tipo === 'app' ? 'musical-notes-outline' : e.audioUri ? 'mic-outline' : 'create-outline'}
                        size={18}
                        color={COLORS.primary}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitulo}>{e.titulo}</Text>
                        <Text style={styles.itemSub}>{e.tipo === 'app' ? 'Cântico da Ndatava' : 'Cântico próprio'}</Text>
                      </View>
                    </TouchableOpacity>
                    {lista.length > 1 && (
                      <View style={styles.ordem}>
                        <TouchableOpacity onPress={() => mover(momento, indice, -1)} disabled={indice === 0} hitSlop={{ top: 6, bottom: 2, left: 8, right: 8 }} accessibilityLabel="Subir">
                          <Ionicons name="chevron-up" size={18} color={indice === 0 ? COLORS.border : COLORS.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => mover(momento, indice, 1)} disabled={indice === lista.length - 1} hitSlop={{ top: 2, bottom: 6, left: 8, right: 8 }} accessibilityLabel="Descer">
                          <Ionicons name="chevron-down" size={18} color={indice === lista.length - 1 ? COLORS.border : COLORS.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    )}
                    {e.tipo === 'proprio' && (
                      <TouchableOpacity onPress={() => setSub({ tipo: 'proprio', momento, editar: e })} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Editar">
                        <Ionicons name="pencil-outline" size={19} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => remover(momento, e)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Remover">
                      <Ionicons name="trash-outline" size={19} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.adicionar}>
                  <TouchableOpacity style={styles.adicionarBtn} onPress={() => setSub({ tipo: 'escolher', momento })} activeOpacity={0.8}>
                    <Ionicons name="add" size={17} color={COLORS.primary} />
                    <Text style={styles.adicionarTxt}>Da Ndatava</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.adicionarBtn} onPress={() => setSub({ tipo: 'proprio', momento })} activeOpacity={0.8}>
                    <Ionicons name="add" size={17} color={COLORS.primary} />
                    <Text style={styles.adicionarTxt}>Cântico próprio</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {ehNovo ? (
            <Text style={styles.dicaNovo}>Este programa só é guardado quando escrever ou adicionar um cântico. Se sair agora, não fica guardado.</Text>
          ) : (
            <TouchableOpacity style={styles.eliminarPrograma} onPress={() => eliminar(aberto)} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={19} color={COLORS.error} />
              <Text style={styles.eliminarProgramaTxt}>Eliminar este programa</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar?.titulo ?? ''}
        mensagem={confirmar?.mensagem ?? ''}
        rotuloConfirmar={confirmar?.rotulo ?? ''}
        perigoso
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => { const acao = confirmar?.acao; setConfirmar(null); acao?.(); }}
      />
      </KeyboardAvoidingView>
    );
  }

  /* ── lista de programas ── */
  return (
    <View style={styles.ecra}>
      <TouchableOpacity style={[styles.voltar, { padding: 16 }]} onPress={onVoltar} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        <Text style={styles.voltarTxt}>Voltar</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.corpo}>
        <Text style={styles.titulo}>Programas da Missa</Text>
        <Text style={styles.intro}>
          Monte os cânticos de cada momento da celebração, com cânticos da Ndatava ou os seus, e guarde quantos programas quiser. Ficam só neste telemóvel.
        </Text>

        <TouchableOpacity style={styles.novo} onPress={criar} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.novoTxt}>Novo programa</Text>
        </TouchableOpacity>

        {carregado && programas.length === 0 && (
          <Text style={styles.vazio}>Ainda não tem programas. Toque em "Novo programa" para começar.</Text>
        )}

        {programas.map(p => {
          const n = todasAsEscolhas(p).length;
          return (
            <View key={p.id} style={styles.cartao}>
              <TouchableOpacity style={styles.cartaoPrincipal} onPress={() => setAbertoId(p.id)} activeOpacity={0.75}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartaoTitulo}>{p.titulo || 'Sem título'}</Text>
                  {!!p.celebracao && <Text style={styles.cartaoSub} numberOfLines={2}>{p.celebracao}</Text>}
                  <Text style={styles.cartaoMeta}>{n === 1 ? '1 cântico' : `${n} cânticos`}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <View style={styles.cartaoAcoes}>
                <TouchableOpacity style={styles.acaoTxt} onPress={() => setAbertoId(p.id)} activeOpacity={0.7}>
                  <Ionicons name="create-outline" size={17} color={COLORS.primary} />
                  <Text style={[styles.acaoLabel, { color: COLORS.primary }]}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acaoTxt} onPress={() => duplicar(p)} activeOpacity={0.7}>
                  <Ionicons name="copy-outline" size={17} color={COLORS.textSecondary} />
                  <Text style={styles.acaoLabel}>Duplicar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acaoTxt} onPress={() => eliminar(p)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={17} color={COLORS.error} />
                  <Text style={[styles.acaoLabel, { color: COLORS.error }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar?.titulo ?? ''}
        mensagem={confirmar?.mensagem ?? ''}
        rotuloConfirmar={confirmar?.rotulo ?? ''}
        perigoso
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => { const acao = confirmar?.acao; setConfirmar(null); acao?.(); }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  barra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 12 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14 },
  voltarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  acaoIcone: { padding: 8 },
  corpo: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  titulo: { fontSize: 26, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  intro: { fontSize: 14, lineHeight: 21, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  novo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14, marginTop: 4,
  },
  novoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
  vazio: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 12 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOW.card },
  cartaoPrincipal: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  cartaoTitulo: { fontSize: 17, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  cartaoSub: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary, marginTop: 2 },
  cartaoMeta: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.primary, marginTop: 6 },
  cartaoAcoes: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 18, paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border,
  },
  acaoTxt: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  acaoLabel: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.textSecondary },
  dados: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 6, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 4 },
  campo: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12,
  },
  campoInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans },
  dica: { fontSize: 12, fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 4 },
  ordem: { alignItems: 'center', gap: 2 },
  dicaNovo: { textAlign: 'center', fontSize: 13, lineHeight: 19, fontStyle: 'italic', fontFamily: FONTS.sans, color: COLORS.textSecondary, marginTop: 8 },
  eliminarPrograma: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8,
    paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.error,
  },
  eliminarProgramaTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.error },
  momento: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: 14, gap: 8, ...SHADOW.card },
  momentoNome: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONTS.sans, color: COLORS.textSecondary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  itemPrincipal: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitulo: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  itemSub: { fontSize: 12, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  adicionar: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 2 },
  adicionarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border,
  },
  adicionarTxt: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.primary },
});
