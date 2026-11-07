import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CarrinhoProvider } from './src/context/CarrinhoContext';
import { LojaAuthProvider } from './src/context/LojaAuthContext';
import { ContaProvider } from './src/context/ContaContext';
import { IdiomaProvider } from './src/context/IdiomaContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import AtualizarAppModal from './src/components/AtualizarAppModal';
import SplashAnimado from './src/components/SplashAnimado';

function Raiz() {
  const { colors, isDark, pronto } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular, Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold,
    Inter_400Regular, Inter_400Regular_Italic, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  const [splashFeito, setSplashFeito] = useState(false);
  const terminarSplash = useCallback(() => setSplashFeito(true), []);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [colors, isDark]);

  // Espera pelas letras e pela preferência de tema guardada, para não piscar o tema errado.
  // Se as letras falharem a carregar, a app continua com a letra do sistema.
  const appPronta = pronto && (fontsLoaded || !!fontError);

  // A animação de abertura corre por cima da app (que vai carregando por baixo).
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {appPronta && (
    <SafeAreaProvider>
      <LojaAuthProvider>
        <CarrinhoProvider>
          <IdiomaProvider>
           <ContaProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style={isDark ? 'light' : 'dark'} />
              {/* Em tablets, dobráveis e telemóveis deitados, o conteúdo fica numa coluna central legível. */}
              <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.background }}>
                <View style={{ flex: 1, width: '100%', maxWidth: 760 }}>
                  <RootNavigator />
                </View>
              </View>
              <AtualizarAppModal />
            </NavigationContainer>
           </ContaProvider>
          </IdiomaProvider>
        </CarrinhoProvider>
      </LojaAuthProvider>
    </SafeAreaProvider>
      )}
      {!splashFeito && <SplashAnimado pronta={appPronta} onTermina={terminarSplash} />}
    </View>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Raiz />
    </ThemeProvider>
  );
}

registerRootComponent(App);
