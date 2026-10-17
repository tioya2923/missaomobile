import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getCantico, type Cantico } from '../../api/canticos';
import Text from '../../components/AppText';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import type { Escolha } from '../../utils/programasMissa';
import PartilharCantico from '../partilhas/PartilharCantico';

// Mostra a letra de um cântico do programa (da app ou próprio) para cantar ou ensaiar.
export default function LeitorCantico({ escolha, onFechar }: { escolha: Escolha; onFechar: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [cantico, setCantico] = useState<Cantico | null>(null);
  const [aCarregar, setACarregar] = useState(escolha.tipo === 'app');
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);

  const audioUri = escolha.tipo === 'proprio' ? escolha.audioUri : undefined;
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const estado = useAudioPlayerStatus(player);

  const carregar = useCallback(async () => {
    if (escolha.tipo !== 'app') return;
    try {
      setACarregar(true);
      setErro(null);
      setCantico(await getCantico(escolha.idioma, escolha.slug));
    } catch {
      setErro('Não foi possível carregar a letra. Verifique a ligação.');
    } finally {
      setACarregar(false);
    }
  }, [escolha]);

  useEffect(() => { carregar(); }, [carregar]);

  const letra = escolha.tipo === 'app' ? cantico?.letra : escolha.letra;
  const autor = escolha.tipo === 'app' ? cantico?.autor : null;

  const tocar = () => {
    if (estado.playing) { player.pause(); return; }
    if (estado.didJustFinish) player.seekTo(0);
    player.play();
  };

  if (aEnviar && escolha.tipo === 'proprio') {
    return <PartilharCantico titulo={escolha.titulo} letra={escolha.letra} audioUri={escolha.audioUri} onFechar={() => setAEnviar(false)} />;
  }

  return (
    <View style={styles.ecra}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={onFechar} style={styles.fechar} activeOpacity={0.7} accessibilityLabel="Fechar">
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.voltarTxt}>Voltar ao programa</Text>
      </View>

      {aCarregar ? (
        <LoadingView />
      ) : erro ? (
        <ErrorView message={erro} onRetry={carregar} />
      ) : (
        <ScrollView contentContainerStyle={styles.corpo}>
          <View style={styles.cartao}>
            <Text style={styles.titulo}>{escolha.titulo}</Text>
            <View style={styles.linha} />
            {!!audioUri && (
              <TouchableOpacity style={styles.tocar} onPress={tocar} activeOpacity={0.85}>
                <Ionicons name={estado.playing ? 'pause' : 'play'} size={18} color="#fff" />
                <Text style={styles.tocarTxt}>{estado.playing ? 'Parar gravação' : 'Ouvir gravação'}</Text>
              </TouchableOpacity>
            )}
            {letra ? (
              <Text style={styles.letra}>{letra}</Text>
            ) : (
              <Text style={styles.semLetra}>Este cântico só tem gravação de voz.</Text>
            )}
            {!!autor && <Text style={styles.autor}>Letra e Música: {autor}</Text>}
          </View>
          {escolha.tipo === 'proprio' && (
            <TouchableOpacity style={styles.enviar} onPress={() => setAEnviar(true)} activeOpacity={0.85}>
              <Ionicons name="paper-plane-outline" size={19} color={COLORS.primary} />
              <Text style={styles.enviarTxt}>Enviar a outras pessoas</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  fechar: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  voltarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  corpo: { padding: 12, paddingBottom: 40 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, paddingHorizontal: 18, paddingVertical: 26, ...SHADOW.card },
  titulo: { fontSize: 24, lineHeight: 31, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary, textAlign: 'center' },
  linha: { width: 44, height: 3, borderRadius: 2, backgroundColor: COLORS.gold, alignSelf: 'center', marginTop: 14, marginBottom: 20 },
  tocar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center',
    backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 10, paddingHorizontal: 20, marginBottom: 18,
  },
  tocarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14 },
  enviar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 13, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.primary },
  enviarTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.primary },
  letra: { fontSize: 16, lineHeight: 27, fontFamily: FONTS.sans, color: COLORS.text },
  semLetra: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans },
  autor: { fontSize: 13, fontStyle: 'italic', textAlign: 'right', marginTop: 20, color: COLORS.textSecondary, fontFamily: FONTS.sans },
});
