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
}

export async function enviarCantico(p: EnvioPayload): Promise<{ enviados: number; naoEnviados: string[] }> {
  const { data } = await contaClient.post<{ enviados: number; naoEnviados: string[] }>('/api/partilhas', p);
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
