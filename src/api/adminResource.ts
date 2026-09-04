import client from './client';

// Helpers genéricos de CRUD, usados pelo painel de administração para
// qualquer tipo de conteúdo, a partir da configuração de cada recurso
// (ver constants/resourcesConfig.ts). Espelha src/api/adminApi.js do site.

// Alguns recursos (Cânticos/Catecismo por idioma) têm um endpoint base que já
// inclui uma query string, ex: "/api/canticos?idioma=umb". Para GET/POST isso é
// só uma URL normal, mas para PUT/DELETE (que acrescentam "/{id}") o id tem de
// entrar ANTES da query string, senão fica "/api/canticos?idioma=umb/123" (inválido).
function comId(endpointBase: string, id: number): string {
  const [caminho, query] = endpointBase.split('?');
  return query ? `${caminho}/${id}?${query}` : `${caminho}/${id}`;
}

export async function listarRecurso(endpointLista: string): Promise<any[]> {
  const { data } = await client.get(endpointLista);
  return data;
}

export async function criarRecurso(endpointBase: string, payload: Record<string, unknown>): Promise<unknown> {
  const { data } = await client.post(endpointBase, payload);
  return data;
}

export async function atualizarRecurso(endpointBase: string, id: number, payload: Record<string, unknown>): Promise<void> {
  await client.put(comId(endpointBase, id), payload);
}

export async function eliminarRecurso(endpointBase: string, id: number): Promise<void> {
  await client.delete(comId(endpointBase, id));
}
