import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuth from 'expo-local-authentication';
import { useCallback, useEffect, useRef, useState, RefObject } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../constants/theme';
import LogoLob from '../components/LogoLob';
import MinhasActividadesScreen from './MinhasActividadesScreen';

const STORAGE_KEY  = '@lombembwa_perfil';
const SECURITY_KEY = '@lombembwa_seguranca';
const PIN_LEN      = 4;

type DataCampo     = { dia: string; mes: string; ano: string };
type CampoData     = 'nascimento' | 'baptismo' | 'comunhao' | 'crisma' | 'casamento' | 'ordem';
type CampoTexto    = 'diocese' | 'paroquia' | 'centroMissionario' | 'catequese';
type CampoAtivo    = 'nome' | CampoData | CampoTexto;
type TipoSeguranca = 'nenhuma' | 'sistema' | 'pin';
type Vista         = 'hub' | 'perfil' | 'actividades';
type Perfil = {
  foto: string; nome: string;
  nascimento: DataCampo; baptismo: DataCampo; comunhao: DataCampo;
  crisma: DataCampo;     casamento: DataCampo; ordem: DataCampo;
  diocese: string; paroquia: string; centroMissionario: string; catequese: string;
};

const dataVazia   = (): DataCampo => ({ dia: '', mes: '', ano: '' });
const perfilVazio = (): Perfil   => ({
  foto: '', nome: '',
  nascimento: dataVazia(), baptismo: dataVazia(), comunhao: dataVazia(),
  crisma: dataVazia(),     casamento: dataVazia(), ordem: dataVazia(),
  diocese: '', paroquia: '', centroMissionario: '', catequese: '',
});

const CAMPOS: { chave: CampoData; label: string }[] = [
  { chave: 'nascimento', label: 'Nascimento' },
  { chave: 'baptismo',   label: 'Baptismo' },
  { chave: 'comunhao',   label: 'Comunhão' },
  { chave: 'crisma',     label: 'Crisma' },
  { chave: 'casamento',  label: 'Casamento' },
  { chave: 'ordem',      label: 'Sacramento da Ordem' },
];

function formatarData(d: DataCampo): string {
  if (!d.dia && !d.mes && !d.ano) return '—';
  return `${d.dia.padStart(2,'0')||'__'} / ${d.mes.padStart(2,'0')||'__'} / ${d.ano||'____'}`;
}

