import { Ionicons } from '@expo/vector-icons';
import {
  AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus,
  useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';
import { AudioEncodingAndroid, ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useRef, useState } from 'react';
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

type ModoVoz = 'ao-vivo' | 'ficheiro';

function formatar(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function suportaGravacao(): boolean {
  try { return ExpoSpeechRecognitionModule.supportsRecording(); } catch { return false; }
}

export default function CanticoProprio({ momento, inicial, onGuardar, onCancelar }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [letra, setLetra] = useState(inicial?.letra ?? '');
  const [audioUri, setAudioUri] = useState<string | undefined>(inicial?.audioUri);
  const [langVoz, setLangVoz] = useState('pt-PT');
  const [guardarAudioVoz, setGuardarAudioVoz] = useState(true);

  /* ── gravação só de áudio (expo-audio) — funciona em qualquer telemóvel ── */
  const gravador = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const estadoGravador = useAudioRecorderState(gravador, 300);
  const gravando = estadoGravador.isRecording;

  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const estadoPlayer = useAudioPlayerStatus(player);

  /* ── voz → texto (opcional), com ou sem guardar o áudio ── */
  const [aOuvir, setAOuvir] = useState(false);
  const [modo, setModo] = useState<ModoVoz>('ao-vivo');
  const [parcial, setParcial] = useState('');
  const audioDaVoz = useRef<string | null>(null);
  const pendente = useRef<Promise<void> | null>(null);   // gravação da voz ainda a ser guardada
  const audioActual = useRef<string | undefined>(inicial?.audioUri);
  const audioNovoActual = useRef(false);

  // Só gravações feitas pelo reconhecimento de voz (WAV) podem ser convertidas depois em texto.
  const podeConverterGravacao = !!audioUri && audioUri.toLowerCase().endsWith('.wav') && suportaGravacao();

  const definirAudio = (uri: string | undefined, novo: boolean) => {
    audioActual.current = uri;
    audioNovoActual.current = novo;
    setAudioUri(uri);
  };

  const guardarGravacaoDaVoz = async (uriTemporario: string) => {
    try {
      const fixo = await guardarAudio(uriTemporario);
      if (audioNovoActual.current) await apagarAudio(audioActual.current);
      definirAudio(fixo, true);
    } catch {
      Alert.alert('Gravação', 'O texto foi escrito, mas não foi possível guardar a gravação de áudio.');
    }
  };

  useSpeechRecognitionEvent('audioend', ev => {
    if (ev.uri) audioDaVoz.current = ev.uri;
  });
  useSpeechRecognitionEvent('result', ev => {
    const texto = ev.results[0]?.transcript ?? '';
    if (ev.isFinal) {
      if (texto.trim()) setLetra(l => (l.trim() ? l.replace(/\s+$/, '') + '\n' : '') + texto.trim());
      setParcial('');
    } else {
      setParcial(texto);
    }
  });
  useSpeechRecognitionEvent('end', () => {
    setAOuvir(false);
    setParcial('');
    const uri = audioDaVoz.current;
    audioDaVoz.current = null;
    if (uri) pendente.current = guardarGravacaoDaVoz(uri);
  });
  useSpeechRecognitionEvent('error', ev => {
    setAOuvir(false);
    setParcial('');
    if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
      Alert.alert('Não foi possível converter a voz', 'Verifique a ligação à internet e as permissões e tente de novo.');
    }
  });

  const pedirPermissoesVoz = async (): Promise<boolean> => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissões', 'Sem permissão para o microfone ou para o reconhecimento de voz. Pode activá-las nas definições do telemóvel.');
      return false;
    }
    return true;
  };

  const iniciarVoz = async (m: ModoVoz) => {
    if (gravando) return;
    try {
      if (!(await pedirPermissoesVoz())) return;
      player.pause();
      setModo(m);
      setAOuvir(true);
      if (m === 'ao-vivo') {
        const gravarAudio = guardarAudioVoz && suportaGravacao();
        ExpoSpeechRecognitionModule.start({
          lang: langVoz,
          interimResults: true,
          continuous: true,
          addsPunctuation: true,
          // Ficheiro de 16 kHz, 16 bits: o mesmo formato que o telemóvel aceita para converter depois em texto.
          recordingOptions: gravarAudio
            ? { persist: true, outputSampleRate: 16000, outputEncoding: 'pcmFormatInt16' }
            : undefined,
        });
      } else if (audioUri) {
        ExpoSpeechRecognitionModule.start({
          lang: langVoz,
          interimResults: true,
          continuous: true,
          addsPunctuation: true,
          requiresOnDeviceRecognition: Platform.OS === 'ios',
          audioSource: {
            uri: audioUri,
            audioChannels: 1,
            audioEncoding: AudioEncodingAndroid.ENCODING_PCM_16BIT,
            sampleRate: 16000,
          },
        });
      }
    } catch {
      setAOuvir(false);
      Alert.alert('Voz em texto', 'Esta funcionalidade não está disponível neste dispositivo.');
    }
  };

  const confirmarVoz = (m: ModoVoz) => {
    const gravacao = m === 'ao-vivo' && guardarAudioVoz && suportaGravacao();
    Alert.alert(
      'Converter voz em texto',
      'Vai usar o reconhecimento de voz do seu telemóvel (Google ou Apple), que pode enviar o áudio para os servidores deles para o converter em texto. A Ndatava não guarda esse áudio.'
      + (gravacao ? ' A gravação fica só neste telemóvel.' : '')
      + ' Funciona melhor falando devagar; ao cantar, com música ou coro, o texto costuma ter erros. Pode corrigi-lo depois.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => iniciarVoz(m) },
      ],
    );
  };

  const pararVoz = () => { try { ExpoSpeechRecognitionModule.stop(); } catch { setAOuvir(false); } };

  /* ── gravação só de áudio ── */
  const comecarGravacao = async () => {
    if (aOuvir) return;
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
        if (audioNovoActual.current) await apagarAudio(audioActual.current);   // substitui uma gravação ainda não confirmada
        definirAudio(fixo, true);
      }
    } catch {
      Alert.alert('Gravação', 'Não foi possível guardar a gravação.');
    }
  };

  const removerAudio = () => {
    player.pause();
    if (audioNovoActual.current) apagarAudio(audioActual.current);
    definirAudio(undefined, false);
  };

  const tocar = () => {
    if (estadoPlayer.playing) { player.pause(); return; }
    if (estadoPlayer.didJustFinish || estadoPlayer.currentTime >= (estadoPlayer.duration || Infinity)) player.seekTo(0);
    player.play();
  };

  const cancelar = async () => {
    if (gravando) { try { await gravador.stop(); } catch { /* ignorar */ } }
    if (aOuvir) { try { ExpoSpeechRecognitionModule.abort(); } catch { /* ignorar */ } }
    await pendente.current;
    if (audioNovoActual.current) await apagarAudio(audioActual.current);
    onCancelar();
  };

  const guardar = async () => {
    if (gravando) await pararGravacao();
    await pendente.current;   // espera que a gravação da voz acabe de ser guardada
    const audioUri = audioActual.current;
    if (!titulo.trim()) { Alert.alert('Título', 'Escreva o título do cântico.'); return; }
    if (!letra.trim() && !audioUri) { Alert.alert('Cântico', 'Escreva a letra ou grave a voz.'); return; }
    if (inicial?.audioUri && inicial.audioUri !== audioUri) await apagarAudio(inicial.audioUri);
    onGuardar({ id: inicial?.id ?? novoId(), tipo: 'proprio', titulo: titulo.trim(), letra: letra.trim(), audioUri });
  };

  const gravacaoSuportada = suportaGravacao();

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
          <Text style={styles.cartaoTitulo}>Voz em texto</Text>
          <Text style={styles.cartaoDesc}>
            Opcional. Fale ou cante e o telemóvel escreve a letra. Funciona melhor falando devagar; ao cantar, com música ou coro, costuma errar palavras. Depois pode corrigir o texto.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
            {IDIOMAS_VOZ.map(i => (
              <TouchableOpacity
                key={i.codigo}
                style={[styles.chip, langVoz === i.codigo && styles.chipActivo]}
                onPress={() => !aOuvir && setLangVoz(i.codigo)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipTxt, langVoz === i.codigo && styles.chipTxtActivo]}>{i.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {gravacaoSuportada && (
            <TouchableOpacity
              style={styles.opcao}
              onPress={() => !aOuvir && setGuardarAudioVoz(v => !v)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: guardarAudioVoz }}
            >
              <Ionicons name={guardarAudioVoz ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
              <Text style={styles.opcaoTxt}>Guardar também a gravação de áudio</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.botao, aOuvir && styles.botaoParar, gravando && styles.botaoOff]}
            onPress={aOuvir ? pararVoz : () => confirmarVoz('ao-vivo')}
            disabled={gravando}
            activeOpacity={0.85}
          >
            <Ionicons name={aOuvir ? 'stop-circle-outline' : 'mic-outline'} size={20} color="#fff" />
            <Text style={styles.botaoTxt}>
              {aOuvir
                ? (modo === 'ficheiro' ? 'A converter… toque para parar' : 'A ouvir… toque para parar')
                : gravacaoSuportada && guardarAudioVoz ? 'Gravar e converter em texto' : 'Falar e converter em texto'}
            </Text>
          </TouchableOpacity>

          {podeConverterGravacao && !aOuvir && (
            <TouchableOpacity style={styles.botaoContorno} onPress={() => confirmarVoz('ficheiro')} activeOpacity={0.85}>
              <Ionicons name="document-text-outline" size={19} color={COLORS.primary} />
              <Text style={styles.botaoContornoTxt}>Converter a gravação em texto</Text>
            </TouchableOpacity>
          )}
          {!gravacaoSuportada && (
            <Text style={styles.nota}>
              Neste telemóvel a conversão só escreve o texto; para ter também o áudio use "Gravar só o áudio" abaixo.
            </Text>
          )}
        </View>

        {/* Gravação só de áudio */}
        <View style={styles.cartao}>
          <Text style={styles.cartaoTitulo}>Gravar só o áudio</Text>
          <Text style={styles.cartaoDesc}>
            Serve para qualquer língua (também latim e línguas angolanas) e para ouvir o cântico de novo. Fica só neste telemóvel; não gera texto.
          </Text>

          <TouchableOpacity
            style={[styles.botao, gravando && styles.botaoParar, aOuvir && styles.botaoOff]}
            onPress={gravando ? pararGravacao : comecarGravacao}
            disabled={aOuvir}
            activeOpacity={0.85}
          >
            <Ionicons name={gravando ? 'stop-circle-outline' : 'radio-button-on-outline'} size={20} color="#fff" />
            <Text style={styles.botaoTxt}>
              {gravando ? `A gravar… ${formatar(estadoGravador.durationMillis)}` : audioUri ? 'Gravar de novo' : 'Gravar só o áudio'}
            </Text>
          </TouchableOpacity>
        </View>

        {!!audioUri && !gravando && (
          <View style={styles.cartao}>
            <Text style={styles.cartaoTitulo}>Gravação guardada</Text>
            <View style={styles.audioLinha}>
              <TouchableOpacity style={styles.tocar} onPress={tocar} activeOpacity={0.85} accessibilityLabel={estadoPlayer.playing ? 'Parar' : 'Ouvir'}>
                <Ionicons name={estadoPlayer.playing ? 'pause' : 'play'} size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.audioTxt}>Duração {formatar((estadoPlayer.duration || 0) * 1000)}</Text>
              <TouchableOpacity onPress={removerAudio} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Apagar gravação">
                <Ionicons name="trash-outline" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  nota: { fontSize: 12.5, lineHeight: 18, fontStyle: 'italic', fontFamily: FONTS.sans, color: COLORS.textSecondary },
  chipsScroll: { flexGrow: 0, flexShrink: 0, minHeight: 36 },
  chips: { gap: 8, alignItems: 'center' },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border },
  chipActivo: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 12.5, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  chipTxtActivo: { color: '#fff' },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  opcaoTxt: { flex: 1, fontSize: 14, fontFamily: FONTS.sans, color: COLORS.text },
  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 12,
  },
  botaoParar: { backgroundColor: COLORS.error },
  botaoOff: { opacity: 0.45 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
  botaoContorno: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: RADIUS.pill, paddingVertical: 11, borderWidth: 1.5, borderColor: COLORS.primary,
  },
  botaoContornoTxt: { color: COLORS.primary, fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14 },
  audioLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tocar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.navbar, alignItems: 'center', justifyContent: 'center' },
  audioTxt: { flex: 1, fontSize: 14, fontFamily: FONTS.sans, color: COLORS.text },
});
