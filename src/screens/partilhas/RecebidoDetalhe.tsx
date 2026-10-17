import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  apagarRecebida, bloquearRemetente, denunciarRecebida, descarregarAudioRecebido, detalheRecebida,
  mensagemDeErro, type RecebidaDetalhe,
} from '../../api/conta';
import Text from '../../components/AppText';
import ConfirmarModal from '../../components/ConfirmarModal';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import JuntarAPrograma from './JuntarAPrograma';

type Acao = 'apagar' | 'denunciar' | 'bloquear';

const TEXTOS: Record<Acao, { titulo: string; mensagem: (nome: string) => string; rotulo: string }> = {
  apagar: { titulo: 'Apagar cântico', mensagem: () => 'Apagar este cântico da sua caixa de entrada? A pessoa que o enviou não é avisada.', rotulo: 'Apagar' },
  denunciar: {
    titulo: 'Denunciar conteúdo',
    mensagem: () => 'Enviar este cântico à equipa da Ndatava para análise? Use esta opção para conteúdo ofensivo ou indevido.',
    rotulo: 'Denunciar',
  },
  bloquear: {
    titulo: 'Bloquear pessoa',
    mensagem: nome => `Bloquear ${nome}? Esta pessoa deixa de poder enviar-lhe cânticos e os que já enviou desaparecem da sua caixa. Pode desbloquear em Partilhas › Conta.`,
    rotulo: 'Bloquear',
  },
};

// Um cântico recebido: ler a letra, ouvir a gravação, juntá-lo a um programa, apagar, denunciar ou bloquear.
export default function RecebidoDetalheScreen({ id, onFechar }: { id: number; onFechar: (alterou: boolean) => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [d, setD] = useState<RecebidaDetalhe | null>(null);
  const [aCarregar, setACarregar] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [aDescarregar, setADescarregar] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Acao | null>(null);

  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const estado = useAudioPlayerStatus(player);

  const carregar = useCallback(async () => {
    try {
      setACarregar(true);
      setErro(null);
      const r = await detalheRecebida(id);
      setD(r);
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível abrir este cântico. Verifique a ligação.'));
    } finally {
      setACarregar(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const tocar = async () => {
    if (!d) return;
    try {
      if (!audioUri) {
        setADescarregar(true);
        setMensagem(null);
        const uri = await descarregarAudioRecebido(d.id);
        setAudioUri(uri);
        // O leitor só passa a existir no próximo ciclo; a reprodução arranca no efeito abaixo.
        return;
      }
      if (estado.playing) { player.pause(); return; }
      if (estado.didJustFinish) player.seekTo(0);
      player.play();
    } catch (e) {
      setMensagem(mensagemDeErro(e, 'Não foi possível carregar a gravação.'));
    } finally {
      setADescarregar(false);
    }
  };

  useEffect(() => { if (audioUri) player.play(); }, [audioUri, player]);

  // Gravação a juntar ao programa: a já descarregada ou, se ainda não houve, descarrega-a agora.
  const obterAudio = async (): Promise<string | null> => {
    if (!d?.temAudio) return null;
    return audioUri ?? descarregarAudioRecebido(d.id);
  };

  const executar = async (acao: Acao) => {
    if (!d) return;
    try {
      if (acao === 'apagar') await apagarRecebida(d.id);
      if (acao === 'denunciar') { await denunciarRecebida(d.id, 'Conteúdo denunciado pelo destinatário'); setMensagem('Denúncia enviada. Obrigado.'); return; }
      if (acao === 'bloquear') await bloquearRemetente(d.id);
      onFechar(true);
    } catch (e) {
      setMensagem(mensagemDeErro(e));
    }
  };

  const remetente = d?.remetenteNome ?? 'Conta eliminada';

  return (
    <View style={styles.ecra}>
      <View style={styles.topo}>
        <TouchableOpacity onPress={() => onFechar(false)} style={styles.voltar} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          <Text style={styles.voltarTxt}>Recebidos</Text>
        </TouchableOpacity>
      </View>

      {aCarregar ? <LoadingView /> : erro || !d ? (
        <ErrorView message={erro ?? 'Cântico não encontrado.'} onRetry={carregar} />
      ) : (
        <ScrollView contentContainerStyle={styles.corpo}>
          <View style={styles.cartao}>
            <Text style={styles.titulo}>{d.titulo}</Text>
            <Text style={styles.de}>
              De {remetente}{d.momento ? ` · ${d.momento}` : ''} · {new Date(d.criadoEm).toLocaleDateString('pt-PT')}
            </Text>
            <View style={styles.linha} />

            {d.temAudio && (
              <TouchableOpacity style={[styles.tocar, aDescarregar && { opacity: 0.6 }]} onPress={tocar} disabled={aDescarregar} activeOpacity={0.85}>
                <Ionicons name={estado.playing ? 'pause' : 'play'} size={18} color="#fff" />
                <Text style={styles.tocarTxt}>{aDescarregar ? 'A carregar…' : estado.playing ? 'Parar gravação' : 'Ouvir gravação'}</Text>
              </TouchableOpacity>
            )}
            {d.letra ? <Text style={styles.letra}>{d.letra}</Text> : <Text style={styles.semLetra}>Este cântico só tem gravação de voz.</Text>}
          </View>

          {!!mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

          <JuntarAPrograma
            titulo={d.titulo}
            letra={d.letra}
            momentoInicial={d.momento}
            obterAudio={obterAudio}
            onConcluido={setMensagem}
          />

          <View style={styles.acoes}>
            <TouchableOpacity style={styles.acao} onPress={() => setConfirmar('apagar')} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} /><Text style={[styles.acaoTxt, { color: COLORS.error }]}>Apagar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acao} onPress={() => setConfirmar('denunciar')} activeOpacity={0.7}>
              <Ionicons name="flag-outline" size={18} color={COLORS.textSecondary} /><Text style={styles.acaoTxt}>Denunciar</Text>
            </TouchableOpacity>
            {!!d.remetenteCodigo && (
              <TouchableOpacity style={styles.acao} onPress={() => setConfirmar('bloquear')} activeOpacity={0.7}>
                <Ionicons name="ban-outline" size={18} color={COLORS.textSecondary} /><Text style={styles.acaoTxt}>Bloquear</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar ? TEXTOS[confirmar].titulo : ''}
        mensagem={confirmar ? TEXTOS[confirmar].mensagem(remetente) : ''}
        rotuloConfirmar={confirmar ? TEXTOS[confirmar].rotulo : ''}
        perigoso
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => { const a = confirmar; setConfirmar(null); if (a) executar(a); }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  topo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 14 },
  voltarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  corpo: { padding: 16, paddingBottom: 40, gap: 14 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, gap: 10, ...SHADOW.card },
  titulo: { fontSize: 22, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  de: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  linha: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border },
  tocar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 11 },
  tocarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14.5 },
  letra: { fontSize: 16, lineHeight: 27, fontFamily: FONTS.sans, color: COLORS.text },
  semLetra: { fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans },
  mensagem: { textAlign: 'center', fontSize: 13.5, fontFamily: FONTS.sans, color: COLORS.primary },
  acoes: { flexDirection: 'row', justifyContent: 'center', gap: 22, marginTop: 6 },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  acaoTxt: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.textSecondary },
});
