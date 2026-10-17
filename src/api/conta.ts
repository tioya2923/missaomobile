import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { isAxiosError } from 'axios';
import * as FileSystem from 'expo-file-system/legacy';
import { API_BASE_URL } from '../constants/api';

// Conta de utilizador (nome + email + palavra-passe), só para partilhar cânticos entre pessoas
// dentro da app. É independente da sessão de loja/administrador, por isso tem o seu próprio cliente.
export const CONTA_TOKEN_KEY = '@ndatava_conta_token';

const contaClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

contaClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(CONTA_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let aoExpirarConta: (() => void) | null = null;
export function definirAoExpirarConta(fn: (() => void) | null) {
  aoExpirarConta = fn;
}

contaClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) aoExpirarConta?.();
    return Promise.reject(error);
  },
);

/** Mensagem legível de um erro do servidor (ou texto por omissão). */
export function mensagemDeErro(e: unknown, porOmissao = 'Não foi possível concluir. Verifique a ligação e tente de novo.'): string {
  if (isAxiosError(e)) {
    const d = e.response?.data;
    if (typeof d === 'string' && d.trim() && d.length < 200) return d;
    if (e.response?.status === 429) return 'Atingiu o limite de envios de hoje. Tente amanhã.';
  }
  return porOmissao;
}

export interface SessaoConta { token: string; nome: string; email: string }

export async function registarConta(nome: string, email: string, password: string): Promise<SessaoConta> {
  const { data } = await contaClient.post<SessaoConta>('/api/utilizadores/registar', { nome, email, password });
  return data;
}

export async function entrarConta(email: string, password: string): Promise<SessaoConta> {
  const { data } = await contaClient.post<SessaoConta>('/api/utilizadores/login', { email, password });
  return data;
}

export async function eliminarContaNoServidor(): Promise<void> {
  await contaClient.delete('/api/utilizadores/eu');
}

export async function obterMeuCodigo(): Promise<{ codigo: string; nome: string }> {
  const { data } = await contaClient.get<{ codigo: string; nome: string }>('/api/partilhas/meu-codigo');
  return data;
}

