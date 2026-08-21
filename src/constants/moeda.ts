// Catálogo das moedas suportadas — cada loja vende na sua própria moeda (Angola,
// Portugal, Brasil, Moçambique, Cabo Verde ou outra), sem conversão automática entre
// elas. Os códigos correspondem exatamente aos do backend (Models/Moeda.cs).

interface InfoMoeda {
  simbolo: string;
  antes: boolean; // símbolo antes (€15.00) ou depois (15.00 Kz) do valor
}

const MOEDAS: Record<string, InfoMoeda> = {
  AOA: { simbolo: 'Kz', antes: false },
  EUR: { simbolo: '€', antes: true },
  BRL: { simbolo: 'R$', antes: true },
  MZN: { simbolo: 'MT', antes: false },
  CVE: { simbolo: '$', antes: false },
  USD: { simbolo: '$', antes: true },
};

export function formatarPreco(valor: number, moeda?: string | null): string {
  const info = MOEDAS[moeda ?? 'AOA'] ?? MOEDAS.AOA;
  const numero = valor.toFixed(2);
  return info.antes ? `${info.simbolo}${numero}` : `${numero} ${info.simbolo}`;
}

// Lista com rótulo por país, para seletores (ex.: registo/perfil de loja).
export const MOEDAS_LISTA: { codigo: string; label: string }[] = [
  { codigo: 'AOA', label: 'Kwanza (Angola)' },
  { codigo: 'EUR', label: 'Euro (Portugal)' },
  { codigo: 'BRL', label: 'Real (Brasil)' },
  { codigo: 'MZN', label: 'Metical (Moçambique)' },
  { codigo: 'CVE', label: 'Escudo (Cabo Verde)' },
  { codigo: 'USD', label: 'Dólar (outros países)' },
];

export function labelMoeda(codigo: string): string {
  return MOEDAS_LISTA.find((m) => m.codigo === codigo)?.label ?? codigo;
}
