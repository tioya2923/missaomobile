import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CarrinhoProvider } from './src/context/CarrinhoContext';
import { LojaAuthProvider } from './src/context/LojaAuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import AtualizarAppModal from './src/components/AtualizarAppModal';

function App() {
  return (
    <SafeAreaProvider>
      <LojaAuthProvider>
        <CarrinhoProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
            <AtualizarAppModal />
          </NavigationContainer>
        </CarrinhoProvider>
      </LojaAuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
