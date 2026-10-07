import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { FONTS, type Palette } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';

export default function LoadingView() {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>A carregar...</Text>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  text: {
    fontFamily: FONTS.sans,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
