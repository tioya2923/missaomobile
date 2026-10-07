import IdiomaPicker from '../../components/IdiomaPicker';
import type { CanticosScreenProps } from '../../navigation/types';

type Idioma = 'pt' | 'ub' | 'lat' | 'kmb' | 'otc';

const OPCOES = [
  { codigo: 'pt' as Idioma,  nome: 'Português',    sigla: 'PT' },
  { codigo: 'ub' as Idioma,  nome: 'Umbundu',      sigla: 'UMB' },
  { codigo: 'lat' as Idioma, nome: 'Latim',        sigla: 'LAT' },
  { codigo: 'kmb' as Idioma, nome: 'Kimbundu',     sigla: 'KMB' },
  { codigo: 'otc' as Idioma, nome: 'Oshikwanhama', sigla: 'OSH' },
];

export default function CanticosIdiomaScreen({ navigation }: CanticosScreenProps<'CanticosIdioma'>) {
  return (
    <IdiomaPicker
      titulo="Cânticos"
      subtitulo="Escolha o idioma"
      opcoes={OPCOES}
      onEscolher={idioma => navigation.navigate('CanticosTopicos', { idioma })}
    />
  );
}
