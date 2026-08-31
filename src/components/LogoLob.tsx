import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  variant?: 'navbar' | 'lockscreen';
}

export default function LogoLob({ variant = 'navbar' }: Props) {
  if (variant === 'lockscreen') {
    return (
      <View style={styles.lockWrap}>
        <Text style={styles.lockText}>NDATAVA</Text>
      </View>
    );
  }

  return (
    <View style={styles.navWrap}>
      <Text style={styles.navText}>NDATAVA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Navbar variant ── */
  navWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FONTS.serif,
    letterSpacing: 4,
  },

  /* ── Lock-screen variant ── */
  lockWrap: {
    alignItems: 'center',
    backgroundColor: COLORS.navbar,
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  lockText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: FONTS.serif,
    letterSpacing: 5,
  },
});
