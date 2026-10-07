import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import { FONTS, RADIUS, SHADOW, type Palette } from '../constants/theme';
import { useColors, useTheme, useThemedStyles, type Preferencia } from '../context/ThemeContext';

type IconName = keyof typeof Ionicons.glyphMap;

const OPCOES: { valor: Preferencia; titulo: string; descricao: string; icone: IconName }[] = [
  { valor: 'sistema', titulo: 'Automático',  descricao: 'Segue a definição do telemóvel', icone: 'phone-portrait-outline' },
  { valor: 'claro',   titulo: 'Claro',       descricao: 'Fundo branco e marfim',          icone: 'sunny-outline' },
  { valor: 'escuro',  titulo: 'Escuro',      descricao: 'Fundo escuro, mais suave à noite', icone: 'moon-outline' },
];

export default function AparenciaScreen() {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { preferencia, setPreferencia } = useTheme();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Aparência</Text>
      <Text style={styles.subtitulo}>Escolha como quer ver a Ndatava.</Text>

      <View style={styles.group}>
        {OPCOES.map(o => {
          const activo = preferencia === o.valor;
          return (
            <TouchableOpacity
              key={o.valor}
              style={styles.linha}
              activeOpacity={0.6}
              onPress={() => setPreferencia(o.valor)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activo }}
            >
              <View style={[styles.icone, activo && styles.iconeActivo]}>
                <Ionicons name={o.icone} size={20} color={activo ? COLORS.primary : COLORS.textSecondary} />
              </View>
              <View style={styles.texto}>
                <Text style={styles.linhaTitulo}>{o.titulo}</Text>
                <Text style={styles.linhaDescricao}>{o.descricao}</Text>
              </View>
              <Ionicons
                name={activo ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={activo ? COLORS.primary : COLORS.textSecondary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingTop: 24 },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONTS.display,
    color: COLORS.primary,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 15,
    fontFamily: FONTS.sans,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  icone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeActivo: { backgroundColor: COLORS.primaryLight },
  texto: { flex: 1 },
  linhaTitulo: { fontSize: 16, fontWeight: '500', fontFamily: FONTS.sans, color: COLORS.text },
  linhaDescricao: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary, marginTop: 2 },
});
