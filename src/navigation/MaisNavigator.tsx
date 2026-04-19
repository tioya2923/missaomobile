import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NavBar from '../components/NavBar';
import ContactoScreen from '../screens/ContactoScreen';
import MaisMenuScreen from '../screens/MaisMenuScreen';
import SobreScreen from '../screens/SobreScreen';
import type { MaisStackParamList } from './types';

const Stack = createNativeStackNavigator<MaisStackParamList>();

export default function MaisNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, back }) => ({
        header: () => (
          <NavBar
            canGoBack={!!back}
            onBack={() => navigation.goBack()}
            onNavigate={(tab) => navigation.getParent()?.navigate(tab)}
          />
        ),
      })}
    >
      <Stack.Screen name="MaisMenu"  component={MaisMenuScreen}  />
      <Stack.Screen name="Sobre"     component={SobreScreen}     />
      <Stack.Screen name="Contacto"  component={ContactoScreen}  />
    </Stack.Navigator>
  );
}
