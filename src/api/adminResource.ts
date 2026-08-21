import client from './client';

// Helpers genéricos de CRUD, usados pelo painel de administração para
// qualquer tipo de conteúdo, a partir da configuração de cada recurso
// (ver constants/resourcesConfig.ts). Espelha src/api/adminApi.js do site.

export async function listarRecurso(endpointLista: string): Promise<any[]> {
  const { data } = await client.get(endpointLista);
  return data;
}

export async function criarRecurso(endpointBase: string, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await client.post(endpointBase, payload);
  return data;
}

export async function atualizarRecurso(endpointBase: string, id: number, payload: Record<string, unknown>): Promise<void> {
  await client.put(`${endpointBase}/${id}`, payload);
}

export async function eliminarRecurso(endpointBase: string, id: number): Promise<void> {
  await client.delete(`${endpointBase}/${id}`);
}