function validarData(d: DataCampo, label: string): string | null {
  if (!d.dia && !d.mes && !d.ano) return null;
  if (!d.dia || !d.mes || !d.ano) return `${label}: preencha o dia, o mês e o ano.`;
  const dia = +d.dia, mes = +d.mes, ano = +d.ano;
  if (!dia || dia > 31)  return `${label}: dia "${d.dia}" inválido (01–31).`;
  if (!mes || mes > 12)  return `${label}: mês "${d.mes}" inválido (01–12).`;
  const y = new Date().getFullYear();
  if (ano < 1900 || ano > y + 1) return `${label}: ano "${d.ano}" inválido (1900–${y}).`;
  const dt = new Date(ano, mes - 1, dia);
  if (dt.getDate() !== dia || dt.getMonth() !== mes - 1 || dt.getFullYear() !== ano)
    return `${label}: ${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')} não existe.`;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function EuScreen() {

  /* ── perfil ── */
  const [perfil,    setPerfil]    = useState<Perfil>(perfilVazio());
  const [rascunho,  setRascunho]  = useState<Perfil>(perfilVazio());
  const [editando,  setEditando]  = useState(false);
  const [campAtivo, setCampAtivo] = useState<CampoAtivo | null>(null);

  /* ── navegação interna ── */
  const [vista, setVista] = useState<Vista>('hub');

  /* ── segurança ── */
  const [tipoSeg,      setTipoSeg]      = useState<TipoSeguranca>('nenhuma');
  const [pinGuardado,  setPinGuardado]  = useState('');
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [carregado,    setCarregado]    = useState(false);
  const [tiposAuth,    setTiposAuth]    = useState<LocalAuth.AuthenticationType[]>([]);

  /* ── ecrã de bloqueio ── */
  const [pinInput, setPinInput] = useState('');
  const [pinErro,  setPinErro]  = useState('');

  /* ── configuração de PIN ── */
  const [setupPin,   setSetupPin]   = useState(false);
  const [setupPasso, setSetupPasso] = useState<1|2>(1);
  const [setupPin1,  setSetupPin1]  = useState('');
  const [setupInput, setSetupInput] = useState('');

  /* ── refs ── */
  const scrollRef    = useRef<ScrollView>(null);
  const fieldY       = useRef<Partial<Record<string, number>>>({});
  const tipoRef      = useRef<TipoSeguranca>('nenhuma');
  const desblRef     = useRef(false);
  const carregadoRef = useRef(false);
  const pinRef       = useRef('');
  const authFnRef    = useRef<() => Promise<void>>(async () => {});

  const mesRefs: Record<CampoData, RefObject<TextInput|null>> = {
    nascimento: useRef(null), baptismo: useRef(null), comunhao: useRef(null),
    crisma: useRef(null),     casamento: useRef(null), ordem: useRef(null),
  };
  const anoRefs: Record<CampoData, RefObject<TextInput|null>> = {
    nascimento: useRef(null), baptismo: useRef(null), comunhao: useRef(null),
    crisma: useRef(null),     casamento: useRef(null), ordem: useRef(null),
  };

  /* ── sincronizar refs com state ── */
  useEffect(() => { tipoRef.current  = tipoSeg;      }, [tipoSeg]);
  useEffect(() => { desblRef.current = desbloqueado; }, [desbloqueado]);
  useEffect(() => { pinRef.current   = pinGuardado;  }, [pinGuardado]);

  /* ── autenticação pelo sistema ── */
  const autenticarComSistema = async () => {
    try {
      const res = await LocalAuth.authenticateAsync({
        promptMessage:         "Aceder ao seu perfil L'Ombembwa",
        fallbackLabel:         'Usar código do telemóvel',
        disableDeviceFallback: false,
        cancelLabel:           'Cancelar',
      });
      if (res.success) {
        setDesbloqueado(true); desblRef.current = true;
        setPinErro('');
      } else {
        setPinErro('Autenticação cancelada. Toque em Desbloquear.');
      }
    } catch {
      setPinErro('Erro na autenticação. Tente novamente.');
    }
  };
  authFnRef.current = autenticarComSistema;

  /* ── carregar tipos de autenticação disponíveis ── */
  useEffect(() => {
    LocalAuth.supportedAuthenticationTypesAsync()
      .then(setTiposAuth)
      .catch(() => {});
  }, []);

  /* ── carregar dados locais ── */
  useEffect(() => {
    AsyncStorage.multiGet([STORAGE_KEY, SECURITY_KEY]).then(([[, rP], [, rS]]) => {
      if (rP) { try { setPerfil(JSON.parse(rP)); } catch {} }

      let tipo: TipoSeguranca = 'nenhuma', pin = '';
      if (rS) {
        try { const s = JSON.parse(rS); tipo = s.tipo ?? 'nenhuma'; pin = s.pin ?? ''; } catch {}
      }

      setTipoSeg(tipo);    tipoRef.current      = tipo;
      setPinGuardado(pin); pinRef.current        = pin;
      setCarregado(true);  carregadoRef.current  = true;

      if (tipo === 'nenhuma') { setDesbloqueado(true); desblRef.current = true; }
      else if (tipo === 'sistema') { setTimeout(() => authFnRef.current(), 400); }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── bloquear ao sair / desbloquear ao entrar ── */
  useFocusEffect(
    useCallback(() => {
      if (carregadoRef.current && tipoRef.current === 'sistema' && !desblRef.current) {
        setTimeout(() => authFnRef.current(), 300);
      }
      return () => {
        if (tipoRef.current !== 'nenhuma') {
          setDesbloqueado(false); desblRef.current = false;
          setPinInput(''); setPinErro(''); setSetupPin(false);
        }
        setVista('hub');
      };
    }, []),
  );

  /* ── scroll para campo activo ── */
  useEffect(() => {
    if (!campAtivo) return;
    const id = setTimeout(() => {
      const y = fieldY.current[campAtivo];
      if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y - 100), animated: true });
    }, 320);
    return () => clearTimeout(id);
  }, [campAtivo]);

  /* ── PIN de entrada ── */
  const verificarPin = (valor: string) => {
    if (valor === pinRef.current) {
      setDesbloqueado(true); desblRef.current = true;
      setPinInput(''); setPinErro('');
    } else {
      setPinErro('PIN incorrecta. Tente novamente.');
      setPinInput('');
    }
  };

  /* ── numpad ── */
  const addDigito = (d: string, v: string, set: (x:string)=>void, onDone?: (x:string)=>void) => {
    if (v.length >= PIN_LEN) return;
    const n = v + d; set(n);
    if (n.length === PIN_LEN && onDone) setTimeout(() => onDone(n), 150);
  };
  const delDigito = (v: string, set: (x:string)=>void) => set(v.slice(0,-1));

  /* ── guardar segurança ── */
  const salvarSeguranca = async (tipo: TipoSeguranca, pin?: string) => {
    const obj: Record<string,string> = { tipo };
    if (pin) obj.pin = pin;
    await AsyncStorage.setItem(SECURITY_KEY, JSON.stringify(obj));
    setTipoSeg(tipo);         tipoRef.current = tipo;
    setPinGuardado(pin ?? ''); pinRef.current  = pin ?? '';
  };

  const escolherNenhuma = () =>
    Alert.alert('Remover protecção', 'Pretende remover a protecção do perfil?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: () => salvarSeguranca('nenhuma') },
    ]);

  const escolherSistema = async () => {
    try {
      const nivel = await LocalAuth.getEnrolledLevelAsync();
      if (nivel === LocalAuth.SecurityLevel.NONE) {
        Alert.alert('Sem bloqueio configurado', 'Configure um PIN, padrão ou biometria nas definições do seu telemóvel antes de activar esta opção.');
        return;
      }
    } catch { /* prossegue */ }
    await salvarSeguranca('sistema');
    Alert.alert('Protecção activada', 'Na próxima visita, poderá usar o rosto, a biometria ou o PIN do dispositivo para desbloquear o seu perfil.');
  };

  const iniciarSetupPin  = () => { setSetupPin(true); setSetupPasso(1); setSetupPin1(''); setSetupInput(''); };
  const cancelarSetupPin = () => { setSetupPin(false); setSetupInput(''); setSetupPin1(''); };

  const handleSetupCompleto = async (valor: string) => {
    if (setupPasso === 1) {
      setSetupPin1(valor); setSetupPasso(2); setSetupInput('');
    } else if (valor === setupPin1) {
      await salvarSeguranca('pin', valor);
      setSetupPin(false);
      Alert.alert('PIN definida', 'Na próxima visita ao perfil, será pedida a sua PIN.');
    } else {
      Alert.alert('PINs diferentes', 'Os PINs introduzidos não coincidem.', [{
        text: 'Tentar novamente', onPress: () => { setSetupPasso(1); setSetupPin1(''); setSetupInput(''); },
      }]);
    }
  };

  /* ── foto ── */
  const pickFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.85 });
    if (result.canceled) return;
    const at = { ...perfil, foto: result.assets[0].uri };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(at));
    setPerfil(at);
  };

  /* ── edição total ── */
  const iniciarEdicao  = () => { setCampAtivo(null); setRascunho({...perfil}); setEditando(true); };
  const cancelarEdicao = () => setEditando(false);
  const guardarTudo    = async () => {
    for (const {chave, label} of CAMPOS) {
      const e = validarData(rascunho[chave] as DataCampo, label);
      if (e) { Alert.alert('Data inválida', e); return; }
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rascunho));
    setPerfil(rascunho); setEditando(false);
  };

  /* ── edição inline ── */
  const iniciarCampo  = (c: CampoAtivo) => { setRascunho({...perfil}); setCampAtivo(c); };
  const cancelarCampo = () => setCampAtivo(null);
  const guardarCampo  = async () => {
    if (!campAtivo) return;
    const campoData = CAMPOS.find(c => c.chave === campAtivo);
    if (campoData) {
      const e = validarData(rascunho[campAtivo] as DataCampo, campoData.label);
      if (e) { Alert.alert('Data inválida', e); return; }
    }
    const at = {...perfil, [campAtivo]: rascunho[campAtivo]};
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(at));
    setPerfil(at); setCampAtivo(null);
  };

  const CAMPOS_TEXTO: { chave: CampoTexto; label: string; placeholder: string }[] = [
    { chave: 'diocese',           label: 'Diocese',           placeholder: 'Nome da Diocese' },
    { chave: 'paroquia',          label: 'Paróquia',          placeholder: 'Nome da Paróquia' },
    { chave: 'centroMissionario', label: 'Centro Missionário',placeholder: 'Nome do Centro Missionário' },
    { chave: 'catequese',         label: 'Catequese',         placeholder: 'Nome da Catequese' },
  ];

  const setNome   = (v:string) => setRascunho(r=>({...r, nome: v}));
  const setTexto  = (ch:CampoTexto, v:string) => setRascunho(r=>({...r, [ch]: v}));
  const setParte  = (ch:CampoData, p:keyof DataCampo, v:string) =>
    setRascunho(r=>({...r,[ch]:{...(r[ch] as DataCampo),[p]:v}}));

  const campoEdit    = (c:CampoAtivo) => editando || campAtivo===c;
  const botoesInline = (c:CampoAtivo) => !editando && campAtivo===c ? (
    <View style={styles.inlineAcoes}>
      <TouchableOpacity onPress={cancelarCampo} style={styles.inlineCancelar} activeOpacity={0.7}>
        <Text style={styles.inlineCancelarTxt}>Cancelar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={guardarCampo} style={styles.inlineGuardar} activeOpacity={0.7}>
        <Text style={styles.inlineGuardarTxt}>Guardar</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  /* ── componentes de PIN ── */
  const PinDots = ({valor}:{valor:string}) => (
    <View style={styles.pinDots}>
      {Array.from({length: PIN_LEN}).map((_,i)=>(
        <View key={i} style={[styles.pinDot, i<valor.length && styles.pinDotOn]}/>
      ))}
    </View>
  );

  const Numpad = ({valor,set,onDone}:{valor:string;set:(v:string)=>void;onDone?:(v:string)=>void}) => (
    <View style={styles.numpad}>
      {['1','2','3','4','5','6','7','8','9'].map(d=>(
        <TouchableOpacity key={d} style={styles.numBtn} onPress={()=>addDigito(d,valor,set,onDone)} activeOpacity={0.5}>
          <Text style={styles.numTxt}>{d}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.numBtn}/>
      <TouchableOpacity style={styles.numBtn} onPress={()=>addDigito('0',valor,set,onDone)} activeOpacity={0.5}>
        <Text style={styles.numTxt}>0</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.numBtn} onPress={()=>delDigito(valor,set)} activeOpacity={0.5}>
        <Ionicons name="backspace-outline" size={26} color={COLORS.text}/>
      </TouchableOpacity>
    </View>
  );

  const letra = perfil.nome.trim() ? perfil.nome.trim()[0].toUpperCase() : '';
  const temRosto   = tiposAuth.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION);
  const temDigital = tiposAuth.includes(LocalAuth.AuthenticationType.FINGERPRINT);
  const iconeAuth  = temRosto ? 'scan-outline' : temDigital ? 'finger-print' : 'lock-open-outline';

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */

  // 1. A carregar
  if (!carregado) return <View style={styles.lockScreen}/>;

  // 2. Ecrã de bloqueio
  if (!desbloqueado) return (
    <View style={styles.lockScreen}>
      <LogoLob variant="lockscreen" />
      <Ionicons name="lock-closed-outline" size={52} color={COLORS.textSecondary} style={{marginBottom:28}}/>

      {tipoSeg === 'pin' ? (
        <>
          <Text style={styles.lockLabel}>Introduza o seu PIN</Text>
          <PinDots valor={pinInput}/>
          <Text style={styles.pinErro}>{pinErro||' '}</Text>
          <Numpad valor={pinInput} set={setPinInput} onDone={verificarPin}/>
        </>
      ) : (
        <>
          <Text style={styles.lockLabel}>O seu perfil está protegido</Text>
          <Text style={styles.pinErro}>{pinErro||' '}</Text>
          <TouchableOpacity style={styles.lockBtn} onPress={autenticarComSistema} activeOpacity={0.8}>
            <Ionicons name={iconeAuth} size={22} color="#fff"/>
            <Text style={styles.lockBtnTxt}>Desbloquear</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // 3. Configurar PIN
  if (setupPin) return (
    <View style={styles.lockScreen}>
      <LogoLob variant="lockscreen" />
      <Text style={styles.lockLabel}>
        {setupPasso===1 ? 'Defina um novo PIN (4 dígitos)' : 'Confirme o novo PIN'}
      </Text>
      <PinDots valor={setupInput}/>
      <View style={{height:16}}/>
      <Numpad valor={setupInput} set={setSetupInput} onDone={handleSetupCompleto}/>
      <TouchableOpacity onPress={cancelarSetupPin} style={styles.lockCancelar} activeOpacity={0.7}>
        <Text style={styles.lockCancelarTxt}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  // 4. Hub
  if (vista === 'hub') return (
    <ScrollView contentContainerStyle={styles.hubContainer} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.hubAvatarWrap}>
        <TouchableOpacity onPress={pickFoto} activeOpacity={0.85}>
          {perfil.foto
            ? <Image source={{uri:perfil.foto}} style={styles.hubFoto}/>
            : <View style={styles.hubAvatar}><Text style={styles.hubLetra}>{letra}</Text></View>
          }
          <View style={styles.hubCameraOverlay}>
            <Ionicons name="camera" size={14} color="#fff"/>
          </View>
        </TouchableOpacity>
      </View>

      {/* Nome */}
      <Text style={styles.hubNome} numberOfLines={2}>
        {perfil.nome.trim() || "L'Ombembwa"}
      </Text>

      {/* Opções */}
      <View style={styles.hubOpcoes}>
        <TouchableOpacity style={styles.hubCard} onPress={()=>setVista('perfil')} activeOpacity={0.8}>
          <View style={styles.hubIcone}>
            <Ionicons name="person-outline" size={26} color={COLORS.navbar}/>
          </View>
          <Text style={styles.hubCardTxt}>O Meu Perfil</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary}/>
        </TouchableOpacity>

        <TouchableOpacity style={styles.hubCard} onPress={()=>setVista('actividades')} activeOpacity={0.8}>
          <View style={styles.hubIcone}>
            <Ionicons name="list-outline" size={26} color={COLORS.navbar}/>
          </View>
          <Text style={styles.hubCardTxt}>As Minhas Actividades</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary}/>
        </TouchableOpacity>
      </View>

      {/* Segurança */}
      <View style={[styles.card, styles.hubSegCard]}>
        <View style={[styles.row, styles.sep]}>
          <Text style={styles.label}>SEGURANÇA DO PERFIL</Text>
        </View>

        {([
          {tipo:'nenhuma' as TipoSeguranca, label:'Sem protecção',        desc:''},
          {tipo:'sistema' as TipoSeguranca, label:'Sistema do telemóvel', desc:'Rosto, biometria ou PIN do dispositivo'},
          {tipo:'pin'     as TipoSeguranca, label:'PIN personalizado',    desc: tipoSeg==='pin' ? 'Toque para alterar o PIN' : 'Código de 4 dígitos'},
        ] as const).map(({tipo,label,desc},i,arr)=>(
          <TouchableOpacity key={tipo}
            style={[styles.segOpcao, i<arr.length-1&&styles.sep]}
            onPress={()=>{
              if (tipo==='nenhuma')      escolherNenhuma();
              else if (tipo==='sistema') escolherSistema();
              else                       iniciarSetupPin();
            }}
            activeOpacity={0.7}
          >
            <View style={{flex:1, gap:3}}>
              <Text style={styles.segLabel}>{label}</Text>
              {desc?<Text style={styles.segDesc}>{desc}</Text>:null}
            </View>
            <View style={[styles.radio, tipoSeg===tipo&&styles.radioOn]}>
              {tipoSeg===tipo && <View style={styles.radioPonto}/>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );

  // 5. Actividades
  if (vista === 'actividades') return (
    <MinhasActividadesScreen onVoltar={() => setVista('hub')}/>
  );

  // 6. Perfil
  return (
    <KeyboardAvoidingView
      style={{flex:1}}
      behavior={Platform.OS==='ios'?'padding':'height'}
      keyboardVerticalOffset={Platform.OS==='ios'?0:24}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Botão voltar */}
        <TouchableOpacity style={styles.voltarBtn} onPress={()=>{ setEditando(false); setCampAtivo(null); setVista('hub'); }} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text}/>
          <Text style={styles.voltarTxt}>Voltar</Text>
        </TouchableOpacity>

        {/* Aviso de segurança */}
        {tipoSeg === 'nenhuma' && (
          <View style={styles.avisoWrap}>
            <Ionicons name="shield-outline" size={18} color="#92400e"/>
            <View style={{flex:1, gap:2}}>
              <Text style={styles.avisoTitulo}>Perfil sem protecção</Text>
              <Text style={styles.avisoDesc}>Garanta a segurança do seu perfil</Text>
            </View>
          </View>
        )}

        {/* Avatar */}
        <View style={styles.cabecalho}>
          <TouchableOpacity onPress={pickFoto} activeOpacity={0.85} style={styles.avatarWrap}>
            {perfil.foto
              ? <Image source={{uri:perfil.foto}} style={styles.avatarFoto}/>
              : <View style={styles.avatar}><Text style={styles.avatarLetra}>{letra}</Text></View>
            }
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={14} color="#fff"/>
            </View>
          </TouchableOpacity>
          {!editando && campAtivo!=='nome' && perfil.nome
            ? <Text style={styles.nomeDisplay} numberOfLines={2}>{perfil.nome}</Text>
            : null}
        </View>

        {/* Campos */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, styles.sep]}
            onPress={()=>!editando && iniciarCampo('nome')}
            onLayout={e=>{fieldY.current['nome']=e.nativeEvent.layout.y;}}
            activeOpacity={editando?1:0.6}
          >
            <Text style={styles.label}>Nome</Text>
            {campoEdit('nome') ? (
              <>
                <TextInput style={styles.inputTexto} value={rascunho.nome} onChangeText={setNome}
                  placeholder="Escreva o seu nome" placeholderTextColor={COLORS.textSecondary}
                  autoCapitalize="words" returnKeyType="done" autoFocus={campAtivo==='nome'}/>
                {botoesInline('nome')}
              </>
            ) : (
              <View style={styles.valorRow}>
                <Text style={styles.valor}>{perfil.nome||'—'}</Text>
              </View>
            )}
          </TouchableOpacity>

          {CAMPOS.map(({chave,label},i)=>{
            const dc = campoEdit(chave) ? (rascunho[chave] as DataCampo) : (perfil[chave] as DataCampo);
            return (
              <TouchableOpacity key={chave}
                style={[styles.row, i<CAMPOS.length-1&&styles.sep]}
                onPress={()=>!editando&&iniciarCampo(chave)}
                onLayout={e=>{fieldY.current[chave]=e.nativeEvent.layout.y;}}
                activeOpacity={editando?1:0.6}
              >
                <Text style={styles.label}>{label}</Text>
                {campoEdit(chave) ? (
                  <>
                    <View style={styles.dataRow}>
                      <TextInput style={styles.inputDia} value={dc.dia}
                        onChangeText={v=>{const val=v.replace(/\D/g,'').slice(0,2);setParte(chave,'dia',val);if(val.length===2)mesRefs[chave].current?.focus();}}
                        placeholder="DD" placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric" maxLength={2} returnKeyType="next"
                        autoFocus={campAtivo===chave}
                        onSubmitEditing={()=>mesRefs[chave].current?.focus()}/>
                      <Text style={styles.barra}>/</Text>
                      <TextInput ref={mesRefs[chave]} style={styles.inputMes} value={dc.mes}
                        onChangeText={v=>{const val=v.replace(/\D/g,'').slice(0,2);setParte(chave,'mes',val);if(val.length===2)anoRefs[chave].current?.focus();}}
                        placeholder="MM" placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric" maxLength={2} returnKeyType="next"
                        onSubmitEditing={()=>anoRefs[chave].current?.focus()}/>
                      <Text style={styles.barra}>/</Text>
                      <TextInput ref={anoRefs[chave]} style={styles.inputAno} value={dc.ano}
                        onChangeText={v=>setParte(chave,'ano',v.replace(/\D/g,'').slice(0,4))}
                        placeholder="AAAA" placeholderTextColor={COLORS.textSecondary}
                        keyboardType="numeric" maxLength={4} returnKeyType="done"/>
                    </View>
                    {botoesInline(chave)}
                  </>
                ) : (
                  <View style={styles.valorRow}>
                    <Text style={styles.valor}>{formatarData(dc)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Campos de comunidade */}
        <View style={styles.card}>
          {CAMPOS_TEXTO.map(({chave, label, placeholder}, i) => (
            <TouchableOpacity key={chave}
              style={[styles.row, i < CAMPOS_TEXTO.length - 1 && styles.sep]}
              onPress={() => !editando && iniciarCampo(chave)}
              onLayout={e => { fieldY.current[chave] = e.nativeEvent.layout.y; }}
              activeOpacity={editando ? 1 : 0.6}
            >
              <Text style={styles.label}>{label}</Text>
              {campoEdit(chave) ? (
                <>
                  <TextInput style={styles.inputTexto}
                    value={rascunho[chave] as string}
                    onChangeText={v => setTexto(chave, v)}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="words"
                    returnKeyType="done"
                    autoFocus={campAtivo === chave}/>
                  {botoesInline(chave)}
                </>
              ) : (
                <View style={styles.valorRow}>
                  <Text style={styles.valor}>{(perfil[chave] as string) || '—'}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Botões de edição */}
        {editando ? (
          <View style={styles.botoesRow}>
            <TouchableOpacity style={styles.btnCancelar} onPress={cancelarEdicao} activeOpacity={0.8}>
              <Text style={styles.btnCancelarTxt}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnGuardar} onPress={guardarTudo} activeOpacity={0.8}>
              <Text style={styles.btnGuardarTxt}>Guardar tudo</Text>
            </TouchableOpacity>
          </View>
        ) : campAtivo===null ? (
          <TouchableOpacity style={styles.btnEditar} onPress={iniciarEdicao} activeOpacity={0.8}>
            <Text style={styles.btnEditarTxt}>Editar perfil</Text>
          </TouchableOpacity>
        ) : null}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const AV  = 90;
const HAV = 100;

const styles = StyleSheet.create({
  /* ── Hub ── */
  hubContainer:    {flexGrow:1, alignItems:'center', paddingTop:48, paddingBottom:48, paddingHorizontal:24, backgroundColor:COLORS.background},
  hubAvatarWrap:   {width:HAV, height:HAV, marginBottom:16},
  hubAvatar:       {width:HAV, height:HAV, borderRadius:HAV/2, backgroundColor:COLORS.navbar, alignItems:'center', justifyContent:'center'},
  hubFoto:         {width:HAV, height:HAV, borderRadius:HAV/2},
  hubLetra:        {color:'#fff', fontSize:40, fontWeight:'700', fontFamily:FONTS.serif},
  hubCameraOverlay:{position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:14, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:COLORS.background},
  hubNome:         {fontSize:20, fontWeight:'700', color:COLORS.text, fontFamily:FONTS.serif, textAlign:'center', marginBottom:36},
  hubOpcoes:       {width:'100%', gap:12},
  hubCard:         {flexDirection:'row', alignItems:'center', gap:14, backgroundColor:COLORS.surface, borderRadius:12, paddingVertical:18, paddingHorizontal:18, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8, elevation:2},
  hubIcone:        {width:44, height:44, borderRadius:10, backgroundColor:COLORS.background, alignItems:'center', justifyContent:'center'},
  hubCardTxt:      {flex:1, fontSize:16, fontWeight:'600', color:COLORS.text, fontFamily:FONTS.serif},
  hubSegCard:      {width:'100%', marginTop:12},

  /* ── Voltar (perfil) ── */
  voltarBtn: {flexDirection:'row', alignItems:'center', gap:6, padding:16},
  voltarTxt: {fontSize:15, color:COLORS.text, fontFamily:FONTS.serif, fontWeight:'600'},

  /* ── Bloqueio ── */
  lockScreen:  {flex:1, backgroundColor:COLORS.background, alignItems:'center', justifyContent:'center', paddingHorizontal:32},
  lockLabel:   {fontSize:16, color:COLORS.textSecondary, fontFamily:FONTS.serif, textAlign:'center', marginBottom:24},
  lockBtn:     {flexDirection:'row', alignItems:'center', gap:10, backgroundColor:COLORS.navbar, borderRadius:10, paddingVertical:14, paddingHorizontal:28, marginTop:8},
  lockBtnTxt:  {color:'#fff', fontSize:16, fontWeight:'700', fontFamily:FONTS.serif},
  lockCancelar:    {marginTop:28},
  lockCancelarTxt: {color:COLORS.textSecondary, fontSize:14, fontFamily:FONTS.serif},

  /* ── PIN dots ── */
  pinDots: {flexDirection:'row', gap:18, marginBottom:8},
  pinDot:  {width:16, height:16, borderRadius:8, borderWidth:2, borderColor:COLORS.borderDark, backgroundColor:'transparent'},
  pinDotOn:{backgroundColor:COLORS.text, borderColor:COLORS.text},
  pinErro: {color:COLORS.error, fontFamily:FONTS.serif, fontSize:13, textAlign:'center', minHeight:20, marginBottom:8},

  /* ── Numpad ── */
  numpad: {flexDirection:'row', flexWrap:'wrap', width:240, marginTop:8},
  numBtn: {width:80, height:72, alignItems:'center', justifyContent:'center'},
  numTxt: {fontSize:26, fontFamily:FONTS.serif, color:COLORS.text, fontWeight:'400'},

  /* ── Perfil ── */
  container: {padding:16, paddingBottom:48, backgroundColor:COLORS.background},

  avisoWrap:   {flexDirection:'row', alignItems:'flex-start', gap:10, backgroundColor:'#fef3c7', borderRadius:10, padding:14, marginBottom:16, borderWidth:1, borderColor:'#fde68a'},
  avisoTitulo: {fontSize:14, fontWeight:'700', color:'#92400e', fontFamily:FONTS.serif},
  avisoDesc:   {fontSize:12, color:'#b45309', fontFamily:FONTS.serif},

  cabecalho:   {alignItems:'center', marginBottom:20, gap:10},
  avatarWrap:  {width:AV, height:AV},
  avatar:      {width:AV, height:AV, borderRadius:AV/2, backgroundColor:COLORS.navbar, alignItems:'center', justifyContent:'center'},
  avatarFoto:  {width:AV, height:AV, borderRadius:AV/2},
  avatarLetra: {color:'#fff', fontSize:36, fontWeight:'700', fontFamily:FONTS.serif},
  cameraOverlay:{position:'absolute', bottom:0, right:0, width:26, height:26, borderRadius:13, backgroundColor:COLORS.primary, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:COLORS.background},
  nomeDisplay: {fontSize:18, fontWeight:'700', color:COLORS.text, fontFamily:FONTS.serif, textAlign:'center'},

  card:    {backgroundColor:COLORS.surface, borderRadius:10, overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.07, shadowRadius:8, elevation:2, marginBottom:20},
  row:     {paddingVertical:14, paddingHorizontal:16, gap:6},
  sep:     {borderBottomWidth:1, borderBottomColor:COLORS.border},
  label:   {fontSize:11, fontWeight:'700', color:COLORS.textSecondary, fontFamily:FONTS.serif, textTransform:'uppercase', letterSpacing:0.5},
  valorRow:{flexDirection:'row', alignItems:'center', justifyContent:'space-between'},
  valor:   {fontSize:16, color:COLORS.text, fontFamily:FONTS.serif, flex:1},

  inputTexto:{fontSize:16, color:COLORS.text, fontFamily:FONTS.serif, borderBottomWidth:1, borderBottomColor:COLORS.borderDark, paddingVertical:4},
  dataRow:   {flexDirection:'row', alignItems:'center', gap:4},
  inputDia:  {width:44, fontSize:16, color:COLORS.text, fontFamily:FONTS.serif, borderBottomWidth:1, borderBottomColor:COLORS.borderDark, paddingVertical:4, textAlign:'center'},
  inputMes:  {width:44, fontSize:16, color:COLORS.text, fontFamily:FONTS.serif, borderBottomWidth:1, borderBottomColor:COLORS.borderDark, paddingVertical:4, textAlign:'center'},
  inputAno:  {width:64, fontSize:16, color:COLORS.text, fontFamily:FONTS.serif, borderBottomWidth:1, borderBottomColor:COLORS.borderDark, paddingVertical:4, textAlign:'center'},
  barra:     {fontSize:18, color:COLORS.textSecondary, fontFamily:FONTS.serif},

  inlineAcoes:     {flexDirection:'row', justifyContent:'flex-end', gap:8, marginTop:6},
  inlineCancelar:  {paddingVertical:5, paddingHorizontal:12, borderRadius:6, borderWidth:1, borderColor:COLORS.borderDark},
  inlineCancelarTxt:{fontSize:13, color:COLORS.text, fontFamily:FONTS.serif, fontWeight:'600'},
  inlineGuardar:   {paddingVertical:5, paddingHorizontal:14, borderRadius:6, backgroundColor:COLORS.navbar},
  inlineGuardarTxt:{fontSize:13, color:'#fff', fontFamily:FONTS.serif, fontWeight:'700'},

  botoesRow:    {flexDirection:'row', gap:10},
  btnCancelar:  {flex:1, borderWidth:1, borderColor:COLORS.borderDark, borderRadius:8, paddingVertical:13, alignItems:'center'},
  btnCancelarTxt:{fontSize:15, fontWeight:'600', color:COLORS.text, fontFamily:FONTS.serif},
  btnGuardar:   {flex:2, backgroundColor:COLORS.navbar, borderRadius:8, paddingVertical:13, alignItems:'center'},
  btnGuardarTxt:{fontSize:15, fontWeight:'700', color:'#fff', fontFamily:FONTS.serif},
  btnEditar:    {backgroundColor:COLORS.navbar, borderRadius:8, paddingVertical:13, alignItems:'center'},
  btnEditarTxt: {fontSize:15, fontWeight:'700', color:'#fff', fontFamily:FONTS.serif},

  segOpcao: {flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:16, gap:12},
  segLabel: {fontSize:15, color:COLORS.text, fontFamily:FONTS.serif, fontWeight:'600'},
  segDesc:  {fontSize:12, color:COLORS.textSecondary, fontFamily:FONTS.serif},
  radio:    {width:22, height:22, borderRadius:11, borderWidth:2, borderColor:COLORS.borderDark, alignItems:'center', justifyContent:'center'},
  radioOn:  {borderColor:COLORS.navbar},
  radioPonto:{width:11, height:11, borderRadius:6, backgroundColor:COLORS.navbar},
});
