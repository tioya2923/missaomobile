import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache local simples para leitura offline: tenta sempre ir buscar dados
// frescos à rede; se conseguir, guarda uma cópia local. Se a rede falhar
// (sem ligação, por exemplo), devolve a última cópia guardada, para que
// cânticos e catecismo já vistos antes continuem legíveis offline.
const PREFIXO = '@ndatava_cache_';

export async function cachedFetch<T>(chave: string, obterDaRede: () => Promise<T>): Promise<T> {
  try {
    const dados = await obterDaRede();
    // Não bloqueia a resposta à espera de gravar a cache.
    AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(dados)).catch(() => {});
    return dados;
  } catch (erroRede) {
    const guardado = await AsyncStorage.getItem(PREFIXO + chave).catch(() => null);
    if (guardado != null) {
      try {
        return JSON.parse(guardado) as T;
      } catch {
        // cache corrompida — ignora e propaga o erro de rede original
      }
    }
    throw erroRede;
  }
}
