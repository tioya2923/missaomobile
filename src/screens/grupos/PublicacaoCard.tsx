import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  apagarPublicacao, denunciarPublicacao, descarregarAudioGrupo, fixarPublicacao, mensagemDeErro, vistosDoAviso,
  type ItemProgramaGrupo, type PublicacaoGrupo,
} from '../../api/conta';
import Text from '../../components/AppText';
import ConfirmarModal from '../../components/ConfirmarModal';
import { FONTS, RADIUS, SHADOW, type Palette } from '../../constants/theme';
import { useColors, useThemedStyles } from '../../context/ThemeContext';
import {
  guardarAudio, guardarProgramas, carregarProgramas, MOMENTOS, novoId, type Escolha, type Momento, type Programa,
} from '../../utils/programasMissa';
import JuntarAPrograma from '../partilhas/JuntarAPrograma';
import AudioBotao from './AudioBotao';

interface Props {
  grupoId: number;
  pub: PublicacaoGrupo;
  administrador: boolean;
  onMudou: () => void;
  onEditar: (p: PublicacaoGrupo) => void;
}

const ROTULO: Record<PublicacaoGrupo['tipo'], { nome: string; icone: keyof typeof Ionicons.glyphMap }> = {
  aviso: { nome: 'Aviso', icone: 'megaphone-outline' },
  cantico: { nome: 'Cântico', icone: 'musical-notes-outline' },
  oracao: { nome: 'Oração', icone: 'heart-outline' },
  programa: { nome: 'Programa da Missa', icone: 'list-outline' },
};

function quando(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z');
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) + ' · ' + d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

// Cópia do programa publicado para os programas do próprio utilizador (letras e gravações incluídas).
async function copiarPrograma(pub: PublicacaoGrupo): Promise<string> {
  const itens: Programa['itens'] = {};
  for (const it of pub.itens ?? []) {
    const momento: Momento = (MOMENTOS as readonly string[]).includes(it.momento) ? (it.momento as Momento) : 'Entrada';
    let escolha: Escolha;
    if (it.tipo === 'app' && it.idioma && it.slug) {
      escolha = { id: novoId(), tipo: 'app', idioma: it.idioma, slug: it.slug, titulo: it.titulo };
    } else {
      let audioUri: string | undefined;
      if (it.audioId) {
        const tmp = await descarregarAudioGrupo(it.audioId).catch(() => null);
        audioUri = tmp ? await guardarAudio(tmp).catch(() => undefined) : undefined;
      }
      escolha = { id: novoId(), tipo: 'proprio', titulo: it.titulo, letra: it.letra ?? '', audioUri };
    }
    itens[momento] = [...(itens[momento] ?? []), escolha];
  }
  const lista = await carregarProgramas();
  lista.unshift({ id: novoId(), titulo: pub.titulo, celebracao: pub.texto, criadoEm: Date.now(), itens });
  await guardarProgramas(lista);
  return pub.titulo;
}

