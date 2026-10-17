import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  aceitarConviteGrupo, criarGrupo, entrarNoGrupo, listarGrupos, mensagemDeErro, recusarConviteGrupo, TIPOS_GRUPO,
  type ListaGrupos, type TipoGrupo,
} from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import ContaAuth from '../partilhas/ContaAuth';
import GrupoScreen from './GrupoScreen';

type Vista = { t: 'lista' } | { t: 'criar' } | { t: 'grupo'; id: number };

const icone = (t: TipoGrupo) => (TIPOS_GRUPO.find(x => x.valor === t)?.icone ?? 'albums-outline') as keyof typeof Ionicons.glyphMap;

// "Eu › Grupos": coral, oração, pastoral… com mural de avisos, cânticos, orações e programas.
export default function GruposScreen({ onVoltar }: { onVoltar: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { carregado, autenticado, atualizarNaoLidas } = useConta();

  const [vista, setVista] = useState<Vista>({ t: 'lista' });
  const [lista, setLista] = useState<ListaGrupos | null>(null);
  const [aActualizar, setAActualizar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [codigo, setCodigo] = useState('');
  const [aEntrar, setAEntrar] = useState(false);

  // formulário "criar"
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoGrupo>('coral');
  const [descricao, setDescricao] = useState('');
  const [paroquia, setParoquia] = useState('');
  const [aCriar, setACriar] = useState(false);

  const recarregar = useCallback(async () => {
    try {
      setAActualizar(true);
      setErro(null);
      setLista(await listarGrupos());
      atualizarNaoLidas();
    } catch (e) { setErro(mensagemDeErro(e, 'Não foi possível carregar os grupos. Puxe para actualizar.')); }
    finally { setAActualizar(false); }
  }, [atualizarNaoLidas]);

  useEffect(() => { if (autenticado && vista.t === 'lista') recarregar(); }, [autenticado, vista.t, recarregar]);

  const accao = async (fn: () => Promise<void>) => {
    try { setErro(null); setAviso(null); await fn(); await recarregar(); }
    catch (e) { setErro(mensagemDeErro(e)); }
  };

  const entrar = async () => {
    if (!codigo.trim()) return;
    try {
      setAEntrar(true); setErro(null); setAviso(null);
      const r = await entrarNoGrupo(codigo.trim());
      setCodigo('');
      if (r.estado === 'membro') setVista({ t: 'grupo', id: r.grupoId });
      else { setAviso(`Pedido enviado ao grupo «${r.nome}». Um administrador tem de o aprovar.`); await recarregar(); }
    } catch (e) { setErro(mensagemDeErro(e)); }
    finally { setAEntrar(false); }
  };

  const criar = async () => {
    if (nome.trim().length < 2) { setErro('Indique o nome do grupo.'); return; }
    try {
      setACriar(true); setErro(null);
      const id = await criarGrupo({ nome: nome.trim(), tipo, descricao: descricao.trim(), paroquia: paroquia.trim() });
      setNome(''); setDescricao(''); setParoquia(''); setTipo('coral');
      setVista({ t: 'grupo', id });
    } catch (e) { setErro(mensagemDeErro(e)); }
    finally { setACriar(false); }
  };

  const voltarLista = () => { setVista({ t: 'lista' }); setErro(null); };

  const cabecalho = (
    <TouchableOpacity style={styles.voltar} onPress={onVoltar} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      <Text style={styles.voltarTxt}>Voltar</Text>
    </TouchableOpacity>
  );

  if (!carregado) return <View style={styles.ecra}>{cabecalho}</View>;
  if (!autenticado) return <View style={styles.ecra}>{cabecalho}<ContaAuth /></View>;

  if (vista.t === 'grupo') return <GrupoScreen id={vista.id} onVoltar={voltarLista} />;

  if (vista.t === 'criar') {
    return (
      <KeyboardAvoidingView style={styles.ecra} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.voltar} onPress={voltarLista} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          <Text style={styles.voltarTxt}>Grupos</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
          <Text style={styles.titulo}>Novo grupo</Text>
          <View style={styles.cartao}>
            <Text style={styles.rotulo}>NOME DO GRUPO</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} maxLength={100} placeholder="Ex.: Coral São José" placeholderTextColor={COLORS.textSecondary} />
            <Text style={[styles.rotulo, { marginTop: 8 }]}>TIPO</Text>
            <View style={styles.chips}>
              {TIPOS_GRUPO.map(t => (
                <TouchableOpacity key={t.valor} style={[styles.chip, tipo === t.valor && styles.chipActivo]} onPress={() => setTipo(t.valor)} activeOpacity={0.8}>
                  <Ionicons name={t.icone as keyof typeof Ionicons.glyphMap} size={15} color={tipo === t.valor ? '#fff' : COLORS.primary} />
                  <Text style={[styles.chipTxt, tipo === t.valor && styles.chipTxtActivo]}>{t.rotulo}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.rotulo, { marginTop: 8 }]}>DESCRIÇÃO (OPCIONAL)</Text>
            <TextInput style={[styles.input, { minHeight: 80 }]} value={descricao} onChangeText={setDescricao} maxLength={500} multiline textAlignVertical="top"
              placeholder="Ex.: Ensaios ao sábado, às 16h" placeholderTextColor={COLORS.textSecondary} />
            <Text style={[styles.rotulo, { marginTop: 8 }]}>PARÓQUIA (OPCIONAL)</Text>
            <TextInput style={styles.input} value={paroquia} onChangeText={setParoquia} maxLength={100} placeholder="Ex.: São José, Luanda" placeholderTextColor={COLORS.textSecondary} />
          </View>
          <Text style={styles.nota}>
            Quem cria o grupo fica administrador: publica avisos e programas, convida contactos e aprova quem pede para entrar com o código.
          </Text>
          {!!erro && <Text style={styles.erro}>{erro}</Text>}
          <TouchableOpacity style={[styles.botao, aCriar && { opacity: 0.6 }]} onPress={criar} disabled={aCriar} activeOpacity={0.85}>
            <Text style={styles.botaoTxt}>{aCriar ? 'A criar…' : 'Criar grupo'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.ecra}>
      {cabecalho}
      <ScrollView
        contentContainerStyle={styles.corpo}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={recarregar} tintColor={COLORS.primary} />}
      >
        <Text style={styles.titulo}>Grupos</Text>
        <Text style={styles.intro}>Corais, grupos de oração e outros: partilhe avisos, cânticos, orações e programas da Missa.</Text>

        <TouchableOpacity style={styles.botao} onPress={() => { setErro(null); setVista({ t: 'criar' }); }} activeOpacity={0.85}>
          <Ionicons name="add-circle-outline" size={21} color="#fff" />
          <Text style={styles.botaoTxt}>Criar grupo</Text>
        </TouchableOpacity>

        <View style={styles.cartao}>
          <Text style={styles.rotulo}>ENTRAR COM CÓDIGO</Text>
          <View style={styles.linhaCodigo}>
            <TextInput style={[styles.input, { flex: 1, letterSpacing: 1 }]} value={codigo} onChangeText={setCodigo} onSubmitEditing={entrar}
              placeholder="GRP-XXXXX" placeholderTextColor={COLORS.textSecondary} autoCapitalize="characters" autoCorrect={false} returnKeyType="go" />
            <TouchableOpacity style={[styles.botaoPeq, (aEntrar || !codigo.trim()) && { opacity: 0.5 }]} onPress={entrar} disabled={aEntrar || !codigo.trim()} activeOpacity={0.85}>
              <Text style={styles.botaoPeqTxt}>{aEntrar ? '…' : 'Entrar'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.nota}>Um administrador do grupo tem de aprovar o seu pedido.</Text>
        </View>

        {!!erro && <Text style={styles.erro}>{erro}</Text>}
        {!!aviso && <Text style={styles.aviso}>{aviso}</Text>}

        {!!lista && lista.convites.length > 0 && (
          <View style={styles.cartao}>
            <Text style={styles.rotulo}>CONVITES</Text>
            {lista.convites.map(c => (
              <View key={c.id} style={styles.linha}>
                <View style={styles.avatar}><Ionicons name={icone(c.tipo)} size={18} color={COLORS.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome} numberOfLines={1}>{c.nome}</Text>
                  {!!c.paroquia && <Text style={styles.sub} numberOfLines={1}>{c.paroquia}</Text>}
                </View>
                <TouchableOpacity style={styles.botaoPeq} onPress={() => accao(() => aceitarConviteGrupo(c.id))} activeOpacity={0.85}>
                  <Text style={styles.botaoPeqTxt}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoContorno} onPress={() => accao(() => recusarConviteGrupo(c.id))} activeOpacity={0.8}>
                  <Text style={styles.botaoContornoTxt}>Recusar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {lista && lista.grupos.length === 0 && lista.convites.length === 0 && (
          <Text style={styles.vazio}>Ainda não pertence a nenhum grupo. Crie um ou entre com o código que lhe deram.</Text>
        )}

        {lista?.grupos.map(g => {
          const novidades = g.naoLidas + g.pedidos;
          return (
            <TouchableOpacity key={g.id} style={styles.grupo} onPress={() => setVista({ t: 'grupo', id: g.id })} activeOpacity={0.75}>
              <View style={styles.avatarGrande}><Ionicons name={icone(g.tipo)} size={22} color={COLORS.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.grupoNome} numberOfLines={1}>{g.nome}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {g.membros} {g.membros === 1 ? 'membro' : 'membros'}{g.paroquia ? ` · ${g.paroquia}` : ''}{g.administrador ? ' · administrador' : ''}
                </Text>
              </View>
              {novidades > 0 && <View style={styles.badge}><Text style={styles.badgeTxt}>{novidades > 9 ? '9+' : novidades}</Text></View>}
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          );
        })}

        {!!lista && lista.aguardam.length > 0 && (
          <View style={styles.cartao}>
            <Text style={styles.rotulo}>A AGUARDAR APROVAÇÃO</Text>
            {lista.aguardam.map(g => (
              <View key={g.id} style={styles.linha}>
                <View style={styles.avatar}><Ionicons name="time-outline" size={18} color={COLORS.textSecondary} /></View>
                <Text style={[styles.nome, { flex: 1 }]} numberOfLines={1}>{g.nome}</Text>
                <TouchableOpacity style={styles.botaoContorno} onPress={() => accao(() => recusarConviteGrupo(g.id))} activeOpacity={0.8}>
                  <Text style={styles.botaoContornoTxt}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 16 },
  voltarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  corpo: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  titulo: { fontSize: 26, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  intro: { fontSize: 14, lineHeight: 21, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  nota: { fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans },
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  aviso: { color: COLORS.primary, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  vazio: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 8, lineHeight: 21 },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 8, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans,
  },
  linhaCodigo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 13, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border },
  chipActivo: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  chipTxtActivo: { color: '#fff' },
  botao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
  botaoPeq: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 10, paddingHorizontal: 16 },
  botaoPeqTxt: { color: '#fff', fontWeight: '700', fontSize: 13.5, fontFamily: FONTS.sans },
  botaoContorno: { borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, paddingHorizontal: 12 },
  botaoContornoTxt: { color: COLORS.text, fontWeight: '600', fontSize: 13, fontFamily: FONTS.sans },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarGrande: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  sub: { fontSize: 12.5, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  grupo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 14, ...SHADOW.card },
  grupoNome: { fontSize: 17, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#fff', fontFamily: FONTS.sans },
});
