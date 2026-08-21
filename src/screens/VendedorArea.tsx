import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View, type TextInputProps,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { MOEDAS_LISTA, formatarPreco, labelMoeda } from '../constants/moeda';
import { METODOS_PAGAMENTO, metodosPorMoeda } from '../constants/metodosPagamento';
import { useLocalizacao } from '../hooks/useLocalizacao';
import { useLojaAuth } from '../context/useLojaAuth';
import AdminArea from './AdminArea';
import {
  getPerfilProprio, atualizarPerfilProprio, pausarOuReativar,
  getMeusProdutos, criarProduto, atualizarProduto, eliminarProduto,
  getMinhasEncomendas, atualizarEstadoEncomenda, uploadImagemProduto,
  type PerfilLoja, type ProdutoLoja, type ProdutoLojaPayload, type EncomendaLoja,
} from '../api/vendedor';

type AbaPainel = 'produtos' | 'encomendas' | 'perfil';

const ESTADOS = ['Pendente', 'Confirmada', 'Enviada', 'Cancelada'];
const CORES_ESTADO: Record<string, string> = {
  Pendente: '#b45309', Confirmada: '#1976d2', Enviada: '#2e7d32', Cancelada: '#b71c1c',
};

function respostaErro(e: unknown, fallback: string): string {
  const dados = (e as { response?: { data?: unknown } })?.response?.data;
  return typeof dados === 'string' ? dados : fallback;
}

// ── Peças reutilizáveis ─────────────────────────────────────────────────────

function CabecalhoVoltar({ onVoltar }: { onVoltar: () => void }) {
  return (
    <TouchableOpacity style={styles.voltarBtn} onPress={onVoltar} activeOpacity={0.7}>
      <Ionicons name="arrow-back" size={22} color={COLORS.text} />
      <Text style={styles.voltarTxt}>Voltar</Text>
    </TouchableOpacity>
  );
}

interface CampoProps extends TextInputProps {
  label: string;
}
// forwardRef permite encadear campos com o botão "seguinte" do teclado (ver
// encadearCampos), para o vendedor não ter de tocar manualmente em cada campo.
const Campo = forwardRef<TextInput, CampoProps>(function Campo({ label, style, multiline, ...rest }, ref) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        style={[styles.input, multiline && styles.inputMultilinha, style]}
        placeholderTextColor={COLORS.textSecondary}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
});