export default function PublicacaoCard({ grupoId, pub, administrador, onMudou, onEditar }: Props) {
  const COLORS = useColors();
  const styles = useThemedStyles(createStyles);

  const [mensagem, setMensagem] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<'apagar' | 'denunciar' | null>(null);
  const [vistos, setVistos] = useState<{ viram: { nome: string }[]; totalMembros: number } | null>(null);
  const [aberto, setAberto] = useState<Record<number, boolean>>({});
  const [aCopiar, setACopiar] = useState(false);

  const info = ROTULO[pub.tipo];
  const podeGerir = administrador || pub.minha;
  const podeEditar = podeGerir;

  const accao = async (fn: () => Promise<void>, depois?: string) => {
    try { setMensagem(null); await fn(); if (depois) setMensagem(depois); onMudou(); }
    catch (e) { setMensagem(mensagemDeErro(e)); }
  };

  const verVistos = async () => {
    if (vistos) { setVistos(null); return; }
    try { setVistos(await vistosDoAviso(grupoId, pub.id)); } catch (e) { setMensagem(mensagemDeErro(e)); }
  };

  const copiar = async () => {
    try { setACopiar(true); const nome = await copiarPrograma(pub); setMensagem(`Programa "${nome}" adicionado aos seus programas.`); }
    catch { setMensagem('Não foi possível copiar o programa.'); }
    finally { setACopiar(false); }
  };

  const itensPorMomento = (pub.itens ?? []).reduce<Record<string, ItemProgramaGrupo[]>>((acc, it, i) => {
    (acc[it.momento] ??= []).push({ ...it, audioId: it.audioId ?? null });
    return acc;
  }, {});
  const ordem = [...MOMENTOS.filter(m => itensPorMomento[m]), ...Object.keys(itensPorMomento).filter(m => !(MOMENTOS as readonly string[]).includes(m))];

  return (
    <View style={[styles.cartao, pub.novo && styles.cartaoNovo]}>
      <View style={styles.cabecalho}>
        <View style={styles.icone}><Ionicons name={info.icone} size={18} color={COLORS.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipo}>{info.nome.toUpperCase()}{pub.fixada ? '  ·  FIXADO' : ''}{pub.novo ? '  ·  NOVO' : ''}</Text>
          <Text style={styles.meta} numberOfLines={1}>{pub.autorNome} · {quando(pub.criadoEm)}{pub.editadoEm ? ' · editado' : ''}</Text>
        </View>
        {pub.fixada && <Ionicons name="pin" size={16} color={COLORS.gold} />}
      </View>

      <Text style={styles.titulo}>{pub.titulo}</Text>
      {!!pub.texto && pub.tipo !== 'programa' && <Text style={styles.texto}>{pub.texto}</Text>}

      {pub.tipo === 'cantico' && (
        <View style={{ gap: 10, marginTop: 10 }}>
          {pub.audioIds.length > 0 && <AudioBotao obter={() => descarregarAudioGrupo(pub.audioIds[0])} />}
          <JuntarAPrograma
            titulo={pub.titulo}
            letra={pub.texto}
            momentoInicial={pub.momento}
            obterAudio={pub.audioIds.length ? () => descarregarAudioGrupo(pub.audioIds[0]) : undefined}
            onConcluido={setMensagem}
          />
        </View>
      )}

      {pub.tipo === 'programa' && (
        <View style={{ gap: 10, marginTop: 4 }}>
          {!!pub.texto && <Text style={styles.celebracao}>{pub.texto}</Text>}
          {ordem.map(m => (
            <View key={m} style={styles.momento}>
              <Text style={styles.momentoNome}>{m}</Text>
              {itensPorMomento[m].map((it, i) => {
                const chave = pub.id * 1000 + ordem.indexOf(m) * 100 + i;
                const temLetra = it.tipo === 'proprio' && !!it.letra;
                return (
                  <View key={chave} style={styles.item}>
                    <TouchableOpacity style={styles.itemLinha} onPress={() => temLetra && setAberto(a => ({ ...a, [chave]: !a[chave] }))} activeOpacity={temLetra ? 0.7 : 1}>
                      <Ionicons name={it.tipo === 'app' ? 'musical-notes-outline' : it.audioId ? 'mic-outline' : 'create-outline'} size={16} color={COLORS.primary} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitulo}>{it.titulo}</Text>
                        <Text style={styles.itemSub}>{it.tipo === 'app' ? 'Cântico da Ndatava' : 'Cântico próprio'}</Text>
                      </View>
                      {temLetra && <Ionicons name={aberto[chave] ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />}
                    </TouchableOpacity>
                    {aberto[chave] && !!it.letra && <Text style={styles.letra}>{it.letra}</Text>}
                    {!!it.audioId && <View style={{ marginTop: 6 }}><AudioBotao obter={() => descarregarAudioGrupo(it.audioId!)} rotulo="Ouvir" /></View>}
                  </View>
                );
              })}
            </View>
          ))}
          <TouchableOpacity style={[styles.copiar, aCopiar && { opacity: 0.6 }]} onPress={copiar} disabled={aCopiar} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.copiarTxt}>{aCopiar ? 'A copiar…' : 'Juntar aos meus programas'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!!mensagem && <Text style={styles.mensagem}>{mensagem}</Text>}

      <View style={styles.acoes}>
        {pub.tipo === 'aviso' && pub.vistos !== null && (
          <TouchableOpacity style={styles.acao} onPress={verVistos} activeOpacity={0.7}>
            <Ionicons name="eye-outline" size={17} color={COLORS.textSecondary} />
            <Text style={styles.acaoTxt}>Visto por {pub.vistos}</Text>
          </TouchableOpacity>
        )}
        {administrador && (
          <TouchableOpacity style={styles.acao} onPress={() => accao(() => fixarPublicacao(grupoId, pub.id, !pub.fixada))} activeOpacity={0.7}>
            <Ionicons name={pub.fixada ? 'pin' : 'pin-outline'} size={17} color={COLORS.textSecondary} />
            <Text style={styles.acaoTxt}>{pub.fixada ? 'Desafixar' : 'Fixar'}</Text>
          </TouchableOpacity>
        )}
        {podeEditar && pub.tipo !== 'programa' && (
          <TouchableOpacity style={styles.acao} onPress={() => onEditar(pub)} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={17} color={COLORS.textSecondary} />
            <Text style={styles.acaoTxt}>Editar</Text>
          </TouchableOpacity>
        )}
        {podeGerir && (
          <TouchableOpacity style={styles.acao} onPress={() => setConfirmar('apagar')} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={17} color={COLORS.error} />
            <Text style={[styles.acaoTxt, { color: COLORS.error }]}>Apagar</Text>
          </TouchableOpacity>
        )}
        {!pub.minha && (
          <TouchableOpacity style={styles.acao} onPress={() => setConfirmar('denunciar')} activeOpacity={0.7}>
            <Ionicons name="flag-outline" size={17} color={COLORS.textSecondary} />
            <Text style={styles.acaoTxt}>Denunciar</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!vistos && (
        <View style={styles.vistos}>
          <Text style={styles.vistosTitulo}>Viram: {vistos.viram.length} de {vistos.totalMembros}</Text>
          <Text style={styles.vistosLista}>{vistos.viram.length ? vistos.viram.map(v => v.nome).join(', ') : 'Ainda ninguém.'}</Text>
        </View>
      )}

      <ConfirmarModal
        visivel={!!confirmar}
        titulo={confirmar === 'apagar' ? 'Apagar publicação' : 'Denunciar publicação'}
        mensagem={confirmar === 'apagar'
          ? 'Apagar esta publicação para todos os membros do grupo?'
          : 'Enviar esta publicação à equipa da Ndatava para análise? Use esta opção para conteúdo ofensivo ou indevido.'}
        rotuloConfirmar={confirmar === 'apagar' ? 'Apagar' : 'Denunciar'}
        perigoso
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          const a = confirmar; setConfirmar(null);
          if (a === 'apagar') accao(() => apagarPublicacao(grupoId, pub.id));
          if (a === 'denunciar') accao(() => denunciarPublicacao(grupoId, pub.id, 'Conteúdo denunciado por um membro do grupo'), 'Denúncia enviada. Obrigado.');
        }}
      />
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  cartao: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 16, gap: 6, ...SHADOW.card },
  cartaoNovo: { borderWidth: 1.5, borderColor: COLORS.primary },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tipo: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8, color: COLORS.primary, fontFamily: FONTS.sans },
  meta: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  titulo: { fontSize: 18, fontWeight: '700', fontFamily: FONTS.display, color: COLORS.text, marginTop: 6 },
  texto: { fontSize: 15, lineHeight: 24, fontFamily: FONTS.sans, color: COLORS.text },
  celebracao: { fontSize: 13.5, fontStyle: 'italic', fontFamily: FONTS.sans, color: COLORS.textSecondary },
  momento: { gap: 4 },
  momentoNome: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.textSecondary, fontFamily: FONTS.sans, marginTop: 4 },
  item: { paddingVertical: 4 },
  itemLinha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitulo: { fontSize: 15, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.sans },
  letra: { fontSize: 15, lineHeight: 24, fontFamily: FONTS.sans, color: COLORS.text, marginTop: 6, marginLeft: 26 },
  copiar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.navbar, borderRadius: RADIUS.pill, paddingVertical: 12, marginTop: 6 },
  copiarTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.sans, fontSize: 14.5 },
  mensagem: { fontSize: 13.5, color: COLORS.primary, fontFamily: FONTS.sans, marginTop: 6 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  acaoTxt: { fontSize: 13, fontWeight: '600', fontFamily: FONTS.sans, color: COLORS.textSecondary },
  vistos: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: 12, gap: 4, marginTop: 6 },
  vistosTitulo: { fontSize: 13, fontWeight: '700', fontFamily: FONTS.sans, color: COLORS.text },
  vistosLista: { fontSize: 13, lineHeight: 19, fontFamily: FONTS.sans, color: COLORS.textSecondary },
});
