import { useContext } from 'react';
import { LojaAuthContext } from './LojaAuthContext';

export function useLojaAuth() {
  const ctx = useContext(LojaAuthContext);
  if (!ctx) throw new Error('useLojaAuth deve ser usado dentro de LojaAuthProvider');
  return ctx;
}
