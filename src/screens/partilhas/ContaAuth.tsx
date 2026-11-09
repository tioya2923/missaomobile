import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput as CampoNativo, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mensagemDeErro, pedirCodigoRecuperacao } from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import { COMPORTAMENTO_TECLADO } from '../../utils/teclado';

// Entrar ou criar a conta que permite enviar e receber cânticos dentro da app.
export default function ContaAuth({ onFeito }: { onFeito?: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { entrar, registar, redefinirSenha } = useConta();

  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const emailRef = useRef<CampoNativo>(null);
  const passwordRef = useRef<CampoNativo>(null);
  const novaRef = useRef<CampoNativo>(null);
  // Recuperar a palavra-passe: primeiro pede-se o código por email, depois escreve-se o código e a palavra-passe nova.
  const [recuperar, setRecuperar] = useState<null | 'pedir' | 'codigo'>(null);
  const [codigo, setCodigo] = useState('');
  const [novaPassword, setNovaPassword] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const submeter = async () => {
    setErro(null);
    if (modo === 'criar' && !nome.trim()) { setErro('Escreva o seu nome.'); return; }
    if (!email.trim() || !password) { setErro('Preencha o email e a palavra-passe.'); return; }
    if (modo === 'criar' && password.length < 8) { setErro('A palavra-passe deve ter pelo menos 8 caracteres.'); return; }
    try {
      setAEnviar(true);
      if (modo === 'criar') await registar(nome, email, password);
      else await entrar(email, password);
      onFeito?.();
    } catch (e) {
      setErro(mensagemDeErro(e, modo === 'criar' ? 'Não foi possível criar a conta.' : 'Não foi possível entrar. Verifique o email e a palavra-passe.'));
    } finally {
      setAEnviar(false);
    }
  };

  const pedirCodigo = async () => {
    setErro(null);
    if (!email.trim()) { setErro('Escreva o email da sua conta.'); return; }
    try {
      setAEnviar(true);
      setAviso(await pedirCodigoRecuperacao(email.trim()));
      setRecuperar('codigo');
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível enviar o código. Verifique a ligação e tente de novo.'));
    } finally {
      setAEnviar(false);
    }
  };

  const redefinir = async () => {
    setErro(null);
    if (codigo.length !== 6) { setErro('Escreva o código de 6 dígitos que recebeu por email.'); return; }
    if (novaPassword.length < 8) { setErro('A palavra-passe deve ter pelo menos 8 caracteres.'); return; }
    try {
      setAEnviar(true);
      await redefinirSenha(email, codigo, novaPassword);
      onFeito?.();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível redefinir a palavra-passe.'));
    } finally {
      setAEnviar(false);
    }
  };

  const sairDaRecuperacao = () => { setRecuperar(null); setErro(null); setAviso(null); setCodigo(''); setNovaPassword(''); setModo('entrar'); };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={COMPORTAMENTO_TECLADO}>
      <ScrollView keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
        <View style={styles.icone}><Ionicons name="people-outline" size={34} color={COLORS.primary} /></View>
        <Text style={styles.titulo}>Partilhar cânticos</Text>
        <Text style={styles.intro}>
          Com uma conta, pode enviar os seus cânticos (letra e gravação) a outras pessoas que usem a Ndatava, e receber os delas.
          A conta serve só para isto: as pessoas só lhe enviam cânticos se tiverem o seu código.
        </Text>

        {!recuperar && (<>
        <View style={styles.separadores}>
          {(['entrar', 'criar'] as const).map(m => (
            <TouchableOpacity key={m} style={[styles.sep, modo === m && styles.sepActivo]} onPress={() => { setModo(m); setErro(null); }} activeOpacity={0.8}>
              <Text style={[styles.sepTxt, modo === m && styles.sepTxtActivo]}>{m === 'entrar' ? 'Entrar' : 'Criar conta'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.cartao}>
          {modo === 'criar' && (
            <>
              <Text style={styles.rotulo}>NOME</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="O seu nome" placeholderTextColor={COLORS.textSecondary} autoCapitalize="words"
                autoComplete="name" textContentType="name" returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => emailRef.current?.focus()} />
            </>
          )}
          <Text style={styles.rotulo}>EMAIL</Text>
          <TextInput ref={emailRef} style={styles.input} value={email} onChangeText={setEmail} placeholder="nome@exemplo.com" placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
            returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => passwordRef.current?.focus()} />
          <Text style={styles.rotulo}>PALAVRA-PASSE</Text>
          <View style={styles.linhaSenha}>
            <TextInput ref={passwordRef} style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Pelo menos 8 caracteres"
              placeholderTextColor={COLORS.textSecondary} secureTextEntry={!ver} autoCapitalize="none" autoCorrect={false}
              autoComplete={modo === 'criar' ? 'new-password' : 'current-password'} textContentType={modo === 'criar' ? 'newPassword' : 'password'}
              returnKeyType="done" onSubmitEditing={submeter} />
            <TouchableOpacity onPress={() => setVer(v => !v)} style={styles.olho} accessibilityLabel={ver ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}>
              <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {!!erro && <Text style={styles.erro}>{erro}</Text>}

          <TouchableOpacity style={[styles.botao, aEnviar && { opacity: 0.6 }]} onPress={submeter} disabled={aEnviar} activeOpacity={0.85}>
            <Text style={styles.botaoTxt}>{aEnviar ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : 'Entrar'}</Text>
          </TouchableOpacity>
          {modo === 'entrar' && (
            <TouchableOpacity style={styles.ligacao} onPress={() => { setErro(null); setRecuperar('pedir'); }} activeOpacity={0.7}>
              <Text style={styles.ligacaoTxt}>Esqueci-me da palavra-passe</Text>
            </TouchableOpacity>
          )}
        </View>
        </>)}

        {recuperar && (
          <View style={styles.cartao}>
            <Text style={styles.subtitulo}>Recuperar a palavra-passe</Text>
            {recuperar === 'pedir' ? (
              <>
                <Text style={styles.nota}>Escreva o email da sua conta. Enviamos-lhe um código de 6 dígitos, válido durante 15 minutos.</Text>
                <Text style={styles.rotulo}>EMAIL</Text>
                <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="nome@exemplo.com" placeholderTextColor={COLORS.textSecondary}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress"
                  returnKeyType="send" onSubmitEditing={pedirCodigo} />
                {!!erro && <Text style={styles.erro}>{erro}</Text>}
                <TouchableOpacity style={[styles.botao, aEnviar && { opacity: 0.6 }]} onPress={pedirCodigo} disabled={aEnviar} activeOpacity={0.85}>
                  <Text style={styles.botaoTxt}>{aEnviar ? 'Aguarde…' : 'Enviar código'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {!!aviso && <Text style={styles.nota}>{aviso}</Text>}
                <Text style={styles.rotulo}>CÓDIGO DE 6 DÍGITOS</Text>
                <TextInput style={[styles.input, { letterSpacing: 6, fontSize: 20, textAlign: 'center' }]} value={codigo}
                  onChangeText={t => setCodigo(t.replace(/\D/g, '').slice(0, 6))} placeholder="000000" placeholderTextColor={COLORS.textSecondary}
                  keyboardType="number-pad" maxLength={6} autoComplete="one-time-code" textContentType="oneTimeCode"
                  returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => novaRef.current?.focus()} />
                <Text style={styles.rotulo}>PALAVRA-PASSE NOVA</Text>
                <View style={styles.linhaSenha}>
                  <TextInput ref={novaRef} style={[styles.input, { flex: 1 }]} value={novaPassword} onChangeText={setNovaPassword}
                    placeholder="Pelo menos 8 caracteres" placeholderTextColor={COLORS.textSecondary} secureTextEntry={!ver} autoCapitalize="none" autoCorrect={false}
                    autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={redefinir} />
                  <TouchableOpacity onPress={() => setVer(v => !v)} style={styles.olho} accessibilityLabel={ver ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}>
                    <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={22} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
                {!!erro && <Text style={styles.erro}>{erro}</Text>}
                <TouchableOpacity style={[styles.botao, aEnviar && { opacity: 0.6 }]} onPress={redefinir} disabled={aEnviar} activeOpacity={0.85}>
                  <Text style={styles.botaoTxt}>{aEnviar ? 'Aguarde…' : 'Redefinir palavra-passe'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ligacao} onPress={() => { setErro(null); setRecuperar('pedir'); }} activeOpacity={0.7}>
                  <Text style={styles.ligacaoTxt}>Enviar outro código</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.ligacao} onPress={sairDaRecuperacao} activeOpacity={0.7}>
              <Text style={styles.ligacaoTxt}>Voltar a entrar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  corpo: { padding: 16, paddingBottom: 40, gap: 12 },
  icone: { alignSelf: 'center', width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  titulo: { fontSize: 24, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary, textAlign: 'center' },
  intro: { fontSize: 14, lineHeight: 21, fontFamily: FONTS.sans, color: COLORS.textSecondary, textAlign: 'center' },
  separadores: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.pill, padding: 4, borderWidth: 1, borderColor: COLORS.border },
  sep: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center' },
  sepActivo: { backgroundColor: COLORS.navbar },
  sepTxt: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  sepTxtActivo: { color: '#fff' },
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 6, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 8 },
  input: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.text, fontFamily: FONTS.sans,
  },
  linhaSenha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  olho: { padding: 8 },
  subtitulo: { fontSize: 17, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  nota: { fontSize: 13.5, lineHeight: 20, fontFamily: FONTS.sans, color: COLORS.textSecondary },
  ligacao: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 8, marginTop: 4 },
  ligacaoTxt: { color: COLORS.primary, fontSize: 14, fontWeight: '600', fontFamily: FONTS.sans },
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, marginTop: 6 },
  botao: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
});
