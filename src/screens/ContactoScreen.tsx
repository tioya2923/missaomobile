import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function ContactoScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.intro}>
          Se deseja entrar em contacto connosco para obter mais informações, esclarecer dúvidas ou enviar sugestões, utilize uma das alternativas abaixo. Estamos disponíveis para o ajudar!
        </Text>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('tel:+244943448081')}>
          <Text style={styles.label}>Tel:</Text>
          <Text style={styles.value}>+244 943 448 081</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL('mailto:missaonohuambo@gmail.com')}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>missaonohuambo@gmail.com</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
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
    fontFamily: FONTS.serif,
    lineHeight: 24,
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
  },
  value: {
    fontSize: 15,
    color: COLORS.primary,
    fontFamily: FONTS.serif,
    flex: 1,
  },
});
