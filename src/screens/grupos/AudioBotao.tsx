import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Text from '../../components/AppText';
import { FONTS, RADIUS, type Palette } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';

// Botão que descarrega uma gravação (só na primeira vez) e a reproduz.
export default function AudioBotao({ obter, rotulo = 'Ouvir gravação' }: { obter: () => Promise<string>; rotulo?: string }) {
  const styles = useThemedStyles(createStyles);
  const [uri, setUri] = useState<string | null>(null);
  const [aCarregar, setACarregar] = useState(false);
  const [erro, setErro] = useState(false);

  const player = useAudioPlayer(uri ? { uri } : null);
  const estado = useAudioPlayerStatus(player);

  // O leitor só existe depois de o ficheiro chegar; arranca a reprodução nesse momento.
  useEffect(() => { if (uri) player.play(); }, [uri, player]);

  const carregar = async () => {
    try {
      setErro(false);
      if (!uri) {
        setACarregar(true);
        setUri(await obter());
        return;
      }
      if (estado.playing) { player.pause(); return; }
      if (estado.didJustFinish) player.seekTo(0);
      player.play();
    } catch {
      setErro(true);
    } finally {
      setACarregar(false);
    }
  };

  return (
    <TouchableOpacity style={[styles.botao, aCarregar && { opacity: 0.6 }]} onPress={carregar} disabled={aCarregar} activeOpacity={0.85}>
      <Ionicons name={estado.playing ? 'pause' : 'play'} size={16} color="#fff" />
      <Text style={styles.txt}>{aCarregar ? 'A carregar…' : erro ? 'Tentar de novo' : estado.playing ? 'Parar' : rotulo}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  botao: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, alignSelf: 'flex-start',
    backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 9, paddingHorizontal: 16,
  },
  txt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 13.5 },
});
