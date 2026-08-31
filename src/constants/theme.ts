export const COLORS = {
  primary:        '#7a1f2b',   // bordô — cor de marca, acções principais
  primaryLight:   '#f3e6e3',   // fundo suave para estados activos/realce
  gold:           '#c9a227',   // dourado litúrgico — acento pontual, nunca decorativo em excesso
  goldLight:      '#f4ecd8',   // fundo suave para o dourado
  secondary:      '#5c6bc0',
  background:     '#faf7f1',   // marfim quente — mais acolhedor que o cinzento plano
  surface:        '#ffffff',
  text:           '#2a2420',   // grafite quente em vez de preto puro
  textSecondary:  '#6b6155',   // contraste AA garantido (6:1) sobre branco e marfim
  border:         '#ede6dc',   // linha subtil sobre o marfim
  borderDark:     '#333333',
  error:          '#b3261e',
  navbar:         '#7a1f2b',   // cabeçalho e barra activa seguem a cor de marca
};

export const RADIUS = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const SHADOW = {
  card: {
    shadowColor: '#3a2a1f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const FONTS = {
  serif:      'serif',         // títulos e marca — voz tradicional
  sansSerif:  'sans-serif',    // interface e leitura — voz moderna e simples
};