/** Envia a gravação para o servidor e devolve o id a anexar ao envio. */
export async function carregarAudio(uri: string): Promise<number> {
  const nome = uri.split('/').pop()?.split('?')[0] ?? 'voz.m4a';
  const form = new FormData();
  form.append('audio', { uri, name: nome.includes('.') ? nome : `${nome}.m4a`, type: 'application/octet-stream' } as unknown as Blob);
  const { data } = await contaClient.post<{ audioId: number }>('/api/partilhas/audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  });
  return data.audioId;
}

export interface EnvioPayload {
  titulo: string;
  letra: string;
  momento?: string;
  audioId?: number;
  codigos: string[];
  /** ids de contactos (utilizadorId) que já aceitaram */
  contactos?: number[];
}

export interface EnvioResultado { enviados: number; naoEnviados: string[]; contactosNaoEnviados: number[] }

export async function enviarCantico(p: EnvioPayload): Promise<EnvioResultado> {
  const { data } = await contaClient.post<EnvioResultado>('/api/partilhas', p);
  return data;
}

export interface Recebida {
  id: number;
  titulo: string;
  momento: string | null;
  remetenteNome: string;
  remetenteCodigo: string | null;
  temAudio: boolean;
  lido: boolean;
  criadoEm: string;
}

export interface RecebidaDetalhe {
  id: number;
  titulo: string;
  letra: string;
  momento: string | null;
  criadoEm: string;
  remetenteNome: string | null;
  remetenteCodigo: string | null;
  temAudio: boolean;
}

export async function listarRecebidas(): Promise<Recebida[]> {
  const { data } = await contaClient.get<Recebida[]>('/api/partilhas/recebidas');
  return data;
}

export async function detalheRecebida(id: number): Promise<RecebidaDetalhe> {
  const { data } = await contaClient.get<RecebidaDetalhe>(`/api/partilhas/${id}`);
  return data;
}

/** Descarrega a gravação recebida para um ficheiro temporário e devolve o caminho. */
export async function descarregarAudioRecebido(id: number): Promise<string> {
  const token = await AsyncStorage.getItem(CONTA_TOKEN_KEY);
  const destino = `${FileSystem.cacheDirectory}recebido-${id}-${Date.now()}.m4a`;
  const r = await FileSystem.downloadAsync(`${API_BASE_URL}/api/partilhas/${id}/audio`, destino, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (r.status !== 200) throw new Error('Não foi possível descarregar a gravação.');
  return r.uri;
}

export async function apagarRecebida(id: number): Promise<void> {
  await contaClient.delete(`/api/partilhas/${id}`);
}

export async function denunciarRecebida(id: number, motivo: string): Promise<void> {
  await contaClient.post(`/api/partilhas/${id}/denunciar`, { motivo });
}

export async function bloquearRemetente(id: number): Promise<void> {
  await contaClient.post(`/api/partilhas/${id}/bloquear`);
}

export interface Bloqueado { utilizadorId: number; nome: string; codigo: string | null }

export async function listarBloqueados(): Promise<Bloqueado[]> {
  const { data } = await contaClient.get<Bloqueado[]>('/api/partilhas/bloqueados');
  return data;
}

export async function desbloquear(utilizadorId: number): Promise<void> {
  await contaClient.delete(`/api/partilhas/bloqueados/${utilizadorId}`);
}

// ── Contactos: pesquisar pessoas, pedidos e lista ─────────────────────────────

export type EstadoLigacao = 'nenhum' | 'enviado' | 'recebido' | 'contacto';

export interface PessoaPesquisa { utilizadorId: number; nome: string; paroquia: string | null; estado: EstadoLigacao }

export interface Pessoa { id: number; utilizadorId: number; nome: string; paroquia: string | null; codigo: string | null }

export interface ListaContactos { contactos: Pessoa[]; recebidos: Pessoa[]; enviados: Pessoa[] }

export async function pesquisarPessoas(q: string): Promise<PessoaPesquisa[]> {
  const { data } = await contaClient.get<PessoaPesquisa[]>('/api/contactos/pesquisa', { params: { q } });
  return data;
}

export async function listarContactos(): Promise<ListaContactos> {
  const { data } = await contaClient.get<ListaContactos>('/api/contactos');
  return data;
}

export async function pedirContacto(utilizadorId: number): Promise<EstadoLigacao> {
  const { data } = await contaClient.post<{ estado: EstadoLigacao }>('/api/contactos/pedidos', { utilizadorId });
  return data.estado;
}

export async function aceitarPedido(id: number): Promise<void> {
  await contaClient.post(`/api/contactos/pedidos/${id}/aceitar`);
}

/** Recusa um pedido recebido ou cancela um pedido enviado. */
export async function recusarPedido(id: number): Promise<void> {
  await contaClient.delete(`/api/contactos/pedidos/${id}`);
}

export async function removerContacto(utilizadorId: number): Promise<void> {
  await contaClient.delete(`/api/contactos/${utilizadorId}`);
}

export async function contarPedidosRecebidos(): Promise<number> {
  const { data } = await contaClient.get<{ recebidos: number }>('/api/contactos/pedidos/contagem');
  return data.recebidos;
}

export interface Definicoes { visivelPesquisa: boolean; paroquia: string }

export async function obterDefinicoes(): Promise<Definicoes> {
  const { data } = await contaClient.get<Definicoes>('/api/contactos/definicoes');
  return data;
}

export async function guardarDefinicoes(d: Definicoes): Promise<Definicoes> {
  const { data } = await contaClient.put<Definicoes>('/api/contactos/definicoes', d);
  return data;
}

// ── Grupos (coral, oração, pastoral…) ─────────────────────────────────────────

export type TipoGrupo = 'coral' | 'oracao' | 'pastoral' | 'juventude' | 'outro';

export const TIPOS_GRUPO: { valor: TipoGrupo; rotulo: string; icone: string }[] = [
  { valor: 'coral', rotulo: 'Coral', icone: 'musical-notes-outline' },
  { valor: 'oracao', rotulo: 'Oração', icone: 'heart-outline' },
  { valor: 'pastoral', rotulo: 'Pastoral', icone: 'people-outline' },
  { valor: 'juventude', rotulo: 'Juventude', icone: 'sparkles-outline' },
  { valor: 'outro', rotulo: 'Outro', icone: 'albums-outline' },
];

export interface GrupoResumo {
  id: number; nome: string; tipo: TipoGrupo; descricao: string | null; paroquia: string | null;
  administrador: boolean; membros: number; naoLidas: number; pedidos: number;
}
export interface ConviteGrupo { id: number; nome: string; tipo: TipoGrupo; descricao: string | null; paroquia: string | null }
export interface ListaGrupos { grupos: GrupoResumo[]; convites: ConviteGrupo[]; aguardam: { id: number; nome: string; tipo: TipoGrupo }[] }

export interface GrupoDetalhe {
  id: number; nome: string; tipo: TipoGrupo; descricao: string | null; paroquia: string | null;
  membrosPublicam: boolean; administrador: boolean; criador: boolean; podeApagar: boolean; membros: number;
  codigo: string | null; codigoActivo: boolean | null;
}

export interface MembroGrupoInfo { utilizadorId: number; nome: string; paroquia: string | null; administrador: boolean; euProprio: boolean }
export interface MembrosGrupo { membros: MembroGrupoInfo[]; pedidos: MembroGrupoInfo[]; convidados: MembroGrupoInfo[] }

export type TipoPublicacao = 'aviso' | 'cantico' | 'oracao' | 'programa';

export interface ItemProgramaGrupo {
  momento: string; tipo: 'app' | 'proprio'; titulo: string;
  idioma?: string | null; slug?: string | null; letra?: string | null; audioId?: number | null;
}

export interface PublicacaoGrupo {
  id: number; tipo: TipoPublicacao; titulo: string; texto: string; momento: string | null;
  fixada: boolean; criadoEm: string; editadoEm: string | null;
  autorId: number; autorNome: string; minha: boolean; novo: boolean;
  itens: ItemProgramaGrupo[] | null; audioIds: number[]; vistos: number | null;
}

export async function listarGrupos(): Promise<ListaGrupos> {
  const { data } = await contaClient.get<ListaGrupos>('/api/grupos');
  return data;
}

export async function resumoGrupos(): Promise<{ naoLidas: number; pedidos: number; convites: number }> {
  const { data } = await contaClient.get<{ naoLidas: number; pedidos: number; convites: number }>('/api/grupos/resumo');
  return data;
}

export async function criarGrupo(g: { nome: string; tipo: TipoGrupo; descricao?: string; paroquia?: string }): Promise<number> {
  const { data } = await contaClient.post<{ id: number }>('/api/grupos', g);
  return data.id;
}

export async function detalheGrupo(id: number): Promise<GrupoDetalhe> {
  const { data } = await contaClient.get<GrupoDetalhe>(`/api/grupos/${id}`);
  return data;
}

export interface DefinicoesGrupo {
  nome: string; tipo: TipoGrupo; descricao: string; paroquia: string; membrosPublicam: boolean; codigoActivo: boolean;
}

export async function editarGrupo(id: number, g: DefinicoesGrupo): Promise<void> {
  await contaClient.put(`/api/grupos/${id}`, g);
}

export async function renovarCodigoGrupo(id: number): Promise<string> {
  const { data } = await contaClient.post<{ codigo: string }>(`/api/grupos/${id}/codigo/renovar`);
  return data.codigo;
}

export async function apagarGrupo(id: number): Promise<void> {
  await contaClient.delete(`/api/grupos/${id}`);
}

export async function sairDoGrupo(id: number): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/sair`);
}

export async function entrarNoGrupo(codigo: string): Promise<{ estado: 'membro' | 'pedido'; grupoId: number; nome: string }> {
  const { data } = await contaClient.post<{ estado: 'membro' | 'pedido'; grupoId: number; nome: string }>('/api/grupos/entrar', { codigo });
  return data;
}

export async function aceitarConviteGrupo(id: number): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/convite/aceitar`);
}

