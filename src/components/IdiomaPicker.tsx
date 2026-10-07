import { ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import ListItem from './ListItem';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/theme';

export interface IdiomaOpcao<T extends string> {
  codigo: T;
  nome: string;
  sigla: string;
}

interface Props<T extends string> {
  titulo: string;
  subtitulo: string;
  opcoes: IdiomaOpcao<T>[];
  onEscolher: (codigo: T) => void;
}

export default function IdiomaPicker<T extends string>({ titulo, subtitulo, opcoes, onEscolher }: Props<T>) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{titulo}</Text>
        <View style={styles.accent} />
        <Text style={styles.subtitulo}>{subtitulo}</Text>
      </View>
      <View style={styles.group}>
        {opcoes.map(o => (
          <ListItem key={o.codigo} prefix={o.sigla} title={o.nome} onPress={() => onEscolher(o.codigo)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, paddingTop: 28 },
  header: { alignItems: 'center', marginBottom: 24 },
  titulo: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: FONTS.display,
    color: COLORS.primary,
  },
  accent: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
    marginTop: 10,
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
  },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
});
