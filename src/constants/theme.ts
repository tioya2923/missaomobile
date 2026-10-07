export const COLORS = {
  primary:        '#7a1f2b',   // bordô — cor de marca, acções principais
  primaryDark:    '#5a1520',   // bordô profundo — estado premido, fundos de destaque
  primaryLight:   '#f6e9e8',   // fundo suave para estados activos/realce
  gold:           '#b8912f',   // dourado litúrgico — acento pontual, nunca decorativo em excesso
  goldLight:      '#f7f0dd',   // fundo suave para o dourado
  secondary:      '#5c6bc0',
  background:     '#f8f6f2',   // marfim claro — acolhedor sem pesar
  surface:        '#ffffff',
  text:           '#1e1a17',   // grafite quente em vez de preto puro
  textSecondary:  '#6a625a',   // contraste AA garantido sobre branco e marfim
  border:         '#ece7e0',   // linha subtil sobre o marfim
  borderDark:     '#333333',
  error:          '#b3261e',
  navbar:         '#7a1f2b',   // cabeçalho e barra activa seguem a cor de marca
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const SHADOW = {
  card: {
    shadowColor: '#3a2a1f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#3a2a1f',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Nomes-base das famílias. O componente AppText traduz (família + peso + itálico)
// para o ficheiro de letra concreto (ex.: Inter_600SemiBold), porque nas apps
// nativas cada peso é um ficheiro diferente.
export const FONTS = {
  sans:    'Inter',      // interface e leitura — limpa e moderna
  display: 'Fraunces',   // marca e títulos — serifa suave, com carácter litúrgico
};
