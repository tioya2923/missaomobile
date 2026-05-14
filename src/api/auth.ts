import client from './client';

export interface AuthResponse {
  token: string;
  nome: string;
  email: string;
}

export async function loginUtilizador(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/api/utilizadores/login', { email, password });
  return data;
}

export async function registarUtilizador(nome: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/api/utilizadores/registar', { nome, email, password });
  return data;
}
