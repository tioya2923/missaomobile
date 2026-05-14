import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function SobreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>L'OMBEMBWA — Ide e Anunciai</Text>
        <View style={styles.separator} />
        <Text style={styles.texto}>
          Esta é a <Text style={styles.bold}>L'OMBEMBWA</Text> — <Text style={styles.bold}>Ide e Anunciai</Text> — A Voz Católica do Huambo, fundada no dia 21.09.2021.{'\n\n'}
          Somos um espaço de aprendizagem e maturidade cristãs. A nossa missão é difundir a mensagem do Evangelho e fortalecer a fé católica através dos meios de comunicação social, promovendo a Evangelização, Catequese, Formação e Informação Religiosa com dedicação.{'\n\n'}
          <Text style={styles.bold}>Nossa Missão:</Text> Evangelização, Catequese, Formação e Informação Religiosa do Huambo.{'\n\n'}
          <Text style={styles.bold}>Catequese:</Text> Educamos e nutrimos a fé daqueles que procuram entender os princípios fundamentais da nossa fé.{'\n\n'}
          <Text style={styles.bold}>L'OMBEMBWA — ide e anunciai — Unidos na fé, guiados pelo amor e fortalecidos pela esperança!</Text>
        </Text>
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
  titulo: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginBottom: 16,
  },
  texto: {
    fontSize: 15,
    color: COLORS.text,
    fontFamily: FONTS.serif,
    lineHeight: 26,
    textAlign: 'justify',
  },
  bold: { fontWeight: '700' },
});
