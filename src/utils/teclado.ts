import { Platform } from 'react-native';

// Android (ecrã inteiro): o KeyboardAvoidingView com "padding" sobe o conteúdo.
// iPhone: o KeyboardAvoidingView falha dentro da barra de separadores, por isso quem trata do teclado é a
// própria lista (ScrollView com automaticallyAdjustKeyboardInsets), que mede o teclado de forma nativa.
export const COMPORTAMENTO_TECLADO = Platform.OS === 'android' ? ('padding' as const) : undefined;
