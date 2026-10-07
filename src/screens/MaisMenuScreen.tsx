import { StyleSheet, View } from 'react-native';
import ListItem from '../components/ListItem';
import { RADIUS, SHADOW, type Palette } from '../constants/theme';
import type { MaisScreenProps } from '../navigation/types';
import { useThemedStyles } from '../context/ThemeContext';

export default function MaisMenuScreen({ navigation }: MaisScreenProps<'MaisMenu'>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <ListItem title="Loja" onPress={() => navigation.navigate('Loja')} />
        <ListItem title="Apoiar" onPress={() => navigation.navigate('Apoiar')} />
        <ListItem title="Aparência" onPress={() => navigation.navigate('Aparencia')} />
        <ListItem title="Sobre" onPress={() => navigation.navigate('Sobre')} />
        <ListItem title="Política de Privacidade" onPress={() => navigation.navigate('Privacidade')} />
        <ListItem title="Contacto" onPress={() => navigation.navigate('Contacto')} />
      </View>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOW.card,
  },
});
