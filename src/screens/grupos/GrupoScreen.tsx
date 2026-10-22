import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { detalheGrupo, mensagemDeErro, TIPOS_GRUPO, type GrupoDetalhe } from '../../api/conta';
import Text from '../../components/AppText';
import ErrorView from '../../components/ErrorView';
import LoadingView from '../../components/LoadingView';
import { FONTS, RADIUS, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import DefinicoesGrupoPanel from './DefinicoesGrupoPanel';
import MembrosGrupoPanel from './MembrosGrupoPanel';
import MuralGrupo from './MuralGrupo';

type Separador = 'mural' | 'membros' | 'definicoes';

// Um grupo: mural, membros e (para administradores) definições.
export default function GrupoScreen({ id, onVoltar }: { id: number; onVoltar: () => void }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { atualizarNaoLidas } = useConta();

  const [grupo, setGrupo] = useState<GrupoDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [separador, setSeparador] = useState<Separador>('mural');

  const carregar = useCallback(async () => {
    try { setErro(null); setGrupo(await detalheGrupo(id)); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível abrir o grupo.')); }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar, separador]);

  const sair = () => { atualizarNaoLidas(); onVoltar(); };
  const tipo = grupo ? TIPOS_GRUPO.find(t => t.valor === grupo.tipo) : null;
  const separadores: { chave: Separador; rotulo: string }[] = [
    { chave: 'mural', rotulo: 'Mural' },
    { chave: 'membros', rotulo: 'Membros' },
    ...(grupo?.administrador ? [{ chave: 'definicoes' as const, rotulo: 'Definições' }] : []),
  ];

  return (
    <KeyboardAvoidingView style={styles.ecra} behavior="padding">
      <TouchableOpacity style={styles.voltar} onPress={sair} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        <Text style={styles.voltarTxt}>Grupos</Text>
      </TouchableOpacity>

      {!grupo && !erro ? <LoadingView /> : !grupo ? (
        <ErrorView message={erro ?? 'Grupo não encontrado.'} onRetry={carregar} />
      ) : (
        <>
          <View style={styles.cabecalho}>
            <View style={styles.icone}><Ionicons name={(tipo?.icone ?? 'albums-outline') as keyof typeof Ionicons.glyphMap} size={22} color={COLORS.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nome} numberOfLines={2}>{grupo.nome}</Text>
              <Text style={styles.sub} numberOfLines={1}>
                {tipo?.rotulo}{grupo.paroquia ? ` · ${grupo.paroquia}` : ''} · {grupo.membros} {grupo.membros === 1 ? 'membro' : 'membros'}
              </Text>
            </View>
          </View>
          {!!grupo.descricao && <Text style={styles.descricao}>{grupo.descricao}</Text>}

          <View style={styles.separadores}>
            {separadores.map(s => (
              <TouchableOpacity key={s.chave} style={[styles.sep, separador === s.chave && styles.sepActivo]} onPress={() => setSeparador(s.chave)} activeOpacity={0.8}>
                <Text style={[styles.sepTxt, separador === s.chave && styles.sepTxtActivo]}>{s.rotulo}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            {separador === 'mural' && <MuralGrupo grupo={grupo} />}
            {separador === 'membros' && <MembrosGrupoPanel grupo={grupo} onMudou={carregar} onSaiu={sair} />}
            {separador === 'definicoes' && grupo.administrador && <DefinicoesGrupoPanel key={`${grupo.nome}${grupo.codigo}`} grupo={grupo} onMudou={carregar} onApagado={sair} />}
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  ecra: { flex: 1, backgroundColor: COLORS.background },
  voltar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 14 },
  voltarTxt: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  icone: { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 22, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.primary },
  sub: { fontSize: 13, fontFamily: FONTS.sans, color: COLORS.textSecondary, marginTop: 2 },
  descricao: { fontSize: 14, lineHeight: 21, fontFamily: FONTS.sans, color: COLORS.textSecondary, paddingHorizontal: 16, marginTop: 8 },
  separadores: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: RADIUS.pill, padding: 4, borderWidth: 1,
    borderColor: COLORS.border, marginHorizontal: 16, marginTop: 12,
  },
  sep: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center' },
  sepActivo: { backgroundColor: COLORS.navbar },
  sepTxt: { fontSize: 14, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  sepTxtActivo: { color: '#fff' },
});
