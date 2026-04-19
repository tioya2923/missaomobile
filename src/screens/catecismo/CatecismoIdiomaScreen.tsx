import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';
import type { CatecismoScreenProps } from '../../navigation/types';

export default function CatecismoIdiomaScreen({ navigation }: CatecismoScreenProps<'CatecismoIdioma'>) {
  const navegar = (idioma: 'pt' | 'ub') =>
    navigation.navigate('CatecismoTopicos', { idioma });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Escolha o idioma</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navegar('pt')}>
          <Text style={styles.btnText}>Português</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => navegar('ub')}>
          <Text style={styles.btnText}>Umbundu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.serif,
    marginBottom: 8,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    backgroundColor: COLORS.navbar,
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.serif,
  },
});
