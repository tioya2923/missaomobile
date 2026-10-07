import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CarrinhoProvider } from './src/context/CarrinhoContext';
import { LojaAuthProvider } from './src/context/LojaAuthContext';
import { COLORS } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';
import AtualizarAppModal from './src/components/AtualizarAppModal';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.background, primary: COLORS.primary },
};

function App() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold,
    Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Se as letras falharem a carregar, a app continua a funcionar com a letra do sistema.
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  return (
    <SafeAreaProvider>
      <LojaAuthProvider>
        <CarrinhoProvider>
          <NavigationContainer theme={navTheme}>
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
