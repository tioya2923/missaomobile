import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NavBar from '../components/NavBar';
import CatecismoIdiomaScreen from '../screens/catecismo/CatecismoIdiomaScreen';
import CatecismoSubTopicoDetalheScreen from '../screens/catecismo/CatecismoSubTopicoDetalheScreen';
import CatecismoSubTopicosScreen from '../screens/catecismo/CatecismoSubTopicosScreen';
import CatecismoTextoScreen from '../screens/catecismo/CatecismoTextoScreen';
import CatecismoTitulosScreen from '../screens/catecismo/CatecismoTitulosScreen';
import CatecismoTopicosScreen from '../screens/catecismo/CatecismoTopicosScreen';
import type { CatecismoStackParamList } from './types';

const Stack = createNativeStackNavigator<CatecismoStackParamList>();

export default function CatecismoNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => (
          <NavBar
            activeTab="Catecismo"
            canGoBack={navigation.canGoBack()}
            onBack={() => navigation.goBack()}
            onNavigate={(tab) => navigation.getParent()?.navigate(tab)}
          />
        ),
      })}
    >
      <Stack.Screen name="CatecismoIdioma"          component={CatecismoIdiomaScreen}          />
      <Stack.Screen name="CatecismoTopicos"          component={CatecismoTopicosScreen}          />
      <Stack.Screen name="CatecismoSubTopicos"       component={CatecismoSubTopicosScreen}       />
      <Stack.Screen name="CatecismoSubTopicoDetalhe" component={CatecismoSubTopicoDetalheScreen} />
      <Stack.Screen name="CatecismoTitulos"          component={CatecismoTitulosScreen}          />
      <Stack.Screen name="CatecismoTexto"            component={CatecismoTextoScreen}            />
    </Stack.Navigator>
  );
}
