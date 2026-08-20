import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CarrinhoProvider } from './src/context/CarrinhoContext';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <CarrinhoProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </CarrinhoProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