/** Recusa um convite ou cancela o meu pedido de entrada. */
export async function recusarConviteGrupo(id: number): Promise<void> {
  await contaClient.delete(`/api/grupos/${id}/convite`);
}

export async function listarMembrosGrupo(id: number): Promise<MembrosGrupo> {
  const { data } = await contaClient.get<MembrosGrupo>(`/api/grupos/${id}/membros`);
  return data;
}

export async function convidarParaGrupo(id: number, utilizadorIds: number[]): Promise<{ convidados: number; ignorados: number[] }> {
  const { data } = await contaClient.post<{ convidados: number; ignorados: number[] }>(`/api/grupos/${id}/convidar`, { utilizadorIds });
  return data;
}

export async function aprovarPedidoGrupo(id: number, utilizadorId: number): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/pedidos/${utilizadorId}/aprovar`);
}

/** Recusa um pedido de entrada ou cancela um convite enviado. */
export async function recusarPedidoGrupo(id: number, utilizadorId: number): Promise<void> {
  await contaClient.delete(`/api/grupos/${id}/pedidos/${utilizadorId}`);
}

export async function removerMembroGrupo(id: number, utilizadorId: number): Promise<void> {
  await contaClient.delete(`/api/grupos/${id}/membros/${utilizadorId}`);
}

export async function definirAdministrador(id: number, utilizadorId: number, valor: boolean): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/membros/${utilizadorId}/administrador`, { valor });
}

