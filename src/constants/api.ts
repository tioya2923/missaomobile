export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://backendmissaohuambo.onrender.com';

// Site web da Ndatava — usado para abrir, no navegador do telemóvel, fluxos que
// ainda só existem na versão web (ex.: registar/entrar como loja parceira).
export const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://missao-no-huambo-frontend-b3583f0178f6.herokuapp.com';
