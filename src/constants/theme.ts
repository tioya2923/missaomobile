export interface Palette {
  primary:        string;   // cor de marca para texto/realce (clara no modo escuro, para ter contraste)
  primaryDark:    string;
  primaryLight:   string;   // fundo suave para estados activos/realce
  gold:           string;
  goldLight:      string;
  secondary:      string;
  background:     string;
  surface:        string;
  text:           string;
  textSecondary:  string;
  border:         string;
  borderDark:     string;
  error:          string;
  navbar:         string;   // bordô para botões e superfícies cheias (texto branco por cima)
  okBg:           string;
  okText:         string;
  warnBg:         string;
  warnText:       string;
  infoBg:         string;
  infoText:       string;
  promo:          string;
}

export const LIGHT: Palette = {
  primary:        '#7a1f2b',   // bordô — cor de marca
  primaryDark:    '#5a1520',
  primaryLight:   '#f6e9e8',
  gold:           '#b8912f',   // dourado litúrgico — acento pontual
  goldLight:      '#f7f0dd',
  secondary:      '#5c6bc0',
  background:     '#f8f6f2',   // marfim claro
  surface:        '#ffffff',
  text:           '#1e1a17',   // grafite quente
  textSecondary:  '#6a625a',
  border:         '#ece7e0',
  borderDark:     '#333333',
  error:          '#b3261e',
  navbar:         '#7a1f2b',
  okBg:           '#e8f5e9',
  okText:         '#2e7d32',
  warnBg:         '#fff3e0',
  warnText:       '#e65100',
  infoBg:         '#eef4fc',
  infoText:       '#1c4a7a',
  promo:          '#c0392b',
};

export const DARK: Palette = {
  primary:        '#e59aa5',   // rosa-bordô claro: legível sobre fundo escuro
  primaryDark:    '#5a1520',
  primaryLight:   '#3a1e24',
  gold:           '#d4ab45',
  goldLight:      '#3a3220',
  secondary:      '#8c98e0',
  background:     '#141110',   // castanho quase preto, quente
  surface:        '#201c19',
  text:           '#f2ece5',
  textSecondary:  '#b5aca1',
  border:         '#312b26',
  borderDark:     '#cfc7bd',
  error:          '#f2918b',
  navbar:         '#8e2434',
  okBg:           '#1c2e20',
  okText:         '#7bd88f',
  warnBg:         '#33261a',
  warnText:       '#ffb066',
  infoBg:         '#1a2636',
  infoText:       '#8fbbe8',
  promo:          '#ef6b5c',
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
