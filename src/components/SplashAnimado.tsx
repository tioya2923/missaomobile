import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polygon, RadialGradient, Stop } from 'react-native-svg';

// Animação de abertura: o disco bordô aparece, o N desenha-se em fio dourado, uma faísca percorre o
// contorno e o ecrã desvanece-se para a app. Corre por cima da app enquanto esta carrega, por isso
// não atrasa o arranque além de ~1,8 s (e a animação só termina quando a app já está pronta).
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

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface Props {
  /** A app já carregou (letras e tema): só então a animação se desvanece. */
  pronta: boolean;
  onTermina: () => void;
}

export default function SplashAnimado({ pronta, onTermina }: Props) {
  const { width, height } = useWindowDimensions();
  const lado = Math.min(Math.min(width, height) * 0.72, 380);

  const disco = useRef(new Animated.Value(0)).current;
  const traco = useRef(new Animated.Value(0)).current;
  const faisca = useRef(new Animated.Value(0)).current;
  const saida = useRef(new Animated.Value(1)).current;
  const [fimDaAnimacao, setFimDaAnimacao] = useState(false);

  useEffect(() => {
    let cancelado = false;
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then(reduzir => {
      if (cancelado) return;
      if (reduzir) {
        disco.setValue(1); traco.setValue(1);
        setTimeout(() => !cancelado && setFimDaAnimacao(true), 300);
        return;
      }
      Animated.sequence([
        Animated.parallel([
          Animated.timing(disco, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(traco, { toValue: 1, duration: 1100, delay: 150, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        ]),
        Animated.timing(faisca, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]).start(() => !cancelado && setFimDaAnimacao(true));
    });
    return () => { cancelado = true; };
  }, [disco, traco, faisca]);

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
  const respirar = faisca.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.035, 1] });

  return (
    <Animated.View
      pointerEvents="auto"
      style={[StyleSheet.absoluteFill, styles.fundo, { opacity: saida }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={{ opacity: disco, transform: [{ scale: Animated.multiply(escalaDoDisco, respirar) }] }}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fundo: { backgroundColor: FUNDO, alignItems: 'center', justifyContent: 'center', zIndex: 1000, elevation: 1000 },
});
