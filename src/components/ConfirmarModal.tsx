import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import { FONTS, RADIUS, SHADOW, type Palette } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

interface Props {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  rotuloConfirmar: string;
  perigoso?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

// Janela de confirmação própria da app (funciona igual no telemóvel e no navegador).
export default function ConfirmarModal({
  visivel, titulo, mensagem, rotuloConfirmar, perigoso, onConfirmar, onCancelar,
}: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancelar}>
      <Pressable style={styles.fundo} onPress={onCancelar}>
        <Pressable style={styles.caixa} onPress={() => {}}>
          <Text style={styles.titulo}>{titulo}</Text>
          <Text style={styles.mensagem}>{mensagem}</Text>
          <View style={styles.botoes}>
            <TouchableOpacity style={[styles.botao, styles.cancelar]} onPress={onCancelar} activeOpacity={0.8}>
              <Text style={styles.cancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botao, perigoso ? styles.perigo : styles.normal]}
              onPress={onConfirmar}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmarTxt}>{rotuloConfirmar}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  caixa: { width: '100%', maxWidth: 400, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 22, gap: 10, ...SHADOW.raised },
  titulo: { fontSize: 19, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  mensagem: { fontSize: 15, lineHeight: 22, fontFamily: FONTS.sans, color: COLORS.text },
  botoes: { flexDirection: 'row', gap: 10, marginTop: 8 },
  botao: { flex: 1, borderRadius: RADIUS.pill, paddingVertical: 12, alignItems: 'center' },
  cancelar: { borderWidth: 1, borderColor: COLORS.border },
  cancelarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  normal: { backgroundColor: COLORS.navbar },
  perigo: { backgroundColor: '#b3261e' },
  confirmarTxt: { fontSize: 15, fontWeight: '700', fontFamily: FONTS.sans, color: '#fff' },
});
