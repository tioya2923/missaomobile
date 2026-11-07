import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polygon, Polyline, RadialGradient, Stop } from 'react-native-svg';

// Animação de abertura: o disco bordô aparece, o N desenha-se em fio dourado, o nome NDATAVA escreve-se
// letra a letra por baixo e o ecrã desvanece-se para a app. Corre por cima da app enquanto esta carrega,
// por isso não atrasa o arranque além de ~1,6 s (e só desvanece quando a app já está pronta).
const FUNDO = '#701a2a';

// Contorno do N com o braço da cruz (mesmas coordenadas do ícone), centrado num disco de diâmetro 1000.
const N: [number, number][] = [
  [210, 232], [268, 232], [593, 632], [593, 412], [478, 412], [478, 358], [593, 358], [593, 232], [640, 232],
  [640, 358], [750, 358], [750, 412], [640, 412], [640, 700], [592, 700], [262, 305], [262, 700], [210, 700],
];
const ESCALA = 1.095;
const PONTOS = N.map(([x, y]) => [500 + (x - 480) * ESCALA, 500 + (y - 466) * ESCALA] as const);
const PONTOS_SVG = PONTOS.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
const PERIMETRO = PONTOS.reduce((soma, [x, y], i) => {
  const [px, py] = PONTOS[(i + 1) % PONTOS.length];
  return soma + Math.hypot(px - x, py - y);
}, 0);
const FIO = 26;

// Letras do nome, desenhadas com traços simples (cada letra: um ou mais traços) numa caixa de 80 x 100.
type Traco = [number, number][];
const semicirculo: Traco = Array.from({ length: 13 }, (_, i) => {
  const fi = (i / 12) * Math.PI;
  return [30 + 50 * Math.sin(fi), 50 + 50 * Math.cos(fi)] as [number, number];
});
const LETRAS: Record<string, Traco[]> = {
  N: [[[0, 100], [0, 0], [80, 100], [80, 0]]],
  D: [[[0, 0], [0, 100], ...semicirculo, [0, 0]]],
  A: [[[0, 100], [40, 0], [80, 100]], [[14, 64], [66, 64]]],
  T: [[[0, 0], [80, 0]], [[40, 0], [40, 100]]],
  V: [[[0, 0], [40, 100], [80, 0]]],
};
const NOME = 'NDATAVA'.split('');
const LARGURA_LETRA = 80;
const ESPACO = 26;
const LARGURA_NOME = NOME.length * LARGURA_LETRA + (NOME.length - 1) * ESPACO;
const FIO_NOME = 9;
const comprimento = (t: Traco) => t.reduce((s, [x, y], i) => (i ? s + Math.hypot(x - t[i - 1][0], y - t[i - 1][1]) : 0), 0);

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

interface Props {
  /** A app já carregou (letras e tema): só então a animação se desvanece. */
  pronta: boolean;
  onTermina: () => void;
}

