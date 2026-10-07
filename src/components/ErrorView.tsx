import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import { FONTS, type Palette } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorView({ message, onRetry }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  message: {
    color: COLORS.error,
    fontSize: 16,
    fontFamily: FONTS.sans,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.navbar,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: FONTS.sans,
    fontSize: 15,
  },
});
