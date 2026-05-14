import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  variant?: 'navbar' | 'lockscreen';
}

export default function LogoLob({ variant = 'navbar' }: Props) {
  if (variant === 'lockscreen') {
    return (
      <View style={styles.lockWrap}>
        <Text style={styles.lockCross}>✝</Text>
        <Text style={styles.lockText}>L'OMBEMBWA</Text>
      </View>
    );
  }

  return (
    <View style={styles.navWrap}>
      <Text style={styles.navCross}>✝</Text>
      <Text style={styles.navText}>L'OMBEMBWA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Navbar variant ── */
  navWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  navCross: {
    color: '#c9a84c',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    marginTop: 1,
  },
  navText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: FONTS.serif,
    letterSpacing: 3,
  },

  /* ── Lock-screen variant ── */
  lockWrap: {
    alignItems: 'center',
    backgroundColor: COLORS.navbar,
    borderRadius: 18,
    paddingHorizontal: 32,
    paddingVertical: 20,
    gap: 2,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  lockCross: {
    color: '#c9a84c',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  lockText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    fontFamily: FONTS.serif,
    letterSpacing: 5,
  },
});
