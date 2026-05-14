import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS } from '../constants/theme';
import NavBar from '../components/NavBar';
import CalendarioScreen from '../screens/CalendarioScreen';
import PesquisaScreen from '../screens/PesquisaScreen';
import CanticosNavigator from './CanticosNavigator';
import CatecismoNavigator from './CatecismoNavigator';
import EuScreen from '../screens/EuScreen';
import MaisNavigator from './MaisNavigator';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Calendario: 'calendar-outline',
  Canticos:   'musical-notes-outline',
  Catecismo:  'book-outline',
  Eu:         'person-outline',
  Pesquisa:   'search-outline',
  Mais:       'ellipsis-horizontal-outline',
};

export default function RootNavigator() {
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
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof RootTabParamList]} size={size} color={color} />
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
