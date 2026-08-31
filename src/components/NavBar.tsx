import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';
import LogoLob from './LogoLob';

interface Props {
  activeTab?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  onNavigate: (tab: string) => void;
}

export default function NavBar({ canGoBack, onBack, onNavigate }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {canGoBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <TouchableOpacity onPress={() => onNavigate('Calendario')} activeOpacity={0.8}>
          <LogoLob variant="navbar" />
        </TouchableOpacity>
        <View style={styles.backBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 32,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },
});
