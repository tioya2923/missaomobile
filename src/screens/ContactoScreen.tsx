import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { FONTS, type Palette } from '../constants/theme';
import { useThemedStyles, useTheme } from '../context/ThemeContext';

const WHATSAPP_TEXTO = '+351 920 012 727';
const WHATSAPP_URL = 'https://wa.me/351920012727';
const EMAIL = 'ndatava3@gmail.com';

export default function ContactoScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const abrir = (url: string) => { Linking.openURL(url).catch(() => {}); };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Fale connosco</Text>

        <TouchableOpacity style={styles.linha} activeOpacity={0.7} onPress={() => abrir(WHATSAPP_URL)}
          accessibilityRole="link" accessibilityLabel={`WhatsApp ${WHATSAPP_TEXTO}`}>
          <Ionicons name="logo-whatsapp" size={22} color={colors.primary} />
          <View style={styles.linhaTextos}>
            <Text style={styles.etiqueta}>WhatsApp</Text>
            <Text style={styles.valor}>{WHATSAPP_TEXTO}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linha} activeOpacity={0.7} onPress={() => abrir(`mailto:${EMAIL}`)}
          accessibilityRole="link" accessibilityLabel={`E-mail ${EMAIL}`}>
          <Ionicons name="mail-outline" size={22} color={colors.primary} />
          <View style={styles.linhaTextos}>
            <Text style={styles.etiqueta}>E-mail</Text>
            <Text style={styles.valor}>{EMAIL}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.titulo}>Ajude a enriquecer a Ndatava</Text>
        <Text style={styles.intro}>
          Tem cânticos ou orações que gostaria de ver na Ndatava? Envie-os para o WhatsApp ou para o
          e-mail acima.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: { padding: 16, gap: 16, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  titulo: { fontSize: 17, fontFamily: FONTS.sans, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  linhaTextos: { flex: 1 },
  etiqueta: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  valor: { fontSize: 16, color: COLORS.primary, fontFamily: FONTS.sans, fontWeight: '700' },
  intro: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.sans,
    lineHeight: 24,
  },
});
