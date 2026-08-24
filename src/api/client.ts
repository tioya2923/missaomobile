import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@kwendi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Quando a sessão (loja ou gestor) expira, o servidor responde 401 a partir
// daí em todos os pedidos — sem isto, cada ecrã ficava só a mostrar "não foi
// possível..." indefinidamente, sem indicar que é preciso entrar outra vez.
// LojaAuthContext regista aqui a sua função de logout ao arrancar.
let aoExpirarSessao: (() => void) | null = null;
export function definirAoExpirarSessao(fn: (() => void) | null) {
  aoExpirarSessao = fn;
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) aoExpirarSessao?.();
    return Promise.reject(error);
  },
);

export default client;
