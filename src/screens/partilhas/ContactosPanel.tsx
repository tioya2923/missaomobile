import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  aceitarPedido, listarContactos, mensagemDeErro, pedirContacto, pesquisarPessoas, recusarPedido, removerContacto,
  type EstadoLigacao, type ListaContactos, type Pessoa, type PessoaPesquisa,
} from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import ConfirmarModal from '../../components/ConfirmarModal';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';

// Procurar pessoas pelo nome, responder a pedidos e gerir a lista de contactos.
export default function ContactosPanel({ onMudou }: { onMudou: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [lista, setLista] = useState<ListaContactos | null>(null);
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<PessoaPesquisa[] | null>(null);
  const [aPesquisar, setAPesquisar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aRemover, setARemover] = useState<Pessoa | null>(null);
  const pedidoActual = useRef(0);

  const carregar = useCallback(async () => {
    try { setLista(await listarContactos()); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível carregar os contactos.')); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const pesquisar = useCallback(async (t: string) => {
    const texto = t.trim();
    const n = ++pedidoActual.current;
    if (texto.length < 3) { setResultados(null); setAPesquisar(false); return; }
    try {
      setAPesquisar(true);
      setErro(null);
      const r = await pesquisarPessoas(texto);
      if (n === pedidoActual.current) setResultados(r);
    } catch (e) {
      if (n === pedidoActual.current) { setResultados(null); setErro(mensagemDeErro(e)); }
    } finally {
      if (n === pedidoActual.current) setAPesquisar(false);
    }
  }, []);

  // Pesquisa quando o utilizador pára de escrever, para não esgotar o limite de pesquisas.
  useEffect(() => {
    const t = setTimeout(() => pesquisar(termo), 600);
    return () => clearTimeout(t);
  }, [termo, pesquisar]);

  const depoisDeMudar = async () => { await carregar(); onMudou(); };

  const adicionar = async (p: PessoaPesquisa) => {
    try {
      const estado = await pedirContacto(p.utilizadorId);
      setResultados(l => l?.map(x => (x.utilizadorId === p.utilizadorId ? { ...x, estado } : x)) ?? null);
      await depoisDeMudar();
    } catch (e) { setErro(mensagemDeErro(e)); }
  };

  const accao = async (fn: () => Promise<void>) => {
    try { setErro(null); await fn(); await depoisDeMudar(); if (termo.trim().length >= 3) pesquisar(termo); }
    catch (e) { setErro(mensagemDeErro(e)); }
  };

  const rotuloEstado: Record<EstadoLigacao, string | null> = { nenhum: null, enviado: 'Pedido enviado', recebido: 'Pediu para ser seu contacto', contacto: 'Já é contacto' };

  const linhaPessoa = (p: Pessoa, direita: React.ReactNode) => (
    <View key={p.id} style={styles.linha}>
      <View style={styles.avatar}><Text style={styles.avatarTxt}>{p.nome.trim().charAt(0).toUpperCase() || '?'}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.nome} numberOfLines={1}>{p.nome}</Text>
        {!!p.paroquia && <Text style={styles.sub} numberOfLines={1}>{p.paroquia}</Text>}
      </View>
      {direita}
    </View>
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.pesquisa}>
        <Ionicons name="search-outline" size={19} color={COLORS.textSecondary} />
        <TextInput
          style={styles.pesquisaInput}
          value={termo}
          onChangeText={setTermo}
          placeholder="Procurar pessoa pelo nome"
          placeholderTextColor={COLORS.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!termo && (
          <TouchableOpacity onPress={() => setTermo('')} accessibilityLabel="Limpar pesquisa" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {termo.trim().length > 0 && termo.trim().length < 3 && <Text style={styles.nota}>Escreva pelo menos 3 letras do nome.</Text>}
      {!!erro && <Text style={styles.erro}>{erro}</Text>}

      {resultados && (
        <View style={styles.cartao}>
          <Text style={styles.rotulo}>{aPesquisar ? 'A PROCURAR…' : 'RESULTADOS'}</Text>
          {resultados.length === 0 && !aPesquisar && (
            <Text style={styles.nota}>Ninguém encontrado. A pessoa pode ter desligado a pesquisa — nesse caso peça-lhe o código dela.</Text>
          )}
          {resultados.map(p => (
            <View key={p.utilizadorId} style={styles.linha}>
              <View style={styles.avatar}><Text style={styles.avatarTxt}>{p.nome.trim().charAt(0).toUpperCase() || '?'}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nome} numberOfLines={1}>{p.nome}</Text>
                {!!p.paroquia && <Text style={styles.sub} numberOfLines={1}>{p.paroquia}</Text>}
                {!!rotuloEstado[p.estado] && <Text style={styles.estado}>{rotuloEstado[p.estado]}</Text>}
              </View>
              {(p.estado === 'nenhum' || p.estado === 'recebido') && (
                <TouchableOpacity style={styles.botaoPeq} onPress={() => adicionar(p)} activeOpacity={0.85}>
                  <Text style={styles.botaoPeqTxt}>{p.estado === 'recebido' ? 'Aceitar' : 'Adicionar'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {!!lista && lista.recebidos.length > 0 && (
        <View style={styles.cartao}>
          <Text style={styles.rotulo}>PEDIDOS RECEBIDOS</Text>
          {lista.recebidos.map(p => linhaPessoa(p, (
            <View style={styles.duplo}>
              <TouchableOpacity style={styles.botaoPeq} onPress={() => accao(() => aceitarPedido(p.id))} activeOpacity={0.85}>
                <Text style={styles.botaoPeqTxt}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoContorno} onPress={() => accao(() => recusarPedido(p.id))} activeOpacity={0.8}>
                <Text style={styles.botaoContornoTxt}>Recusar</Text>
              </TouchableOpacity>
            </View>
          )))}
        </View>
      )}

      <View style={styles.cartao}>
        <Text style={styles.rotulo}>OS MEUS CONTACTOS</Text>
        {lista && lista.contactos.length === 0 && (
          <Text style={styles.nota}>Ainda não tem contactos. Procure uma pessoa pelo nome e toque em Adicionar; ela tem de aceitar.</Text>
        )}
        {lista?.contactos.map(p => linhaPessoa(p, (
          <TouchableOpacity onPress={() => setARemover(p)} accessibilityLabel={`Remover ${p.nome}`} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="person-remove-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )))}
      </View>

      {!!lista && lista.enviados.length > 0 && (
        <View style={styles.cartao}>
          <Text style={styles.rotulo}>PEDIDOS ENVIADOS</Text>
          {lista.enviados.map(p => linhaPessoa(p, (
            <TouchableOpacity style={styles.botaoContorno} onPress={() => accao(() => recusarPedido(p.id))} activeOpacity={0.8}>
              <Text style={styles.botaoContornoTxt}>Cancelar</Text>
            </TouchableOpacity>
          )))}
        </View>
      )}

      <ConfirmarModal
        visivel={!!aRemover}
        titulo="Remover contacto"
        mensagem={`Remover ${aRemover?.nome ?? ''} dos seus contactos? Deixam de poder enviar-se cânticos pela lista, mas pode voltar a adicionar a pessoa quando quiser.`}
        rotuloConfirmar="Remover"
        perigoso
        onCancelar={() => setARemover(null)}
        onConfirmar={() => { const p = aRemover; setARemover(null); if (p) accao(() => removerContacto(p.utilizadorId)); }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  pesquisa: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.surface, borderRadius: RADIUS.pill,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
  },
  pesquisaInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text, fontFamily: FONTS.sans },
  nota: { fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans },
  erro: { fontSize: 13.5, color: COLORS.error, fontFamily: FONTS.sans, textAlign: 'center' },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 8, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 16, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.primary },
  nome: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  sub: { fontSize: 12.5, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  estado: { fontSize: 12, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.primary, marginTop: 1 },
  duplo: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  botaoPeq: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 8, paddingHorizontal: 14 },
  botaoPeqTxt: { color: '#fff', fontWeight: '700', fontSize: 13, fontFamily: FONTS.sans },
  botaoContorno: { borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 7, paddingHorizontal: 12 },
  botaoContornoTxt: { color: COLORS.text, fontWeight: '600', fontSize: 13, fontFamily: FONTS.sans },
});
