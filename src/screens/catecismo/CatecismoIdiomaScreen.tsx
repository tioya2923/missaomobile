import IdiomaPicker from '../../components/IdiomaPicker';
import type { CatecismoScreenProps } from '../../navigation/types';

type Idioma = 'pt' | 'ub' | 'lat' | 'otc';

const OPCOES = [
  { codigo: 'pt' as Idioma,  nome: 'Português',    sigla: 'PT' },
  { codigo: 'ub' as Idioma,  nome: 'Umbundu',      sigla: 'UMB' },
  { codigo: 'lat' as Idioma, nome: 'Latim',        sigla: 'LAT' },
  { codigo: 'otc' as Idioma, nome: 'Oshikwanhama', sigla: 'OSH' },
];

export default function CatecismoIdiomaScreen({ navigation }: CatecismoScreenProps<'CatecismoIdioma'>) {
  return (
    <IdiomaPicker
      titulo="Catecismo"
      subtitulo="Escolha o idioma"
      opcoes={OPCOES}
      onEscolher={idioma => navigation.navigate('CatecismoTopicos', { idioma })}
    />
  );
}