export default function SplashAnimado({ pronta, onTermina }: Props) {
  const { width, height } = useWindowDimensions();
  const lado = Math.min(Math.min(width, height) * 0.58, 320);
  const larguraNome = Math.min(width * 0.8, lado * 1.35);
  const alturaNome = (larguraNome / (LARGURA_NOME + 2 * FIO_NOME)) * (100 + 2 * FIO_NOME);

  const disco = useRef(new Animated.Value(0)).current;
  const traco = useRef(new Animated.Value(0)).current;
  const faisca = useRef(new Animated.Value(0)).current;
  const palavra = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(1)).current;
  const [fimDaAnimacao, setFimDaAnimacao] = useState(false);

  useEffect(() => {
    let cancelado = false;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduzir => {
      if (cancelado) return;
      if (reduzir) {
        disco.setValue(1); traco.setValue(1); palavra.setValue(1);
        setTimeout(() => !cancelado && setFimDaAnimacao(true), 300);
        return;
      }
      Animated.parallel([
        Animated.timing(disco, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(traco, { toValue: 1, duration: 700, delay: 150, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(palavra, { toValue: 1, duration: 900, delay: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(faisca, { toValue: 1, duration: 600, delay: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]).start(() => !cancelado && setFimDaAnimacao(true));
    });
    return () => { cancelado = true; };
  }, [disco, traco, faisca, palavra]);

  useEffect(() => {
    if (!(fimDaAnimacao && pronta)) return;
    Animated.timing(saida, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true })
      .start(() => onTermina());
  }, [fimDaAnimacao, pronta, saida, onTermina]);

  const deslocamentoDoTraco = useMemo(
    () => traco.interpolate({ inputRange: [0, 1], outputRange: [PERIMETRO, 0] }), [traco]);
  // A faísca é um troço curto do contorno que percorre o perímetro uma vez.
  const deslocamentoDaFaisca = useMemo(
    () => faisca.interpolate({ inputRange: [0, 1], outputRange: [0, -PERIMETRO] }), [faisca]);
  const opacidadeDaFaisca = useMemo(
    () => faisca.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }), [faisca]);
  const escalaDoDisco = disco.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });

  // Cada letra começa um pouco depois da anterior; o traço de cada uma "escreve-se" do início ao fim.
  const letras = useMemo(() => NOME.map((letra, i) => {
    const inicio = i * 0.12;
    const progresso = palavra.interpolate({
      inputRange: [inicio, inicio + 0.28], outputRange: [0, 1], extrapolate: 'clamp',
    });
    const x = i * (LARGURA_LETRA + ESPACO);
    return LETRAS[letra].map((t, j) => {
      const comp = comprimento(t);
      return {
        chave: `${i}-${j}`,
        pontos: t.map(([px, py]) => `${(px + x).toFixed(1)},${py.toFixed(1)}`).join(' '),
        comp,
        deslocamento: progresso.interpolate({ inputRange: [0, 1], outputRange: [comp, 0] }),
      };
    });
  }).flat(), [palavra]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[StyleSheet.absoluteFill, styles.fundo, { opacity: saida }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={{ opacity: disco, transform: [{ scale: escalaDoDisco }] }}>
        <View style={{ width: lado, height: lado }}>
          <Svg width={lado} height={lado} viewBox="0 0 1000 1000">
            <Defs>
              <RadialGradient id="disco" cx="0.4" cy="0.35" r="0.75">
                <Stop offset="0" stopColor="#962838" />
                <Stop offset="1" stopColor="#701a29" />
              </RadialGradient>
              <LinearGradient id="ouro" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#f0d682" />
                <Stop offset="1" stopColor="#c49a3a" />
              </LinearGradient>
            </Defs>
            <Circle cx="500" cy="500" r="500" fill="url(#disco)" />
            <AnimatedPolygon
              points={PONTOS_SVG}
              fill="none"
              stroke="url(#ouro)"
              strokeWidth={FIO}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={[PERIMETRO, PERIMETRO]}
              strokeDashoffset={deslocamentoDoTraco}
            />
            <AnimatedPolygon
              points={PONTOS_SVG}
              fill="none"
              stroke="#fff6d6"
              strokeWidth={FIO * 0.55}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={[PERIMETRO * 0.09, PERIMETRO * 0.91]}
              strokeDashoffset={deslocamentoDaFaisca}
              opacity={opacidadeDaFaisca}
            />
          </Svg>
        </View>
      </Animated.View>

      <View style={{ marginTop: lado * 0.1, width: larguraNome, height: alturaNome }}>
        <Svg
          width={larguraNome}
          height={alturaNome}
          viewBox={`${-FIO_NOME} ${-FIO_NOME} ${LARGURA_NOME + 2 * FIO_NOME} ${100 + 2 * FIO_NOME}`}
        >
          <Defs>
            {/* Em unidades do utilizador: os traços horizontais (T, A) não têm altura própria para um gradiente normal. */}
            <LinearGradient id="ouroNome" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
              <Stop offset="0" stopColor="#f0d682" />
              <Stop offset="1" stopColor="#c49a3a" />
            </LinearGradient>
          </Defs>
          {letras.map(l => (
            <AnimatedPolyline
              key={l.chave}
              points={l.pontos}
              fill="none"
              stroke="url(#ouroNome)"
              strokeWidth={FIO_NOME}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={[l.comp, l.comp]}
              strokeDashoffset={l.deslocamento}
            />
          ))}
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fundo: { backgroundColor: FUNDO, alignItems: 'center', justifyContent: 'center', zIndex: 1000, elevation: 1000 },
});
