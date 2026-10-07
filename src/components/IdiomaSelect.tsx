import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from './AppText';
import { FONTS, RADIUS, SHADOW, type Palette } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useIdioma } from '../context/IdiomaContext';

interface Posicao { x: number; y: number; w: number; h: number }

// Lista pendente ("dropdown"): campo com o idioma actual que, ao tocar, abre a lista
// de idiomas logo por baixo, para escolher.
export default function IdiomaSelect({ rotulo = 'Idioma' }: { rotulo?: string }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { idiomas, codigo, setCodigo } = useIdioma();
  const campo = useRef<View>(null);
  const [pos, setPos] = useState<Posicao | null>(null);

  const actual = idiomas.find(i => i.codigo === codigo);

  const abrir = () => {
    campo.current?.measureInWindow((x, y, w, h) => setPos({ x, y, w, h }));
  };
  const fechar = () => setPos(null);

  return (
    <View>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <View ref={campo} collapsable={false}>
        <TouchableOpacity
          style={styles.campo}
          activeOpacity={0.7}
          onPress={abrir}
          accessibilityRole="combobox"
          accessibilityLabel={`${rotulo}: ${actual?.nome ?? ''}`}
        >
          <Text style={styles.campoTxt}>{actual?.nome ?? '—'}</Text>
          <Ionicons name={pos ? 'caret-up' : 'caret-down'} size={14} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <Modal visible={!!pos} transparent animationType="fade" statusBarTranslucent onRequestClose={fechar}>
        <Pressable style={styles.fundo} onPress={fechar} accessibilityLabel="Fechar lista de idiomas">
          {pos && (
            <View style={[styles.lista, { top: pos.y + pos.h + 6, left: pos.x, width: pos.w }]}>
              <ScrollView style={styles.scroll} nestedScrollEnabled bounces={false}>
                {idiomas.map(i => {
                  const activo = i.codigo === codigo;
                  return (
                    <TouchableOpacity
                      key={i.codigo}
                      style={[styles.item, activo && styles.itemActivo]}
                      activeOpacity={0.6}
                      onPress={() => { setCodigo(i.codigo); fechar(); }}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: activo }}
                    >
                      <Text style={[styles.itemTxt, activo && styles.itemTxtActivo]}>{i.nome}</Text>
                      {activo && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  rotulo: {
    fontSize: 13,
    fontFamily: FONTS.sans,
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    paddingVertical: 15,
    ...SHADOW.card,
  },
  campoTxt: { fontSize: 16, fontWeight: '500', fontFamily: FONTS.sans, color: COLORS.text },
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  lista: {
    position: 'absolute',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    maxHeight: 340,
    ...SHADOW.raised,
  },
  scroll: { flexGrow: 0 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  itemActivo: { backgroundColor: COLORS.primaryLight },
  itemTxt: { fontSize: 16, fontWeight: '500', fontFamily: FONTS.sans, color: COLORS.text },
  itemTxtActivo: { fontWeight: '700', color: COLORS.primary },
});
