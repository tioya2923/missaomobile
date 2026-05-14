import client from './client';
import { API_BASE_URL } from '../constants/api';

export interface DataCampoRemoto { dia: string; mes: string; ano: string; }

export interface PerfilRemoto {
  nome: string;
  email: string;
  fotoUrl?: string | null;
  nascimento: DataCampoRemoto;
  baptismo:   DataCampoRemoto;
  comunhao:   DataCampoRemoto;
  crisma:     DataCampoRemoto;
  casamento:  DataCampoRemoto;
  ordem:      DataCampoRemoto;
  diocese?:           string | null;
  paroquia?:          string | null;
  centroMissionario?: string | null;
  catequese?:         string | null;
}

export type AtualizarPerfilPayload = Omit<PerfilRemoto, 'email' | 'fotoUrl'>;

export async function getPerfil(): Promise<PerfilRemoto> {
  const { data } = await client.get<PerfilRemoto>('/api/utilizadores/eu');
  return data;
}

export async function atualizarPerfil(payload: AtualizarPerfilPayload): Promise<PerfilRemoto> {
  const { data } = await client.put<PerfilRemoto>('/api/utilizadores/eu', payload);
  return data;
}

export async function uploadFoto(uri: string): Promise<string> {
  const filename = uri.split('/').pop() ?? 'foto.jpg';
  const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase();
  const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  const form = new FormData();
  form.append('foto', { uri, name: filename, type } as unknown as Blob);

  const { data } = await client.post<{ fotoUrl: string }>(
    '/api/utilizadores/eu/foto',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return `${API_BASE_URL}${data.fotoUrl}`;
}
