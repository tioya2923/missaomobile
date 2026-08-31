import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

interface Props {
  title: string;
  prefix?: string;
  titleBold?: boolean;
  subtitle?: string;
  onPress: () => void;
}

export default function ListItem({ title, prefix, titleBold, subtitle, onPress }: Props) {
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
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 12,
  },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.sansSerif,
  },
  content: { flex: 1 },
  title: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  titleBold: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.serif,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
});
