import client from './client';

export interface VersaoAppInfo {
  versaoRecomendada?: string | null;
  versaoMinima?: string | null;
  urlDownload?: string | null;
  mensagem?: string | null;
}

export async function getVersaoApp(): Promise<VersaoAppInfo> {
  const { data } = await client.get<VersaoAppInfo>('/api/versao-app');
  return data;
}
