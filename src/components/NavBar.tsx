import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../constants/theme';
import LogoLob from './LogoLob';

const TABS = [
  { key: 'Calendario', label: 'Calendário' },
  { key: 'Canticos',   label: 'Cânticos'   },
  { key: 'Catecismo',  label: 'Catecismo'  },
  { key: 'Eu',         label: 'Eu'         },
  { key: 'Pesquisa',   label: 'Pesquisa'   },
];

interface Props {
  activeTab?: string;
  canGoBack?: boolean;
  onBack?: () => void;
  onNavigate: (tab: string) => void;
}

export default function NavBar({ activeTab, canGoBack, onBack, onNavigate }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.logoRow}>
        {canGoBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={() => onNavigate('Calendario')} activeOpacity={0.8}>
          <LogoLob variant="navbar" />
        </TouchableOpacity>
      </View>

      <View style={styles.navRow}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => onNavigate(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.navText, active && styles.navTextActive]}>
                {tab.label}
              </Text>
              {active ? <View style={styles.indicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.navbar,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backBtn: {
    position: 'absolute',
    left: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '300',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: FONTS.serif,
    letterSpacing: 7,
  },
  navRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
  },
  navText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontFamily: FONTS.serif,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  navTextActive: {
    color: '#ffffff',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
});
