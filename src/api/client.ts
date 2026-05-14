import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@kwendi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
