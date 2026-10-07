import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { COLORS, FONTS } from '../constants/theme';

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.navbar} />
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
    fontFamily: FONTS.sans,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    fontSize: 15,
  },
});