export interface PublicarPayload {
  tipo: TipoPublicacao; titulo: string; texto?: string; momento?: string;
  audioId?: number; itens?: ItemProgramaGrupo[];
}

export async function publicarNoGrupo(id: number, p: PublicarPayload): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/publicacoes`, p);
}

export async function listarPublicacoes(id: number): Promise<PublicacaoGrupo[]> {
  const { data } = await contaClient.get<PublicacaoGrupo[]>(`/api/grupos/${id}/publicacoes`);
  return data;
}

export async function editarPublicacao(id: number, pid: number, titulo: string, texto: string): Promise<void> {
  await contaClient.put(`/api/grupos/${id}/publicacoes/${pid}`, { titulo, texto });
}

export async function fixarPublicacao(id: number, pid: number, fixada: boolean): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/publicacoes/${pid}/fixar`, { fixada });
}

export async function apagarPublicacao(id: number, pid: number): Promise<void> {
  await contaClient.delete(`/api/grupos/${id}/publicacoes/${pid}`);
}

export async function denunciarPublicacao(id: number, pid: number, motivo: string): Promise<void> {
  await contaClient.post(`/api/grupos/${id}/publicacoes/${pid}/denunciar`, { motivo });
}

export async function vistosDoAviso(id: number, pid: number): Promise<{ viram: { nome: string; vistoEm: string }[]; totalMembros: number }> {
  const { data } = await contaClient.get<{ viram: { nome: string; vistoEm: string }[]; totalMembros: number }>(`/api/grupos/${id}/publicacoes/${pid}/vistos`);
  return data;
}

/** Descarrega uma gravação de uma publicação de grupo para um ficheiro temporário. */
export async function descarregarAudioGrupo(audioId: number): Promise<string> {
  const token = await AsyncStorage.getItem(CONTA_TOKEN_KEY);
  const destino = `${FileSystem.cacheDirectory}grupo-${audioId}-${Date.now()}.m4a`;
  const r = await FileSystem.downloadAsync(`${API_BASE_URL}/api/grupos/audio/${audioId}`, destino, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (r.status !== 200) throw new Error('Não foi possível descarregar a gravação.');
  return r.uri;
}
