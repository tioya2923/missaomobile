import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import {
  apagarGrupo, editarGrupo, mensagemDeErro, renovarCodigoGrupo, TIPOS_GRUPO, type GrupoDetalhe, type TipoGrupo,
} from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import ConfirmarModal from '../../components/ConfirmarModal';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';

interface Props {
  grupo: GrupoDetalhe;
  /** o grupo foi alterado: recarregar */
  onMudou: () => void;
  /** o grupo foi apagado */
  onApagado: () => void;
}

// Definições do grupo (só para administradores): dados, código de entrada e permissões.
export default function DefinicoesGrupoPanel({ grupo, onMudou, onApagado }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [nome, setNome] = useState(grupo.nome);
  const [tipo, setTipo] = useState<TipoGrupo>(grupo.tipo);
  const [descricao, setDescricao] = useState(grupo.descricao ?? '');
  const [paroquia, setParoquia] = useState(grupo.paroquia ?? '');
  const [membrosPublicam, setMembrosPublicam] = useState(grupo.membrosPublicam);
  const [codigoActivo, setCodigoActivo] = useState(grupo.codigoActivo ?? true);
  const [codigo, setCodigo] = useState(grupo.codigo ?? '');
  const [aGuardar, setAGuardar] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [confirmar, setConfirmar] = useState<'renovar' | 'apagar' | null>(null);

  const alterado = nome.trim() !== grupo.nome || tipo !== grupo.tipo || descricao.trim() !== (grupo.descricao ?? '')
    || paroquia.trim() !== (grupo.paroquia ?? '') || membrosPublicam !== grupo.membrosPublicam || codigoActivo !== (grupo.codigoActivo ?? true);

  const guardar = async () => {
    if (nome.trim().length < 2) { setErro('Indique o nome do grupo.'); return; }
    try {
      setAGuardar(true); setErro(null); setMensagem(null);
      await editarGrupo(grupo.id, { nome: nome.trim(), tipo, descricao: descricao.trim(), paroquia: paroquia.trim(), membrosPublicam, codigoActivo });
      setMensagem('Alterações guardadas.');
      onMudou();
    } catch (e) { setErro(mensagemDeErro(e)); }
    finally { setAGuardar(false); }
  };

  const copiar = async () => {
    await Clipboard.setStringAsync(codigo).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarCodigo = () => {
    Share.share({ message: `Entra no grupo «${grupo.nome}» na app Ndatava (Eu › Grupos › Entrar com código). O código é ${codigo}` }).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
      <View style={styles.cartao}>
        <Text style={styles.rotulo}>CÓDIGO DO GRUPO</Text>
        <Text style={styles.codigo} selectable>{codigo}</Text>
        <Text style={styles.ajuda}>Quem tiver o código pede para entrar e você aprova. Os grupos não aparecem em pesquisas.</Text>
        <View style={styles.linhaBotoes}>
          <TouchableOpacity style={styles.botaoContorno} onPress={copiar} activeOpacity={0.8}>
            <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={17} color={COLORS.primary} />
            <Text style={styles.botaoContornoTxt}>{copiado ? 'Copiado' : 'Copiar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoContorno} onPress={enviarCodigo} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={17} color={COLORS.primary} />
            <Text style={styles.botaoContornoTxt}>Enviar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoContorno} onPress={() => setConfirmar('renovar')} activeOpacity={0.8}>
            <Ionicons name="refresh-outline" size={17} color={COLORS.primary} />
            <Text style={styles.botaoContornoTxt}>Novo código</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.linhaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nomeCampo}>Aceitar pedidos com o código</Text>
            <Text style={styles.ajuda}>Desligado, só se entra por convite.</Text>
          </View>
          <Switch value={codigoActivo} onValueChange={setCodigoActivo} trackColor={{ true: COLORS.navbar }} accessibilityLabel="Aceitar pedidos com o código" />
        </View>
      </View>

      <View style={styles.cartao}>
        <Text style={styles.rotulo}>DADOS DO GRUPO</Text>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} maxLength={100} placeholder="Nome do grupo" placeholderTextColor={COLORS.textSecondary} />
        <View style={styles.chips}>
          {TIPOS_GRUPO.map(t => (
            <TouchableOpacity key={t.valor} style={[styles.chip, tipo === t.valor && styles.chipActivo]} onPress={() => setTipo(t.valor)} activeOpacity={0.8}>
              <Text style={[styles.chipTxt, tipo === t.valor && styles.chipTxtActivo]}>{t.rotulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={[styles.input, { minHeight: 70 }]} value={descricao} onChangeText={setDescricao} maxLength={500} multiline textAlignVertical="top"
          placeholder="Descrição (opcional)" placeholderTextColor={COLORS.textSecondary} />
        <TextInput style={styles.input} value={paroquia} onChangeText={setParoquia} maxLength={100} placeholder="Paróquia (opcional)" placeholderTextColor={COLORS.textSecondary} />
      </View>

      <View style={styles.cartao}>
        <Text style={styles.rotulo}>QUEM PUBLICA</Text>
        <View style={styles.linhaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nomeCampo}>Membros podem partilhar cânticos e orações</Text>
            <Text style={styles.ajuda}>Avisos e programas da Missa são sempre só dos administradores.</Text>
          </View>
          <Switch value={membrosPublicam} onValueChange={setMembrosPublicam} trackColor={{ true: COLORS.navbar }} accessibilityLabel="Membros podem partilhar cânticos e orações" />
        </View>
      </View>

      {!!erro && <Text style={styles.erro}>{erro}</Text>}
      {!!mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}
      {alterado && (
        <TouchableOpacity style={[styles.botao, aGuardar && { opacity: 0.6 }]} onPress={guardar} disabled={aGuardar} activeOpacity={0.85}>
          <Text style={styles.botaoTxt}>{aGuardar ? 'A guardar…' : 'Guardar alterações'}</Text>
        </TouchableOpacity>
      )}

      {grupo.podeApagar && (
        <TouchableOpacity style={styles.apagar} onPress={() => setConfirmar('apagar')} activeOpacity={0.8}>
          <Ionicons name="trash-outline" size={19} color={COLORS.error} />
          <Text style={styles.apagarTxt}>Apagar grupo</Text>
        </TouchableOpacity>
      )}

      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar === 'apagar' ? 'Apagar grupo' : 'Gerar novo código'}
        mensagem={confirmar === 'apagar'
          ? 'Apagar este grupo para todos? Todas as publicações e gravações do grupo são apagadas e não é possível desfazer.'
          : 'O código atual deixa de funcionar. Quem já é membro não é afetado.'}
        rotuloConfirmar={confirmar === 'apagar' ? 'Apagar' : 'Gerar'}
        perigoso={confirmar === 'apagar'}
        onCancelar={() => setConfirmar(null)}
        onConfirmar={async () => {
          const c = confirmar; setConfirmar(null);
          try {
            if (c === 'apagar') { await apagarGrupo(grupo.id); onApagado(); }
            else if (c === 'renovar') { setCodigo(await renovarCodigoGrupo(grupo.id)); setCodigoActivo(true); onMudou(); }
          } catch (e) { setErro(mensagemDeErro(e)); }
        }}
      />
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  corpo: { padding: 16, paddingBottom: 40, gap: 12 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 10, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  codigo: { fontSize: 28, fontWeight: '800', letterSpacing: 3, color: COLORS.primary, fontFamily: FONTS.sans, textAlign: 'center' },
  ajuda: { fontSize: 13, lineHeight: 19, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botaoContorno: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, paddingHorizontal: 14 },
  botaoContornoTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 13, fontFamily: FONTS.sans },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nomeCampo: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border },
  chipActivo: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  chipTxtActivo: { color: '#fff' },
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  mensagem: { color: COLORS.primary, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  botao: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14, alignItems: 'center' },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
  apagar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.error, marginTop: 6 },
  apagarTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.error },
});
