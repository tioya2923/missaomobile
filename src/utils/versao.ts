// Compara duas versões no formato "1.2.3". Devolve negativo se a < b,
// positivo se a > b, 0 se iguais.
export function compararVersoes(a: string, b: string): number {
  const pa = a.trim().split('.').map(n => parseInt(n, 10) || 0);
  const pb = b.trim().split('.').map(n => parseInt(n, 10) || 0);
  const tamanho = Math.max(pa.length, pb.length);
  for (let i = 0; i < tamanho; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function versaoEhMenorQue(atual: string, referencia?: string | null): boolean {
  if (!referencia) return false;
  return compararVersoes(atual, referencia) < 0;
}