// Igual ao Campo, mas com um botão para mostrar/ocultar a palavra-passe —
// para o utilizador poder conferir o que escreveu antes de submeter.
type CampoSenhaProps = Omit<CampoProps, 'secureTextEntry'>;
const CampoSenha = forwardRef<TextInput, CampoSenhaProps>(function CampoSenha({ label, style, ...rest }, ref) {
  const [visivel, setVisivel] = useState(false);
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.senhaWrap}>
        <TextInput
          ref={ref}
          style={[styles.input, styles.senhaInput, style]}
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={!visivel}
          {...rest}
        />
        <TouchableOpacity
          onPress={() => setVisivel((v) => !v)}
          style={styles.senhaBotao}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

function SeletorMoeda({ valor, onEscolher }: { valor: string; onEscolher: (v: string) => void }) {
  return (
    <View style={styles.chipsWrap}>
      {MOEDAS_LISTA.map((m) => (
        <TouchableOpacity
          key={m.codigo}
          style={[styles.chip, valor === m.codigo && styles.chipOn]}
          onPress={() => onEscolher(m.codigo)}
          activeOpacity={0.8}
        >
          <Text style={[styles.chipTxt, valor === m.codigo && styles.chipTxtOn]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function LinhaSwitch({ label, valor, onValueChange }: { label: string; valor: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <View style={styles.linhaSwitch}>
      <Text style={[styles.label, { flex: 1, textTransform: 'none' }]}>{label}</Text>
      <Switch value={valor} onValueChange={onValueChange} trackColor={{ false: COLORS.border, true: COLORS.navbar }} thumbColor="#fff" />
    </View>
  );
}

// ── Ecrã principal ───────────────────────────────────────────────────────────
// Área nativa das lojas parceiras (não abre o site — tudo corre dentro da app).

export default function VendedorArea({ onVoltar }: { onVoltar: () => void }) {
  const { isLoja, isGestor, carregado } = useLojaAuth();
  const [modo, setModo] = useState<'login' | 'registar'>('login');

  if (!carregado) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={COLORS.navbar} />
      </View>
    );
  }

  if (isGestor) return <AdminArea onVoltar={onVoltar} />;
  if (isLoja) return <Painel onVoltar={onVoltar} />;

  return modo === 'registar'
    ? <Registar onVoltar={onVoltar} onEntrar={() => setModo('login')} />
    : <Login onVoltar={onVoltar} onRegistar={() => setModo('registar')} />;
}

// ── Login ─────────────────────────────────────────────────────────────────

function Login({ onVoltar, onRegistar }: { onVoltar: () => void; onRegistar: () => void }) {
  const { login, loginAdmin } = useLojaAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refPassword = useRef<TextInput>(null);

  const entrar = async () => {
    if (!email.trim() || !password) { setErro('Preencha o email e a palavra-passe.'); return; }
    setErro(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      return;
    } catch {
      // Não é uma loja — tenta como administrador antes de desistir, para que
      // o mesmo formulário sirva de atalho também para quem gere a plataforma.
    }
    try {
      await loginAdmin(email.trim(), password);
    } catch {
      setErro('Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CabecalhoVoltar onVoltar={onVoltar} />
        <Text style={styles.titulo}>Entrar na minha loja</Text>
        <Text style={styles.subtitulo}>Área reservada às lojas parceiras.</Text>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <View style={styles.card}>
          <Campo
            label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
            placeholder="loja@exemplo.com" returnKeyType="next" onSubmitEditing={() => refPassword.current?.focus()}
            blurOnSubmit={false}
          />
          <CampoSenha
            ref={refPassword} label="Palavra-passe" value={password} onChangeText={setPassword}
            placeholder="••••••••" returnKeyType="done" onSubmitEditing={entrar}
          />
        </View>

        <TouchableOpacity style={styles.btnPrimario} onPress={entrar} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimarioTxt}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onRegistar} style={styles.linkWrap} activeOpacity={0.7}>
          <Text style={styles.linkTxt}>Ainda não tem loja? <Text style={styles.linkTxtForte}>Registar agora</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Registo ───────────────────────────────────────────────────────────────

interface RascunhoRegisto {
  nome: string; email: string; password: string; confirmarPassword: string; telefone: string;
  morada: string; categoria: string; descricao: string; moeda: string;
}
const REGISTO_VAZIO: RascunhoRegisto = {
  nome: '', email: '', password: '', confirmarPassword: '', telefone: '', morada: '', categoria: '', descricao: '', moeda: 'AOA',
};

function Registar({ onVoltar, onEntrar }: { onVoltar: () => void; onEntrar: () => void }) {
  const { registar } = useLojaAuth();
  const { coords, estado, pedir } = useLocalizacao();
  const [form, setForm] = useState<RascunhoRegisto>(REGISTO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refEmail = useRef<TextInput>(null);
  const refPassword = useRef<TextInput>(null);
  const refConfirmarPassword = useRef<TextInput>(null);
  const refTelefone = useRef<TextInput>(null);
  const refMorada = useRef<TextInput>(null);
  const refCategoria = useRef<TextInput>(null);
  const refDescricao = useRef<TextInput>(null);

  const campo = (chave: keyof RascunhoRegisto) => (v: string) => setForm((f) => ({ ...f, [chave]: v }));

  const submeter = async () => {
    setErro(null);
    if (!coords) { setErro('Indique a localização da loja — toque em "Usar a minha localização atual".'); return; }
    if (!form.nome.trim() || !form.email.trim() || !form.password.trim()) { setErro('Nome, email e palavra-passe são obrigatórios.'); return; }
    if (form.password.length < 6) { setErro('A palavra-passe tem de ter pelo menos 6 caracteres.'); return; }
    if (form.password !== form.confirmarPassword) { setErro('As palavras-passe não coincidem.'); return; }

    setLoading(true);
    try {
      await registar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        password: form.password,
        telefone: form.telefone.trim() || undefined,
        morada: form.morada.trim() || undefined,
        categoria: form.categoria.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
        moeda: form.moeda,
        latitude: coords.lat,
        longitude: coords.lng,
      });
    } catch (e) {
      setErro(respostaErro(e, 'Não foi possível concluir o registo. Tente novamente.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CabecalhoVoltar onVoltar={onVoltar} />
        <Text style={styles.titulo}>Registar a minha loja</Text>
        <Text style={styles.subtitulo}>
          Depois de registada, a sua loja fica pendente de aprovação antes de aparecer nas pesquisas dos compradores.
        </Text>

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <View style={styles.card}>
          <Campo
            label="Nome da loja" value={form.nome} onChangeText={campo('nome')}
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refEmail.current?.focus()}
          />
          <Campo
            ref={refEmail} label="Email" value={form.email} onChangeText={campo('email')} autoCapitalize="none" keyboardType="email-address"
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refPassword.current?.focus()}
          />
          <CampoSenha
            ref={refPassword} label="Palavra-passe" value={form.password} onChangeText={campo('password')}
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refConfirmarPassword.current?.focus()}
          />
          <CampoSenha
            ref={refConfirmarPassword} label="Confirmar palavra-passe" value={form.confirmarPassword} onChangeText={campo('confirmarPassword')}
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refTelefone.current?.focus()}
          />
          <Campo
            ref={refTelefone} label="Telefone" value={form.telefone} onChangeText={campo('telefone')} keyboardType="phone-pad"
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refMorada.current?.focus()}
          />
          <Campo
            ref={refMorada} label="Morada" value={form.morada} onChangeText={campo('morada')}
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refCategoria.current?.focus()}
          />
          <Campo
            ref={refCategoria} label="Categoria (ex.: Livros, Devocionais, Artesanato...)" value={form.categoria} onChangeText={campo('categoria')}
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refDescricao.current?.focus()}
          />

          <View style={styles.campo}>
            <Text style={styles.label}>Moeda em que a loja vende</Text>
            <SeletorMoeda valor={form.moeda} onEscolher={(v) => setForm((f) => ({ ...f, moeda: v }))} />
            <Text style={styles.ajuda}>
              Todos os seus produtos e encomendas usarão esta moeda. Escolha conforme o país onde a sua loja opera.
            </Text>
          </View>

          <Campo ref={refDescricao} label="Descrição" value={form.descricao} onChangeText={campo('descricao')} multiline numberOfLines={3} />

          <View style={styles.campo}>
            <Text style={styles.label}>Localização</Text>
            <TouchableOpacity style={styles.btnSecundario} onPress={pedir} disabled={estado === 'a-pedir'} activeOpacity={0.8}>
              <Text style={styles.btnSecundarioTxt}>
                {estado === 'a-pedir' ? 'A localizar…' : coords ? '✓ Localização definida — repetir' : 'Usar a minha localização atual'}
              </Text>
            </TouchableOpacity>
            {coords && <Text style={styles.ajuda}>Lat {coords.lat.toFixed(5)}, Lng {coords.lng.toFixed(5)}</Text>}
            {estado === 'negada' && <Text style={styles.erroInline}>Permissão de localização negada — ative-a nas definições do telemóvel.</Text>}
          </View>
        </View>

        <TouchableOpacity style={styles.btnPrimario} onPress={submeter} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimarioTxt}>Registar loja</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onEntrar} style={styles.linkWrap} activeOpacity={0.7}>
          <Text style={styles.linkTxt}>Já tem conta? <Text style={styles.linkTxtForte}>Entrar</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Painel (área autenticada) ────────────────────────────────────────────

function Painel({ onVoltar }: { onVoltar: () => void }) {
  const { nome, logout } = useLojaAuth();
  const [aba, setAba] = useState<AbaPainel>('produtos');
  const [moeda, setMoeda] = useState('AOA');

  useEffect(() => {
    getPerfilProprio().then((p) => setMoeda(p.moeda)).catch(() => {});
  }, []);

  const sair = () => {
    Alert.alert('Sair', 'Terminar sessão da loja?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => { logout(); } },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.painelHeader}>
        <CabecalhoVoltar onVoltar={onVoltar} />
        <TouchableOpacity onPress={sair} activeOpacity={0.7}>
          <Text style={styles.linkTxtForte}>Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.painelTituloWrap}>
        <Text style={styles.titulo}>A minha loja</Text>
        <Text style={styles.subtitulo}>{nome}</Text>
      </View>

      <View style={styles.abasRow}>
        {([['produtos', 'Produtos'], ['encomendas', 'Encomendas'], ['perfil', 'Perfil']] as const).map(([id, label]) => (
          <TouchableOpacity key={id} style={[styles.abaBtn, aba === id && styles.abaBtnOn]} onPress={() => setAba(id)} activeOpacity={0.8}>
            <Text style={[styles.abaBtnTxt, aba === id && styles.abaBtnTxtOn]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        {aba === 'produtos' && <AbaProdutos moeda={moeda} />}
        {aba === 'encomendas' && <AbaEncomendas />}
        {aba === 'perfil' && <AbaPerfil onMoedaChange={setMoeda} />}
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Aba: Produtos ────────────────────────────────────────────────────────

interface RascunhoProduto {
  nome: string; descricao: string; preco: string; precoPromocional: string;
  emDestaque: boolean; categoria: string; imagemUrl: string; ordem: string; disponivel: boolean;
}
const RASCUNHO_PRODUTO_VAZIO: RascunhoProduto = {
  nome: '', descricao: '', preco: '', precoPromocional: '', emDestaque: false,
  categoria: '', imagemUrl: '', ordem: '0', disponivel: true,
};

function AbaProdutos({ moeda }: { moeda: string }) {
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [aEditar, setAEditar] = useState<'nova' | number | null>(null);
  const [rascunho, setRascunho] = useState<RascunhoProduto>(RASCUNHO_PRODUTO_VAZIO);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [aGuardar, setAGuardar] = useState(false);
  const [modoImagem, setModoImagem] = useState<'url' | 'ficheiro'>('url');
  const [aCarregarImagem, setACarregarImagem] = useState(false);
  const refDescricao = useRef<TextInput>(null);
  const refPreco = useRef<TextInput>(null);
  const refPrecoPromo = useRef<TextInput>(null);
  const refCategoria = useRef<TextInput>(null);
  const refImagemUrl = useRef<TextInput>(null);
  const refOrdem = useRef<TextInput>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setProdutos(await getMeusProdutos()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const iniciarNovo = () => { setRascunho(RASCUNHO_PRODUTO_VAZIO); setErroForm(null); setModoImagem('url'); setAEditar('nova'); };
  const iniciarEdicao = (p: ProdutoLoja) => {
    setRascunho({
      nome: p.nome, descricao: p.descricao ?? '', preco: String(p.preco),
      precoPromocional: p.precoPromocional != null ? String(p.precoPromocional) : '',
      emDestaque: p.emDestaque, categoria: p.categoria ?? '', imagemUrl: p.imagemUrl ?? '',
      ordem: String(p.ordem), disponivel: p.disponivel,
    });
    setErroForm(null);
    setModoImagem('url');
    setAEditar(p.id);
  };

  const escolherFicheiro = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled) return;

    setACarregarImagem(true);
    setErroForm(null);
    try {
      const url = await uploadImagemProduto(result.assets[0].uri);
      setRascunho((r) => ({ ...r, imagemUrl: url }));
    } catch {
      setErroForm('Não foi possível carregar a imagem.');
    } finally {
      setACarregarImagem(false);
    }
  };

  const guardar = async () => {
    if (!rascunho.nome.trim()) { setErroForm('O nome é obrigatório.'); return; }
    const precoNum = Number(rascunho.preco) || 0;
    const precoPromoNum = rascunho.precoPromocional === '' ? null : Number(rascunho.precoPromocional);
    if (precoPromoNum != null && (Number.isNaN(precoPromoNum) || precoPromoNum >= precoNum)) {
      setErroForm('O preço promocional tem de ser menor que o preço normal.');
      return;
    }
    setAGuardar(true);
    setErroForm(null);
    try {
      const payload: ProdutoLojaPayload = {
        nome: rascunho.nome.trim(), descricao: rascunho.descricao.trim() || null,
        preco: precoNum, precoPromocional: precoPromoNum, emDestaque: rascunho.emDestaque,
        categoria: rascunho.categoria.trim() || null, imagemUrl: rascunho.imagemUrl.trim() || null,
        ordem: Number(rascunho.ordem) || 0, disponivel: rascunho.disponivel,
      };
      if (aEditar === 'nova') await criarProduto(payload);
      else await atualizarProduto(aEditar as number, payload);
      setAEditar(null);
      await carregar();
    } catch (e) {
      setErroForm(respostaErro(e, 'Não foi possível guardar.'));
    } finally {
      setAGuardar(false);
    }
  };

  const remover = (p: ProdutoLoja) => {
    Alert.alert('Eliminar produto', `Eliminar "${p.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await eliminarProduto(p.id); await carregar(); }
          catch { Alert.alert('Erro', 'Não foi possível eliminar.'); }
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.abaContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.linhaEntreTitulo}>
        <Text style={styles.secaoTitulo}>Os meus produtos</Text>
        <TouchableOpacity style={styles.btnPrimarioPequeno} onPress={iniciarNovo} activeOpacity={0.85}>
          <Text style={styles.btnPrimarioPequenoTxt}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {aEditar !== null && (
        <View style={styles.card}>
          {erroForm && <Text style={styles.erro}>{erroForm}</Text>}
          <Campo
            label="Nome" value={rascunho.nome} onChangeText={(v) => setRascunho((r) => ({ ...r, nome: v }))}
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refDescricao.current?.focus()}
          />
          <Campo
            ref={refDescricao} label="Descrição" value={rascunho.descricao} onChangeText={(v) => setRascunho((r) => ({ ...r, descricao: v }))}
            multiline numberOfLines={3}
          />
          <Campo
            ref={refPreco} label={`Preço (${moeda})`} value={rascunho.preco} onChangeText={(v) => setRascunho((r) => ({ ...r, preco: v }))}
            keyboardType="decimal-pad" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refPrecoPromo.current?.focus()}
          />
          <Campo
            ref={refPrecoPromo} label={`Preço promocional em ${moeda} (opcional)`} value={rascunho.precoPromocional}
            onChangeText={(v) => setRascunho((r) => ({ ...r, precoPromocional: v }))} keyboardType="decimal-pad"
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refCategoria.current?.focus()}
          />
          <LinhaSwitch label="Em destaque" valor={rascunho.emDestaque} onValueChange={(v) => setRascunho((r) => ({ ...r, emDestaque: v }))} />
          <Campo
            ref={refCategoria} label="Categoria" value={rascunho.categoria} onChangeText={(v) => setRascunho((r) => ({ ...r, categoria: v }))}
            returnKeyType="next" blurOnSubmit={false}
            onSubmitEditing={() => (modoImagem === 'url' ? refImagemUrl.current?.focus() : refOrdem.current?.focus())}
          />

          <View style={styles.campo}>
            <Text style={styles.label}>Imagem</Text>
            <View style={styles.chipsWrap}>
              <TouchableOpacity style={[styles.chip, modoImagem === 'url' && styles.chipOn]} onPress={() => setModoImagem('url')} activeOpacity={0.8}>
                <Text style={[styles.chipTxt, modoImagem === 'url' && styles.chipTxtOn]}>URL da imagem</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, modoImagem === 'ficheiro' && styles.chipOn]} onPress={() => setModoImagem('ficheiro')} activeOpacity={0.8}>
                <Text style={[styles.chipTxt, modoImagem === 'ficheiro' && styles.chipTxtOn]}>Procurar no dispositivo</Text>
              </TouchableOpacity>
            </View>

            {modoImagem === 'url' ? (
              <TextInput
                ref={refImagemUrl}
                style={[styles.input, { marginTop: 10 }]}
                value={rascunho.imagemUrl}
                onChangeText={(v) => setRascunho((r) => ({ ...r, imagemUrl: v }))}
                placeholder="https://..."
                placeholderTextColor={COLORS.textSecondary}
                autoCapitalize="none"
                returnKeyType="next"
                blurOnSubmit={false}
                onSubmitEditing={() => refOrdem.current?.focus()}
              />
            ) : (
              <TouchableOpacity style={[styles.btnSecundario, { marginTop: 10 }]} onPress={escolherFicheiro} disabled={aCarregarImagem} activeOpacity={0.8}>
                {aCarregarImagem ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.btnSecundarioTxt}>Escolher imagem da galeria</Text>}
              </TouchableOpacity>
            )}

            {!!rascunho.imagemUrl && (
              <Image source={{ uri: rascunho.imagemUrl }} style={styles.previewImagem} />
            )}
          </View>

          <Campo
            ref={refOrdem} label="Ordem de exibição" value={rascunho.ordem} onChangeText={(v) => setRascunho((r) => ({ ...r, ordem: v }))}
            keyboardType="number-pad" returnKeyType="done" onSubmitEditing={guardar}
          />
          <LinhaSwitch label="Visível na loja" valor={rascunho.disponivel} onValueChange={(v) => setRascunho((r) => ({ ...r, disponivel: v }))} />
          <View style={styles.formAcoes}>
            <TouchableOpacity style={[styles.btnSecundario, styles.formAcoesBtn]} onPress={() => setAEditar(null)} activeOpacity={0.8}>
              <Text style={styles.btnSecundarioTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnPrimario, styles.formAcoesBtn]} onPress={guardar} disabled={aGuardar} activeOpacity={0.85}>
              {aGuardar ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimarioTxt}>Guardar</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />
      ) : produtos.length === 0 ? (
        <Text style={styles.vazio}>Ainda não tem produtos.</Text>
      ) : (
        produtos.map((p) => (
          <View key={p.id} style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitulo}>{p.nome}{p.emDestaque ? ' ⭐' : ''}</Text>
              {p.precoPromocional != null ? (
                <Text style={styles.itemDesc}>
                  <Text style={styles.precoRiscado}>{formatarPreco(p.preco, moeda)}</Text>
                  {'  '}
                  <Text style={styles.precoPromo}>{formatarPreco(p.precoPromocional, moeda)}</Text>
                </Text>
              ) : (
                <Text style={styles.itemDesc}>{formatarPreco(p.preco, moeda)}</Text>
              )}
              <Text style={styles.itemDescMuted}>{p.disponivel ? 'Visível na loja' : 'Oculto'}</Text>
            </View>
            <View style={{ gap: 8 }}>
              <TouchableOpacity style={styles.btnSecundarioPequeno} onPress={() => iniciarEdicao(p)} activeOpacity={0.8}>
                <Text style={styles.btnSecundarioPequenoTxt}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPerigoPequeno} onPress={() => remover(p)} activeOpacity={0.8}>
                <Text style={styles.btnPerigoPequenoTxt}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── Aba: Encomendas ──────────────────────────────────────────────────────

function AbaEncomendas() {
  const [encomendas, setEncomendas] = useState<EncomendaLoja[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setEncomendas(await getMinhasEncomendas()); } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const mudarEstado = async (enc: EncomendaLoja, estado: string) => {
    try {
      await atualizarEstadoEncomenda(enc.id, estado);
      setEncomendas((lista) => lista.map((e) => (e.id === enc.id ? { ...e, estado } : e)));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o estado.');
    }
  };

  if (loading) return <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />;

  return (
    <ScrollView contentContainerStyle={styles.abaContainer} showsVerticalScrollIndicator={false}>
      {encomendas.length === 0 ? (
        <Text style={styles.vazio}>Ainda não tem encomendas.</Text>
      ) : (
        encomendas.map((enc) => (
          <View key={enc.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitulo}>#{enc.id} — {enc.nomeCliente}</Text>
                <Text style={styles.itemDescMuted}>{enc.contacto}{enc.morada ? ` · ${enc.morada}` : ''}</Text>
                <Text style={styles.itemDescMuted}>{new Date(enc.data).toLocaleString('pt-PT')}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: `${CORES_ESTADO[enc.estado]}20` }]}>
                <Text style={[styles.badgeTxt, { color: CORES_ESTADO[enc.estado] }]}>{enc.estado}</Text>
              </View>
            </View>

            <View style={styles.itensSep}>
              {enc.itens.map((item, i) => (
                <View key={i} style={styles.itemLinha}>
                  <Text style={styles.itemDesc}>{item.quantidade}× {item.produtoNome}</Text>
                  <Text style={styles.itemDesc}>{formatarPreco(item.precoUnitario * item.quantidade, enc.moeda)}</Text>
                </View>
              ))}
              <View style={styles.itemLinha}>
                <Text style={styles.totalTxt}>Total (100% seu — sem comissão)</Text>
                <Text style={styles.totalTxt}>{formatarPreco(enc.total, enc.moeda)}</Text>
              </View>
            </View>

            <View style={styles.chipsWrap}>
              {ESTADOS.map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[styles.chip, enc.estado === estado && { backgroundColor: CORES_ESTADO[estado], borderColor: CORES_ESTADO[estado] }]}
                  onPress={() => mudarEstado(enc, estado)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipTxt, enc.estado === estado && styles.chipTxtOn]}>{estado}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ── Aba: Perfil da loja ──────────────────────────────────────────────────

function AbaPerfil({ onMoedaChange }: { onMoedaChange: (m: string) => void }) {
  const [perfil, setPerfil] = useState<PerfilLoja | null>(null);
  const { coords, estado: estadoLoc, pedir } = useLocalizacao();
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const refDescricao = useRef<TextInput>(null);
  const refTelefone = useRef<TextInput>(null);
  const refMorada = useRef<TextInput>(null);
  const refCategoria = useRef<TextInput>(null);

  useEffect(() => { getPerfilProprio().then(setPerfil).catch(() => {}); }, []);

  useEffect(() => {
    if (coords) setPerfil((p) => (p ? { ...p, latitude: coords.lat, longitude: coords.lng } : p));
  }, [coords]);

  const alternarMetodo = (codigo: string) => {
    setPerfil((p) => {
      if (!p) return p;
      const jaTem = p.formasPagamento.some((f) => f.metodo === codigo);
      const formasPagamento = jaTem
        ? p.formasPagamento.filter((f) => f.metodo !== codigo)
        : [...p.formasPagamento, { metodo: codigo, detalhe: '' }];
      return { ...p, formasPagamento };
    });
  };

  const atualizarDetalhe = (codigo: string, detalhe: string) => {
    setPerfil((p) => (p ? { ...p, formasPagamento: p.formasPagamento.map((f) => (f.metodo === codigo ? { ...f, detalhe } : f)) } : p));
  };

  const guardar = async () => {
    if (!perfil) return;
    setErro(null);
    setOk(false);
    if (perfil.formasPagamento.length === 0) { setErro('Escolha pelo menos uma forma de pagamento.'); return; }
    const semDetalhe = perfil.formasPagamento.find((f) => {
      const m = METODOS_PAGAMENTO.find((x) => x.codigo === f.metodo);
      return m?.precisaDetalhe && !f.detalhe?.trim();
    });
    if (semDetalhe) {
      const m = METODOS_PAGAMENTO.find((x) => x.codigo === semDetalhe.metodo);
      setErro(`Indique o detalhe de "${m?.label}" (ex.: número de telefone ou IBAN).`);
      return;
    }

    setAGuardar(true);
    try {
      await atualizarPerfilProprio({
        nome: perfil.nome, descricao: perfil.descricao, telefone: perfil.telefone, morada: perfil.morada,
        categoria: perfil.categoria, infoPagamento: perfil.infoPagamento, latitude: perfil.latitude,
        longitude: perfil.longitude, formasPagamento: perfil.formasPagamento, moeda: perfil.moeda,
      });
      setOk(true);
      onMoedaChange(perfil.moeda);
    } catch (e) {
      setErro(respostaErro(e, 'Não foi possível guardar.'));
    } finally {
      setAGuardar(false);
    }
  };

  const alternarPausa = async () => {
    if (!perfil) return;
    const novaAtiva = !perfil.ativa;
    try {
      await pausarOuReativar(novaAtiva);
      setPerfil((p) => (p ? { ...p, ativa: novaAtiva } : p));
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar.');
    }
  };

  if (!perfil) return <ActivityIndicator color={COLORS.navbar} style={{ marginTop: 20 }} />;

  return (
    <ScrollView contentContainerStyle={styles.abaContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[styles.aviso, perfil.aprovada ? styles.avisoOk : styles.avisoPendente]}>
        <Text style={perfil.aprovada ? styles.avisoOkTxt : styles.avisoPendenteTxt}>
          {perfil.aprovada
            ? 'A sua loja está aprovada e visível para os compradores.'
            : 'A sua loja ainda está pendente de aprovação pelo administrador. Pode preparar o perfil e os produtos entretanto.'}
        </Text>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}
      {ok && <Text style={styles.sucesso}>Guardado com sucesso.</Text>}

      <View style={styles.card}>
        <Campo
          label="Nome" value={perfil.nome} onChangeText={(v) => setPerfil((p) => (p ? { ...p, nome: v } : p))}
          returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refDescricao.current?.focus()}
        />
        <Campo
          ref={refDescricao} label="Descrição" value={perfil.descricao ?? ''} onChangeText={(v) => setPerfil((p) => (p ? { ...p, descricao: v } : p))}
          multiline numberOfLines={3}
        />
        <Campo
          ref={refTelefone} label="Telefone" value={perfil.telefone ?? ''} onChangeText={(v) => setPerfil((p) => (p ? { ...p, telefone: v } : p))}
          keyboardType="phone-pad" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refMorada.current?.focus()}
        />
        <Campo
          ref={refMorada} label="Morada" value={perfil.morada ?? ''} onChangeText={(v) => setPerfil((p) => (p ? { ...p, morada: v } : p))}
          returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => refCategoria.current?.focus()}
        />
        <Campo
          ref={refCategoria} label="Categoria" value={perfil.categoria ?? ''} onChangeText={(v) => setPerfil((p) => (p ? { ...p, categoria: v } : p))}
          returnKeyType="done" onSubmitEditing={guardar}
        />

        <View style={styles.campo}>
          <Text style={styles.label}>Moeda em que a loja vende</Text>
          <SeletorMoeda
            valor={perfil.moeda}
            onEscolher={(v) => setPerfil((p) => {
              if (!p) return p;
              const validos = metodosPorMoeda(v).map((m) => m.codigo);
              return { ...p, moeda: v, formasPagamento: p.formasPagamento.filter((f) => validos.includes(f.metodo)) };
            })}
          />
          <Text style={styles.ajuda}>
            Todos os seus produtos e novas encomendas passam a usar esta moeda. Encomendas já feitas mantêm a moeda
            em que foram criadas. As formas de pagamento abaixo também mudam consoante o país da moeda escolhida.
          </Text>
        </View>
      </View>

      <View style={[styles.aviso, styles.avisoInfo]}>
        <Text style={styles.avisoInfoTxt}>
          A Ndatava não cobra nenhuma comissão sobre as suas vendas — o valor de cada encomenda é
          inteiramente seu. Se um dia quiser apoiar a manutenção do serviço, pode fazê-lo voluntariamente,
          segundo as suas possibilidades, na página de Apoio. Nunca é uma cobrança nem uma condição para vender.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Formas de pagamento aceites em {labelMoeda(perfil.moeda)}</Text>
        {metodosPorMoeda(perfil.moeda).map((metodo) => {
          const selecionado = perfil.formasPagamento.find((f) => f.metodo === metodo.codigo);
          return (
            <View key={metodo.codigo} style={styles.metodoBox}>
              <TouchableOpacity style={styles.linhaSwitch} onPress={() => alternarMetodo(metodo.codigo)} activeOpacity={0.8}>
                <Text style={[styles.label, { flex: 1, textTransform: 'none' }]}>{metodo.label}</Text>
                <Switch value={!!selecionado} onValueChange={() => alternarMetodo(metodo.codigo)} trackColor={{ false: COLORS.border, true: COLORS.navbar }} thumbColor="#fff" />
              </TouchableOpacity>
              {selecionado && metodo.precisaDetalhe && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder={metodo.placeholderDetalhe}
                  placeholderTextColor={COLORS.textSecondary}
                  value={selecionado.detalhe ?? ''}
                  onChangeText={(v) => atualizarDetalhe(metodo.codigo, v)}
                />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Campo
          label="Instruções adicionais (opcional)"
          value={perfil.infoPagamento ?? ''}
          onChangeText={(v) => setPerfil((p) => (p ? { ...p, infoPagamento: v } : p))}
          multiline
          numberOfLines={2}
          placeholder="Ex.: Levantamento das 9h às 17h, titular da conta: Loja Exemplo Lda"
        />
        <View style={styles.campo}>
          <Text style={styles.label}>Localização</Text>
          <TouchableOpacity style={styles.btnSecundario} onPress={pedir} disabled={estadoLoc === 'a-pedir'} activeOpacity={0.8}>
            <Text style={styles.btnSecundarioTxt}>{estadoLoc === 'a-pedir' ? 'A localizar…' : 'Atualizar para a minha localização atual'}</Text>
          </TouchableOpacity>
          <Text style={styles.ajuda}>Lat {perfil.latitude?.toFixed?.(5)}, Lng {perfil.longitude?.toFixed?.(5)}</Text>
        </View>
      </View>

      <View style={styles.formAcoes}>
        <TouchableOpacity style={[styles.btnSecundario, styles.formAcoesBtn]} onPress={alternarPausa} activeOpacity={0.8}>
          <Text style={styles.btnSecundarioTxt}>{perfil.ativa ? 'Pausar loja' : 'Reativar loja'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnPrimario, styles.formAcoesBtn]} onPress={guardar} disabled={aGuardar} activeOpacity={0.85}>
          {aGuardar ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimarioTxt}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  container: { padding: 16, paddingBottom: 48, backgroundColor: COLORS.background },

  voltarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  voltarTxt: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },

  titulo: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginTop: 8 },
  subtitulo: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 4, marginBottom: 16, lineHeight: 19 },

  erro: { color: COLORS.error, fontFamily: FONTS.serif, fontSize: 13, marginBottom: 12 },
  erroInline: { color: COLORS.error, fontFamily: FONTS.serif, fontSize: 12, marginTop: 6 },
  sucesso: { color: '#2e7d32', fontFamily: FONTS.serif, fontSize: 13, marginBottom: 12 },

  card: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  campo: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, color: COLORS.text, fontFamily: FONTS.serif, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  inputMultilinha: { minHeight: 72, textAlignVertical: 'top' },
  senhaWrap: { position: 'relative', justifyContent: 'center' },
  senhaInput: { paddingRight: 44 },
  senhaBotao: { position: 'absolute', right: 4, height: '100%', paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  ajuda: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 6, lineHeight: 17 },
  previewImagem: { width: 96, height: 96, borderRadius: 8, marginTop: 10, backgroundColor: COLORS.border },

  btnPrimario: {
    backgroundColor: COLORS.navbar, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', minHeight: 50,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 5, elevation: 2,
  },
  btnPrimarioTxt: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: FONTS.serif, letterSpacing: 0.2 },
  btnSecundario: {
    borderWidth: 1.5, borderColor: COLORS.borderDark, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', minHeight: 50, backgroundColor: COLORS.surface,
  },
  btnSecundarioTxt: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, letterSpacing: 0.2 },
  formAcoesBtn: { flex: 1 },

  linkWrap: { marginTop: 18, alignItems: 'center' },
  linkTxt: { fontSize: 14, color: COLORS.textSecondary, fontFamily: FONTS.serif },
  linkTxtForte: { fontWeight: '700', color: COLORS.primary },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 13 },
  chipOn: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.serif, fontWeight: '600' },
  chipTxtOn: { color: '#fff' },

  linhaSwitch: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  metodoBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 10, marginBottom: 10 },

  aviso: { borderRadius: 10, padding: 14, marginBottom: 16 },
  avisoOk: { backgroundColor: '#e8f5e9' },
  avisoOkTxt: { color: '#2e7d32', fontFamily: FONTS.serif, fontSize: 13, lineHeight: 19 },
  avisoPendente: { backgroundColor: '#fff3e0' },
  avisoPendenteTxt: { color: '#e65100', fontFamily: FONTS.serif, fontSize: 13, lineHeight: 19 },
  avisoInfo: { backgroundColor: '#eef4fc' },
  avisoInfoTxt: { color: '#1c4a7a', fontFamily: FONTS.serif, fontSize: 13, lineHeight: 19 },

  painelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  painelTituloWrap: { paddingHorizontal: 16, marginBottom: 12 },
  abasRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  abaBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  abaBtnOn: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  abaBtnTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  abaBtnTxtOn: { color: '#fff' },

  abaContainer: { paddingHorizontal: 16, paddingBottom: 48 },
  linhaEntreTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  secaoTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },

  btnPrimarioPequeno: { backgroundColor: COLORS.navbar, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
  btnPrimarioPequenoTxt: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.serif },
  btnSecundarioPequeno: { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  btnSecundarioPequenoTxt: { fontSize: 12, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  btnPerigoPequeno: { borderWidth: 1, borderColor: COLORS.error, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 },
  btnPerigoPequenoTxt: { fontSize: 12, fontWeight: '600', color: COLORS.error, fontFamily: FONTS.serif },
  formAcoes: { flexDirection: 'row', gap: 10, marginTop: 4 },

  vazio: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', marginTop: 24 },

  itemCard: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  itemTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginBottom: 4 },
  itemDesc: { fontSize: 13, color: COLORS.text, fontFamily: FONTS.serif },
  itemDescMuted: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 2 },
  precoRiscado: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
  precoPromo: { color: '#c0392b', fontWeight: '700' },

  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  badgeTxt: { fontSize: 11, fontWeight: '700', fontFamily: FONTS.serif },

  itensSep: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 10, paddingTop: 10, marginBottom: 12 },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  totalTxt: { fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif, marginTop: 4 },
});
