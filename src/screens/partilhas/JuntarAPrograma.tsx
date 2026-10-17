import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../../components/AppText';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useThemedStyles } from '../../context/ThemeContext';
import {
  carregarProgramas, guardarAudio, guardarProgramas, MOMENTOS, novoId, type Momento, type Programa,
} from '../../utils/programasMissa';

interface Props {
  titulo: string;
  letra: string;
  /** momento sugerido (por exemplo, o indicado por quem enviou) */
  momentoInicial?: string | null;
  /** devolve o caminho da gravação a juntar (descarregando-a se for preciso) ou null se não houver */
  obterAudio?: () => Promise<string | null>;
  onConcluido: (mensagem: string) => void;
}

// Junta um cântico recebido a um dos programas da Missa do utilizador, no momento escolhido.
export default function JuntarAPrograma({ titulo, letra, momentoInicial, obterAudio, onConcluido }: Props) {
  const styles = useThemedStyles(createStyles);

  const [aberto, setAberto] = useState(false);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [programaId, setProgramaId] = useState('novo');
  const [momento, setMomento] = useState<Momento>(MOMENTOS.find(m => m === momentoInicial) ?? 'Entrada');
  const [aGuardar, setAGuardar] = useState(false);

  const abrir = async () => {
    setProgramas(await carregarProgramas());
    setProgramaId('novo');
    setAberto(true);
  };

  const juntar = async () => {
    try {
      setAGuardar(true);
      const lista = await carregarProgramas();
      const copia = obterAudio ? await obterAudio().catch(() => null) : null;
      const permanente = copia ? await guardarAudio(copia).catch(() => undefined) : undefined;
      const escolha = { id: novoId(), tipo: 'proprio' as const, titulo, letra, audioUri: permanente };
      let alvo = lista.find(p => p.id === programaId);
      if (!alvo) {
        alvo = { id: novoId(), titulo: 'Novo programa', celebracao: '', criadoEm: Date.now(), itens: {} };
        lista.unshift(alvo);
      }
      alvo.itens = { ...alvo.itens, [momento]: [...(alvo.itens[momento] ?? []), escolha] };
      await guardarProgramas(lista);
      setAberto(false);
      onConcluido(`Adicionado a "${alvo.titulo || 'Sem título'}", em ${momento}.`);
    } catch {
      onConcluido('Não foi possível adicionar ao programa.');
    } finally {
      setAGuardar(false);
    }
  };

  if (!aberto) {
    return (
      <TouchableOpacity style={styles.principal} onPress={abrir} activeOpacity={0.85}>
        <Ionicons name="add-circle-outline" size={19} color="#fff" />
        <Text style={styles.principalTxt}>Juntar a um programa da Missa</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.cartao}>
      <Text style={styles.rotulo}>JUNTAR A UM PROGRAMA</Text>
      <View style={styles.chips}>
        {[{ id: 'novo', titulo: '+ Novo programa' }, ...programas.map(p => ({ id: p.id, titulo: p.titulo || 'Sem título' }))].map(p => (
          <TouchableOpacity key={p.id} style={[styles.chip, programaId === p.id && styles.chipActivo]} onPress={() => setProgramaId(p.id)} activeOpacity={0.8}>
            <Text style={[styles.chipTxt, programaId === p.id && styles.chipTxtActivo]} numberOfLines={1}>{p.titulo}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.rotulo, { marginTop: 8 }]}>MOMENTO DA MISSA</Text>
      <View style={styles.chips}>
        {MOMENTOS.map(m => (
          <TouchableOpacity key={m} style={[styles.chip, momento === m && styles.chipActivo]} onPress={() => setMomento(m)} activeOpacity={0.8}>
            <Text style={[styles.chipTxt, momento === m && styles.chipTxtActivo]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.linhaBotoes}>
        <TouchableOpacity style={styles.secundario} onPress={() => setAberto(false)} activeOpacity={0.8}><Text style={styles.secundarioTxt}>Cancelar</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.principal, { flex: 1 }, aGuardar && { opacity: 0.6 }]} onPress={juntar} disabled={aGuardar} activeOpacity={0.85}>
          <Text style={styles.principalTxt}>{aGuardar ? 'A juntar…' : 'Juntar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 18, gap: 10, ...SHADOW.card },
  rotulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, maxWidth: '100%' },
  chipActivo: { backgroundColor: COLORS.navbar, borderColor: COLORS.navbar },
  chipTxt: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  chipTxtActivo: { color: '#fff' },
  linhaBotoes: { flexDirection: 'row', gap: 10, marginTop: 10 },
  principal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 14, paddingHorizontal: 18 },
  principalTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15 },
  secundario: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 14 },
  secundarioTxt: { fontWeight: '700', fontFamily: FONTS.sans, fontSize: 15, color: COLORS.text },
});
