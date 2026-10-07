import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import { FONTS, type Palette } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

interface Props {
  title: string;
  prefix?: string;
  titleBold?: boolean;
  subtitle?: string;
  onPress: () => void;
}

export default function ListItem({ title, prefix, titleBold, subtitle, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.6}>
      {prefix ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{prefix}</Text>
        </View>
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, titleBold && styles.titleBold]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#b9b0a5" />
    </TouchableOpacity>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  badge: {
    width: 44,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.sans,
  },
  content: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    fontFamily: FONTS.sans,
    lineHeight: 22,
  },
  titleBold: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    marginTop: 2,
  },
});
