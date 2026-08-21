// Catálogo fixo dos métodos de pagamento disponíveis. Os códigos têm de
// corresponder exatamente aos definidos no backend (Models/MetodoPagamento.cs).
// Cada loja escolhe livremente quais aceita — um, vários, ou todos.

export interface MetodoPagamentoInfo {
  codigo: string;
  label: string;
  icone: string; // nome do ícone Ionicons
  precisaDetalhe: boolean;
  placeholderDetalhe?: string;
}

export const METODOS_PAGAMENTO: MetodoPagamentoInfo[] = [
  { codigo: 'dinheiro', label: 'Dinheiro (presencial / na entrega)', icone: 'cash-outline', precisaDetalhe: false },
  { codigo: 'multicaixa_express', label: 'Multicaixa Express', icone: 'phone-portrait-outline', precisaDetalhe: true, placeholderDetalhe: 'Nº de telefone associado, ex.: 923 000 000' },
  { codigo: 'referencia_multicaixa', label: 'Referência Multicaixa', icone: 'card-outline', precisaDetalhe: true, placeholderDetalhe: 'Entidade e referência, ex.: Entidade 00000, Ref. 000 000 000' },
  { codigo: 'transferencia_bancaria', label: 'Transferência bancária (IBAN)', icone: 'business-outline', precisaDetalhe: true, placeholderDetalhe: 'IBAN e titular, ex.: AO06 0000 0000 0000 0000 0, titular Loja Exemplo' },
  { codigo: 'unitel_money', label: 'Unitel Money', icone: 'phone-portrait-outline', precisaDetalhe: true, placeholderDetalhe: 'Nº de telefone associado' },
  { codigo: 'paypay', label: 'PayPay', icone: 'wallet-outline', precisaDetalhe: true, placeholderDetalhe: 'Nº de telefone ou utilizador PayPay' },
  { codigo: 'cartao_pos', label: 'Cartão bancário (POS na entrega/levantamento)', icone: 'card-outline', precisaDetalhe: false },
];

export function labelMetodoPagamento(codigo: string): string {
  return METODOS_PAGAMENTO.find((m) => m.codigo === codigo)?.label ?? codigo;
}

export function iconeMetodoPagamento(codigo: string): string {
  return METODOS_PAGAMENTO.find((m) => m.codigo === codigo)?.icone ?? 'cash-outline';
}
