import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  aprovarPedidoGrupo, convidarParaGrupo, definirAdministrador, listarContactos, listarMembrosGrupo, mensagemDeErro,
  recusarPedidoGrupo, removerMembroGrupo, sairDoGrupo, type GrupoDetalhe, type MembroGrupoInfo, type MembrosGrupo, type Pessoa,
} from '../../api/conta';
import Text from '../../components/AppText';
import ConfirmarModal from '../../components/ConfirmarModal';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';

interface Props {
  grupo: GrupoDetalhe;
  onMudou: () => void;
  /** chamado depois de a pessoa sair do grupo */
  onSaiu: () => void;
}

type Confirmar = { tipo: 'remover' | 'sair'; pessoa?: MembroGrupoInfo } | null;

// Membros do grupo; os administradores aprovam pedidos, convidam contactos e gerem quem faz parte.
export default function MembrosGrupoPanel({ grupo, onMudou, onSaiu }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [dados, setDados] = useState<MembrosGrupo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aConvidar, setAConvidar] = useState(false);
  const [contactos, setContactos] = useState<Pessoa[]>([]);
  const [escolhidos, setEscolhidos] = useState<number[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Confirmar>(null);

  const carregar = useCallback(async () => {
    try { setDados(await listarMembrosGrupo(grupo.id)); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível carregar os membros.')); }
  }, [grupo.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const accao = async (fn: () => Promise<void>) => {
    try { setErro(null); setAviso(null); await fn(); await carregar(); onMudou(); }
    catch (e) { setErro(mensagemDeErro(e)); }
  };

  const abrirConvite = async () => {
    try {
      const l = await listarContactos();
      setContactos(l.contactos);
      setEscolhidos([]);
      setAConvidar(true);
    } catch (e) { setErro(mensagemDeErro(e)); }
  };

  const convidar = () => accao(async () => {
    const r = await convidarParaGrupo(grupo.id, escolhidos);
    setAConvidar(false);
    setAviso(r.convidados > 0 ? `Convite enviado a ${r.convidados} ${r.convidados === 1 ? 'pessoa' : 'pessoas'}.` : 'Nenhum convite enviado.');
  });

  const ocupados = new Set([...(dados?.membros ?? []), ...(dados?.pedidos ?? []), ...(dados?.convidados ?? [])].map(p => p.utilizadorId));
  const disponiveis = contactos.filter(c => !ocupados.has(c.utilizadorId));

  const linha = (p: MembroGrupoInfo, direita?: React.ReactNode) => (
    <View key={p.utilizadorId} style={styles.linha}>
      <View style={styles.avatar}><Text style={styles.avatarTxt}>{p.nome.trim().charAt(0).toUpperCase() || '?'}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nome} numberOfLines={1}>{p.nome}{p.euProprio ? ' (você)' : ''}</Text>
        {!!p.paroquia && <Text style={styles.sub} numberOfLines={1}>{p.paroquia}</Text>}
      </View>
      {p.administrador && <View style={styles.selo}><Text style={styles.seloTxt}>Administrador</Text></View>}
      {direita}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.corpo}>
      {!!erro && <Text style={styles.erro}>{erro}</Text>}
      {!!aviso && <Text style={styles.aviso}>{aviso}</Text>}

      {grupo.administrador && !!dados && dados.pedidos.length > 0 && (
        <View style={styles.cartao}>
          <Text style={styles.rotulo}>PEDIDOS PARA ENTRAR</Text>
          {dados.pedidos.map(p => linha(p, (
            <View style={styles.duplo}>
              <TouchableOpacity style={styles.botaoPeq} onPress={() => accao(() => aprovarPedidoGrupo(grupo.id, p.utilizadorId))} activeOpacity={0.85}>
                <Text style={styles.botaoPeqTxt}>Aprovar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoContorno} onPress={() => accao(() => recusarPedidoGrupo(grupo.id, p.utilizadorId))} activeOpacity={0.8}>
                <Text style={styles.botaoContornoTxt}>Recusar</Text>
              </TouchableOpacity>
            </View>
          )))}
        </View>
      )}

      {grupo.administrador && (
        aConvidar ? (
          <View style={styles.cartao}>
            <Text style={styles.rotulo}>CONVIDAR CONTACTOS</Text>
            {disponiveis.length === 0 ? (
              <Text style={styles.nota}>Não tem contactos para convidar. Adicione pessoas em Eu › Partilhas › Contactos, ou dê-lhes o código do grupo.</Text>
            ) : disponiveis.map(c => {
              const marcado = escolhidos.includes(c.utilizadorId);
              return (
                <TouchableOpacity key={c.utilizadorId} style={styles.linha} activeOpacity={0.7}
                  onPress={() => setEscolhidos(l => (marcado ? l.filter(x => x !== c.utilizadorId) : [...l, c.utilizadorId]))}
                  accessibilityRole="checkbox" accessibilityState={{ checked: marcado }}>
                  <Ionicons name={marcado ? 'checkbox' : 'square-outline'} size={22} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nome}>{c.nome}</Text>
                    {!!c.paroquia && <Text style={styles.sub}>{c.paroquia}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={styles.duplo}>
              <TouchableOpacity style={[styles.botaoContorno, { flex: 1, alignItems: 'center' }]} onPress={() => setAConvidar(false)} activeOpacity={0.8}>
                <Text style={styles.botaoContornoTxt}>Cancelar</Text>
              </TouchableOpacity>
              {escolhidos.length > 0 && (
                <TouchableOpacity style={[styles.botaoPeq, { flex: 1, alignItems: 'center' }]} onPress={convidar} activeOpacity={0.85}>
                  <Text style={styles.botaoPeqTxt}>Convidar ({escolhidos.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.convidar} onPress={abrirConvite} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={19} color="#fff" />
            <Text style={styles.convidarTxt}>Convidar contactos</Text>
          </TouchableOpacity>
        )
      )}

      <View style={styles.cartao}>
        <Text style={styles.rotulo}>MEMBROS ({dados?.membros.length ?? grupo.membros})</Text>
        {dados?.membros.map(p => linha(p, grupo.administrador && !p.euProprio ? (
          <View style={styles.duplo}>
            <TouchableOpacity onPress={() => accao(() => definirAdministrador(grupo.id, p.utilizadorId, !p.administrador))}
              accessibilityLabel={p.administrador ? 'Retirar administração' : 'Tornar administrador'} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <Ionicons name={p.administrador ? 'shield' : 'shield-outline'} size={20} color={COLORS.primary} />
            </TouchableOpacity>
            {!p.administrador && (
              <TouchableOpacity onPress={() => setConfirmar({ tipo: 'remover', pessoa: p })} accessibilityLabel={`Remover ${p.nome}`} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                <Ionicons name="person-remove-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            )}
          </View>
        ) : undefined))}
      </View>

      {grupo.administrador && !!dados && dados.convidados.length > 0 && (
        <View style={styles.cartao}>
          <Text style={styles.rotulo}>CONVITES POR ACEITAR</Text>
          {dados.convidados.map(p => linha(p, (
            <TouchableOpacity style={styles.botaoContorno} onPress={() => accao(() => recusarPedidoGrupo(grupo.id, p.utilizadorId))} activeOpacity={0.8}>
              <Text style={styles.botaoContornoTxt}>Cancelar</Text>
            </TouchableOpacity>
          )))}
        </View>
      )}

      <TouchableOpacity style={styles.sair} onPress={() => setConfirmar({ tipo: 'sair' })} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={19} color={COLORS.error} />
        <Text style={styles.sairTxt}>Sair do grupo</Text>
      </TouchableOpacity>

      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar?.tipo === 'sair' ? 'Sair do grupo' : 'Remover membro'}
        mensagem={confirmar?.tipo === 'sair'
          ? 'Sair deste grupo? As suas publicações no grupo são apagadas. Só volta a entrar com um convite ou com o código.'
          : `Remover ${confirmar?.pessoa?.nome ?? ''} do grupo? As publicações desta pessoa no grupo são apagadas.`}
        rotuloConfirmar={confirmar?.tipo === 'sair' ? 'Sair' : 'Remover'}
        perigoso
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          const c = confirmar; setConfirmar(null);
          if (c?.tipo === 'sair') sairDoGrupo(grupo.id).then(() => { onMudou(); onSaiu(); }).catch(e => setErro(mensagemDeErro(e)));
          else if (c?.pessoa) accao(() => removerMembroGrupo(grupo.id, c.pessoa!.utilizadorId));
        }}
      />
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  corpo: { padding: 16, paddingBottom: 40, gap: 12 },
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  aviso: { color: COLORS.primary, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  nota: { fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 8, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.primary },
  nome: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  sub: { fontSize: 12.5, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  selo: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.pill, paddingVertical: 3, paddingHorizontal: 9 },
  seloTxt: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.primary },
  duplo: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 2 },
  botaoPeq: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 8, paddingHorizontal: 14 },
  botaoPeqTxt: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: FONTS.sans },
  botaoContorno: { borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 7, paddingHorizontal: 12 },
  botaoContornoTxt: { color: COLORS.text, fontWeight: '600', fontSize: 13, fontFamily: FONTS.sans },
  convidar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 13 },
  convidarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
  sair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: COLORS.error, marginTop: 6 },
  sairTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.error },
});
