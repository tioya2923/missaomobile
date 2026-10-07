import { forwardRef } from 'react';
import { StyleSheet, TextInput as RNTextInput, type TextInputProps } from 'react-native';
import { fontFile } from './AppText';

const AppTextInput = forwardRef<RNTextInput, TextInputProps>(function AppTextInput({ style, ...rest }, ref) {
  const flat = StyleSheet.flatten(style) ?? {};
  const file = fontFile(flat.fontFamily, flat.fontWeight as string | undefined, flat.fontStyle === 'italic', null);
  const extra = file ? { fontFamily: file, fontWeight: 'normal' as const, fontStyle: 'normal' as const } : null;
  return <RNTextInput ref={ref} style={[style, extra]} {...rest} />;
});

// Mesmo nome para valor e tipo, para que `useRef<TextInput>` continue a funcionar.
type AppTextInput = RNTextInput;
export default AppTextInput;
