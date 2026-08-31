import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function SobreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titulo}>NDATAVA — Ide e Anunciai</Text>
        <View style={styles.separator} />
        <Text style={styles.texto}>
          Bem-vindo ao <Text style={styles.bold}>NDATAVA</Text>{'\n\n'}
          O Ndatava nasceu para pôr a vida da Igreja ao alcance de um toque: o calendário litúrgico do dia, cânticos completos e catequese para que cada comunidade encontre a liturgia na sua própria língua.{'\n\n'}
          <Text style={styles.bold}>O que encontra aqui:</Text> o calendário litúrgico diário, com leituras e cor do ofício; cânticos organizados por momento da celebração; catecismo e orações fundamentais e uma loja onde pequenas lojas vendem artigos religiosos diretamente na app.{'\n\n'}
          <Text style={styles.bold}>Para quem é:</Text> para o Santo Povo de Deus e para todos os que querem trazer a liturgia consigo, mesmo longe da sua Paróquia ou sem ligação constante à internet.{'\n\n'}
          <Text style={styles.bold}>NDATAVA: Unidos na fé, guiados pelo amor e fortalecidos pela esperança!</Text>
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
