import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { labelMetodoPagamento, iconeMetodoPagamento } from '../../constants/metodosPagamento';
import { formatarPreco } from '../../constants/moeda';
import { COLORS, FONTS } from '../../constants/theme';
import type { MaisScreenProps } from '../../navigation/types';

// Indicativo internacional por país (derivado da moeda da loja) — sem isto, o
// número era sempre tratado como angolano, o que gerava um link errado do
// WhatsApp para lojas em Portugal, Brasil, Moçambique ou Cabo Verde.
const INDICATIVO_POR_MOEDA: Record<string, string> = {
  AOA: '244', EUR: '351', BRL: '55', MZN: '258', CVE: '238',
};

// Normaliza um número de telefone para o formato internacional que o WhatsApp
// espera (sem "+", com o indicativo do país à frente).
function paraFormatoWhatsApp(telefone: string, moeda: string): string {
  const digitos = telefone.replace(/\D/g, '');
  const indicativo = INDICATIVO_POR_MOEDA[moeda];
  if (!indicativo || digitos.startsWith(indicativo)) return digitos;
  return `${indicativo}${digitos}`;
}

export default function LojaConfirmacaoScreen({ route, navigation }: MaisScreenProps<'LojaConfirmacao'>) {
  const { encomendas } = route.params;
  const [copiadoChave, setCopiadoChave] = useState<string | null>(null);

  // As lojas do carrinho podem vender em moedas diferentes — soma-se por moeda,
  // nunca todas juntas como se fossem a mesma unidade.
  const totaisPorMoeda = encomendas.reduce<Record<string, number>>((acc, e) => {
    acc[e.moeda] = (acc[e.moeda] ?? 0) + e.total;
    return acc;
  }, {});
  const totalTexto = Object.entries(totaisPorMoeda)
    .map(([moeda, valor]) => formatarPreco(valor, moeda))
    .join(' + ');

  const copiar = async (chave: string, valor: string) => {
    await Clipboard.setStringAsync(valor);
    setCopiadoChave(chave);
    setTimeout(() => setCopiadoChave(c => (c === chave ? null : c)), 2000);
  };

  const enviarPorWhatsApp = (telefone: string, id: number, total: number, moeda: string) => {
    const numero = paraFormatoWhatsApp(telefone, moeda);
    const texto = encodeURIComponent(
      `Olá! Aqui está o comprovativo de pagamento da encomenda #${id} (Total: ${formatarPreco(total, moeda)}).`
    );
    Linking.openURL(`https://wa.me/${numero}?text=${texto}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.primary} />
        <Text style={styles.heroTitulo}>
          {encomendas.length > 1 ? 'Encomendas recebidas!' : 'Encomenda recebida!'}
        </Text>
        <Text style={styles.heroTexto}>
          {encomendas.length > 1
            ? `O seu pedido foi dividido em ${encomendas.length} encomendas, uma por cada loja.\n`
            : ''}
          Total a pagar: <Text style={{ fontWeight: '700' }}>{totalTexto}</Text>
        </Text>
      </View>

      {encomendas.map(enc => (
        <View key={enc.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="storefront-outline" size={16} color={COLORS.primary} />
            <Text style={styles.cardTitulo}>{enc.lojaNome}</Text>
          </View>
          <Text style={styles.cardTexto}>
            Referência: <Text style={{ fontWeight: '700' }}>#{enc.id}</Text>{'  ·  '}
            Total: <Text style={{ fontWeight: '700' }}>{formatarPreco(enc.total, enc.moeda)}</Text>
          </Text>
          <View style={styles.separator} />

          {enc.itens.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemTxt}>{item.quantidade}× {item.produtoNome}</Text>
              <Text style={styles.itemValor}>{formatarPreco(item.precoUnitario * item.quantidade, enc.moeda)}</Text>
            </View>
          ))}

          <View style={styles.separator} />

          <Text style={styles.pagamentoTitulo}>Como pagar a esta loja</Text>
          {enc.formasPagamento.length > 0 ? (
            enc.formasPagamento.map((f) => {
              const chave = `${enc.id}-${f.metodo}`;
              return (
                <View key={chave} style={styles.metodo}>
                  <Ionicons name={iconeMetodoPagamento(f.metodo) as never} size={18} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metodoLabel}>{labelMetodoPagamento(f.metodo)}</Text>
                    {f.detalhe ? <Text style={styles.metodoValor}>{f.detalhe}</Text> : null}
                  </View>
                  {f.detalhe ? (
                    <TouchableOpacity
                      style={styles.copiarBtn}
                      onPress={() => copiar(chave, f.detalhe ?? '')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={copiadoChave === chave ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
                      <Text style={styles.copiarTxt}>{copiadoChave === chave ? 'Copiado' : 'Copiar'}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })
          ) : (
            <Text style={styles.emBreve}>Esta loja ainda não indicou formas de pagamento. Contacte-a diretamente.</Text>
          )}
          {enc.infoPagamento ? (
            <Text style={styles.infoAdicional}>{enc.infoPagamento}</Text>
          ) : null}

          <View style={styles.separator} />

          <Text style={styles.pagamentoTitulo}>Depois de pagar</Text>
          {enc.lojaTelefone ? (
            <>
              <TouchableOpacity
                style={styles.comprovativoBtn}
                onPress={() => enviarPorWhatsApp(enc.lojaTelefone as string, enc.id, enc.total, enc.moeda)}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.comprovativoBtnTxt}>Enviar comprovativo por WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ligarBtn}
                onPress={() => Linking.openURL(`tel:${enc.lojaTelefone}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={15} color={COLORS.primary} />
                <Text style={styles.ligarBtnTxt}>Ligar à loja</Text>
              </TouchableOpacity>
              <Text style={styles.aviso}>
                Mencione a referência #{enc.id} para a loja confirmar a sua encomenda.
              </Text>
            </>
          ) : (
            <Text style={styles.aviso}>
              Esta loja ainda não indicou um contacto direto. Envie o comprovativo com a referência #{enc.id}
              através do Contacto na app.
            </Text>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={styles.btnVoltar}
        onPress={() => navigation.navigate('Loja')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnVoltarTxt}>Voltar à loja</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: COLORS.background },

  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroTitulo: { fontSize: 19, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  heroTexto: { fontSize: 14.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, textAlign: 'center', lineHeight: 22 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitulo: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONTS.serif },
  cardTexto: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 6 },
  separator: { height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 4 },
  emBreve: { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', paddingVertical: 6 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  itemTxt: { fontSize: 13.5, color: COLORS.text, fontFamily: FONTS.serif, flex: 1, marginRight: 8 },
  itemValor: { fontSize: 13.5, color: COLORS.textSecondary, fontFamily: FONTS.serif },

  pagamentoTitulo: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary, fontFamily: FONTS.serif, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  metodo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  metodoLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONTS.serif },
  metodoValor: { fontSize: 13, color: COLORS.textSecondary, fontFamily: FONTS.serif, marginTop: 2 },
  infoAdicional: { fontSize: 12.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', marginTop: 10, lineHeight: 18 },

  copiarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.navbar, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 12 },
  copiarTxt: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: FONTS.serif },

  comprovativoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 12, marginTop: 4,
  },
  comprovativoBtnTxt: { color: '#fff', fontWeight: '700', fontFamily: FONTS.serif, fontSize: 14 },
  ligarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: 14, paddingVertical: 10, marginTop: 8,
  },
  ligarBtnTxt: { color: COLORS.primary, fontWeight: '700', fontFamily: FONTS.serif, fontSize: 13.5 },

  aviso: { fontSize: 11.5, color: COLORS.textSecondary, fontFamily: FONTS.serif, fontStyle: 'italic', marginTop: 10, lineHeight: 17 },

  btnVoltar: { borderWidth: 1, borderColor: COLORS.borderDark, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  btnVoltarTxt: { color: COLORS.text, fontWeight: '700', fontFamily: FONTS.serif, fontSize: 15 },
});
