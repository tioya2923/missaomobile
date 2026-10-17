import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Text from '../components/AppText';
import { FONTS, type Palette } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

export default function PrivacidadeScreen() {
  const styles = useThemedStyles(createStyles);
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        style={styles.botaoEliminar}
        onPress={() => Linking.openURL('https://ndatava.onrender.com/eliminar-conta')}
        activeOpacity={0.8}
      >
        <Text style={styles.botaoEliminarTxt}>Pedir eliminação da conta e dos dados</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.titulo}>Política de Privacidade</Text>
        <Text style={styles.data}>Última atualização: 17 de outubro de 2026</Text>
        <View style={styles.separator} />

        <Text style={styles.texto}>
          Esta política explica que dados a aplicação e o site <Text style={styles.bold}>Ndatava</Text> ("nós", "a
          aplicação") recolhem, para que servem, e como pode aceder-lhes ou pedir a sua eliminação. Ao usar a
          Ndatava, aceita esta política.{'\n\n'}

          <Text style={styles.subtitulo}>1. Que dados recolhemos{'\n'}</Text>
          <Text style={styles.bold}>Conta e perfil:</Text> nome, email e palavra-passe (guardada de forma cifrada,
          nunca em texto simples), e, se preencher, fotografia de perfil, datas de sacramentos (nascimento,
          batismo, primeira comunhão, crisma, casamento, ordem), diocese e paróquia.{'\n\n'}
          <Text style={styles.bold}>Localização:</Text> se autorizar, usamos a localização aproximada ou exata do
          dispositivo apenas para mostrar lojas e artigos mais próximos de si. Não é guardada nem partilhada — é
          usada no momento do pedido.{'\n\n'}
          <Text style={styles.bold}>Biometria (impressão digital / Face ID):</Text> usada apenas para desbloquear a
          aplicação no seu próprio dispositivo. Nunca sai do telemóvel nem chega aos nossos servidores.{'\n\n'}
          <Text style={styles.bold}>Microfone e voz (opcional):</Text> nos programas de cânticos da Missa pode gravar
          a sua voz e/ou converter a sua voz em texto. As gravações e os programas ficam guardados no seu
          telemóvel e só são enviados para os nossos servidores se você os partilhar com outra pessoa (ver «Partilha de cânticos»). A conversão de voz em texto usa o serviço de
          reconhecimento de voz do próprio sistema (Google ou Apple), que pode processar o áudio nos servidores deles,
          segundo as respetivas políticas. Só é usada quando você o pede, e pode retirar a permissão do microfone a
          qualquer momento nas definições do telemóvel.{'\n\n'}
          <Text style={styles.bold}>Partilha de cânticos (opcional):</Text> para enviar cânticos a outras pessoas
          dentro da app pode criar uma conta com nome, email e palavra-passe (guardada de forma cifrada). Cada conta
          tem um código pessoal e pode ser encontrada por outras pessoas pelo nome (e pela paróquia, se a indicar); quem
          desligar «Aparecer nas pesquisas» só é encontrado pelo código. Para ser contacto é preciso aceitar o pedido, e o
          email nunca é mostrado a outras pessoas. Só quem tem o seu código ou é seu contacto lhe pode enviar cânticos. Quando partilha um cântico,
          guardamos nos nossos servidores o título, a letra, a gravação de voz (se a incluir) e o seu nome, para que
          as pessoas escolhidas o recebam. Cada destinatário pode apagar, denunciar ou bloquear. Os cânticos
          denunciados são analisados pela nossa equipa. Ao eliminar a conta, apagamos o seu nome, email, código, contactos e
          todos os cânticos enviados e recebidos. Sem criar conta, nada disto é enviado.{'\n\n'}
          <Text style={styles.bold}>Fotografias:</Text> se optar por carregar uma foto de perfil, ou se for dono de
          uma loja parceira e carregar fotos de produtos, essas imagens ficam guardadas nos nossos servidores.{'\n\n'}
          <Text style={styles.bold}>Marketplace:</Text> se comprar através da Ndatava, guardamos os dados da
          encomenda (produtos, valores, contacto) para que a loja parceira a possa preparar e entregar. Se for
          dono de uma loja, guardamos os dados da loja e dos produtos que publica.{'\n\n'}

          <Text style={styles.subtitulo}>2. Para que usamos os dados{'\n'}</Text>
          Para criar e gerir a sua conta, mostrar-lhe conteúdo relevante (lojas próximas, por exemplo), processar
          encomendas na loja, e manter a aplicação a funcionar em segurança. Não usamos os seus dados para
          publicidade, nem os vendemos a terceiros.{'\n\n'}

          <Text style={styles.subtitulo}>3. Com quem partilhamos dados{'\n'}</Text>
          Os dados de uma encomenda (nome, contacto, artigos pedidos) são partilhados apenas com a loja parceira à
          qual fez a encomenda, para que a possa preparar. Não partilhamos os seus dados com mais ninguém, exceto
          se exigido por lei.{'\n\n'}

          <Text style={styles.subtitulo}>4. Onde ficam guardados os dados{'\n'}</Text>
          Os dados ficam numa base de dados alojada por um fornecedor de serviços cloud, com ligação cifrada
          (HTTPS/TLS) entre a aplicação e os nossos servidores.{'\n\n'}

          <Text style={styles.subtitulo}>5. Os seus direitos{'\n'}</Text>
          Pode, a qualquer momento, editar o seu perfil dentro da aplicação, ou pedir-nos a eliminação completa da
          sua conta e dados associados, escrevendo para o email abaixo. Respondemos em até 30 dias.{'\n\n'}

          <Text style={styles.subtitulo}>6. Crianças{'\n'}</Text>
          A Ndatava não se dirige especificamente a crianças menores de 13 anos e não recolhe intencionalmente
          dados de crianças nessa faixa etária.{'\n\n'}

          <Text style={styles.subtitulo}>7. Alterações a esta política{'\n'}</Text>
          Podemos atualizar esta política ocasionalmente. A data no topo deste ecrã indica a versão mais
          recente.{'\n\n'}

          <Text style={styles.subtitulo}>8. Contacto{'\n'}</Text>
          Para questões sobre privacidade ou para pedir a eliminação dos seus dados, escreva para{' '}
          <Text style={styles.bold}>ndatava3@gmail.com</Text>.
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: { padding: 16, backgroundColor: COLORS.background },
  botaoEliminar: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoEliminarTxt: {
    color: COLORS.error,
    fontWeight: '700',
    fontFamily: FONTS.sans,
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  titulo: {
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.sans,
    textAlign: 'center',
    lineHeight: 26,
  },
  data: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: FONTS.sans,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.borderDark,
    marginBottom: 16,
  },
  texto: {
    fontSize: 14,
    color: COLORS.text,
    fontFamily: FONTS.sans,
    lineHeight: 22,
    textAlign: 'justify',
  },
  subtitulo: { fontWeight: '700', fontSize: 15 },
  bold: { fontWeight: '700' },
});
