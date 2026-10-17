import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { listarPublicacoes, mensagemDeErro, type GrupoDetalhe, type PublicacaoGrupo, type TipoPublicacao } from '../../api/conta';
import Text from '../../components/AppText';
import { FONTS, RADIUS, type Palette } from '../../constants/theme';
import { useConta } from '../../context/ContaContext';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import PublicacaoCard from './PublicacaoCard';
import PublicarGrupo from './PublicarGrupo';

type Sub = null | { tipo: TipoPublicacao; editar?: PublicacaoGrupo };

const BOTOES: { tipo: TipoPublicacao; rotulo: string; icone: keyof typeof Ionicons.glyphMap; soAdmin: boolean }[] = [
  { tipo: 'aviso', rotulo: 'Aviso', icone: 'megaphone-outline', soAdmin: true },
  { tipo: 'cantico', rotulo: 'Cântico', icone: 'musical-notes-outline', soAdmin: false },
  { tipo: 'oracao', rotulo: 'Oração', icone: 'heart-outline', soAdmin: false },
  { tipo: 'programa', rotulo: 'Programa', icone: 'list-outline', soAdmin: true },
];

// O mural do grupo: avisos, cânticos, orações e programas da Missa, do mais recente para o mais antigo.
export default function MuralGrupo({ grupo }: { grupo: GrupoDetalhe }) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);
  const { atualizarNaoLidas } = useConta();

  const [publicacoes, setPublicacoes] = useState<PublicacaoGrupo[] | null>(null);
  const [aActualizar, setAActualizar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub>(null);

  const carregar = useCallback(async () => {
    try {
      setAActualizar(true);
      setErro(null);
      setPublicacoes(await listarPublicacoes(grupo.id));
      atualizarNaoLidas();
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível carregar o mural. Verifique a ligação e puxe para actualizar.'));
    } finally {
      setAActualizar(false);
    }
  }, [grupo.id, atualizarNaoLidas]);

  useEffect(() => { carregar(); }, [carregar]);

  if (sub) {
    return <PublicarGrupo grupoId={grupo.id} tipo={sub.tipo} editar={sub.editar} onFechar={publicou => { setSub(null); if (publicou) carregar(); }} />;
  }

  const podePublicar = (soAdmin: boolean, tipo: TipoPublicacao) =>
    grupo.administrador || (!soAdmin && grupo.membrosPublicam && (tipo === 'cantico' || tipo === 'oracao'));
  const botoes = BOTOES.filter(b => podePublicar(b.soAdmin, b.tipo));

  return (
    <ScrollView
      contentContainerStyle={styles.corpo}
      refreshControl={<RefreshControl refreshing={aActualizar} onRefresh={carregar} tintColor={COLORS.primary} />}
    >
      {botoes.length > 0 && (
        <View style={styles.composer}>
          <Text style={styles.composerTitulo}>Publicar no grupo</Text>
          <View style={styles.composerLinha}>
            {botoes.map(b => (
              <TouchableOpacity key={b.tipo} style={styles.botao} onPress={() => setSub({ tipo: b.tipo })} activeOpacity={0.8}>
                <Ionicons name={b.icone} size={18} color={COLORS.primary} />
                <Text style={styles.botaoTxt}>{b.rotulo}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!!erro && <Text style={styles.erro}>{erro}</Text>}
      {publicacoes && publicacoes.length === 0 && (
        <Text style={styles.vazio}>
          {botoes.length > 0 ? 'Ainda não há publicações. Comece por um aviso ou por um cântico.' : 'Ainda não há publicações neste grupo.'}
        </Text>
      )}
      {publicacoes?.map(p => (
        <PublicacaoCard
          key={p.id}
          grupoId={grupo.id}
          pub={p}
          administrador={grupo.administrador}
          onMudou={carregar}
          onEditar={pub => setSub({ tipo: pub.tipo, editar: pub })}
        />
      ))}
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  corpo: { padding: 16, paddingBottom: 40, gap: 12 },
  composer: { gap: 8 },
  composerTitulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  composerLinha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botao: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 14,
    borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  botaoTxt: { fontSize: 13.5, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.primary },
  erro: { color: COLORS.error, fontSize: 13.5, fontFamily: FONTS.sans, textAlign: 'center' },
  vazio: { textAlign: 'center', fontStyle: 'italic', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 16, lineHeight: 21 },
});
