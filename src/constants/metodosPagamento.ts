// Catálogo fixo dos métodos de pagamento disponíveis em Angola. Os códigos têm de
// corresponder exatamente aos definidos no backend (Models/MetodoPagamento.cs).
// Cada loja escolhe livremente quais aceita — um, vários, ou todos.

export interface MetodoPagamentoInfo {
  codigo: string;
  label: string;
  icone: string; // nome do ícone Ionicons
}

export const METODOS_PAGAMENTO: MetodoPagamentoInfo[] = [
  { codigo: 'dinheiro', label: 'Dinheiro (presencial / na entrega)', icone: 'cash-outline' },
  { codigo: 'multicaixa_express', label: 'Multicaixa Express', icone: 'phone-portrait-outline' },
  { codigo: 'referencia_multicaixa', label: 'Referência Multicaixa', icone: 'card-outline' },
  { codigo: 'transferencia_bancaria', label: 'Transferência bancária (IBAN)', icone: 'business-outline' },
  { codigo: 'unitel_money', label: 'Unitel Money', icone: 'phone-portrait-outline' },
  { codigo: 'paypay', label: 'PayPay', icone: 'wallet-outline' },
  { codigo: 'cartao_pos', label: 'Cartão bancário (POS)', icone: 'card-outline' },
];

export function labelMetodoPagamento(codigo: string): string {
  return METODOS_PAGAMENTO.find((m) => m.codigo === codigo)?.label ?? codigo;
}

export function iconeMetodoPagamento(codigo: string): string {
  return METODOS_PAGAMENTO.find((m) => m.codigo === codigo)?.icone ?? 'cash-outline';
}
