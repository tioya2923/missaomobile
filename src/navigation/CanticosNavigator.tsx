import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NavBar from '../components/NavBar';
import CanticoDetalheScreen from '../screens/canticos/CanticoDetalheScreen';
import CanticosIdiomaScreen from '../screens/canticos/CanticosIdiomaScreen';
import CanticosListaScreen from '../screens/canticos/CanticosListaScreen';
import CanticosTopicosScreen from '../screens/canticos/CanticosTopicosScreen';
import type { CanticosStackParamList } from './types';

const Stack = createNativeStackNavigator<CanticosStackParamList>();

export default function CanticosNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, back }) => ({
        header: () => (
          <NavBar
            activeTab="Canticos"
            canGoBack={!!back}
            onBack={() => navigation.goBack()}
            onNavigate={(tab) => navigation.getParent()?.navigate(tab)}
          />
        ),
      })}
    >
      <Stack.Screen name="CanticosIdioma"  component={CanticosIdiomaScreen}  />
      <Stack.Screen name="CanticosTopicos" component={CanticosTopicosScreen} />
      <Stack.Screen name="CanticosLista"   component={CanticosListaScreen}   />
      <Stack.Screen name="CanticoDetalhe"  component={CanticoDetalheScreen}  />
    </Stack.Navigator>
  );
}
