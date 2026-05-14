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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.content}>
        <Text style={[styles.title, titleBold && styles.titleBold]}>
          {prefix ? <Text style={styles.prefix}>{prefix} </Text> : null}
          {title}
        </Text>
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  content: { flex: 1 },
  title: {
    fontSize: 17,
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  titleBold: {
    fontWeight: '700',
  },
  prefix: {
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: FONTS.serif,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
});
