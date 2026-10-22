import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mensagemDeErro } from '../../api/conta';
import Text from '../../components/AppText';
import TextInput from '../../components/AppTextInput';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';

// Entrar ou criar a conta que permite enviar e receber cânticos dentro da app.
export default function ContaAuth({ onFeito }: { onFeito?: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { entrar, registar } = useConta();

  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ver, setVer] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.corpo} keyboardShouldPersistTaps="handled">
        <View style={styles.icone}><Ionicons name="people-outline" size={34} color={COLORS.primary} /></View>
        <Text style={styles.titulo}>Partilhar cânticos</Text>
        <Text style={styles.intro}>
          Com uma conta, pode enviar os seus cânticos (letra e gravação) a outras pessoas que usem a Ndatava, e receber os delas.
          A conta serve só para isto: as pessoas só lhe enviam cânticos se tiverem o seu código.
        </Text>

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
              <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="O seu nome" placeholderTextColor={COLORS.textSecondary} autoCapitalize="words" />
            </>
          )}
          <Text style={styles.rotulo}>EMAIL</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="nome@exemplo.com" placeholderTextColor={COLORS.textSecondary}
            keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Text style={styles.rotulo}>PALAVRA-PASSE</Text>
          <View style={styles.linhaSenha}>
            <TextInput style={[styles.input, { flex: 1 }]} value={password} onChangeText={setPassword} placeholder="Pelo menos 8 caracteres"
              placeholderTextColor={COLORS.textSecondary} secureTextEntry={!ver} autoCapitalize="none" autoCorrect={false} />
            <TouchableOpacity onPress={() => setVer(v => !v)} style={styles.olho} accessibilityLabel={ver ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}>
              <Ionicons name={ver ? 'eye-off-outline' : 'eye-outline'} size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {!!erro && <Text style={styles.erro}>{erro}</Text>}

          <TouchableOpacity style={[styles.botao, aEnviar && { opacity: 0.6 }]} onPress={submeter} disabled={aEnviar} activeOpacity={0.85}>
            <Text style={styles.botaoTxt}>{aEnviar ? 'Aguarde…' : modo === 'criar' ? 'Criar conta' : 'Entrar'}</Text>
          </TouchableOpacity>
        </View>
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
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, marginTop: 6 },
  botao: { backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14, alignItems: 'center', marginTop: 14 },
  botaoTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 16 },
});
