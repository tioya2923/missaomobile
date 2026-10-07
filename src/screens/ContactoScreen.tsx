import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import { COLORS, FONTS } from '../constants/theme';

export default function ContactoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.intro}>
          Os nossos contactos serão disponibilizados brevemente.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  intro: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.sans,
    lineHeight: 24,
  },
});
