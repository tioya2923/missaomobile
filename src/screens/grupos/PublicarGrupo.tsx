import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  carregarAudio, editarPublicacao, mensagemDeErro, publicarNoGrupo, type ItemProgramaGrupo, type PublicacaoGrupo, type TipoPublicacao,
} from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import { carregarProgramas, MOMENTOS, type Escolha, type Programa } from '../../utils/programasMissa';

interface Props {
  grupoId: number;
  tipo: TipoPublicacao;
  /** se indicado, edita o título e o texto desta publicação */
  editar?: PublicacaoGrupo;
  onFechar: (publicou: boolean) => void;
}

type Proprio = Extract<Escolha, { tipo: 'proprio' }> & { momento: string };

const NOMES: Record<TipoPublicacao, string> = { aviso: 'Novo aviso', cantico: 'Partilhar cântico', oracao: 'Partilhar oração', programa: 'Partilhar programa' };

export default function PublicarGrupo({ grupoId, tipo, editar, onFechar }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [titulo, setTitulo] = useState(editar?.titulo ?? '');
  const [texto, setTexto] = useState(editar?.texto ?? '');
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaId, setProgramaId] = useState<string | null>(null);
  const [origemId, setOrigemId] = useState<string | null>(null);
  const [momento, setMomento] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [incluirAudio, setIncluirAudio] = useState(true);
  const [aEnviar, setAEnviar] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!editar && (tipo === 'cantico' || tipo === 'programa')) carregarProgramas().then(setProgramas);
  }, [editar, tipo]);

  const proprios = useMemo<Proprio[]>(() => {
    const vistos = new Set<string>();
    const lista: Proprio[] = [];
    for (const p of programas) for (const m of MOMENTOS) for (const e of p.itens[m] ?? []) {
      if (e.tipo === 'proprio' && !vistos.has(e.id)) { vistos.add(e.id); lista.push({ ...e, momento: m }); }
    }
    return lista;
  }, [programas]);

  const programasComItens = programas.filter(p => MOMENTOS.some(m => (p.itens[m] ?? []).length > 0));

  const escolherCantico = (c: Proprio) => {
    setOrigemId(c.id); setTitulo(c.titulo); setTexto(c.letra); setMomento(c.momento);
    setAudioUri(c.audioUri); setIncluirAudio(!!c.audioUri);
  };

  const escolherPrograma = (p: Programa) => {
    setProgramaId(p.id); setTitulo(p.titulo || 'Programa da Missa'); setTexto(p.celebracao);
  };

  const enviar = async () => {
    setErro(null);
    if (!titulo.trim()) { setErro('Escreva o título.'); return; }
    if (editar) {
      try { setAEnviar(true); await editarPublicacao(grupoId, editar.id, titulo.trim(), texto.trim()); onFechar(true); }
      catch (e) { setErro(mensagemDeErro(e)); setAEnviar(false); }
      return;
    }
    if (tipo === 'oracao' && !texto.trim()) { setErro('Escreva o texto da oração.'); return; }
    if (tipo === 'cantico' && !texto.trim() && !(audioUri && incluirAudio)) { setErro('Escreva a letra ou inclua a gravação.'); return; }
    const programa = programas.find(p => p.id === programaId);
    if (tipo === 'programa' && !programa) { setErro('Escolha o programa a partilhar.'); return; }

    try {
      setAEnviar(true);
      if (tipo === 'cantico') {
        let audioId: number | undefined;
        if (audioUri && incluirAudio) { setProgresso('A enviar a gravação…'); audioId = await carregarAudio(audioUri); }
        await publicarNoGrupo(grupoId, { tipo, titulo: titulo.trim(), texto: texto.trim(), momento: momento ?? undefined, audioId });
      } else if (tipo === 'programa' && programa) {
        const itens: ItemProgramaGrupo[] = [];
        const total = MOMENTOS.reduce((n, m) => n + (programa.itens[m] ?? []).filter(e => e.tipo === 'proprio' && e.audioUri).length, 0);
        let feitas = 0;
        for (const m of MOMENTOS) for (const e of programa.itens[m] ?? []) {
          if (e.tipo === 'app') { itens.push({ momento: m, tipo: 'app', titulo: e.titulo, idioma: e.idioma, slug: e.slug }); continue; }
          let audioId: number | undefined;
          if (e.audioUri) { setProgresso(`A enviar gravações (${++feitas}/${total})…`); audioId = await carregarAudio(e.audioUri); }
          itens.push({ momento: m, tipo: 'proprio', titulo: e.titulo, letra: e.letra, audioId });
        }
        await publicarNoGrupo(grupoId, { tipo, titulo: titulo.trim(), texto: texto.trim(), itens });
      } else {
        await publicarNoGrupo(grupoId, { tipo, titulo: titulo.trim(), texto: texto.trim() });
      }
      onFechar(true);
    } catch (e) {
      setErro(mensagemDeErro(e));
      setAEnviar(false);
      setProgresso(null);
    }
  };

  const nomeTela = editar ? 'Editar publicação' : NOMES[tipo];
  const mostrarTexto = !(tipo === 'programa' && !editar);

  return (
    <KeyboardAvoidingView style={styles.ecra} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={() => onFechar(false)} style={styles.fechar} activeOpacity={0.7} accessibilityLabel="Fechar">
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.tituloEcra}>{nomeTela}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
        {!editar && tipo === 'cantico' && (
          <View style={styles.cartao}>
            <Text style={styles.rotulo}>USAR UM DOS MEUS CÂNTICOS</Text>
            {proprios.length === 0 ? (
              <Text style={styles.ajuda}>Não tem cânticos próprios nos seus programas. Pode escrever a letra abaixo.</Text>
            ) : proprios.map(c => (
              <TouchableOpacity key={c.id} style={styles.opcao} onPress={() => escolherCantico(c)} activeOpacity={0.7}>
                <Ionicons name={origemId === c.id ? 'radio-button-on' : 'radio-button-off'} size={21} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.opcaoTxt}>{c.titulo}</Text>
                  <Text style={styles.ajuda}>{c.audioUri ? 'Com gravação' : 'Só letra'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!editar && tipo === 'programa' && (
          <View style={styles.cartao}>
            <Text style={styles.rotulo}>ESCOLHA O PROGRAMA</Text>
            {programasComItens.length === 0 ? (
              <Text style={styles.ajuda}>Ainda não tem programas com cânticos. Crie um em Eu › Programas da Missa.</Text>
            ) : programasComItens.map(p => {
              const n = MOMENTOS.reduce((t, m) => t + (p.itens[m] ?? []).length, 0);
              return (
                <TouchableOpacity key={p.id} style={styles.opcao} onPress={() => escolherPrograma(p)} activeOpacity={0.7}>
                  <Ionicons name={programaId === p.id ? 'radio-button-on' : 'radio-button-off'} size={21} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.opcaoTxt}>{p.titulo || 'Sem título'}</Text>
                    <Text style={styles.ajuda}>{n === 1 ? '1 cântico' : `${n} cânticos`}{p.celebracao ? ` · ${p.celebracao}` : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            <Text style={styles.ajuda}>Os membros recebem os cânticos, as letras dos seus cânticos e as gravações.</Text>
          </View>
        )}

        <View style={styles.cartao}>
          <Text style={styles.rotulo}>{tipo === 'programa' && !editar ? 'TÍTULO DO PROGRAMA' : 'TÍTULO'}</Text>
          <TextInput style={styles.input} value={titulo} onChangeText={setTitulo} maxLength={120}
            placeholder={tipo === 'aviso' ? 'Ex.: Ensaio sábado às 16h' : tipo === 'oracao' ? 'Ex.: Oração do coral' : 'Título'}
            placeholderTextColor={COLORS.textSecondary} />
          {mostrarTexto && (
            <>
              <Text style={[styles.rotulo, { marginTop: 8 }]}>
                {tipo === 'aviso' ? 'MENSAGEM' : tipo === 'oracao' ? 'ORAÇÃO' : tipo === 'cantico' ? 'LETRA' : 'TEXTO'}
              </Text>
              <TextInput style={[styles.input, styles.area]} value={texto} onChangeText={setTexto} multiline textAlignVertical="top"
                maxLength={tipo === 'aviso' ? 5000 : 20000}
                placeholder={tipo === 'aviso' ? 'Escreva o comunicado…' : tipo === 'oracao' ? 'Escreva a oração…' : 'Escreva a letra…'}
                placeholderTextColor={COLORS.textSecondary} />
            </>
          )}
          {!editar && tipo === 'programa' && (
            <>
              <Text style={[styles.rotulo, { marginTop: 8 }]}>CELEBRAÇÃO (OPCIONAL)</Text>
              <TextInput style={styles.input} value={texto} onChangeText={setTexto} maxLength={500}
                placeholder="Ex.: XXVII Domingo do Tempo Comum" placeholderTextColor={COLORS.textSecondary} />
            </>
          )}
          {!editar && tipo === 'cantico' && !!audioUri && (
            <TouchableOpacity style={styles.opcao} onPress={() => setIncluirAudio(v => !v)} activeOpacity={0.7} accessibilityRole="checkbox" accessibilityState={{ checked: incluirAudio }}>
              <Ionicons name={incluirAudio ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              <Text style={styles.opcaoTxt}>Incluir a gravação de voz</Text>
            </TouchableOpacity>
          )}
        </View>

        {!!progresso && <Text style={styles.ajuda}>{progresso}</Text>}
        {!!erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity style={[styles.botao, aEnviar && { opacity: 0.6 }]} onPress={enviar} disabled={aEnviar} activeOpacity={0.85}>
          <Ionicons name={editar ? 'checkmark' : 'paper-plane-outline'} size={19} color="#fff" />
          <Text style={styles.botaoTxt}>{aEnviar ? 'A enviar…' : editar ? 'Guardar' : 'Publicar no grupo'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  fechar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tituloEcra: { fontSize: 20, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  corpo: { padding: 16, paddingBottom: 40, gap: 14 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 8, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  ajuda: { fontSize: 13, lineHeight: 19, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  erro: { fontSize: 13.5, color: COLORS.error, fontFamily: FONTS.sans },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  opcaoTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans,
  },
  area: { minHeight: 140, lineHeight: 23 },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
});
