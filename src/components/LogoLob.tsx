import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  variant?: 'navbar' | 'lockscreen';
}

// Marca do logótipo — uma cruz inscrita num círculo, construída só com Views
// (sem depender de react-native-svg, que não está instalado). Espelha o
// símbolo usado no site (public/logo-ndatava.svg e favicon-ndatava.svg).
function Marca({ size }: { size: number }) {
  const borda = Math.max(2, Math.round(size * 0.1));
  const largVertical = Math.round(size * 0.16);
  const altVertical = Math.round(size * 0.56);
  const largHorizontal = Math.round(size * 0.56);
  const altHorizontal = Math.round(size * 0.16);
  const deslocamento = size * 0.06; // sobe o travessão para dar o efeito de cruz latina

  return (
    <View
      style={[
        marca.circulo,
        { width: size, height: size, borderRadius: size / 2, borderWidth: borda, borderColor: COLORS.gold },
      ]}
    >
      <View
        style={[
          marca.barra,
          {
            width: largVertical, height: altVertical, borderRadius: largVertical / 2,
            top: (size - altVertical) / 2 - deslocamento - borda,
            left: (size - largVertical) / 2 - borda,
          },
        ]}
      />
      <View
        style={[
          marca.barra,
          {
            width: largHorizontal, height: altHorizontal, borderRadius: altHorizontal / 2,
            top: (size - altHorizontal) / 2 - deslocamento - borda,
            left: (size - largHorizontal) / 2 - borda,
          },
        ]}
      />
    </View>
  );
}

const marca = StyleSheet.create({
  circulo: { alignItems: 'center', justifyContent: 'center' },
  barra: { position: 'absolute', backgroundColor: COLORS.gold },
});

export default function LogoLob({ variant = 'navbar' }: Props) {
  if (variant === 'lockscreen') {
    return (
      <View style={styles.lockWrap}>
        <Marca size={48} />
        <Text style={styles.lockText}>NDATAVA</Text>
      </View>
    );
  }

  return (
    <View style={styles.navWrap}>
      <Marca size={22} />
      <Text style={styles.navText}>NDATAVA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ── Navbar variant ── */
  navWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
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
    gap: 10,
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
