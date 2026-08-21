import client from './client';

// Login do administrador (Gestor) — usado como segunda tentativa quando o
// formulário de "Vender no Ndatava" recebe credenciais que não são de uma
// loja, para permitir abrir a página de administração no navegador.
export interface SessaoGestor {
  token: string;
  nome: string;
  email: string;
}

export async function loginGestor(email: string, password: string): Promise<SessaoGestor> {
  const { data } = await client.post<SessaoGestor>('/api/auth/login', { email, password });
  return data;
}
