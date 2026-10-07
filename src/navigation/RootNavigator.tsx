import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RADIUS } from '../constants/theme';
import NavBar from '../components/NavBar';
import CalendarioScreen from '../screens/CalendarioScreen';
import PesquisaScreen from '../screens/PesquisaScreen';
import CanticosNavigator from './CanticosNavigator';
import CatecismoNavigator from './CatecismoNavigator';
import EuScreen from '../screens/EuScreen';
import MaisNavigator from './MaisNavigator';
import type { RootTabParamList } from './types';
import { useColors } from '../context/ThemeContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconName = keyof typeof Ionicons.glyphMap;

// [inactivo, activo] — o ícone passa a preenchido quando o separador está activo.
const ICONS: Record<keyof RootTabParamList, [IconName, IconName]> = {
  Calendario: ['calendar-outline',            'calendar'],
  Canticos:   ['musical-notes-outline',       'musical-notes'],
  Catecismo:  ['book-outline',                'book'],
  Eu:         ['person-outline',              'person'],
  Pesquisa:   ['search-outline',              'search'],
  Mais:       ['ellipsis-horizontal-outline', 'ellipsis-horizontal'],
};

export default function RootNavigator() {
  const COLORS = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        header: () => (
          <NavBar
            activeTab={route.name}
            onNavigate={(tab) => navigation.navigate(tab as keyof RootTabParamList)}
          />
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: COLORS.border,
          height: 62 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Inter_500Medium' },
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarIcon: ({ color, size, focused }) => (
          <View style={{
            width: 48, height: 30, borderRadius: RADIUS.pill,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: focused ? COLORS.primaryLight : 'transparent',
          }}>
            <Ionicons name={ICONS[route.name as keyof RootTabParamList][focused ? 1 : 0]} size={size} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Calendario" component={CalendarioScreen} options={{ title: 'Calendário' }} />
      <Tab.Screen name="Canticos"   component={CanticosNavigator}  options={{ title: 'Cânticos',  headerShown: false }} />
      <Tab.Screen name="Catecismo"  component={CatecismoNavigator} options={{ title: 'Catecismo', headerShown: false }} />
      <Tab.Screen name="Eu"         component={EuScreen}           options={{ title: 'Eu'        }} />
      <Tab.Screen name="Pesquisa"   component={PesquisaScreen}     options={{ title: 'Pesquisa'  }} />
      <Tab.Screen name="Mais"       component={MaisNavigator}      options={{ title: 'Mais',      headerShown: false }} />
    </Tab.Navigator>
  );
}
