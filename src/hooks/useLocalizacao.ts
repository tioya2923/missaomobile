import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { Coordenadas } from '../api/loja';

export type EstadoLocalizacao = 'a-pedir' | 'concedida' | 'negada' | 'indisponivel';

// Pede a localização aproximada do utilizador (simples lat/lng, sem mapas nem
// serviços pagos) para permitir ordenar lojas e artigos por distância. Se a
// permissão for negada ou o dispositivo não a suportar, a app continua a
// funcionar normalmente, apenas sem ordenação por proximidade.
export function useLocalizacao() {
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [estado, setEstado] = useState<EstadoLocalizacao>('a-pedir');

  const pedir = useCallback(async () => {
    setEstado('a-pedir');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setEstado('negada');
        setCoords(null);
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: posicao.coords.latitude, lng: posicao.coords.longitude });
      setEstado('concedida');
    } catch {
      setEstado('indisponivel');
      setCoords(null);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- pedido inicial de localização
    pedir();
  }, [pedir]);

  return { coords, estado, pedir };
}
