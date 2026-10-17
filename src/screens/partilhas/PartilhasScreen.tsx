import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import {
  desbloquear, guardarDefinicoes, listarBloqueados, listarRecebidas, mensagemDeErro, obterDefinicoes, type Bloqueado, type Recebida,
} from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import ConfirmarModal from '../../components/ConfirmarModal';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import ContaAuth from './ContaAuth';
import ContactosPanel from './ContactosPanel';
import RecebidoDetalheScreen from './RecebidoDetalhe';

// "Eu › Partilhas": o código pessoal, os cânticos recebidos e a gestão da conta.
export default function PartilhasScreen({ onVoltar }: { onVoltar: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { carregado, autenticado, nome, email, codigo, sair, eliminar, atualizarNaoLidas } = useConta();

  const [separador, setSeparador] = useState<'recebidos' | 'contactos' | 'conta'>('recebidos');
  const [recebidas, setRecebidas] = useState<Recebida[] | null>(null);
  const [bloqueados, setBloqueados] = useState<Bloqueado[]>([]);
  const [aActualizar, setAActualizar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aberta, setAberta] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [visivel, setVisivel] = useState(true);
  const [paroquia, setParoquia] = useState('');
  const [defGuardadas, setDefGuardadas] = useState<{ visivel: boolean; paroquia: string } | null>(null);
  const [aGuardarDef, setAGuardarDef] = useState(false);
  const [confirmar, setConfirmar] = useState<'sair' | 'eliminar' | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setAActualizar(true);
      setErro(null);
      const [r, b, d] = await Promise.all([listarRecebidas(), listarBloqueados(), obterDefinicoes()]);
      setRecebidas(r);
      setBloqueados(b);
      setVisivel(d.visivelPesquisa);
      setParoquia(d.paroquia);
      setDefGuardadas({ visivel: d.visivelPesquisa, paroquia: d.paroquia });
      atualizarNaoLidas();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar. Verifique a ligação e puxe para actualizar.'));
    } finally {
      setAActualizar(false);
    }
  }, [atualizarNaoLidas]);

  useEffect(() => { if (autenticado) { setSeparador('recebidos'); recarregar(); } }, [autenticado, recarregar]);

  const copiar = async () => {
    if (!codigo) return;
    await Clipboard.setStringAsync(codigo).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarCodigo = () => {
    if (!codigo) return;
    Share.share({ message: `Envie-me cânticos na app Ndatava. O meu código é ${codigo}` }).catch(() => {});
  };

  const guardarDef = async () => {
    try {
      setAGuardarDef(true);
      setErro(null);
      const d = await guardarDefinicoes({ visivelPesquisa: visivel, paroquia: paroquia.trim() });
      setDefGuardadas({ visivel: d.visivelPesquisa, paroquia: d.paroquia });
      setParoquia(d.paroquia);
    } catch (e) { setErro(mensagemDeErro(e)); }
    finally { setAGuardarDef(false); }
  };

  const defAlteradas = !!defGuardadas && (defGuardadas.visivel !== visivel || defGuardadas.paroquia !== paroquia.trim());

  const quitar = async (id: number) => {
    try { await desbloquear(id); setBloqueados(l => l.filter(b => b.utilizadorId !== id)); }
    catch (e) { setErro(mensagemDeErro(e)); }
  };

  if (aberta !== null) {
    return <RecebidoDetalheScreen id={aberta} onFechar={() => { setAberta(null); recarregar(); }} />;
  }

  const cabecalho = (
    <TouchableOpacity style={styles.voltar} onPress={onVoltar} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      <Text style={styles.voltarTxt}>Voltar</Text>
    </TouchableOpacity>
  );

  if (!carregado) return <View style={styles.ecra}>{cabecalho}</View>;
  if (!autenticado) return <View style={styles.ecra}>{cabecalho}<ContaAuth /></View>;

  return (
    <View style={styles.ecra}>
      {cabecalho}
      <ScrollView
        contentContainerStyle={styles.corpo}
        refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={recarregar} tintColor={COLORS.primary} />}
      >
        <Text style={styles.titulo}>Partilhas</Text>

        <View style={styles.cartaoCodigo}>
          <Text style={styles.rotuloClaro}>O SEU CÓDIGO</Text>
          <Text style={styles.codigo} selectable>{codigo ?? '…'}</Text>
          <Text style={styles.codigoAjuda}>Dê este código a quem lhe quiser enviar cânticos.</Text>
          <View style={styles.linhaBotoes}>
            <TouchableOpacity style={styles.botaoClaro} onPress={copiar} activeOpacity={0.85} disabled={!codigo}>
              <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={17} color={COLORS.navbar} />
              <Text style={styles.botaoClaroTxt}>{copiado ? 'Copiado' : 'Copiar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoClaro} onPress={enviarCodigo} activeOpacity={0.85} disabled={!codigo}>
              <Ionicons name="share-outline" size={17} color={COLORS.navbar} />
              <Text style={styles.botaoClaroTxt}>Enviar código</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separadores}>
          {(['recebidos', 'contactos', 'conta'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.sep, separador === s && styles.sepActivo]} onPress={() => setSeparador(s)} activeOpacity={0.8}>
              <Text style={[styles.sepTxt, separador === s && styles.sepTxtActivo]}>{s === 'recebidos' ? 'Recebidos' : s === 'contactos' ? 'Contactos' : 'Conta'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!erro && <Text style={styles.erro}>{erro}</Text>}

        {separador === 'contactos' ? (
          <ContactosPanel onMudou={atualizarNaoLidas} />
        ) : separador === 'recebidos' ? (
          <>
            {recebidas && recebidas.length === 0 && (
              <Text style={styles.vazio}>Ainda não recebeu cânticos. Quando alguém lhos enviar com o seu código, aparecem aqui.</Text>
            )}
            {recebidas?.map(r => (
              <TouchableOpacity key={r.id} style={styles.item} onPress={() => setAberta(r.id)} activeOpacity={0.75}>
                <View style={[styles.ponto, r.lido && { opacity: 0 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitulo, !r.lido && { fontWeight: '800' }]} numberOfLines={2}>{r.titulo}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    De {r.remetenteNome}{r.momento ? ` · ${r.momento}` : ''}{r.temAudio ? ' · com gravação' : ''}
                  </Text>
                  <Text style={styles.itemData}>{new Date(r.criadoEm).toLocaleDateString('pt-PT')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <>
            <View style={styles.cartao}>
              <Text style={styles.rotulo}>CONTA</Text>
              <Text style={styles.contaNome}>{nome}</Text>
              <Text style={styles.contaEmail}>{email}</Text>
            </View>

            <View style={styles.cartao}>
              <Text style={styles.rotulo}>VISIBILIDADE</Text>
              <View style={styles.linhaSwitch}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contaNomePeq}>Aparecer nas pesquisas</Text>
                  <Text style={styles.itemData}>Outras pessoas encontram-me pelo nome. Desligado, só me encontram pelo meu código.</Text>
                </View>
                <Switch value={visivel} onValueChange={setVisivel} trackColor={{ true: COLORS.navbar }} accessibilityLabel="Aparecer nas pesquisas" />
              </View>
              <Text style={[styles.rotulo, { marginTop: 8 }]}>PARÓQUIA (OPCIONAL)</Text>
              <TextInput
                style={styles.input}
                value={paroquia}
                onChangeText={setParoquia}
                placeholder="Ajuda a distinguir pessoas com o mesmo nome"
                placeholderTextColor={COLORS.textSecondary}
                maxLength={100}
              />
              {defAlteradas && (
                <TouchableOpacity style={[styles.botaoGuardar, aGuardarDef && { opacity: 0.6 }]} onPress={guardarDef} disabled={aGuardarDef} activeOpacity={0.85}>
                  <Text style={styles.botaoGuardarTxt}>{aGuardarDef ? 'A guardar…' : 'Guardar'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.cartao}>
              <Text style={styles.rotulo}>PESSOAS BLOQUEADAS</Text>
              {bloqueados.length === 0 ? (
                <Text style={styles.contaEmail}>Não bloqueou ninguém.</Text>
              ) : bloqueados.map(b => (
                <View key={b.utilizadorId} style={styles.linhaBloq}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contaNomePeq}>{b.nome}</Text>
                    {!!b.codigo && <Text style={styles.itemData}>{b.codigo}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => quitar(b.utilizadorId)} activeOpacity={0.7}>
                    <Text style={styles.link}>Desbloquear</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.botaoContorno} onPress={() => setConfirmar('sair')} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={19} color={COLORS.text} />
              <Text style={styles.botaoContornoTxt}>Terminar sessão</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.botaoContorno, { borderColor: COLORS.error }]} onPress={() => setConfirmar('eliminar')} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={19} color={COLORS.error} />
              <Text style={[styles.botaoContornoTxt, { color: COLORS.error }]}>Eliminar conta</Text>
            </TouchableOpacity>
            <Text style={styles.nota}>
              Eliminar a conta apaga o seu nome, email, código, contactos e todos os cânticos que enviou e recebeu. Os seus programas, que estão só neste telemóvel, não são afectados.
            </Text>
          </>
        )}
      </ScrollView>

      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar === 'eliminar' ? 'Eliminar conta' : 'Terminar sessão'}
        mensagem={confirmar === 'eliminar'
          ? 'Eliminar a sua conta definitivamente? Esta acção não pode ser desfeita.'
          : 'Terminar a sessão neste telemóvel? Pode voltar a entrar quando quiser.'}
        rotuloConfirmar={confirmar === 'eliminar' ? 'Eliminar' : 'Terminar'}
        perigoso={confirmar === 'eliminar'}
        onCancelar={() => setConfirmar(null)}
        onConfirmar={async () => {
          const a = confirmar; setConfirmar(null);
          try {
            if (a === 'eliminar') await eliminar();
            else if (a === 'sair') await sair();
          } catch (e) { setErro(mensagemDeErro(e)); }
        }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 },
  voltarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  corpo: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  titulo: { fontSize: 26, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  cartaoCodigo: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.lg, padding: 18, gap: 4, alignItems: 'center', ...SHADOW.card },
  rotuloClaro: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.sans },
  codigo: { fontSize: 30, fontWeight: '800', letterSpacing: 3, color: '#fff', fontFamily: FONTS.sans, marginVertical: 2 },
  codigoAjuda: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.sans, textAlign: 'center' },
  linhaBotoes: { flexDirection: 'row', gap: 10, marginTop: 10 },
  botaoClaro: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: RADIUS.pill, paddingVertical: 9, paddingHorizontal: 16 },
  botaoClaroTxt: { fontSize: 13.5, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.navbar },
  separadores: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.pill, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  sep: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center' },
  sepActivo: { backgroundColor: COLORS.navbar },
  sepTxt: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  sepTxtActivo: { color: '#fff' },
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  vazio: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 12, lineHeight: 21 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.card },
  ponto: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.primary },
  itemTitulo: { fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  itemSub: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary, marginTop: 2 },
  itemData: { fontSize: 12, fontFamily: FONTS.sans, color: COLORS.textSecondary, marginTop: 2 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 6, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  contaNome: { fontSize: 18, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  contaNomePeq: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  contaEmail: { fontSize: 14, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  linhaBloq: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans,
  },
  botaoGuardar: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  botaoGuardarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
  link: { fontSize: 14, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.primary },
  botaoContorno: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.border,
  },
  botaoContornoTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  nota: { fontSize: 12.5, lineHeight: 19, fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, textAlign: 'center' },
});
