import { useEffect, useState } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { getVersaoApp } from '../api/versaoApp';
import { versaoEhMenorQue } from '../utils/versao';
import { COLORS, FONTS } from '../constants/theme';

// Mostra um aviso a pedir para atualizar a app quando a versão instalada
// é mais antiga do que a versão recomendada/mínima definida pelo Gestor
// (em Administração → Versão da App). Se for inferior à versão mínima,
// o aviso não pode ser fechado.
export default function AtualizarAppModal() {
  const [visivel, setVisivel] = useState(false);
  const [obrigatorio, setObrigatorio] = useState(false);
  const [mensagem, setMensagem] = useState('Está disponível uma nova versão da Ndatava.');
  const [urlDownload, setUrlDownload] = useState<string | null>(null);

  useEffect(() => {
    const versaoAtual = Constants.expoConfig?.version ?? '0.0.0';

    getVersaoApp()
      .then(info => {
        const precisaAtualizar = versaoEhMenorQue(versaoAtual, info.versaoMinima)
          || versaoEhMenorQue(versaoAtual, info.versaoRecomendada);
        if (!precisaAtualizar) return;

        setObrigatorio(versaoEhMenorQue(versaoAtual, info.versaoMinima));
        if (info.mensagem) setMensagem(info.mensagem);
        setUrlDownload(info.urlDownload ?? null);
        setVisivel(true);
      })
      .catch(() => {
        // Sem ligação ou backend em baixo — não incomoda o utilizador por isto.
      });
  }, []);

  const abrirDownload = () => {
    if (urlDownload) Linking.openURL(urlDownload).catch(() => {});
  };

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={() => !obrigatorio && setVisivel(false)}>
      <View style={styles.fundo}>
        <View style={styles.card}>
          <Text style={styles.titulo}>Nova versão disponível</Text>
          <Text style={styles.texto}>{mensagem}</Text>

          {urlDownload && (
            <TouchableOpacity style={styles.btnPrimario} onPress={abrirDownload} activeOpacity={0.85}>
              <Text style={styles.btnPrimarioTxt}>Atualizar agora</Text>
            </TouchableOpacity>
          )}

          {!obrigatorio && (
            <TouchableOpacity style={styles.btnSecundario} onPress={() => setVisivel(false)} activeOpacity={0.7}>
              <Text style={styles.btnSecundarioTxt}>Mais tarde</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    gap: 14,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
  },
  texto: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    lineHeight: 20,
  },
  btnPrimario: {
    backgroundColor: COLORS.navbar,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  btnPrimarioTxt: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: FONTS.serif },
  btnSecundario: { paddingVertical: 8, alignItems: 'center' },
  btnSecundarioTxt: { color: COLORS.textSecondary, fontSize: 14, fontFamily: FONTS.serif },
});
