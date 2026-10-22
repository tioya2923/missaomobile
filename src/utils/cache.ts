import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache local para ler depressa e também offline. Se já há uma cópia guardada, mostra-a logo
// e actualiza-a em segundo plano (a próxima vez que o ecrã abrir já traz o conteúdo novo);
// só espera pela rede quando ainda não há cópia. Se a rede falhar e houver cópia, usa-a.
const PREFIXO = '@ndatava_cache2_';
// Dentro deste tempo a cópia é considerada actual e nem se vai à rede.
const FRESCO_MS = 3 * 60_000;

interface Guardado<T> { em: number; dados: T }

const memoria = new Map<string, Guardado<unknown>>();
const emCurso = new Map<string, Promise<unknown>>();

async function lerDoDisco<T>(chave: string): Promise<Guardado<T> | null> {
  const bruto = await AsyncStorage.getItem(PREFIXO + chave).catch(() => null);
  if (bruto == null) return null;
  try {
    const g = JSON.parse(bruto) as Guardado<T>;
    return typeof g?.em === 'number' && 'dados' in g ? g : null;
  } catch {
    return null; // cópia corrompida
  }
}

// Vai à rede (um só pedido por chave de cada vez) e guarda o resultado.
function actualizar<T>(chave: string, obterDaRede: () => Promise<T>): Promise<T> {
  const existente = emCurso.get(chave) as Promise<T> | undefined;
  if (existente) return existente;
  const pedido = obterDaRede()
    .then(dados => {
      const g: Guardado<T> = { em: Date.now(), dados };
      memoria.set(chave, g);
      AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(g)).catch(() => {});
      return dados;
    })
    .finally(() => { emCurso.delete(chave); });
  emCurso.set(chave, pedido);
  return pedido;
}

// `forcar` (puxar para actualizar) vai sempre à rede e só usa a cópia se a rede falhar.
export async function cachedFetch<T>(chave: string, obterDaRede: () => Promise<T>, forcar = false): Promise<T> {
  const guardado = (memoria.get(chave) as Guardado<T> | undefined) ?? await lerDoDisco<T>(chave);
  if (forcar) {
    try {
      return await actualizar(chave, obterDaRede);
    } catch (erro) {
      if (guardado) return guardado.dados;
      throw erro;
    }
  }
  if (guardado) {
    memoria.set(chave, guardado);
    if (Date.now() - guardado.em > FRESCO_MS) actualizar(chave, obterDaRede).catch(() => {});
    return guardado.dados;
  }
  return actualizar(chave, obterDaRede);
}
