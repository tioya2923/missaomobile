import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.text} />
      <Text style={styles.text}>A carregar...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  text: {
    fontFamily: FONTS.serif,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
