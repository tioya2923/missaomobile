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
