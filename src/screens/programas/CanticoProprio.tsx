import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus,
  useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import { apagarAudio, guardarAudio, novoId, type Escolha } from '../../utils/programasMissa';

type Proprio = Extract<Escolha, { tipo: 'proprio' }>;

interface Props {
  momento: string;
  inicial?: Proprio;
  onGuardar: (c: Proprio) => void;
  onCancelar: () => void;
}

// Idiomas que o reconhecimento de voz do telemóvel costuma suportar (latim e línguas angolanas não).
const IDIOMAS_VOZ = [
  { codigo: 'pt-PT', nome: 'Português (PT)' },
  { codigo: 'pt-BR', nome: 'Português (BR)' },
  { codigo: 'fr-FR', nome: 'Francês' },
  { codigo: 'en-US', nome: 'Inglês' },
  { codigo: 'es-ES', nome: 'Espanhol' },
  { codigo: 'it-IT', nome: 'Italiano' },
];

function formatar(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function CanticoProprio({ momento, inicial, onGuardar, onCancelar }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [letra, setLetra] = useState(inicial?.letra ?? '');
  const [audioUri, setAudioUri] = useState<string | undefined>(inicial?.audioUri);
  const [audioNovo, setAudioNovo] = useState(false);   // gravado nesta sessão (ainda não confirmado)
  const [langVoz, setLangVoz] = useState('pt-PT');

  /* ── gravação de voz (guarda o áudio do cântico) ── */
  const gravador = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estadoGravador = useAudioRecorderState(gravador, 300);
  const gravando = estadoGravador.isRecording;

  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const estadoPlayer = useAudioPlayerStatus(player);

  /* ── voz → texto (opcional, só quando o utilizador pede) ── */
  const [ditando, setDitando] = useState(false);
  const [parcial, setParcial] = useState('');

  useSpeechRecognitionEvent('result', ev => {
    const texto = ev.results[0]?.transcript ?? '';
    if (ev.isFinal) {
      if (texto.trim()) setLetra(l => (l.trim() ? l.replace(/\s+$/, '') + '\n' : '') + texto.trim());
      setParcial('');
    } else {
      setParcial(texto);
    }
  });
  useSpeechRecognitionEvent('end', () => { setDitando(false); setParcial(''); });
  useSpeechRecognitionEvent('error', ev => {
    setDitando(false);
    setParcial('');
    if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
      Alert.alert('Não foi possível converter a voz', 'Verifique a ligação e as permissões e tente de novo.');
    }
  });

  const comecarGravacao = async () => {
    if (ditando) return;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Microfone', 'Sem permissão para usar o microfone. Pode activá-la nas definições do telemóvel.');
        return;
      }
      player.pause();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await gravador.prepareToRecordAsync();
      gravador.record();
    } catch {
      Alert.alert('Gravação', 'Não foi possível iniciar a gravação neste dispositivo.');
    }
  };

  const pararGravacao = async () => {
    try {
      await gravador.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const temporario = gravador.uri;
      if (temporario) {
        const fixo = await guardarAudio(temporario);
        if (audioNovo) await apagarAudio(audioUri);   // substitui uma gravação ainda não confirmada
        setAudioUri(fixo);
        setAudioNovo(true);
      }
    } catch {
      Alert.alert('Gravação', 'Não foi possível guardar a gravação.');
    }
  };

  const removerAudio = () => {
    player.pause();
    if (audioNovo) apagarAudio(audioUri);
    setAudioUri(undefined);
    setAudioNovo(false);
  };

  const tocar = () => {
    if (estadoPlayer.playing) { player.pause(); return; }
    if (estadoPlayer.didJustFinish || estadoPlayer.currentTime >= (estadoPlayer.duration || Infinity)) player.seekTo(0);
    player.play();
  };

  const comecarDitado = () => {
    if (gravando) return;
    Alert.alert(
      'Converter voz em texto',
      'Vai usar o reconhecimento de voz do seu telemóvel (Google ou Apple), que pode enviar o áudio para os servidores deles para o converter em texto. A Ndatava não guarda esse áudio. Pode corrigir o texto depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            try {
              const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
              if (!perm.granted) {
                Alert.alert('Permissões', 'Sem permissão para o microfone ou para o reconhecimento de voz.');
                return;
              }
              player.pause();
              setDitando(true);
              ExpoSpeechRecognitionModule.start({ lang: langVoz, interimResults: true, continuous: true, addsPunctuation: true });
            } catch {
              setDitando(false);
              Alert.alert('Voz em texto', 'Esta funcionalidade não está disponível neste dispositivo.');
            }
          },
        },
      ],
    );
  };

  const pararDitado = () => { try { ExpoSpeechRecognitionModule.stop(); } catch { setDitando(false); } };

  const cancelar = async () => {
    if (gravando) { try { await gravador.stop(); } catch { /* ignorar */ } }
    if (ditando) { try { ExpoSpeechRecognitionModule.abort(); } catch { /* ignorar */ } }
    if (audioNovo) await apagarAudio(audioUri);
    onCancelar();
  };

  const guardar = async () => {
    if (gravando) await pararGravacao();
    if (!titulo.trim()) { Alert.alert('Título', 'Escreva o título do cântico.'); return; }
    if (!letra.trim() && !audioUri) { Alert.alert('Cântico', 'Escreva a letra ou grave a voz.'); return; }
    if (inicial?.audioUri && inicial.audioUri !== audioUri) await apagarAudio(inicial.audioUri);
    onGuardar({ id: inicial?.id ?? novoId(), tipo: 'proprio', titulo: titulo.trim(), letra: letra.trim(), audioUri });
  };

  return (
    <KeyboardAvoidingView style={styles.ecra} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={cancelar} style={styles.fechar} activeOpacity={0.7} accessibilityLabel="Cancelar">
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.tituloEcra}>{inicial ? 'Editar cântico próprio' : 'Cântico próprio'}</Text>
          <Text style={styles.sub}>{momento}</Text>
        </View>
        <TouchableOpacity style={styles.guardar} onPress={guardar} activeOpacity={0.85}>
          <Text style={styles.guardarTxt}>Guardar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
        <Text style={styles.rotulo}>TÍTULO</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ex.: Aqui estou, Senhor"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.rotulo}>LETRA</Text>
        <TextInput
          style={[styles.input, styles.letra]}
          value={letra}
          onChangeText={setLetra}
          placeholder="Escreva a letra aqui, ou use a voz abaixo"
          placeholderTextColor={COLORS.textSecondary}
          multiline
          textAlignVertical="top"
        />
        {!!parcial && <Text style={styles.parcial}>A ouvir: {parcial}</Text>}

        {/* Voz → texto */}
        <View style={styles.cartao}>
          <Text style={styles.cartaoTitulo}>Converter voz em texto</Text>
          <Text style={styles.cartaoDesc}>
            Opcional. Fale ou cante devagar e o telemóvel escreve a letra. Depois pode corrigir.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
            {IDIOMAS_VOZ.map(i => (
              <TouchableOpacity
                key={i.codigo}
                style={[styles.chip, langVoz === i.codigo && styles.chipActivo]}
                onPress={() => !ditando && setLangVoz(i.codigo)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipTxt, langVoz === i.codigo && styles.chipTxtActivo]}>{i.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.botao, ditando && styles.botaoParar, gravando && styles.botaoOff]}
            onPress={ditando ? pararDitado : comecarDitado}
            disabled={gravando}
            activeOpacity={0.85}
          >
            <Ionicons name={ditando ? 'stop-circle-outline' : 'text-outline'} size={20} color="#fff" />
            <Text style={styles.botaoTxt}>{ditando ? 'Parar de ouvir' : 'Ditar a letra'}</Text>
          </TouchableOpacity>
        </View>

        {/* Gravação de voz */}
        <View style={styles.cartao}>
          <Text style={styles.cartaoTitulo}>Gravar a voz</Text>
          <Text style={styles.cartaoDesc}>
            Grave o cântico para o ouvir de novo. A gravação fica só neste telemóvel.
          </Text>

          <TouchableOpacity
            style={[styles.botao, gravando && styles.botaoParar, ditando && styles.botaoOff]}
            onPress={gravando ? pararGravacao : comecarGravacao}
            disabled={ditando}
            activeOpacity={0.85}
          >
            <Ionicons name={gravando ? 'stop-circle-outline' : 'mic-outline'} size={20} color="#fff" />
            <Text style={styles.botaoTxt}>
              {gravando ? `A gravar… ${formatar(estadoGravador.durationMillis)}` : audioUri ? 'Gravar de novo' : 'Gravar voz'}
            </Text>
          </TouchableOpacity>

          {!!audioUri && !gravando && (
            <View style={styles.audioLinha}>
              <TouchableOpacity style={styles.tocar} onPress={tocar} activeOpacity={0.85}>
                <Ionicons name={estadoPlayer.playing ? 'pause' : 'play'} size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.audioTxt}>
                Gravação {formatar((estadoPlayer.duration || 0) * 1000)}
              </Text>
              <TouchableOpacity onPress={removerAudio} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Apagar gravação">
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 6 },
  fechar: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tituloEcra: { fontSize: 19, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  sub: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  guardar: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 9, paddingHorizontal: 18 },
  guardarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14 },
  corpo: { padding: 16, paddingBottom: 40, gap: 6 },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 10 },
  input: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.text, fontFamily: FONTS.sans,
  },
  letra: { minHeight: 220, lineHeight: 24 },
  parcial: { fontSize: 13, fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 4 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, marginTop: 14, gap: 10, ...SHADOW.card },
  cartaoTitulo: { fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  cartaoDesc: { fontSize: 13, lineHeight: 19, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  chipsScroll: { flexGrow: 0, flexShrink: 0, minHeight: 36 },
  chips: { gap: 8, alignItems: 'center' },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border },
  chipActivo: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 12.5, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  chipTxtActivo: { color: '#fff' },
  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 12,
  },
  botaoParar: { backgroundColor: COLORS.error },
  botaoOff: { opacity: 0.45 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
  audioLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  tocar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.navbar, alignItems: 'center', justifyContent: 'center' },
  audioTxt: { flex: 1, fontSize: 14, fontFamily: FONTS.sans, color: COLORS.text },
});
