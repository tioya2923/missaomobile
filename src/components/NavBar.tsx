import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Palette } from '../constants/theme';
import LogoLob from './LogoLob';
import { useColors, useThemedStyles } from '../context/ThemeContext';

interface Props {
  activeTab?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  onNavigate: (tab: string) => void;
}

export default function NavBar({ canGoBack, onBack, onNavigate }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        <TouchableOpacity onPress={() => onNavigate('Calendario')} activeOpacity={0.8}>
          <LogoLob variant="navbar" />
        </TouchableOpacity>
        <View style={styles.side} />
      </View>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  side: {
    width: 36,
    height: 36,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
