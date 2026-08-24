import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NavBar from '../components/NavBar';
import ApoiarScreen from '../screens/ApoiarScreen';
import ContactoScreen from '../screens/ContactoScreen';
import MaisMenuScreen from '../screens/MaisMenuScreen';
import PrivacidadeScreen from '../screens/PrivacidadeScreen';
import SobreScreen from '../screens/SobreScreen';
import LojaScreen from '../screens/loja/LojaScreen';
import LojaProdutoScreen from '../screens/loja/LojaProdutoScreen';
import LojaDetalheScreen from '../screens/loja/LojaDetalheScreen';
import LojaCarrinhoScreen from '../screens/loja/LojaCarrinhoScreen';
import LojaConfirmacaoScreen from '../screens/loja/LojaConfirmacaoScreen';
import type { MaisStackParamList } from './types';

const Stack = createNativeStackNavigator<MaisStackParamList>();

export default function MaisNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => (
          <NavBar
            canGoBack={navigation.canGoBack()}
            onBack={() => navigation.goBack()}
            onNavigate={(tab) => navigation.getParent()?.navigate(tab)}
          />
        ),
      })}
    >
      <Stack.Screen name="MaisMenu"        component={MaisMenuScreen}        />
      <Stack.Screen name="Sobre"           component={SobreScreen}           />
      <Stack.Screen name="Privacidade"     component={PrivacidadeScreen}     options={{ title: 'Política de Privacidade' }} />
      <Stack.Screen name="Contacto"        component={ContactoScreen}        />
      <Stack.Screen name="Apoiar"          component={ApoiarScreen}          options={{ title: 'Apoiar' }} />
      <Stack.Screen name="Loja"            component={LojaScreen}            options={{ title: 'Loja' }} />
      <Stack.Screen name="LojaProduto"     component={LojaProdutoScreen}     options={{ title: 'Produto' }} />
      <Stack.Screen name="LojaDetalhe"     component={LojaDetalheScreen}     options={{ title: 'Loja' }} />
      <Stack.Screen name="LojaCarrinho"    component={LojaCarrinhoScreen}    options={{ title: 'Carrinho' }} />
      <Stack.Screen name="LojaConfirmacao" component={LojaConfirmacaoScreen} options={{ title: 'Encomenda' }} />
    </Stack.Navigator>
  );
}
