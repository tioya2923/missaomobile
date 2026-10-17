import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { carregarAudio, enviarCantico, mensagemDeErro } from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import ContaAuth from './ContaAuth';

interface Props {
  titulo: string;
  letra: string;
  audioUri?: string;
  momento?: string;
  onFechar: () => void;
}

// Envia um cântico próprio (letra e/ou gravação) a uma ou mais pessoas, só dentro da app.
export default function PartilharCantico({ titulo, letra, audioUri, momento, onFechar }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { autenticado, carregado, codigo } = useConta();

  const [codigos, setCodigos] = useState<string[]>([]);
  const [entrada, setEntrada] = useState('');
  const [comAudio, setComAudio] = useState(!!audioUri);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ enviados: number; naoEnviados: string[] } | null>(null);

  const adicionarCodigos = (texto: string) => {
    const novos = texto.split(/[\s,;]+/).map(c => c.trim().toUpperCase()).filter(Boolean)
      .map(c => (c.startsWith('NDT-') ? c : c.startsWith('NDT') ? `NDT-${c.slice(3)}` : `NDT-${c}`));
    if (!novos.length) return;
    setCodigos(atual => Array.from(new Set([...atual, ...novos])).slice(0, 20));
    setEntrada('');
    setErro(null);
  };

  const enviar = async () => {
    const pendentes = entrada.trim() ? [entrada] : [];
    const todos = Array.from(new Set([
      ...codigos,
      ...pendentes.flatMap(t => t.split(/[\s,;]+/).filter(Boolean).map(c => {
        const u = c.toUpperCase();
        return u.startsWith('NDT-') ? u : u.startsWith('NDT') ? `NDT-${u.slice(3)}` : `NDT-${u}`;
      })),
    ]));
    if (!todos.length) { setErro('Escreva o código de quem vai receber.'); return; }
    if (codigo && todos.includes(codigo)) { setErro('Esse é o seu próprio código. Escreva o de outra pessoa.'); return; }
    try {
      setAEnviar(true);
      setErro(null);
      let audioId: number | undefined;
      if (comAudio && audioUri) audioId = await carregarAudio(audioUri);
      const r = await enviarCantico({ titulo, letra, momento, audioId, codigos: todos });
      setResultado(r);
      setCodigos(r.naoEnviados);
      setEntrada('');
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setAEnviar(false);
    }
  };

  const cabecalho = (
    <View style={styles.topo}>
      <TouchableOpacity onPress={onFechar} style={styles.fechar} activeOpacity={0.7} accessibilityLabel="Fechar">
        <Ionicons name="close" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.tituloEcra}>Enviar a outras pessoas</Text>
    </View>
  );

  if (!carregado) return <View style={styles.ecra}>{cabecalho}</View>;
  if (!autenticado) return <View style={styles.ecra}>{cabecalho}<ContaAuth /></View>;

  if (resultado && resultado.enviados > 0 && resultado.naoEnviados.length === 0) {
    return (
      <View style={styles.ecra}>
        {cabecalho}
        <View style={styles.sucesso}>
          <Ionicons name="checkmark-circle" size={56} color={COLORS.primary} />
          <Text style={styles.sucessoTitulo}>{resultado.enviados === 1 ? 'Cântico enviado' : `Cântico enviado a ${resultado.enviados} pessoas`}</Text>
          <Text style={styles.sucessoTxt}>Aparece na caixa de entrada de quem o recebeu, em Eu › Partilhas.</Text>
          <TouchableOpacity style={styles.botao} onPress={onFechar} activeOpacity={0.85}><Text style={styles.botaoTxt}>Concluir</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.ecra} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {cabecalho}
      <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
        <View style={styles.cartao}>
          <Text style={styles.rotulo}>CÂNTICO</Text>
          <Text style={styles.cantico}>{titulo}</Text>
          {!!audioUri && (
            <TouchableOpacity style={styles.opcao} onPress={() => setComAudio(v => !v)} activeOpacity={0.7} accessibilityRole="checkbox" accessibilityState={{ checked: comAudio }}>
              <Ionicons name={comAudio ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              <Text style={styles.opcaoTxt}>Enviar também a gravação de voz</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cartao}>
          <Text style={styles.rotulo}>PARA QUEM</Text>
          <Text style={styles.ajuda}>Escreva o código de cada pessoa (ex.: NDT-7K4PQ). Cada pessoa vê o seu em Eu › Partilhas.</Text>
          <View style={styles.linhaCodigo}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={entrada}
              onChangeText={setEntrada}
              onSubmitEditing={() => adicionarCodigos(entrada)}
              placeholder="NDT-XXXXX"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.maisBtn} onPress={() => adicionarCodigos(entrada)} activeOpacity={0.85} accessibilityLabel="Adicionar código">
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {codigos.length > 0 && (
            <View style={styles.chips}>
              {codigos.map(c => (
                <View key={c} style={[styles.chip, resultado?.naoEnviados.includes(c) && styles.chipErro]}>
                  <Text style={styles.chipTxt}>{c}</Text>
                  <TouchableOpacity onPress={() => setCodigos(l => l.filter(x => x !== c))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel={`Remover ${c}`}>
                    <Ionicons name="close-circle" size={17} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {!!resultado && resultado.naoEnviados.length > 0 && (
            <Text style={styles.aviso}>
              {resultado.enviados > 0 ? `Enviado a ${resultado.enviados}. ` : ''}
              Não foi possível enviar a {resultado.naoEnviados.length === 1 ? 'este código' : 'estes códigos'} (marcados a vermelho): confirme se estão certos.
            </Text>
          )}
          {!!erro && <Text style={styles.erro}>{erro}</Text>}
        </View>

        <TouchableOpacity style={[styles.botao, aEnviar && { opacity: 0.6 }]} onPress={enviar} disabled={aEnviar} activeOpacity={0.85}>
          <Ionicons name="paper-plane-outline" size={19} color="#fff" />
          <Text style={styles.botaoTxt}>{aEnviar ? 'A enviar…' : 'Enviar'}</Text>
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
  cantico: { fontSize: 17, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  ajuda: { fontSize: 13, lineHeight: 19, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  opcaoTxt: { flex: 1, fontSize: 14, fontFamily: FONTS.sans, color: COLORS.text },
  linhaCodigo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.text, fontFamily: FONTS.sans, letterSpacing: 1,
  },
  maisBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.navbar, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingLeft: 12, paddingRight: 8, borderRadius: RADIUS.pill, backgroundColor: COLORS.primaryLight },
  chipErro: { borderWidth: 1.5, borderColor: COLORS.error },
  chipTxt: { fontSize: 13.5, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text, letterSpacing: 0.5 },
  aviso: { fontSize: 13.5, lineHeight: 20, fontFamily: FONTS.sans, color: COLORS.error },
  erro: { fontSize: 13.5, fontFamily: FONTS.sans, color: COLORS.error },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14, paddingHorizontal: 28 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
  sucesso: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  sucessoTitulo: { fontSize: 22, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary, textAlign: 'center' },
  sucessoTxt: { fontSize: 14, lineHeight: 21, fontFamily: FONTS.sans, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 12 },
});
