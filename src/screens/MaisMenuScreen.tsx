import { StyleSheet, View } from 'react-native';
import ListItem from '../components/ListItem';
import { COLORS } from '../constants/theme';
import type { MaisScreenProps } from '../navigation/types';

export default function MaisMenuScreen({ navigation }: MaisScreenProps<'MaisMenu'>) {
  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <ListItem title="Sobre" onPress={() => navigation.navigate('Sobre')} />
        <ListItem title="Contacto" onPress={() => navigation.navigate('Contacto')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  group: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
