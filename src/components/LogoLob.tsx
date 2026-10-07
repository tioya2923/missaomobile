import { StyleSheet, View } from 'react-native';
import Text from './AppText';
import { FONTS, type Palette } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

interface Props {
  variant?: 'navbar' | 'lockscreen';
}

const MARK_GOLD = '#f0d98d';

export default function LogoLob({ variant = 'navbar' }: Props) {
  const styles = useThemedStyles(createStyles);
  if (variant === 'lockscreen') {
    return (
      <View style={styles.lockWrap}>
        <View style={styles.lockMark}>
          <Text style={styles.lockMarkN}>N</Text>
        </View>
        <Text style={styles.lockText}>Ndatava</Text>
      </View>
    );
  }

  return (
    <View style={styles.navWrap}>
      <Text style={styles.navText}>NDATAVA</Text>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  /* ── Navbar variant ── */
  navWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.sans,
    letterSpacing: 4,
  },

  /* ── Lock-screen variant ── */
  lockWrap: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 14,
  },
  lockMark: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: COLORS.navbar,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  lockMarkN: {
    color: MARK_GOLD,
    fontSize: 54,
    lineHeight: 66,
    fontWeight: '700',
    fontFamily: FONTS.display,
    includeFontPadding: false,
  },
  lockText: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: '700',
    fontFamily: FONTS.display,
    letterSpacing: 0.3,
  },
});
